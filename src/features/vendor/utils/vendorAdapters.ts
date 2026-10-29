import type {
  VendorProfileResponse,
  VendorTrucksResponse,
  VendorRecentBooking,
} from "@/features/vendor/types/vendor.types";

export const vendorNumber = (value: number | string | null | undefined) => {
  if (value === null || value === undefined || value === "") return "N/A";
  const number = typeof value === "number" ? value : Number(value);
  return Number.isFinite(number)
    ? number.toLocaleString("en-US", { maximumFractionDigits: 2 })
    : "N/A";
};
export function vendorAmount(value: number | string | null | undefined) {
  if (value === null || value === undefined || value === "") return "N/A";
  // Prisma Decimal strings are retained verbatim, rather than losing precision in Number().
  const text =
    typeof value === "string"
      ? /^-?\d+(?:\.\d+)?$/.test(value)
        ? value
        : null
      : Number.isFinite(value)
        ? value.toLocaleString("en-US", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })
        : null;
  return text === null ? "N/A" : `${text} (currency unavailable)`;
}
export const vendorStart = (value?: string | null) => {
  const date = value ? new Date(value) : null;
  return date && Number.isFinite(date.getTime())
    ? `${new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "short", timeZone: "UTC" }).format(date)} UTC`
    : "Time unavailable";
};
export const vendorInitials = (name: string) =>
  name
    .trim()
    .split(/\s+/)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase() || "?";
export function toVendorIdentity(
  profile: VendorProfileResponse,
  trucks?: VendorTrucksResponse,
) {
  const onlyTruck = trucks?.length === 1 ? trucks[0] : undefined;
  return {
    vendorId: profile.id,
    ownerId: profile.userId,
    name: profile.businessName || "Vendor",
    initials: vendorInitials(profile.businessName),
    imageUrl: profile.logoUrl || (onlyTruck?.profileImageUrl ?? null),
    location:
      [profile.market?.city, profile.market?.state].filter(Boolean).join(", ") ||
      onlyTruck?.currentAddress ||
      onlyTruck?.primaryCity ||
      (trucks && trucks.length > 1
        ? `${trucks.length} food trucks`
        : "Location unavailable"),
    trucks: (trucks ?? []).map((truck) => ({
      foodTruckId: truck.id,
      vendorId: truck.vendorId,
      publicSlug: truck.slug,
      name: truck.name,
      status: truck.status,
      location: truck.currentAddress ?? truck.primaryCity ?? "Location unavailable",
    })),
  };
}
export function vendorContextMatches(
  profile: VendorProfileResponse,
  ownerId: string,
  trucks?: VendorTrucksResponse,
) {
  return (
    profile.userId === ownerId &&
    (trucks ?? []).every((truck) => truck.vendorId === profile.id)
  );
}
export function toVendorBooking(booking: VendorRecentBooking) {
  const profile = booking.customer?.profile;
  return {
    id: booking.id,
    displayId: booking.bookingNumber,
    title: booking.bookingNumber,
    customer:
      profile?.displayName ||
      [profile?.firstName, profile?.lastName].filter(Boolean).join(" ") ||
      booking.customer?.email ||
      "Customer unavailable",
    avatarUrl: profile?.avatarUrl ?? null,
    foodTruckId: booking.foodTruck?.id ?? null,
    publicSlug: booking.foodTruck?.slug ?? null,
    truckName: booking.foodTruck?.name ?? "Truck unavailable",
    status: booking.status,
    when: vendorStart(booking.startsAt),
    amount: vendorAmount(booking.totalAmount),
  };
}
