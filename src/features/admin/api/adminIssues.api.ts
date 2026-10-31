import { z } from "zod";
import type { RootState } from "@/app/store";
import { adminApi } from "./admin.api";
import { baseApi } from "@/services/api/baseApi";
import {
  scopedRead,
  scopeMatches,
  sessionDenied,
  sessionFlight,
  type SessionScope,
} from "@/services/api/sessionGuard";
import { invalidContract } from "@/services/api/validatedQuery";
import {
  bookingIssuesSchema,
  bookingIssueThreadSchema,
  sentBookingIssueMessageSchema,
  issueMessageInputSchema,
} from "@/features/customer/schemas/bookingIssues.schema";
export type AdminIssueBooking = SessionScope & { bookingId: string };
export type AdminIssueSelection = AdminIssueBooking & { issueId: string };
export function adminIssueAllowed(state: RootState, s: AdminIssueBooking) {
  return (
    s.role === "ADMIN" &&
    z.uuid().safeParse(s.userId).success &&
    z.uuid().safeParse(s.bookingId).success &&
    scopeMatches(state, s)
  );
}
const unique = (items: { id: string }[]) =>
  new Set(items.map((i) => i.id)).size === items.length;
export const adminIssuesApi = adminApi.injectEndpoints({
  endpoints: (b) => ({
    getAdminBookingIssues: b.query<
      z.infer<typeof bookingIssuesSchema>,
      AdminIssueBooking
    >({
      keepUnusedDataFor: 0,
      queryFn: (s, a, _e, q) =>
        adminIssueAllowed(a.getState() as RootState, s)
          ? scopedRead(
              a,
              s,
              q,
              { url: `/bookings/${s.bookingId}/issues` },
              bookingIssuesSchema.refine(
                (r) =>
                  unique(r.items) &&
                  r.items.every(
                    (i) => i.bookingId === s.bookingId && unique(i.messages),
                  ),
              ),
            )
          : sessionDenied,
      providesTags: (_r, _e, s) => [{ type: "AdminBookingIssues", id: s.bookingId }],
    }),
    getAdminIssueMessages: b.query<
      z.infer<typeof bookingIssueThreadSchema>,
      AdminIssueSelection
    >({
      keepUnusedDataFor: 0,
      queryFn: (s, a, _e, q) =>
        adminIssueAllowed(a.getState() as RootState, s) &&
        z.uuid().safeParse(s.issueId).success
          ? scopedRead(
              a,
              s,
              q,
              { url: `/bookings/${s.bookingId}/issues/${s.issueId}/messages` },
              bookingIssueThreadSchema.refine(
                (r) =>
                  r.issue.id === s.issueId &&
                  r.issue.bookingId === s.bookingId &&
                  unique(r.messages),
              ),
            )
          : sessionDenied,
      providesTags: (_r, _e, s) => [{ type: "AdminIssueMessages", id: s.issueId }],
    }),
    sendAdminIssueMessage: b.mutation<
      z.infer<typeof sentBookingIssueMessageSchema>,
      AdminIssueSelection & { body: { message: string }; confirmed: boolean }
    >({
      queryFn: (s, a, _e, q) => {
        if (
          !adminIssueAllowed(a.getState() as RootState, s) ||
          !z.uuid().safeParse(s.issueId).success ||
          s.confirmed !== true
        )
          return sessionDenied;
        const body = issueMessageInputSchema.safeParse(s.body);
        if (!body.success) return invalidContract;
        const state = a.getState() as RootState;
        const bookingScope = {
          sessionId: s.sessionId,
          userId: s.userId,
          role: s.role,
          bookingId: s.bookingId,
        };
        const thread = adminIssuesApi.endpoints.getAdminIssueMessages.select({
          ...bookingScope,
          issueId: s.issueId,
        })(state);
        const issues =
          adminIssuesApi.endpoints.getAdminBookingIssues.select(bookingScope)(state);
        if (
          !thread.isSuccess ||
          !issues.isSuccess ||
          thread.error ||
          issues.error ||
          thread.data?.issue.status !== "OPEN" ||
          !issues.data?.items.some(
            (i) =>
              i.id === s.issueId && i.bookingId === s.bookingId && i.status === "OPEN",
          )
        )
          return sessionDenied;
        return sessionFlight(a, s, `admin-issue:${s.bookingId}`, async () => {
          const result = await scopedRead(
            a,
            s,
            q,
            {
              url: `/bookings/${s.bookingId}/issues/${s.issueId}/messages`,
              method: "POST",
              body: body.data,
            },
            sentBookingIssueMessageSchema.refine(
              (r) =>
                r.item.senderRole === "ADMIN" &&
                r.item.senderUserId === s.userId &&
                r.item.message === body.data.message,
            ),
          );
          if (adminIssueAllowed(a.getState() as RootState, s))
            a.dispatch(
              baseApi.util.invalidateTags([
                { type: "AdminBookingIssues", id: s.bookingId },
                { type: "AdminIssueMessages", id: s.issueId },
                "AdminBookings",
                "AdminPayments",
                "AdminDashboard",
                "Notifications",
                "UnreadCount",
              ]),
            );
          return result;
        });
      },
    }),
  }),
});
export const {
  useGetAdminBookingIssuesQuery,
  useGetAdminIssueMessagesQuery,
  useSendAdminIssueMessageMutation,
} = adminIssuesApi;
