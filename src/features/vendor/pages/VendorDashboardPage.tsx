import {
  CalendarDays,
  ChevronRight,
  DollarSign,
  Heart,
  MessageCircle,
  Plus,
  QrCode,
  Radio,
  Star,
} from "lucide-react";
import { useReducer, useState } from "react";
import { VendorHomeDialog } from "@/features/vendor/components/home/VendorHomeDialog";
import { VendorHomeUpdateForm } from "@/features/vendor/components/home/VendorHomeUpdateForm";
import { VendorQrDrawer } from "@/features/vendor/components/home/VendorQrDrawer";
import {
  vendorHomeBookings,
  vendorHomeActivity,
  vendorHomePreviewDescriptions,
} from "@/features/vendor/data/home.data";
import {
  initialVendorHomeState,
  vendorHomeReducer,
} from "@/features/vendor/utils/homeState";

const money = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});
const activityIcons = {
  like: Heart,
  comment: MessageCircle,
  booking: CalendarDays,
  "review-request": Radio,
  review: Star,
};

export default function VendorDashboardPage() {
  const [state, dispatch] = useReducer(
    vendorHomeReducer,
    undefined,
    initialVendorHomeState,
  );
  const [draft, setDraft] = useState("");
  const bookingId =
    typeof state.overlay === "object" && state.overlay ? state.overlay.bookingId : null;
  const booking = vendorHomeBookings.find((item) => item.id === bookingId);
  const close = () => dispatch({ type: "open", overlay: null });
  return (
    <div className="vendor-home-page">
      <h1 className="sr-only">Vendor Home — static preview</h1>
      <section className="vendor-home-actions" aria-label="Home quick actions">
        <button
          className="vendor-home-action vendor-home-action--post"
          type="button"
          onClick={() => dispatch({ type: "open", overlay: "post" })}
        >
          <Plus size={20} aria-hidden="true" />
          <span>Post Update</span>
        </button>
        <button
          className="vendor-home-action vendor-home-action--earnings"
          type="button"
          onClick={() => dispatch({ type: "open", overlay: "analytics" })}
        >
          <DollarSign size={20} aria-hidden="true" />
          <span>Earnings &amp; Analytics</span>
        </button>
        <button
          className="vendor-home-action vendor-home-action--qr"
          type="button"
          onClick={() => dispatch({ type: "open", overlay: "qr" })}
        >
          <QrCode size={20} aria-hidden="true" />
          <span>QR Code</span>
        </button>
      </section>
      <section className="mt-6" aria-labelledby="vendor-home-bookings">
        <h2 className="mb-3 text-base font-semibold" id="vendor-home-bookings">
          Bookings
        </h2>
        <div className="space-y-3">
          {vendorHomeBookings.map((item) => (
            <button
              type="button"
              key={item.id}
              className="vendor-home-booking"
              aria-haspopup="dialog"
              onClick={() =>
                dispatch({ type: "open", overlay: { bookingId: item.id } })
              }
            >
              <img
                src={item.avatar}
                alt=""
                className="size-12 shrink-0 rounded-full border border-[#FF5733] object-cover"
              />
              <span className="min-w-0 flex-1">
                <span className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-semibold">{item.title}</span>
                  <span
                    className={`vendor-home-booking-status vendor-home-booking-status--${item.status.toLowerCase()}`}
                  >
                    {item.status}
                  </span>
                </span>
                <span className="mt-1 block text-xs leading-[18px] text-[#B6B7BC]">
                  {item.venue} · {item.when}
                </span>
                <span className="block text-xs leading-[18px] text-[#B6B7BC]">
                  {item.guests} guests · {money.format(item.amount)}
                </span>
              </span>
              <ChevronRight
                size={18}
                className="shrink-0 text-[#B8C1D1]"
                aria-hidden="true"
              />
            </button>
          ))}
        </div>
      </section>
      <section className="mt-6" aria-labelledby="vendor-home-activity">
        <h2 className="mb-3 text-base font-semibold" id="vendor-home-activity">
          Recent Activity
        </h2>
        <ul className="vendor-home-activity">
          {state.updates.map((item) => (
            <li key={item.id}>
              <Plus size={24} aria-hidden="true" />
              <span className="min-w-0 flex-1 break-words">
                Local update: {item.text}
              </span>
              <span className="text-xs">Not published</span>
            </li>
          ))}
          {vendorHomeActivity.map((item) => {
            const Icon = activityIcons[item.kind];
            return (
              <li key={item.id}>
                <Icon size={24} aria-hidden="true" />
                <span className="min-w-0 flex-1">{item.text}</span>
                <span className="shrink-0 text-xs text-[#B6B7BC]">{item.age}</span>
              </li>
            );
          })}
        </ul>
      </section>
      <p className="mt-4 text-xs leading-5 text-[#B8C1D1]" role="status">
        Static Vendor Home preview. Bookings, activity and relative dates are sample
        design content.
        {state.updates.length > 0
          ? ` ${state.updates.length} update${state.updates.length === 1 ? "" : "s"} saved locally; nothing published.`
          : ""}
      </p>
      {state.overlay === "qr" && <VendorQrDrawer onClose={close} />}
      {state.overlay === "post" && (
        <VendorHomeDialog title="Post Update" onClose={close}>
          <VendorHomeUpdateForm
            draft={draft}
            onDraft={setDraft}
            onSave={(text) => {
              dispatch({
                type: "save-update",
                update: { id: crypto.randomUUID(), text },
              });
              setDraft("");
            }}
          />
        </VendorHomeDialog>
      )}
      {state.overlay === "analytics" && (
        <VendorHomeDialog title="Earnings & Analytics preview" onClose={close}>
          <p className="text-sm leading-6 text-[#B8C1D1]">
            {vendorHomePreviewDescriptions["Earnings & Analytics"]}
          </p>
        </VendorHomeDialog>
      )}
      {booking && (
        <VendorHomeDialog title={booking.title} onClose={close}>
          <p className="mb-5 text-sm text-[#B8C1D1]">
            Sample booking details from the Home design. No booking is changed.
          </p>
          <dl className="space-y-4">
            {[
              ["Status", booking.status],
              ["Location", booking.venue],
              ["When", booking.when],
              ["Guests", String(booking.guests)],
              ["Amount", money.format(booking.amount)],
            ].map(([label, value]) => (
              <div key={label}>
                <dt className="text-xs text-[#B8C1D1]">{label}</dt>
                <dd className="mt-1 text-base">{value}</dd>
              </div>
            ))}
          </dl>
        </VendorHomeDialog>
      )}
    </div>
  );
}
