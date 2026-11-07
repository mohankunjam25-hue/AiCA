import { redisClient } from '../config/db.js';

export class CacheService {
  /**
   * Safe GET from Redis. Returns null if Redis is offline, disconnected, or key missing.
   */
  static async get<T>(key: string): Promise<T | null> {
    try {
      if (redisClient.status !== 'ready') return null;
      const data = await redisClient.get(key);
      return data ? (JSON.parse(data) as T) : null;
    } catch (err: any) {
      console.warn(`[CacheService] Safe GET failed for "${key}":`, err.message);
      return null;
    }
  }

  /**
   * Safe SET in Redis with TTL in seconds.
   */
  static async set(key: string, value: any, ttlSeconds: number): Promise<void> {
    try {
      if (redisClient.status !== 'ready') return;
      await redisClient.set(key, JSON.stringify(value), 'EX', ttlSeconds);
    } catch (err: any) {
      console.warn(`[CacheService] Safe SET failed for "${key}":`, err.message);
    }
  }

  /**
   * Safe DEL single or multiple keys.
   */
  static async del(...keys: string[]): Promise<void> {
    try {
      if (redisClient.status !== 'ready' || keys.length === 0) return;
      await redisClient.del(...keys);
    } catch (err: any) {
      console.warn(`[CacheService] Safe DEL failed:`, err.message);
    }
  }

  /**
   * Invalidate all keys matching a wildcard pattern (e.g. "cache:problems:*").
   */
  static async invalidatePattern(pattern: string): Promise<void> {
    try {
      if (redisClient.status !== 'ready') return;
      const keys = await redisClient.keys(pattern);
      if (keys.length > 0) {
        await redisClient.del(...keys);
      }
    } catch (err: any) {
      console.warn(`[CacheService] Invalidate pattern failed for "${pattern}":`, err.message);
    }
  }
}
