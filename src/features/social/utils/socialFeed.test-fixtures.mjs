import {
  memberStore,
  memberDto,
  memberId,
  viewerId,
  postId,
  truckId,
  json,
} from "./member.test-fixtures.mjs";
import { identityVerified } from "../../auth/store/auth.slice.ts";
export { memberId, viewerId, postId, truckId, json };
export const otherPostId = "55555555-5555-4555-8555-555555555555";
export const feedPostDto = (overrides = {}) => ({
  id: postId,
  authorUserId: memberId,
  author: memberDto(),
  content: "Actual social post",
  createdAt: "2026-10-28T12:00:00Z",
  publishedAt: "2026-10-28T12:00:00Z",
  media: [
    {
      id: truckId,
      mediaType: "IMAGE",
      mediaUrl: "https://example.invalid/food.jpg",
      sortOrder: 0,
    },
  ],
  likeCount: 12,
  commentCount: 2,
  shareCount: 1,
  viewCount: 44,
  isLiked: false,
  isSaved: false,
  location: { id: truckId, name: "Actual food park", address: null },
  vendor: null,
  foodTruck: null,
  ...overrides,
});
export const feedDto = (overrides = {}) => ({
  items: [feedPostDto()],
  nextCursor: null,
  ...overrides,
});
export const commentDto = (overrides = {}) => ({
  id: memberId,
  postId,
  parentCommentId: null,
  content: "Actual comment",
  likeCount: 2,
  isLiked: false,
  createdAt: "2026-10-28T12:00:00Z",
  author: { id: viewerId, displayName: "Actual commenter", avatarUrl: null },
  ...overrides,
});
export const commentsDto = {
  totalCount: 2,
  comments: [
    {
      ...commentDto(),
      replies: [
        commentDto({ id: truckId, parentCommentId: memberId, content: "Actual reply" }),
      ],
    },
  ],
};
export function feedStore(role = "CUSTOMER", dual = false) {
  const store = memberStore(role);
  const actor = store.getState().auth.user;
  store.dispatch(
    identityVerified({ ...actor, roles: dual ? ["CUSTOMER", "VENDOR"] : [role] }),
  );
  return store;
}
export const imageFile = (name = "photo.jpg", type = "image/jpeg") =>
  new globalThis.File([new Uint8Array([255, 216, 255, 0])], name, { type });
