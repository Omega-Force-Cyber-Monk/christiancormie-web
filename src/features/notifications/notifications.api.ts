import { z } from "zod";
import type { RootState } from "@/app/store";
import { baseApi } from "@/services/api/baseApi";
import {
  scopeMatches,
  scopedRead,
  sessionDenied,
  sessionFlight,
  type SessionScope,
} from "@/services/api/sessionGuard";
import { invalidContract } from "@/services/api/validatedQuery";
import {
  notificationSchema,
  notificationListSchema,
  notificationFiltersSchema,
} from "./notifications.schema";
export function notificationsAllowed(state: RootState, scope: SessionScope) {
  return (
    (scope.role === "CUSTOMER" || scope.role === "VENDOR") &&
    z.uuid().safeParse(scope.userId).success &&
    scopeMatches(state, scope)
  );
}
const tags = ["Notifications", "UnreadCount"] as const;
type Filters = z.infer<typeof notificationFiltersSchema>;
export const notificationsApi = baseApi.injectEndpoints({
  endpoints: (b) => ({
    getNotifications: b.query<
      z.infer<typeof notificationListSchema>,
      SessionScope & { filters: Filters }
    >({
      keepUnusedDataFor: 0,
      queryFn: (s, a, _e, q) => {
        if (!notificationsAllowed(a.getState() as RootState, s)) return sessionDenied;
        const filters = notificationFiltersSchema.safeParse(s.filters);
        if (!filters.success) return invalidContract;
        return scopedRead(
          a,
          s,
          q,
          { url: "/notifications", params: filters.data },
          notificationListSchema.refine(
            (items) =>
              items.length <= s.filters.limit &&
              items.every(
                (n) => n.userId === s.userId && (!s.filters.unreadOnly || !n.isRead),
              ),
          ),
        );
      },
      providesTags: ["Notifications"],
    }),
    getNotificationUnreadCount: b.query<{ unreadCount: number }, SessionScope>({
      keepUnusedDataFor: 0,
      queryFn: (s, a, _e, q) =>
        notificationsAllowed(a.getState() as RootState, s)
          ? scopedRead(
              a,
              s,
              q,
              { url: "/notifications/unread-count" },
              z.object({ unreadCount: z.number().int().nonnegative() }),
            )
          : sessionDenied,
      providesTags: ["UnreadCount"],
    }),
    readNotification: b.mutation<
      z.infer<typeof notificationSchema>,
      SessionScope & { notificationId: string }
    >({
      queryFn: (s, a, _e, q) => {
        if (!notificationsAllowed(a.getState() as RootState, s)) return sessionDenied;
        if (!z.uuid().safeParse(s.notificationId).success) return invalidContract;
        return sessionFlight(a, s, "notification-read", async () => {
          const result = await scopedRead(
            a,
            s,
            q,
            { url: `/notifications/${s.notificationId}/read`, method: "PATCH" },
            notificationSchema.refine(
              (n) => n.id === s.notificationId && n.userId === s.userId && n.isRead,
            ),
          );
          if (notificationsAllowed(a.getState() as RootState, s))
            a.dispatch(baseApi.util.invalidateTags([...tags]));
          return result;
        });
      },
    }),
    readAllNotifications: b.mutation<{ updatedCount: number }, SessionScope>({
      queryFn: (s, a, _e, q) => {
        if (!notificationsAllowed(a.getState() as RootState, s)) return sessionDenied;
        return sessionFlight(a, s, "notification-read", async () => {
          const result = await scopedRead(
            a,
            s,
            q,
            { url: "/notifications/read-all", method: "PATCH" },
            z.object({ updatedCount: z.number().int().nonnegative() }),
          );
          if (notificationsAllowed(a.getState() as RootState, s))
            a.dispatch(baseApi.util.invalidateTags([...tags]));
          return result;
        });
      },
    }),
  }),
});
export const {
  useGetNotificationsQuery,
  useGetNotificationUnreadCountQuery,
  useReadNotificationMutation,
  useReadAllNotificationsMutation,
} = notificationsApi;
