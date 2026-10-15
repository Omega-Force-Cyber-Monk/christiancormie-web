import { Outlet } from "react-router";

import { useAppSelector } from "@/app/hooks";
import { env } from "@/config/env";
import { USER_ROLES } from "@/constants/roles";
import { SessionGate } from "@/features/auth/components/SessionGate";
import {
  selectAuthInitialization,
  selectIsAuthenticated,
} from "@/features/auth/store/auth.selectors";
import { AuthGuard } from "@/router/guards/AuthGuard";
import { RoleGuard } from "@/router/guards/RoleGuard";

// Applied only to the four static review routes. Never creates or changes a session.
export function CustomerReviewGuard() {
  const auth = useAppSelector(selectAuthInitialization);
  const authenticated = useAppSelector(selectIsAuthenticated);
  const anonymous =
    auth.isHydrated &&
    !auth.user &&
    !auth.accessToken &&
    !auth.refreshToken &&
    !auth.sessionId;

  if (env.enablePublicReview && anonymous) return <Outlet />;
  if (!authenticated) return <AuthGuard />;

  return (
    <SessionGate>
      <RoleGuard allowedRoles={[USER_ROLES.CUSTOMER]} />
    </SessionGate>
  );
}
