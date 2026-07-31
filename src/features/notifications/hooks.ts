import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';

import { endpoints } from '@/api/endpoints';
import { get, post } from '@/api/http';
import { queryKeys } from '@/api/query-keys';
import { notificationListSchema, type AppNotification } from '@/api/schemas';

export function useNotifications() {
  return useQuery({
    queryKey: queryKeys.notifications.list(),
    queryFn: ({ signal }) =>
      get(endpoints.notifications.list, { schema: notificationListSchema, signal }),
  });
}

/** Count of unread alerts, for a badge on the bell. */
export function useUnreadCount(): number {
  const { data } = useNotifications();
  return (data ?? []).filter((notification) => !notification.read).length;
}

export function useMarkAllRead() {
  const queryClient = useQueryClient();
  const listKey = queryKeys.notifications.list();

  return useMutation({
    mutationFn: () =>
      post(endpoints.notifications.markAllRead, {}, { schema: notificationListSchema }),
    meta: { silent: true },

    // Marking read is trivially reversible, so it flips instantly and rolls
    // back on failure rather than making the user wait on a round trip.
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: listKey });
      const previous = queryClient.getQueryData<AppNotification[]>(listKey);
      queryClient.setQueryData<AppNotification[]>(listKey, (items) =>
        (items ?? []).map((item) => ({ ...item, read: true })),
      );
      return { previous };
    },

    onError: (_error, _vars, context) => {
      if (context?.previous) queryClient.setQueryData(listKey, context.previous);
    },

    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: listKey });
    },
  });
}

export function useMarkRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (notificationId: string) =>
      post(endpoints.notifications.markRead(notificationId), {}, { schema: z.unknown() }),
    meta: { silent: true },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all });
    },
  });
}
