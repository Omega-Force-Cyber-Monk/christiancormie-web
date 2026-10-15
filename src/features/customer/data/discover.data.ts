import mapImage from "@/features/customer/assets/discover/discover-map.png";
import tacoImage from "@/features/customer/assets/discover/discover-taco-truck.png";
import sushiImage from "@/features/customer/assets/discover/discover-sushi-truck.png";
import pastaImage from "@/features/customer/assets/discover/discover-pasta-truck.jpg";
import greenTruck from "@/features/customer/assets/discover/discover-green-truck.png";
import yellowTruck from "@/features/customer/assets/discover/discover-yellow-truck.png";

export type DiscoverTruck = {
  id: string;
  name: string;
  cuisine: string;
  distance: number;
  stars: number;
  rating?: number;
  image: string;
  suggestedImage?: string;
  featured?: boolean;
  offer?: boolean;
  online?: boolean;
};

// Figma sample listings only; these are not live businesses or availability.
export const discoverTrucks: DiscoverTruck[] = [
  {
    id: "taco-paradise",
    name: "Taco Paradise",
    cuisine: "Mexican",
    distance: 0.3,
    stars: 5,
    rating: 4.8,
    image: greenTruck,
    suggestedImage: tacoImage,
    featured: true,
    offer: true,
    online: true,
  },
  {
    id: "sushi-haven",
    name: "Sushi Haven",
    cuisine: "Japanese",
    distance: 1.2,
    stars: 4,
    rating: 4.7,
    image: yellowTruck,
    suggestedImage: sushiImage,
    online: false,
  },
  {
    id: "pasta-villa",
    name: "Pasta Villa",
    cuisine: "Italian",
    distance: 2,
    stars: 5,
    rating: 4.6,
    image: pastaImage,
    featured: true,
    online: true,
  },
  {
    id: "curry-house",
    name: "Curry House",
    cuisine: "Indian",
    distance: 0.8,
    stars: 5,
    image: yellowTruck,
  },
  {
    id: "pasta-palace",
    name: "Pasta Palace",
    cuisine: "Italian",
    distance: 1.2,
    stars: 5,
    image: greenTruck,
  },
  {
    id: "sushi-spot",
    name: "Sushi Spot",
    cuisine: "Japanese",
    distance: 0.5,
    stars: 5,
    image: greenTruck,
  },
  {
    id: "taco-town",
    name: "Taco Town",
    cuisine: "Mexican",
    distance: 1,
    stars: 4,
    image: greenTruck,
  },
];

export const suggestedTruckIds = ["taco-paradise", "sushi-haven", "pasta-villa"];
export const trendingTruckIds = [
  "taco-paradise",
  "sushi-haven",
  "curry-house",
  "pasta-palace",
  "sushi-spot",
  "taco-town",
];
export const discoverMapImage = mapImage;

export const discoverMapPins = [
  { id: "taco-paradise", left: "55.4%", top: "42.1%" },
  { id: "sushi-haven", left: "51.3%", top: "59%" },
  { id: "pasta-villa", left: "39%", top: "46.5%" },
];
