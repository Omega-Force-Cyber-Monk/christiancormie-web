import { ArrowLeft } from "lucide-react";
import { useId, useState, type ReactNode } from "react";
import { skipToken } from "@reduxjs/toolkit/query";
import { Modal } from "@/components/overlays/Modal/Modal";
import { EmptyState } from "@/components/states/EmptyState";
import { ErrorState } from "@/components/states/ErrorState";
import { Skeleton } from "@/components/states/Skeleton";
import { Button } from "@/components/ui/Button";
import { TruckImage } from "@/features/customer/components/discover/DiscoverTruckCard";
import {
  ProfileSummary,
  type ProfilePreviewAction,
} from "@/features/customer/components/profile/ProfileSummary";
import {
  ProfileTabs,
  type ProfileTab,
} from "@/features/customer/components/profile/ProfileTabs";
import { ProfileReviews } from "@/features/customer/components/profile/ProfileReviews";
import {
  useGetTruckProfileQuery,
  useGetTruckReviewsQuery,
  useGetTruckPromotionsQuery,
} from "@/features/customer/api/discovery.api";
import "@/features/customer/components/profile/profile.css";

export function DiscoverProfileView({
  slug,
  onBack,
  initialTab = "menu",
  onTabChange,
}: {
  slug: string;
  onBack: () => void;
  initialTab?: ProfileTab;
  onTabChange?: (tab: ProfileTab) => void;
}) {
  const [tab, setTab] = useState<ProfileTab>(initialTab);
  const [preview, setPreview] = useState<ProfilePreviewAction | null>(null);
  const [image, setImage] = useState<{ src: string; name: string } | null>(null);
  const [cursors, setCursors] = useState<(string | undefined)[]>([undefined]);
  const titleId = useId();
  const imageId = useId();
  const profileQuery = useGetTruckProfileQuery(slug);
  const profile = profileQuery.currentData;
  const denied =
    profileQuery.isError &&
    "status" in profileQuery.error &&
    [401, 403, 404].includes(Number(profileQuery.error.status));
  const reviews = useGetTruckReviewsQuery(
    profile && !denied ? { slug, cursor: cursors.at(-1) } : skipToken,
  );
  const promotions = useGetTruckPromotionsQuery(
    profile && !denied ? profile.id : skipToken,
  );
  function changeTab(next: ProfileTab) {
    setTab(next);
    onTabChange?.(next);
  }
  let content: ReactNode;
  if (profileQuery.isLoading)
    content = (
      <div role="status">
        <p>Loading truck profile…</p>
        <Skeleton className="h-64" />
      </div>
    );
  else if (denied || !profile)
    content = (
      <>
        <h1 className="text-xl" tabIndex={-1}>
          Profile unavailable
        </h1>
        <ErrorState onRetry={() => void profileQuery.refetch()} />
      </>
    );
  else {
    const descriptions = {
      message: "Messaging is not connected yet. No message has been sent.",
      book: "Booking and payments are not connected yet. No reservation or payment has been made.",
      directions: `${profile.currentAddress ?? "Location unavailable"}. Route guidance and driving distance are unavailable.`,
      offer:
        "Promotions below show current backend availability. Redemption is not connected.",
    };
    content = (
      <>
        {profileQuery.isFetching && <p role="status">Refreshing profile…</p>}
        {profileQuery.isError && (
          <ErrorState onRetry={() => void profileQuery.refetch()} />
        )}
        <article className="profile-card" aria-label={`${profile.name} profile`}>
          <ProfileSummary
            profile={profile}
            onPreview={setPreview}
            onReviews={() => {
              changeTab("reviews");
              document.getElementById("profile-tab-reviews")?.focus();
            }}
          />
          <section className="profile-summary mt-6" aria-label="Available promotions">
            <h2 className="font-semibold">Available promotions</h2>
            {promotions.isLoading ? (
              <p role="status">Loading promotions…</p>
            ) : promotions.isError ? (
              <ErrorState onRetry={() => void promotions.refetch()} />
            ) : promotions.currentData?.length ? (
              <ul>
                {promotions.currentData
                  .filter((p) => p.foodTruckId === profile.id)
                  .map((p) => (
                    <li className="profile-offer mt-3 rounded-xl p-3" key={p.id}>
                      <h3>{p.title}</h3>
                      <p className="text-sm">{p.description}</p>
                      <p className="text-xs">
                        {p.isFollowerOnly ? "Followers only · " : ""}
                        {p.type === "PERCENTAGE" && p.value != null
                          ? `${p.value}% · `
                          : ""}
                        Ends{" "}
                        {Number.isNaN(Date.parse(p.endsAt))
                          ? "date unavailable"
                          : new Date(p.endsAt).toLocaleString("en-US", {
                              timeZone: "UTC",
                            })}{" "}
                        UTC
                      </p>
                    </li>
                  ))}
              </ul>
            ) : (
              <EmptyState title="No available promotions" />
            )}
          </section>
          <ProfileTabs
            active={onTabChange ? initialTab : tab}
            onChange={changeTab}
            onImage={setImage}
            profile={profile}
            reviews={
              <>
                {reviews.isLoading || (reviews.isFetching && !reviews.currentData) ? (
                  <p role="status">Loading reviews…</p>
                ) : reviews.isError ? (
                  <ErrorState onRetry={() => void reviews.refetch()} />
                ) : (
                  reviews.currentData && (
                    <>
                      <p className="mb-4">
                        {reviews.currentData.summary.averageRating ??
                          "Rating unavailable"}{" "}
                        · {reviews.currentData.summary.totalReviews} reviews
                      </p>
                      <ProfileReviews reviews={reviews.currentData.items} />
                    </>
                  )
                )}
                <div className="mt-4 flex gap-3">
                  <Button
                    disabled={cursors.length === 1 || reviews.isFetching}
                    onClick={() => setCursors((c) => c.slice(0, -1))}
                  >
                    Previous reviews
                  </Button>
                  <Button
                    disabled={
                      !reviews.currentData?.nextCursor ||
                      reviews.isFetching ||
                      reviews.isError
                    }
                    onClick={() => {
                      const next = reviews.currentData?.nextCursor;
                      if (next) setCursors((c) => [...c, next]);
                    }}
                  >
                    Next reviews
                  </Button>
                </div>
              </>
            }
          />
        </article>
        <Modal
          isOpen={preview !== null}
          onClose={() => setPreview(null)}
          titleId={titleId}
        >
          <div className="p-6 pt-12">
            <h2 id={titleId} className="text-xl font-semibold">
              {preview === "directions"
                ? "Location"
                : preview === "book"
                  ? "Booking"
                  : preview === "message"
                    ? "Message"
                    : "Promotions"}
            </h2>
            <p className="mt-3 text-sm leading-6 text-[#B8C1D1]">
              {preview && descriptions[preview]}
            </p>
          </div>
        </Modal>
      </>
    );
  }
  return (
    <section className="customer-profile-page discover-profile-view">
      <button
        className="profile-back min-h-11 items-center gap-4 rounded-lg px-2 text-sm text-[#B8C1D1] focus-visible:outline"
        type="button"
        onClick={onBack}
      >
        <ArrowLeft size={20} />
        Back
      </button>
      {content}
      <Modal isOpen={image !== null} onClose={() => setImage(null)} titleId={imageId}>
        {image && (
          <div className="overflow-y-auto p-6 pt-12">
            <h2 id={imageId} className="mb-4 text-xl font-semibold">
              {image.name}
            </h2>
            <TruckImage
              src={image.src}
              name={image.name}
              alt={image.name}
              className="max-h-[60dvh] w-full rounded-xl object-contain"
            />
          </div>
        )}
      </Modal>
    </section>
  );
}
