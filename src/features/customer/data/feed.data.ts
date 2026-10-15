import skewers from "@/features/customer/assets/feed/feed-taco-paradise-skewers.png";
import avatar from "@/features/customer/assets/profile/profile-taco-paradise-avatar.png";

export type FeedPost = {
  id: string;
  authorId: string;
  author: string;
  avatar: string;
  age: string;
  location: string;
  textBeforeSymbol: string;
  textAfterSymbol: string;
  image: string;
  imageDescription: string;
  likes: number;
  commentCount: number;
  followed: boolean;
};

// The SVG repeats the same sample three times. Counts and ages are illustrative.
export const feedPosts: FeedPost[] = [
  "taco-update-1",
  "taco-update-2",
  "taco-update-3",
].map((id) => ({
  id,
  authorId: "taco-paradise",
  author: "Taco Paradise",
  avatar,
  age: "15 min ago",
  location: "Union Square, SF",
  textBeforeSymbol: "We're at Union Square today!",
  textAfterSymbol: "Come grab our new Baja Fish Tacos - they're",
  image: skewers,
  imageDescription:
    "Grilled skewers with vegetables, salad, and dipping sauce, as supplied in the design",
  likes: 234,
  commentCount: 18,
  followed: true,
}));
