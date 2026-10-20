import {
  CreditCard,
  ChevronDown,
  CircleCheck,
  MapPin,
  QrCode,
  ScanLine,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import { VendorMetricChart } from "@/features/vendor/components/earnings/VendorMetricChart";
import {
  creditRedemptions,
  creditSummary,
  followerData,
  qrScanData,
  topDropLocations,
} from "@/features/vendor/data/earnings.data";
import { formatEarningsMoney } from "@/features/vendor/utils/earningsState";
export function VendorAnalyticsOverview({
  accepting,
  creditsOpen,
  onToggle,
  onOpen,
}: {
  accepting: boolean;
  creditsOpen: boolean;
  onToggle: () => void;
  onOpen: () => void;
}) {
  return (
    <div className="vendor-analytics-overview">
      <div className="vendor-analytics-grid">
        <section className="vendor-metric-card">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="vendor-metric-label">QR SCANS</h2>
              <p className="mt-1 flex items-center gap-2">
                <strong className="text-2xl leading-7">
                  {qrScanData.reduce((sum, point) => sum + point.value, 0)}
                </strong>
                <span className="text-sm text-[#7D889A]">this week</span>
              </p>
            </div>
            <QrCode className="text-[#25C9CB]" size={23} aria-hidden="true" />
          </div>
          <VendorMetricChart metric="scans" />
        </section>
        <section className="vendor-metric-card vendor-top-locations">
          <h2 className="vendor-metric-label mb-1">TOP DROP LOCATIONS</h2>
          <ol>
            {topDropLocations.map((location) => (
              <li key={location.id}>
                <MapPin className="shrink-0 text-[#FF5733]" size={23} />
                <span className="min-w-0 flex-1 text-xs text-[#B8C1D1]">
                  {location.name}
                </span>
                <strong className="shrink-0 text-xs font-semibold text-[#25D3D5]">
                  {location.scans} scans
                </strong>
              </li>
            ))}
          </ol>
        </section>
        <section className="vendor-metric-card">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="vendor-metric-label">FOLLOWERS</h2>
              <p className="mt-1 text-2xl leading-7 font-bold">
                {followerData.at(-1)?.value.toLocaleString("en-US")}
              </p>
            </div>
            <span className="vendor-trend vendor-trend--followers">
              <TrendingUp size={12} /> +260 this month
            </span>
          </div>
          <VendorMetricChart metric="followers" />
        </section>
        <section className="vendor-credit-card">
          <div className="flex items-center gap-2">
            <span className="vendor-credit-icon">
              <CreditCard size={20} />
            </span>
            <div className="min-w-0 flex-1">
              <h2 className="text-sm font-bold">BiteDrop Credits</h2>
              <p className="mt-1 text-xs text-[#B8C1D1]">
                {accepting ? "Currently Accepting" : "Not Accepting"}
              </p>
            </div>
            <button
              type="button"
              className="vendor-credit-expand"
              aria-label="Open BiteDrop Credits details"
              aria-haspopup="dialog"
              aria-expanded={creditsOpen}
              onClick={onOpen}
            >
              <ChevronDown size={17} />
            </button>
          </div>
          <button
            type="button"
            className="vendor-credit-toggle"
            aria-pressed={accepting}
            onClick={onToggle}
          >
            <CreditCard size={17} /> Turn {accepting ? "Off" : "On"} Credit Acceptance
          </button>
        </section>
      </div>
      <section className="vendor-redemptions">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="flex items-center gap-2 text-xs">
            <ScanLine size={17} className="text-[#25D3D5]" /> Credit Redemptions
          </h2>
          <span className="vendor-trend">
            <TrendingUp size={12} /> +{creditSummary.weeklyChange}% vs last week
          </span>
        </div>
        <dl className="vendor-redemption-stats">
          <div>
            <dt>Total redeemed</dt>
            <dd>{creditSummary.total}</dd>
          </div>
          <div>
            <dt>Credits applied</dt>
            <dd>{formatEarningsMoney(creditSummary.appliedCents)}</dd>
          </div>
          <div>
            <dt>AVG/Day</dt>
            <dd>{creditSummary.averagePerDay}</dd>
          </div>
        </dl>
        <h3 className="mt-4 mb-2 text-xs">Recent Redemptions</h3>
        <ul>
          {creditRedemptions.map((redemption) => {
            const Icon =
              redemption.method === "Manual Code"
                ? QrCode
                : redemption.method === "Self-Service"
                  ? CircleCheck
                  : ScanLine;
            return (
              <li key={redemption.id} className="vendor-redemption-row">
                <span
                  className={`vendor-redemption-icon vendor-redemption-icon--${redemption.method === "Manual Code" ? "manual" : redemption.method === "Self-Service" ? "self" : "qr"}`}
                >
                  <Icon size={16} />
                </span>
                <div className="min-w-0 flex-1">
                  <h4 className="text-sm font-semibold">{redemption.name}</h4>
                  <p className="mt-1 text-xs text-[#8E96A5]">
                    {redemption.method} &middot; {redemption.time}
                  </p>
                </div>
                <span className="shrink-0 text-xs text-[#26E593]">
                  &minus;{formatEarningsMoney(redemption.amountCents, true)}
                </span>
              </li>
            );
          })}
        </ul>
        <aside className="vendor-credit-growth">
          <h3 className="mb-1 flex items-center gap-2 text-xs font-bold text-[#25D3D5]">
            <Sparkles size={18} /> How Credit Acceptance Grows Your Business
          </h3>
          <p className="pl-6 text-xs leading-[18px] text-[#90A1AA]">
            Vendors who accept BiteDrop credits get{" "}
            <span className="text-[#D1D7E2]">featured placement</span> at the top of the
            discovery map and priority in the Nearby Now feed. Credit users spend{" "}
            <span className="text-[#2ED893]">34% more per visit</span> on average and
            return <span className="text-[#FFB800]">2.4&times; more often</span> than
            non-credit customers. Credits are a marketing cost, not a loss &mdash; your
            featured placement alone drives measurable new revenue.
          </p>
        </aside>
      </section>
    </div>
  );
}
