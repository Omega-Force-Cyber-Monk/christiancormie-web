import { useEffect, useRef, useState } from "react";
import { useStore } from "react-redux";
import { useAppSelector } from "@/app/hooks";
import type { AppDispatch, RootState } from "@/app/store";
import {
  communityApi,
  communityPublisherAllowed,
  communityScope,
  cachedCommunityPost,
} from "../api/community.api";
import { useGetVendorMeQuery } from "@/features/vendor/api/vendor.api";
import { scopeMatches } from "@/services/api/sessionGuard";
import {
  createCommunitySchema,
  updateCommunitySchema,
  type CommunityWrite,
  type CommunityPatch,
  type CommunityMedia,
} from "../schemas/communityPublishing.schema";
import { publishCommunityDraft } from "./communityPublishing";
import { normalizeApiError } from "@/utils/errors/normalizeApiError";
import { toast } from "sonner";
import type { AppError } from "@/utils/errors/error.types";

const pipelines = new WeakMap<object, Set<string>>();
export function useCommunityPublisher() {
  const scope = useAppSelector(communityScope);
  const roles = useAppSelector((s) => s.auth.user?.roles);
  const verified = useAppSelector((s) => scopeMatches(s, scope));
  const vendor = useGetVendorMeQuery(undefined, {
    skip: !verified || !(scope.role === "VENDOR" || roles?.includes("VENDOR")),
  });
  const allowed = useAppSelector((s) => communityPublisherAllowed(s, scope));
  return { scope, allowed, vendor };
}
export function useCommunityPublishing() {
  const store = useStore<RootState>();
  const dispatch = store.dispatch as AppDispatch;
  const mounted = useRef(true);
  const busy = useRef(false);
  const uploaded = useRef(new Map<File, CommunityMedia>());
  const recoveryRequest = useRef<{ unsubscribe: () => void } | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [serverError, setServerError] = useState<AppError | null>(null);
  const [uncertain, setUncertain] = useState(false);
  const [reviewed, setReviewed] = useState(false);
  const scope = useAppSelector(communityScope);
  const reviewArg = { ...scope, filters: { limit: 20 } };
  const review = useAppSelector(
    (s) => communityApi.endpoints.getMyCommunityPosts.select(reviewArg)(s).data,
  );
  useEffect(() => {
    mounted.current = true;
    const files = uploaded.current;
    return () => {
      mounted.current = false;
      files.clear();
      recoveryRequest.current?.unsubscribe();
    };
  }, []);
  const isCurrent = () => mounted.current && scopeMatches(store.getState(), scope);
  async function publish(
    body: CommunityWrite | CommunityPatch,
    files: File[],
    postId?: string,
  ) {
    const key = `${scope.sessionId}:${scope.userId}`;
    const flights = pipelines.get(dispatch) ?? new Set<string>();
    pipelines.set(dispatch, flights);
    if (busy.current || flights.has(key) || (uncertain && !reviewed)) return undefined;
    if (!communityPublisherAllowed(store.getState(), scope)) {
      setError("A verified eligible publisher account is required.");
      return undefined;
    }
    busy.current = true;
    flights.add(key);
    setPending(true);
    setError("");
    setServerError(null);
    let saving = false;
    try {
      let input = body;
      if (postId && files.length) {
        const post = cachedCommunityPost(store.getState(), scope, postId);
        input = {
          ...body,
          media: (post?.media ?? []).map(({ mediaUrl, mediaType }) => ({
            mediaUrl,
            mediaType: mediaType as CommunityMedia["mediaType"],
          })),
        };
      }
      const result = await publishCommunityDraft({
        body: input,
        editing: !!postId,
        files,
        isCurrent,
        cached: (file) => uploaded.current.get(file),
        remember: (file, media) => uploaded.current.set(file, media),
        upload: async (file) => {
          const req = dispatch(
            communityApi.endpoints.uploadCommunityMedia.initiate({
              ...scope,
              files: [file],
            }),
          );
          try {
            return (await req.unwrap()).media[0];
          } finally {
            req.reset();
          }
        },
        save: async (payload) => {
          saving = true;
          if (postId) {
            const req = dispatch(
              communityApi.endpoints.updateCommunityPost.initiate({
                ...scope,
                postId,
                body: updateCommunitySchema.parse(payload),
              }),
            );
            try {
              const response = await req.unwrap();
              return { id: response.post.id, rewardStatus: undefined };
            } finally {
              req.reset();
            }
          }
          const req = dispatch(
            communityApi.endpoints.createCommunityPost.initiate({
              ...scope,
              body: createCommunitySchema.parse(payload),
            }),
          );
          try {
            const response = await req.unwrap();
            return { id: response.post.id, rewardStatus: response.rewardStatus };
          } finally {
            req.reset();
          }
        },
      });
      if (!isCurrent()) return undefined;
      for (const file of files) uploaded.current.delete(file);
      setUncertain(false);
      setReviewed(false);
      toast.success(
        postId
          ? "Community post updated."
          : `Community post published. Reward status: ${result.rewardStatus}.`,
      );
      return result;
    } catch (cause) {
      if (isCurrent()) {
        const normalized = normalizeApiError(cause);
        setServerError(normalized);
        const ambiguous =
          saving &&
          (normalized.kind === "NETWORK" ||
            normalized.kind === "SERVER" ||
            normalized.kind === "UNKNOWN");
        setUncertain(ambiguous);
        setReviewed(false);
        const message =
          cause instanceof Error
            ? cause.message
            : [normalized.message, ...(normalized.validationMessages ?? [])].join(" ");
        setError(
          `${message}${ambiguous ? " Saving is unconfirmed. Refresh and review My Posts before deciding whether to retry." : " Your draft is retained."}`,
        );
        toast.error(normalized.message);
      }
      return undefined;
    } finally {
      busy.current = false;
      flights.delete(key);
      if (isCurrent()) setPending(false);
    }
  }
  async function refreshMine() {
    if (pending) return;
    setPending(true);
    recoveryRequest.current?.unsubscribe();
    const req = dispatch(
      communityApi.endpoints.getMyCommunityPosts.initiate(reviewArg, {
        forceRefetch: true,
      }),
    );
    recoveryRequest.current = req;
    try {
      await req.unwrap();
      if (isCurrent()) setReviewed(true);
    } catch (cause) {
      if (isCurrent()) setError(normalizeApiError(cause).message);
    } finally {
      if (isCurrent()) setPending(false);
    }
  }
  return {
    publish,
    pending,
    error,
    serverError,
    uncertain,
    reviewed,
    review,
    refreshMine,
    isCurrent,
  };
}
