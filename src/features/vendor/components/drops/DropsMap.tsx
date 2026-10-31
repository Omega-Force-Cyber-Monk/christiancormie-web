import { Navigation, Wifi } from "lucide-react";
import map from "@/features/vendor/assets/drops/Drops-map.webp";
import marker from "@/features/vendor/assets/drops/Drops-truck-marker.svg";
import { sampleDropLocation } from "@/features/vendor/data/drops.data";

type LiveMapProps = {
  live: {
    truckName: string;
    status: string;
    address?: string | null;
    latitude?: number;
    longitude?: number;
  };
};
export function DropsMap(
  props: LiveMapProps | { online: boolean; onAvailability: (online: boolean) => void },
) {
  if ("live" in props)
    return (
      <div
        data-live="true"
        className="vendor-drops-map grid place-items-center border border-[#343c4c] bg-[#121826] p-5 text-center"
      >
        <div>
          <h2 className="font-semibold">{props.live.truckName}</h2>
          <p>Operating status: {props.live.status}</p>
          <p>{props.live.address ?? "Address not reported"}</p>
          <p>
            {props.live.latitude === undefined
              ? "Coordinates not reported by the truck read."
              : `Last acknowledged coordinates: ${props.live.latitude}, ${props.live.longitude}`}
          </p>
          <p className="mt-2 text-xs text-[#B8C1D1]">
            Map rendering unavailable. No sample pin represents this truck.
          </p>
        </div>
      </div>
    );
  return <PreviewDropsMap {...props} />;
}
function PreviewDropsMap({
  online,
  onAvailability,
}: {
  online: boolean;
  onAvailability: (online: boolean) => void;
}) {
  return (
    <div className="vendor-drops-map">
      <img
        className="vendor-drops-map-image"
        src={map}
        alt="Sample map of San Francisco around Noe Valley and Mission Dolores Park"
      />
      <div
        className="drop-availability"
        role="group"
        aria-label="Local availability preview"
      >
        <button
          type="button"
          aria-pressed={online}
          className={online ? "text-[#00FF88]" : "text-[#B8C1D1]"}
          onClick={() => onAvailability(true)}
        >
          <Wifi size={12} aria-hidden="true" />
          Online
        </button>
        <button
          type="button"
          aria-pressed={!online}
          className={!online ? "text-[#FF5733]" : "text-[#B8C1D1]"}
          onClick={() => onAvailability(false)}
        >
          <Wifi size={12} aria-hidden="true" />
          Offline
        </button>
      </div>
      <img
        src={marker}
        className={`vendor-drops-marker ${online ? "" : "opacity-50 grayscale"}`}
        alt="Sample truck location"
      />
      <p className="vendor-drops-location">
        <Navigation size={12} aria-hidden="true" className="shrink-0 text-[#FF6B4A]" />
        {sampleDropLocation}
      </p>
    </div>
  );
}
