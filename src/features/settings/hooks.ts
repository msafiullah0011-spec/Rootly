import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { endpoints } from '@/api/endpoints';
import { get, patch } from '@/api/http';
import { queryKeys } from '@/api/query-keys';
import { settingsSchema, type AppSettings } from '@/api/schemas';

export function useSettings() {
  return useQuery({
    queryKey: queryKeys.settings.detail(),
    queryFn: ({ signal }) => get(endpoints.settings.get, { schema: settingsSchema, signal }),
  });
}

export function useUpdateSettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: Partial<AppSettings>) =>
      patch(endpoints.settings.update, input, { schema: settingsSchema }),
    onSuccess: (settings) => {
      queryClient.setQueryData(queryKeys.settings.detail(), settings);
    },
  });
}
