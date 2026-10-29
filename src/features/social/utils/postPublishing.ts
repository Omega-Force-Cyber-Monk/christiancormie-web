import {
  createSocialPostSchema,
  type UploadedMedia,
} from "../schemas/socialFeed.schema";
export function validPostFile(file: File): string | null {
  if (!["image/jpeg", "image/png"].includes(file.type))
    return "Only JPG and PNG images are accepted.";
  if (file.size === 0 || file.size > 10 * 1024 * 1024)
    return "Each image must be nonempty and at most 10 MB.";
  return null;
}
export function postPayload(
  draft: { text: string; locationId?: string; friendIds?: string[] },
  media: UploadedMedia[],
  foodTruckId?: string,
) {
  return createSocialPostSchema.parse({
    content: draft.text.trim(),
    status: "PUBLISHED",
    ...(draft.locationId ? { locationId: draft.locationId } : {}),
    ...(draft.friendIds?.length
      ? { taggedUserIds: [...new Set(draft.friendIds)] }
      : {}),
    ...(foodTruckId ? { foodTruckId } : {}),
    ...(media.length
      ? { media: media.map((item, index) => ({ ...item, sortOrder: index })) }
      : {}),
  });
}
