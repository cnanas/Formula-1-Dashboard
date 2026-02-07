"use client";

import { SWRConfig } from "swr";

export function SWRProvider({ children }: { children: React.ReactNode }) {
  return (
    <SWRConfig
      value={{
        revalidateOnFocus: false,
        dedupingInterval: 2000,
        errorRetryCount: 3,
        errorRetryInterval: 5000,
        fetcher: (url: string) => fetch(url).then((r) => r.json()),
      }}
    >
      {children}
    </SWRConfig>
  );
}
