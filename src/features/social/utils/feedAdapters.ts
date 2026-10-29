import type { z } from "zod";
import type { feedPostSchema, FeedResponse } from "../schemas/socialFeed.schema";
import { remoteMedia } from "@/utils/files/remoteMedia";
export type SocialCard = {
  id: string;
  author: string;
  authorId: string | null;
  avatar: string;
  age: string;
  location: string;
  text: string;
  image: string;
  images: string[];
  imageAlt: string;
  likes: number;
  liked: boolean;
  commentCount: number;
  views: number | null;
};
export function toSocialCard(post: z.infer<typeof feedPostSchema>): SocialCard {
  return {
    id: post.id,
    author:
      post.author?.displayName ??
      post.foodTruck?.name ??
      post.vendor?.businessName ??
      "Author unavailable",
    authorId: post.author?.userId ?? post.authorUserId ?? null,
    avatar: remoteMedia(
      post.author?.avatarUrl ?? post.foodTruck?.profileImageUrl ?? post.vendor?.logoUrl,
    ),
    age: Number.isNaN(Date.parse(post.createdAt))
      ? "Date unavailable"
      : `${new Date(post.createdAt).toLocaleString("en-US", { timeZone: "UTC" })} UTC`,
    location: post.location?.name ?? "",
    text: post.content,
    image: remoteMedia(post.media.find((item) => item.mediaType === "IMAGE")?.mediaUrl),
    images: post.media
      .filter((item) => item.mediaType === "IMAGE")
      .map((item) => remoteMedia(item.mediaUrl))
      .filter(Boolean),
    imageAlt: post.content || "Post image",
    likes: post.likeCount,
    liked: post.isLiked,
    commentCount: post.commentCount,
    views: post.viewCount ?? null,
  };
}
export function uniqueFeedPosts(pages: FeedResponse[]) {
  const posts = new Map<string, FeedResponse["items"][number]>();
  for (const page of pages) for (const post of page.items) posts.set(post.id, post);
  return [...posts.values()];
}
