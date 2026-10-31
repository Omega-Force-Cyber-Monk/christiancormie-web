import { useEffect, useId, useRef, useState } from "react";
import { useStore } from "react-redux";
import { useSearchParams } from "react-router";
import { notificationBookingId } from "@/features/notifications/notificationNavigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import type { RootState, AppDispatch } from "@/app/store";
import type { SessionScope } from "@/services/api/sessionGuard";
import { scopeMatches } from "@/services/api/sessionGuard";
import { ErrorState } from "@/components/states/ErrorState";
import { EmptyState } from "@/components/states/EmptyState";
import { AppLoader } from "@/components/ui/AppLoader";
import { FormError } from "@/components/forms/FormError";
import { ConfirmationDialog } from "@/components/overlays/ConfirmationDialog/ConfirmationDialog";
import { useConfirmation } from "@/components/overlays/ConfirmationDialog/useConfirmation";
import { normalizeApiError } from "@/utils/errors/normalizeApiError";
import {
  vendorBookingsApi,
  useGetVendorBookingsQuery,
  useGetVendorBookingCountsQuery,
  useGetVendorBookingQuery,
  useGetVendorBookingTrackingQuery,
  type VendorBookingSelection,
} from "../../api/vendorBookings.api";
import {
  vendorDecisionAllowed,
  vendorDecisionBodySchema,
  type VendorBooking,
  type VendorBookingFilters,
} from "../../schemas/vendorBookings.schema";
import { bookingStatusSchema } from "@/features/customer/schemas/booking.schema";
import { VendorBookingCard, VendorBookingTimeline } from "./VendorBookingViews";
import { RequestOrderDetails } from "./RequestOrderDetails";
import { RequestQuoteForm } from "./RequestQuoteForm";

export function VendorBookingsWorkspace({ scope }: { scope: SessionScope }) {
  const [tab, setTab] = useState<"REQUESTS" | "ORDERS">("REQUESTS");
  const [category, setCategory] = useState<"bookings" | "community">("bookings");
  const [source, setSource] =
    useState<NonNullable<VendorBookingFilters["source"]>>("ALL");
  const [status, setStatus] = useState("");
  const [params, setParams] = useSearchParams();
  const selected = notificationBookingId(params);
  const select = (id: string | null) => {
    const next = new URLSearchParams(params);
    if (id) next.set("booking", id);
    else next.delete("booking");
    setParams(next);
  };
  const counts = useGetVendorBookingCountsQuery(scope);
  const query = useGetVendorBookingsQuery(
    { ...scope, filters: { tab, source, ...(status ? { status } : {}) } },
    { skip: category === "community" },
  );
  if (selected)
    return (
      <VendorBookingDetail
        key={selected}
        scope={{ ...scope, bookingId: selected }}
        onBack={() => select(null)}
      />
    );
  return (
    <section className="request-list-page">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-semibold">
          {tab === "REQUESTS" ? "Requests" : "My Orders"}
        </h1>
        <button
          type="button"
          className="request-cyan"
          onClick={() => {
            setTab(tab === "REQUESTS" ? "ORDERS" : "REQUESTS");
            setCategory("bookings");
            setStatus("");
          }}
        >
          {tab === "REQUESTS" ? "My orders" : "Back to requests"}
        </button>
      </div>
      <div className="request-tabs" aria-label="Request categories">
        {(["bookings", "community"] as const).map((c) => (
          <button
            key={c}
            type="button"
            aria-pressed={category === c}
            onClick={() => setCategory(c)}
          >
            {c === "bookings" ? "Bookings" : "Community"}
            <span>
              {counts.error ? "Unavailable" : (counts.currentData?.[c] ?? "…")}
            </span>
          </button>
        ))}
      </div>
      <p className="mt-2 text-xs text-[#B8C1D1]">
        Badges count direct pending/quoted booking requests and available Community
        requests, not all Orders.
      </p>
      {counts.error && (
        <ErrorState
          error={normalizeApiError(counts.error)}
          onRetry={() => void counts.refetch()}
        />
      )}
      {counts.isFetching && (
        <AppLoader
          variant="compact"
          label={
            counts.currentData ? "Refreshing request counts" : "Loading request counts"
          }
        />
      )}
      {category === "community" ? (
        <EmptyState
          title="Community requests unavailable in Orders"
          description="Community browsing and offer actions are unavailable here."
        />
      ) : (
        <>
          <div className="my-4 flex flex-wrap items-end gap-3">
            <label className="grid gap-1 text-sm">
              Source
              <select
                className="request-input"
                value={source}
                onChange={(e) =>
                  setSource(
                    e.target.value as NonNullable<VendorBookingFilters["source"]>,
                  )
                }
              >
                <option value="ALL">All sources</option>
                <option value="DIRECT">Direct</option>
                <option value="COMMUNITY">Community bookings</option>
              </select>
            </label>
            <label className="grid gap-1 text-sm">
              Status
              <select
                className="request-input"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              >
                <option value="">Default tab statuses</option>
                {bookingStatusSchema.options.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </label>
            <button
              type="button"
              className="request-secondary"
              disabled={query.isFetching || counts.isFetching}
              onClick={() => {
                void query.refetch();
                void counts.refetch();
              }}
            >
              Refresh
            </button>
          </div>
          <p className="mb-3 text-xs text-[#B8C1D1]">
            An explicit status filter overrides the tab's default statuses.
          </p>
          {query.isFetching && (
            <AppLoader
              variant="compact"
              label={query.currentData ? "Refreshing bookings" : "Loading bookings"}
            />
          )}
          {query.error ? (
            <ErrorState
              error={normalizeApiError(query.error)}
              onRetry={() => void query.refetch()}
            />
          ) : (
            query.currentData && (
              <div className="mt-6 space-y-5">
                {query.currentData.length ? (
                  query.currentData.map((b) => (
                    <VendorBookingCard
                      key={b.id}
                      booking={b}
                      onDetails={() => select(b.id)}
                    />
                  ))
                ) : (
                  <EmptyState title="No bookings match these filters" />
                )}
              </div>
            )
          )}
        </>
      )}
    </section>
  );
}
function VendorBookingDetail({
  scope,
  onBack,
}: {
  scope: VendorBookingSelection;
  onBack: () => void;
}) {
  const query = useGetVendorBookingQuery(scope);
  const booking = query.currentData;
  return (
    <div className="space-y-4">
      <button type="button" className="request-secondary" onClick={onBack}>
        Back to bookings
      </button>
      <button
        type="button"
        className="request-secondary"
        disabled={query.isFetching}
        onClick={() => void query.refetch()}
      >
        Refresh details
      </button>
      {query.isFetching && (
        <AppLoader
          variant="compact"
          label={booking ? "Refreshing booking details" : "Loading booking details"}
        />
      )}
      {query.error && (
        <ErrorState
          error={normalizeApiError(query.error)}
          onRetry={() => void query.refetch()}
        />
      )}
      {booking && (
        <div hidden={!!query.error}>
          <RequestOrderDetails booking={booking} onBack={onBack}>
            <VendorTracking scope={scope} disabled={!!query.error} />
            <VendorDecision
              scope={scope}
              booking={booking}
              disabled={query.isFetching || !!query.error}
            />
            <RequestQuoteForm
              booking={booking}
              scope={scope}
              disabled={query.isFetching || !!query.error}
            />
          </RequestOrderDetails>
        </div>
      )}
    </div>
  );
}
function VendorTracking({
  scope,
  disabled,
}: {
  scope: VendorBookingSelection;
  disabled: boolean;
}) {
  const query = useGetVendorBookingTrackingQuery(scope, { skip: disabled });
  return (
    <div className="mt-5 space-y-3">
      <button
        type="button"
        className="request-secondary"
        disabled={disabled || query.isFetching}
        onClick={() => void query.refetch()}
      >
        Refresh tracking
      </button>
      {query.isFetching && (
        <AppLoader variant="compact" label="Loading booking tracking" />
      )}
      {query.error ? (
        <ErrorState
          error={normalizeApiError(query.error)}
          onRetry={disabled ? undefined : () => void query.refetch()}
        />
      ) : (
        query.currentData && <VendorBookingTimeline tracking={query.currentData} />
      )}
    </div>
  );
}
function VendorDecision({
  scope,
  booking,
  disabled,
}: {
  scope: VendorBookingSelection;
  booking: VendorBooking;
  disabled: boolean;
}) {
  const id = useId();
  const confirmation = useConfirmation();
  const store = useStore<RootState>();
  const dispatch = store.dispatch as AppDispatch;
  const form = useForm({
    resolver: zodResolver(vendorDecisionBodySchema),
    defaultValues: { reason: "" },
  });
  const mounted = useRef(true);
  const [result, setResult] = useState<VendorBooking | null>(null);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);
  function decide(action: "accept" | "reject", body: { reason?: string }) {
    if (disabled || !vendorDecisionAllowed(booking, action)) return;
    confirmation.confirm({
      title:
        action === "accept"
          ? "Accept this booking request?"
          : "Reject this booking request?",
      description: `Update booking ${booking.bookingNumber} (${booking.id}) to ${action === "accept" ? "ACCEPTED" : "REJECTED"}? This does not confirm a payment.`,
      confirmText: action === "accept" ? "Accept request" : "Reject request",
      variant: action === "reject" ? "danger" : "default",
      onConfirm: async () => {
        const req = dispatch(
          vendorBookingsApi.endpoints.decideVendorBooking.initiate({
            ...scope,
            action,
            body,
            confirmed: true,
          }),
        );
        try {
          const response = await req.unwrap();
          if (response && mounted.current && scopeMatches(store.getState(), scope)) {
            setResult(response);
            form.reset({ reason: "" });
            toast.success(`Booking updated to ${response.status}.`);
          }
        } finally {
          req.reset();
        }
      },
    });
  }
  const pending = !!confirmation.confirmationProps?.isProcessing;
  return (
    <section className="mt-6 space-y-3" aria-label="Vendor booking decisions">
      {result && (
        <p role="status">
          {result.bookingNumber}: {result.status}. No payment is confirmed by this
          decision.
        </p>
      )}
      <form noValidate onSubmit={(e) => e.preventDefault()}>
        <label htmlFor={id} className="mb-2 block text-sm">
          Reason (optional)
        </label>
        <textarea
          id={id}
          {...form.register("reason")}
          className="request-input min-h-24 w-full"
          disabled={pending}
        />
        <FormError message={form.formState.errors.reason?.message} />
        <div className="mt-3 flex flex-wrap gap-3">
          {(["accept", "reject"] as const).map((a) => (
            <button
              key={a}
              type="button"
              className={a === "accept" ? "request-cyan" : "request-secondary"}
              disabled={disabled || pending || !vendorDecisionAllowed(booking, a)}
              onClick={() => void form.handleSubmit((body) => decide(a, body))()}
            >
              {a === "accept" ? "Accept request" : "Reject request"}
            </button>
          ))}
        </div>
      </form>
      {!booking.endsAt && (
        <p>A server booking end time is required before decisions are available.</p>
      )}
      {confirmation.confirmationProps && (
        <ConfirmationDialog {...confirmation.confirmationProps} />
      )}
    </section>
  );
}
