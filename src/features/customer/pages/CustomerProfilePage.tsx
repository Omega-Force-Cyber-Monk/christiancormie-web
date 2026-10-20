import { ArrowLeft } from "lucide-react";
import { useState } from "react";
import { Link, useParams, useSearchParams } from "react-router";

import { Modal } from "@/components/overlays/Modal/Modal";
import { EmptyState } from "@/components/states/EmptyState";
import { ROUTES } from "@/constants/routes";
import { TruckImage } from "@/features/customer/components/discover/DiscoverTruckCard";
import {
  ProfileSummary,
  type ProfilePreviewAction,
} from "@/features/customer/components/profile/ProfileSummary";
import {
  ProfileTabs,
  type ProfileTab,
} from "@/features/customer/components/profile/ProfileTabs";
import { sampleTruckProfile as profile } from "@/features/customer/data/profile.data";
import { sampleMemberProfile } from "@/features/customer/data/member-profile.data";
import CustomerMemberProfilePage from "@/features/customer/pages/CustomerMemberProfilePage";
import "@/features/customer/components/profile/profile.css";

const actionPreviews = {
  message: {
    title: "Message preview",
    description:
      "Messaging is unavailable in this static preview. No message has been sent. Conversations require backend integration.",
  },
  book: {
    title: "Booking preview",
    description:
      "Booking is unavailable in this static preview. No reservation or payment has been made. Availability and booking details require backend integration.",
  },
  directions: {
    title: "Location preview",
    description:
      "Union Square, SF · 0.3 mi in the supplied design. This is a sample location. Live coordinates and route guidance are not connected.",
  },
  offer: {
    title: "Sample offer",
    description:
      "20% off all orders before 2PM, as shown in the supplied design. This preview does not redeem discounts or confirm real offer availability.",
  },
};

function TruckProfilePage() {
  const { id } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const requestedTab = searchParams.get("tab");
  const activeTab: ProfileTab =
    requestedTab === "menu" || requestedTab === "gallery" ? requestedTab : "reviews";
  const [preview, setPreview] = useState<ProfilePreviewAction | null>(null);
  const [image, setImage] = useState<{ src: string; name: string } | null>(null);
  const details = preview ? actionPreviews[preview] : null;

  function changeTab(tab: ProfileTab) {
    setSearchParams(
      (current) => {
        const next = new URLSearchParams(current);
        next.set("tab", tab);
        return next;
      },
      { replace: true, preventScrollReset: true },
    );
  }

  if (id !== profile.id) {
    return (
      <div className="customer-profile-page max-w-[824px]">
        <h1 className="mb-4 text-xl font-semibold">Profile unavailable</h1>
        <EmptyState
          title="No sample profile for this truck"
          description="The supplied design includes the Taco Paradise profile only."
        />
        <Link
          className="mt-4 inline-flex min-h-11 items-center gap-2 text-[#B8C1D1] underline focus-visible:outline"
          to={ROUTES.CUSTOMER_DISCOVER}
        >
          <ArrowLeft aria-hidden="true" size={20} />
          Back to Discover
        </Link>
      </div>
    );
  }

  return (
    <div className="customer-profile-page">
      <Link
        className="profile-back inline-flex min-h-10 items-center gap-4 rounded-md px-2.5 text-sm text-[#B8C1D1] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#2ED3D1]"
        to={ROUTES.CUSTOMER_DISCOVER}
      >
        <ArrowLeft aria-hidden="true" className="text-[#FAFAFA]" size={20} />
        Back
      </Link>
      <article
        aria-label="Taco Paradise sample profile"
        className="profile-card"
        key={id}
      >
        <ProfileSummary
          onPreview={setPreview}
          onReviews={() => {
            changeTab("reviews");
            document.getElementById("profile-tab-reviews")?.focus();
          }}
        />
        <ProfileTabs active={activeTab} onChange={changeTab} onImage={setImage} />
        <p className="profile-sample-note">
          Static profile preview · Sample menu, activity, availability, and offers.
        </p>
      </article>
      <Modal
        descriptionId="profile-preview-description"
        isOpen={preview !== null}
        onClose={() => setPreview(null)}
        titleId="profile-preview-title"
      >
        {details && (
          <div className="p-6 pt-12">
            <h2 className="text-xl font-semibold" id="profile-preview-title">
              {details.title}
            </h2>
            <p
              className="mt-3 text-sm leading-6 text-[var(--text-muted)]"
              id="profile-preview-description"
            >
              {details.description}
            </p>
          </div>
        )}
      </Modal>
      <Modal
        isOpen={image !== null}
        onClose={() => setImage(null)}
        titleId="profile-image-title"
      >
        {image && (
          <div className="overflow-y-auto p-6 pt-12">
            <h2 className="mb-4 text-xl font-semibold" id="profile-image-title">
              {image.name}
            </h2>
            <TruckImage
              alt={image.name}
              className="max-h-[60dvh] w-full rounded-xl profile-expanded-image"
              name={image.name}
              src={image.src}
            />
          </div>
        )}
      </Modal>
    </div>
  );
}

export default function CustomerProfilePage() {
  const { id } = useParams();
  if (id === "me" || id === sampleMemberProfile.id)
    return <CustomerMemberProfilePage own={id === "me"} />;
  return <TruckProfilePage key={id} />;
}
