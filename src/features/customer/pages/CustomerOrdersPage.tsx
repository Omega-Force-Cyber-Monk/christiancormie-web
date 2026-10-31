import { useSearchParams } from "react-router";
import { notificationBookingId } from "@/features/notifications/notificationNavigation";
import { useAppSelector } from "@/app/hooks";
import {
  selectCurrentRole,
  selectIsAuthenticated,
} from "@/features/auth/store/auth.selectors";
import { PageHeader } from "@/components/common/PageHeader";
import { AppLoader } from "@/components/ui/AppLoader";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/states/EmptyState";
import { ErrorState } from "@/components/states/ErrorState";
import { normalizeApiError } from "@/utils/errors/normalizeApiError";
import type { SessionScope } from "@/services/api/sessionGuard";
import {
  useGetCustomerBookingsQuery,
  useGetCustomerBookingQuery,
  useGetCustomerBookingTrackingQuery,
  type BookingSelection,
} from "../api/bookings.api";
import type { CustomerBooking, BookingTracking } from "../schemas/booking.schema";
import { CustomerBookingIssues } from "../components/orders/CustomerBookingIssues";
import { BookingQuoteReview } from "@/features/bookings/components/BookingQuoteReview";

export default function CustomerOrdersPage() {
  const auth = useAppSelector((s) => s.auth);
  const verified = useAppSelector(selectIsAuthenticated);
  const role = useAppSelector(selectCurrentRole);
  const scope = {
    sessionId: auth.sessionId ?? "",
    userId: auth.user?.id ?? "",
    role: role ?? "",
  };
  return (
    <div className="space-y-6">
      <PageHeader
        title="Orders"
        description="Your bookings and their latest tracking status."
      />
      {verified && role === "CUSTOMER" && auth.sessionId ? (
        <Orders
          key={`${scope.sessionId}:${scope.userId}:${scope.role}`}
          scope={scope}
        />
      ) : (
        <p role="alert">A verified Customer session is required to view bookings.</p>
      )}
    </div>
  );
}
function Orders({ scope }: { scope: SessionScope }) {
  const query = useGetCustomerBookingsQuery(scope);
  const [params, setParams] = useSearchParams();
  const selected = notificationBookingId(params);
  const select = (id: string | null) => {
    const next = new URLSearchParams(params);
    if (id) next.set("booking", id);
    else next.delete("booking");
    setParams(next);
  };
  return (
    <>
      <Button disabled={query.isFetching} onClick={() => void query.refetch()}>
        Refresh bookings
      </Button>
      {query.isFetching && <AppLoader variant="compact" label="Loading bookings" />}
      {query.error ? (
        <ErrorState
          error={normalizeApiError(query.error)}
          onRetry={() => void query.refetch()}
        />
      ) : (
        query.currentData && (
          <>
            <BookingList
              bookings={query.currentData}
              selected={selected}
              onSelect={select}
            />
            {selected && query.currentData.some((b) => b.id === selected) && (
              <BookingDetail key={selected} scope={{ ...scope, bookingId: selected }} />
            )}
            {selected && !query.currentData.some((b) => b.id === selected) && (
              <p role="status">
                The requested booking is not available in your booking list.
              </p>
            )}
          </>
        )
      )}
    </>
  );
}
export function BookingList({
  bookings,
  selected,
  onSelect,
}: {
  bookings: CustomerBooking[];
  selected: string | null;
  onSelect: (id: string) => void;
}) {
  if (!bookings.length)
    return (
      <EmptyState
        title="No bookings yet"
        description="Your booking records will appear here."
      />
    );
  return (
    <ul className="space-y-3" aria-label="Your bookings">
      {bookings.map((b) => (
        <li
          key={b.id}
          className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-4"
        >
          <p className="font-semibold">{b.eventName ?? b.bookingNumber}</p>
          <p className="text-sm">
            {b.foodTruck.name} · {b.vendor.businessName}
          </p>
          <p className="text-sm">
            Event: <time dateTime={b.startsAt}>{b.startsAt}</time>
          </p>
          <p className="text-sm">Booking status: {b.status}</p>
          <Button
            className="mt-3"
            aria-pressed={selected === b.id}
            onClick={() => onSelect(b.id)}
          >
            View {b.bookingNumber}
          </Button>
        </li>
      ))}
    </ul>
  );
}
function BookingDetail({ scope }: { scope: BookingSelection }) {
  const query = useGetCustomerBookingQuery(scope);
  if (query.error && !query.currentData)
    return (
      <ErrorState
        error={normalizeApiError(query.error)}
        onRetry={() => void query.refetch()}
      />
    );
  if (!query.currentData)
    return <AppLoader variant="compact" label="Loading booking details" />;
  return (
    <section
      aria-label="Selected booking"
      className="space-y-4 rounded-lg border border-[var(--border)] bg-[var(--surface)] p-4"
    >
      <Button disabled={query.isFetching} onClick={() => void query.refetch()}>
        Refresh details
      </Button>
      {query.error && (
        <ErrorState
          error={normalizeApiError(query.error)}
          onRetry={() => void query.refetch()}
        />
      )}
      <div hidden={!!query.error} className="space-y-4">
        <BookingInformation booking={query.currentData} />
        <BookingQuoteReview
          customer
          bookingId={scope.bookingId}
          quotes={query.currentData.quotes}
        />
        <section aria-label="Booking completion status" className="space-y-2">
          <h3 className="font-semibold">Completion status</h3>
          <p>Requested: {query.currentData.completionRequestedAt ?? "Not requested"}</p>
          <p>Approved: {query.currentData.completionApprovedAt ?? "Not approved"}</p>
          <p>Completed: {query.currentData.completedAt ?? "Not completed"}</p>
          <p className="text-sm">
            Completion approval and payout release are unavailable here.
          </p>
        </section>
        <Tracking scope={scope} />
        <CustomerBookingIssues
          scope={scope}
          booking={query.currentData}
          disabled={query.isFetching || !!query.error}
        />
      </div>
    </section>
  );
}
export function BookingInformation({ booking: b }: { booking: CustomerBooking }) {
  return (
    <div className="space-y-2 break-words">
      <h2 className="text-lg font-semibold">{b.bookingNumber}</h2>
      <p>Booking ID: {b.id}</p>
      <p>Booking status: {b.status}</p>
      <p>{b.eventName ?? "Event name not provided"}</p>
      <p>
        {b.bookingType}
        {b.eventType ? ` · ${b.eventType}` : ""}
      </p>
      <p>
        {b.foodTruck.name} · {b.vendor.businessName}
      </p>
      <p>
        Starts: <time dateTime={b.startsAt}>{b.startsAt}</time>
      </p>
      <p>
        Ends: {b.endsAt ? <time dateTime={b.endsAt}>{b.endsAt}</time> : "Not provided"}
      </p>
      <p>Guests: {b.guestCount}</p>
      <p>Location: {b.address}</p>
      {b.eventDescription && <p>{b.eventDescription}</p>}
      {b.specialInstructions && <p>Instructions: {b.specialInstructions}</p>}
      <p className="text-sm text-[var(--text-muted)]">
        Payment status is unavailable: these booking responses do not provide a Payment
        ID.
      </p>
    </div>
  );
}
function Tracking({ scope }: { scope: BookingSelection }) {
  const query = useGetCustomerBookingTrackingQuery(scope);
  return (
    <div className="space-y-3">
      <Button disabled={query.isFetching} onClick={() => void query.refetch()}>
        Refresh tracking
      </Button>
      {query.isFetching && (
        <AppLoader variant="compact" label="Loading booking tracking" />
      )}
      {query.error ? (
        <ErrorState
          error={normalizeApiError(query.error)}
          onRetry={() => void query.refetch()}
        />
      ) : (
        query.currentData && <BookingTimeline tracking={query.currentData} />
      )}
    </div>
  );
}
export function BookingTimeline({ tracking }: { tracking: BookingTracking }) {
  return (
    <section aria-label="Backend booking timeline" className="space-y-2">
      <h3 className="font-semibold">Booking tracking</h3>
      <p className="text-sm">
        Reported by the backend. This timeline is not a payment receipt.
      </p>
      {tracking.completion.hasOpenIssue && (
        <p role="status">This booking has an open issue.</p>
      )}
      <p>Completion requested: {tracking.completion.requestedAt ?? "Not requested"}</p>
      <p>Completion approved: {tracking.completion.approvedAt ?? "Not approved"}</p>
      <ol className="space-y-2">
        {tracking.steps.map((s) => (
          <li
            key={s.key}
            aria-current={s.key === tracking.currentStep ? "step" : undefined}
          >
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
