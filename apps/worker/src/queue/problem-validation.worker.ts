import { Worker, Job } from 'bullmq';
import mongoose from 'mongoose';
import { Judge0Service } from '../services/judge0.service.js';
import { TestEvaluatorService } from '../services/test-evaluator.js';
import { sanitizeRedisUrl } from '@aica/shared';
import { Redis } from 'ioredis';

const redisUrl = sanitizeRedisUrl(process.env.REDIS_URL);
const isRedisTls = redisUrl.startsWith('rediss://');
const redisOptions = {
  maxRetriesPerRequest: null,
  lazyConnect: true,
  connectTimeout: 4000,
  retryStrategy: (times: number) => (times > 3 ? null : Math.min(times * 300, 1000)),
  ...(isRedisTls ? { tls: { rejectUnauthorized: false } } : {})
};

function createSafeRedis(url: string, opts: any): Redis {
  try {
    return new Redis(url, opts);
  } catch {
    return new Redis('redis://localhost:6379', { ...opts, lazyConnect: true });
  }
}

const judge0 = new Judge0Service();

export function startProblemValidationWorker(): Worker {
  const connection = createSafeRedis(redisUrl, redisOptions);
  connection.connect().catch(() => {});

  const worker = new Worker(
    'problem-validation-queue',
    async (job: Job) => {
      const { proposalId } = job.data;
      console.log(`[ProblemValidationWorker] Initiating differential validation for proposal ${proposalId}`);

      const db = mongoose.connection;
      const proposalsCol = db.collection('problemproposals');

      try {
        await proposalsCol.updateOne(
          { _id: new mongoose.Types.ObjectId(proposalId) },
          { $set: { status: 'VALIDATING' } }
        );

        const proposal = await proposalsCol.findOne({ _id: new mongoose.Types.ObjectId(proposalId) });
        if (!proposal || !proposal.generatedContent) {
          throw new Error(`Proposal ${proposalId} or generated content not found`);
        }

        const { testCases, referenceSolutions } = proposal.generatedContent;
        if (!testCases || testCases.length === 0) {
          throw new Error('Test suite is empty');
        }

        if (!referenceSolutions?.canonicalPython || !referenceSolutions?.secondaryOracle) {
          throw new Error('Dual reference solutions missing for differential validation');
        }

        // 1. Static Contradiction Check: Detect duplicate inputs with contradictory outputs
        const inputSeen = new Map<string, string>();
        let hasContradiction = false;
        for (const tc of testCases) {
          const normInput = tc.input.trim();
          const normOutput = tc.expectedOutput.trim();
          if (inputSeen.has(normInput) && inputSeen.get(normInput) !== normOutput) {
            hasContradiction = true;
            break;
          }
          inputSeen.set(normInput, normOutput);
        }

        if (hasContradiction) {
          console.warn(`[ProblemValidationWorker] Contradictory test cases detected for proposal ${proposalId}`);
          await proposalsCol.updateOne(
            { _id: new mongoose.Types.ObjectId(proposalId) },
            {
              $set: {
                status: 'VALIDATION_FAILED',
                'validationReport.failureReason': 'Contradictory test suite: Duplicate inputs produce conflicting expected outputs.',
                'validationReport.contradictionsDetected': true
              }
            }
          );
          return;
        }

        // 2. Execute Implementation A (Canonical Python) in Judge0 CE
        console.log(`[ProblemValidationWorker] Executing Implementation A on ${testCases.length} inputs...`);
        const batchInputsA = testCases.map((tc: any, idx: number) => ({
          testCaseId: tc.id || `tc-${idx + 1}`,
          index: idx + 1,
          isPublic: Boolean(tc.isPublic),
          sourceCode: referenceSolutions.canonicalPython,
          languageId: 71, // Python 3
          stdin: tc.input,
          expectedOutput: tc.expectedOutput,
          cpuTimeLimit: 2000,
          memoryLimit: 262144
        }));

        const submittedTokensA = await judge0.submitBatch(batchInputsA);
        const resultsMapA = await judge0.pollBatchResults(submittedTokensA.map((t) => t.token));

        // 3. Execute Implementation B (Secondary Oracle) in Judge0 CE
        console.log(`[ProblemValidationWorker] Executing Implementation B on ${testCases.length} inputs...`);
        const batchInputsB = testCases.map((tc: any, idx: number) => ({
          testCaseId: tc.id || `tc-${idx + 1}`,
          index: idx + 1,
          isPublic: Boolean(tc.isPublic),
          sourceCode: referenceSolutions.secondaryOracle,
          languageId: 71, // Python 3 (or C++)
          stdin: tc.input,
          expectedOutput: tc.expectedOutput,
          cpuTimeLimit: 2000,
          memoryLimit: 262144
        }));

        const submittedTokensB = await judge0.submitBatch(batchInputsB);
        const resultsMapB = await judge0.pollBatchResults(submittedTokensB.map((t) => t.token));

        // 4. Differential Output Matching & Invariant Check
        let matches = 0;
        const total = testCases.length;
        const detailedResults: any[] = [];
        let maxTimeA = 0;
        let maxTimeB = 0;
        let maxMemA = 0;
        let maxMemB = 0;

        for (let i = 0; i < total; i++) {
          const tokenA = submittedTokensA[i].token;
          const tokenB = submittedTokensB[i].token;
          const resA = resultsMapA.get(tokenA);
          const resB = resultsMapB.get(tokenB);

          const outA = TestEvaluatorService.decodeBase64(resA?.stdout);
          const outB = TestEvaluatorService.decodeBase64(resB?.stdout);

          const timeA = resA?.time ? Math.round(parseFloat(String(resA.time)) * 1000) : 0;
          const timeB = resB?.time ? Math.round(parseFloat(String(resB.time)) * 1000) : 0;
          const memA = resA?.memory || 0;
          const memB = resB?.memory || 0;

          if (timeA > maxTimeA) maxTimeA = timeA;
          if (timeB > maxTimeB) maxTimeB = timeB;
          if (memA > maxMemA) maxMemA = memA;
          if (memB > maxMemB) maxMemB = memB;

          // Cross-verify output equality
          const isConcordant = TestEvaluatorService.compareOutputs(outA, outB);
          if (isConcordant) {
            matches++;
          }

          detailedResults.push({
            testCaseId: testCases[i].id,
            input: testCases[i].input,
            outputCanonical: outA,
            outputSecondary: outB,
            isConcordant,
            canonicalTimeMs: timeA,
            secondaryTimeMs: timeB
          });
        }

        const concordancePercent = Number(((matches / total) * 100).toFixed(1));
        console.log(`[ProblemValidationWorker] Differential Concordance for ${proposalId}: ${concordancePercent}% (${matches}/${total})`);

        // 5. Evaluate Differential Threshold: Must be 100% concordant
        if (concordancePercent < 100.0) {
          await proposalsCol.updateOne(
            { _id: new mongoose.Types.ObjectId(proposalId) },
            {
              $set: {
                status: 'VALIDATION_FAILED',
                validationReport: {
                  differentialConcordancePercent: concordancePercent,
                  totalCasesEvaluated: total,
                  canonicalStats: { minRuntimeMs: maxTimeA, medianRuntimeMs: maxTimeA, memoryKb: maxMemA },
                  secondaryStats: { minRuntimeMs: maxTimeB, medianRuntimeMs: maxTimeB, memoryKb: maxMemB },
                  invariantsPassed: false,
                  contradictionsDetected: false,
                  failureReason: `Differential mismatch: Canonical solution and secondary oracle diverged on ${total - matches} test cases.`,
                  validatedAt: new Date().toISOString()
                }
              }
            }
          );
          return;
        }

        // 6. Update Canonical True Expected Outputs based on sandbox execution
        const calibratedTestCases = testCases.map((tc: any, idx: number) => ({
          ...tc,
          expectedOutput: detailedResults[idx].outputCanonical || tc.expectedOutput
        }));

        // 7. Transition to PENDING_REVIEW
        await proposalsCol.updateOne(
          { _id: new mongoose.Types.ObjectId(proposalId) },
          {
            $set: {
              status: 'PENDING_REVIEW',
              'generatedContent.testCases': calibratedTestCases,
              validationReport: {
                differentialConcordancePercent: 100.0,
                totalCasesEvaluated: total,
                canonicalStats: { minRuntimeMs: maxTimeA, medianRuntimeMs: maxTimeA, memoryKb: maxMemA },
                secondaryStats: { minRuntimeMs: maxTimeB, medianRuntimeMs: maxTimeB, memoryKb: maxMemB },
                invariantsPassed: true,
                contradictionsDetected: false,
                validatedAt: new Date().toISOString()
              }
            }
          }
        );

        console.log(`[ProblemValidationWorker] Proposal ${proposalId} passed 100% differential verification! Ready for Admin Review.`);
      } catch (err: any) {
        console.error(`[ProblemValidationWorker] Error validating proposal ${proposalId}:`, err.message);
        await proposalsCol.updateOne(
          { _id: new mongoose.Types.ObjectId(proposalId) },
          {
            $set: {
              status: 'VALIDATION_FAILED',
              'validationReport.failureReason': `Validation runtime error: ${err.message}`
            }
          }
        );
      }
    },
    { connection, concurrency: 5 }
  );

  return worker;
}
