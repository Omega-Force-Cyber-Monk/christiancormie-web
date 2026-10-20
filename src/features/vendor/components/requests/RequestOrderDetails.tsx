import {
  ArrowLeft,
  Check,
  ChevronDown,
  ChevronUp,
  MapPin,
  Navigation,
} from "lucide-react";
import { useState } from "react";
import { EventFacts, EventIdentity } from "./RequestCards";
import { QuoteBreakdown } from "./RequestQuoteForm";
import { defaultQuote, type VendorOrder } from "@/features/vendor/utils/requestsState";
export function RequestOrderDetails({
  order,
  onBack,
  onLocation,
  onMessage,
  onCall,
}: {
  order: VendorOrder;
  onBack: () => void;
  onLocation: () => void;
  onMessage: () => void;
  onCall: () => void;
}) {
  const [timeline, setTimeline] = useState(true);
  return (
    <div className="request-detail-page">
      <div className="request-page-heading">
        <button
          type="button"
          className="request-back"
          aria-label="Back to my orders"
          onClick={onBack}
        >
          <ArrowLeft size={20} />
        </button>
        <h1>My Orders</h1>
      </div>
      <article className="request-order-detail">
        <EventIdentity event={order} />
        <span className="request-kind">{order.kind}</span>
        <EventFacts event={order} price={order.price} />
        <button className="request-location" type="button" onClick={onLocation}>
          <MapPin size={18} />
          <span>{order.location}</span>
          <Navigation size={20} className="ml-auto text-[#FF5733]" />
          <span className="sr-only">View location</span>
        </button>
        {order.note && (
          <div className="my-6">
            <h2 className="mb-3 text-xs font-semibold text-[#B8C1D1]">CLIENT NOTE</h2>
            <p className="text-sm leading-6">&ldquo;{order.note}&rdquo;</p>
          </div>
        )}
        <QuoteBreakdown
          draft={{
            ...defaultQuote(),
            base: String(order.price),
            deposit: "100",
            charges: [],
            menus: [
              "Burger",
              "Caesar Salad Cups",
              "Garlic Breadsticks",
              "Veggie Pizzas",
            ],
          }}
          guests={order.guests}
        />
        <section className="mt-6">
          <button
            type="button"
            className="flex min-h-11 w-full items-center justify-between text-left text-lg font-semibold"
            aria-expanded={timeline}
            aria-controls="booking-timeline"
            onClick={() => setTimeline(!timeline)}
          >
            Booking Timeline
            {timeline ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </button>
          {timeline && (
            <ol id="booking-timeline" className="request-timeline">
              {[
                "Booking confirmed",
                "Deposit received",
                "Event day",
                "Completion request sent",
                "Completed",
              ].map((step, index) => (
                <li
                  key={step}
                  className={index <= 2 ? "text-[#2ED3D1]" : "text-[#B8C1D1]"}
                  aria-current={index === 2 ? "step" : undefined}
                >
                  <span>
                    {index < 2 ? (
                      <Check size={13} />
                    ) : (
                      <span
                        className={`size-2 rounded-full ${index === 2 ? "bg-[#2ED3D1]" : "bg-[#596174]"}`}
                      />
                    )}
                  </span>
                  {step}
                </li>
              ))}
            </ol>
          )}
        </section>
        <div className="mt-6 grid grid-cols-2 gap-3">
          <button className="request-secondary" type="button" onClick={onMessage}>
            Message
          </button>
          <button className="request-cyan" type="button" onClick={onCall}>
            Call Client
          </button>
        </div>
        <p className="mt-4 text-xs leading-5 text-[#B8C1D1]">
          Sample booking and payment timeline. Deposit shown is an illustrative local
          estimate.
        </p>
      </article>
    </div>
  );
}
