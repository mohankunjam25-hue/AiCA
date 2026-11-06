import { Worker, Job, Queue } from 'bullmq';
import { Redis } from 'ioredis';
import mongoose from 'mongoose';
import { AiEvaluatorService, AiEvaluationContext } from '../services/ai-evaluator.service.js';
import { GeminiAnalysisClient } from '@aica/ai-engine';
import { PipelineStatus, Verdict, sanitizeRedisUrl } from '@aica/shared';

const redisUrl = sanitizeRedisUrl(process.env.REDIS_URL);
const isRedisTls = redisUrl.startsWith('rediss://');
const redisOptions = {
  maxRetriesPerRequest: null,
  lazyConnect: true,
  connectTimeout: 4000,
  retryStrategy(times: number) {
    if (times > 3) return null;
    return Math.min(times * 300, 1000);
  },
  ...(isRedisTls ? { tls: { rejectUnauthorized: false } } : {})
};

function createSafeRedis(url: string, opts: any): Redis {
  try {
    return new Redis(url, opts);
  } catch (err: any) {
    console.warn('[AiAnalysisWorker] Redis fallback warning:', err.message);
    return new Redis('redis://localhost:6379', { ...opts, lazyConnect: true });
  }
}

const redisPublisher = createSafeRedis(redisUrl, redisOptions);
const aiEvaluator = new AiEvaluatorService(new GeminiAnalysisClient());

export const aiAnalysisQueue = new Queue('ai-analysis-queue', {
  connection: createSafeRedis(redisUrl, redisOptions)
});

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
    await redisPublisher.publish(`submission:${submissionId}`, payload);
  } catch (err: any) {
    console.warn('[AiAnalysisWorker] PubSub publish error:', err.message);
  }
}

export function startAiAnalysisWorker(): Worker {
  const connection = createSafeRedis(redisUrl, {
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
    lazyConnect: true,
    connectTimeout: 4000,
    retryStrategy(times: number) {
      if (times > 3) return null;
      return Math.min(times * 300, 1000);
    },
    ...(isRedisTls ? { tls: { rejectUnauthorized: false } } : {})
  });

  connection.on('error', (err) => {
    console.warn('[AiAnalysisWorker] Redis connection warning:', err.message);
  });

  connection.connect().catch(() => {});
  redisPublisher.connect().catch(() => {});

  const worker = new Worker(
    'ai-analysis-queue',
    async (job: Job) => {
      const data = job.data as AiEvaluationContext;
      console.log(`[AiAnalysisWorker] Processing AI analysis for submission ${data.submissionId} (Verdict: ${data.verdict})`);

      try {
        const result = await aiEvaluator.evaluateSubmissionAi(data, {
          db: mongoose.connection,
          publishProgress: publishProgress as any,
          redisPublisher,
          timeoutMs: 15000
        });

        console.log(`[AiAnalysisWorker] Finished AI analysis for ${data.submissionId}: Status=${result.aiStatus}`);
        return result;
      } catch (err: any) {
        console.error(`[AiAnalysisWorker] Error processing AI job for ${data.submissionId}:`, err.message);
        // Note: deterministic verdict is never altered
        const db = mongoose.connection;
        const submissionsCol = db.collection('submissions');
        await submissionsCol.updateOne(
          { _id: new mongoose.Types.ObjectId(data.submissionId) },
          { $set: { aiStatus: 'FAILED', aiError: err.message, updatedAt: new Date() } }
        );
        throw err;
      }
    },
    { connection, concurrency: 3 }
  );

  return worker;
}
