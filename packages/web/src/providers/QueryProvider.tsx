'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 2 * 60 * 1000,   // data is fresh for 2 min
            gcTime: 10 * 60 * 1000,     // keep in cache for 10 min
            retry: 1,
            refetchOnWindowFocus: false, // avoid unnecessary refetches on tab switch
            refetchOnReconnect: true,    // refetch when network comes back
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}
