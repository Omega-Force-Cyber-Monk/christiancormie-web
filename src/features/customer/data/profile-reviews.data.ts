import sarahPhoto from "@/features/customer/assets/profile/profile-review-sarah-johnson.png";
import michaelPhoto from "@/features/customer/assets/profile/profile-review-michael-lee.jpg";
import emilyPhoto from "@/features/customer/assets/profile/profile-review-emily-davis.png";
import davidPhoto from "@/features/customer/assets/profile/profile-review-david-smith.jpg";

export type ProfileReview = {
  id: string;
  name: string;
  avatar: string;
  avatarShape: "square" | "circle";
  age: string;
  rating: number;
  lines: readonly string[];
  bordered: boolean;
};

// Verbatim Figma sample copy, including references to other kinds of restaurants.
// Relative dates are design labels, not live timestamps or actual customer activity.
export const profileReviews: ProfileReview[] = [
  {
    id: "sarah-johnson",
    name: "Sarah Johnson",
    avatar: sarahPhoto,
    avatarShape: "square",
    age: "2 days ago",
    rating: 5,
    lines: ["Best tacos in SF! The fish taco is", "absolutely incredible."],
    bordered: true,
  },
  {
    id: "michael-lee",
    name: "Michael Lee",
    avatar: michaelPhoto,
    avatarShape: "circle",
    age: "5 days ago",
    rating: 5,
    lines: [
      "The new sushi place is a game changer!",
      "Fresh ingredients and great ambiance.",
    ],
    bordered: false,
  },
  {
    id: "emily-davis",
    name: "Emily Davis",
    avatar: emilyPhoto,
    avatarShape: "square",
    age: "1 week ago",
    rating: 5,
    lines: ["Just visited the new café downtown.", "Their pastries are to die for!"],
    bordered: true,
  },
  {
    id: "david-smith",
    name: "David Smith",
    avatar: davidPhoto,
    avatarShape: "circle",
    age: "3 days ago",
    rating: 5,
    lines: ["The steakhouse on Main Street has the", "best ribeye I've ever tasted!"],
    bordered: true,
  },
];
