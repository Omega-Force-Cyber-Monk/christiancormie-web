import truckAvatar from "@/features/vendor/assets/feed/Feed-truck-avatar.webp";
import skewers from "@/features/vendor/assets/feed/Feed-skewers.webp";
import tacos from "@/features/vendor/assets/feed/Feed-tacos.webp";
import pasta from "@/features/vendor/assets/feed/Feed-pasta.webp";
import mike from "@/features/vendor/assets/feed/Comments-mike-chen.webp";

export type VendorFeedComment = {
  id: string;
  author: string;
  avatar?: string;
  text: string;
  age: string;
  likes: number;
  liked: boolean;
  parentId: string | null;
  local?: boolean;
};
export type VendorFeedPost = {
  id: string;
  author: string;
  avatar: string;
  age: string;
  location: string;
  text: string;
  image?: string;
  imageAlt?: string;
  likes: number;
  liked: boolean;
  views: string;
  comments: VendorFeedComment[];
  local?: boolean;
};
const sampleComments = (food: string): VendorFeedComment[] => [
  {
    id: "mike",
    author: "Mike Chen",
    avatar: mike,
    text: `Those ${food} look amazing! 🔥`,
    age: "5 min ago",
    likes: 12,
    liked: false,
    parentId: null,
  },
  {
    id: "alex",
    author: "Alex Rivera",
    text:
      food === "fish tacos"
        ? "Best tacos in the city, hands down!"
        : "Looks fresh and delicious!",
    age: "15 min ago",
    likes: 15,
    liked: true,
    parentId: null,
  },
  // Two additional local fixtures complete the four-comment thread indicated by the sheet.
  {
    id: "jamie",
    author: "Jamie Lee",
    text: "Can't wait to stop by!",
    age: "20 min ago",
    likes: 2,
    liked: false,
    parentId: null,
  },
  {
    id: "sam",
    author: "Sam Patel",
    text: "Is the special available today?",
    age: "25 min ago",
    likes: 0,
    liked: false,
    parentId: null,
  },
];
export const vendorFeedPosts: readonly VendorFeedPost[] = [
  {
    id: "taco-paradise",
    author: "Taco Paradise",
    avatar: truckAvatar,
    age: "15 min ago",
    location: "Union Square, SF",
    text: "We're at Union Square today! 🌮 Come grab our new Baja Fish Tacos - they're 🔥",
    image: skewers,
    imageAlt: "Grilled skewers with peppers on a black plate, as shown in the design",
    likes: 120,
    liked: false,
    views: "2.5k",
    comments: sampleComments("fish tacos"),
  },
  {
    id: "sushi-haven",
    author: "Sushi Haven",
    avatar: truckAvatar,
    age: "30 min ago",
    location: "Downtown, SF",
    text: "Join us at Downtown for our special Salmon Roll! 🍣 Fresh and delicious, only today!",
    image: tacos,
    imageAlt: "Tacos on a plate over a blue table, as shown in the design",
    likes: 120,
    liked: false,
    views: "2.5k",
    comments: sampleComments("specials"),
  },
  {
    id: "burger-joint",
    author: "Burger Joint",
    avatar: truckAvatar,
    age: "1 hour ago",
    location: "The Mission, SF",
    text: "Check out our classic Cheeseburger with a twist! 🍔 Available for a limited time!",
    image: pasta,
    imageAlt: "Penne pasta with tomatoes, as shown in the design",
    likes: 120,
    liked: false,
    views: "2.5k",
    comments: sampleComments("specials"),
  },
];
