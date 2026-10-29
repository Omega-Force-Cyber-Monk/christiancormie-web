import { useRankings } from "@/features/leaderboards/utils/useRankings";
import { ErrorState } from "@/components/states/ErrorState";
import { EmptyState } from "@/components/states/EmptyState";
import { Button } from "@/components/ui/Button";
import { useId } from "react";
import { useSearchParams } from "react-router";
import { LeaderboardRankings } from "@/features/customer/components/leaderboard/LeaderboardRankings";
import {
  getLeaderboardKeyboardCategory,
  leaderboardCategories,
  parseLeaderboardCategory,
  type LeaderboardCategory,
} from "@/features/customer/data/leaderboard.data";
import "@/features/customer/components/leaderboard/leaderboard.css";

export default function CustomerLeaderboardPage() {
  const [params, setParams] = useSearchParams();
  const category = parseLeaderboardCategory(params.get("category"));
  const active =
    leaderboardCategories.find((item) => item.id === category) ??
    leaderboardCategories[0];
  const panelId = useId();
  const rawOffset = Number(params.get("offset") ?? 0);
  const offset = Number.isSafeInteger(rawOffset) && rawOffset >= 0 ? rawOffset : 0;
  const rankings = useRankings(category, offset);
  function selectCategory(next: LeaderboardCategory) {
    setParams(
      (current) => {
        const updated = new URLSearchParams(current);
        updated.set("category", next);
        updated.delete("offset");
        return updated;
      },
      { preventScrollReset: true },
    );
  }
  return (
    <div className="customer-leaderboard-page">
      <h1 className="sr-only">Leaderboard</h1>
      <div
        className="leaderboard-tabs"
        role="tablist"
        aria-label="Leaderboard category"
      >
        {leaderboardCategories.map((item) => (
          <button
            type="button"
            key={item.id}
            role="tab"
            id={`${panelId}-${item.id}`}
            aria-controls={panelId}
            aria-selected={category === item.id}
            tabIndex={category === item.id ? 0 : -1}
            className={`leaderboard-tab ${category === item.id ? "leaderboard-tab--active" : ""}`}
            onClick={() => selectCategory(item.id)}
            onKeyDown={(event) => {
              const next = getLeaderboardKeyboardCategory(item.id, event.key);
              if (!next) return;
              event.preventDefault();
              selectCategory(next);
              document.getElementById(`${panelId}-${next}`)?.focus();
            }}
          >
            <span
              className="leaderboard-tab-icon"
              aria-hidden="true"
              style={{ maskImage: `url(${item.icon})` }}
            />
            {item.label}
          </button>
        ))}
      </div>
      <section
        role="tabpanel"
        tabIndex={0}
        id={panelId}
        aria-labelledby={`${panelId}-${category}`}
        className="leaderboard-panel"
      >
        {rankings.query.isLoading ||
        (rankings.query.isFetching && !rankings.query.currentData) ? (
          <p role="status">Loading rankings…</p>
        ) : rankings.query.isError ? (
          <ErrorState onRetry={() => void rankings.query.refetch()} />
        ) : rankings.rows.length ? (
          <LeaderboardRankings entries={rankings.rows} label={active.label} />
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
      </section>
      <p className="mt-4 text-xs leading-5 text-[#B8C1D1]" role="status">
        Rankings are not guaranteed to update in real time.{" "}
        {rankings.calculatedAt
          ? `Calculated ${rankings.calculatedAt}`
          : "Calculation time unavailable"}
      </p>
    </div>
  );
}
