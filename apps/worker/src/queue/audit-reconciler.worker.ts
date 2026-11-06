import { Worker, Job } from 'bullmq';
import mongoose from 'mongoose';
import pg from 'pg';
import { sanitizeRedisUrl, sanitizeDatabaseUrl } from '@aica/shared';
import { Redis } from 'ioredis';

const { Pool } = pg;
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

const rawDbUrl = sanitizeDatabaseUrl(process.env.DATABASE_URL);
const pgPool = new Pool(
  rawDbUrl
    ? {
        connectionString: rawDbUrl,
        ssl: rawDbUrl.includes('sslmode=require') ? { rejectUnauthorized: false } : false,
        max: 5,
        connectionTimeoutMillis: 5000
      }
    : {
        host: process.env.POSTGRES_HOST || 'localhost',
        port: parseInt(process.env.POSTGRES_PORT || '5432', 10),
        user: process.env.POSTGRES_USER || 'postgres',
        password: process.env.POSTGRES_PASSWORD || 'postgres',
        database: process.env.POSTGRES_DB || 'aica_lab',
        max: 5,
        connectionTimeoutMillis: 5000
      }
);

export function startAuditReconcilerWorker(): Worker {
  const connection = createSafeRedis(redisUrl, redisOptions);
  connection.connect().catch(() => {});

  const worker = new Worker(
    'publication-outbox-queue',
    async (job: Job) => {
      const { outboxId } = job.data;
      console.log(`[AuditReconciler] Processing outbox record ${outboxId}`);

      const db = mongoose.connection;
      const outboxCol = db.collection('publicationoutboxes');

      try {
        const outboxRecord = await outboxCol.findOne({ _id: new mongoose.Types.ObjectId(outboxId) });
        if (!outboxRecord || outboxRecord.status === 'DISPATCHED') {
          return;
        }

        const { payload } = outboxRecord;

        // Write audit log into PostgreSQL SSOT
        await pgPool.query(
          `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, ip_address, created_at)
           VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)`,
          [
            payload.adminUserId || null,
            'PROBLEM_PUBLISHED',
            'PROBLEM',
            payload.problemId,
            'internal-worker'
          ]
        );

        // Mark outbox record as dispatched
        await outboxCol.updateOne(
          { _id: new mongoose.Types.ObjectId(outboxId) },
          {
            $set: {
              status: 'DISPATCHED',
              updatedAt: new Date()
            }
          }
        );

        console.log(`[AuditReconciler] Successfully synced PostgreSQL audit log for problem ${payload.problemId}`);
      } catch (err: any) {
        console.error(`[AuditReconciler] Failed to sync audit log for ${outboxId}:`, err.message);
        await outboxCol.updateOne(
          { _id: new mongoose.Types.ObjectId(outboxId) },
          {
            $inc: { retryCount: 1 },
            $set: { lastError: err.message, status: 'FAILED' }
          }
        );
        throw err; // Trigger BullMQ retry with exponential backoff
      }
    },
    { connection, concurrency: 2 }
  );

  return worker;
}
