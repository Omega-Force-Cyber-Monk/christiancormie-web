import { zodResolver } from "@hookform/resolvers/zod";
import {
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  MessageCircle,
  Star,
  TriangleAlert,
  Utensils,
} from "lucide-react";
import { useId, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/Button";
import { FormError } from "@/components/forms/FormError";
import { EmptyState } from "@/components/states/EmptyState";
import { Modal } from "@/components/overlays/Modal/Modal";
import { TruckImage } from "@/features/customer/components/discover/DiscoverTruckCard";
import type { CommunityPost } from "@/features/customer/data/community.data";
import {
  communityMoney,
  communityQuotes,
  type CommunityQuote,
} from "@/features/customer/data/community-requests.data";
import { communityQuoteConsentSchema } from "@/features/customer/schemas/community.schema";
import {
  CustomerCommunityOffers,
  type CustomerCommunityOffersProps,
} from "@/features/community/components/CustomerCommunityOffers";

function CommunityQuoteCard({
  quote,
  payment,
  selected,
  initiallyExpanded,
  onIgnore,
  onAccept,
  onMessage,
}: {
  quote: CommunityQuote;
  payment: boolean;
  selected: boolean;
  initiallyExpanded: boolean;
  onIgnore: () => void;
  onAccept: () => void;
  onMessage: () => void;
}) {
  const [expanded, setExpanded] = useState(initiallyExpanded);
  const busy = useRef(false);
  const id = useId();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(communityQuoteConsentSchema),
    defaultValues: { terms: false, deposit: false },
  });
  return (
    <form
      className={`community-quote-card ${payment ? "community-quote-card--payment" : ""} ${selected ? "community-quote-card--selected" : ""}`}
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        if (busy.current) return;
        setExpanded(true);
        busy.current = true;
        void handleSubmit(onAccept)(event).finally(() => {
          busy.current = false;
        });
      }}
    >
      <header className="flex items-start gap-3">
        <TruckImage
          src={quote.image}
          name={quote.name}
          className="size-12 shrink-0 rounded-full border-2 border-[#FF6B4A]"
        />
        <div className="min-w-0 flex-1">
          <h2 className="text-lg font-semibold">{quote.name}</h2>
          <p className="mt-1 text-xs font-semibold text-[#2ED3D1]">{quote.cuisine}</p>
          <p className="mt-2 flex items-center gap-1 text-sm">
            <Star
              aria-hidden="true"
              className="fill-[#FFB547] text-[#FFB547]"
              size={16}
            />
            4.7<span className="ml-2 text-xs text-[#B8C1D1]">1 day ago</span>
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs text-[#B8C1D1]">Total Quote</p>
          <p className="text-2xl font-bold text-[#2ED3D1]">
            {communityMoney(quote.totalCents)}
          </p>
        </div>
      </header>
      <p className="mt-4 rounded-2xl border border-white/5 bg-[#1B2233] p-3 text-sm leading-6">
        Kids love watching us make pizzas in our wood-fired oven! We offer lots of
        veggie options and can customize for dietary needs.
      </p>
      <button
        type="button"
        className="community-quote-toggle"
        aria-expanded={expanded}
        aria-controls={`${id}-details`}
        onClick={() => setExpanded((current) => !current)}
      >
        {expanded ? "Hide Details" : "Show Details"}
        {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
      </button>
      <div hidden={!expanded} id={`${id}-details`}>
        <h3 className="mt-5 flex items-center gap-2 font-semibold text-[#B8C1D1]">
          <Utensils size={22} className="text-[#FF5733]" />
          Menu Items
        </h3>
        <ul className="mt-3 space-y-2 text-sm">
          {quote.menus.map((menu) => (
            <li key={menu}>{menu}</li>
          ))}
        </ul>
        <dl className="mt-6 space-y-4">
          {[
            ["Pricing Model", "Flat fee"],
            ["Payment Terms", "Deposit only"],
            ["Deposit amount", communityMoney(quote.depositCents)],
          ].map(([label, value]) => (
            <div key={label}>
              <dt className="mb-2 font-semibold text-[#B8C1D1]">{label}</dt>
              <dd className="rounded-xl bg-[#121826] p-3 text-sm text-[#B8C1D1]">
                {value}
              </dd>
            </div>
          ))}
        </dl>
        <dl className="community-quote-breakdown">
          <div>
            <dt>Quoted service amount</dt>
            <dd>{communityMoney(quote.totalCents - quote.travelCents)}</dd>
          </div>
          <div>
            <dt>Transport</dt>
            <dd>{communityMoney(quote.travelCents)}</dd>
          </div>
          <div>
            <dt>Total</dt>
            <dd className="text-[#2ED3D1]">{communityMoney(quote.totalCents)}</dd>
          </div>
          <div>
            <dt>Deposit due now</dt>
            <dd className="text-[#FF5733]">{communityMoney(quote.depositCents)}</dd>
          </div>
        </dl>
        <p className="mt-4 flex gap-3 rounded-2xl border border-[#FFB547]/30 bg-[#FFB547]/10 p-4 text-xs leading-5 text-[#B8C1D1]">
          <TriangleAlert size={18} className="shrink-0 text-[#FFB547]" />
          <span>
            <strong className="text-[#FFB547]">Sample deposit amount only.</strong> Live
            payment and refund terms are unavailable. This preview does not take a
            deposit, notify a vendor, or create a binding booking.
          </span>
        </p>
        <label className="mt-4 flex items-start gap-3 text-sm">
          <input
            {...register("terms")}
            type="checkbox"
            className="mt-0.5 size-5 shrink-0 accent-[#FF5733]"
            aria-invalid={Boolean(errors.terms)}
            aria-describedby={errors.terms ? `${id}-terms-error` : undefined}
          />
          <span>I acknowledge the booking terms preview.</span>
        </label>
        <FormError id={`${id}-terms-error`} message={errors.terms?.message} />
        <label className="mt-3 flex items-start gap-3 text-sm">
          <input
            {...register("deposit")}
            type="checkbox"
            className="mt-0.5 size-5 shrink-0 accent-[#FF5733]"
            aria-invalid={Boolean(errors.deposit)}
            aria-describedby={errors.deposit ? `${id}-deposit-error` : undefined}
          />
          <span>
            I have reviewed the {communityMoney(quote.depositCents)} sample deposit. No
            payment or refund terms are agreed here.
          </span>
        </label>
        <FormError id={`${id}-deposit-error`} message={errors.deposit?.message} />
      </div>
      <footer className="mt-8 grid grid-cols-3 gap-3 border-t border-white/5 pt-4">
        <Button onClick={onIgnore}>Ignore</Button>
        <Button
          aria-label={`Message ${quote.name} about this quote`}
          onClick={onMessage}
        >
          <MessageCircle size={18} />
        </Button>
        <Button type="submit" className="community-primary" disabled={isSubmitting}>
          {payment ? "Complete preview" : "Review sample quote"}
        </Button>
      </footer>
    </form>
  );
}

export function CommunityOffersView(
  props: CustomerCommunityOffersProps | Parameters<typeof CommunityOffersPreview>[0],
) {
  return "scope" in props ? (
    <CustomerCommunityOffers {...props} />
  ) : (
    <CommunityOffersPreview {...props} />
  );
}
function CommunityOffersPreview({
  post,
  payment,
  selectedQuoteId,
  onBack,
  onPayment,
  onConfirm,
  onIgnore,
}: {
  post: CommunityPost;
  payment: boolean;
  selectedQuoteId: string | null;
  onBack: () => void;
  onPayment: (id: string) => void;
  onConfirm: (id: string) => void;
  onIgnore: (id: string) => void;
}) {
  const [message, setMessage] = useState(false);
  const quotes =
    (post.request?.offers ?? 0) > 0
      ? communityQuotes.filter((quote) => !post.ignoredQuoteIds?.includes(quote.id))
      : [];
  return (
    <section
      className={`community-offers-view ${payment ? "community-payment-view" : ""}`}
    >
      <div className="community-page-heading">
        <Button
          aria-label={payment ? "Back to quotes" : "Back to Community"}
          onClick={onBack}
        >
          <ArrowLeft size={20} />
        </Button>
        <div>
          <h1>{payment ? "Payment preview" : "Quotes Received (sample)"}</h1>
          <p>
            {quotes.length} sample offers for your {post.request?.occasion ?? "event"}
          </p>
        </div>
      </div>
      <div className="community-form-panel">
        <p className="mb-5 border-b border-white/5 pb-5 text-center text-sm text-[#B8C1D1]">
          {post.request?.date} · {post.request?.location} · {post.request?.guests}{" "}
          guests
        </p>
        {payment && (
          <p
            role="status"
            className="mb-5 rounded-xl bg-[#2ED3D1]/10 p-3 text-sm text-[#2ED3D1]"
          >
            Local payment preview. No money will move.
          </p>
        )}
        <div className="space-y-8">
          {quotes.length ? (
            quotes.map((quote, index) => (
              <CommunityQuoteCard
                key={`${post.id}-${quote.id}`}
                quote={quote}
                payment={payment}
                selected={selectedQuoteId === quote.id}
                initiallyExpanded={index === 1}
                onIgnore={() => onIgnore(quote.id)}
                onAccept={() => (payment ? onConfirm(quote.id) : onPayment(quote.id))}
                onMessage={() => setMessage(true)}
              />
            ))
          ) : (
            <EmptyState
              title="No sample offers available"
              description="No quotes are available for this request in the local preview."
            />
          )}
        </div>
      </div>
      <Modal
        isOpen={message}
        onClose={() => setMessage(false)}
        titleId="community-quote-message-title"
      >
        <div className="p-6 pt-12">
          <h2 id="community-quote-message-title" className="text-xl font-semibold">
            Message preview
          </h2>
          <p className="mt-3 text-sm leading-6 text-[#B8C1D1]">
            Vendor messaging requires backend integration. No message has been sent.
          </p>
        </div>
      </Modal>
    </section>
  );
}
