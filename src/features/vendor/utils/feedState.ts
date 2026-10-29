import { z } from "zod";
import {
  vendorFeedPosts,
  type VendorFeedPost,
  type VendorFeedComment,
} from "@/features/vendor/data/feed.data";
import composerAvatar from "@/features/vendor/assets/home/Home-truck.webp";

export const vendorFeedTextSchema = z.object({
  text: z
    .string()
    .trim()
    .min(1, "Enter some text before submitting.")
    .max(2200, "Use at most 2200 characters."),
});
export type VendorCommentDraft = { text: string; replyTo: string | null };
export type VendorFeedState = {
  posts: VendorFeedPost[];
  selectedPostId: string | null;
  drafts: Record<string, VendorCommentDraft>;
};
export const initialVendorFeedState = (): VendorFeedState => ({
  posts: vendorFeedPosts.map((post) => ({
    ...post,
    comments: post.comments.map((comment) => ({ ...comment })),
  })),
  selectedPostId: null,
  drafts: {},
});
export type VendorFeedAction =
  | { type: "open-comments"; postId: string | null }
  | { type: "like-post"; postId: string }
  | { type: "like-comment"; postId: string; commentId: string }
  | { type: "draft"; postId: string; draft: VendorCommentDraft }
  | {
      type: "comment";
      postId: string;
      id: string;
      text: string;
      parentId: string | null;
    }
  | { type: "post"; id: string; text: string };

export function vendorFeedReducer(
  state: VendorFeedState,
  action: VendorFeedAction,
): VendorFeedState {
  if (action.type === "open-comments")
    return action.postId === null ||
      state.posts.some((post) => post.id === action.postId)
      ? { ...state, selectedPostId: action.postId }
      : state;
  if (action.type === "post") {
    const parsed = vendorFeedTextSchema.safeParse({ text: action.text });
    if (!parsed.success || state.posts.some((post) => post.id === action.id))
      return state;
    return {
      ...state,
      posts: [
        {
          id: action.id,
          author: "Your truck",
          avatar: composerAvatar,
          age: "Local preview",
          location: "",
          text: parsed.data.text,
          likes: 0,
          liked: false,
          views: "0",
          comments: [],
          local: true,
        },
        ...state.posts,
      ],
    };
  }
  const post = state.posts.find((item) => item.id === action.postId);
  if (!post) return state;
  if (action.type === "draft")
    return { ...state, drafts: { ...state.drafts, [post.id]: { ...action.draft } } };
  if (action.type === "like-post")
    return {
      ...state,
      posts: state.posts.map((item) =>
        item.id === post.id
          ? { ...item, liked: !item.liked, likes: item.likes + (item.liked ? -1 : 1) }
          : item,
      ),
    };
  if (action.type === "like-comment")
    return {
      ...state,
      posts: state.posts.map((item) =>
        item.id === post.id
          ? {
              ...item,
              comments: item.comments.map((comment) =>
                comment.id === action.commentId
                  ? {
                      ...comment,
                      liked: !comment.liked,
                      likes: comment.likes + (comment.liked ? -1 : 1),
                    }
                  : comment,
              ),
            }
          : item,
      ),
    };
  const parsed = vendorFeedTextSchema.safeParse({ text: action.text });
  if (
    !parsed.success ||
    post.comments.some((comment) => comment.id === action.id) ||
    (action.parentId &&
      !post.comments.some((comment) => comment.id === action.parentId))
  )
    return state;
  const comment: VendorFeedComment = {
    id: action.id,
    author: "Your truck",
    text: parsed.data.text,
    age: "Local preview",
    likes: 0,
    liked: false,
    parentId: action.parentId,
    local: true,
  };
  return {
    ...state,
    posts: state.posts.map((item) =>
      item.id === post.id ? { ...item, comments: [...item.comments, comment] } : item,
    ),
    drafts: { ...state.drafts, [post.id]: { text: "", replyTo: null } },
  };
}

export function getVendorCommentOrder(
  comments: VendorFeedComment[],
): (VendorFeedComment & { depth: number })[] {
  const result: (VendorFeedComment & { depth: number })[] = [];
  const visited = new Set<string>();
  function append(parentId: string | null, depth: number) {
    for (const comment of comments) {
      if (comment.parentId !== parentId || visited.has(comment.id)) continue;
      visited.add(comment.id);
      result.push({ ...comment, depth });
      append(comment.id, depth + 1);
    }
  }
  append(null, 0);
  return result;
}
