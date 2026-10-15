import { Heart, Navigation, Star } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/Button";
import featuredBadge from "@/features/customer/assets/discover/discover-featured-badge.svg";
import offerTag from "@/features/customer/assets/discover/discover-offer-tag.svg";
import type { DiscoverTruck } from "@/features/customer/data/discover.data";

export function TruckImage({
  alt,
  src,
  name,
  className = "",
}: {
  alt?: string;
  src: string;
  name: string;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);
  return failed ? (
    <div
      className={`grid place-items-center bg-[var(--surface-muted)] text-center text-xs text-[var(--text-muted)] ${className}`}
    >
      Image unavailable
    </div>
  ) : (
    <img
      alt={alt ?? `${name} food truck`}
      className={`object-cover ${className}`}
      onError={() => setFailed(true)}
      src={src}
    />
  );
}

export function FeaturedBadge() {
  return (
    <img
      alt="Featured"
      className="inline-block size-[18px] shrink-0 align-middle"
      src={featuredBadge}
    />
  );
}

export function TruckDistance({ distance }: { distance: number }) {
  return (
    <span className="inline-flex items-center gap-1 whitespace-nowrap">
      <Navigation aria-hidden="true" size={14} />
      {distance.toFixed(1)} mi
    </span>
  );
}

type DiscoverTruckCardProps = {
  truck: DiscoverTruck;
  suggested?: boolean;
  saved: boolean;
  onSave: (truck: DiscoverTruck) => void;
  onView: (truck: DiscoverTruck) => void;
};

export function DiscoverTruckCard({
  truck,
  suggested = false,
  saved,
  onSave,
  onView,
}: DiscoverTruckCardProps) {
  if (suggested) {
    return (
      <article className="discover-suggestion">
        <div className="relative shrink-0">
          <TruckImage
            className="h-[69px] w-[77px] rounded-xl"
            name={truck.name}
            src={truck.suggestedImage ?? truck.image}
          />
          {truck.offer && (
            <img
              alt="Offer available in design preview"
              className="absolute -top-3 -right-2 size-[30px]"
              src={offerTag}
            />
          )}
          <span
            aria-label={
              truck.online ? "Sample status: online" : "Sample status: offline"
            }
            className={`absolute -right-0.5 -bottom-0.5 size-3 rounded-full border border-white ${truck.online ? "bg-[#2ED3D1]" : "bg-[#5A6475]"}`}
          />
        </div>
        <div className="min-w-0 flex-1 self-center">
          <h3 className="flex items-center gap-1 text-lg leading-6 font-semibold">
            <span className="truncate">{truck.name}</span>
            {truck.featured && <FeaturedBadge />}
          </h3>
          <p className="mt-0.5 text-sm leading-5 text-[var(--text-muted)]">
            {truck.cuisine}
          </p>
          <div className="flex flex-wrap items-center gap-2 text-sm leading-5">
            <span className="inline-flex items-center gap-1">
              <Star
                aria-hidden="true"
                className="fill-[#FFB547] text-[#FFB547]"
                size={16}
              />
              <span className="sr-only">Rating </span>
              {truck.rating}
            </span>
            <span className="text-[var(--text-muted)]">
              <TruckDistance distance={truck.distance} />
            </span>
          </div>
        </div>
        <Button
          aria-label={`View profile of ${truck.name} (preview)`}
          className="discover-action shrink-0 self-end"
          onClick={() => onView(truck)}
          variant="primary"
        >
          View Profile
        </Button>
      </article>
    );
  }

  return (
    <article className="w-[180px] shrink-0 snap-start rounded-xl bg-[var(--surface)]">
      <div className="relative">
        <TruckImage
          className="h-[107px] w-full rounded-t-xl"
          name={truck.name}
          src={truck.image}
        />
        {truck.offer && (
          <img
            alt="Offer available in design preview"
            className="absolute -top-2 left-4 size-[30px]"
            src={offerTag}
          />
        )}
        <button
          aria-label={`${saved ? "Unsave" : "Save"} ${truck.name}`}
          aria-pressed={saved}
          className="absolute top-1 right-1 grid size-9 place-items-center rounded-full text-white drop-shadow-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
          onClick={() => onSave(truck)}
          type="button"
        >
          <Heart
            aria-hidden="true"
            className={saved ? "fill-[#FF5733]" : "fill-[#D9D9D9]/80"}
            size={24}
          />
        </button>
      </div>
      <div className="p-2.5">
        <h3
          className={`flex items-center gap-1 text-base leading-6 ${["taco-paradise", "sushi-haven", "curry-house"].includes(truck.id) ? "font-bold" : "font-normal"}`}
        >
          <span className="truncate">{truck.name}</span>
          {truck.featured && <FeaturedBadge />}
        </h3>
        <div className="mt-0.5 flex items-center gap-3 text-xs leading-[18px] text-[var(--text-muted)]">
          <span>{truck.cuisine}</span>
          <TruckDistance distance={truck.distance} />
        </div>
        <div
          aria-label={`${truck.stars} out of 5 stars`}
          className="mt-2 flex gap-2"
          role="img"
        >
          {Array.from({ length: 5 }, (_, index) => (
            <Star
              aria-hidden="true"
              className={
                index < truck.stars
                  ? "fill-[#FF5733] text-[#FF5733]"
                  : "fill-[#5A6475] text-[#5A6475]"
              }
              key={index}
              size={20}
              strokeWidth={0}
            />
          ))}
        </div>
        <Button
          aria-label={`View ${truck.name} (preview)`}
          className="discover-action mt-2 w-full"
          onClick={() => onView(truck)}
          variant="primary"
        >
          View
        </Button>
      </div>
    </article>
  );
}
