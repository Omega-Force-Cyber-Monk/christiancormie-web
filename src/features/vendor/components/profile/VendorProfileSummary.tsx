import { IdCard, Clock, DollarSign, MapPin, Pencil } from "lucide-react";
import { VendorProfilePhoto } from "@/features/vendor/components/profile/VendorProfilePhoto";
import {
  profileArtwork,
  profileGallery,
  type ProfilePhotoSource,
} from "@/features/vendor/data/profile.data";
import type { VendorProfileValues } from "@/features/vendor/schemas/profile.schema";
import {
  profileCapacitySummary,
  profileHoursSummary,
} from "@/features/vendor/utils/profileState";
export function VendorProfileSummary({
  values,
  photo,
  onEdit,
  compact = false,
}: {
  values: VendorProfileValues;
  photo: ProfilePhotoSource;
  onEdit: () => void;
  compact?: boolean;
}) {
  return (
    <section
      className={`vendor-profile-summary${compact ? " vendor-profile-summary--compact" : ""}`}
      aria-label="Sample Vendor profile"
    >
      <div className="vendor-profile-identity-top">
        <span className="vendor-profile-avatar">
          <VendorProfilePhoto source={photo} alt={`${values.name} food truck`} />
          <span aria-hidden="true" />
        </span>
        <button type="button" className="vendor-profile-small-primary" onClick={onEdit}>
          <Pencil size={13} /> Edit Profile
        </button>
      </div>
      <h1 className="flex items-center gap-2 text-xl font-bold">
        {values.name}
        <img
          src={profileArtwork.verified}
          className="size-5"
          alt="Sample verified badge"
        />
      </h1>
      <div className="vendor-profile-info">
        <div>
          <div className="mt-1 flex flex-wrap items-center gap-1 text-sm text-[#B8C1D1]">
            <span>{values.motto}</span>
            <span className="vendor-profile-credit-badge">
              <DollarSign size={13} /> Credit Accepted
            </span>
          </div>
          <p>
            <MapPin size={19} />
            {values.location}
          </p>
          <p>
            <Clock size={19} />
            {profileHoursSummary(values.hours)}
          </p>
          <p>
            <IdCard size={19} />
            {profileCapacitySummary(values.capacity)}
          </p>
        </div>
        <span className="vendor-profile-promo">
          <img src={profileArtwork.tag} alt="" />
          20% off all orders before 2PM
        </span>
      </div>
      <dl className="vendor-profile-stats">
        {[
          ["Posts", profileGallery.length],
          ["Followers", "1,240"],
          ["Rating", "4.9 \u2605"],
          ["Rank", "#12"],
        ].map(([label, value]) => (
          <div key={String(label)}>
            <dt>{label}</dt>
            <dd>{value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
