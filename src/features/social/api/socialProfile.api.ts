import { z } from "zod";
import { baseApi } from "@/services/api/baseApi";
import { invalidContract, readValidated } from "@/services/api/validatedQuery";
import {
  memberConnectionsSchema,
  memberPostsSchema,
  memberProfileSchema,
} from "../schemas/socialProfile.schema";
import type { RootState } from "@/app/store";
import {
  selectIsAuthenticated,
  selectCurrentRole,
} from "@/features/auth/store/auth.selectors";
import { USER_ROLES } from "@/constants/roles";
export const socialActorAllowed = (state: RootState) =>
  selectIsAuthenticated(state) &&
  [USER_ROLES.CUSTOMER, USER_ROLES.VENDOR].some(
    (role) => role === selectCurrentRole(state),
  );
const unauthorized = {
  error: {
    status: 403 as const,
    data: { message: "Verified customer or vendor identity required." },
  },
};
const flights = new WeakMap<object, Set<string>>();
export type PostsQuery = { userId: string; tab: "posts" | "tagged"; cursor?: string };
export type ConnectionsQuery = {
  userId: string;
  direction: "followers" | "following";
  offset: number;
  limit: number;
  search?: string;
  type?: "ALL" | "CUSTOMER" | "VENDOR";
};
export const socialProfileApi = baseApi.injectEndpoints({
  endpoints: (b) => ({
    getMemberProfile: b.query<z.infer<typeof memberProfileSchema>, string>({
      async queryFn(userId, a, _e, q) {
        if (!socialActorAllowed(a.getState() as RootState)) return unauthorized;
        if (!z.uuid().safeParse(userId).success) return invalidContract;
        const result = await readValidated(
          { url: `/social/profiles/${userId}` },
          memberProfileSchema,
          q,
        );
        return result.data && result.data.userId !== userId ? invalidContract : result;
      },
      providesTags: ["MemberProfile"],
    }),
    getMemberPosts: b.query<z.infer<typeof memberPostsSchema>, PostsQuery>({
      queryFn: ({ userId, tab, cursor }, a, _e, q) =>
        !socialActorAllowed(a.getState() as RootState)
          ? unauthorized
          : !z.uuid().safeParse(userId).success
            ? invalidContract
            : readValidated(
                {
                  url: `/social/profiles/${userId}/${tab === "tagged" ? "tagged-posts" : "posts"}`,
                  params: { limit: 20, ...(cursor ? { cursor } : {}) },
                },
                memberPostsSchema,
                q,
              ),
      providesTags: ["MemberPosts"],
    }),
    getMemberConnections: b.query<
      z.infer<typeof memberConnectionsSchema>,
      ConnectionsQuery
    >({
      queryFn: ({ userId, direction, ...params }, a, _e, q) =>
        !socialActorAllowed(a.getState() as RootState)
          ? unauthorized
          : !z.uuid().safeParse(userId).success
            ? invalidContract
            : readValidated(
                { url: `/social/profiles/${userId}/${direction}`, params },
                memberConnectionsSchema,
                q,
              ),
      providesTags: (_r, _e, arg) => [
        arg.direction === "followers" ? "MemberFollowers" : "MemberFollowing",
      ],
    }),
    setMemberFollow: b.mutation<
      { userId: string; following: boolean },
      { userId: string; following: boolean }
    >({
      async queryFn(arg, a, _e, q) {
        const state = a.getState() as RootState;
        if (!socialActorAllowed(state) || !state.auth.user) return unauthorized;
        if (!z.uuid().safeParse(arg.userId).success) return invalidContract;
        if (arg.userId === state.auth.user?.id)
          return {
            error: { status: 400, data: { message: "You cannot follow yourself." } },
          };
        const pending = flights.get(a.dispatch) ?? new Set<string>();
        flights.set(a.dispatch, pending);
        const key = `${state.auth.sessionId}:${arg.userId}`;
        if (pending.has(key))
          return {
            error: {
              status: "CUSTOM_ERROR",
              error: "An update is already in progress.",
            },
          };
        pending.add(key);
        try {
          const schema: z.ZodType<unknown> = arg.following
            ? z.object({
                id: z.uuid(),
                followerUserId: z.literal(state.auth.user.id),
                followedUserId: z.literal(arg.userId),
              })
            : z.object({ unfollowed: z.boolean() });
          const result = await readValidated(
            {
              url: `/social/profiles/${arg.userId}/follow`,
              method: arg.following ? "POST" : "DELETE",
            },
            schema,
            q,
          );
          const current = a.getState() as RootState;
          if (
            current.auth.sessionId !== state.auth.sessionId ||
            selectCurrentRole(current) !== selectCurrentRole(state)
          )
            return invalidContract;
          return result.error ? { error: result.error } : { data: arg };
        } finally {
          pending.delete(key);
        }
      },
      invalidatesTags: (r) =>
        r
          ? [
              "MemberProfile",
              "MemberFollowers",
              "MemberFollowing",
              "MemberPosts",
              "SocialFeed",
              "Favorites",
              "Follow",
              "TruckProfile",
              "Discovery",
              "VendorAnalytics",
            ]
          : [],
    }),
  }),
});
export const {
  useGetMemberProfileQuery,
  useGetMemberPostsQuery,
  useGetMemberConnectionsQuery,
  useSetMemberFollowMutation,
} = socialProfileApi;
