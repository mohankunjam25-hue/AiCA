import pg from 'pg';
import mongoose from 'mongoose';
import { Redis } from 'ioredis';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { POSTGRES_SCHEMA_SQL } from '../models/postgres/schema.js';
import { sanitizeMongoUri } from '@aica/shared';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load root .env first, then local .env if present
const rootEnvConfig = dotenv.config({ path: path.resolve(__dirname, '../../../../.env') });
// A blank exported variable should not mask a usable key saved in the root .env.
if (!process.env.OPENAI_API_KEY?.trim() && rootEnvConfig.parsed?.OPENAI_API_KEY?.trim()) {
  process.env.OPENAI_API_KEY = rootEnvConfig.parsed.OPENAI_API_KEY.trim();
}
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });
dotenv.config();

// PostgreSQL Connection Pool
const { Pool } = pg;
const isProd = process.env.NODE_ENV === 'production';
const rawDbUrl = process.env.DATABASE_URL?.trim();
const hasDatabaseUrl = Boolean(rawDbUrl);

export const pgPool = new Pool(
  hasDatabaseUrl
    ? {
        connectionString: rawDbUrl,
        ssl: isProd || rawDbUrl?.includes('sslmode=require')
          ? { rejectUnauthorized: false }
          : false,
        max: 20,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 5000,
        keepAlive: true,
        keepAliveInitialDelayMillis: 10000
      }
    : {
        host: process.env.POSTGRES_HOST || 'localhost',
        port: parseInt(process.env.POSTGRES_PORT || '5432', 10),
        user: process.env.POSTGRES_USER || 'postgres',
        password: process.env.POSTGRES_PASSWORD || 'postgres',
        database: process.env.POSTGRES_DB || 'aica_lab',
        max: 20,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 5000,
        keepAlive: true,
        keepAliveInitialDelayMillis: 10000
      }
);

// Redis Client Configuration with URL auto-sanitization & safe initialization
function sanitizeRedisUrl(value?: string): string {
  const candidate = value?.trim().replace(/^['"]|['"]$/g, '');
  if (!candidate) return 'redis://localhost:6379';

  try {
    const url = new URL(candidate);
    if (url.protocol === 'redis:' || url.protocol === 'rediss:') {
      return url.toString();
    }
  } catch {
    // Fall back to the local Redis instance for malformed URLs.
  }

  console.warn('[Redis] Warning: Invalid Redis URL; using localhost.');
  return 'redis://localhost:6379';
}

const redisUrl = sanitizeRedisUrl(process.env.REDIS_URL);
const isRedisTls = redisUrl.startsWith('rediss://');
const redisOptions = {
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
  lazyConnect: true,
  connectTimeout: 4000,
  keepAlive: 10000,
  retryStrategy(times: number) {
    if (times > 3) return null; // stop reconnecting after 3 failed tries if offline
    return Math.min(times * 300, 1000);
  },
  ...(isRedisTls ? { tls: { rejectUnauthorized: false } } : {})
};

function createSafeRedis(url: string, opts: any): Redis {
  try {
    return new Redis(url, opts);
  } catch (err: any) {
    console.warn('[Redis] Warning: Error initializing Redis URL, falling back safely:', err.message);
    return new Redis('redis://localhost:6379', { ...opts, lazyConnect: true });
  }
}

export const redisClient = createSafeRedis(redisUrl, redisOptions);
export const redisSubscriber = createSafeRedis(redisUrl, redisOptions);

// Prevent unhandled error event crashes
redisClient.on('error', (err) => {
  console.warn('[Redis] Client connection warning (deferred):', err.message);
});
redisSubscriber.on('error', (err) => {
  console.warn('[Redis] Subscriber connection warning (deferred):', err.message);
});

// Database Initialization Helper
export async function initializeDatabases(): Promise<void> {
  // 1. Connect to PostgreSQL and apply migrations
  try {
    const client = await pgPool.connect();
    console.log('[PostgreSQL] Connected successfully to database.');
    
    await client.query(POSTGRES_SCHEMA_SQL);
    console.log('[PostgreSQL] Database migrations verified and applied.');
    client.release();
  } catch (err: any) {
    console.warn('[PostgreSQL] Warning: Connection deferred or offline:', err.message);
  }

  // 2. Connect to MongoDB with sanitized URI
  try {
    const mongoUri = sanitizeMongoUri(process.env.MONGODB_URI);
    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      heartbeatFrequencyMS: 10000
    });
    console.log('[MongoDB] Connected successfully to Mongoose store.');

    // Auto-seed problem catalog if empty
    try {
      const { ProblemModel } = await import('../models/mongodb/problem.model.js');
      const count = await ProblemModel.countDocuments();
      if (count === 0) {
        console.log('[AutoSeed] Problem catalog is empty. Auto-seeding default benchmark problems...');
        const { runSeed } = await import('../scripts/seed.js');
        await runSeed();
      }
    } catch (seedErr: any) {
      console.warn('[AutoSeed] Auto-seed warning:', seedErr.message);
    }
  } catch (err: any) {
    console.warn('[MongoDB] Warning: Connection deferred or offline:', err.message);
  }

  // 3. Connect to Redis safely with timeout
  try {
    const connectPromise = Promise.all([
      redisClient.connect(),
      redisSubscriber.connect()
    ]);
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Redis connection timed out after 4s')), 4000)
    );
    await Promise.race([connectPromise, timeoutPromise]);
    console.log('[Redis] Connected successfully to Redis broker.');
  } catch (err: any) {
    console.warn('[Redis] Warning: Redis connection deferred or offline:', err.message);
  }
}
