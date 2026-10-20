import foodie from "@/features/customer/assets/profile/1-tier-foodie.svg";
import explorer from "@/features/customer/assets/profile/1-tier-explorer.svg";
import hunter from "@/features/customer/assets/profile/1-tier-drop-hunter.svg";
import legend from "@/features/customer/assets/profile/1-tier-legend.svg";
import shrimp from "@/features/customer/assets/discover/4-gallery-shrimp.webp";
import pastaOne from "@/features/customer/assets/discover/4-gallery-pasta-1.webp";
import pastaTwo from "@/features/customer/assets/discover/4-gallery-pasta-2.webp";
import grill from "@/features/customer/assets/discover/4-gallery-grill.webp";
import pastaThree from "@/features/customer/assets/discover/4-gallery-pasta-3.webp";

// Personal-profile sample from Profile SVGs 1 and 2; separate from verified identity.
export const sampleMemberProfile = {
  id: "alex-rivera",
  name: "Alex Rivera",
  tier: "Drop Hunter",
  points: 2450,
  nextTierPoints: 10000,
  posts: 9,
  following: 9,
  followers: 2,
};

export const memberProfileTiers = [
  { name: "Foodie", points: 0, credit: null, image: foodie },
  { name: "Explorer", points: 500, credit: "$5 credit", image: explorer },
  { name: "Drop Hunter", points: 2000, credit: "$10 credit", image: hunter },
  { name: "BiteDrop Legend", points: 10000, credit: "$25 credit", image: legend },
] as const;

export type MemberProfilePhoto = { id: string; name: string; image: string };
// The SVG's counter says 9 posts but shows eight slots: five photos and three blanks.
export const memberProfilePhotos: (MemberProfilePhoto | null)[] = [
  { id: "shrimp", name: "Grilled shrimp skewers", image: shrimp },
  { id: "pasta-one", name: "Pasta with vegetables", image: pastaOne },
  null,
  { id: "pasta-two", name: "Fresh pasta", image: pastaTwo },
  { id: "grill", name: "Mixed grill", image: grill },
  null,
  null,
  { id: "pasta-three", name: "Penne pasta", image: pastaThree },
];
