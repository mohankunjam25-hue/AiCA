import { Worker, Job, Queue } from 'bullmq';
import mongoose from 'mongoose';
import { GeminiAnalysisClient } from '@aica/ai-engine';
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

const aiClient = new GeminiAnalysisClient();

// Producer for validation queue
const validationQueue = new Queue('problem-validation-queue', {
  connection: createSafeRedis(redisUrl, redisOptions)
});

export function startProblemGenerationWorker(): Worker {
  const connection = createSafeRedis(redisUrl, redisOptions);
  connection.connect().catch(() => {});

  const worker = new Worker(
    'problem-generation-queue',
    async (job: Job) => {
      const { proposalId, prompt, clarifications } = job.data;
      console.log(`[ProblemGenWorker] Processing proposal ${proposalId}`);

      const db = mongoose.connection;
      const proposalsCol = db.collection('problemproposals');

      try {
        await proposalsCol.updateOne(
          { _id: new mongoose.Types.ObjectId(proposalId) },
          { $set: { status: 'AI_ANALYZING' } }
        );

        // 1. Check for missing constraints / ambiguity unless clarifications were already provided
        if (!clarifications || Object.keys(clarifications).length === 0) {
          const clarificationCheck = await aiClient.analyzeClarification(prompt);

          if (!clarificationCheck.isClearAndComplete && clarificationCheck.clarifications.length > 0) {
            console.log(`[ProblemGenWorker] Proposal ${proposalId} requires clarification (${clarificationCheck.clarifications.length} questions)`);
            await proposalsCol.updateOne(
              { _id: new mongoose.Types.ObjectId(proposalId) },
              {
                $set: {
                  status: 'AWAITING_CLARIFICATION',
                  clarifications: clarificationCheck.clarifications
                }
              }
            );
            return;
          }
        }

        // 2. Generate full problem specification & dual reference solutions
        console.log(`[ProblemGenWorker] Generating problem specification for ${proposalId}...`);
        const generated = await aiClient.generateProblemMaterials(prompt, clarifications);

        await proposalsCol.updateOne(
          { _id: new mongoose.Types.ObjectId(proposalId) },
          {
            $set: {
              status: 'GENERATED',
              generatedContent: generated
            }
          }
        );

        // 3. Dispatch to Validation Queue
        await validationQueue.add(
          'validate-differential',
          {
            proposalId,
            testSuiteCount: generated.testCases.length
          },
          {
            attempts: 2,
            backoff: { type: 'exponential', delay: 1500 },
            removeOnComplete: 100,
            removeOnFail: 500
          }
        );

        await proposalsCol.updateOne(
          { _id: new mongoose.Types.ObjectId(proposalId) },
          { $set: { status: 'QUEUED_FOR_VALIDATION' } }
        );

        console.log(`[ProblemGenWorker] Proposal ${proposalId} queued for sandbox validation.`);
      } catch (err: any) {
        console.error(`[ProblemGenWorker] Error generating proposal ${proposalId}:`, err.message);
        await proposalsCol.updateOne(
          { _id: new mongoose.Types.ObjectId(proposalId) },
          {
            $set: {
              status: 'VALIDATION_FAILED',
              'validationReport.failureReason': `Generation error: ${err.message}`
            }
          }
        );
      }
    },
    { connection, concurrency: 3 }
  );

  return worker;
}
