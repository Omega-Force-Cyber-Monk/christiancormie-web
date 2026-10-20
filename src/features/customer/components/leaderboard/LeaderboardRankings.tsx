import { MapPin, Star } from "lucide-react";
import trophy from "@/features/customer/assets/leaderboard/1-trophy.svg";
import type { LeaderboardEntry } from "@/features/customer/data/leaderboard.data";

const numberFormat = new Intl.NumberFormat("en-US");

export function LeaderboardRankings({
  entries,
  label,
}: {
  entries: (LeaderboardEntry & { rank: number })[];
  label: string;
}) {
  return (
    <ol aria-label={`${label} sample rankings`} className="leaderboard-rankings">
      {entries.map((entry) => (
        <li
          key={entry.id}
          value={entry.rank}
          className={`leaderboard-row leaderboard-row--${entry.rank <= 3 ? entry.rank : "standard"}`}
        >
          <span className="leaderboard-rank">
            <span className="sr-only">Rank </span>
            {entry.rank}
          </span>
          {entry.kind === "member" ? (
            <img
              className="leaderboard-avatar"
              src={entry.avatar}
              alt=""
              width={64}
              height={64}
            />
          ) : (
            <span className="leaderboard-truck-placeholder" aria-hidden="true" />
          )}
          <div className="min-w-0 flex-1">
            <h2 className="text-lg leading-7 font-semibold break-words">
              {entry.name}
              {entry.kind === "member" && (entry.rank === 2 || entry.rank === 3) && (
                <span
                  className="leaderboard-trophy leaderboard-trophy--inline"
                  aria-hidden="true"
                  style={{ maskImage: `url(${trophy})` }}
                />
              )}
            </h2>
            {entry.kind === "truck" && (
              <p className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs leading-[18px] text-[#B8C1D1]">
                <span className="inline-flex items-center gap-1">
                  <Star size={12} fill="#FFB74D" stroke="#FFB74D" aria-hidden="true" />
                  <span className="sr-only">Rating </span>
                  {entry.rating.toFixed(1)}
                </span>
                <span className="inline-flex items-center gap-1">
                  <MapPin size={12} aria-hidden="true" />
                  {entry.distanceMiles.toFixed(1)} mi
                </span>
              </p>
            )}
            <p
              className={`leaderboard-stat ${entry.kind === "member" ? "mt-2" : "mt-1.5"}`}
            >
              {entry.kind === "truck"
                ? `${numberFormat.format(entry.reviews)} reviews`
                : `${numberFormat.format(entry.points)} Points`}
            </p>
          </div>
          {(entry.rank === 1 || (entry.kind === "truck" && entry.rank <= 3)) && (
            <span
              className="leaderboard-trophy"
              aria-hidden="true"
              style={{ maskImage: `url(${trophy})` }}
            />
          )}
        </li>
      ))}
    </ol>
  );
}
