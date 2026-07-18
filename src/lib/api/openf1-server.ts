/**
 * Server-side OpenF1 data access for React Server Components and API routes.
 * Redis-backed: checks the shared cache first, fetches from OpenF1 on a miss,
 * and stores the result using the endpoint's cache policy.
 *
 * Server-only — do not import from client components (use useOpenF1 /
 * fetchOpenF1 there, which go through the /api/openf1 proxy).
 */

import type {
  OpenF1Endpoint,
  OpenF1Endpoints,
  OpenF1QueryParams,
} from "@/types/openf1";
import { redisGet, redisSet } from "@/lib/cache/redis";
import { buildQueryString, buildUrl } from "./endpoints";
import {
  buildOpenF1CacheKey,
  getEffectiveCachePolicy,
  getServerCachePolicy,
} from "./cache-policy";

export class OpenF1Error extends Error {
  constructor(message: string, public readonly status: number) {
    super(message);
    this.name = "OpenF1Error";
  }
}

/**
 * Fetch OpenF1 data on the server. Throws OpenF1Error on upstream failure.
 */
export async function getOpenF1<E extends OpenF1Endpoint>(
  endpoint: E,
  params: OpenF1QueryParams = {}
): Promise<OpenF1Endpoints[E][]> {
  const cacheKey = buildOpenF1CacheKey(endpoint, buildQueryString(params));

  const cached = await redisGet<OpenF1Endpoints[E][]>(cacheKey);
  if (cached != null) return cached;

  const response = await fetch(buildUrl(endpoint, params), {
    headers: { Accept: "application/json" },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new OpenF1Error(
      `OpenF1 API error: ${response.status}`,
      response.status
    );
  }

  const data: OpenF1Endpoints[E][] = await response.json();

  const policy = getEffectiveCachePolicy(getServerCachePolicy(endpoint), data);
  await redisSet(cacheKey, data, policy.maxAgeSeconds);

  return data;
}

/**
 * Like getOpenF1 but returns an empty array instead of throwing, so a single
 * failed upstream call degrades to an empty state rather than an error page.
 */
export async function getOpenF1Safe<E extends OpenF1Endpoint>(
  endpoint: E,
  params: OpenF1QueryParams = {}
): Promise<OpenF1Endpoints[E][]> {
  try {
    return await getOpenF1(endpoint, params);
  } catch (error) {
    console.error(`getOpenF1(${endpoint}) failed:`, error);
    return [];
  }
}
