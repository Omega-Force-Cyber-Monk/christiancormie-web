import foodPhoto from "@/features/customer/assets/create-post/1-food-photo.webp";

export const checkInLocations = [
  { id: "downtown", name: "Downtown Food Park" },
  { id: "uptown", name: "Uptown Farmers Market" },
  { id: "riverside", name: "Riverside Bistro" },
  { id: "eastside", name: "Eastside Culinary Corner" },
] as const;

export const tagFriends = [
  { id: "alex", name: "Alex Rivera", initials: "AR" },
  { id: "jessica", name: "Jessica Moore", initials: "JM" },
  { id: "thomas", name: "Thomas Lee", initials: "TL" },
  { id: "sofia", name: "Sofia Ramirez", initials: "SR" },
  { id: "kevin", name: "Kevin Patel", initials: "KP" },
] as const;

export type PostMedia = { id: string; name: string } & (
  { kind: "sample"; src: string } | { kind: "file"; file: File }
);

export type PostDraft = {
  text: string;
  media: PostMedia[];
  locationId: string;
  friendIds: string[];
};

export const emptyPostDraft = (): PostDraft => ({
  text: "",
  media: [],
  locationId: "",
  friendIds: [],
});

// The supplied composer is a sample draft with three photos and four tags.
export const samplePostDraft = (): PostDraft => ({
  text: "",
  media: [1, 2, 3].map((id) => ({
    id: `sample-photo-${id}`,
    name: `Sample food photo ${id}`,
    kind: "sample",
    src: foodPhoto,
  })),
  locationId: "downtown",
  friendIds: ["jessica", "thomas", "sofia", "kevin"],
});
