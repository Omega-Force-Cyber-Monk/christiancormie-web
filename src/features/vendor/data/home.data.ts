import corporateHost from "@/features/vendor/assets/home/Home-corporate-host.webp";
import blockPartyHost from "@/features/vendor/assets/home/Home-block-party-host.webp";

export type VendorHomeBooking = {
  id: string;
  title: string;
  status: "Confirmed" | "Pending";
  venue: string;
  when: string;
  guests: number;
  amount: number;
  avatar: string;
};
export const vendorHomeBookings: readonly VendorHomeBooking[] = [
  {
    id: "corporate-lunch",
    title: "Corporate Lunch",
    status: "Confirmed",
    venue: "Google HQ",
    when: "Today, 11:30 AM",
    guests: 80,
    amount: 1200,
    avatar: corporateHost,
  },
  {
    id: "block-party",
    title: "Block Party",
    status: "Pending",
    venue: "San Jose, CA",
    when: "Fri, Jul 19",
    guests: 200,
    amount: 800,
    avatar: blockPartyHost,
  },
];
export const vendorHomeActivity = [
  { id: "like", kind: "like", text: "Alex T. liked your drop", age: "2m ago" },
  {
    id: "comment",
    kind: "comment",
    text: "Alex T. Commented your post",
    age: "2m ago",
  },
  {
    id: "booking",
    kind: "booking",
    text: "New booking request from Sarah M.",
    age: "14m ago",
  },
  {
    id: "review-request",
    kind: "review-request",
    text: "Sarah is requesting to write a review",
    age: "1h ago",
  },
  {
    id: "review",
    kind: "review",
    text: "You received a 5-star review!",
    age: "2h ago",
  },
] as const;

export const vendorHomePreviewDescriptions: Record<string, string> = {
  Feed: "The Vendor Feed is outside this Home preview. No posts are loaded or changed here.",
  Drops:
    "Drop management is outside this Home preview. No promotions are created or sent.",
  "Create post":
    "The full Vendor post composer is outside this Home preview. Use Post Update on Home to compose a local text update.",
  Message:
    "Vendor messaging is not connected in this Home preview. No messages are sent.",
  "Earnings & Analytics":
    "Earnings and analytics require account data and are not connected in this Home preview. No earnings figures are simulated.",
  Profile:
    "Hello Taco and San Francisco are sample Vendor details from the design. Your account profile is not changed.",
  Settings:
    "Vendor settings are outside this Home preview. Your account settings are not changed.",
};
