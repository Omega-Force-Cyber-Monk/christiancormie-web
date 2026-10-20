import person1 from "@/features/vendor/assets/leaderboard/most-points-person-1.webp";
import person2 from "@/features/vendor/assets/leaderboard/most-points-person-2.webp";
import person3 from "@/features/vendor/assets/leaderboard/most-points-person-3.webp";
import person4 from "@/features/vendor/assets/leaderboard/most-points-person-4.webp";
import person5 from "@/features/vendor/assets/leaderboard/most-points-person-5.webp";
import person6 from "@/features/vendor/assets/leaderboard/most-points-person-6.webp";
import person7 from "@/features/vendor/assets/leaderboard/most-points-person-7.webp";

export const vendorLeaderboardTabs = [
  { id: "top-rated", label: "Top Rated" },
  { id: "most-booked", label: "Most Booked" },
  { id: "most-points", label: "Most points" },
] as const;
export type VendorLeaderboardTab = (typeof vendorLeaderboardTabs)[number]["id"];
export interface RankedTruck {
  id: string;
  name: string;
  rating: number;
  distance: number;
  reviews: number;
}
export interface RankedMember {
  id: string;
  name: string;
  points: number;
  portrait: string;
}
// The two truck designs intentionally show the same order and review metrics.
export const vendorRankedTrucks: readonly RankedTruck[] = [
  { id: "burger", name: "Burger Bliss", rating: 4.9, distance: 0.5, reviews: 1234 },
  { id: "pizza", name: "Pizza Wheels", rating: 4.9, distance: 1.2, reviews: 892 },
  { id: "taco", name: "Taco Paradise", rating: 4.8, distance: 0.3, reviews: 2103 },
  { id: "seoul", name: "Seoul Street", rating: 4.7, distance: 0.8, reviews: 756 },
  { id: "vegan", name: "Vegan Vibes", rating: 4.6, distance: 2.1, reviews: 543 },
  { id: "bbq", name: "BBQ Bros", rating: 4.6, distance: 1.5, reviews: 489 },
  { id: "sushi", name: "Sushi Roll", rating: 4.5, distance: 1.8, reviews: 621 },
];
export const vendorRankedMembers: readonly RankedMember[] = [
  { id: "lionel", name: "Lionel Messi", points: 1890, portrait: person1 },
  { id: "serena", name: "Serena Williams", points: 1889, portrait: person2 },
  { id: "michael", name: "Michael Jordan", points: 1850, portrait: person3 },
  { id: "alex", name: "Alex Morgan", points: 1234, portrait: person4 },
  { id: "megan", name: "Megan Rapinoe", points: 1150, portrait: person5 },
  { id: "christen", name: "Christen Press", points: 1100, portrait: person6 },
  { id: "tobin", name: "Tobin Heath", points: 1050, portrait: person7 },
];
export function parseVendorLeaderboardTab(value: string | null): VendorLeaderboardTab {
  return vendorLeaderboardTabs.find((tab) => tab.id === value)?.id ?? "top-rated";
}
export function vendorLeaderboardTabQuery(
  current: URLSearchParams,
  tab: VendorLeaderboardTab,
) {
  const next = new URLSearchParams(current);
  next.set("tab", tab);
  return next;
}
export function adjacentLeaderboardTab(
  tab: VendorLeaderboardTab,
  key: string,
): VendorLeaderboardTab | undefined {
  const index = vendorLeaderboardTabs.findIndex((item) => item.id === tab);
  if (key === "Home") return "top-rated";
  if (key === "End") return "most-points";
  if (key !== "ArrowLeft" && key !== "ArrowRight") return undefined;
  return vendorLeaderboardTabs[(index + (key === "ArrowRight" ? 1 : 2)) % 3].id;
}
