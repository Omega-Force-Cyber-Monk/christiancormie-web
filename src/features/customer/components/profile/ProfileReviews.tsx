import { Star } from "lucide-react";

import { EmptyState } from "@/components/states/EmptyState";
import { TruckImage } from "@/features/customer/components/discover/DiscoverTruckCard";
import { profileReviews } from "@/features/customer/data/profile-reviews.data";

export function ProfileReviews() {
  if (!profileReviews.length) {
    return (
      <EmptyState
        title="No sample reviews"
        description="There are no reviews in this static preview."
      />
    );
  }

  return (
    <ul aria-label="Sample customer reviews" className="space-y-4">
      {profileReviews.map((review) => (
        <li key={review.id}>
          <article
            aria-labelledby={`profile-review-${review.id}`}
            className={`profile-review ${review.bordered ? "" : "profile-review--unbordered"}`}
          >
            <div className="flex flex-wrap items-start gap-x-3 gap-y-2">
              <TruckImage
                alt={`${review.name} — sample reviewer`}
                className={`size-10 shrink-0 border border-[#2ED3D1]/30 ${review.avatarShape === "circle" ? "rounded-full" : "rounded-none"}`}
                name={review.name}
                src={review.avatar}
              />
              <div className="min-w-[100px] flex-1">
                <h3
                  className="text-base leading-6 font-semibold"
                  id={`profile-review-${review.id}`}
                >
                  {review.name}
                </h3>
                <span
                  aria-label={`${review.rating} out of 5 stars`}
                  className="mt-1 flex h-4 items-center gap-1 text-[#FFB547]"
                  role="img"
                >
                  {Array.from({ length: review.rating }, (_, index) => (
                    <Star
                      aria-hidden="true"
                      className="fill-current"
                      key={index}
                      size={16}
                      strokeWidth={1.5}
                    />
                  ))}
                </span>
              </div>
              <span className="mt-1 ml-auto text-xs leading-4 whitespace-nowrap text-[#B8C1D1]">
                {review.age}
              </span>
            </div>
            <p className="mt-5 text-base leading-6 text-[#E7E8E9]">
              {review.lines.map((line) => (
                <span className="block" key={line}>
                  {line}
                </span>
              ))}
            </p>
          </article>
        </li>
      ))}
    </ul>
  );
}
