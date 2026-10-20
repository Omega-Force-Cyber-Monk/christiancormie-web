import tacos from "@/features/vendor/assets/create-posts/posts-truck-request-tacos.webp";
import burgers from "@/features/vendor/assets/create-posts/posts-truck-request-burgers.webp";
import pizza from "@/features/vendor/assets/create-posts/posts-truck-request-pizza.webp";
import bbq from "@/features/vendor/assets/create-posts/posts-truck-request-bbq.webp";
import asian from "@/features/vendor/assets/create-posts/posts-truck-request-asian.webp";
import vegan from "@/features/vendor/assets/create-posts/posts-truck-request-vegan.webp";
import vegetarian from "@/features/vendor/assets/create-posts/posts-truck-request-vegetarian.webp";
import seafood from "@/features/vendor/assets/create-posts/posts-truck-request-seafood.webp";
import desserts from "@/features/vendor/assets/create-posts/posts-truck-request-desserts.webp";
import beverages from "@/features/vendor/assets/create-posts/posts-truck-request-beverages.webp";
import sandwiches from "@/features/vendor/assets/create-posts/posts-truck-request-sandwiches.webp";
import pasta from "@/features/vendor/assets/create-posts/posts-truck-request-pasta.webp";

export const vendorPostCategories = [
  {
    id: "truck",
    title: "Need a truck",
    heading: "Post truck request",
    description: "Hiring for your event",
    color: "#3B82F6",
  },
  {
    id: "callout",
    title: "Vendor callout",
    heading: "Vendor callout",
    description: "Offering spots at an event",
    color: "#FF9900",
  },
  {
    id: "sale",
    title: "For sale",
    heading: "For sale",
    description: "Selling equipment or truck",
    color: "#8B5CF6",
  },
  {
    id: "jobs",
    title: "Hiring / jobs",
    heading: "Hiring / jobs",
    description: "Jobs & work opportunities",
    color: "#00BD87",
  },
  {
    id: "help",
    title: "Community help",
    heading: "Community help",
    description: "Events, news, general chat",
    color: "#FF5B5B",
  },
  {
    id: "community",
    title: "Community",
    heading: "Community",
    description: "Events, news, general chat",
    color: "#FF801F",
  },
] as const;
export type VendorPostCategory = (typeof vendorPostCategories)[number]["id"];
export type GeneralPostCategory = Exclude<VendorPostCategory, "truck">;
export const getVendorPostCategory = (id: string | null) =>
  vendorPostCategories.find((c) => c.id === id);
export const communityFormCopy = {
  callout: {
    description:
      "You're hosting an event and offering spots for food trucks to set up and sell independently. You don't pay them - they keep their own sales and get the exposure.",
    label: "Describe your post",
    placeholder: "Event name, date, venue...",
  },
  sale: {
    description:
      "Selling equipment or a truck? List it here so other vendors in your area can find it. Contact is handled through the app.",
    label: "Item description",
    placeholder: "Condition, age, reason for selling...",
  },
  jobs: {
    description:
      "Connect with the local food truck community - post a job opening or let vendors know you're available.",
    label: "Describe your post",
    placeholder: "Role, requirements, pay...",
  },
  community: {
    description:
      "Share events, fliers, news, or anything relevant to the local food truck scene. No form needed - just post and go.",
    label: "What's on your mind?",
    placeholder: "Share events, news, or anything...",
  },
  help: {
    description:
      "Share events, fliers, news, or anything relevant to the local food truck scene. No form needed - just post and go.",
    label: "What's on your mind?",
    placeholder: "Share events, news, or anything...",
  },
} satisfies Record<
  GeneralPostCategory,
  { description: string; label: string; placeholder: string }
>;
export const truckMenuOptions = [
  { label: "Tacos", image: tacos },
  { label: "Burgers", image: burgers },
  { label: "Pizza", image: pizza },
  { label: "BBQ", image: bbq },
  { label: "Asian Cuisine", image: asian },
  { label: "Vegan Options", image: vegan },
  { label: "Vegetarian", image: vegetarian },
  { label: "Seafood", image: seafood },
  { label: "Desserts", image: desserts },
  { label: "Beverages", image: beverages },
  { label: "Sandwiches", image: sandwiches },
  { label: "Pasta", image: pasta },
];
export const truckEventTypes = [
  "Birthday Party",
  "Corporate Event",
  "Wedding",
  "Private Party",
  "Other",
] as const;
