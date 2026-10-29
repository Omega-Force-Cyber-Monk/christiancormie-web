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
import { validAccountImage } from "@/features/account/utils/accountAdapters";
import { ownedTruck, truckWriteTags } from "./truckSettings.api";
import {
  uploadedAssetSchema,
  galleryImageSchema,
  galleryImageBodySchema,
  galleryImagePatchSchema,
} from "../schemas/truckAssets.schema";
type TruckScope = { scope: SessionScope; truckId: string };
export const truckAssetsApi = baseApi.injectEndpoints({
  endpoints: (b) => ({
    uploadTruckAsset: b.mutation<
      z.infer<typeof uploadedAssetSchema>,
      TruckScope & { file: File }
    >({
      queryFn: ({ scope, truckId, file }, a, _e, q) =>
        sessionFlight(a, scope, `upload:${truckId}`, () => {
          if (!ownedTruck(a.getState() as RootState, scope, truckId))
            return Promise.resolve(sessionDenied);
          if (validAccountImage(file)) return Promise.resolve(invalidContract);
          const body = new FormData();
          body.append("file", file, file.name);
          return scopedRead(
            a,
            scope,
            q,
            { url: "/vendors/me/onboarding/upload", method: "POST", body },
            uploadedAssetSchema,
          );
        }),
    }),
    addTruckImage: b.mutation<
      z.infer<typeof galleryImageSchema>,
      TruckScope & { body: unknown }
    >({
      queryFn: ({ scope, truckId, body }, a, _e, q) =>
        sessionFlight(a, scope, `gallery-add:${truckId}`, () => {
          if (!ownedTruck(a.getState() as RootState, scope, truckId))
            return Promise.resolve(sessionDenied);
          const parsed = galleryImageBodySchema.safeParse(body);
          return parsed.success
            ? scopedRead(
                a,
                scope,
                q,
                {
                  url: `/food-trucks/${truckId}/images`,
                  method: "POST",
                  body: parsed.data,
                },
                galleryImageSchema.refine((r) => r.foodTruckId === truckId),
              )
            : Promise.resolve(invalidContract);
        }),
      invalidatesTags: (r) => (r ? [...truckWriteTags] : []),
    }),
    updateTruckImage: b.mutation<
      z.infer<typeof galleryImageSchema>,
      TruckScope & { imageId: string; body: unknown }
    >({
      queryFn: ({ scope, truckId, imageId, body }, a, _e, q) =>
        sessionFlight(a, scope, `gallery:${imageId}`, () => {
          if (
            !ownedTruck(a.getState() as RootState, scope, truckId)?.images?.some(
              (r) => r.id === imageId,
            ) ||
            !z.uuid().safeParse(imageId).success
          )
            return Promise.resolve(sessionDenied);
          const parsed = galleryImagePatchSchema.safeParse(body);
          return parsed.success
            ? scopedRead(
                a,
                scope,
                q,
                {
                  url: `/food-trucks/${truckId}/images/${imageId}`,
                  method: "PATCH",
                  body: parsed.data,
                },
                galleryImageSchema.refine(
                  (r) => r.id === imageId && r.foodTruckId === truckId,
                ),
              )
            : Promise.resolve(invalidContract);
        }),
      invalidatesTags: (r) => (r ? [...truckWriteTags] : []),
    }),
    deleteTruckImage: b.mutation<
      z.infer<typeof galleryImageSchema>,
      TruckScope & { imageId: string }
    >({
      queryFn: ({ scope, truckId, imageId }, a, _e, q) =>
        sessionFlight(a, scope, `gallery:${imageId}`, () => {
          if (
            !ownedTruck(a.getState() as RootState, scope, truckId)?.images?.some(
              (r) => r.id === imageId,
            ) ||
            !z.uuid().safeParse(imageId).success
          )
            return Promise.resolve(sessionDenied);
          return scopedRead(
            a,
            scope,
            q,
            { url: `/food-trucks/${truckId}/images/${imageId}`, method: "DELETE" },
            galleryImageSchema.refine(
              (r) => r.id === imageId && r.foodTruckId === truckId,
            ),
          );
        }),
      invalidatesTags: (r) => (r ? [...truckWriteTags] : []),
    }),
  }),
});
export const {
  useUploadTruckAssetMutation,
  useAddTruckImageMutation,
  useUpdateTruckImageMutation,
  useDeleteTruckImageMutation,
} = truckAssetsApi;
