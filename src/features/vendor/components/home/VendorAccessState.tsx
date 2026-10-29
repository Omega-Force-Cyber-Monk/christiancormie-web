import { AppLoader } from "@/components/ui/AppLoader";
import { EmptyState } from "@/components/states/EmptyState";
import { ErrorState } from "@/components/states/ErrorState";
import { Button } from "@/components/ui/Button";
import type { useVendorContext } from "@/features/vendor/utils/useVendorContext";
import { normalizeApiError } from "@/utils/errors/normalizeApiError";

type Context = ReturnType<typeof useVendorContext>;
export function vendorAccessState(context: Context) {
  if (!context.enabled)
    return (
      <ErrorState
        error={{
          kind: "AUTHORIZATION",
          message: "A verified account with the active Vendor role is required.",
        }}
      />
    );
  const retryProfile = () => {
    void context.profile.refetch();
  };
  if (context.profile.isFetching && !context.vendor) return <AppLoader />;
  if (context.profile.error && (!context.vendor || context.denied)) {
    const error = normalizeApiError(context.profile.error);
    if (error.status === 404)
      return (
        <div className="space-y-3">
          <EmptyState
            title="Vendor profile unavailable"
            description="No vendor profile was found for this account. Complete vendor onboarding before using the dashboard."
          />
          <Button onClick={retryProfile}>Retry vendor profile</Button>
        </div>
      );
    return <ErrorState error={error} onRetry={retryProfile} />;
  }
  if (!context.vendor) return <EmptyState title="Vendor profile unavailable" />;
  if (!context.matched)
    return (
      <ErrorState
        error={{
          kind: "AUTHORIZATION",
          message: "The vendor or truck identity does not match this account.",
        }}
        onRetry={() => {
          retryProfile();
          void context.trucks.refetch();
        }}
      />
    );
  if (context.denied)
    return (
      <ErrorState
        error={normalizeApiError(context.trucks.error)}
        onRetry={() => {
          void context.trucks.refetch();
        }}
      />
    );
  if (context.accountRestricted)
    return (
      <ErrorState
        error={{
          kind: "AUTHORIZATION",
          message: `Account access restricted: ${context.vendor.user?.status.toLowerCase() ?? "unavailable"}.`,
        }}
        onRetry={retryProfile}
      />
    );
  if (!context.allowed)
    return (
      <div className="space-y-3">
        <EmptyState
          title={
            ["SUSPENDED", "REJECTED"].includes(context.vendor.status)
              ? `Vendor access restricted: ${context.vendor.status.toLowerCase()}`
              : "Vendor onboarding required"
          }
          description={
            context.vendor.dashboardAccess.reason ??
            "Dashboard access is unavailable for this vendor."
          }
        />
        <Button onClick={retryProfile}>Retry vendor profile</Button>
      </div>
    );
  return null;
}
