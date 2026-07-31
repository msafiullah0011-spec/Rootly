import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { queryKeys } from '@/api/query-keys';
import { askAssistant, autoRoot, dismissSuggestion, fetchSuggestions } from './api';

export function useSuggestions() {
  return useQuery({
    queryKey: queryKeys.assistant.suggestions(),
    queryFn: ({ signal }) => fetchSuggestions(signal),
  });
}

export function useDismissSuggestion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (suggestionId: string) => dismissSuggestion(suggestionId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.assistant.all });
      void queryClient.invalidateQueries({ queryKey: queryKeys.home.all });
    },
  });
}

/**
 * Ask is a mutation rather than a query: each question is a distinct action,
 * and answers shouldn't be served from cache when the user asks again.
 */
export function useAsk() {
  return useMutation({
    mutationFn: (question: string) => askAssistant(question),
    // The screen renders the failure inline under the composer.
    meta: { silent: true },
  });
}

export function useAutoRoot() {
  return useMutation({
    mutationFn: (url: string) => autoRoot(url),
    meta: { silent: true },
  });
}
