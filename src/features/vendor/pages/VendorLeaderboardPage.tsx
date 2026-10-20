import { CalendarDays, MapPin, Medal, Star, Trophy } from "lucide-react";
import { useSearchParams } from "react-router";
import {
  adjacentLeaderboardTab,
  parseVendorLeaderboardTab,
  vendorLeaderboardTabQuery,
  vendorLeaderboardTabs,
  vendorRankedMembers,
  vendorRankedTrucks,
} from "@/features/vendor/data/leaderboard.data";
import "@/features/vendor/components/leaderboard/leaderboard.css";

const tabIcons = {
  "top-rated": Star,
  "most-booked": CalendarDays,
  "most-points": Medal,
};
const number = new Intl.NumberFormat("en-US");
export default function VendorLeaderboardPage() {
  const [params, setParams] = useSearchParams();
  const tab = parseVendorLeaderboardTab(params.get("tab"));
  const points = tab === "most-points";
  const entries = points ? vendorRankedMembers : vendorRankedTrucks;
  return (
    <section className="vendor-leaderboard" aria-label="Vendor leaderboard">
      <h1 className="sr-only">Leaderboard</h1>
      <div
        className="vendor-leaderboard-tabs"
        role="tablist"
        aria-label="Leaderboard rankings"
      >
        {vendorLeaderboardTabs.map(({ id, label }) => {
          const Icon = tabIcons[id];
          return (
            <button
              key={id}
              type="button"
              role="tab"
              id={`leaderboard-tab-${id}`}
              aria-controls={`leaderboard-panel-${id}`}
              aria-selected={tab === id}
              tabIndex={tab === id ? 0 : -1}
              onClick={() => {
                void setParams(vendorLeaderboardTabQuery(params, id));
              }}
              onKeyDown={(event) => {
                const next = adjacentLeaderboardTab(id, event.key);
                if (!next) return;
                event.preventDefault();
                void setParams(vendorLeaderboardTabQuery(params, next));
                document.getElementById(`leaderboard-tab-${next}`)?.focus();
              }}
            >
              <Icon size={20} aria-hidden="true" />
              {label}
            </button>
          );
        })}
      </div>
      <div
        role="tabpanel"
        id={`leaderboard-panel-${tab}`}
        aria-labelledby={`leaderboard-tab-${tab}`}
        tabIndex={0}
        className="vendor-leaderboard-panel"
      >
        <ol
          aria-label={
            points
              ? "Member points rankings"
              : `${vendorLeaderboardTabs.find((item) => item.id === tab)?.label} truck rankings`
          }
          className="space-y-3"
        >
          {entries.map((entry, index) => (
            <li
              key={entry.id}
              className={`vendor-ranking vendor-ranking--${index + 1}`}
            >
              <span className="vendor-ranking-number">
                <span className="sr-only">Rank </span>
                {index + 1}
              </span>
              {"portrait" in entry ? (
                <img
                  className="vendor-ranking-portrait"
                  src={entry.portrait}
                  alt=""
                  width={64}
                  height={64}
                />
              ) : (
                <span className="vendor-ranking-placeholder" aria-hidden="true" />
              )}
              <div className="min-w-0 flex-1">
                <h2 className="text-base leading-7 font-semibold sm:text-lg">
                  {entry.name}
                </h2>
                {"rating" in entry && (
                  <p className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[#B8C1D1]">
                    <span className="inline-flex items-center gap-1">
                      <Star
                        size={12}
                        fill="#FFB547"
                        color="#FFB547"
                        aria-hidden="true"
                      />
                      <span className="sr-only">Rating </span>
                      {entry.rating.toFixed(1)}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <MapPin size={12} aria-hidden="true" />
                      {entry.distance.toFixed(1)} mi
                    </span>
                  </p>
                )}
                <p className="vendor-ranking-metric">
                  {"points" in entry
                    ? `${number.format(entry.points)} Points`
                    : `${number.format(entry.reviews)} reviews`}
                </p>
              </div>
              {index < 3 && (
                <Trophy
                  size={20}
                  className="vendor-ranking-trophy"
                  fill="currentColor"
                  aria-label={["Gold", "Silver", "Bronze"][index]}
                />
              )}
            </li>
          ))}
        </ol>
      </div>
      <p className="mt-3 text-xs text-[#B8C1D1]">Sample rankings · Local preview</p>
    </section>
  );
}
