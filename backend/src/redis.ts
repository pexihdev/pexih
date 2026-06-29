import { Redis } from '@upstash/redis';

let redis: Redis | null = null;
const fallbackStore = new Map<string, any>();

const url = process.env.UPSTASH_REDIS_REST_URL;
const token = process.env.UPSTASH_REDIS_REST_TOKEN;

if (!url || !token) {
  console.warn('⚠️ Upstash Redis configuration missing! Caching falls back to local in-memory storage.');
} else {
  try {
    redis = new Redis({ url, token });
    console.log('🚀 Connected to Upstash Redis securely via REST SDK (Express version)!');
  } catch (e) {
    console.error('❌ Failed to initialize Upstash Redis connection:', e);
  }
}

export const redisService = {
  getClient() {
    return redis;
  },

  async get<T>(key: string): Promise<T | null> {
    if (!redis) {
      const fallbackVal = fallbackStore.get(key);
      if (fallbackVal) {
        const { expiry, data } = fallbackVal;
        if (expiry && expiry < Date.now()) {
          fallbackStore.delete(key);
          return null;
        }
        return data as T;
      }
      return null;
    }

    try {
      const data = await redis.get(key);
      if (data === null || data === undefined) return null;
      if (typeof data === 'string') {
        try {
          return JSON.parse(data) as T;
        } catch {
          return data as any;
        }
      }
      return data as T;
    } catch (e) {
      console.error(`Error reading key ${key} from Redis:`, e);
      return null;
    }
  },

  async set(key: string, value: any, ttlSeconds: number = 3600): Promise<void> {
    if (!redis) {
      fallbackStore.set(key, {
        expiry: Date.now() + (ttlSeconds * 1000),
        data: value
      });
      return;
    }

    try {
      const serialized = typeof value === 'object' ? JSON.stringify(value) : value;
      await redis.set(key, serialized, { ex: ttlSeconds });
    } catch (e) {
      console.error(`Error writing key ${key} to Redis:`, e);
    }
  },

  async del(key: string): Promise<void> {
    if (!redis) {
      fallbackStore.delete(key);
      return;
    }

    try {
      await redis.del(key);
    } catch (e) {
      console.error(`Error deleting key ${key} from Redis:`, e);
    }
  },

  async incr(key: string): Promise<number> {
    if (!redis) {
      const fallbackVal = fallbackStore.get(key) || { data: 0 };
      const val = Number(fallbackVal.data) + 1;
      fallbackStore.set(key, { ...fallbackVal, data: val, expiry: fallbackVal.expiry || (Date.now() + 3600000) });
      return val;
    }
    try {
      return await redis.incr(key);
    } catch (e) {
      console.error(`Error incrementing key ${key}:`, e);
      return 1;
    }
  },

  async expire(key: string, ttlSeconds: number): Promise<void> {
    if (!redis) {
      const fallbackVal = fallbackStore.get(key);
      if (fallbackVal) {
        fallbackStore.set(key, { ...fallbackVal, expiry: Date.now() + (ttlSeconds * 1000) });
      }
      return;
    }
    try {
      await redis.expire(key, ttlSeconds);
    } catch (e) {
      console.error(`Error expiring key ${key}:`, e);
    }
  },

  async hincrby(key: string, field: string, increment: number): Promise<number> {
    if (!redis) {
      let hash = fallbackStore.get(key)?.data;
      if (!hash || typeof hash !== 'object') hash = {};
      const current = Number(hash[field]) || 0;
      hash[field] = current + increment;
      fallbackStore.set(key, { data: hash, expiry: Date.now() + 86400000 });
      return hash[field];
    }
    try {
      return await redis.hincrby(key, field, increment);
    } catch (e) {
      console.error(`Error hincrby key ${key} field ${field}:`, e);
      return increment;
    }
  },

  async hgetall(key: string): Promise<Record<string, number> | null> {
    if (!redis) {
      const hash = fallbackStore.get(key)?.data;
      return typeof hash === 'object' ? hash : null;
    }
    try {
      return await redis.hgetall(key);
    } catch (e) {
      console.error(`Error hgetall key ${key}:`, e);
      return null;
    }
  },

  async delPattern(pattern: string): Promise<void> {
    if (!redis) {
      const cleanPattern = pattern.replace('*', '');
      for (const k of Array.from(fallbackStore.keys())) {
        if (k.includes(cleanPattern)) {
          fallbackStore.delete(k);
        }
      }
      return;
    }

    try {
      const keys = await redis.keys(pattern);
      if (keys && keys.length > 0) {
        await redis.del(...keys);
      }
    } catch (e) {
      console.error(`Error deleting pattern ${pattern} from Redis:`, e);
    }
  }
};
