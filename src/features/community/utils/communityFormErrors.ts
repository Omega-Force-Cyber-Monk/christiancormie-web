import type { AppError } from "@/utils/errors/error.types";
export function communityFormErrors(
  error: AppError,
  mapping: Record<string, string>,
): AppError {
  return {
    ...error,
    fieldErrors: Object.fromEntries(
      Object.entries(error.fieldErrors ?? {})
        .filter(([key]) => Object.hasOwn(mapping, key))
        .map(([key, value]) => [mapping[key], value]),
    ),
  };
}
export const customerCommunityFields = {
  description: "body",
  title: "itemName",
  eventType: "eventType",
  eventDate: "date",
  startTime: "time",
  address: "location",
  guestCount: "guests",
  budgetMin: "budget",
  budgetMax: "budget",
  preferredMenuItems: "menus",
};
export const vendorTruckFields = {
  ...customerCommunityFields,
  description: "description",
};
