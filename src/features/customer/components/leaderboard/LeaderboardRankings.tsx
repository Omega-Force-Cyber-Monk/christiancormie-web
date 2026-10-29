import { Star } from "lucide-react";
import { Link } from "react-router";
import trophy from "@/features/customer/assets/leaderboard/1-trophy.svg";
import type { RankingRow } from "@/features/leaderboards/utils/rankingAdapters";
import { memberProfilePath } from "@/features/social/utils/profileIdentity";
import { ROUTES } from "@/constants/routes";
import { remoteMedia } from "@/utils/files/remoteMedia";
export function LeaderboardRankings({
  entries,
  label,
}: {
  entries: RankingRow[];
  label: string;
}) {
  return (
    <ol aria-label={`${label} rankings`} className="leaderboard-rankings">
      {entries.map((entry) => (
        <li
          key={entry.id}
          value={entry.rank ?? undefined}
          className={`leaderboard-row leaderboard-row--${entry.rank !== null && entry.rank <= 3 ? entry.rank : "standard"}`}
        >
          <span className="leaderboard-rank">
            <span className="sr-only">Rank </span>
            {entry.rank ?? "Unavailable"}
          </span>
          {remoteMedia(entry.image) ? (
            <img
              className="leaderboard-avatar"
              src={remoteMedia(entry.image)}
              alt=""
              width={64}
              height={64}
            />
          ) : (
            <span
              className="leaderboard-truck-placeholder"
              aria-label="Image unavailable"
            />
          )}
          <div className="min-w-0 flex-1">
            <h2 className="text-lg leading-7 font-semibold break-words">
              {entry.kind === "member" ? (
                <Link to={memberProfilePath(entry.id)}>{entry.name}</Link>
              ) : entry.slug ? (
                <Link
                  to={ROUTES.CUSTOMER_PROFILE.replace(
                    ":id",
                    encodeURIComponent(entry.slug),
                  )}
                >
                  {entry.name}
                </Link>
              ) : (
                entry.name
              )}
            </h2>
            {entry.kind === "truck" && (
              <p className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs leading-[18px] text-[#B8C1D1]">
                <Star size={12} fill="#FFB74D" stroke="#FFB74D" aria-hidden="true" />
                Rating {entry.rating ?? "Unavailable"}
              </p>
            )}
            <p
              className={`leaderboard-stat ${entry.kind === "member" ? "mt-2" : "mt-1.5"}`}
            >
              {entry.metric}
            </p>
            {entry.kind === "truck" && (
              <p className="text-xs text-[#B8C1D1]">
                Score {entry.score ?? "Unavailable"} · Previous rank{" "}
                {entry.previousRank ?? "Unavailable"} · Stored rank{" "}
                {entry.originalRank ?? "Unavailable"}
              </p>
            )}
          </div>
          {entry.rank !== null && entry.rank <= 3 && (
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
