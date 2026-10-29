import { CalendarDays, Medal, Star, Trophy } from "lucide-react";
import { useSearchParams } from "react-router";
import {
  adjacentLeaderboardTab,
  parseVendorLeaderboardTab,
  vendorLeaderboardTabQuery,
  vendorLeaderboardTabs,
} from "@/features/vendor/data/leaderboard.data";
import { useRankings } from "@/features/leaderboards/utils/useRankings";
import { ErrorState } from "@/components/states/ErrorState";
import { EmptyState } from "@/components/states/EmptyState";
import { Button } from "@/components/ui/Button";
import { remoteMedia } from "@/utils/files/remoteMedia";
import "@/features/vendor/components/leaderboard/leaderboard.css";
const tabIcons = {
  "top-rated": Star,
  "most-booked": CalendarDays,
  "most-points": Medal,
};
export default function VendorLeaderboardPage() {
  const [params, setParams] = useSearchParams();
  const tab = parseVendorLeaderboardTab(params.get("tab"));
  const rawOffset = Number(params.get("offset") ?? 0);
  const offset = Number.isSafeInteger(rawOffset) && rawOffset >= 0 ? rawOffset : 0;
  const rankings = useRankings(tab, offset);
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
          const select = (value: typeof tab) => {
            const next = vendorLeaderboardTabQuery(params, value);
            next.delete("offset");
            void setParams(next);
          };
          return (
            <button
              key={id}
              type="button"
              role="tab"
              id={`leaderboard-tab-${id}`}
              aria-controls={`leaderboard-panel-${id}`}
              aria-selected={tab === id}
              tabIndex={tab === id ? 0 : -1}
              onClick={() => select(id)}
              onKeyDown={(event) => {
                const next = adjacentLeaderboardTab(id, event.key);
                if (!next) return;
                event.preventDefault();
                select(next);
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
        {rankings.query.isLoading ||
        (rankings.query.isFetching && !rankings.query.currentData) ? (
          <p role="status">Loading rankings…</p>
        ) : rankings.query.isError ? (
          <ErrorState onRetry={() => void rankings.query.refetch()} />
        ) : rankings.rows.length ? (
          <ol
            aria-label={
              tab === "most-points" ? "Member points rankings" : "Truck rankings"
            }
            className="space-y-3"
          >
            {rankings.rows.map((entry) => (
              <li
                key={entry.id}
                value={entry.rank ?? undefined}
                className={`vendor-ranking vendor-ranking--${entry.rank ?? "unavailable"}`}
              >
                <span className="vendor-ranking-number">
                  <span className="sr-only">Rank </span>
                  {entry.rank ?? "Unavailable"}
                </span>
                {remoteMedia(entry.image) ? (
                  <img
                    className="vendor-ranking-portrait"
                    src={remoteMedia(entry.image)}
                    alt=""
                    width={64}
                    height={64}
                  />
                ) : (
                  <span
                    className="vendor-ranking-placeholder"
                    aria-label="Image unavailable"
                  />
                )}
                <div className="min-w-0 flex-1">
                  <h2 className="text-base leading-7 font-semibold sm:text-lg">
                    {entry.name}
                  </h2>
                  {entry.kind === "truck" && (
                    <p className="mt-0.5 text-xs text-[#B8C1D1]">
                      Rating {entry.rating ?? "Unavailable"} · Score{" "}
                      {entry.score ?? "Unavailable"}
                    </p>
                  )}
                  <p className="vendor-ranking-metric">{entry.metric}</p>
                  {entry.kind === "truck" && (
                    <p className="text-xs text-[#B8C1D1]">
                      Previous rank {entry.previousRank ?? "Unavailable"} · Stored rank{" "}
                      {entry.originalRank ?? "Unavailable"}
                    </p>
                  )}
                </div>
                {entry.rank !== null && entry.rank <= 3 && (
                  <Trophy
                    size={20}
                    className="vendor-ranking-trophy"
                    fill="currentColor"
                    aria-label={["Gold", "Silver", "Bronze"][entry.rank - 1]}
                  />
                )}
              </li>
            ))}
          </ol>
        ) : (
          <EmptyState title="No leaderboard records" />
        )}
        <div className="mt-4 flex gap-3">
          <Button
            disabled={offset === 0 || rankings.query.isFetching}
            onClick={() =>
              setParams((current) => {
                const next = new URLSearchParams(current);
                next.set("offset", String(Math.max(0, offset - 20)));
                return next;
              })
            }
          >
            Previous rankings
          </Button>
          <Button
            disabled={
              rankings.next === null ||
              rankings.query.isFetching ||
              rankings.query.isError
            }
            onClick={() => {
              if (rankings.next !== null)
                setParams((current) => {
                  const next = new URLSearchParams(current);
                  next.set("offset", String(rankings.next));
                  return next;
                });
            }}
          >
            Next rankings
          </Button>
        </div>
      </div>
      <p className="mt-3 text-xs text-[#B8C1D1]">
        Rankings are not guaranteed to update in real time.{" "}
        {rankings.calculatedAt
          ? `Calculated ${rankings.calculatedAt}`
          : "Calculation time unavailable"}
      </p>
    </section>
  );
}
