import topRatedIcon from "@/features/customer/assets/leaderboard/1-top-rated-icon.svg";
import mostBookedIcon from "@/features/customer/assets/leaderboard/2-most-booked-icon.svg";
import mostPointsIcon from "@/features/customer/assets/leaderboard/3-most-points-icon.svg";
import lionel from "@/features/customer/assets/leaderboard/3-points-avatar-1.webp";
import serena from "@/features/customer/assets/leaderboard/3-points-avatar-2.webp";
import michael from "@/features/customer/assets/leaderboard/3-points-avatar-3.webp";
import alex from "@/features/customer/assets/leaderboard/3-points-avatar-4.webp";
import megan from "@/features/customer/assets/leaderboard/3-points-avatar-5.webp";
import christen from "@/features/customer/assets/leaderboard/3-points-avatar-6.webp";
import tobin from "@/features/customer/assets/leaderboard/3-points-avatar-7.webp";

export const leaderboardCategories = [
  { id: "top-rated", label: "Top Rated", icon: topRatedIcon },
  { id: "most-booked", label: "Most Booked", icon: mostBookedIcon },
  { id: "most-points", label: "Most points", icon: mostPointsIcon },
] as const;
export type LeaderboardCategory = (typeof leaderboardCategories)[number]["id"];

export type TruckRanking = {
  kind: "truck";
  id: string;
  name: string;
  rating: number;
  distanceMiles: number;
  reviews: number;
};
export type MemberRanking = {
  kind: "member";
  id: string;
  name: string;
  avatar: string;
  points: number;
};
export type LeaderboardEntry = TruckRanking | MemberRanking;

// Source order is the supplied ranking, including rating ties. No scoring formula is inferred.
const truckRankings: readonly TruckRanking[] = [
  {
    kind: "truck",
    id: "burger-bliss",
    name: "Burger Bliss",
    rating: 4.9,
    distanceMiles: 0.5,
    reviews: 1234,
  },
  {
    kind: "truck",
    id: "pizza-wheels",
    name: "Pizza Wheels",
    rating: 4.9,
    distanceMiles: 1.2,
    reviews: 892,
  },
  {
    kind: "truck",
    id: "taco-paradise",
    name: "Taco Paradise",
    rating: 4.8,
    distanceMiles: 0.3,
    reviews: 2103,
  },
  {
    kind: "truck",
    id: "seoul-street",
    name: "Seoul Street",
    rating: 4.7,
    distanceMiles: 0.8,
    reviews: 756,
  },
  {
    kind: "truck",
    id: "vegan-vibes",
    name: "Vegan Vibes",
    rating: 4.6,
    distanceMiles: 2.1,
    reviews: 543,
  },
  {
    kind: "truck",
    id: "bbq-bros",
    name: "BBQ Bros",
    rating: 4.6,
    distanceMiles: 1.5,
    reviews: 489,
  },
  {
    kind: "truck",
    id: "sushi-roll",
    name: "Sushi Roll",
    rating: 4.5,
    distanceMiles: 1.8,
    reviews: 621,
  },
];
const pointRankings: readonly MemberRanking[] = [
  {
    kind: "member",
    id: "lionel-messi",
    name: "Lionel Messi",
    avatar: lionel,
    points: 1890,
  },
  {
    kind: "member",
    id: "serena-williams",
    name: "Serena Williams",
    avatar: serena,
    points: 1889,
  },
  {
    kind: "member",
    id: "michael-jordan",
    name: "Michael Jordan",
    avatar: michael,
    points: 1850,
  },
  {
    kind: "member",
    id: "alex-morgan",
    name: "Alex Morgan",
    avatar: alex,
    points: 1234,
  },
  {
    kind: "member",
    id: "megan-rapinoe",
    name: "Megan Rapinoe",
    avatar: megan,
    points: 1150,
  },
  {
    kind: "member",
    id: "christen-press",
    name: "Christen Press",
    avatar: christen,
    points: 1100,
  },
  {
    kind: "member",
    id: "tobin-heath",
    name: "Tobin Heath",
    avatar: tobin,
    points: 1050,
  },
];

export function parseLeaderboardCategory(value: string | null): LeaderboardCategory {
  return (
    leaderboardCategories.find((category) => category.id === value)?.id ?? "top-rated"
  );
}

export function getLeaderboardKeyboardCategory(
  current: LeaderboardCategory,
  key: string,
): LeaderboardCategory | null {
  const index = leaderboardCategories.findIndex((item) => item.id === current);
  if (key === "Home") return leaderboardCategories[0].id;
  if (key === "End") return leaderboardCategories[leaderboardCategories.length - 1].id;
  if (key === "ArrowRight")
    return leaderboardCategories[(index + 1) % leaderboardCategories.length].id;
  if (key === "ArrowLeft")
    return leaderboardCategories[
      (index - 1 + leaderboardCategories.length) % leaderboardCategories.length
    ].id;
  return null;
}

export function getLeaderboardRankings(category: LeaderboardCategory) {
  // Most Booked repeats Top Rated's rows and review counts in its SVG.
  const entries: readonly LeaderboardEntry[] =
    category === "most-points" ? pointRankings : truckRankings;
  return entries.map((entry, index) => ({ ...entry, rank: index + 1 }));
}
