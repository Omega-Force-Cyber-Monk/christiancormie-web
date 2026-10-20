import {
  CalendarDays,
  ChevronDown,
  ChevronUp,
  MapPin,
  Users,
  Utensils,
  Wallet,
} from "lucide-react";
import { useId, useState } from "react";
import {
  dollars,
  requestDescription,
  requestMenus,
  type RequestEvent,
  type VendorOrder,
} from "@/features/vendor/utils/requestsState";

export function EventIdentity({ event }: { event: RequestEvent }) {
  return (
    <div className="flex min-w-0 items-center gap-3">
      <img
        className="size-11 shrink-0 rounded-full object-cover"
        src={event.avatar}
        alt=""
      />
      <div className="min-w-0">
        <h2 className="font-semibold">{event.client}</h2>
        <p className="mt-1 text-xs text-[#B8C1D1]">{event.age}</p>
      </div>
    </div>
  );
}
export function EventFacts({ event, price }: { event: RequestEvent; price?: number }) {
  const facts = [
    { Icon: CalendarDays, label: event.date, value: event.time },
    { Icon: MapPin, label: "Location", value: event.location },
    { Icon: Users, label: "Guests", value: String(event.guests) },
    {
      Icon: Wallet,
      label: price !== undefined ? "Price" : "Budget",
      value: price !== undefined ? dollars(price * 100) : event.budget,
    },
  ];
  return (
    <dl className="request-facts">
      {facts.map(({ Icon, label, value }) => (
        <div key={label}>
          <Icon size={17} aria-hidden="true" />
          <div>
            <dt>{label}</dt>
            <dd>{value}</dd>
          </div>
        </div>
      ))}
    </dl>
  );
}
export function BookingRequestCard({
  event,
  community = false,
  quoted,
  onIgnore,
  onQuote,
  onOffers,
}: {
  event: RequestEvent;
  community?: boolean;
  quoted: boolean;
  onIgnore: () => void;
  onQuote: () => void;
  onOffers?: () => void;
}) {
  const [expanded, setExpanded] = useState(true);
  const detailsId = useId();
  const toggle = (
    <button
      className="request-details-toggle"
      aria-expanded={expanded}
      aria-controls={detailsId}
      type="button"
      onClick={() => setExpanded(!expanded)}
    >
      {expanded ? "Hide Details" : "Show Details"}
      {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
    </button>
  );
  return (
    <article className="request-booking-card">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <EventIdentity event={event} />
        {community && (
          <button
            type="button"
            className="text-sm text-[#B8C1D1] underline"
            onClick={onOffers}
          >
            2 offers
          </button>
        )}
      </div>
      <span className="request-kind">{event.kind}</span>
      <p className="mt-3 mb-5 text-sm leading-6">{requestDescription}</p>
      {community && toggle}
      {(!community || expanded) && <EventFacts event={event} />}
      {!community && toggle}
      {expanded && (
        <div id={detailsId} className="mt-5">
          <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold">
            <Utensils size={17} className="text-[#FF5733]" /> Menu Items
          </h3>
          <ul className="grid gap-3 text-sm text-[#B8C1D1] sm:grid-cols-2">
            {requestMenus.map((menu) => (
              <li key={menu}>{menu}</li>
            ))}
          </ul>
        </div>
      )}
      <div className="mt-6 grid grid-cols-2 gap-3">
        <button type="button" className="request-secondary" onClick={onIgnore}>
          Ignore
        </button>
        <button type="button" className="request-primary" onClick={onQuote}>
          {quoted ? "View local quote" : "Send quote"}
        </button>
      </div>
    </article>
  );
}
export function OrderCard({
  order,
  onMessage,
  onDetails,
}: {
  order: VendorOrder;
  onMessage: () => void;
  onDetails: () => void;
}) {
  return (
    <article className="request-order-card">
      <EventIdentity event={order} />
      <span className="request-kind">{order.kind}</span>
      <EventFacts event={order} price={order.price} />
      <div className="mt-5 grid grid-cols-2 gap-3">
        <button type="button" className="request-secondary" onClick={onMessage}>
          Message
        </button>
        <button type="button" className="request-primary" onClick={onDetails}>
          View Details
        </button>
      </div>
    </article>
  );
}
