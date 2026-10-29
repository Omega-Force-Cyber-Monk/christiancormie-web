import { Heart } from "lucide-react";
import { useRef } from "react";
import { toast } from "sonner";
import { useStore } from "react-redux";
import type { RootState } from "@/app/store";
import { useSocialPostActionMutation } from "../api/socialFeed.api";
import { normalizeApiError } from "@/utils/errors/normalizeApiError";
export function PostLikeButton({
  postId,
  commentId,
  liked,
  count,
  busy = false,
}: {
  postId: string;
  commentId?: string;
  liked: boolean;
  count: number;
  busy?: boolean;
}) {
  const store = useStore<RootState>();
  const pending = useRef(false);
  const [submit, state] = useSocialPostActionMutation({
    fixedCacheKey: `${store.getState().auth.sessionId}:like:${commentId ?? postId}`,
  });
  async function toggle() {
    if (pending.current || state.isLoading || busy) return;
    pending.current = true;
    const session = store.getState().auth.sessionId;
    try {
      await submit({
        kind: commentId ? "comment-like" : "like",
        postId,
        commentId,
      }).unwrap();
    } catch (error) {
      if (store.getState().auth.sessionId === session)
        toast.error(normalizeApiError(error).message);
    } finally {
      pending.current = false;
    }
  }
  return (
    <button
      type="button"
      className={
        liked ? "feed-reaction text-[#FF5733]" : "feed-reaction text-[#B8C1D1]"
      }
      disabled={state.isLoading || busy}
      aria-pressed={liked}
      aria-label={liked ? "Unlike" : "Like"}
      onClick={() => void toggle()}
    >
      <Heart
        aria-hidden="true"
        className={liked ? "fill-current" : ""}
        size={commentId ? 14 : 24}
      />
      <span>{count}</span>
    </button>
  );
}
