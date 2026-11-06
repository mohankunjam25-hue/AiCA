import { Worker, Job } from 'bullmq';
import { Redis } from 'ioredis';
import mongoose from 'mongoose';
import { Judge0Service } from '../services/judge0.service.js';
import { TestEvaluatorService } from '../services/test-evaluator.js';
import { executeSuiteInSandbox } from '../services/local-runner.service.js';
import { ScoringService } from '../services/scoring.service.js';
import { AiEvaluatorService, AiEvaluationContext } from '../services/ai-evaluator.service.js';
import { aiAnalysisQueue } from './ai-analysis.worker.js';
import { GeminiAnalysisClient } from '@aica/ai-engine';
import { PipelineStatus, Verdict, SupportedLanguage, AIAnalysisStatus, sanitizeRedisUrl } from '@aica/shared';

function getRedisUrl(): string {
  return sanitizeRedisUrl(process.env.REDIS_URL);
}

function getRedisOptions(): any {
  const url = getRedisUrl();
  const isRedisTls = url.startsWith('rediss://');
  return {
    maxRetriesPerRequest: null,
    lazyConnect: true,
    connectTimeout: 4000,
    retryStrategy(times: number) {
      if (times > 3) return null;
      return Math.min(times * 300, 1000);
    },
    ...(isRedisTls ? { tls: { rejectUnauthorized: false } } : {})
  };
}

function createSafeRedis(url: string, opts: any): Redis {
  try {
    return new Redis(url, opts);
  } catch (err: any) {
    console.warn('[SubmissionWorker] Warning: Error initializing Redis URL, falling back safely:', err.message);
    return new Redis('redis://localhost:6379', { ...opts, lazyConnect: true });
  }
}

let redisPublisherInstance: Redis | null = null;
function getRedisPublisher(): Redis {
  if (!redisPublisherInstance) {
    redisPublisherInstance = createSafeRedis(getRedisUrl(), getRedisOptions());
    redisPublisherInstance.on('error', (err) => {
      console.warn('[SubmissionWorker] Redis publisher warning (deferred):', err.message);
    });
    redisPublisherInstance.connect().catch(() => {});
  }
  return redisPublisherInstance;
}

const judge0 = new Judge0Service();
const aiClient = new GeminiAnalysisClient();
const aiEvaluator = new AiEvaluatorService(aiClient);

// Helper to publish live SSE progress events
async function publishProgress(
  submissionId: string,
  pipelineStatus: PipelineStatus,
  verdict: Verdict,
  step: number,
  totalSteps = 4,
  extra: Record<string, any> = {}
) {
  try {
    const payload = JSON.stringify({
      submissionId,
      pipelineStatus,
      verdict,
      step,
      totalSteps,
      ...extra
    });
    await getRedisPublisher().publish(`submission:${submissionId}`, payload);
  } catch (err: any) {
    console.warn('[SubmissionWorker] PubSub publish error:', err.message);
  }
}

export function startSubmissionWorker(): Worker {
  const redisUrl = getRedisUrl();
  const redisOpts = getRedisOptions();
  const connection = createSafeRedis(redisUrl, redisOpts);

  connection.on('error', (err) => {
    console.warn('[SubmissionWorker] Redis connection warning (deferred):', err.message);
  });

  connection.connect().catch(() => {});

  const worker = new Worker(
    'submission-queue',
    async (job: Job) => {
      const { submissionId, problemId, userId, username, language, languageId, code, isTestRun } = job.data;
      console.log(`[SubmissionWorker] Processing submission ${submissionId} (Language: ${language})`);

      const db = mongoose.connection;
      const submissionsCol = db.collection('submissions');
      const problemsCol = db.collection('problems');
      const reportsCol = db.collection('evaluation_reports');

      try {
        // Step 1: Compiling Stage
        await publishProgress(submissionId, 'COMPILING', 'PENDING', 1, 4);
        await submissionsCol.updateOne(
          { _id: new mongoose.Types.ObjectId(submissionId) },
          { $set: { pipelineStatus: 'COMPILING' } }
        );

        // Fetch problem and test suite
        const problem = await problemsCol.findOne({ _id: new mongoose.Types.ObjectId(problemId) });
        if (!problem) {
          throw new Error(`Problem ${problemId} not found`);
        }

        // For test runs (Run Code), only evaluate public test cases; for official submits, evaluate all
        const testCases = (problem.testCases || []).filter((tc: any) => (isTestRun ? tc.isPublic === true : true));

        // Step 2: Executing Tests Stage
        await publishProgress(submissionId, 'EXECUTING', 'PENDING', 2, 4);
        await submissionsCol.updateOne(
          { _id: new mongoose.Types.ObjectId(submissionId) },
          { $set: { pipelineStatus: 'EXECUTING' } }
        );

        // Determine language-specific time limit multiplier
        const langMultiplier =
          language === 'python'
            ? (problem.benchmarks?.pythonMultiplier || 4.0)
            : language === 'javascript'
            ? (problem.benchmarks?.jsMultiplier || 2.5)
            : language === 'java'
            ? (problem.benchmarks?.javaMultiplier || 2.0)
            : (problem.benchmarks?.cppMultiplier || 1.0);

        const scaledTimeLimitMs = Math.round((problem.timeLimitMs || 2000) * langMultiplier);

        let outcome;
        const useRemoteJudge0 = process.env.USE_REMOTE_JUDGE0 === 'true';

        if (useRemoteJudge0) {
          const isHealthy = await judge0.checkHealth();
          if (isHealthy) {
            const batchInputs = testCases.map((tc: any, idx: number) => ({
              testCaseId: tc.id || `tc-${idx + 1}`,
              index: idx + 1,
              isPublic: Boolean(tc.isPublic),
              sourceCode: code,
              languageId: languageId || 71,
              stdin: tc.input || '',
              expectedOutput: tc.expectedOutput || '',
              cpuTimeLimit: scaledTimeLimitMs,
              memoryLimit: problem.memoryLimitKb
            }));

            const submittedTokens = await judge0.submitBatch(batchInputs);
            const tokenList = submittedTokens.map((t) => t.token);
            const judge0Results = await judge0.pollBatchResults(tokenList);
            const tokenMappings = submittedTokens.map((t, idx) => ({
              ...t,
              expectedOutput: testCases[idx].expectedOutput
            }));
            outcome = TestEvaluatorService.evaluateBatch(tokenMappings, judge0Results);
          }
        }

        // Primary Local REA Linux Sandbox Pipeline:
        // - Single compilation for C++/Java
        // - Sequential & short-circuit execution on failure (LeetCode standard)
        // - Real-time SSE progress events
        // - Zero-leakage hidden test masking
        if (!outcome) {
          outcome = await executeSuiteInSandbox({
            language: language as SupportedLanguage,
            code,
            testCases: testCases.map((tc: any, idx: number) => ({
              id: tc.id || `tc-${idx + 1}`,
              index: idx + 1,
              isPublic: Boolean(tc.isPublic),
              stdin: tc.input || '',
              expectedOutput: tc.expectedOutput || ''
            })),
            timeoutMs: scaledTimeLimitMs,
            memoryLimitKb: problem.memoryLimitKb || 262144,
            shortCircuitOnFailure: !isTestRun,
            onProgress: async ({ current, total }) => {
              await publishProgress(submissionId, 'EXECUTING', 'PENDING', 2, 4, {
                currentTest: current,
                totalTests: total,
                message: `Running test case ${current} of ${total}...`
              });
            }
          });
        }

        // STAGE 1: Deterministic Evaluation & Verdict Finalization (P0 Isolation)
        // Correctness verdict is strictly computed deterministically from test cases
        const initialScoring = ScoringService.calculate({
          verdict: outcome.verdict,
          passedCount: outcome.passedCount,
          totalCount: outcome.totalCount,
          language: language as SupportedLanguage,
          executionTimeMs: outcome.maxExecutionTimeMs,
          memoryUsedKb: outcome.maxMemoryKb,
          aiQualityScore: 7.0, // Neutral baseline until AI finishes
          targetTimeMs: problem.benchmarks?.targetTimeMs || 15,
          timeLimitMs: problem.timeLimitMs,
          memoryLimitKb: problem.memoryLimitKb
        });

        const initialAiStatus: AIAnalysisStatus =
          outcome.verdict === 'COMPILATION_ERROR' ? 'SKIPPED' : 'PENDING';
        const initialAiSummary =
          outcome.verdict === 'COMPILATION_ERROR'
            ? 'Compilation failed. AI analysis bypassed.'
            : 'Deterministic evaluation complete. AI analysis pending.';

        // 1. Persist Initial Evaluation Report Document in MongoDB FIRST
        const reportInsert = await reportsCol.insertOne({
          submissionId,
          userId,
          username,
          problemId,
          verdict: outcome.verdict,
          pipelineStatus: 'COMPLETED',
          summary: `Evaluated ${outcome.totalCount} test cases. Verdict: ${outcome.verdict}.`,
          aiAnalysis: {
            status: initialAiStatus,
            mode: outcome.verdict === 'ACCEPTED' ? 'OPTIMIZATION' : 'DIAGNOSTIC',
            codeSummary: initialAiSummary,
            theoreticalComplexity: { timeComplexity: 'N/A', spaceComplexity: 'N/A', explanation: '' },
            codeQuality: {
              score: outcome.verdict === 'COMPILATION_ERROR' ? 1.0 : 7.0,
              readabilityAnalysis: '',
              codeSmells: [],
              positivePractices: []
            },
            optimizationSuggestions: [],
            generatedAt: new Date().toISOString()
          },
          metrics: {
            rawTimeMs: outcome.maxExecutionTimeMs,
            normalizedTimeMs: initialScoring.normalizedTimeMs,
            rawMemoryKb: outcome.maxMemoryKb,
            normalizedMemoryKb: initialScoring.normalizedMemoryKb,
            compositeScore: initialScoring.compositeScore,
            percentileTime: 85,
            percentileMemory: 80
          },
          createdAt: new Date().toISOString()
        });

        const reportId = reportInsert.insertedId.toString();

        // 2. PERSIST DETERMINISTIC VERDICT TO SUBMISSION DOCUMENT IMMEDIATELY (BEFORE ANY REDIS/AI OPERATIONS)
        // Invariant: verdict is now permanently locked in MongoDB and can NEVER be overwritten by Redis or AI failures
        await submissionsCol.updateOne(
          { _id: new mongoose.Types.ObjectId(submissionId) },
          {
            $set: {
              pipelineStatus: 'COMPLETED',
              verdict: outcome.verdict,
              executionTimeMs: outcome.maxExecutionTimeMs,
              memoryUsedKb: outcome.maxMemoryKb,
              normalizedTimeMs: initialScoring.normalizedTimeMs,
              compositeScore: initialScoring.compositeScore,
              compileOutput: outcome.compileOutput,
              testCasesTotal: outcome.totalCount,
              testCasesPassed: outcome.passedCount,
              testResults: outcome.testResults,
              evaluationReportId: reportId,
              aiStatus: initialAiStatus,
              leaderboardSyncPending: false,
              updatedAt: new Date()
            }
          }
        );

        console.log(
          `[SubmissionWorker] Deterministic verdict locked for ${submissionId}: ${outcome.verdict} (Passed: ${outcome.passedCount}/${outcome.totalCount})`
        );

        // 2b. Atomically increment problem submission counters (fault-tolerant)
        if (!isTestRun) {
          try {
            const probQuery = mongoose.Types.ObjectId.isValid(problemId)
              ? { _id: new mongoose.Types.ObjectId(problemId) }
              : { slug: problemId };
            await problemsCol.updateOne(probQuery, {
              $inc: {
                totalSubmissions: 1,
                ...(outcome.verdict === 'ACCEPTED' ? { acceptedSubmissions: 1 } : {})
              }
            });
          } catch (probIncErr: any) {
            console.warn(`[SubmissionWorker] Problem counter increment warning for problem ${problemId}:`, probIncErr.message);
          }
        }

        // 3. Update Leaderboard in Redis (Fault-tolerant; executed strictly AFTER MongoDB persistence)
        if (outcome.verdict === 'ACCEPTED' && !isTestRun) {
          try {
            const zsetKey = `leaderboard:problem:${problemId}`;
            await getRedisPublisher().zadd(zsetKey, initialScoring.compositeScore, submissionId);
          } catch (redisErr: any) {
            console.warn(`[SubmissionWorker] Leaderboard Redis update failed for submission ${submissionId}:`, redisErr.message);
            // Leaderboard Redis failure must NEVER fail the submission evaluation or alter verdict!
            try {
              await submissionsCol.updateOne(
                { _id: new mongoose.Types.ObjectId(submissionId) },
                { $set: { leaderboardSyncPending: true } }
              );
            } catch {}
          }
        }

        // STAGE 2: Decoupled & Isolated AI Analysis Execution
        if (outcome.verdict === 'COMPILATION_ERROR') {
          await publishProgress(submissionId, 'COMPLETED', outcome.verdict, 4, 4, {
            reportId,
            compositeScore: initialScoring.compositeScore,
            aiStatus: 'SKIPPED'
          });
        } else {
          await publishProgress(submissionId, 'ANALYZING_AI', outcome.verdict, 3, 4, {
            reportId,
            compositeScore: initialScoring.compositeScore,
            aiStatus: 'PENDING'
          });

          const aiContext: AiEvaluationContext = {
            submissionId,
            problemId,
            userId,
            username,
            language,
            code,
            verdict: outcome.verdict,
            executionTimeMs: outcome.maxExecutionTimeMs,
            memoryUsedKb: outcome.maxMemoryKb,
            passedCount: outcome.passedCount,
            totalCount: outcome.totalCount,
            compileOutput: outcome.compileOutput,
            isTestRun
          };

          const runInline =
            process.env.INLINE_AI === 'true' || process.env.NODE_ENV === 'test';

          if (runInline) {
            try {
              await aiEvaluator.evaluateSubmissionAi(aiContext, {
                db,
                publishProgress: publishProgress as any,
                redisPublisher: getRedisPublisher(),
                timeoutMs: 15000
              });
            } catch (inlineErr: any) {
              console.warn('[SubmissionWorker] Inline AI evaluation trapped error:', inlineErr.message);
            }
          } else {
            try {
              await aiAnalysisQueue.add('analyze-submission-ai', aiContext, {
                jobId: `ai-analysis-${submissionId}`,
                attempts: 3,
                backoff: { type: 'exponential', delay: 2000 },
                removeOnComplete: 100,
                removeOnFail: 500
              });
            } catch (queueErr: any) {
              console.warn('[SubmissionWorker] Queue dispatch failed, falling back to safe inline evaluation:', queueErr.message);
              try {
                await aiEvaluator.evaluateSubmissionAi(aiContext, {
                  db,
                  publishProgress: publishProgress as any,
                  redisPublisher: getRedisPublisher(),
                  timeoutMs: 15000
                });
              } catch (fallbackErr: any) {
                console.warn('[SubmissionWorker] Fallback inline AI evaluation trapped error:', fallbackErr.message);
              }
            }
          }
        }
      } catch (err: any) {
        console.error(`[SubmissionWorker] Error in submission execution for ${submissionId}:`, err.message);

        // SAFETY GUARD: Check if deterministic verdict was already established
        const currentSub = await submissionsCol.findOne({
          _id: new mongoose.Types.ObjectId(submissionId)
        });
        const existingVerdict = currentSub?.verdict;
        const hasDeterministicVerdict = existingVerdict && existingVerdict !== 'PENDING';
        const safeVerdict = hasDeterministicVerdict ? existingVerdict : 'INTERNAL_ERROR';

        await submissionsCol.updateOne(
          { _id: new mongoose.Types.ObjectId(submissionId) },
          {
            $set: {
              pipelineStatus: hasDeterministicVerdict ? 'COMPLETED' : 'FAILED',
              verdict: safeVerdict,
              updatedAt: new Date()
            }
          }
        );
        await publishProgress(
          submissionId,
          hasDeterministicVerdict ? 'COMPLETED' : 'FAILED',
          safeVerdict,
          4,
          4,
          { error: err.message }
        );
      }
    },
    { connection, concurrency: 5 }
  );

  return worker;
}
