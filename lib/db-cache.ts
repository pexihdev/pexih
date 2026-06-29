import { eq, sql } from "drizzle-orm";
import { db } from "./db"; // Sesuaikan dengan instance drizzle database Anda
import { cache } from "../app/_applet/db/schema"; // Sesuaikan path schema
import { Redis } from "@upstash/redis";

// Inisialisasi Upstash Redis secara aman di tingkat server
let redis: Redis | null = null;
const url = process.env.UPSTASH_REDIS_REST_URL;
const token = process.env.UPSTASH_REDIS_REST_TOKEN;

if (url && token) {
  try {
    redis = new Redis({
      url,
      token,
    });
    console.log("🚀 Connected to Upstash Redis safely via REST SDK in Next.js frontend!");
  } catch (error) {
    console.error("❌ Failed to initialize Upstash Redis in Next.js frontend:", error);
  }
} else {
  console.warn("⚠️ Upstash Redis credentials not detected in Next.js frontend. Caching falls back to Neon PostgreSQL.");
}

/**
 * Menyimpan data ke dalam tabel cache di PostgreSQL (sebagai pengganti KV Cloudflare) atau ke Upstash Redis jika tersedia
 */
export async function setCache(key: string, value: any, ttlSeconds?: number) {
  if (redis) {
    try {
      const serialized = typeof value === 'object' ? JSON.stringify(value) : value;
      if (ttlSeconds) {
        await redis.set(key, serialized, { ex: ttlSeconds });
      } else {
        await redis.set(key, serialized);
      }
      return;
    } catch (e) {
      console.error(`Error writing key ${key} to Upstash Redis:`, e);
      // fallback ke database apabila Redis mengalami kegagalan
    }
  }

  // Fallback / standard database caching:
  const expiresAt = ttlSeconds ? new Date(Date.now() + ttlSeconds * 1000) : null;
  
  await db.insert(cache)
    .values({
      key,
      value: JSON.stringify(value),
      expiresAt: expiresAt,
    })
    .onConflictDoUpdate({
      target: cache.key,
      set: {
        value: JSON.stringify(value),
        expiresAt: expiresAt,
        createdAt: new Date(),
      },
    });
}

/**
 * Mengambil data dari tabel cache atau Upstash Redis apabila tersedia
 */
export async function getCache<T>(key: string): Promise<T | null> {
  if (redis) {
    try {
      const data = await redis.get(key);
      if (data !== null && data !== undefined) {
        if (typeof data === 'string') {
          try {
            return JSON.parse(data) as T;
          } catch {
            return data as any;
          }
        }
        return data as T;
      }
    } catch (e) {
      console.error(`Error reading key ${key} from Upstash Redis:`, e);
      // fallback ke database jika terjadi error pada Redis
    }
  }

  // Fallback ke database cache
  const result = await db.select().from(cache).where(eq(cache.key, key)).limit(1);
  
  if (result.length === 0) return null;
  
  const record = result[0];
  
  // Jika expiresAt ada dan sudah lewat masanya, maka cache kadaluarsa
  if (record.expiresAt && record.expiresAt < new Date()) {
    // Jalankan penghapusan di background agar tidak memblokir
    db.delete(cache).where(eq(cache.key, key)).execute().catch(console.error);
    return null;
  }
  
  return (typeof record.value === "string" ? JSON.parse(record.value) : record.value) as T | null;
}

/**
 * Menghapus cache spesifik dari Redis dan database
 */
export async function deleteCache(key: string) {
  if (redis) {
    try {
      await redis.del(key);
    } catch (e) {
      console.error(`Error deleting key ${key} from Upstash Redis:`, e);
    }
  }
  await db.delete(cache).where(eq(cache.key, key));
}

/**
 * Membersihkan semua cache yang sudah expired di database
 */
export async function pruneExpiredCache() {
  await db.delete(cache).where(sql`${cache.expiresAt} < NOW()`);
}

