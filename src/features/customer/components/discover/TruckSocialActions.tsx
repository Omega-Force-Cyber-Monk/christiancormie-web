import { USER_ROLES } from "@/constants/roles";
import { useRef } from "react";
import { useStore } from "react-redux";
import { toast } from "sonner";
import type { RootState } from "@/app/store";
import { useAppSelector } from "@/app/hooks";
import {
  selectCurrentRole,
  selectIsAuthenticated,
} from "@/features/auth/store/auth.selectors";
import {
  useSetTruckRelationshipMutation,
  useGetDiscoveryFavoritesQuery,
  type SocialAction,
} from "@/features/customer/api/discovery.api";
import { Button } from "@/components/ui/Button";
import { normalizeApiError } from "@/utils/errors/normalizeApiError";
import { Heart } from "lucide-react";

export function TruckSocialActions({
  foodTruckId,
  kind,
  compact = false,
}: {
  foodTruckId: string;
  kind: SocialAction["kind"];
  compact?: boolean;
}) {
  const verified = useAppSelector(selectIsAuthenticated);
  const role = useAppSelector(selectCurrentRole);
  const sessionId = useAppSelector((s) => s.auth.sessionId);
  const store = useStore<RootState>();
  const [submit, result] = useSetTruckRelationshipMutation({
    fixedCacheKey: `${sessionId}:${foodTruckId}:${kind}`,
  });
  const pending = useRef(false);
  const allowed = verified && role === USER_ROLES.CUSTOMER;
  const combinedList = useGetDiscoveryFavoritesQuery(undefined, { skip: !allowed });
  // This unpaginated ALL list is a union. Absence establishes neither relation;
  // presence cannot tell us which relation exists because its flag is hardcoded.
  const absent =
    combinedList.currentData &&
    !combinedList.currentData.items.some((truck) => truck.id === foodTruckId);
  const known = result.data?.enabled ?? (absent ? false : undefined);
  async function change(enabled: boolean) {
    if (pending.current || result.isLoading || !allowed) return;
    pending.current = true;
    const session = store.getState().auth.sessionId;
    const sameCustomer = () =>
      store.getState().auth.sessionId === session &&
      selectIsAuthenticated(store.getState()) &&
      selectCurrentRole(store.getState()) === USER_ROLES.CUSTOMER;
    try {
      await submit({ foodTruckId, kind, enabled }).unwrap();
      if (sameCustomer())
        toast.success(
          kind === "favorite"
            ? enabled
              ? "Truck saved."
              : "Favorite removed."
            : enabled
              ? "Truck followed."
              : "Truck unfollowed.",
        );
    } catch (error) {
      if (sameCustomer()) toast.error(normalizeApiError(error).message);
    } finally {
      pending.current = false;
    }
  }
  const add = kind === "follow" ? "Follow" : "Save";
  const remove = kind === "follow" ? "Unfollow" : "Remove favorite";
  if (compact)
    return (
      <button
        type="button"
        disabled={!allowed || result.isLoading}
        aria-label={`${known === true ? "Unsave" : "Save"} truck${known === undefined ? " (current saved state unavailable)" : ""}`}
        aria-pressed={known}
        className="absolute top-1 right-1 grid size-9 place-items-center rounded-full text-white drop-shadow-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:opacity-50"
        onClick={() => void change(known === true ? false : true)}
      >
        <Heart
          aria-hidden="true"
          className={known === true ? "fill-[#FF5733]" : "fill-[#D9D9D9]/80"}
          size={24}
        />
      </button>
    );
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button
        className="profile-pill"
        disabled={!allowed || result.isLoading}
        aria-pressed={known === undefined ? undefined : known}
        onClick={() => void change(known === true ? false : true)}
      >
        {result.isLoading ? "Updating…" : known === true ? remove : add}
      </Button>
      {known === undefined && (
        <Button
          className="profile-pill"
          disabled={!allowed || result.isLoading}
          onClick={() => void change(false)}
        >
          {remove}
        </Button>
      )}
      {known === undefined && (
        <span className="text-xs text-[var(--text-muted)]">
          {allowed ? "Current state unavailable" : "Verified customer session required"}
        </span>
      )}
      {known !== undefined && (
        <span role="status" className="text-xs text-[var(--text-muted)]">
          {kind === "favorite"
            ? known
              ? "Saved"
              : "Not saved"
            : known
              ? "Following"
              : "Not following"}
        </span>
      )}
    </div>
  );
}
