import { QueryClient } from '@tanstack/react-query';
import { ApiError } from '@/lib/api-error';

/** Retry network and server errors (e.g. a sleeping API waking up), never 4xx. */
const shouldRetry = (failureCount: number, error: unknown) => {
  const status = error instanceof ApiError ? error.status : 0;
  return (status === 0 || status >= 500) && failureCount < 2;
};

export function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60_000,
        gcTime: 10 * 60_000,
        retry: shouldRetry,
        refetchOnWindowFocus: false,
      },
      mutations: { retry: false },
    },
  });
}
