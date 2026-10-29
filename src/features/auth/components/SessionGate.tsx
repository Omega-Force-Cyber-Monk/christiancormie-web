import type { ReactNode } from "react";

import { useAppDispatch, useAppSelector } from "@/app/hooks";
import { AppLoader } from "@/components/ui/AppLoader";
import { ErrorState } from "@/components/states/ErrorState";
import { Button } from "@/components/ui/Button";
import { ALL_USER_ROLES } from "@/constants/roles";
import { selectAuthInitialization } from "@/features/auth/store/auth.selectors";
import { activeRoleSelected, clearSession } from "@/features/auth/store/auth.slice";
import { initializeSession } from "@/features/auth/store/auth.thunks";

export function SessionGate({ children }: { children: ReactNode }) {
  const dispatch = useAppDispatch();
  const { isHydrated, initializationError, isIdentityVerified, user } = useAppSelector(
    selectAuthInitialization,
  );

  if (isHydrated && isIdentityVerified && user && !user.role) {
    return (
      <div className="mx-auto w-full max-w-md space-y-4 p-6 text-center">
        <h1 className="text-xl font-semibold">Choose how to continue</h1>
        <p className="text-sm text-[var(--text-muted)]">
          Your account has multiple roles. Choose one for this session.
        </p>
        {ALL_USER_ROLES.filter((role) => user.roles.includes(role)).map((role) => (
          <Button
            className="w-full"
            key={role}
            onClick={() => dispatch(activeRoleSelected(role))}
          >
            Continue as {role.toLowerCase().replaceAll("_", " ")}
          </Button>
        ))}
        <Button onClick={() => dispatch(clearSession())}>Sign out</Button>
      </div>
    );
  }

  if (isHydrated) return children;
  if (!initializationError) return <AppLoader />;

  return (
    <div className="space-y-4 p-6 text-center">
      <ErrorState
        error={initializationError}
        onRetry={() => {
          void dispatch(initializeSession());
        }}
      />
      <Button onClick={() => dispatch(clearSession())}>Sign in again</Button>
    </div>
  );
}
