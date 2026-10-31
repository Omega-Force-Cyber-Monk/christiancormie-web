import { z } from "zod";
import type { FetchBaseQueryError, QueryReturnValue } from "@reduxjs/toolkit/query";
import type { RootState } from "@/app/store";
import { baseApi } from "@/services/api/baseApi";
import {
  scopedRead,
  scopeMatches,
  sessionDenied,
  sessionFlight,
  type QueryContext,
} from "@/services/api/sessionGuard";
import { invalidContract } from "@/services/api/validatedQuery";
import { bookingsApi, type BookingSelection } from "./bookings.api";
import {
  bookingIssuesSchema,
  bookingIssueThreadSchema,
  createdBookingIssueSchema,
  sentBookingIssueMessageSchema,
  issueMessageInputSchema,
  canCreateBookingIssue,
  type BookingIssues,
  type BookingIssueThread,
  type CreatedBookingIssue,
  type SentBookingIssueMessage,
} from "../schemas/bookingIssues.schema";

export type IssueSelection = BookingSelection & { issueId: string };
export type IssueWrite = BookingSelection & {
  body: { message: string };
  confirmed: true;
};
export type IssueMessageWrite = IssueSelection & { body: { message: string } };
function owner(state: RootState, s: BookingSelection) {
  const detail = bookingsApi.endpoints.getCustomerBooking.select({
    sessionId: s.sessionId,
    userId: s.userId,
    role: s.role,
    bookingId: s.bookingId,
  })(state);
  return s.role === "CUSTOMER" &&
    z.uuid().safeParse(s.bookingId).success &&
    scopeMatches(state, s) &&
    !detail.error &&
    detail.data?.customerId === s.userId &&
    detail.data.id === s.bookingId
    ? detail.data
    : undefined;
}
function issuesFor(state: RootState, s: BookingSelection): BookingIssues | undefined {
  const query = bookingIssuesApi.endpoints.getBookingIssues.select({
    sessionId: s.sessionId,
    userId: s.userId,
    role: s.role,
    bookingId: s.bookingId,
  })(state);
  return query.error ? undefined : query.data;
}
function refresh(a: QueryContext, s: BookingSelection) {
  if (scopeMatches(a.getState() as RootState, s))
    a.dispatch(
      baseApi.util.invalidateTags([
        { type: "CustomerBookingIssues", id: s.bookingId },
        { type: "CustomerBookingIssueMessages", id: s.bookingId },
        { type: "CustomerBookings", id: s.bookingId },
        { type: "CustomerBookingTracking", id: s.bookingId },
      ]),
    );
}
type WriteResult<T> = Promise<QueryReturnValue<T, FetchBaseQueryError, undefined>>;
export const bookingIssuesApi = baseApi.injectEndpoints({
  endpoints: (b) => ({
    getBookingIssues: b.query<BookingIssues, BookingSelection>({
      keepUnusedDataFor: 0,
      queryFn(s, a, _e, q) {
        if (!owner(a.getState() as RootState, s)) return sessionDenied;
        return scopedRead(
          a,
          s,
          q,
          { url: `/bookings/${s.bookingId}/issues`, method: "GET" },
          bookingIssuesSchema.refine(
            (r) =>
              r.items.every((i) => i.bookingId === s.bookingId) &&
              new Set(r.items.map((i) => i.id)).size === r.items.length,
          ),
        );
      },
      providesTags: (_r, _e, s) => [{ type: "CustomerBookingIssues", id: s.bookingId }],
    }),
    getBookingIssueMessages: b.query<BookingIssueThread, IssueSelection>({
      keepUnusedDataFor: 0,
      queryFn(s, a, _e, q) {
        const state = a.getState() as RootState;
        if (
          !owner(state, s) ||
          !z.uuid().safeParse(s.issueId).success ||
          !issuesFor(state, s)?.items.some(
            (i) => i.id === s.issueId && i.bookingId === s.bookingId,
          )
        )
          return sessionDenied;
        return scopedRead(
          a,
          s,
          q,
          {
            url: `/bookings/${s.bookingId}/issues/${s.issueId}/messages`,
            method: "GET",
          },
          bookingIssueThreadSchema.refine(
            (r) =>
              r.issue.id === s.issueId &&
              r.issue.bookingId === s.bookingId &&
              new Set(r.messages.map((m) => m.id)).size === r.messages.length,
          ),
        );
      },
      providesTags: (_r, _e, s) => [
        { type: "CustomerBookingIssueMessages", id: s.bookingId },
      ],
    }),
    createBookingIssue: b.mutation<CreatedBookingIssue, IssueWrite>({
      queryFn(s, a, _e, q): WriteResult<CreatedBookingIssue> {
        return sessionFlight(a, s, `booking-issue:${s.bookingId}`, async () => {
          const state = a.getState() as RootState;
          const booking = owner(state, s);
          const issues = issuesFor(state, s);
          if (
            !booking ||
            !issues ||
            s.confirmed !== true ||
            !canCreateBookingIssue(booking, issues)
          )
            return sessionDenied;
          const input = issueMessageInputSchema.safeParse(s.body);
          if (!input.success) return invalidContract;
          const result = await scopedRead(
            a,
            s,
            q,
            {
              url: `/bookings/${s.bookingId}/issues`,
              method: "POST",
              body: input.data,
            },
            createdBookingIssueSchema.refine(
              (r) =>
                r.issue.bookingId === s.bookingId &&
                r.issue.status === "OPEN" &&
                r.issue.message === input.data.message,
            ),
          );
          refresh(a, s);
          return result;
        });
      },
    }),
    sendBookingIssueMessage: b.mutation<SentBookingIssueMessage, IssueMessageWrite>({
      queryFn(s, a, _e, q): WriteResult<SentBookingIssueMessage> {
        return sessionFlight(a, s, `booking-issue:${s.bookingId}`, async () => {
          const state = a.getState() as RootState;
          const thread = bookingIssuesApi.endpoints.getBookingIssueMessages.select({
            sessionId: s.sessionId,
            userId: s.userId,
            role: s.role,
            bookingId: s.bookingId,
            issueId: s.issueId,
          })(state);
          if (
            !owner(state, s) ||
            !z.uuid().safeParse(s.issueId).success ||
            !issuesFor(state, s)?.items.some(
              (i) =>
                i.id === s.issueId &&
                i.bookingId === s.bookingId &&
                i.status === "OPEN",
            ) ||
            !thread.isSuccess ||
            thread.data?.issue.status !== "OPEN" ||
            thread.data.issue.id !== s.issueId ||
            thread.data.issue.bookingId !== s.bookingId
          )
            return sessionDenied;
          const input = issueMessageInputSchema.safeParse(s.body);
          if (!input.success) return invalidContract;
          const result = await scopedRead(
            a,
            s,
            q,
            {
              url: `/bookings/${s.bookingId}/issues/${s.issueId}/messages`,
              method: "POST",
              body: input.data,
            },
            sentBookingIssueMessageSchema.refine(
              (r) =>
                r.item.senderUserId === s.userId &&
                r.item.senderRole === "CUSTOMER" &&
                r.item.message === input.data.message,
            ),
          );
          refresh(a, s);
          return result;
        });
      },
    }),
  }),
});
export const { useGetBookingIssuesQuery, useGetBookingIssueMessagesQuery } =
  bookingIssuesApi;
