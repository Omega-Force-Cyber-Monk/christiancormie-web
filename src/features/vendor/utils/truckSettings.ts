import type { VendorTrucksResponse } from "../types/vendor.types";
import { profileDays } from "../data/profile.data";
import type { TruckProfileForm } from "../schemas/truckSettings.schema";
export type OwnedTruck = VendorTrucksResponse[number];
export function serverClock(value?: string | null) {
  if (!value) return "";
  if (/^([01]\d|2[0-3]):[0-5]\d$/.test(value)) return value;
  // Prisma TIME uses UTC-anchored Dates; keep its wall clock, never local time.
  return /^1970-01-01T([01]\d|2[0-3]):[0-5]\d:00(?:\.0+)?Z$/.test(value)
    ? value.slice(11, 16)
    : "";
}
export function truckForm(t: OwnedTruck): TruckProfileForm {
  return {
    name: t.name,
    handle: t.handle ?? "",
    motto: t.description ?? "",
    location: t.currentAddress ?? t.primaryCity ?? "",
    capacity: "",
    cuisines: t.cuisines?.map((c) => c.cuisineId) ?? [],
    hours: profileDays.map((day, i) => {
      const row = t.operatingHours?.find((h) => h.dayOfWeek === (i + 1) % 7);
      return {
        day,
        enabled: row ? !row.isClosed : false,
        opens: serverClock(row?.openingTime),
        closes: serverClock(row?.closingTime),
      };
    }),
  };
}
export function truckProfilePatch(
  t: OwnedTruck,
  v: TruckProfileForm,
  baseline?: TruckProfileForm,
) {
  const before = baseline ?? truckForm(t);
  const body: Record<string, unknown> = {};
  if (v.name !== before.name) body.name = v.name;
  if (v.handle !== before.handle) body.handle = v.handle;
  if (v.motto !== before.motto) body.description = v.motto;
  // Capacity ranges and address text cannot supply the required numeric/spatial contract.
  if (v.capacity !== before.capacity)
    throw Error("Capacity range conversion requires an approved numeric meaning.");
  if (v.location !== before.location)
    throw Error(
      "Service area changes require coordinates and radius; address text alone cannot be saved.",
    );
  if (JSON.stringify(v.cuisines) !== JSON.stringify(before.cuisines))
    body.cuisines = v.cuisines.map((cuisineId) => ({
      cuisineId,
      isPrimary: t.cuisines?.find((c) => c.cuisineId === cuisineId)?.isPrimary ?? false,
    }));
  if (JSON.stringify(v.hours) !== JSON.stringify(before.hours))
    body.operatingHours = v.hours.flatMap((h, i) => {
      const existing = t.operatingHours?.find((r) => r.dayOfWeek === (i + 1) % 7);
      if (JSON.stringify(h) === JSON.stringify(before.hours[i]))
        return existing
          ? [
              {
                dayOfWeek: existing.dayOfWeek,
                isClosed: existing.isClosed,
                ...(serverClock(existing.openingTime)
                  ? { openingTime: serverClock(existing.openingTime) }
                  : {}),
                ...(serverClock(existing.closingTime)
                  ? { closingTime: serverClock(existing.closingTime) }
                  : {}),
              },
            ]
          : [];
      return [
        {
          dayOfWeek: (i + 1) % 7,
          isClosed: !h.enabled,
          ...(h.opens ? { openingTime: h.opens } : {}),
          ...(h.closes ? { closingTime: h.closes } : {}),
        },
      ];
    });
  return body;
}
