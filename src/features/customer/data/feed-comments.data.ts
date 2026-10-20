import mikeAvatar from "@/features/customer/assets/feed/comment-mike-chen.jpg";
import composerAvatar from "@/features/customer/assets/feed/comment-composer-avatar.jpg";

export type FeedComment = {
  id: string;
  parentId: string | null;
  author: string;
  avatar?: string;
  text: string;
  age: string;
  likes: number;
  liked: boolean;
};

export const feedComposerAvatar = composerAvatar;

// Only these two comment bodies are supplied. The post's aggregate count is 18;
// the sheet's "4 comments" label conflicts with both its visible rows and the post.
export function createFeedComments(postId: string): FeedComment[] {
  return [
    {
      id: `${postId}-mike`,
      parentId: null,
      author: "Mike Chen",
      avatar: mikeAvatar,
      text: "Those fish tacos look amazing! 🔥",
      age: "5 min ago",
      likes: 12,
      liked: false,
    },
    {
      id: `${postId}-alex`,
      parentId: null,
      author: "Alex Rivera",
      text: "Best tacos in the city, hands down!",
      age: "15 min ago",
      likes: 15,
      liked: true,
    },
  ];
}
