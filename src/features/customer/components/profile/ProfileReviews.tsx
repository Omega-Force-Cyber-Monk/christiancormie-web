import { EmptyState } from "@/components/states/EmptyState";
import { TruckImage } from "@/features/customer/components/discover/DiscoverTruckCard";
import type { ReviewsDto } from "@/features/customer/types/discovery.types";
import { safeImage } from "@/features/customer/utils/discoveryAdapters";
export function ProfileReviews({ reviews }: { reviews: ReviewsDto["items"] }) {
  if (!reviews.length) return <EmptyState title="No reviews yet" />;
  return (
    <ul aria-label="Customer reviews" className="space-y-4">
      {reviews.map((review) => (
        <li key={review.id}>
          <article
            aria-labelledby={`profile-review-${review.id}`}
            className="profile-review"
          >
            <div className="flex flex-wrap items-start gap-x-3 gap-y-2">
              <TruckImage
                alt={review.customer.name}
                className="size-10 shrink-0 rounded-full border border-[#2ED3D1]/30"
                name={review.customer.name}
                src={safeImage(review.customer.avatarUrl)}
              />
              <div className="min-w-[100px] flex-1">
                <h3
                  id={`profile-review-${review.id}`}
                  className="text-base font-semibold"
                >
                  {review.customer.name}
                </h3>
                <p className="text-[#FFB547]">
                  {review.rating} / 5{review.isVerified ? " · Verified review" : ""}
                </p>
              </div>
              <span className="text-xs text-[#B8C1D1]">
                {Number.isNaN(Date.parse(review.createdAt))
                  ? "Date unavailable"
                  : new Date(review.createdAt).toLocaleDateString("en-US", {
                      timeZone: "UTC",
                    })}
              </span>
            </div>
            {review.title && <h4 className="mt-4 font-semibold">{review.title}</h4>}
            <p className="mt-5 text-base leading-6 text-[#E7E8E9]">{review.content}</p>
            {review.vendorResponse && (
              <p className="mt-3 text-sm">Vendor response: {review.vendorResponse}</p>
            )}
          </article>
        </li>
      ))}
    </ul>
  );
}
