import {
  communityPosts,
  type CommunityPost,
} from "@/features/customer/data/community.data";
import sushiImage from "@/features/customer/assets/discover/discover-sushi-truck.png";
import pizzaImage from "@/features/customer/assets/discover/discover-yellow-truck.png";

const birthday = communityPosts.find((post) => post.request);
export const communityMyRequests: CommunityPost[] = birthday
  ? [
      ...(["Ongoing", "Posted", "Requested"] as const).map((status, index) => ({
        ...birthday,
        id: `my-request-${index + 1}`,
        author: "You",
        body: [
          "Looking for a taco truck for my daughter's 10th birthday! Preference for vegetarian options.",
        ],
        own: true,
        status,
        acceptedQuoteId: status === "Ongoing" ? "quote-2" : undefined,
      })),
      {
        id: "my-block-party",
        author: "Jennifer Martinez",
        age: "2 hours ago",
        city: "San Antonio, TX",
        category: "Callout",
        own: true,
        body: [
          "Annual community celebration with live music, kids activities, and local vendors. Expecting 2,000+ attendees throughout the day. Perfect opportunity for food trucks to showcase their specialties!",
        ],
        likes: 0,
        comments: 0,
        callout: {
          title: "Downtown Summer Block Party",
          date: "June 15, 2026 · 11AM – 8PM",
          venue: "Market Street Plaza, Downtown SF",
          expected: "2,000 – 2,500 people",
          spots: 6,
          interested: 12,
        },
      },
    ]
  : [];

export type CommunityInterestedTruck = {
  id: string;
  name: string;
  cuisine: string;
  rating: string;
  distance: string;
  image: string;
  description: string;
};
export const communityInterestedTrucks: CommunityInterestedTruck[] = [
  "sushi-1",
  "sushi-2",
].map((id) => ({
  id,
  name: "Sushi Haven",
  cuisine: "Japanese",
  rating: "4.7",
  distance: "1.2 mi",
  image: sushiImage,
  description:
    "We're the #1 food truck in the city, with over 5 years of experience serving delicious, high-quality food. We are committed to providing fresh ingredients, great taste, and an unforgettable food experience for every customer.",
}));

export type CommunityQuote = {
  id: string;
  name: string;
  cuisine: string;
  image: string;
  totalCents: number;
  travelCents: number;
  depositCents: number;
  menus: string[];
};
// Preserve the two displayed quote totals. Other SVG totals disagree, so balances
// are derived from the selected quote; deposits stay explicit sample amounts.
export const communityQuotes: CommunityQuote[] = [108000, 125000].map(
  (totalCents, index) => ({
    id: `quote-${index + 1}`,
    name: "Pizza Palace Mobile",
    cuisine: "Wood-Fired Pizza",
    image: pizzaImage,
    totalCents,
    travelCents: 5000,
    depositCents: 24000,
    menus: [
      "Personal Veggie Pizzas",
      "Garlic Breadsticks",
      "Caesar Salad Cups",
      "Gelato Cups",
    ],
  }),
);
export const communityMoney = (cents: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
    minimumFractionDigits: cents % 100 ? 2 : 0,
  }).format(cents / 100);
