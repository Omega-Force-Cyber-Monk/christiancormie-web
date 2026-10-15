import {
  Clock,
  DollarSign,
  MapPin,
  Navigation,
  RectangleEllipsis,
  Star,
} from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/Button";
import verifiedBadge from "@/features/customer/assets/profile/profile-verified-badge.svg";
import { TruckImage } from "@/features/customer/components/discover/DiscoverTruckCard";
import { sampleTruckProfile as profile } from "@/features/customer/data/profile.data";

export type ProfilePreviewAction = "message" | "book" | "directions" | "offer";

type ProfileSummaryProps = {
  onPreview: (action: ProfilePreviewAction) => void;
  onReviews: () => void;
};

export function ProfileSummary({ onPreview, onReviews }: ProfileSummaryProps) {
  const [following, setFollowing] = useState(false);
  return (
    <header className="profile-summary">
      <div className="flex flex-wrap items-center gap-x-8 gap-y-5">
        <div className="relative shrink-0">
          <TruckImage
            className="profile-avatar size-[84px] rounded-full border-2 border-[#FF5733]"
            name={profile.name}
            src={profile.avatar}
          />
          <span
            aria-label="Sample online status"
            className="absolute right-3 bottom-1 size-3.5 rounded-full border border-white bg-[#2ED3D1]"
          />
        </div>
        <dl className="flex gap-6 text-center">
          {[
            { value: profile.followers, label: "followers" },
            { value: profile.checkIns, label: "Check In" },
            { value: profile.reviewCount, label: "Reviews" },
          ].map(({ value, label }) => (
            <div className="flex flex-col-reverse gap-1" key={label}>
              <dt className="text-sm leading-5 text-[#B8C1D1]">{label}</dt>
              <dd className="text-xl leading-7 font-bold">{value}</dd>
            </div>
          ))}
        </dl>
      </div>
      <h1 className="mt-6 flex items-center gap-2 text-xl leading-7 font-bold">
        {profile.name}
        <img
          alt="Verified badge in design sample"
          className="size-5"
          src={verifiedBadge}
        />
      </h1>
      <div className="mt-1 flex flex-wrap items-center gap-2 text-sm leading-5 text-[#B8C1D1]">
        <p>{profile.cuisine}</p>
        <span className="profile-credit">
          <DollarSign aria-hidden="true" size={13} />
          Credit Accepted
        </span>
      </div>
      <ul className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2 text-sm leading-5 text-[#B8C1D1]">
        <li className="inline-flex items-center gap-1">
          <MapPin aria-hidden="true" size={20} />
          {profile.location}
        </li>
        <li className="inline-flex items-center gap-1">
          <Clock aria-hidden="true" size={20} />
          {profile.hours}
        </li>
        <li className="inline-flex items-center gap-1">
          <RectangleEllipsis aria-hidden="true" size={18} />
          {profile.capacity}
        </li>
      </ul>
      <button
        aria-label="View sample offer details"
        className="profile-offer mt-7 inline-flex min-h-[50px] items-center gap-2.5 rounded-xl px-2.5 text-xs leading-[18px] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2ED3D1]"
        onClick={() => onPreview("offer")}
        type="button"
      >
        <span aria-hidden="true" className="size-5 bg-[#0A0A0A]" />
        {profile.offer}
      </button>
      <div className="mt-6 flex flex-wrap gap-3 sm:gap-6">
        <Button
          aria-label={
            following ? "Unfollow in local preview" : "Follow in local preview"
          }
          aria-pressed={following}
          className="profile-pill profile-follow"
          onClick={() => setFollowing((current) => !current)}
          variant="primary"
        >
          {following ? "Following" : "Follow"}
        </Button>
        <Button
          aria-label="Message preview"
          className="profile-pill"
          onClick={() => onPreview("message")}
        >
          Message
        </Button>
        <Button
          aria-label="Booking preview"
          className="profile-pill"
          onClick={() => onPreview("book")}
        >
          Book
        </Button>
        <Button
          aria-label="Preview location, 0.3 miles away"
          className="profile-pill"
          onClick={() => onPreview("directions")}
        >
          <MapPin aria-hidden="true" className="text-[#FF5733]" size={16} />
          {profile.distance}
        </Button>
        <Button
          aria-label="View sample review summary, rating 4.8"
          className="profile-pill"
          onClick={onReviews}
        >
          <Star aria-hidden="true" className="text-[#FFB547]" size={16} />
          {profile.rating}
        </Button>
      </div>
      <Button
        aria-label="Directions preview"
        className="profile-pill mt-6"
        onClick={() => onPreview("directions")}
      >
        <Navigation aria-hidden="true" className="text-[#FF5733]" size={18} />
      </Button>
      <p aria-live="polite" className="sr-only" role="status">
        {following
          ? "Following Taco Paradise in this local preview. No account was updated."
          : "Not following Taco Paradise in this local preview."}
      </p>
    </header>
  );
}
