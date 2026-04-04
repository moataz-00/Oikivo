'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30 * 1000,        // data is fresh for 30 s
            gcTime: 5 * 60 * 1000,       // keep in cache for 5 min
            retry: 1,
            refetchOnWindowFocus: true,   // refetch when tab regains focus
            refetchOnReconnect: true,     // refetch when network comes back
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
