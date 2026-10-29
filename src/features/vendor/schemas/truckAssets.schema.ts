import { z } from "zod";
import { remoteMedia } from "@/utils/files/remoteMedia";
export const remoteAssetUrl = z
  .string()
  .refine((s) => Boolean(remoteMedia(s)), "A confirmed remote image URL is required.");
export const uploadedAssetSchema = z.object({
  url: remoteAssetUrl,
  publicId: z.string().min(1),
  width: z.number().optional(),
  height: z.number().optional(),
  format: z.string(),
  resourceType: z.literal("image"),
  originalFilename: z.string(),
});
export type UploadedAsset = z.infer<typeof uploadedAssetSchema>;
export const galleryImageSchema = z.object({
  id: z.uuid(),
  foodTruckId: z.uuid(),
  imageUrl: z.string(),
  altText: z.string().nullable(),
  sortOrder: z.number().int().nonnegative(),
});
export const galleryImageBodySchema = z.strictObject({
  imageUrl: remoteAssetUrl,
  altText: z.string().max(255).optional(),
  sortOrder: z.number().int().nonnegative().optional(),
});
export const galleryImagePatchSchema = galleryImageBodySchema
  .partial()
  .refine((v) => Object.keys(v).length > 0);
export const galleryMetadataSchema = z.object({
  altText: z.string().max(255),
  sortOrder: z.number().int().min(0),
});
