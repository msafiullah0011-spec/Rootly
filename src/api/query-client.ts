import { MutationCache, QueryCache, QueryClient } from '@tanstack/react-query';

import { logger } from '@/lib/logger';
import { ApiError, isAuthError, isRetryable, toToastMessage } from './errors';

/**
 * Global TanStack Query configuration.
 *
 * Two rules that matter:
 *  - Only retry what `isRetryable` allows. Retrying a 404 or a 422 just delays
 *    the error the user needs to see.
 *  - Mutation failures surface as a toast automatically, so no screen has to
 *    remember to handle the unhappy path. A mutation opts out with
 *    `meta: { silent: true }` when it renders its own inline error.
 */

type ToastFn = (message: string, tone: 'error' | 'success') => void;
type UnauthenticatedFn = () => void;

let showToast: ToastFn = () => {};
let onUnauthenticated: UnauthenticatedFn = () => {};

/** Wired up by the root layout once the stores exist. */
export function configureQueryFeedback(options: {
  showToast: ToastFn;
  onUnauthenticated: UnauthenticatedFn;
}) {
  showToast = options.showToast;
  onUnauthenticated = options.onUnauthenticated;
}

function handleError(error: unknown, source: 'query' | 'mutation', silent: boolean) {
  const apiError = error instanceof ApiError ? error : ApiError.from(error);

  if (apiError.kind === 'cancelled') return;

  logger.error(
    `${source} failed: ${apiError.kind}${apiError.status ? ` (${apiError.status})` : ''} — ${apiError.message}`,
    apiError.request,
  );

  if (isAuthError(apiError)) {
    onUnauthenticated();
    return;
  }

  if (!silent) showToast(toToastMessage(apiError), 'error');
}

export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Queries render their own error UI via QueryBoundary, so they stay
        // quiet here — a toast on top of an error state is noise.
        retry: (failureCount, error) => failureCount < 2 && isRetryable(error),
        retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 8000),
        staleTime: 30_000,
        gcTime: 5 * 60_000,
        refetchOnWindowFocus: false,
        refetchOnReconnect: true,
      },
      mutations: {
        retry: false,
      },
    },

    queryCache: new QueryCache({
      onError: (error, query) => {
        // Background refetches of already-rendered data have no error UI of
        // their own, so those do get a toast.
        const hasData = query.state.data !== undefined;
        handleError(error, 'query', !hasData);
      },
    }),

    mutationCache: new MutationCache({
      onError: (error, _vars, _ctx, mutation) => {
        const silent = mutation.meta?.silent === true;
        handleError(error, 'mutation', silent);
      },
    }),
  });
}
