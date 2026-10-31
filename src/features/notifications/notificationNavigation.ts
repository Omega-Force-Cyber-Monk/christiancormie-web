import { z } from "zod";
import { ROUTES } from "@/constants/routes";
import type { Notification } from "./notifications.schema";
export function notificationTarget(
  n: Notification & { foodTruck?: { id: string; slug: string } | null },
  role: string,
): { to: string; label: string } | null {
  if (role !== "CUSTOMER" && role !== "VENDOR") return null;
  const m = n.metadata;
  if (!m || !z.uuid().safeParse(m.entityId).success) return null;
  const id = m.entityId as string;
  function matches(...values: unknown[]) {
    return values.every((v) => v === null || v === undefined || v === id);
  }
  if (m.entityType === "CONVERSATION" && matches(n.conversationId, m.conversationId))
    return {
      to: `${role === "CUSTOMER" ? ROUTES.CUSTOMER_MESSAGE : ROUTES.VENDOR_MESSAGE}?conversation=${id}`,
      label: "Open conversation",
    };
  if (m.entityType === "BOOKING" && matches(n.bookingId, m.bookingId))
    return {
      to: `${role === "CUSTOMER" ? ROUTES.CUSTOMER_ORDERS : ROUTES.VENDOR_ORDERS}?booking=${id}`,
      label: "Open booking",
    };
  if (
    m.entityType === "COMMUNITY_REQUEST" &&
    role === "CUSTOMER" &&
    matches(m.communityRequestId)
  )
    return {
      to: `${ROUTES.CUSTOMER_COMMUNITY}#${id}`,
      label: "Open Community request",
    };
  if (
    m.entityType === "FOOD_TRUCK" &&
    role === "CUSTOMER" &&
    matches(n.foodTruckId, m.foodTruckId, n.foodTruck?.id)
  ) {
    const slug = n.foodTruck?.slug ?? m.foodTruckSlug;
    if (
      typeof slug === "string" &&
      slug !== "me" &&
      slug.length <= 200 &&
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) &&
      !z.uuid().safeParse(slug).success &&
      (!n.foodTruck?.slug || !m.foodTruckSlug || n.foodTruck.slug === m.foodTruckSlug)
    )
      return {
        to: ROUTES.CUSTOMER_PROFILE.replace(":id", encodeURIComponent(slug)),
        label: "Open food truck",
      };
  }
  if (m.entityType === "BOOKING_ISSUE" && role === "CUSTOMER" && matches(m.issueId)) {
    const booking = n.bookingId ?? m.bookingId;
    if (
      z.uuid().safeParse(booking).success &&
      (!n.bookingId || !m.bookingId || n.bookingId === m.bookingId)
    )
      return {
        to: `${ROUTES.CUSTOMER_ORDERS}?booking=${booking as string}`,
        label: "Open booking issue history",
      };
  }
  return null;
}
export function notificationBookingId(params: URLSearchParams) {
  const id = params.get("booking");
  return z.uuid().safeParse(id).success ? id : null;
}
