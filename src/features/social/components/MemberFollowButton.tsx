import { useStore } from "react-redux";
import { useRef } from "react";
import { toast } from "sonner";
import type { RootState } from "@/app/store";
import { useAppSelector } from "@/app/hooks";
import { Button } from "@/components/ui/Button";
import {
  socialActorAllowed,
  useSetMemberFollowMutation,
} from "../api/socialProfile.api";
import { normalizeApiError } from "@/utils/errors/normalizeApiError";
export function MemberFollowButton({
  userId,
  isFollowing,
  busy = false,
}: {
  userId: string;
  isFollowing: boolean;
  busy?: boolean;
}) {
  const store = useStore<RootState>();
  const session = useAppSelector((s) => s.auth.sessionId);
  const viewer = useAppSelector((s) => s.auth.user?.id);
  const allowed = useAppSelector(socialActorAllowed);
  const pending = useRef(false);
  const [submit, result] = useSetMemberFollowMutation({
    fixedCacheKey: `member:${session}:${userId}`,
  });
  async function toggle() {
    if (pending.current || busy || result.isLoading || !allowed || viewer === userId)
      return;
    pending.current = true;
    const role = store.getState().auth.user?.role;
    try {
      await submit({ userId, following: !isFollowing }).unwrap();
      if (
        store.getState().auth.sessionId === session &&
        store.getState().auth.user?.role === role
      )
        toast.success(isFollowing ? "Member unfollowed." : "Member followed.");
    } catch (error) {
      if (
        store.getState().auth.sessionId === session &&
        store.getState().auth.user?.role === role
      )
        toast.error(normalizeApiError(error).message);
    } finally {
      pending.current = false;
    }
  }
  return (
    <Button
      variant="primary"
      disabled={!allowed || viewer === userId || result.isLoading || busy}
      aria-pressed={isFollowing}
      onClick={() => void toggle()}
    >
      {result.isLoading ? "Updating…" : isFollowing ? "Unfollow" : "Follow"}
    </Button>
  );
}
