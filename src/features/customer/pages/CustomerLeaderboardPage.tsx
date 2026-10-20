import { useId } from "react";
import { useSearchParams } from "react-router";
import { LeaderboardRankings } from "@/features/customer/components/leaderboard/LeaderboardRankings";
import {
  getLeaderboardRankings,
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
  function selectCategory(next: LeaderboardCategory) {
    setParams(
      (current) => {
        const updated = new URLSearchParams(current);
        updated.set("category", next);
        return updated;
      },
      { preventScrollReset: true },
    );
  }
  return (
    <div className="customer-leaderboard-page">
      <h1 className="sr-only">Leaderboard — static preview</h1>
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
        <LeaderboardRankings
          entries={getLeaderboardRankings(category)}
          label={active.label}
        />
      </section>
      <p className="mt-4 text-xs leading-5 text-[#B8C1D1]" role="status">
        {active.label} · 7 sample rankings. Local design preview.
      </p>
    </div>
  );
}
