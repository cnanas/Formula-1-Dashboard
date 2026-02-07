import useSWR from "swr";
import type {
  OpenF1Endpoint,
  OpenF1Endpoints,
  OpenF1QueryParams,
} from "@/types/openf1";
import { buildProxyPath } from "@/lib/api/endpoints";
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

  const { data, error, isLoading, mutate } = useSWR<OpenF1Endpoints[E][]>(
    enabled ? path : null,
    openf1Fetcher,
    {
      refreshInterval,
      revalidateOnFocus: false,
    }
  );

  return {
    data: data ?? [],
    error,
    isLoading,
    mutate,
  };
}
