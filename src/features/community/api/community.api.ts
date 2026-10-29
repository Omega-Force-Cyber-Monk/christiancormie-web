import type { RootState } from "@/app/store";
import { baseApi } from "@/services/api/baseApi";
import {
  scopedRead,
  scopeMatches,
  sessionFlight,
  sessionDenied,
  type SessionScope,
  type QueryContext,
  type ValidatedQuery,
} from "@/services/api/sessionGuard";
import { invalidContract } from "@/services/api/validatedQuery";
import { z } from "zod";
import { createSelector } from "@reduxjs/toolkit";
import {
  communityListSchema,
  communityDetailSchema,
  communityQuerySchema,
  type CommunityList,
  type CommunityQuery,
  type CommunityPost,
} from "../schemas/community.schema";
import { nextCommunityOffset } from "../utils/communityAdapters";
import { vendorApi } from "@/features/vendor/api/vendor.api";
import {
  communityCommentsSchema,
  communityInterestsSchema,
  createdCommunityCommentSchema,
  communityReactionSchema,
  communityReportedSchema,
  communityMessageSchema,
  communityInteractionInputSchema,
  type CommunityComments,
  type CommunityInterests,
  type CommunityInteraction,
  type CommunityInteractionResponse,
} from "../schemas/communityInteractions.schema";
import { communityInteractionAllowed } from "../utils/communityInteractions";
import {
  communityCreateResponseSchema,
  communityUploadResponseSchema,
  communityDeleteResponseSchema,
  createCommunitySchema,
  updateCommunitySchema,
  type CommunityCreated,
  type CommunityWrite,
  type CommunityPatch,
} from "../schemas/communityPublishing.schema";
import {
  communityFileError,
  communityFileSignature,
  editableCommunityPost,
} from "../utils/communityPublishing";

export type CommunityScope = SessionScope;
export type CommunityListArg = CommunityScope & {
  filters?: Omit<CommunityQuery, "offset">;
};
export const communityScope = createSelector(
  [
    (state: RootState) => state.auth.sessionId,
    (state: RootState) => state.auth.user?.id,
    (state: RootState) => state.auth.user?.role,
  ],
  (sessionId, userId, role): CommunityScope => ({
    sessionId: sessionId ?? "",
    userId: userId ?? "",
    role: role ?? "",
  }),
);
const roleAllowed = (scope: CommunityScope) =>
  ["CUSTOMER", "VENDOR"].includes(scope.role);
export function communityPublisherAllowed(state: RootState, scope: CommunityScope) {
  if (!roleAllowed(scope) || !scopeMatches(state, scope)) return false;
  if (scope.role === "VENDOR" || state.auth.user?.roles.includes("VENDOR")) {
    const query = vendorApi.endpoints.getVendorMe.select(undefined)(state);
    const vendor = query.data;
    return (
      !query.error &&
      vendor?.userId === scope.userId &&
      ["APPROVED", "PENDING_APPROVAL"].includes(vendor.status) &&
      vendor.dashboardAccess.allowed &&
      vendor.user?.status === "ACTIVE"
    );
  }
  return scope.role === "CUSTOMER";
}
const writeTags = (
  result: unknown,
  _error: unknown,
  arg: CommunityScope & { postId?: string },
) =>
  result
    ? [
        "CommunityList" as const,
        "CommunityPost" as const,
        "Rewards" as const,
        "MemberProfile" as const,
        ...(arg.postId
          ? [
              { type: "CommunityComments" as const, id: arg.postId },
              { type: "CommunityInterests" as const, id: arg.postId },
            ]
          : []),
      ]
    : [];
export function cachedCommunityPost(
  state: RootState,
  scope: CommunityScope,
  postId: string,
): CommunityPost | undefined {
  const query = communityApi.endpoints.getCommunityPost.select({
    sessionId: scope.sessionId,
    userId: scope.userId,
    role: scope.role,
    postId,
  })(state);
  return query.error ? undefined : query.data?.post;
}
export function cachedInteractionPost(
  state: RootState,
  scope: CommunityScope,
  postId: string,
): CommunityPost | undefined {
  const detail = communityApi.endpoints.getCommunityPost.select({
    sessionId: scope.sessionId,
    userId: scope.userId,
    role: scope.role,
    postId,
  })(state);
  if (detail.error) return undefined;
  if (detail.data) return detail.data.post;
  for (const name of ["getCommunityPosts", "getMyCommunityPosts"] as const) {
    for (const arg of communityApi.util.selectCachedArgsForQuery(state, name)) {
      if (
        arg.sessionId !== scope.sessionId ||
        arg.userId !== scope.userId ||
        arg.role !== scope.role
      )
        continue;
      const query = communityApi.endpoints[name].select(arg)(state);
      if (query.error) continue;
      const post = query.data?.pages
        .flatMap((page) => page.items)
        .find((post) => post.id === postId);
      if (post) return post;
    }
  }
  return undefined;
}
async function list(
  arg: CommunityListArg,
  offset: number,
  mine: boolean,
  a: QueryContext,
  q: ValidatedQuery,
) {
  if (!roleAllowed(arg)) return sessionDenied;
  const parsed = communityQuerySchema.safeParse({
    ...arg.filters,
    limit: arg.filters?.limit ?? 20,
    offset,
  });
  if (!parsed.success) return invalidContract;
  const result = await scopedRead(
    a,
    arg,
    q,
    { url: mine ? "/community/posts/mine" : "/community/posts", params: parsed.data },
    communityListSchema,
  );
  if (
    result.data &&
    (result.data.pagination.offset !== offset ||
      result.data.pagination.limit !== parsed.data.limit)
  )
    return invalidContract;
  return result;
}
const options = {
  initialPageParam: 0,
  getNextPageParam: (page: CommunityList, _pages: CommunityList[], previous: number) =>
    nextCommunityOffset(page, previous),
};
export const communityApi = baseApi.injectEndpoints({
  endpoints: (b) => ({
    getCommunityComments: b.infiniteQuery<
      CommunityComments,
      CommunityScope & { postId: string },
      number
    >({
      keepUnusedDataFor: 0,
      infiniteQueryOptions: {
        initialPageParam: 0,
        getNextPageParam: (page, _pages, previous) =>
          page.items.length &&
          page.pagination.nextOffset !== null &&
          page.pagination.nextOffset > previous &&
          page.pagination.nextOffset <= 100000
            ? page.pagination.nextOffset
            : undefined,
      },
      async queryFn({ queryArg: arg, pageParam }, a, _e, q) {
        if (!roleAllowed(arg)) return sessionDenied;
        if (
          !z.uuid().safeParse(arg.postId).success ||
          !z.number().int().min(0).max(100000).safeParse(pageParam).success
        )
          return invalidContract;
        const result = await scopedRead(
          a,
          arg,
          q,
          {
            url: `/community/posts/${arg.postId}/comments`,
            params: { limit: 20, offset: pageParam },
          },
          communityCommentsSchema,
        );
        return result.data &&
          (result.data.pagination.offset !== pageParam ||
            result.data.pagination.limit !== 20)
          ? invalidContract
          : result;
      },
      providesTags: (_r, _e, arg) => [{ type: "CommunityComments", id: arg.postId }],
    }),
    getCommunityInterests: b.infiniteQuery<
      CommunityInterests,
      CommunityScope & { postId: string },
      number
    >({
      keepUnusedDataFor: 0,
      infiniteQueryOptions: {
        initialPageParam: 0,
        getNextPageParam: (page, _pages, previous) =>
          page.items.length &&
          previous + page.items.length < page.total &&
          previous + page.items.length <= 100000
            ? previous + page.items.length
            : undefined,
      },
      queryFn: ({ queryArg: arg, pageParam }, a, _e, q) => {
        if (!roleAllowed(arg) || !scopeMatches(a.getState() as RootState, arg))
          return sessionDenied;
        if (
          !z.uuid().safeParse(arg.postId).success ||
          !z.number().int().min(0).max(100000).safeParse(pageParam).success
        )
          return invalidContract;
        const post = cachedInteractionPost(a.getState() as RootState, arg, arg.postId);
        if (
          !post ||
          post.category !== "VENDOR_CALLOUT" ||
          post.author?.id !== arg.userId ||
          !post.viewer?.isOwner
        )
          return sessionDenied;
        return scopedRead(
          a,
          arg,
          q,
          {
            url: `/community/posts/${arg.postId}/interests`,
            params: { limit: 20, offset: pageParam },
          },
          communityInterestsSchema,
        );
      },
      providesTags: (_r, _e, arg) => [{ type: "CommunityInterests", id: arg.postId }],
    }),
    communityInteraction: b.mutation<
      CommunityInteractionResponse,
      CommunityScope & { postId: string; action: CommunityInteraction }
    >({
      async queryFn(arg, a, _e, q) {
        const state = a.getState() as RootState;
        if (!roleAllowed(arg) || !scopeMatches(state, arg)) return sessionDenied;
        if (!z.uuid().safeParse(arg.postId).success) return invalidContract;
        const parsed = communityInteractionInputSchema.safeParse(arg.action);
        if (!parsed.success) return invalidContract;
        const action = parsed.data;
        const post = cachedInteractionPost(state, arg, arg.postId);
        if (
          !communityInteractionAllowed(
            post,
            arg.userId,
            arg.role,
            communityPublisherAllowed(state, arg),
            action.kind,
          )
        )
          return sessionDenied;
        let suffix: string = action.kind;
        let method = "POST";
        let body: unknown;
        let schema: z.ZodType<CommunityInteractionResponse> = communityMessageSchema;
        if (action.kind === "comment") {
          suffix = "comments";
          body = {
            content: action.content,
            ...(action.parentCommentId
              ? { parentCommentId: action.parentCommentId }
              : {}),
          };
          schema = createdCommunityCommentSchema;
        }
        if (action.kind === "react") {
          suffix = "reactions";
          body = { reaction: "LIKE" };
          schema = communityReactionSchema;
        }
        if (action.kind === "report") {
          suffix = "reports";
          body = { reason: action.reason };
          schema = communityReportedSchema;
        }
        if (action.kind === "interest") {
          suffix = "interests";
          body = { message: action.message };
        }
        if (action.kind === "withdraw") {
          suffix = "interests/me";
          method = "DELETE";
        }
        if (action.kind === "restore") {
          suffix = "ignore";
          method = "DELETE";
        }
        const lock =
          action.kind === "ignore" || action.kind === "restore"
            ? "visibility"
            : action.kind === "interest" || action.kind === "withdraw"
              ? "interest"
              : action.kind;
        return sessionFlight(a, arg, `community-${arg.postId}:${lock}`, async () => {
          const result = await scopedRead(
            a,
            arg,
            q,
            {
              url: `/community/posts/${arg.postId}/${suffix}`,
              method,
              ...(body ? { body } : {}),
            },
            schema,
          );
          const data = result.data;
          if (
            data &&
            "comment" in data &&
            (data.comment.communityRequestId !== arg.postId ||
              data.comment.userId !== arg.userId ||
              data.comment.user.id !== arg.userId ||
              data.comment.parentCommentId !==
                (action.kind === "comment" ? (action.parentCommentId ?? null) : null))
          )
            return invalidContract;
          if (
            data &&
            "reaction" in data &&
            (data.reaction.communityRequestId !== arg.postId ||
              data.reaction.userId !== arg.userId)
          )
            return invalidContract;
          if (
            data &&
            "report" in data &&
            (data.report.postId !== arg.postId ||
              action.kind !== "report" ||
              data.report.reason !== action.reason)
          )
            return invalidContract;
          return result;
        });
      },
      invalidatesTags: (r, _e, arg) =>
        !r
          ? []
          : [
              "CommunityList",
              { type: "CommunityPost", id: arg.postId },
              ...(arg.action.kind === "comment"
                ? [{ type: "CommunityComments" as const, id: arg.postId }]
                : []),
              ...(["interest", "withdraw"].includes(arg.action.kind)
                ? [{ type: "CommunityInterests" as const, id: arg.postId }]
                : []),
            ],
    }),
    createCommunityPost: b.mutation<
      CommunityCreated,
      CommunityScope & { body: CommunityWrite }
    >({
      async queryFn(arg, a, _e, q) {
        if (!communityPublisherAllowed(a.getState() as RootState, arg))
          return sessionDenied;
        const parsed = createCommunitySchema.safeParse(arg.body);
        if (!parsed.success) return invalidContract;
        return sessionFlight(a, arg, "community-create", async () => {
          const result = await scopedRead(
            a,
            arg,
            q,
            { url: "/community/posts", method: "POST", body: parsed.data },
            communityCreateResponseSchema,
          );
          return result.data &&
            (result.data.post.author?.id !== arg.userId ||
              !result.data.post.viewer?.isOwner ||
              result.data.post.category !== parsed.data.category ||
              result.data.post.status !== "OPEN" ||
              result.data.post.visibility !== "PUBLIC")
            ? invalidContract
            : result;
        });
      },
      invalidatesTags: writeTags,
    }),
    uploadCommunityMedia: b.mutation<
      z.infer<typeof communityUploadResponseSchema>,
      CommunityScope & { files: File[] }
    >({
      async queryFn(arg, a, _e, q) {
        if (!communityPublisherAllowed(a.getState() as RootState, arg))
          return sessionDenied;
        if (!arg.files.length || communityFileError(arg.files)) return invalidContract;
        for (const file of arg.files)
          if (!(await communityFileSignature(file))) return invalidContract;
        if (!communityPublisherAllowed(a.getState() as RootState, arg))
          return sessionDenied;
        const body = new FormData();
        for (const file of arg.files) body.append("files", file, file.name);
        const result = await scopedRead(
          a,
          arg,
          q,
          { url: "/community/media/upload", method: "POST", body },
          communityUploadResponseSchema,
        );
        return result.data &&
          (result.data.media.length !== arg.files.length ||
            result.data.media.some(
              (m, i) =>
                m.mediaType !==
                (arg.files[i].type === "application/pdf" ? "PDF" : "IMAGE"),
            ))
          ? invalidContract
          : result;
      },
    }),
    updateCommunityPost: b.mutation<
      z.infer<typeof communityDetailSchema>,
      CommunityScope & { postId: string; body: CommunityPatch }
    >({
      async queryFn(arg, a, _e, q) {
        if (!communityPublisherAllowed(a.getState() as RootState, arg))
          return sessionDenied;
        if (!z.uuid().safeParse(arg.postId).success) return invalidContract;
        const post = cachedCommunityPost(a.getState() as RootState, arg, arg.postId);
        if (!editableCommunityPost(post, arg.userId, "edit")) return sessionDenied;
        const parsed = updateCommunitySchema.safeParse(arg.body);
        if (!parsed.success) return invalidContract;
        return sessionFlight(a, arg, `community-post:${arg.postId}`, async () => {
          const result = await scopedRead(
            a,
            arg,
            q,
            {
              url: `/community/posts/${arg.postId}`,
              method: "PATCH",
              body: parsed.data,
            },
            communityDetailSchema,
          );
          return result.data &&
            (result.data.post.id !== arg.postId ||
              result.data.post.author?.id !== arg.userId ||
              result.data.post.category !== post?.category)
            ? invalidContract
            : result;
        });
      },
      invalidatesTags: writeTags,
    }),
    deleteCommunityPost: b.mutation<
      z.infer<typeof communityDeleteResponseSchema>,
      CommunityScope & { postId: string; confirmed: boolean }
    >({
      async queryFn(arg, a, _e, q) {
        if (!communityPublisherAllowed(a.getState() as RootState, arg))
          return sessionDenied;
        if (!z.uuid().safeParse(arg.postId).success) return invalidContract;
        const post = cachedCommunityPost(a.getState() as RootState, arg, arg.postId);
        if (
          arg.confirmed !== true ||
          !editableCommunityPost(post, arg.userId, "delete")
        )
          return sessionDenied;
        return sessionFlight(a, arg, `community-post:${arg.postId}`, () =>
          scopedRead(
            a,
            arg,
            q,
            { url: `/community/posts/${arg.postId}`, method: "DELETE" },
            communityDeleteResponseSchema,
          ),
        );
      },
      invalidatesTags: writeTags,
    }),
    getCommunityPosts: b.infiniteQuery<CommunityList, CommunityListArg, number>({
      keepUnusedDataFor: 0,
      infiniteQueryOptions: options,
      queryFn: ({ queryArg, pageParam }, a, _e, q) =>
        list(queryArg, pageParam, false, a, q),
      providesTags: (r) => [
        "CommunityList",
        ...(r?.pages.flatMap((p) =>
          p.items.map((post) => ({ type: "CommunityPost" as const, id: post.id })),
        ) ?? []),
      ],
    }),
    getMyCommunityPosts: b.infiniteQuery<CommunityList, CommunityListArg, number>({
      keepUnusedDataFor: 0,
      infiniteQueryOptions: options,
      queryFn: ({ queryArg, pageParam }, a, _e, q) =>
        list(queryArg, pageParam, true, a, q),
      providesTags: (r) => [
        "CommunityList",
        ...(r?.pages.flatMap((p) =>
          p.items.map((post) => ({ type: "CommunityPost" as const, id: post.id })),
        ) ?? []),
      ],
    }),
    getCommunityPost: b.query<
      z.infer<typeof communityDetailSchema>,
      CommunityScope & { postId: string }
    >({
      keepUnusedDataFor: 0,
      async queryFn(arg, a, _e, q) {
        if (!roleAllowed(arg)) return sessionDenied;
        if (!z.uuid().safeParse(arg.postId).success) return invalidContract;
        const result = await scopedRead(
          a,
          arg,
          q,
          { url: `/community/posts/${arg.postId}` },
          communityDetailSchema,
        );
        return result.data && result.data.post.id !== arg.postId
          ? invalidContract
          : result;
      },
      providesTags: (_r, _e, arg) => [{ type: "CommunityPost", id: arg.postId }],
    }),
  }),
});
export const {
  useGetCommunityCommentsInfiniteQuery,
  useGetCommunityInterestsInfiniteQuery,
  useGetCommunityPostsInfiniteQuery,
  useGetMyCommunityPostsInfiniteQuery,
  useGetCommunityPostQuery,
} = communityApi;
