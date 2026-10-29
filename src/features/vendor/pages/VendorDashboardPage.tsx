import { usePublishPost } from "@/features/social/utils/usePublishPost";
import {
  Activity,
  ChevronRight,
  DollarSign,
  Plus,
  QrCode,
  UserRound,
} from "lucide-react";
import { useState } from "react";
import { VendorHomeDialog } from "@/features/vendor/components/home/VendorHomeDialog";
import { VendorHomeUpdateForm } from "@/features/vendor/components/home/VendorHomeUpdateForm";
import { VendorQrDrawer } from "@/features/vendor/components/home/VendorQrDrawer";
import { VendorAnalyticsPanel } from "@/features/vendor/components/home/VendorAnalyticsPanel";
import { vendorAccessState } from "@/features/vendor/components/home/VendorAccessState";
import {
  useGetVendorAnalyticsQuery,
  useGetVendorRequestCountsQuery,
} from "@/features/vendor/api/vendor.api";
import {
  useVendorContext,
  isVendorAccessError,
} from "@/features/vendor/utils/useVendorContext";
import { toVendorBooking, vendorNumber } from "@/features/vendor/utils/vendorAdapters";
import { AppLoader } from "@/components/ui/AppLoader";
import { EmptyState } from "@/components/states/EmptyState";
import { ErrorState } from "@/components/states/ErrorState";
import { normalizeApiError } from "@/utils/errors/normalizeApiError";

type Overlay = "qr" | "post" | "analytics" | { bookingId: string } | null;
export default function VendorDashboardPage() {
  const context = useVendorContext();
  const analytics = useGetVendorAnalyticsQuery(undefined, { skip: !context.allowed });
  const requests = useGetVendorRequestCountsQuery(undefined, {
    skip: !context.allowed,
  });
  const [overlay, setOverlay] = useState<Overlay>(null);
  const [draft, setDraft] = useState("");
  const [published, setPublished] = useState(false);
  const publisher = usePublishPost();
  const data = !isVendorAccessError(analytics.error)
    ? analytics.currentData
    : undefined;
  const counts = !isVendorAccessError(requests.error)
    ? requests.currentData
    : undefined;
  const bookings = (data?.recentBookings ?? []).map(toVendorBooking);
  const bookingId = typeof overlay === "object" && overlay ? overlay.bookingId : null;
  const booking = bookings.find((row) => row.id === bookingId);
  const close = () => setOverlay(null);
  const accessState = vendorAccessState(context);
  if (accessState) return <div className="vendor-home-page">{accessState}</div>;
  return (
    <div className="vendor-home-page">
      <h1 className="sr-only">Vendor Home</h1>
      {context.profile.isFetching ||
      context.trucks.isFetching ||
      analytics.isFetching ||
      requests.isFetching ? (
        <p role="status" className="text-xs text-[#B8C1D1]">
          Refreshing vendor dashboard...
        </p>
      ) : null}
      {context.profile.error ? (
        <ErrorState
          error={normalizeApiError(context.profile.error)}
          onRetry={() => {
            void context.profile.refetch();
          }}
        />
      ) : null}
      {context.trucks.error ? (
        <ErrorState
          error={normalizeApiError(context.trucks.error)}
          onRetry={() => {
            void context.trucks.refetch();
          }}
        />
      ) : null}
      {context.vendor?.verificationBadge ? (
        <p className="mb-3 text-xs text-[#B8C1D1]">
          {context.vendor.verificationBadge.message}
        </p>
      ) : null}
      {context.trucks.currentData?.length === 0 ? (
        <EmptyState
          title="No food trucks linked"
          description="This vendor has no food trucks yet. Complete truck onboarding to receive truck and QR information."
        />
      ) : null}
      <section className="vendor-home-actions" aria-label="Home quick actions">
        <button
          className="vendor-home-action vendor-home-action--post"
          type="button"
          disabled={publisher.isPublishing}
          onClick={() => setOverlay("post")}
        >
          <Plus size={20} aria-hidden="true" />
          <span>Post Update</span>
        </button>
        <button
          className="vendor-home-action vendor-home-action--earnings"
          type="button"
          onClick={() => setOverlay("analytics")}
        >
          <DollarSign size={20} aria-hidden="true" />
          <span>Earnings &amp; Analytics</span>
        </button>
        <button
          className="vendor-home-action vendor-home-action--qr"
          type="button"
          onClick={() => setOverlay("qr")}
        >
          <QrCode size={20} aria-hidden="true" />
          <span>QR Code</span>
        </button>
      </section>
      {published ? (
        <p className="mt-3 text-xs text-[#B8C1D1]" role="status">
          Update published.
        </p>
      ) : null}
      {requests.error ? (
        <ErrorState
          error={normalizeApiError(requests.error)}
          onRetry={() => {
            void requests.refetch();
          }}
        />
      ) : null}
      <p className="mt-3 text-xs text-[#B8C1D1]">
        Booking requests: {vendorNumber(counts?.bookings)}; Community requests:{" "}
        {vendorNumber(counts?.community)}; Active conversations:{" "}
        {vendorNumber(counts?.messages)}
      </p>
      <section className="mt-6" aria-labelledby="vendor-home-bookings">
        <h2 className="mb-3 text-base font-semibold" id="vendor-home-bookings">
          Bookings
        </h2>
        {analytics.error ? (
          <ErrorState
            error={normalizeApiError(analytics.error)}
            onRetry={() => {
              void analytics.refetch();
            }}
          />
        ) : null}
        {analytics.isFetching && !data ? (
          <AppLoader />
        ) : (
          <div className="space-y-3">
            {bookings.length ? (
              bookings.map((item) => (
                <button
                  type="button"
                  key={item.id}
                  className="vendor-home-booking"
                  aria-haspopup="dialog"
                  onClick={() => setOverlay({ bookingId: item.id })}
                >
                  {item.avatarUrl ? (
                    <img
                      src={item.avatarUrl}
                      alt=""
                      className="size-12 shrink-0 rounded-full border border-[#FF5733] object-cover"
                    />
                  ) : (
                    <span className="grid size-12 shrink-0 place-items-center rounded-full border border-[#FF5733]">
                      <UserRound aria-hidden="true" />
                    </span>
                  )}
                  <span className="min-w-0 flex-1">
                    <span className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-semibold">{item.title}</span>
                      <span
                        className={`vendor-home-booking-status vendor-home-booking-status--${item.status.toLowerCase()}`}
                      >
                        {item.status.replaceAll("_", " ")}
                      </span>
                    </span>
                    <span className="mt-1 block text-xs leading-[18px] text-[#B6B7BC]">
                      {item.truckName} - {item.when}
                    </span>
                    <span className="block text-xs leading-[18px] text-[#B6B7BC]">
                      {item.customer} - {item.amount}
                    </span>
                  </span>
                  <ChevronRight
                    size={18}
                    className="shrink-0 text-[#B8C1D1]"
                    aria-hidden="true"
                  />
                </button>
              ))
            ) : !analytics.isError ? (
              <EmptyState
                title="No recent bookings"
                description="Recent bookings will appear when available."
              />
            ) : null}
          </div>
        )}
      </section>
      <section className="mt-6" aria-labelledby="vendor-home-activity">
        <h2 className="mb-3 text-base font-semibold" id="vendor-home-activity">
          Recent Activity
        </h2>
        <ul className="vendor-home-activity">
          <li>
            <Activity size={24} aria-hidden="true" />
            <span className="min-w-0 flex-1">
              Recent activity is not available from the vendor dashboard yet.
            </span>
          </li>
        </ul>
      </section>
      {overlay === "qr" ? <VendorQrDrawer onClose={close} /> : null}
      {overlay === "post" ? (
        <VendorHomeDialog title="Post Update" onClose={close}>
          <VendorHomeUpdateForm
            draft={draft}
            onDraft={setDraft}
            disabled={
              !context.allowed ||
              context.trucks.currentData?.length !== 1 ||
              context.trucks.currentData[0]?.status !== "ACTIVE"
            }
            error={publisher.error}
            onSave={async (text) => {
              const trucks = context.trucks.currentData ?? [];
              if (!context.allowed || trucks.length !== 1) return;
              if (await publisher.publish({ text, foodTruckId: trucks[0].id })) {
                setPublished(true);
                setDraft("");
                setOverlay((current) => (current === "post" ? null : current));
              }
            }}
          />
        </VendorHomeDialog>
      ) : null}
      {overlay === "analytics" ? (
        <VendorHomeDialog title="Earnings & Analytics" onClose={close}>
          {analytics.isFetching && !data ? (
            <AppLoader />
          ) : (
            <VendorAnalyticsPanel
              data={data}
              counts={counts}
              trucks={context.trucks.currentData}
            />
          )}
          {analytics.error ? (
            <ErrorState
              error={normalizeApiError(analytics.error)}
              onRetry={() => {
                void analytics.refetch();
              }}
            />
          ) : null}
        </VendorHomeDialog>
      ) : null}
      {booking ? (
        <VendorHomeDialog title={booking.displayId} onClose={close}>
          <p className="mb-5 text-sm text-[#B8C1D1]">
            Recent booking information. No booking is changed.
          </p>
          <dl className="space-y-4">
            {[
              ["Customer", booking.customer],
              ["Food truck", booking.truckName],
              ["Status", booking.status],
              ["When", booking.when],
              ["Amount", booking.amount],
            ].map(([label, value]) => (
              <div key={label}>
                <dt className="text-xs text-[#B8C1D1]">{label}</dt>
                <dd className="mt-1 text-base">{value}</dd>
              </div>
            ))}
          </dl>
        </VendorHomeDialog>
      ) : null}
    </div>
  );
}
