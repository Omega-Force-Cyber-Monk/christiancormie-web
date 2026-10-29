import { z } from "zod";
import { remoteAssetUrl } from "./truckAssets.schema";
const priceText = z
  .string()
  .regex(/^\d+(?:\.\d{1,2})?$/)
  .refine(
    (s) => Number(s) <= 9999999999.99,
    "Price exceeds the database amount limit.",
  );
const price = z.union([
  z.number().finite().nonnegative().max(9999999999.99),
  priceText,
]);
export const menuItemSchema = z.object({
  id: z.uuid(),
  categoryId: z.uuid(),
  name: z.string(),
  description: z.string().nullable(),
  imageUrl: z.string().nullable(),
  price,
  status: z.enum(["AVAILABLE", "UNAVAILABLE", "SOLD_OUT"]),
  isVegetarian: z.boolean(),
  isVegan: z.boolean(),
  isGlutenFree: z.boolean(),
  sortOrder: z.number().int(),
});
export const menuCategorySchema = z.object({
  id: z.uuid(),
  menuId: z.uuid(),
  name: z.string(),
  description: z.string().nullable(),
  sortOrder: z.number().int(),
  items: z.array(menuItemSchema),
});
export const menuSchema = z.object({
  id: z.uuid(),
  foodTruckId: z.uuid(),
  name: z.string(),
  description: z.string().nullable(),
  isActive: z.boolean(),
  categories: z.array(menuCategorySchema),
});
export const createItemSchema = z.strictObject({
  name: z.string().trim().min(1).max(255),
  description: z.string().optional(),
  price: z.number().finite().nonnegative().max(9999999999.99),
  imageUrl: remoteAssetUrl.optional(),
  isVegetarian: z.boolean().optional(),
  isVegan: z.boolean().optional(),
  isGlutenFree: z.boolean().optional(),
  sortOrder: z.number().nonnegative().optional(),
});
export const updateItemSchema = createItemSchema
  .partial()
  .extend({ status: z.enum(["AVAILABLE", "UNAVAILABLE", "SOLD_OUT"]).optional() })
  .refine((v) => Object.keys(v).length > 0);
export const createCategorySchema = z.strictObject({
  name: z.string().trim().min(1).max(150),
  description: z.string().optional(),
  sortOrder: z.number().int().min(0).optional(),
});
export const setupMenuSchema = z.strictObject({
  name: z.string().trim().min(1).max(150),
  description: z.string().optional(),
  isActive: z.boolean().optional(),
  categories: z
    .array(
      createCategorySchema.extend({
        items: z
          .array(
            createItemSchema.extend({ sortOrder: z.number().int().min(0).optional() }),
          )
          .min(1),
      }),
    )
    .min(1),
});
export const menuEditorSchema = z.object({
  name: z.string().trim().min(1).max(255),
  description: z.string(),
  price: priceText,
  isVegetarian: z.boolean(),
  isVegan: z.boolean(),
  isGlutenFree: z.boolean(),
  categoryId: z.string(),
  menuName: z.string().trim().max(150),
  categoryName: z.string().trim().max(150),
});
export type RemoteMenu = z.infer<typeof menuSchema>;
export type RemoteMenuItem = z.infer<typeof menuItemSchema>;
export type MenuEditorValues = z.infer<typeof menuEditorSchema>;
