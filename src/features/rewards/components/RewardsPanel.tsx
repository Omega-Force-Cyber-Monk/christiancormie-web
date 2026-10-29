import { tierArtwork } from "../utils/tierArtwork";
import { useAppSelector } from "@/app/hooks";
import {
  rewardsAllowed,
  useGetMyRewardSummaryQuery,
  useGetRewardRulesQuery,
} from "../api/rewards.api";
import { nextTierProgress } from "../utils/rewardProgress";
import { EmptyState } from "@/components/states/EmptyState";
import { ErrorState } from "@/components/states/ErrorState";
export function RewardsPanel({ guide = false }: { guide?: boolean }) {
  const allowed = useAppSelector(rewardsAllowed);
  const summary = useGetMyRewardSummaryQuery(undefined, { skip: !allowed });
  const rules = useGetRewardRulesQuery(undefined, { skip: !allowed });
  if (!allowed) return <p>Verified customer identity required for rewards.</p>;
  if (summary.isLoading) return <p role="status">Loading rewards…</p>;
  if (summary.isError || !summary.currentData)
    return <ErrorState onRetry={() => void summary.refetch()} />;
  const data = summary.currentData;
  const loyalty = data.loyalty;
  const progress = nextTierProgress(loyalty);
  return (
    <section
      className={guide ? "" : "member-profile-progress"}
      aria-label="Rewards and tier progress"
    >
      {summary.isFetching && <p role="status">Refreshing rewards…</p>}
      {!guide && (
        <>
          <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
            <p className="text-[#B8C1D1]">{progress.label}</p>
            <p className="text-[#FF5733]">
              {loyalty.lifetimePoints.toLocaleString("en-US")}
              {loyalty.nextTier
                ? ` / ${loyalty.nextTier.requiredPoints.toLocaleString("en-US")}`
                : ""}{" "}
              lifetime pts
            </p>
          </div>
          <progress
            max={progress.max}
            value={progress.value}
            aria-label={progress.label}
            className="member-progress-bar"
          />
          <dl className="my-4 flex flex-wrap gap-5">
            {[
              ["Available points", loyalty.availablePoints],
              ["Lifetime points", loyalty.lifetimePoints],
              ["Redeemed points", loyalty.redeemedPoints],
            ].map(([label, value]) => (
              <div key={label}>
                <dt>{label}</dt>
                <dd>{value.toLocaleString("en-US")}</dd>
              </div>
            ))}
          </dl>
          <div className="mt-3 mb-5 flex items-center justify-between gap-3">
            <h2 className="text-xl font-bold">Tier Badges</h2>
            <p className="text-xs text-[#B8C1D1]">{data.tiers.length} tiers total</p>
          </div>
          <ul className="member-profile-tiers">
            {data.tiers.map((tier) => (
              <li
                key={tier.slug}
                className={
                  tier.isCurrent ? "member-tier member-tier--current" : "member-tier"
                }
              >
                {tier.isCurrent && <span className="member-tier-current">Current</span>}
                {tierArtwork[tier.slug] && (
                  <img src={tierArtwork[tier.slug]} alt="" className="size-9" />
                )}
                <h3>{tier.name}</h3>
                <p className="text-[#C8964A]">
                  {tier.requiredPoints.toLocaleString("en-US")} pts
                </p>
              </li>
            ))}
          </ul>
        </>
      )}
      <table className="settings-points-table">
        <caption className="sr-only">Current backend points per action</caption>
        <thead>
          <tr>
            <th colSpan={2}>POINTS PER ACTION</th>
          </tr>
        </thead>
        <tbody>
          {data.pointsPerAction.map((item) => (
            <tr key={item.sourceType}>
              <th scope="row">{item.action}</th>
              <td className="text-[#FFB800]">
                {item.points > 0 ? "+" : ""}
                {item.points}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {!data.pointsPerAction.length && (
        <EmptyState title="No points actions available" />
      )}
      <section className="mt-5" aria-label="Reward rules">
        <h2 className="font-semibold">Current reward rules</h2>
        {rules.isLoading ? (
          <p role="status">Loading reward rules…</p>
        ) : rules.isError ? (
          <ErrorState onRetry={() => void rules.refetch()} />
        ) : rules.currentData?.length ? (
          <ul className="space-y-3">
            {rules.currentData.map((rule) => (
              <li key={rule.id}>
                <h3>{rule.name}</h3>
                <p className="text-sm text-[#B8C1D1]">{rule.description}</p>
                <p>
                  {rule.pointsRequired ?? "Requirement unavailable"} points required
                </p>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState title="No reward rules available" />
        )}
      </section>
      {!guide && (
        <section className="mt-5" aria-label="Recent reward activity">
          <h2 className="font-semibold">Recent activity</h2>
          {data.recentActivity.length ? (
            <ul className="space-y-3">
              {data.recentActivity.map((activity) => (
                <li key={activity.id}>
                  <h3>{activity.title}</h3>
                  <p>{activity.subtitle}</p>
                  <p>
                    {activity.points > 0 ? "+" : ""}
                    {activity.points} points ·{" "}
                    {Number.isNaN(Date.parse(activity.createdAt))
                      ? "Date unavailable"
                      : new Date(activity.createdAt).toLocaleString("en-US", {
                          timeZone: "UTC",
                        })}{" "}
                    UTC
                  </p>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState title="No reward activity yet" />
          )}
        </section>
      )}
      <p className="mt-3 text-xs text-[#B8C1D1]">
        Reward information only. No points are awarded or redeemed here.
      </p>
    </section>
  );
}
