import { useAppSelector } from "@/app/hooks";
import {
  useVendorContext,
  isVendorAccessError,
} from "@/features/vendor/utils/useVendorContext";
import { vendorAccessState } from "@/features/vendor/components/home/VendorAccessState";
import { useGetVendorConnectAccountQuery } from "@/features/payments/api/connectAccount.api";
import type { SessionScope } from "@/services/api/sessionGuard";
import { normalizeApiError } from "@/utils/errors/normalizeApiError";
import { AppLoader } from "@/components/ui/AppLoader";
import { ErrorState } from "@/components/states/ErrorState";

export function VendorConnectAccountStatus() {
  const context = useVendorContext();
  const auth = useAppSelector((s) => s.auth);
  const access = vendorAccessState(context);
  if (access) return access;
  const scope = {
    sessionId: auth.sessionId ?? "",
    userId: auth.user?.id ?? "",
    role: auth.user?.role ?? "",
  };
  return (
    <ConnectStatus
      key={`${scope.sessionId}:${scope.userId}:${scope.role}:${context.vendor?.id}`}
      scope={scope}
    />
  );
}
function ConnectStatus({ scope }: { scope: SessionScope }) {
  const query = useGetVendorConnectAccountQuery(scope);
  const denied = isVendorAccessError(query.error);
  const account = denied ? undefined : query.currentData;
  return (
    <section className="mb-5 space-y-3" aria-label="Stripe Connect account status">
      <h3 className="text-base font-medium">Stripe Connect status</h3>
      <button
        className="vendor-earnings-secondary"
        type="button"
        disabled={query.isFetching}
        onClick={() => void query.refetch()}
      >
        Refresh account status
      </button>
      {query.isLoading && (
        <AppLoader variant="compact" label="Loading payment account status" />
      )}
      {query.isFetching && !query.isLoading && (
        <p role="status" className="text-xs text-[#B8C1D1]">
          Refreshing account status…
        </p>
      )}
      {query.error && (
        <ErrorState
          error={normalizeApiError(query.error)}
          onRetry={() => void query.refetch()}
        />
      )}
      {!query.error && account === null && (
        <p role="status" className="text-sm text-[#B8C1D1]">
          Stripe Connect is not connected. Account setup is not available here.
        </p>
      )}
      {account && (
        <>
          <p className="text-sm text-[#B8C1D1]">
            {query.error ? "Last reported account status" : "Account connected"}.
            Connection alone does not mean charges or payouts are enabled.
          </p>
          <dl className="space-y-2 text-sm text-[#B8C1D1]">
            {[
              [
                "Onboarding details",
                account.onboardingCompleted ? "Submitted" : "Incomplete",
              ],
              ["Charges", account.chargesEnabled ? "Enabled" : "Not enabled"],
              ["Payouts", account.payoutsEnabled ? "Enabled" : "Not enabled"],
              [
                "Restrictions",
                account.restrictionsReported ? "Reported" : "None reported",
              ],
              ["Account type", account.accountType],
              ["Country", account.country ?? "Not returned"],
              ["Requirements currently due", String(account.requirements.currentlyDue)],
              [
                "Requirements eventually due",
                String(account.requirements.eventuallyDue),
              ],
              ["Requirements past due", String(account.requirements.pastDue)],
              [
                "Requirements pending verification",
                String(account.requirements.pendingVerification),
              ],
              [
                "Status refreshed",
                `${new Date(account.updatedAt).toLocaleString("en-US", { timeZone: "UTC" })} UTC`,
              ],
            ].map(([label, value]) => (
              <div key={label}>
                <dt className="inline font-medium">{label}: </dt>
                <dd className="inline">{value}</dd>
              </div>
            ))}
          </dl>
        </>
      )}
      <p className="text-xs leading-5 text-[#B8C1D1]">
        Status information only. No onboarding, dashboard link or payment is started
        here.
      </p>
    </section>
  );
}
