import { z } from "zod";
import type { FetchArgs } from "@reduxjs/toolkit/query";
import type { RootState } from "@/app/store";
import { baseApi } from "@/services/api/baseApi";
import { readValidated, invalidContract } from "@/services/api/validatedQuery";
import type { ApiBaseQuery } from "@/services/api/baseQuery";
import {
  selectCurrentRole,
  selectIsAuthenticated,
} from "@/features/auth/store/auth.selectors";
import { USER_ROLES } from "@/constants/roles";
import {
  conversationSchema,
  conversationsSchema,
  recipientsSchema,
  messagesSchema,
  messageSchema,
  directConversationSchema,
  textMessageSchema,
} from "../schemas/messaging.schema";
import type {
  ConversationScope,
  MessagingScope,
  DirectTarget,
} from "../types/messaging.types";

export function messagingAllowed(state: RootState) {
  const role = selectCurrentRole(state);
  return (
    selectIsAuthenticated(state) &&
    (role === USER_ROLES.CUSTOMER || role === USER_ROLES.VENDOR)
  );
}
const denied = {
  data: undefined,
  error: {
    status: 403 as const,
    data: {
      message: "Verified messaging identity or conversation access is unavailable.",
    },
  },
};
type Context = { getState: () => unknown; dispatch: object };
type Query = (args: FetchArgs) => ReturnType<ApiBaseQuery>;
function matches(a: Context, scope: MessagingScope) {
  const s = a.getState() as RootState;
  return (
    messagingAllowed(s) &&
    s.auth.sessionId === scope.sessionId &&
    selectCurrentRole(s) === scope.role
  );
}
async function read<T>(
  a: Context,
  scope: MessagingScope,
  q: Query,
  args: FetchArgs,
  schema: z.ZodType<T>,
) {
  if (!matches(a, scope)) return denied;
  const user = (a.getState() as RootState).auth.user?.id;
  const result = await readValidated(
    { ...args, url: `/messaging${args.url}` },
    schema,
    q,
  );
  return matches(a, scope) && user === (a.getState() as RootState).auth.user?.id
    ? result
    : denied;
}
const flights = new WeakMap<object, Set<string>>();
async function exclusive<T>(
  a: Context,
  scope: MessagingScope,
  key: string,
  run: () => Promise<T>,
) {
  const pending = flights.get(a.dispatch) ?? new Set<string>();
  flights.set(a.dispatch, pending);
  const id = `${scope.sessionId}:${scope.role}:${key}`;
  if (pending.has(id))
    return {
      error: {
        status: "CUSTOM_ERROR" as const,
        error: "This action is already pending.",
      },
    };
  pending.add(id);
  try {
    return await run();
  } finally {
    pending.delete(id);
  }
}
const tags = [
  "Conversations",
  "MessageRequests",
  "ConversationDetail",
  "MessageHistory",
] as const;
const scopedConversation = (viewer: string | undefined, conversationId?: string) =>
  conversationSchema.refine(
    (c) =>
      (!conversationId || c.id === conversationId) &&
      c.participants.some((p) => p.userId === viewer),
  );
const viewer = (a: Context) => (a.getState() as RootState).auth.user?.id;
const validOffset = (offset: number) => Number.isInteger(offset) && offset >= 0;
export const messagingApi = baseApi.injectEndpoints({
  endpoints: (b) => ({
    getConversations: b.infiniteQuery<
      z.infer<typeof conversationsSchema>,
      MessagingScope & { kind: "conversations" | "requests" },
      number
    >({
      keepUnusedDataFor: 0,
      infiniteQueryOptions: {
        initialPageParam: 0,
        getNextPageParam: (page, _pages, previous) =>
          page.nextOffset !== null && page.nextOffset > previous
            ? page.nextOffset
            : undefined,
      },
      queryFn: ({ queryArg: arg, pageParam: offset }, a, _e, q) =>
        validOffset(offset)
          ? read(
              a,
              arg,
              q,
              { url: `/${arg.kind}`, params: { limit: 20, offset } },
              conversationsSchema.extend({
                items: z
                  .array(scopedConversation(viewer(a)))
                  .refine(
                    (items) =>
                      arg.kind !== "requests" ||
                      items.every(
                        (c) =>
                          c.type === "DIRECT" &&
                          c.directStatus === "REQUESTED" &&
                          c.requestedRecipientId === viewer(a),
                      ),
                  ),
              }),
            )
          : invalidContract,
      providesTags: (_r, _e, arg) => [
        arg.kind === "requests" ? "MessageRequests" : "Conversations",
      ],
    }),
    getMessageRecipients: b.query<
      z.infer<typeof recipientsSchema>,
      MessagingScope & {
        search: string;
        type: "ALL" | "CUSTOMER" | "VENDOR";
        offset: number;
      }
    >({
      keepUnusedDataFor: 0,
      queryFn: (arg, a, _e, q) =>
        validOffset(arg.offset) && ["ALL", "CUSTOMER", "VENDOR"].includes(arg.type)
          ? read(
              a,
              arg,
              q,
              {
                url: "/recipients",
                params: {
                  search: arg.search.trim(),
                  type: arg.type,
                  limit: 20,
                  offset: arg.offset,
                },
              },
              recipientsSchema.refine((r) =>
                r.items.every((u) => !u || u.id !== viewer(a)),
              ),
            )
          : invalidContract,
    }),
    getConversation: b.query<z.infer<typeof conversationSchema>, ConversationScope>({
      keepUnusedDataFor: 0,
      async queryFn(arg, a, _e, q) {
        if (!z.uuid().safeParse(arg.conversationId).success) return invalidContract;
        const r = await read(
          a,
          arg,
          q,
          { url: `/conversations/${arg.conversationId}` },
          z.object({ conversation: scopedConversation(viewer(a), arg.conversationId) }),
        );
        return r.data ? { data: r.data.conversation } : { error: r.error };
      },
      providesTags: (_r, _e, arg) => [
        { type: "ConversationDetail", id: arg.conversationId },
      ],
    }),
    getMessages: b.infiniteQuery<
      z.infer<typeof messagesSchema>,
      ConversationScope,
      number
    >({
      keepUnusedDataFor: 0,
      infiniteQueryOptions: {
        initialPageParam: 0,
        getNextPageParam: (page, _pages, previous) =>
          page.nextOffset !== null && page.nextOffset > previous
            ? page.nextOffset
            : undefined,
      },
      queryFn: ({ queryArg: arg, pageParam: offset }, a, _e, q) =>
        z.uuid().safeParse(arg.conversationId).success && validOffset(offset)
          ? read(
              a,
              arg,
              q,
              {
                url: `/conversations/${arg.conversationId}/messages`,
                params: { limit: 30, offset },
              },
              messagesSchema.refine((r) =>
                r.items.every((m) => m.conversationId === arg.conversationId),
              ),
            )
          : invalidContract,
      providesTags: (_r, _e, arg) => [
        { type: "MessageHistory", id: arg.conversationId },
      ],
    }),
    createDirectConversation: b.mutation<
      z.infer<typeof conversationSchema>,
      MessagingScope & { target: DirectTarget }
    >({
      async queryFn(arg, a, _e, q) {
        const parsed = directConversationSchema.safeParse(arg.target);
        if (!parsed.success) return invalidContract;
        if (parsed.data.participantUserId === viewer(a)) return denied;
        return exclusive(a, arg, "direct", async () => {
          const r = await read(
            a,
            arg,
            q,
            { url: "/conversations/direct", method: "POST", body: parsed.data },
            z.object({
              conversation: scopedConversation(viewer(a)).refine(
                (c) =>
                  c.type === "DIRECT" &&
                  (!parsed.data.participantUserId ||
                    c.participants.some(
                      (p) => p.userId === parsed.data.participantUserId,
                    )),
              ),
            }),
          );
          return r.data ? { data: r.data.conversation } : { error: r.error };
        });
      },
      invalidatesTags: (r) => (r ? [...tags] : []),
    }),
    resolveConversationRequest: b.mutation<
      { conversationId: string; status: "ACTIVE" | "DECLINED" },
      ConversationScope & { action: "accept" | "decline" }
    >({
      queryFn: (arg, a, _e, q) =>
        z.uuid().safeParse(arg.conversationId).success &&
        ["accept", "decline"].includes(arg.action)
          ? exclusive(a, arg, `resolve:${arg.conversationId}`, () =>
              read(
                a,
                arg,
                q,
                {
                  url: `/conversations/${arg.conversationId}/${arg.action}`,
                  method: "PATCH",
                },
                z.object({
                  conversationId: z.literal(arg.conversationId),
                  status: z.literal(arg.action === "accept" ? "ACTIVE" : "DECLINED"),
                }),
              ),
            )
          : invalidContract,
      // Stale request errors also need an authoritative list/detail refresh.
      invalidatesTags: (_r, _e, arg) => [
        "Conversations",
        "MessageRequests",
        { type: "ConversationDetail", id: arg.conversationId },
      ],
    }),
    sendTextMessage: b.mutation<
      z.infer<typeof messageSchema>,
      ConversationScope & { body: { messageType: "TEXT"; content: string } }
    >({
      queryFn: (arg, a, _e, q) => {
        const parsed = textMessageSchema.safeParse(arg.body);
        if (!parsed.success || !z.uuid().safeParse(arg.conversationId).success)
          return invalidContract;
        return exclusive(a, arg, `send:${arg.conversationId}`, async () => {
          const r = await read(
            a,
            arg,
            q,
            {
              url: `/conversations/${arg.conversationId}/messages`,
              method: "POST",
              body: parsed.data,
            },
            z.object({
              item: messageSchema.refine(
                (m) =>
                  m.conversationId === arg.conversationId &&
                  m.senderId === viewer(a) &&
                  m.messageType === "TEXT",
              ),
            }),
          );
          return r.data ? { data: r.data.item } : { error: r.error };
        });
      },
      async onQueryStarted(arg, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          dispatch(
            messagingApi.util.updateQueryData(
              "getMessages",
              {
                sessionId: arg.sessionId,
                role: arg.role,
                conversationId: arg.conversationId,
              },
              (draft) => {
                if (
                  !draft.pages.some((page) =>
                    page.items.some((m) => m.id === data.id),
                  ) &&
                  draft.pages[0]
                )
                  draft.pages[0].items.unshift(data);
              },
            ),
          );
        } catch {
          /* Preserve the draft and validated cache on failure. */
        }
      },
      invalidatesTags: (r) => (r ? [...tags] : []),
    }),
    markConversationRead: b.mutation<{ message: string }, ConversationScope>({
      queryFn: (arg, a, _e, q) =>
        z.uuid().safeParse(arg.conversationId).success
          ? exclusive(a, arg, `read:${arg.conversationId}`, () =>
              read(
                a,
                arg,
                q,
                { url: `/conversations/${arg.conversationId}/read`, method: "PATCH" },
                z.object({ message: z.string() }),
              ),
            )
          : invalidContract,
      invalidatesTags: (r, _e, arg) =>
        r
          ? [
              "Conversations",
              "MessageRequests",
              { type: "ConversationDetail", id: arg.conversationId },
            ]
          : [],
    }),
  }),
});
export const {
  useGetConversationsInfiniteQuery,
  useGetMessageRecipientsQuery,
  useGetConversationQuery,
  useGetMessagesInfiniteQuery,
  useCreateDirectConversationMutation,
  useResolveConversationRequestMutation,
  useSendTextMessageMutation,
  useMarkConversationReadMutation,
} = messagingApi;
