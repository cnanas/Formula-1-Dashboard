import useSWR from "swr";
import { useMemo } from "react";
import type {
  OpenF1Endpoint,
  OpenF1Endpoints,
  OpenF1QueryParams,
} from "@/types/openf1";
import { buildProxyPath } from "@/lib/api/endpoints";
import { getEndpointCacheTTL } from "@/lib/api/endpoints";
import { getCached } from "@/lib/api/cache";
import { openf1Fetcher } from "@/lib/api/openf1-client";

interface UseOpenF1Options {
  /** Disable the request entirely */
  enabled?: boolean;
  /** SWR polling interval in ms (0 = no polling) */
  refreshInterval?: number;
}

/**
 * Generic hook for fetching OpenF1 data with SWR.
 * Returns typed data based on the endpoint.
 */
export function useOpenF1<E extends OpenF1Endpoint>(
  endpoint: E,
  params: OpenF1QueryParams = {},
  options: UseOpenF1Options = {}
) {
  const { enabled = true, refreshInterval = 0 } = options;
  const path = buildProxyPath(endpoint, params);
  const cacheKey = `openf1:${path}`;
  const { ttl } = getEndpointCacheTTL(endpoint);
  const cachedData = useMemo(
    () => getCached<OpenF1Endpoints[E][]>(cacheKey),
    [cacheKey]
  );
  const dedupingInterval =
    refreshInterval > 0
      ? Math.max(500, Math.min(ttl, refreshInterval - 100))
      : ttl;

  const { data, error, isLoading, mutate } = useSWR<OpenF1Endpoints[E][]>(
    enabled ? path : null,
    openf1Fetcher,
    {
      fallbackData: cachedData ?? undefined,
      refreshInterval,
      dedupingInterval,
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      // Always revalidate when the key changes - the deduping interval
      // will prevent excessive requests for the same key
      revalidateIfStale: true,
      revalidateOnMount: true,
      // Don't keep previous data when key changes - show loading state instead
      // This prevents stale data from a different query being shown
      keepPreviousData: false,
    }
  );

  return {
    data: data ?? [],
    error,
    isLoading,
    mutate,
  };
}
