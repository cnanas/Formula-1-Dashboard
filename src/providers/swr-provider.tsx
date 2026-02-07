"use client";

import { SWRConfig } from "swr";

export function SWRProvider({ children }: { children: React.ReactNode }) {
  return (
    <SWRConfig
      value={{
        revalidateOnFocus: false,
        revalidateOnReconnect: false,
        dedupingInterval: 10_000,
        focusThrottleInterval: 60_000,
        errorRetryCount: 3,
        errorRetryInterval: 5000,
        keepPreviousData: true,
        refreshWhenHidden: false,
        refreshWhenOffline: false,
        fetcher: (url: string) => fetch(url).then((r) => r.json()),
      }}
    >
      {children}
    </SWRConfig>
  );
}
