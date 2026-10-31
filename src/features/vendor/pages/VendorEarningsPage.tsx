import { useId, useReducer } from "react";
import { useSearchParams } from "react-router";
import { VendorEarningsOverview } from "@/features/vendor/components/earnings/VendorEarningsOverview";
import { VendorAnalyticsOverview } from "@/features/vendor/components/earnings/VendorAnalyticsOverview";
import { VendorCreditDetails } from "@/features/vendor/components/earnings/VendorCreditDetails";
import { VendorPaymentMethodPreview } from "@/features/vendor/components/earnings/VendorPaymentMethodPreview";
import { VendorConnectAccountStatus } from "@/features/vendor/components/earnings/VendorConnectAccountStatus";
import { VendorFinancialPanel } from "@/features/vendor/components/earnings/VendorFinancialPanel";
import {
  initialVendorEarningsState,
  parseEarningsTab,
  vendorEarningsReducer,
  type EarningsTab,
} from "@/features/vendor/utils/earningsState";
import "@/features/vendor/components/earnings/earnings.css";
export default function VendorEarningsPage() {
  const id = useId();
  const [params, setParams] = useSearchParams();
  const tab = parseEarningsTab(params.get("tab"));
  const [state, dispatch] = useReducer(
    vendorEarningsReducer,
    undefined,
    initialVendorEarningsState,
  );
  const selectTab = (next: EarningsTab) => {
    const updated = new URLSearchParams(params);
    if (next === "analytics") updated.set("tab", next);
    else updated.delete("tab");
    setParams(updated);
  };
  return (
    <section className={`vendor-earnings-page vendor-earnings-page--${tab}`}>
      <h1 className="sr-only">Earnings &amp; Analytics</h1>
      <div className="vendor-earnings-surface">
        <div
          className="vendor-earnings-tabs"
          role="tablist"
          aria-label="Earnings and analytics"
        >
          {(["earnings", "analytics"] as const).map((value) => (
            <button
              key={value}
              id={`${id}-${value}-tab`}
              role="tab"
              type="button"
              aria-selected={value === tab}
              aria-controls={`${id}-${value}-panel`}
              tabIndex={value === tab ? 0 : -1}
              onClick={() => selectTab(value)}
              onKeyDown={(event) => {
                if (["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) {
                  event.preventDefault();
                  const next =
                    event.key === "Home"
                      ? "earnings"
                      : event.key === "End"
                        ? "analytics"
                        : value === "earnings"
                          ? "analytics"
                          : "earnings";
                  selectTab(next);
                  document.getElementById(`${id}-${next}-tab`)?.focus();
                }
              }}
            >
              {value === "earnings" ? "Earnings" : "Analytics"}
            </button>
          ))}
        </div>
        <div
          role="tabpanel"
          id={`${id}-earnings-panel`}
          aria-labelledby={`${id}-earnings-tab`}
          hidden={tab !== "earnings"}
        >
          {tab === "earnings" && (
            <VendorEarningsOverview
              connectStatus={<VendorConnectAccountStatus />}
              financialContent={<VendorFinancialPanel />}
              methods={state.methods}
              defaultMethodId={state.defaultMethodId}
              onAdd={() => dispatch({ type: "add-open", open: true })}
              onDefault={(methodId) =>
                dispatch({ type: "default-method", id: methodId })
              }
            />
          )}
        </div>
        <div
          role="tabpanel"
          id={`${id}-analytics-panel`}
          aria-labelledby={`${id}-analytics-tab`}
          hidden={tab !== "analytics"}
        >
          {tab === "analytics" && (
            <>
              <p className="p-4 text-sm">
                Analytics preview: sample charts and credit conversions are separate
                from live financial records.
              </p>
              <VendorAnalyticsOverview
                accepting={state.acceptingCredits}
                creditsOpen={state.creditsOpen}
                onToggle={() => dispatch({ type: "toggle-credits" })}
                onOpen={() => dispatch({ type: "credits-open", open: true })}
              />
            </>
          )}
        </div>
      </div>
      <p className="mt-4 text-xs leading-5 text-[#B8C1D1]">
        Stripe Connect status is retrieved from the server. Bank-method entries, credit
        acceptance and charts remain local previews. Financial terms and business claims
        in previews are unverified design copy.
      </p>
      <p role="status" className="mt-2 text-sm text-[#2ED3D1]">
        {state.status}
      </p>
      {state.creditsOpen && (
        <VendorCreditDetails
          accepting={state.acceptingCredits}
          onToggle={() => dispatch({ type: "toggle-credits" })}
          onClose={() => dispatch({ type: "credits-open", open: false })}
        />
      )}{" "}
      {state.addOpen && (
        <VendorPaymentMethodPreview
          onClose={() => dispatch({ type: "add-open", open: false })}
          onAdd={(methodId, values) =>
            dispatch({ type: "add-method", id: methodId, values })
          }
        />
      )}
    </section>
  );
}
