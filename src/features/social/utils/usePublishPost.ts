import { useEffect, useRef, useState } from "react";
import { useStore } from "react-redux";
import type { RootState, AppDispatch } from "@/app/store";
import { socialFeedApi } from "../api/socialFeed.api";
import { socialActorAllowed } from "../api/socialProfile.api";
import { postPayload, validPostFile } from "./postPublishing";
import type { UploadedMedia } from "../schemas/socialFeed.schema";
import { normalizeApiError } from "@/utils/errors/normalizeApiError";
import { USER_ROLES } from "@/constants/roles";
export async function publishDraft(options: {
  text: string;
  files: { id: string; file: File }[];
  locationId?: string;
  friendIds?: string[];
  foodTruckId?: string;
  isCurrent: () => boolean;
  cached: (id: string) => UploadedMedia | undefined;
  upload: (id: string, file: File) => Promise<UploadedMedia>;
  create: (body: ReturnType<typeof postPayload>) => Promise<{ id: string }>;
}) {
  if (options.text.trim().length > 2200)
    throw new Error("Use at most 2200 characters.");
  if (options.files.length > 10) throw new Error("Select no more than 10 images.");
  for (const item of options.files) {
    const error = validPostFile(item.file);
    if (error) throw new Error(error);
  }
  if (!options.text.trim() && !options.files.length)
    throw new Error("Write content or add an image.");
  const uploaded: UploadedMedia[] = [];
  for (const item of options.files) {
    if (!options.isCurrent()) throw new Error("The session changed.");
    uploaded.push(
      options.cached(item.id) ?? (await options.upload(item.id, item.file)),
    );
  }
  if (!options.isCurrent()) throw new Error("The session changed.");
  return options.create(postPayload(options, uploaded, options.foodTruckId));
}
export function usePublishPost() {
  const store = useStore<RootState>();
  const dispatch = store.dispatch as AppDispatch;
  const pending = useRef(false);
  const mounted = useRef(true);
  const uploads = useRef(new Map<string, { reset: () => void; abort: () => void }>());
  const [error, setError] = useState("");
  const [isPublishing, setIsPublishing] = useState(false);
  useEffect(() => {
    mounted.current = true;
    const records = uploads.current;
    return () => {
      mounted.current = false;
      for (const request of records.values()) {
        request.abort();
        request.reset();
      }
      records.clear();
    };
  }, []);
  async function publish(options: {
    text: string;
    files?: { id: string; file: File }[];
    locationId?: string;
    friendIds?: string[];
    foodTruckId?: string;
  }) {
    if (pending.current) return false;
    const state = store.getState();
    if (!socialActorAllowed(state)) {
      setError("Verified social identity required.");
      return false;
    }
    if (
      state.auth.user?.role === USER_ROLES.CUSTOMER &&
      state.auth.user.roles.includes(USER_ROLES.VENDOR)
    ) {
      setError(
        "This account publishes as a vendor on the backend. Select the Vendor role to publish a truck post.",
      );
      return false;
    }
    pending.current = true;
    setIsPublishing(true);
    setError("");
    const session = state.auth.sessionId;
    const role = state.auth.user?.role;
    const current = () =>
      mounted.current &&
      store.getState().auth.sessionId === session &&
      store.getState().auth.user?.role === role;
    try {
      await publishDraft({
        ...options,
        files: options.files ?? [],
        isCurrent: current,
        cached: (id) =>
          socialFeedApi.endpoints.uploadSocialImage.select(`${session}:${id}`)(
            store.getState(),
          ).data?.media[0],
        upload: async (id, file) => {
          const key = `${session}:${id}`;
          const request = dispatch(
            socialFeedApi.endpoints.uploadSocialImage.initiate(
              { file },
              { fixedCacheKey: key },
            ),
          );
          uploads.current.set(key, request);
          const data = await request.unwrap();
          return data.media[0];
        },
        create: async (body) => {
          const request = dispatch(
            socialFeedApi.endpoints.createSocialPost.initiate(body),
          );
          try {
            return await request.unwrap();
          } finally {
            request.reset();
          }
        },
      });
      if (!current()) return false;
      for (const request of uploads.current.values()) request.reset();
      uploads.current.clear();
      return true;
    } catch (cause) {
      if (current())
        setError(
          `${normalizeApiError(cause).message} Publication is unconfirmed; review the feed before retrying. Your draft is retained.`,
        );
      return false;
    } finally {
      pending.current = false;
      if (mounted.current) setIsPublishing(false);
    }
  }
  return { publish, error, isPublishing };
}
