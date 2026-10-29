import { Clock, MapPin, Navigation, RectangleEllipsis, Star } from "lucide-react";
import { Button } from "@/components/ui/Button";
import verifiedBadge from "@/features/customer/assets/profile/profile-verified-badge.svg";
import { TruckImage } from "@/features/customer/components/discover/DiscoverTruckCard";
import { TruckSocialActions } from "@/features/customer/components/discover/TruckSocialActions";
import { StartConversationButton } from "@/features/messaging/components/StartConversationButton";
import type { TruckProfileDto } from "@/features/customer/types/discovery.types";
import { safeImage } from "@/features/customer/utils/discoveryAdapters";
export type ProfilePreviewAction = "message" | "book" | "directions" | "offer";
export function ProfileSummary({
  profile,
  onPreview,
  onReviews,
}: {
  profile: TruckProfileDto;
  onPreview: (action: ProfilePreviewAction) => void;
  onReviews: () => void;
}) {
  return (
    <header className="profile-summary">
      <div className="flex flex-wrap items-center gap-x-8 gap-y-5">
        <TruckImage
          className="profile-avatar size-[84px] rounded-full border-2 border-[#FF5733]"
          name={profile.name}
          src={safeImage(profile.profileImageUrl ?? profile.coverImageUrl)}
        />
        <dl className="flex gap-6 text-center">
          {[
            { value: profile.followerCount, label: "followers" },
            { value: profile.totalCheckIns, label: "Check In" },
            { value: profile.totalReviews, label: "Reviews" },
          ].map(({ value, label }) => (
            <div className="flex flex-col-reverse gap-1" key={label}>
              <dt className="text-sm leading-5 text-[#B8C1D1]">{label}</dt>
              <dd className="text-xl leading-7 font-bold">{value ?? "Unavailable"}</dd>
            </div>
          ))}
        </dl>
      </div>
      <h1
        className="mt-6 flex items-center gap-2 text-xl leading-7 font-bold focus:outline-none"
        tabIndex={-1}
      >
        {profile.name}
        {profile.vendor.isVerified && (
          <img alt="Verified vendor" className="size-5" src={verifiedBadge} />
        )}
      </h1>
      <p className="mt-1 text-sm leading-5 text-[#B8C1D1]">
        {profile.cuisines.map((c) => c.cuisine.name).join(", ") ||
          "Cuisine unavailable"}
      </p>
      {profile.description && (
        <p className="mt-3 text-sm leading-6">{profile.description}</p>
      )}
      <ul className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2 text-sm leading-5 text-[#B8C1D1]">
        <li className="inline-flex items-center gap-1">
          <MapPin size={20} />
          {profile.currentAddress ?? "Location unavailable"}
        </li>
        <li className="inline-flex items-center gap-1">
          <Clock size={20} />
          {profile.operatingStatus}
        </li>
        <li className="inline-flex items-center gap-1">
          <RectangleEllipsis size={18} />
          {profile.maximumGuestCapacity == null
            ? "Capacity unavailable"
            : `Up to ${profile.maximumGuestCapacity} guests`}
        </li>
      </ul>
      <div className="mt-6 flex flex-wrap gap-3 sm:gap-6">
        <TruckSocialActions foodTruckId={profile.id} kind="follow" />
        <StartConversationButton
          className="profile-pill"
          target={{ foodTruckId: profile.id }}
        />
        <Button className="profile-pill" onClick={() => onPreview("book")}>
          Book
        </Button>
        <Button className="profile-pill" onClick={() => onPreview("directions")}>
          <MapPin className="text-[#FF5733]" size={16} />
          Location
        </Button>
        <Button className="profile-pill" onClick={onReviews}>
          <Star className="text-[#FFB547]" size={16} />
          {profile.averageRating ?? "Rating unavailable"}
        </Button>
      </div>
      <Button
        aria-label="Directions"
        className="profile-pill mt-6"
        onClick={() => onPreview("directions")}
      >
        <Navigation className="text-[#FF5733]" size={18} />
      </Button>
      <div className="mt-4">
        <TruckSocialActions foodTruckId={profile.id} kind="favorite" />
      </div>
    </header>
  );
}
