import { z } from "zod";
import type { RootState } from "@/app/store";
import { baseApi } from "@/services/api/baseApi";
import {
  scopedRead,
  scopeMatches,
  sessionDenied,
  sessionFlight,
  type SessionScope,
  type QueryContext,
  type ValidatedQuery,
} from "@/services/api/sessionGuard";
import { invalidContract } from "@/services/api/validatedQuery";
import { ownedTruck, truckWriteTags } from "./truckSettings.api";
import { vendorFor } from "./vendorBookings.api";
import { vendorApi } from "./vendor.api";
import { vendorTruckSchema } from "../schemas/vendor.schema";
import {
  discoveryApi,
  type PromotionManagementArg,
} from "@/features/customer/api/discovery.api";
import {
  locationInputSchema,
  locationResultSchema,
  dropInputSchema,
  dropResultSchema,
  operatingStatusSchema,
  managedPromotionsSchema,
  managedPromotionSchema,
  promotionInputSchema,
  promotionPatchSchema,
  type DropInput,
  type PromotionInput,
} from "../schemas/dropsIntegration.schema";
export type TruckScope = SessionScope & { truckId: string };
export const promotionManagementArg = (s: TruckScope): PromotionManagementArg => ({
  foodTruckId: s.truckId,
  activeOnly: false,
  limit: 100,
  scope: { sessionId: s.sessionId, userId: s.userId, role: s.role },
});
function owns(state: RootState, s: TruckScope) {
  return vendorFor(state, s, true) && ownedTruck(state, s, s.truckId);
}
const uncertain = new WeakMap<object, Set<string>>();
const flightKey = (s: TruckScope) => `${s.sessionId}:${s.userId}:${s.truckId}`;
const recoveryError = {
  error: {
    status: "CUSTOM_ERROR" as const,
    error:
      "A previous Drop may have been created. Truck data was refreshed, but owner Drop recovery is unavailable. Do not submit another Drop until its state is verified.",
  },
};
async function refresh(a: QueryContext, s: TruckScope) {
  if (!scopeMatches(a.getState() as RootState, s)) return;
  a.dispatch(
    baseApi.util.invalidateTags([...truckWriteTags, "TruckDrops", "TruckPromotions"]),
  );
  await a.dispatch(
    vendorApi.endpoints.getMyTrucks.initiate(undefined, {
      forceRefetch: true,
      subscribe: false,
    }),
  );
}
async function write<T>(
  a: QueryContext,
  s: TruckScope,
  q: ValidatedQuery,
  path: string,
  method: string,
  body: unknown,
  schema: z.ZodType<T>,
) {
  if (!owns(a.getState() as RootState, s)) return sessionDenied;
  return scopedRead(a, s, q, { url: path, method, body }, schema);
}
export const vendorDropsApi = baseApi.injectEndpoints({
  endpoints: (b) => ({
    setTruckOperatingStatus: b.mutation<
      z.infer<typeof vendorTruckSchema>,
      TruckScope & {
        confirmed: true;
        operatingStatus: z.infer<typeof operatingStatusSchema>;
      }
    >({
      queryFn(s, a, _e, q) {
        return sessionFlight(a, s, `truck-drop:${s.truckId}`, async () => {
          const truck = owns(a.getState() as RootState, s);
          const status = operatingStatusSchema.safeParse(s.operatingStatus);
          if (!truck || s.confirmed !== true) return sessionDenied;
          if (!status.success) return invalidContract;
          const r = await write(
            a,
            s,
            q,
            `/food-trucks/${s.truckId}/operating-status`,
            "PATCH",
            { operatingStatus: status.data },
            vendorTruckSchema.refine(
              (t) =>
                t.id === s.truckId &&
                t.vendorId === truck.vendorId &&
                t.operatingStatus === status.data,
            ),
          );
          await refresh(a, s);
          return scopeMatches(a.getState() as RootState, s) ? r : sessionDenied;
        });
      },
    }),
    updateTruckLocation: b.mutation<
      z.infer<typeof locationResultSchema>,
      TruckScope & { confirmed: true; body: z.infer<typeof locationInputSchema> }
    >({
      queryFn(s, a, _e, q) {
        return sessionFlight(a, s, `truck-drop:${s.truckId}`, async () => {
          if (s.confirmed !== true || !owns(a.getState() as RootState, s))
            return sessionDenied;
          const body = locationInputSchema.safeParse(s.body);
          if (!body.success) return invalidContract;
          const r = await write(
            a,
            s,
            q,
            `/food-trucks/${s.truckId}/location`,
            "PATCH",
            body.data,
            locationResultSchema.refine(
              (t) =>
                t.id === s.truckId &&
                Math.abs(t.latitude - body.data.latitude) < 1e-8 &&
                Math.abs(t.longitude - body.data.longitude) < 1e-8,
            ),
          );
          await refresh(a, s);
          return scopeMatches(a.getState() as RootState, s) ? r : sessionDenied;
        });
      },
    }),
    goLiveTruck: b.mutation<
      z.infer<typeof dropResultSchema>,
      TruckScope & { confirmed: true; body: DropInput }
    >({
      queryFn(s, a, _e, q) {
        return sessionFlight(a, s, `truck-drop:${s.truckId}`, async () => {
          const truck = owns(a.getState() as RootState, s);
          if (!truck || s.confirmed !== true) return sessionDenied;
          const input = dropInputSchema.safeParse(s.body);
          if (!input.success) return invalidContract;
          const blocked = uncertain.get(a.dispatch) ?? new Set<string>();
          uncertain.set(a.dispatch, blocked);
          if (blocked.has(flightKey(s))) return recoveryError;
          const loc = await write(
            a,
            s,
            q,
            `/food-trucks/${s.truckId}/location`,
            "PATCH",
            {
              latitude: input.data.latitude,
              longitude: input.data.longitude,
              ...(input.data.address !== undefined
                ? { address: input.data.address }
                : {}),
              validForMinutes: input.data.durationMinutes,
            },
            locationResultSchema.refine(
              (l) =>
                l.id === s.truckId &&
                Math.abs(l.latitude - input.data.latitude) < 1e-8 &&
                Math.abs(l.longitude - input.data.longitude) < 1e-8,
            ),
          );
          if (loc.error) {
            await refresh(a, s);
            return loc;
          }
          const status = await write(
            a,
            s,
            q,
            `/food-trucks/${s.truckId}/operating-status`,
            "PATCH",
            { operatingStatus: "OPEN" },
            vendorTruckSchema.refine(
              (t) =>
                t.id === s.truckId &&
                t.vendorId === truck.vendorId &&
                t.operatingStatus === "OPEN",
            ),
          );
          if (status.error) {
            await refresh(a, s);
            return status;
          }
          const r = await write(
            a,
            s,
            q,
            `/food-trucks/${s.truckId}/drops`,
            "POST",
            input.data,
            dropResultSchema.refine(
              (d) =>
                d.foodTruckId === s.truckId &&
                d.status === "ACTIVE" &&
                Math.abs(d.latitude - input.data.latitude) < 1e-8 &&
                Math.abs(d.longitude - input.data.longitude) < 1e-8 &&
                d.endsAt !== null,
            ),
          );
          if (r.error && ![400, 401, 403, 404, 409].includes(Number(r.error.status)))
            blocked.add(flightKey(s));
          await refresh(a, s);
          return scopeMatches(a.getState() as RootState, s) ? r : sessionDenied;
        });
      },
    }),
    createTruckPromotion: b.mutation<
      z.infer<typeof managedPromotionSchema>,
      TruckScope & { confirmed: true; body: PromotionInput }
    >({
      queryFn(s, a, _e, q) {
        return sessionFlight(a, s, `truck-drop:${s.truckId}`, async () => {
          if (s.confirmed !== true || !owns(a.getState() as RootState, s))
            return sessionDenied;
          const input = promotionInputSchema.safeParse(s.body);
          if (!input.success) return invalidContract;
          const blocked = uncertain.get(a.dispatch) ?? new Set<string>();
          uncertain.set(a.dispatch, blocked);
          const key = `${flightKey(s)}:promotion:${JSON.stringify(input.data)}`;
          if (blocked.has(key))
            return {
              error: {
                status: "CUSTOM_ERROR" as const,
                error:
                  "This promotion submission is unconfirmed. Review refreshed promotions before creating another; automatic retry is blocked.",
              },
            };
          const r = await write(
            a,
            s,
            q,
            "/promotions",
            "POST",
            { ...input.data, foodTruckId: s.truckId },
            managedPromotionSchema.refine(
              (p) => p.foodTruckId === s.truckId && p.title === input.data.title,
            ),
          );
          if (r.error && ![400, 401, 403, 404, 409].includes(Number(r.error.status)))
            blocked.add(key);
          await refresh(a, s);
          return scopeMatches(a.getState() as RootState, s) ? r : sessionDenied;
        });
      },
    }),
    updateTruckPromotion: b.mutation<
      z.infer<typeof managedPromotionSchema>,
      TruckScope & {
        promotionId: string;
        confirmed: true;
        body: z.infer<typeof promotionPatchSchema>;
      }
    >({
      queryFn(s, a, _e, q) {
        return sessionFlight(a, s, `truck-drop:${s.truckId}`, async () => {
          const list = discoveryApi.endpoints.getTruckPromotions.select(
            promotionManagementArg(s),
          )(a.getState() as RootState);
          const parsedList = managedPromotionsSchema.safeParse(list.data);
          const existing =
            !list.error && parsedList.success
              ? parsedList.data.find(
                  (p) => p.id === s.promotionId && p.foodTruckId === s.truckId,
                )
              : undefined;
          if (
            !existing ||
            !z.uuid().safeParse(s.promotionId).success ||
            s.confirmed !== true ||
            !owns(a.getState() as RootState, s)
          )
            return sessionDenied;
          const input = promotionPatchSchema.safeParse(s.body);
          if (!input.success) return invalidContract;
          const merged = { ...existing, ...input.data };
          if (
            Date.parse(merged.startsAt) >= Date.parse(merged.endsAt) ||
            (merged.type === "PERCENTAGE" &&
              merged.value != null &&
              Number(merged.value) > 100)
          )
            return invalidContract;
          const r = await write(
            a,
            s,
            q,
            `/promotions/${s.promotionId}`,
            "PATCH",
            input.data,
            managedPromotionSchema.refine(
              (p) =>
                p.id === s.promotionId &&
                p.foodTruckId === s.truckId &&
                (input.data.isActive === undefined ||
                  p.isActive === input.data.isActive),
            ),
          );
          await refresh(a, s);
          return scopeMatches(a.getState() as RootState, s) ? r : sessionDenied;
        });
      },
    }),
  }),
});
export const { useGoLiveTruckMutation, useUpdateTruckLocationMutation } =
  vendorDropsApi;
