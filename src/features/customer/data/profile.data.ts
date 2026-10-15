import avatar from "@/features/customer/assets/profile/profile-taco-paradise-avatar.png";
import fish from "@/features/customer/assets/profile/profile-baja-fish-taco.jpg";
import shrimp from "@/features/customer/assets/profile/profile-shrimp-taco.jpg";
import carnitas from "@/features/customer/assets/profile/profile-carnitas-taco.jpg";
import mushroom from "@/features/customer/assets/profile/profile-mushroom-taco.jpg";

export type ProfileMenuItem = {
  id: string;
  name: string;
  description: string;
  priceCents: number;
  image: string;
};

// The only complete profile supplied by Figma. All values are static samples.
export const sampleTruckProfile = {
  id: "taco-paradise",
  name: "Taco Paradise",
  cuisine: "Mexican Street Food",
  avatar,
  followers: "12.5K",
  checkIns: "16.5K",
  reviewCount: 102,
  location: "Union Square, SF",
  hours: "Open until 9:00 PM",
  capacity: "200+ guests serve capacity",
  offer: "20% off all orders before 2PM",
  distance: "0.3 mi",
  rating: "4.8",
};

export const profileMenu: ProfileMenuItem[] = [
  {
    id: "baja-fish-taco",
    name: "Baja Fish Taco",
    description: "Beer-battered fish, cabbage slaw, lime crema",
    priceCents: 450,
    image: fish,
  },
  {
    id: "shrimp-taco",
    name: "Shrimp Taco",
    description: "Grilled shrimp, avocado, chipotle mayo",
    priceCents: 500,
    image: shrimp,
  },
  {
    id: "carnitas-taco",
    name: "Carnitas Taco",
    description: "Slow-cooked pork, onions, cilantro",
    priceCents: 425,
    image: carnitas,
  },
  {
    id: "mushroom-taco",
    name: "Mushroom Taco",
    description: "Sauteed mushrooms, garlic, queso fresco",
    priceCents: 400,
    image: mushroom,
  },
  {
    id: "chicken-taco",
    name: "Chicken Taco",
    description: "Grilled chicken, salsa verde, lettuce",
    priceCents: 475,
    image: fish,
  },
];
