import { useAppSelector } from "@/app/hooks";
import {
  selectCurrentRole,
  selectCurrentUser,
  selectIsAuthenticated,
} from "@/features/auth/store/auth.selectors";
import {
  useGetVendorMeQuery,
  useGetMyTrucksQuery,
} from "@/features/vendor/api/vendor.api";
import {
  toVendorIdentity,
  vendorContextMatches,
} from "@/features/vendor/utils/vendorAdapters";

export const isVendorAccessError = (error: unknown) =>
  Boolean(
    error &&
    typeof error === "object" &&
    "status" in error &&
    [401, 403, 404].includes(Number(error.status)),
  );

export function useVendorContext() {
  const role = useAppSelector(selectCurrentRole);
  const authenticated = useAppSelector(selectIsAuthenticated);
  const user = useAppSelector(selectCurrentUser);
  const enabled = authenticated && role === "VENDOR";
  const profile = useGetVendorMeQuery(undefined, { skip: !enabled });
  const vendor = enabled ? profile.currentData : undefined;
  const accountRestricted = Boolean(
    vendor?.user?.status && vendor.user.status !== "ACTIVE",
  );
  const trucks = useGetMyTrucksQuery(undefined, {
    skip:
      !enabled ||
      !vendor ||
      accountRestricted ||
      vendor.userId !== user?.id ||
      isVendorAccessError(profile.error),
  });
  const matched =
    vendor && user && vendorContextMatches(vendor, user.id, trucks.currentData);
  return {
    enabled,
    profile,
    trucks,
    vendor,
    matched,
    accountRestricted,
    denied: isVendorAccessError(profile.error) || isVendorAccessError(trucks.error),
    allowed: Boolean(
      enabled &&
      matched &&
      !accountRestricted &&
      !isVendorAccessError(profile.error) &&
      !isVendorAccessError(trucks.error) &&
      vendor?.dashboardAccess.allowed,
    ),
    identity:
      matched && vendor ? toVendorIdentity(vendor, trucks.currentData) : undefined,
  };
}
