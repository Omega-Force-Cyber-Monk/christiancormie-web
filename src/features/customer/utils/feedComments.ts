import {
  feedComposerAvatar,
  type FeedComment,
} from "@/features/customer/data/feed-comments.data";
import { feedCommentSchema } from "@/features/customer/schemas/feed.schema";

export type FeedCommentAction =
  | { type: "like"; id: string }
  | { type: "add"; id: string; text: string; parentId: string | null };

export function feedCommentsReducer(
  comments: FeedComment[],
  action: FeedCommentAction,
): FeedComment[] {
  if (action.type === "like") {
    return comments.map((comment) =>
      comment.id !== action.id
        ? comment
        : {
            ...comment,
            liked: !comment.liked,
            likes: comment.likes + (comment.liked ? -1 : 1),
          },
    );
  }
  const result = feedCommentSchema.safeParse({ comment: action.text });
  if (!result.success || comments.some((comment) => comment.id === action.id))
    return comments;
  if (
    action.parentId !== null &&
    !comments.some(
      (comment) => comment.id === action.parentId && comment.parentId === null,
    )
  )
    return comments;
  return [
    ...comments,
    {
      id: action.id,
      parentId: action.parentId,
      author: "You",
      avatar: feedComposerAvatar,
      text: result.data.comment,
      age: "Just now",
      likes: 0,
      liked: false,
    },
  ];
}

export function getFeedCommentCount(
  baseCount: number,
  initialCount: number,
  comments: FeedComment[],
) {
  return baseCount + comments.length - initialCount;
}
