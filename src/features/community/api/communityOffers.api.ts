import { z } from "zod";
import type { FetchBaseQueryError, QueryReturnValue } from "@reduxjs/toolkit/query";
import type { RootState } from "@/app/store";
import { baseApi } from "@/services/api/baseApi";
import {
  scopedRead,
  scopeMatches,
  sessionDenied,
  sessionFlight,
  type SessionScope,
} from "@/services/api/sessionGuard";
import { cachedCommunityPost } from "./community.api";
import {
  acceptedCommunityOfferSchema,
  communityOfferSchema,
  communityOffersSchema,
  ownsOfferRequest,
  offerDecisionAllowed,
  type AcceptedCommunityOffer,
  type CommunityOffer,
  type CommunityOffers,
} from "../schemas/communityOffers.schema";

export type OfferRequest = SessionScope & { postId: string };
export type OfferDecision = OfferRequest & {
  offerId: string;
  action: "accept" | "reject";
  confirmed: true;
};
function owner(state: RootState, s: OfferRequest) {
  return (
    s.role === "CUSTOMER" &&
    z.uuid().safeParse(s.postId).success &&
    scopeMatches(state, s) &&
    ownsOfferRequest(cachedCommunityPost(state, s, s.postId), s.userId)
  );
}
const decisionInput = z.object({
  offerId: z.uuid(),
  action: z.enum(["accept", "reject"]),
  confirmed: z.literal(true),
});
export const communityOffersApi = baseApi.injectEndpoints({
  endpoints: (b) => ({
    getCustomerCommunityOffers: b.query<CommunityOffers, OfferRequest>({
      keepUnusedDataFor: 0,
      queryFn(s, a, _e, q) {
        if (!owner(a.getState() as RootState, s)) return sessionDenied;
        return scopedRead(
          a,
          s,
          q,
          { url: `/community/posts/${s.postId}/offers`, method: "GET" },
          communityOffersSchema.refine(
            (r) =>
              r.items.every(
                (o) =>
                  o.communityRequestId === s.postId &&
                  o.communityRequest.createdById === s.userId,
              ) && new Set(r.items.map((o) => o.id)).size === r.items.length,
          ),
        );
      },
      providesTags: (_r, _e, s) => [{ type: "CommunityOffers", id: s.postId }],
    }),
    decideCommunityOffer: b.mutation<
      AcceptedCommunityOffer | CommunityOffer,
      OfferDecision
    >({
      queryFn(
        s,
        a,
        _e,
        q,
      ): Promise<
        QueryReturnValue<
          AcceptedCommunityOffer | CommunityOffer,
          FetchBaseQueryError,
          undefined
        >
      > {
        return sessionFlight(a, s, `community-offer:${s.postId}`, async () => {
          const state = a.getState() as RootState;
          const offers = communityOffersApi.endpoints.getCustomerCommunityOffers.select(
            {
              sessionId: s.sessionId,
              userId: s.userId,
              role: s.role,
              postId: s.postId,
            },
          )(state);
          const offer = offers.error
            ? undefined
            : offers.data?.items.find((o) => o.id === s.offerId);
          if (
            !decisionInput.safeParse(s).success ||
            !owner(state, s) ||
            !offer ||
            !offerDecisionAllowed(
              cachedCommunityPost(state, s, s.postId),
              s.userId,
              offer,
            )
          )
            return sessionDenied;
          const responseOffer = communityOfferSchema.refine(
            (o) =>
              o.id === s.offerId &&
              o.communityRequestId === s.postId &&
              o.communityRequest.createdById === s.userId &&
              o.vendorId === offer.vendorId &&
              o.foodTruckId === offer.foodTruckId &&
              o.status === (s.action === "accept" ? "ACCEPTED" : "REJECTED"),
          );
          const args = {
            url: `/community/offers/${s.offerId}/${s.action}`,
            method: "PATCH",
          };
          const result =
            s.action === "reject"
              ? await scopedRead(a, s, q, args, responseOffer)
              : await scopedRead(
                  a,
                  s,
                  q,
                  args,
                  acceptedCommunityOfferSchema.refine(
                    (r) =>
                      responseOffer.safeParse(r.offer).success &&
                      r.booking.customerId === s.userId &&
                      r.booking.communityRequestId === s.postId &&
                      r.booking.vendorOfferId === s.offerId &&
                      r.booking.vendorId === offer.vendorId &&
                      r.booking.foodTruckId === offer.foodTruckId,
                  ),
                );
          // A write may have committed even when its response was lost or malformed.
          // Refresh only the session that initiated it, including after conflicts.
          if (scopeMatches(a.getState() as RootState, s))
            a.dispatch(
              baseApi.util.invalidateTags([
                { type: "CommunityOffers", id: s.postId },
                "CommunityList",
                { type: "CommunityPost", id: s.postId },
                "CustomerBookings",
              ]),
            );
          return result;
        });
      },
    }),
  }),
});
export const { useGetCustomerCommunityOffersQuery } = communityOffersApi;
