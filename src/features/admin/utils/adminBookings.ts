import type { AdminBookingDto } from "@/features/admin/types/admin.dto";
import type { BookingRecord } from "@/features/admin/components/bookings/bookings.types";

export function bookingMoney(
  value: number | null | undefined,
  currency?: string | null,
) {
  if (value === null || value === undefined || !Number.isFinite(value)) return "N/A";
  if (currency && /^[A-Z]{3}$/.test(currency))
    return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(
      value,
    );
  return `${value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} (currency unavailable)`;
}
export function bookingStart(startsAt?: string | null) {
  const date = startsAt ? new Date(startsAt) : null;
  if (!date || !Number.isFinite(date.getTime())) return { date: "N/A", time: "N/A" };
  return {
    date: new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      timeZone: "UTC",
    }).format(date),
    time: `${new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit", timeZone: "UTC" }).format(date)} UTC`,
  };
}
const enumLabel = (value?: string | null) =>
  value ? value.toLowerCase().replaceAll("_", " ") : "N/A";
export function toAdminBooking(booking: AdminBookingDto): BookingRecord {
  return {
    id: booking.id,
    displayId: booking.bookingNumber,
    source: booking,
    customerName: booking.customer?.name || "N/A",
    vendorName: booking.vendor?.businessName || "N/A",
    date: bookingStart(booking.event?.startsAt).date,
    location: booking.event?.address || "N/A",
    amount: bookingMoney(booking.amount, booking.payment?.currency),
    fee: bookingMoney(
      booking.payment?.commission?.commissionAmount,
      booking.payment?.currency,
    ),
    paymentModel:
      booking.paymentModel === "PREPAID_IN_FULL"
        ? "Prepaid"
        : booking.paymentModel === "DEPOSIT_ONLY"
          ? "Deposit"
          : enumLabel(booking.paymentModel),
    pricingModel:
      booking.pricingModel === "PER_PERSON"
        ? "Per person"
        : booking.pricingModel === "FLAT_FEE"
          ? "Flat fee"
          : enumLabel(booking.pricingModel),
    status: enumLabel(booking.status),
  };
}

export function toAdminBookingDetails(booking: BookingRecord | null | undefined) {
  const details = booking
    ? {
        id: booking.displayId,
        customerName: booking.customerName,
        customerEmail: booking.source.customer?.email ?? "N/A",
        customerPhone: booking.source.customer?.phone ?? "N/A",
        vendorName: booking.vendorName,
        vendorEmail: booking.source.vendor?.email ?? "N/A",
        vendorPhone: booking.source.vendor?.phone ?? "N/A",
        eventType: booking.source.event?.type?.replaceAll("_", " ") ?? "N/A",
        guestCount: booking.source.event?.guestCount?.toString() ?? "N/A",
        eventDate: booking.date,
        eventTime: bookingStart(booking.source.event?.startsAt).time,
        location: booking.location,
        address: booking.source.event?.address ?? "N/A",
        specialRequests: "N/A",
        paymentModel: booking.paymentModel,
        pricingModel: booking.pricingModel,
        totalAmount: booking.amount,
        paymentAmount: bookingMoney(
          booking.source.payment?.amount,
          booking.source.payment?.currency,
        ),
        commissionGross: bookingMoney(
          booking.source.payment?.commission?.grossAmount,
          booking.source.payment?.currency,
        ),
        commission: booking.fee,
        vendorPayout: bookingMoney(
          booking.source.payment?.commission?.vendorNetAmount,
          booking.source.payment?.currency,
        ),
        status: booking.status,
      }
    : null;

  return details;
}
