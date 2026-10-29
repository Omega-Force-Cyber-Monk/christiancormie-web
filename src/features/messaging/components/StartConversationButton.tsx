import { useEffect, useRef } from "react";
import { useNavigate } from "react-router";
import { useStore } from "react-redux";
import { toast } from "sonner";
import type { RootState } from "@/app/store";
import { Button } from "@/components/ui/Button";
import { ROUTES } from "@/constants/routes";
import { USER_ROLES } from "@/constants/roles";
import { selectCurrentRole } from "@/features/auth/store/auth.selectors";
import {
  messagingAllowed,
  useCreateDirectConversationMutation,
} from "../api/messaging.api";
import { chatFailure, useMessagingIdentity } from "../hooks/useMessagingWorkspace";
import type { DirectTarget } from "../types/messaging.types";
export function StartConversationButton({
  target,
  className,
  onCreated,
}: {
  target: DirectTarget;
  className?: string;
  onCreated?: (id: string) => void;
}) {
  const { allowed, scope, viewer } = useMessagingIdentity();
  const store = useStore<RootState>();
  const [create, state] = useCreateDirectConversationMutation();
  const navigate = useNavigate();
  const lock = useRef(false);
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);
  return (
    <Button
      className={className}
      disabled={!allowed || target.participantUserId === viewer || state.isLoading}
      onClick={() => {
        if (lock.current) return;
        lock.current = true;
        void create({ ...scope, target })
          .unwrap()
          .then((c) => {
            const s = store.getState();
            if (
              !mounted.current ||
              !messagingAllowed(s) ||
              s.auth.sessionId !== scope.sessionId ||
              selectCurrentRole(s) !== scope.role ||
              s.auth.user?.id !== viewer
            )
              return;
            if (onCreated) onCreated(c.id);
            else
              void navigate(
                `${scope.role === USER_ROLES.VENDOR ? ROUTES.VENDOR_MESSAGE : ROUTES.CUSTOMER_MESSAGE}?conversation=${encodeURIComponent(c.id)}`,
              );
          })
          .catch((e: unknown) => {
            if (
              mounted.current &&
              store.getState().auth.sessionId === scope.sessionId &&
              selectCurrentRole(store.getState()) === scope.role
            )
              toast.error(chatFailure(e));
          })
          .finally(() => {
            lock.current = false;
          });
      }}
    >
      Message
    </Button>
  );
}
