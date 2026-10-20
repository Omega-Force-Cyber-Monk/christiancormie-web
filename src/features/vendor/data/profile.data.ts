import truck from "@/features/vendor/assets/profile/profile-truck.webp";
import tag from "@/features/vendor/assets/profile/profile-promo-tag.webp";
import taco from "@/features/vendor/assets/profile/profile-baja-taco.webp";
import verified from "@/features/vendor/assets/profile/profile-verified.svg";
import skewers from "@/features/vendor/assets/profile/profile-2-skewers.webp";
import pasta1 from "@/features/vendor/assets/profile/profile-2-pasta-1.webp";
import pasta2 from "@/features/vendor/assets/profile/profile-2-pasta-2.webp";
import grill from "@/features/vendor/assets/profile/profile-2-grill.webp";
import pasta3 from "@/features/vendor/assets/profile/profile-2-pasta-3.webp";
import sarah from "@/features/vendor/assets/profile/profile-3-sarah.webp";
import michael from "@/features/vendor/assets/profile/profile-3-michael.webp";
import emily from "@/features/vendor/assets/profile/profile-3-emily.webp";
import david from "@/features/vendor/assets/profile/profile-3-david.webp";
import tacos from "@/features/vendor/assets/profile/edit-profile-cuisine-tacos.webp";
import bbq from "@/features/vendor/assets/profile/edit-profile-cuisine-bbq.webp";
import burgers from "@/features/vendor/assets/profile/edit-profile-cuisine-burgers.webp";
import pizza from "@/features/vendor/assets/profile/edit-profile-cuisine-pizza.webp";
import asian from "@/features/vendor/assets/profile/edit-profile-cuisine-asian.webp";
import seafood from "@/features/vendor/assets/profile/edit-profile-cuisine-seafood.webp";
import vegan from "@/features/vendor/assets/profile/edit-profile-cuisine-vegan.webp";
import desserts from "@/features/vendor/assets/profile/edit-profile-cuisine-desserts.webp";
import wings from "@/features/vendor/assets/profile/edit-profile-cuisine-wings.webp";
import hawaiian from "@/features/vendor/assets/profile/edit-profile-cuisine-hawaiian.webp";
import mediterranean from "@/features/vendor/assets/profile/edit-profile-cuisine-mediterranean.webp";
import breakfast from "@/features/vendor/assets/profile/edit-profile-cuisine-breakfast.webp";
export type ProfilePhotoSource = string | File;
export const profileArtwork = { truck, tag, taco, verified };
export const profileDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;
export const profileCapacityOptions = [
  "Under 25",
  "25-50",
  "51-100",
  "101-200",
  "201-500",
  "500+",
] as const;
export const profileCuisineOptions = [
  { id: "tacos", label: "Tacos & Mexican", image: tacos },
  { id: "bbq", label: "BBQ & Grills", image: bbq },
  { id: "burgers", label: "Burgers", image: burgers },
  { id: "pizza", label: "Pizza", image: pizza },
  { id: "asian", label: "Asian Fusion", image: asian },
  { id: "seafood", label: "Seafood", image: seafood },
  { id: "vegan", label: "Vegan & Health", image: vegan },
  { id: "desserts", label: "Desserts", image: desserts },
  { id: "wings", label: "Wings", image: wings },
  { id: "hawaiian", label: "Hawaiian", image: hawaiian },
  { id: "mediterranean", label: "Mediterranean", image: mediterranean },
  { id: "breakfast", label: "Breakfast", image: breakfast },
] as const;
export const profileFixture = {
  name: "Taco Paradise",
  handle: "tacoparadise",
  motto: "Mexican Street Food",
  location: "Union Square, SF",
  capacity: "201-500",
  cuisines: ["tacos"],
  hours: profileDays.map((day, index) => ({
    day,
    enabled: index !== 6,
    opens: "11:00",
    closes: index === 4 || index === 5 ? "23:00" : "21:00",
  })),
};
export type ProfileMenuItem = {
  id: string;
  name: string;
  priceCents: number;
  description: string;
  photo?: ProfilePhotoSource;
  available: boolean;
};
export const profileMenuFixture: ProfileMenuItem[] = Array.from(
  { length: 4 },
  (_, i) => ({
    id: `baja-${i + 1}`,
    name: "Baja Fish Taco",
    priceCents: 499,
    description: "Beer-battered fish, cabbage slaw, lime crema",
    photo: taco,
    available: i !== 0,
  }),
);
export const profileGallery = [
  { id: "skewers", source: skewers, alt: "Grilled skewers with vegetables" },
  { id: "pasta-1", source: pasta1, alt: "Penne pasta with tomatoes and herbs" },
  null,
  { id: "pasta-2", source: pasta2, alt: "Penne pasta on a white plate" },
  { id: "grill", source: grill, alt: "Grilled steak, potatoes and vegetables" },
  null,
  null,
  { id: "pasta-3", source: pasta3, alt: "Penne pasta in a bowl" },
  null,
];
export const profileReviews = [
  {
    id: "sarah",
    name: "Sarah Johnson",
    photo: sarah,
    round: false,
    text: "Best tacos in SF! The fish taco is absolutely incredible.",
  },
  {
    id: "michael",
    name: "Michael Lee",
    photo: michael,
    round: true,
    text: "The new sushi place is a game changer! Fresh ingredients and great ambiance.",
  },
  {
    id: "emily",
    name: "Emily Davis",
    photo: emily,
    round: false,
    text: "Just visited the new café downtown. Their pastries are to die for!",
  },
  {
    id: "david",
    name: "David Smith",
    photo: david,
    round: true,
    text: "The steakhouse on Main Street has the best ribeye I've ever tasted!",
  },
];
