const artwork = import.meta.glob<string>("../assets/discover/*", {
  eager: true,
  query: "?url",
  import: "default",
});

export const discoverArtwork = (name: string) => artwork[`../assets/discover/${name}`];

export const eventTypes = [
  { name: "Birthday Party", image: "birthday" },
  { name: "Corporate Event", image: "corporate" },
  { name: "Wedding", image: "wedding" },
  { name: "Private Party", image: "private" },
  { name: "Other", image: "other" },
] as const;

export const bookingMenus = [
  { name: "Tacos", image: "tacos" },
  { name: "Burgers", image: "burgers" },
  { name: "Pizza", image: "pizza" },
  { name: "BBQ", image: "bbq" },
  { name: "Asian Cuisine", image: "asian" },
  { name: "Vegan Options", image: "vegan" },
  { name: "Vegetarian", image: "vegetarian" },
  { name: "Seafood", image: "seafood" },
  { name: "Desserts", image: "desserts" },
  { name: "Beverages", image: "beverages" },
  { name: "Sandwiches", image: "sandwiches" },
  { name: "Pasta", image: "pasta" },
] as const;

export const paymentPreferences = [
  {
    value: "deposit",
    label: "Deposit only",
    description: "Pay deposit now, rest at event",
    badge: "Popular",
  },
  {
    value: "full",
    label: "Prepaid in full",
    description: "Pay everything upfront",
    badge: "Best value",
  },
  {
    value: "none",
    label: "No preference",
    description: "Let vendor decide",
    badge: null,
  },
] as const;

export const discoverGallery = [
  { name: "Grilled shrimp", image: "4-gallery-shrimp.webp" },
  { name: "Pasta with vegetables", image: "4-gallery-pasta-1.webp" },
  null,
  { name: "Fresh pasta", image: "4-gallery-pasta-2.webp" },
  { name: "Mixed grill", image: "4-gallery-grill.webp" },
  null,
  null,
  { name: "Penne pasta", image: "4-gallery-pasta-3.webp" },
];
