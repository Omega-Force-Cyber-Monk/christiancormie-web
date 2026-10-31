import type { ReactNode } from "react";
import { ArrowLeft } from "lucide-react";
import type {
  VendorBooking,
  VendorBookingTracking,
} from "../../schemas/vendorBookings.schema";
import {
  financialAmount,
  formatFinancialAmount,
} from "@/features/payments/utils/financialValues";
function customerName(b: VendorBooking) {
  const p = b.customer.profile;
  return (
    p?.displayName ||
    [p?.firstName, p?.lastName].filter(Boolean).join(" ") ||
    b.customer.email
  );
}
function BookingFacts({ booking: b }: { booking: VendorBooking }) {
  return (
    <dl className="request-facts">
      {[
        ["Event", b.startsAt],
        ["Location", b.address],
        ["Guests", String(b.guestCount)],
        [
          "Booking total",
          formatFinancialAmount(financialAmount(b.totalAmount, null, "major")),
        ],
      ].map(([label, value]) => (
        <div key={label}>
          <div>
            <dt>{label}</dt>
            <dd className="break-words">{value}</dd>
          </div>
        </div>
      ))}
    </dl>
  );
}
export function VendorBookingCard({
  booking: b,
  onDetails,
}: {
  booking: VendorBooking;
  onDetails: () => void;
}) {
  return (
    <article className="request-booking-card break-words">
      <h2 className="font-semibold">{customerName(b)}</h2>
      <p className="mt-1 text-xs text-[#B8C1D1]">
        Received: <time dateTime={b.createdAt}>{b.createdAt}</time>
      </p>
      <span className="request-kind">
        {b.bookingType} · {b.status}
      </span>
      <p className="my-3">{b.eventName ?? b.bookingNumber}</p>
      <p>
        {b.foodTruck.name} · {b.vendor.businessName}
      </p>
      <BookingFacts booking={b} />
      <button type="button" className="request-cyan mt-4" onClick={onDetails}>
        View {b.bookingNumber}
      </button>
    </article>
  );
}
export type LiveRequestOrderDetailsProps = {
  booking: VendorBooking;
  onBack: () => void;
  children?: ReactNode;
};
export function LiveRequestOrderDetails({
  booking: b,
  onBack,
  children,
}: LiveRequestOrderDetailsProps) {
  return (
    <div className="request-detail-page">
      <div className="request-page-heading">
        <button
          type="button"
          className="request-back"
          aria-label="Back to bookings"
          onClick={onBack}
        >
          <ArrowLeft size={20} />
        </button>
        <h1>Booking details</h1>
      </div>
      <article className="request-order-detail break-words">
        <h2 className="text-lg font-semibold">{customerName(b)}</h2>
        <p>Booking: {b.bookingNumber}</p>
        <p>Booking ID: {b.id}</p>
        <p>Customer ID: {b.customerId}</p>
        <p>Vendor: {b.vendor.businessName}</p>
        <p>Truck: {b.foodTruck.name}</p>
        <span className="request-kind">
          {b.bookingType} · {b.status}
        </span>
        <p className="my-3">
          {b.eventName ?? "Event name not provided"}
          {b.eventType ? ` · ${b.eventType}` : ""}
        </p>
        {b.eventDescription && <p>{b.eventDescription}</p>}
        <BookingFacts booking={b} />
        <p>Ends: {b.endsAt ?? "Not provided"}</p>
        <p>Contact: {b.contactPhone ?? b.customer.phone ?? "Not provided"}</p>
        {b.specialInstructions && <p>Instructions: {b.specialInstructions}</p>}
        <p>Completion requested: {b.completionRequestedAt ?? "Not requested"}</p>
        <p>Completed: {b.completedAt ?? "Not completed"}</p>
        {children}
        <p className="mt-4 text-xs text-[#B8C1D1]">
          Currency is not supplied. Booking decisions do not confirm a payment. Customer
          quote acceptance, messages, completion and financial actions are unavailable
          here.
        </p>
        <div className="mt-6 grid grid-cols-2 gap-3">
          <button type="button" className="request-secondary" disabled>
            Message unavailable
          </button>
          <button type="button" className="request-cyan" disabled>
            Call unavailable
          </button>
        </div>
      </article>
    </div>
  );
}
export function VendorBookingTimeline({
  tracking,
}: {
  tracking: VendorBookingTracking;
}) {
  return (
    <section className="mt-6" aria-label="Server booking timeline">
      <h3 className="text-lg font-semibold">Booking timeline</h3>
      <p className="text-xs text-[#B8C1D1]">
        Latest reported timeline; not a payment receipt.
      </p>
      <ol className="request-timeline">
        {tracking.steps.map((s) => (
          <li
            key={s.key}
            aria-current={s.key === tracking.currentStep ? "step" : undefined}
          >
            <span aria-hidden="true" />
            {s.label}: {s.status}
            {s.completedAt && (
              <>
                {" "}
                · <time dateTime={s.completedAt}>{s.completedAt}</time>
              </>
            )}
          </li>
        ))}
      </ol>
    </section>
  );
}
