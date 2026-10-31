import { z } from "zod";
import { bookingSchema } from "@/features/customer/schemas/booking.schema";
import type { CommunityPost } from "./community.schema";

const money = z.string().regex(/^-?\d+(\.\d+)?$/);
const date = z.iso.datetime({ offset: true });
export const communityOfferSchema = z
  .object({
    id: z.uuid(),
    communityRequestId: z.uuid(),
    vendorId: z.uuid(),
    foodTruckId: z.uuid(),
    status: z.enum(["PENDING", "ACCEPTED", "REJECTED", "WITHDRAWN", "EXPIRED"]),
    expiresAt: date.nullable(),
    createdAt: date,
    message: z.string().nullable(),
    noteToClient: z.string().nullable(),
    pricingModel: z.enum(["FLAT_FEE", "PER_PERSON"]).nullable(),
    selectedMenuItems: z.array(z.string()).nullable(),
    quotedAmount: money,
    baseServiceFee: money,
    transportFee: money,
    serviceFee: money,
    taxAmount: money,
    discountAmount: money,
    depositAmount: money,
    balanceDueAtEvent: money,
    vendor: z.object({
      id: z.uuid(),
      businessName: z.string(),
      isVerified: z.boolean(),
    }),
    foodTruck: z.object({ id: z.uuid(), name: z.string() }),
    communityRequest: z.object({
      id: z.uuid(),
      createdById: z.uuid(),
      status: z.enum(["DRAFT", "OPEN", "MATCHED", "CLOSED", "CANCELLED", "EXPIRED"]),
    }),
  })
  .refine(
    (o) =>
      o.vendor.id === o.vendorId &&
      o.foodTruck.id === o.foodTruckId &&
      o.communityRequest.id === o.communityRequestId,
  );
export const communityOffersSchema = z.object({
  message: z.string(),
  items: z.array(communityOfferSchema),
});
export const acceptedCommunityOfferSchema = z.object({
  offer: communityOfferSchema,
  booking: bookingSchema.safeExtend({
    vendorOfferId: z.uuid(),
    communityRequestId: z.uuid(),
  }),
});
export type CommunityOffer = z.infer<typeof communityOfferSchema>;
export type CommunityOffers = z.infer<typeof communityOffersSchema>;
export type AcceptedCommunityOffer = z.infer<typeof acceptedCommunityOfferSchema>;

export function ownsOfferRequest(post: CommunityPost | undefined, userId: string) {
  return (
    !!post &&
    post.category === "NEED_TRUCK" &&
    post.viewer?.isOwner === true &&
    post.author?.id === userId
  );
}
export function offerDecisionAllowed(
  post: CommunityPost | undefined,
  userId: string,
  offer: CommunityOffer,
  now = Date.now(),
) {
  return (
    ownsOfferRequest(post, userId) &&
    post?.status === "OPEN" &&
    (!post.expiresAt || Date.parse(post.expiresAt) > now) &&
    offer.communityRequestId === post.id &&
    offer.communityRequest.createdById === userId &&
    offer.communityRequest.status === "OPEN" &&
    offer.status === "PENDING" &&
    (!offer.expiresAt || Date.parse(offer.expiresAt) > now)
  );
}
