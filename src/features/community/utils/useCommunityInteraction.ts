import { useEffect, useRef, useState } from "react";
import { useStore } from "react-redux";
import type { AppDispatch, RootState } from "@/app/store";
import { communityApi } from "../api/community.api";
import type { CommunityInteraction } from "../schemas/communityInteractions.schema";
import { useCommunityPublisher } from "./useCommunityPublishing";
import { scopeMatches } from "@/services/api/sessionGuard";
import { normalizeApiError } from "@/utils/errors/normalizeApiError";
import { toast } from "sonner";
import type { AppError } from "@/utils/errors/error.types";
export function useCommunityInteraction(postId: string) {
  const store = useStore<RootState>();
  const dispatch = store.dispatch as AppDispatch;
  const publisher = useCommunityPublisher();
  const mounted = useRef(true);
  const busy = useRef(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [failure, setFailure] = useState<AppError | null>(null);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);
  const current = () =>
    mounted.current && scopeMatches(store.getState(), publisher.scope);
  async function restore() {
    const scope = publisher.scope;
    if (!scopeMatches(store.getState(), scope)) return;
    const req = dispatch(
      communityApi.endpoints.communityInteraction.initiate({
        ...scope,
        postId,
        action: { kind: "restore" },
      }),
    );
    try {
      await req.unwrap();
      if (scopeMatches(store.getState(), scope)) toast.success("Post restored.");
    } catch (cause) {
      if (scopeMatches(store.getState(), scope))
        toast.error(normalizeApiError(cause).message);
    } finally {
      req.reset();
    }
  }
  async function run(action: CommunityInteraction) {
    if (busy.current || !current()) return undefined;
    busy.current = true;
    setPending(true);
    setError("");
    setFailure(null);
    const req = dispatch(
      communityApi.endpoints.communityInteraction.initiate({
        ...publisher.scope,
        postId,
        action,
      }),
    );
    try {
      const result = await req.unwrap();
      if (!current()) return undefined;
      if (action.kind === "ignore")
        toast.success("Post hidden from your Community feed.", {
          action: { label: "Undo", onClick: () => void restore() },
        });
      else
        toast.success(
          action.kind === "react"
            ? "LIKE saved. Reactions cannot be removed with this endpoint."
            : result.message,
        );
      return result;
    } catch (cause) {
      if (current()) {
        const normalized = normalizeApiError(cause);
        setFailure(normalized);
        const message = [
          normalized.message,
          ...(normalized.validationMessages ?? []),
        ].join(" ");
        setError(
          action.kind === "comment" &&
            ["NETWORK", "SERVER", "UNKNOWN"].includes(normalized.kind)
            ? `${message} Comment saving is unconfirmed. Refresh comments before an explicit retry; your draft is retained.`
            : message,
        );
        toast.error(normalized.message);
      }
      return undefined;
    } finally {
      busy.current = false;
      req.reset();
      if (current()) setPending(false);
    }
  }
  return { ...publisher, pending, error, failure, run, current };
}
