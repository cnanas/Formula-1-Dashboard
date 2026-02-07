/**
 * Server-side Redis cache via Upstash.
 * Only used when UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN are set.
 * Otherwise get() returns null and set() is a no-op (app works without Redis).
 */

import { Redis } from "@upstash/redis";

const PREFIX = "f1dash:";

function getClient(): Redis | null {
  const url =
    process.env.UPSTASH_REDIS_REST_URL ?? process.env.KV_REST_API_URL;
  const token =
    process.env.UPSTASH_REDIS_REST_TOKEN ?? process.env.KV_REST_API_TOKEN;
  if (!url || !token) return null;
  return new Redis({ url, token });
}

/**
 * Get a cached value. Returns null if missing, expired, or Redis not configured.
 */
export async function redisGet<T>(key: string): Promise<T | null> {
  const redis = getClient();
  if (!redis) return null;
  try {
    const raw = await redis.get<string>(PREFIX + key);
    if (raw == null) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

/**
 * Set a cached value with TTL in seconds.
 */
export async function redisSet(
  key: string,
  value: unknown,
  ttlSeconds: number
): Promise<void> {
  const redis = getClient();
  if (!redis) return;
  try {
    const serialized =
      typeof value === "string" ? value : JSON.stringify(value);
    await redis.set(PREFIX + key, serialized, { ex: ttlSeconds });
  } catch {
    // Ignore Redis errors (e.g. rate limit, connection)
  }
}

export function isRedisConfigured(): boolean {
  const url =
    process.env.UPSTASH_REDIS_REST_URL ?? process.env.KV_REST_API_URL;
  const token =
    process.env.UPSTASH_REDIS_REST_TOKEN ?? process.env.KV_REST_API_TOKEN;
  return !!(url && token);
}
