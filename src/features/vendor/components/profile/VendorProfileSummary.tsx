import { IdCard, Clock, MapPin, Pencil } from "lucide-react";
import { VendorProfilePhoto } from "./VendorProfilePhoto";
import {
  profileArtwork,
  type ProfilePhotoSource,
} from "@/features/vendor/data/profile.data";
import type { TruckProfileForm } from "@/features/vendor/schemas/truckSettings.schema";
export type VendorProfileMeta = {
  capacity: number | null;
  followers: number | null;
  rating: string | number | null;
  verified: boolean;
};
export function VendorProfileSummary({
  values,
  photo,
  onEdit,
  compact = false,
  meta,
}: {
  values: TruckProfileForm;
  photo?: ProfilePhotoSource;
  onEdit: () => void;
  compact?: boolean;
  meta: VendorProfileMeta;
}) {
  return (
    <section
      className={`vendor-profile-summary${compact ? " vendor-profile-summary--compact" : ""}`}
      aria-label="Vendor profile"
    >
      <div className="vendor-profile-identity-top">
        <span className="vendor-profile-avatar">
          <VendorProfilePhoto source={photo} alt={`${values.name} food truck`} />
        </span>
        <button type="button" className="vendor-profile-small-primary" onClick={onEdit}>
          <Pencil size={13} /> Edit Profile
        </button>
      </div>
      <h1 className="flex items-center gap-2 text-xl font-bold">
        {values.name}
        {meta.verified && (
          <img src={profileArtwork.verified} className="size-5" alt="Verified vendor" />
        )}
      </h1>
      <div className="vendor-profile-info">
        <div>
          <div className="mt-1 flex flex-wrap items-center gap-1 text-sm text-[#B8C1D1]">
            <span>{values.motto || "Description unavailable"}</span>
          </div>
          <p>
            <MapPin size={19} />
            {values.location || "Location unavailable"}
          </p>
          <p>
            <Clock size={19} />
            {values.hours.some((h) => h.enabled)
              ? values.hours
                  .filter((h) => h.enabled)
                  .map((h) => `${h.day} ${h.opens}–${h.closes}`)
                  .join("; ")
              : "No open hours provided"}
          </p>
          <p>
            <IdCard size={19} />
            {meta.capacity == null
              ? "Capacity unavailable"
              : `${meta.capacity} maximum guests`}
          </p>
        </div>
      </div>
      <dl className="vendor-profile-stats">
        {[
          ["Posts", "N/A"],
          ["Followers", meta.followers ?? "N/A"],
          ["Rating", meta.rating ?? "N/A"],
          ["Rank", "N/A"],
        ].map(([label, value]) => (
          <div key={label}>
            <dt>{label}</dt>
            <dd>{value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
