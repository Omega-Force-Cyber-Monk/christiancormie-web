import { useEffect, useRef, useState } from "react";
import { useStore } from "react-redux";
import { Link } from "react-router";
import { toast } from "sonner";
import type { AppDispatch, RootState } from "@/app/store";
import { Button } from "@/components/ui/Button";
import { AppLoader } from "@/components/ui/AppLoader";
import { EmptyState } from "@/components/states/EmptyState";
import { ErrorState } from "@/components/states/ErrorState";
import { ConfirmationDialog } from "@/components/overlays/ConfirmationDialog/ConfirmationDialog";
import { useConfirmation } from "@/components/overlays/ConfirmationDialog/useConfirmation";
import { ROUTES } from "@/constants/routes";
import { scopeMatches } from "@/services/api/sessionGuard";
import { normalizeApiError } from "@/utils/errors/normalizeApiError";
import {
  financialAmount,
  formatFinancialAmount,
} from "@/features/payments/utils/financialValues";
import {
  communityOffersApi,
  useGetCustomerCommunityOffersQuery,
  type OfferRequest,
} from "../api/communityOffers.api";
import {
  ownsOfferRequest,
  offerDecisionAllowed,
  type CommunityOffer,
  type AcceptedCommunityOffer,
} from "../schemas/communityOffers.schema";
import type { CommunityPost } from "../schemas/community.schema";

export type CustomerCommunityOffersProps = {
  scope: OfferRequest;
  post: CommunityPost;
  onBack: () => void;
};
const amount = (value: string) =>
  formatFinancialAmount(financialAmount(value, null, "major"));

export function CustomerCommunityOffers(props: CustomerCommunityOffersProps) {
  if (
    !ownsOfferRequest(props.post, props.scope.userId) ||
    props.scope.role !== "CUSTOMER"
  )
    return <p role="alert">Only the Customer request owner can view these offers.</p>;
  return (
    <Offers
      key={`${props.scope.sessionId}:${props.scope.userId}:${props.scope.role}:${props.post.id}`}
      {...props}
    />
  );
}
function Offers({ scope, post, onBack }: CustomerCommunityOffersProps) {
  const query = useGetCustomerCommunityOffersQuery(scope);
  const confirmation = useConfirmation();
  const store = useStore<RootState>();
  const dispatch = store.dispatch as AppDispatch;
  const mounted = useRef(true);
  const [accepted, setAccepted] = useState<AcceptedCommunityOffer | null>(null);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);
  function decide(offer: CommunityOffer, action: "accept" | "reject") {
    if (
      !offerDecisionAllowed(post, scope.userId, offer) ||
      query.error ||
      query.isFetching
    )
      return;
    confirmation.confirm({
      title: action === "accept" ? "Accept this offer?" : "Reject this offer?",
      description:
        action === "accept"
          ? `Accepting ${offer.vendor.businessName}'s offer (${amount(offer.quotedAmount)}) creates a booking awaiting payment and rejects other pending offers. Currency is not supplied. No payment is collected here.`
          : `Reject the offer from ${offer.vendor.businessName}? This updates the offer on the server.`,
      confirmText: action === "accept" ? "Accept offer" : "Reject offer",
      variant: action === "reject" ? "danger" : "default",
      onConfirm: async () => {
        const request = dispatch(
          communityOffersApi.endpoints.decideCommunityOffer.initiate({
            ...scope,
            offerId: offer.id,
            action,
            confirmed: true,
          }),
        );
        try {
          const response = await request.unwrap();
          if (!response || !mounted.current || !scopeMatches(store.getState(), scope))
            return;
          if ("booking" in response) setAccepted(response);
          toast.success(
            action === "accept"
              ? "Offer accepted. No payment was collected."
              : "Offer rejected.",
          );
        } finally {
          request.reset();
        }
      },
    });
  }
  const busy = !!confirmation.confirmationProps?.isProcessing;
  return (
    <section className="community-offers-view" aria-label="Received Community offers">
      <div className="community-page-heading">
        <Button disabled={busy} onClick={onBack}>
          Back to post
        </Button>
        <h2>Quotes Received</h2>
      </div>
      {accepted && (
        <div role="status" className="community-form-panel break-words">
          <p>Booking {accepted.booking.bookingNumber} created.</p>
          <p>Booking ID: {accepted.booking.id}</p>
          <p>Booking status: {accepted.booking.status}</p>
          <p>No payment was collected.</p>
          <Link to={ROUTES.CUSTOMER_ORDERS}>View your bookings</Link>
        </div>
      )}
      <Button disabled={query.isFetching || busy} onClick={() => void query.refetch()}>
        Refresh offers
      </Button>
      {query.isFetching && <AppLoader variant="compact" label="Loading offers" />}
      {query.error ? (
        <ErrorState
          error={normalizeApiError(query.error)}
          onRetry={() => void query.refetch()}
        />
      ) : (
        query.currentData && (
          <>
            <p className="my-3 text-sm text-[#B8C1D1]">
              Newest offers first, as returned by the server. Currency is unavailable;
              no payment can be made here.
            </p>
            {!query.currentData.items.length ? (
              <EmptyState title="No offers yet" />
            ) : (
              <div className="community-form-panel space-y-8">
                {query.currentData.items.map((offer) => (
                  <CustomerCommunityOfferCard
                    key={offer.id}
                    offer={offer}
                    disabled={
                      busy ||
                      query.isFetching ||
                      !offerDecisionAllowed(post, scope.userId, offer)
                    }
                    onAccept={() => decide(offer, "accept")}
                    onReject={() => decide(offer, "reject")}
                  />
                ))}
              </div>
            )}
          </>
        )
      )}
      {confirmation.confirmationProps && (
        <ConfirmationDialog {...confirmation.confirmationProps} />
      )}
    </section>
  );
}
export function CustomerCommunityOfferCard({
  offer: o,
  disabled,
  onAccept,
  onReject,
}: {
  offer: CommunityOffer;
  disabled: boolean;
  onAccept: () => void;
  onReject: () => void;
}) {
  return (
    <article className="community-quote-card break-words">
      <header className="flex flex-wrap justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold">{o.vendor.businessName}</h3>
          <p>{o.foodTruck.name}</p>
        </div>
        <p className="text-xl text-[#2ED3D1]">{amount(o.quotedAmount)}</p>
      </header>
      <p className="mt-3">Offer status: {o.status}</p>
      <p className="text-sm text-[#B8C1D1]">
        Received: <time dateTime={o.createdAt}>{o.createdAt}</time>
      </p>
      {o.expiresAt && (
        <p>
          Expires: <time dateTime={o.expiresAt}>{o.expiresAt}</time>
        </p>
      )}
      {(o.noteToClient ?? o.message) && (
        <p className="mt-4 rounded-2xl bg-[#1B2233] p-3 text-sm">
          {o.noteToClient ?? o.message}
        </p>
      )}
      <details className="mt-4">
        <summary className="cursor-pointer">Offer details</summary>
        <p className="mt-3">Pricing: {o.pricingModel ?? "Not provided"}</p>
        {o.selectedMenuItems && (
          <ul className="mt-3 space-y-2">
            {o.selectedMenuItems.map((item, index) => (
              <li key={`${index}:${item}`}>{item}</li>
            ))}
          </ul>
        )}
        <dl className="community-quote-breakdown">
          {[
            ["Base service", o.baseServiceFee],
            ["Transport", o.transportFee],
            ["Service fee", o.serviceFee],
            ["Tax", o.taxAmount],
            ["Discount", o.discountAmount],
            ["Quoted total", o.quotedAmount],
            ["Quoted deposit", o.depositAmount],
            ["Quoted balance at event", o.balanceDueAtEvent],
          ].map(([label, value]) => (
            <div key={label}>
              <dt>{label}</dt>
              <dd>{amount(value)}</dd>
            </div>
          ))}
        </dl>
      </details>
      <div className="mt-5 flex flex-wrap gap-3">
        <Button disabled={disabled} onClick={onAccept}>
          Accept offer
        </Button>
        <Button disabled={disabled} onClick={onReject}>
          Reject offer
        </Button>
      </div>
    </article>
  );
}
