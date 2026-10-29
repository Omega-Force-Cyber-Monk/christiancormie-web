import { z } from "zod";
import type { RootState } from "@/app/store";
import { baseApi } from "@/services/api/baseApi";
import { readValidated, invalidContract } from "@/services/api/validatedQuery";
import { socialActorAllowed } from "./socialProfile.api";
import { USER_ROLES } from "@/constants/roles";
import { selectCurrentRole } from "@/features/auth/store/auth.selectors";
import {
  feedSchema,
  createSocialPostSchema,
  uploadMediaSchema,
  commentsSchema,
  commentSchema,
  shareSchema,
  placesSchema,
  type FeedResponse,
  type CreateSocialPost,
} from "../schemas/socialFeed.schema";
import { validPostFile } from "../utils/postPublishing";
import { vendorApi } from "@/features/vendor/api/vendor.api";
const denied = {
  error: {
    status: 403 as const,
    data: { message: "Verified social identity is required for this action." },
  },
};
const flights = new WeakMap<object, Set<string>>();
const postTags = ["SocialFeed", "SocialPosts", "MemberPosts", "MemberProfile"] as const;
export const socialFeedApi = baseApi.injectEndpoints({
  endpoints: (b) => ({
    getSocialFeed: b.infiniteQuery<
      FeedResponse,
      { audience: "following" | "explore"; sessionId: string },
      string | undefined
    >({
      keepUnusedDataFor: 0,
      infiniteQueryOptions: {
        initialPageParam: undefined,
        getNextPageParam: (page, _pages, previous) =>
          page.nextCursor && page.nextCursor !== previous ? page.nextCursor : undefined,
      },
      queryFn: ({ queryArg, pageParam }, a, _e, q) => {
        const state = a.getState() as RootState;
        return socialActorAllowed(state) && state.auth.sessionId === queryArg.sessionId
          ? readValidated(
              {
                url: `/social/feed/${queryArg.audience}`,
                params: {
                  limit: 20,
                  ...(pageParam ? { cursor: pageParam } : {}),
                  ...(queryArg.audience === "explore" ? { sortBy: "newest" } : {}),
                },
              },
              feedSchema,
              q,
            )
          : denied;
      },
      providesTags: (r) => [
        "SocialFeed",
        "SocialPosts",
        ...(r?.pages.flatMap((page) =>
          page.items.map((post) => ({ type: "SocialPosts" as const, id: post.id })),
        ) ?? []),
      ],
    }),
    getPostComments: b.query<
      z.infer<typeof commentsSchema>,
      { postId: string; offset: number }
    >({
      queryFn: ({ postId, offset }, a, _e, q) =>
        !socialActorAllowed(a.getState() as RootState)
          ? denied
          : !z.uuid().safeParse(postId).success
            ? invalidContract
            : readValidated(
                {
                  url: `/social/posts/${postId}/comments`,
                  params: { limit: 20, offset },
                },
                commentsSchema,
                q,
              ),
      providesTags: (_r, _e, arg) => [{ type: "PostComments", id: arg.postId }],
    }),
    getSocialPlaces: b.query<
      z.infer<typeof placesSchema>,
      { search: string; offset: number }
    >({
      queryFn: (params, a, _e, q) =>
        socialActorAllowed(a.getState() as RootState)
          ? readValidated(
              { url: "/social/places", params: { ...params, limit: 20 } },
              placesSchema,
              q,
            )
          : denied,
    }),
    uploadSocialImage: b.mutation<z.infer<typeof uploadMediaSchema>, { file: File }>({
      async queryFn({ file }, a, _e, q) {
        if (!socialActorAllowed(a.getState() as RootState)) return denied;
        if (validPostFile(file)) return invalidContract;
        const body = new FormData();
        body.append("files", file, file.name);
        return readValidated(
          { url: "/social/media/upload", method: "POST", body },
          uploadMediaSchema,
          q,
        );
      },
    }),
    createSocialPost: b.mutation<{ id: string; status: "PUBLISHED" }, CreateSocialPost>(
      {
        async queryFn(arg, a, _e, q) {
          const state = a.getState() as RootState;
          if (!socialActorAllowed(state)) return denied;
          const parsed = createSocialPostSchema.safeParse(arg);
          if (!parsed.success) return invalidContract;
          const role = selectCurrentRole(state);
          if (
            role === USER_ROLES.CUSTOMER &&
            (arg.foodTruckId || state.auth.user?.roles.includes(USER_ROLES.VENDOR))
          )
            return denied;
          if (role === USER_ROLES.VENDOR) {
            const vendor =
              vendorApi.endpoints.getVendorMe.select(undefined)(state).data;
            const trucks =
              vendorApi.endpoints.getMyTrucks.select(undefined)(state).data;
            const identity = z
              .object({
                id: z.uuid(),
                userId: z.string(),
                dashboardAccess: z.object({ allowed: z.boolean() }),
                user: z.object({ status: z.string() }).nullish(),
              })
              .safeParse(vendor);
            const roster = z
              .array(z.object({ id: z.uuid(), vendorId: z.uuid(), status: z.string() }))
              .safeParse(trucks);
            if (
              !identity.success ||
              identity.data.userId !== state.auth.user?.id ||
              !identity.data.dashboardAccess.allowed ||
              (identity.data.user?.status && identity.data.user.status !== "ACTIVE") ||
              !roster.success ||
              roster.data.length !== 1 ||
              roster.data[0].vendorId !== identity.data.id ||
              roster.data[0].id !== arg.foodTruckId ||
              roster.data[0].status !== "ACTIVE"
            )
              return denied;
          }
          return readValidated(
            { url: "/social/posts", method: "POST", body: parsed.data },
            z.object({ id: z.uuid(), status: z.literal("PUBLISHED") }),
            q,
          );
        },
        invalidatesTags: (r) => (r ? [...postTags, "Rewards"] : []),
      },
    ),
    socialPostAction: b.mutation<
      unknown,
      {
        kind: "like" | "share" | "comment-like" | "comment";
        postId: string;
        commentId?: string;
        content?: string;
        parentCommentId?: string;
      }
    >({
      async queryFn(arg, a, _e, q) {
        const state = a.getState() as RootState;
        if (!socialActorAllowed(state)) return denied;
        if (
          !z.uuid().safeParse(arg.postId).success ||
          (arg.kind === "comment-like" && !z.uuid().safeParse(arg.commentId).success) ||
          (arg.commentId && !z.uuid().safeParse(arg.commentId).success)
        )
          return invalidContract;
        const key = `${state.auth.sessionId}:${arg.kind}:${arg.commentId ?? arg.postId}`;
        const pending = flights.get(a.dispatch) ?? new Set<string>();
        flights.set(a.dispatch, pending);
        if (pending.has(key))
          return {
            error: { status: "CUSTOM_ERROR", error: "An action is already pending." },
          };
        pending.add(key);
        try {
          const body =
            arg.kind === "comment"
              ? z
                  .object({
                    content: z.string().trim().min(1),
                    parentCommentId: z.uuid().optional(),
                  })
                  .safeParse({
                    content: arg.content,
                    parentCommentId: arg.parentCommentId,
                  })
              : null;
          if (body && !body.success) return invalidContract;
          const url =
            arg.kind === "comment-like"
              ? `/social/comments/${arg.commentId}/like`
              : `/social/posts/${arg.postId}/${arg.kind === "comment" ? "comments" : arg.kind}`;
          const schema: z.ZodType<unknown> =
            arg.kind === "comment"
              ? commentSchema.extend({ postId: z.literal(arg.postId) })
              : arg.kind === "share"
                ? shareSchema.extend({ postId: z.literal(arg.postId) })
                : arg.kind === "comment-like"
                  ? z.object({
                      liked: z.boolean(),
                      likeCount: z.number().nonnegative(),
                    })
                  : z.object({ liked: z.boolean() });
          const result = await readValidated(
            { url, method: "POST", ...(body?.success ? { body: body.data } : {}) },
            schema,
            q,
          );
          if ((a.getState() as RootState).auth.sessionId !== state.auth.sessionId)
            return invalidContract;
          return result;
        } finally {
          pending.delete(key);
        }
      },
      invalidatesTags: (r, _e, arg) =>
        r ? [...postTags, { type: "PostComments", id: arg.postId }] : [],
    }),
  }),
});
export const {
  useGetSocialFeedInfiniteQuery,
  useGetPostCommentsQuery,
  useGetSocialPlacesQuery,
  useUploadSocialImageMutation,
  useCreateSocialPostMutation,
  useSocialPostActionMutation,
} = socialFeedApi;
