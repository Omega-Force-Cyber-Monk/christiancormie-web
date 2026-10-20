import { ArrowLeft, Heart, MapPin, Star } from "lucide-react";
import { useId, useState } from "react";

import { Modal } from "@/components/overlays/Modal/Modal";
import { EmptyState } from "@/components/states/EmptyState";
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
import type { DiscoverTruck } from "@/features/customer/data/discover.data";
import "@/features/customer/components/profile/profile.css";

export function DiscoverProfileView({
  truck,
  saved,
  onSave,
  onBack,
  onBook,
}: {
  truck: DiscoverTruck;
  saved: boolean;
  onSave: () => void;
  onBack: () => void;
  onBook: () => void;
}) {
  const [tab, setTab] = useState<ProfileTab>("menu");
  const [preview, setPreview] = useState<ProfilePreviewAction | null>(null);
  const [image, setImage] = useState<{ src: string; name: string } | null>(null);
  const [following, setFollowing] = useState(false);
  const titleId = useId();
  const imageId = useId();
  const fullProfile = truck.id === "taco-paradise";
  function action(action: ProfilePreviewAction) {
    if (action === "book") onBook();
    else setPreview(action);
  }
  const descriptions = {
    message:
      "Messaging requires backend integration. No message has been sent from this preview.",
    directions: fullProfile
      ? "Union Square, SF · 0.3 mi, as shown in the supplied design. Live route guidance is not connected."
      : `Sample distance: ${truck.distance} mi. Live coordinates and directions are not available.`,
    offer:
      "20% off all orders before 2PM, as shown in the design. This sample offer cannot be redeemed in the preview.",
    book: "",
  };
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
      <article className="profile-card" aria-label={`${truck.name} sample profile`}>
        {fullProfile ? (
          <ProfileSummary
            onPreview={action}
            onReviews={() => {
              setTab("reviews");
              document.getElementById("profile-tab-reviews")?.focus();
            }}
          />
        ) : (
          <header className="profile-summary">
            <TruckImage
              src={truck.suggestedImage ?? truck.image}
              name={truck.name}
              className="size-[84px] rounded-full border-2 border-[#FF5733]"
            />
            <h1 className="mt-6 text-xl font-bold focus:outline-none" tabIndex={-1}>
              {truck.name}
            </h1>
            <p className="mt-2 text-sm text-[#B8C1D1]">{truck.cuisine}</p>
            <p className="mt-3 flex items-center gap-3 text-sm text-[#B8C1D1]">
              <MapPin size={18} />
              {truck.distance} mi <Star size={18} className="text-[#FFB547]" />
              {truck.rating ?? truck.stars}
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button
                className="profile-pill profile-follow"
                aria-pressed={following}
                onClick={() => setFollowing((value) => !value)}
              >
                {following ? "Following" : "Follow"}
              </Button>
              <Button className="profile-pill" onClick={() => action("message")}>
                Message
              </Button>
              <Button className="profile-pill" onClick={onBook}>
                Book
              </Button>
              <Button className="profile-pill" onClick={() => action("directions")}>
                Directions
              </Button>
            </div>
            <p className="sr-only" role="status">
              {following
                ? `Following ${truck.name} in this preview.`
                : "Not following."}
            </p>
          </header>
        )}
        {fullProfile ? (
          <ProfileTabs active={tab} onChange={setTab} onImage={setImage} />
        ) : (
          <div className="m-6">
            <EmptyState
              title="More profile details are not supplied"
              description="The design includes a complete Taco Paradise profile. You can follow, save, or preview a booking for this sample truck."
            />
          </div>
        )}
        <div className="mx-6 mt-6">
          <Button aria-pressed={saved} onClick={onSave}>
            <Heart size={18} className={saved ? "fill-[#FF5733] text-[#FF5733]" : ""} />
            {saved ? "Saved truck" : "Save truck"}
          </Button>
        </div>
        <p className="profile-sample-note">
          Static profile preview · Sample menu, activity, availability, and offers.
        </p>
      </article>
      <Modal
        isOpen={preview !== null}
        onClose={() => setPreview(null)}
        titleId={titleId}
      >
        <div className="p-6 pt-12">
          <h2 id={titleId} className="text-xl font-semibold">
            {preview === "message"
              ? "Message"
              : preview === "offer"
                ? "Offer"
                : "Location"}{" "}
            preview
          </h2>
          <p className="mt-3 text-sm leading-6 text-[#B8C1D1]">
            {preview && descriptions[preview]}
          </p>
        </div>
      </Modal>
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
