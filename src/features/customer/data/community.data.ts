import anthonyAvatar from "@/features/customer/assets/community/community-anthony-avatar.jpg";
import sarahAvatar from "@/features/customer/assets/profile/profile-review-david-smith.jpg";
import calloutImage from "@/features/customer/assets/community/community-callout-food.jpg";
import type { FileUploadItemValue } from "@/components/forms/FileUpload/file-upload.types";
import type { CommunityComposerValues } from "@/features/customer/schemas/community.schema";

export const communityCategories = [
  "All",
  "Community",
  "Need a truck",
  "Callout",
  "For sale",
] as const;
export type CommunityCategory =
  | Exclude<(typeof communityCategories)[number], "All">
  | "Hiring / jobs"
  | "Community help";
export type CommunityPost = {
  id: string;
  author: string;
  avatar?: string;
  badge?: "Explorer" | "BiteDrop Legend" | "Local preview";
  age: string;
  city: string;
  category: CommunityCategory;
  body: string[];
  image?: string;
  likes: number;
  comments: number;
  own: boolean;
  status?: "Ongoing" | "Posted" | "Requested" | "Completed";
  attachments?: FileUploadItemValue[];
  composerValues?: CommunityComposerValues;
  acceptedQuoteId?: string;
  issue?: string;
  ignoredQuoteIds?: string[];
  callout?: {
    title: string;
    venue: string;
    date: string;
    expected: string;
    spots: number;
    interested: number;
  };
  request?: {
    occasion: string;
    date: string;
    location: string;
    guests: string;
    budget: string;
    offers: number;
  };
};

// Supplied Figma samples; dates, locations, activity, and offers are not live records.
export const communityPosts: CommunityPost[] = [
  {
    id: "fiesta-meetup",
    author: "Anthony R.",
    avatar: anthonyAvatar,
    badge: "Explorer",
    age: "2h",
    city: "San Antonio, TX",
    category: "Community",
    body: ["Anyone going to the Fiesta music fest this", "weekend? Let's meet up!"],
    likes: 14,
    comments: 8,
    own: false,
  },
  {
    id: "birthday-truck-request",
    author: "Sarah Johnson",
    avatar: sarahAvatar,
    age: "2 hours ago",
    city: "San Antonio, TX",
    category: "Need a truck",
    body: [
      "Looking for a taco truck for my",
      "daughter's 10th birthday! Preference for",
      "vegetarian options.",
    ],
    likes: 0,
    comments: 0,
    own: false,
    request: {
      occasion: "Birthday Party",
      date: "May 25, 2026",
      location: "Golden Gate Park",
      guests: "50",
      budget: "$500-800",
      offers: 2,
    },
  },
  {
    id: "pearl-brewery-callout",
    author: "Sarah M.",
    badge: "BiteDrop Legend",
    age: "1d",
    city: "San Antonio, TX",
    category: "Callout",
    body: [
      "Pearl Brewery hosting food truck night June 5th! 4 spots",
      "available, expected 500+ attendees. Proper permits",
      "required.",
    ],
    image: calloutImage,
    likes: 24,
    comments: 15,
    own: false,
  },
];
