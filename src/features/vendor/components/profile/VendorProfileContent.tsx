import { useState } from "react";
import { skipToken } from "@reduxjs/toolkit/query";
import { useAppSelector } from "@/app/hooks";
import { useVendorContext } from "@/features/vendor/utils/useVendorContext";
import { SocialPostsGallery } from "@/features/social/components/SocialPostsGallery";
import { useGetTruckReviewsQuery } from "@/features/customer/api/discovery.api";
import { ErrorState } from "@/components/states/ErrorState";
import { EmptyState } from "@/components/states/EmptyState";
import { Button } from "@/components/ui/Button";
import { remoteMedia } from "@/utils/files/remoteMedia";
export function VendorProfileGallery() {
  const context = useVendorContext();
  const userId = useAppSelector((s) => s.auth.user?.id);
  const [tab, setTab] = useState<"posts" | "tagged">("posts");
  if (context.profile.isLoading) return <p role="status">Loading vendor identity…</p>;
  if (!context.allowed || !userId)
    return <ErrorState onRetry={() => void context.profile.refetch()} />;
  return (
    <section aria-label="Profile gallery">
      <div className="flex gap-3 p-4">
        <Button aria-pressed={tab === "posts"} onClick={() => setTab("posts")}>
          Posts
        </Button>
        <Button aria-pressed={tab === "tagged"} onClick={() => setTab("tagged")}>
          Tagged posts
        </Button>
      </div>
      <SocialPostsGallery
        key={`${userId}:${tab}`}
        userId={userId}
        tab={tab}
        variant="vendor"
      />
    </section>
  );
}
export function VendorProfileReviews() {
  const context = useVendorContext();
  const [selected, setSelected] = useState("");
  const trucks = context.trucks.currentData ?? [];
  const truck = trucks.length === 1 ? trucks[0] : trucks.find((t) => t.id === selected);
  return (
    <section aria-label="Profile reviews" className="vendor-profile-reviews">
      {context.profile.isLoading || context.trucks.isLoading ? (
        <p role="status">Loading truck identity…</p>
      ) : !context.allowed ? (
        <ErrorState
          onRetry={() => {
            void context.profile.refetch();
            void context.trucks.refetch();
          }}
        />
      ) : !trucks.length ? (
        <EmptyState title="No food truck available for reviews" />
      ) : (
        <>
          {trucks.length > 1 && (
            <label>
              Food truck
              <select
                value={selected}
                onChange={(event) => setSelected(event.target.value)}
              >
                <option value="">Choose a truck</option>
                {trucks.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
            </label>
          )}
          {truck ? (
            <TruckReviewList key={truck.slug} slug={truck.slug} />
          ) : (
            <p>Choose a truck to load its reviews.</p>
          )}
        </>
      )}
    </section>
  );
}
function TruckReviewList({ slug }: { slug: string }) {
  const [cursors, setCursors] = useState<(string | undefined)[]>([undefined]);
  const query = useGetTruckReviewsQuery(
    slug ? { slug, cursor: cursors.at(-1) } : skipToken,
  );
  return (
    <>
      {query.isLoading || (query.isFetching && !query.currentData) ? (
        <p role="status">Loading reviews…</p>
      ) : query.isError ? (
        <ErrorState onRetry={() => void query.refetch()} />
      ) : query.currentData?.items.length ? (
        <ul className="space-y-4">
          {query.currentData.items.map((review) => (
            <li key={review.id} className="vendor-profile-review">
              <div className="flex items-start gap-3">
                {remoteMedia(review.customer.avatarUrl) && (
                  <img
                    className="size-10 rounded-full object-cover"
                    src={remoteMedia(review.customer.avatarUrl)}
                    alt=""
                  />
                )}
                <div>
                  <h2 className="text-base font-semibold">{review.customer.name}</h2>
                  <p className="mt-1 text-[#FFB800]">
                    {review.rating} / 5{review.isVerified ? " · Verified review" : ""}
                  </p>
                </div>
              </div>
              <p className="mt-3 text-sm leading-5 text-[#B6B7BC]">{review.title}</p>
              <p className="text-sm">{review.content}</p>
              {review.vendorResponse && (
                <p className="mt-3 text-sm">Vendor response: {review.vendorResponse}</p>
              )}
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState title="No reviews yet" />
      )}
      <div className="mt-4 flex gap-3">
        <Button
          disabled={cursors.length === 1 || query.isFetching}
          onClick={() => setCursors((c) => c.slice(0, -1))}
        >
          Previous reviews
        </Button>
        <Button
          disabled={!query.currentData?.nextCursor || query.isFetching || query.isError}
          onClick={() => {
            const next = query.currentData?.nextCursor;
            if (next) setCursors((c) => [...c, next]);
          }}
        >
          Next reviews
        </Button>
      </div>
    </>
  );
}
