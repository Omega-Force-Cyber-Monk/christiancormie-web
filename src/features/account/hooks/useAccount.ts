import { useAppSelector } from "@/app/hooks";
import { useStore } from "react-redux";
import type { RootState } from "@/app/store";
import {
  selectCurrentRole,
  selectIsAuthenticated,
} from "@/features/auth/store/auth.selectors";
import { useGetCurrentUserQuery } from "@/features/auth/api/auth.api";
import { scopeMatches } from "@/services/api/sessionGuard";
export function useAccount() {
  const auth = useAppSelector((s) => s.auth);
  const allowed = useAppSelector(selectIsAuthenticated);
  const role = useAppSelector(selectCurrentRole) ?? "";
  const store = useStore<RootState>();
  const scope = { sessionId: auth.sessionId ?? "", userId: auth.user?.id ?? "", role };
  const query = useGetCurrentUserQuery(undefined, { skip: !allowed });
  const denied =
    query.isError &&
    "status" in query.error &&
    [401, 403, 404].includes(Number(query.error.status));
  return {
    scope,
    key: `${scope.sessionId}:${scope.userId}:${role}`,
    allowed,
    query,
    user:
      !denied && query.currentData?.id === scope.userId ? query.currentData : undefined,
    isCurrent: () => scopeMatches(store.getState(), scope),
  };
}
