import type {
  OpenF1Endpoint,
  OpenF1Endpoints,
  OpenF1QueryParams,
} from "@/types/openf1";
import { getCached, setCache } from "./cache";
import { buildProxyPath, getEndpointCacheTTL, getEndpointPriority } from "./endpoints";
import { getClientRateLimiter } from "./rate-limiter";

const inFlightRequests = new Map<string, Promise<unknown>>();

function getEndpointFromPath(path: string): OpenF1Endpoint | null {
  const endpoint = path.replace(/^\//, "").split("?")[0] as OpenF1Endpoint;
  return endpoint || null;
}

/**
 * Fetch data from OpenF1 via the local proxy API route.
 * Includes rate limiting, caching, and type safety.
 */
export async function fetchOpenF1<E extends OpenF1Endpoint>(
  endpoint: E,
  params: OpenF1QueryParams = {},
  options?: { skipCache?: boolean; signal?: AbortSignal }
): Promise<OpenF1Endpoints[E][]> {
  const path = buildProxyPath(endpoint, params);
  const cacheKey = `openf1:${path}`;

  // Check cache first
  if (!options?.skipCache) {
    const cached = getCached<OpenF1Endpoints[E][]>(cacheKey);
    if (cached) return cached;
  }

  // Rate limit
  const rateLimiter = getClientRateLimiter();
  const priority = getEndpointPriority(endpoint);
  await rateLimiter.acquire(priority);

  // Fetch from proxy
  const response = await fetch(`/api/openf1${path}`, {
    signal: options?.signal,
  });

  if (!response.ok) {
    throw new Error(
      `OpenF1 API error: ${response.status} ${response.statusText}`
    );
  }

  const data: OpenF1Endpoints[E][] = await response.json();

  // Cache the result
  const { ttl, persist } = getEndpointCacheTTL(endpoint);
  setCache(cacheKey, data, ttl, persist);

  return data;
}

/**
 * SWR-compatible fetcher that goes through the proxy.
 * The key format is: /endpoint?param=value
 */
export async function openf1Fetcher<T>(path: string): Promise<T> {
  const cacheKey = `openf1:${path}`;
  const endpoint = getEndpointFromPath(path);

  if (endpoint) {
    const cached = getCached<T>(cacheKey);
    if (cached) return cached;
  }

  const inFlight = inFlightRequests.get(cacheKey) as Promise<T> | undefined;
  if (inFlight) return inFlight;

  const rateLimiter = getClientRateLimiter();
  const priority = endpoint ? getEndpointPriority(endpoint) : 1;

  const request = (async () => {
    await rateLimiter.acquire(priority);

    const response = await fetch(`/api/openf1${path}`);
    if (!response.ok) {
      throw new Error(
        `OpenF1 API error: ${response.status} ${response.statusText}`
      );
    }

    const data = (await response.json()) as T;

    if (endpoint) {
      const { ttl, persist } = getEndpointCacheTTL(endpoint);
      setCache(cacheKey, data, ttl, persist);
    }

    return data;
  })();

  inFlightRequests.set(cacheKey, request);

  try {
    return await request;
  } finally {
    inFlightRequests.delete(cacheKey);
  }
}
