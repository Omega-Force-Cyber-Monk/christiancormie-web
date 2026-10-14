import type { ReactNode } from "react";

import { useAppDispatch, useAppSelector } from "@/app/hooks";
import { PageLoader } from "@/components/feedback/PageLoader";
import { ErrorState } from "@/components/states/ErrorState";
import { Button } from "@/components/ui/Button";
import { selectAuthInitialization } from "@/features/auth/store/auth.selectors";
import { clearSession } from "@/features/auth/store/auth.slice";
import { initializeSession } from "@/features/auth/store/auth.thunks";

export function SessionGate({ children }: { children: ReactNode }) {
  const dispatch = useAppDispatch();
  const { isHydrated, initializationError } = useAppSelector(selectAuthInitialization);

  if (isHydrated) return children;
  if (!initializationError) return <PageLoader />;

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
