import { z } from "zod";
import type { RootState } from "@/app/store";
import { baseApi } from "@/services/api/baseApi";
import {
  scopedRead,
  sessionFlight,
  sessionDenied,
  type SessionScope,
} from "@/services/api/sessionGuard";
import { invalidContract } from "@/services/api/validatedQuery";
import { ownedTruck, truckWriteTags } from "./truckSettings.api";
import {
  menuSchema,
  menuCategorySchema,
  menuItemSchema,
  setupMenuSchema,
  createCategorySchema,
  createItemSchema,
  updateItemSchema,
} from "../schemas/truckMenu.schema";
type TruckScope = { scope: SessionScope; truckId: string };
export const truckMenuApi = baseApi.injectEndpoints({
  endpoints: (b) => ({
    setupTruckMenu: b.mutation<
      z.infer<typeof menuSchema>,
      TruckScope & { body: unknown }
    >({
      queryFn: ({ scope, truckId, body }, a, _e, q) =>
        sessionFlight(a, scope, `menu-setup:${truckId}`, () => {
          const truck = ownedTruck(a.getState() as RootState, scope, truckId);
          if (!truck || truck.menus === undefined || truck.menus.length)
            return Promise.resolve(sessionDenied);
          const parsed = setupMenuSchema.safeParse(body);
          return parsed.success
            ? scopedRead(
                a,
                scope,
                q,
                {
                  url: `/food-trucks/${truckId}/menus/basic`,
                  method: "POST",
                  body: parsed.data,
                },
                menuSchema.refine(
                  (r) =>
                    r.foodTruckId === truckId &&
                    r.categories.every(
                      (c) =>
                        c.menuId === r.id &&
                        c.items.every((i) => i.categoryId === c.id),
                    ),
                ),
              )
            : Promise.resolve(invalidContract);
        }),
      invalidatesTags: (r) => (r ? [...truckWriteTags] : []),
    }),
    createTruckMenuCategory: b.mutation<
      z.infer<typeof menuCategorySchema>,
      TruckScope & { menuId: string; body: unknown }
    >({
      queryFn: ({ scope, truckId, menuId, body }, a, _e, q) =>
        sessionFlight(a, scope, `category-create:${menuId}`, () => {
          if (
            !z.uuid().safeParse(menuId).success ||
            !ownedTruck(a.getState() as RootState, scope, truckId)?.menus?.some(
              (m) => m.id === menuId,
            )
          )
            return Promise.resolve(sessionDenied);
          const parsed = createCategorySchema.safeParse(body);
          return parsed.success
            ? scopedRead(
                a,
                scope,
                q,
                {
                  url: `/food-trucks/${truckId}/menus/${menuId}/categories`,
                  method: "POST",
                  body: parsed.data,
                },
                menuCategorySchema.refine(
                  (r) =>
                    r.menuId === menuId && r.items.every((i) => i.categoryId === r.id),
                ),
              )
            : Promise.resolve(invalidContract);
        }),
      invalidatesTags: (r) => (r ? [...truckWriteTags] : []),
    }),
    createTruckMenuItem: b.mutation<
      z.infer<typeof menuItemSchema>,
      TruckScope & { categoryId: string; body: unknown }
    >({
      queryFn: ({ scope, truckId, categoryId, body }, a, _e, q) =>
        sessionFlight(a, scope, `item-create:${categoryId}`, () => {
          if (
            !z.uuid().safeParse(categoryId).success ||
            !ownedTruck(a.getState() as RootState, scope, truckId)?.menus?.some((m) =>
              m.categories.some((c) => c.id === categoryId),
            )
          )
            return Promise.resolve(sessionDenied);
          const parsed = createItemSchema.safeParse(body);
          return parsed.success
            ? scopedRead(
                a,
                scope,
                q,
                {
                  url: `/food-trucks/${truckId}/menu-categories/${categoryId}/items`,
                  method: "POST",
                  body: parsed.data,
                },
                menuItemSchema.refine((r) => r.categoryId === categoryId),
              )
            : Promise.resolve(invalidContract);
        }),
      invalidatesTags: (r) => (r ? [...truckWriteTags] : []),
    }),
    updateTruckMenuItem: b.mutation<
      z.infer<typeof menuItemSchema>,
      TruckScope & { itemId: string; body: unknown }
    >({
      queryFn: ({ scope, truckId, itemId, body }, a, _e, q) =>
        sessionFlight(a, scope, `menu-item:${itemId}`, () => {
          const item = ownedTruck(a.getState() as RootState, scope, truckId)
            ?.menus?.flatMap((m) => m.categories)
            .flatMap((c) => c.items)
            .find((i) => i.id === itemId);
          if (!item || !z.uuid().safeParse(itemId).success)
            return Promise.resolve(sessionDenied);
          const parsed = updateItemSchema.safeParse(body);
          return parsed.success
            ? scopedRead(
                a,
                scope,
                q,
                {
                  url: `/food-trucks/${truckId}/menu-items/${itemId}`,
                  method: "PATCH",
                  body: parsed.data,
                },
                menuItemSchema.refine(
                  (r) => r.id === itemId && r.categoryId === item.categoryId,
                ),
              )
            : Promise.resolve(invalidContract);
        }),
      invalidatesTags: (r) => (r ? [...truckWriteTags] : []),
    }),
  }),
});
export const {
  useSetupTruckMenuMutation,
  useCreateTruckMenuCategoryMutation,
  useCreateTruckMenuItemMutation,
  useUpdateTruckMenuItemMutation,
} = truckMenuApi;
