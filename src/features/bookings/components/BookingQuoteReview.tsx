import type { BookingQuote } from "../schemas/bookingQuote.schema";
import {
  financialAmount,
  formatFinancialAmount,
} from "@/features/payments/utils/financialValues";
export function BookingQuoteReview({
  quotes,
  bookingId,
  customer = false,
}: {
  quotes: BookingQuote[] | undefined;
  bookingId: string;
  customer?: boolean;
}) {
  return (
    <section className="mt-5 space-y-4" aria-label="Booking quotes">
      <h3 className="text-lg font-semibold">Booking quotes</h3>
      {quotes === undefined ? (
        <p>Quote data unavailable. Refresh booking details.</p>
      ) : !quotes.length ? (
        <p>No booking quotes.</p>
      ) : (
        quotes
          .filter((q) => q.bookingId === bookingId)
          .map((q) => (
            <article
              key={q.id}
              className="rounded-lg border border-[var(--border)] p-4 break-words"
            >
              <p>Quote ID: {q.id}</p>
              <p>Status: {q.status}</p>
              <p>
                {q.pricingModel ?? "Pricing unavailable"} ·{" "}
                {q.paymentPreference ?? "Payment preference unavailable"}
              </p>
              <p>Created: {q.createdAt}</p>
              <p>Expires: {q.expiresAt ?? "No expiry supplied"}</p>
              <dl className="request-breakdown">
                {Object.entries({
                  "Price per person": q.pricePerPerson,
                  "Base service": q.baseServiceFee,
                  Transport: q.transportFee,
                  "Service fee": q.serviceFee,
                  Tax: q.taxAmount,
                  Discount: q.discountAmount,
                  Total: q.totalAmount,
                  Deposit: q.depositAmount,
                  "Balance at event": q.balanceDueAtEvent,
                }).map(([label, value]) => (
                  <div key={label}>
                    <dt>{label}</dt>
                    <dd>
                      {formatFinancialAmount(financialAmount(value, null, "major"))}
                    </dd>
                  </div>
                ))}
              </dl>
              <p>Deposit percentage: {q.depositPercent}%</p>
              {q.selectedMenuItems?.map((m, index) => (
                <p key={`${index}:${m}`}>{m}</p>
              ))}
              {q.extraCharges?.map((e, index) => (
                <p key={index}>
                  {e.label}:{" "}
                  {formatFinancialAmount(financialAmount(e.amount, null, "major"))}
                </p>
              ))}
              {(q.noteToClient ?? q.message) && (
                <p className="whitespace-pre-wrap">{q.noteToClient ?? q.message}</p>
              )}
              <p className="whitespace-pre-wrap">Terms: {q.terms ?? "Not supplied"}</p>
              {customer && (
                <>
                  <button
                    type="button"
                    disabled
                    className="mt-3 rounded-lg border border-[var(--border)] p-3"
                  >
                    Accept quote unavailable
                  </button>
                  <p>
                    Acceptance reserves a payment window. Checkout, expiry and recovery
                    must be available before acceptance is enabled. No payment has been
                    made here.
                  </p>
                </>
              )}
            </article>
          ))
      )}
    </section>
  );
}
