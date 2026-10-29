import { socialFeedApi } from "@/features/social/api/socialFeed.api";
import { useAppSelector } from "@/app/hooks";
import { usePublishPost } from "@/features/social/utils/usePublishPost";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Camera, ImagePlus, MapPin, Tag, X } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { ConfirmationDialog } from "@/components/overlays/ConfirmationDialog/ConfirmationDialog";
import { useConfirmation } from "@/components/overlays/ConfirmationDialog/useConfirmation";
import { PostDetailsPicker } from "@/features/customer/components/create-post/PostDetailsPicker";
import { PostMediaPreview } from "@/features/customer/components/create-post/PostMediaPreview";
import {
  emptyPostDraft,
  type PostDraft,
} from "@/features/customer/data/create-post.data";
import { createPostSchema } from "@/features/customer/schemas/create-post.schema";
import {
  addPostPhotos,
  removePostPhoto,
  togglePostFriend,
} from "@/features/customer/utils/createPost";
import "@/features/customer/components/create-post/create-post.css";

export default function CustomerCreatePostPage() {
  const [screen, setScreen] = useState<"compose" | "location" | "friends">("compose");
  const [mediaErrors, setMediaErrors] = useState<string[]>([]);
  const publisher = usePublishPost();
  const viewer = useAppSelector((state) => state.auth.user);
  const [status, setStatus] = useState("");
  const busy = useRef(false);
  const draftId = useRef<string | null>(null);
  const photoInput = useRef<HTMLInputElement>(null);
  const cameraInput = useRef<HTMLInputElement>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const hasChangedScreen = useRef(false);
  const fieldId = useId();
  const { confirm, confirmationProps } = useConfirmation();
  const {
    control,
    register,
    setValue,
    reset,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<PostDraft>({
    resolver: zodResolver(createPostSchema),
    defaultValues: emptyPostDraft(),
  });
  const [text, media, locationId, friendIds] = useWatch({
    control,
    name: ["text", "media", "locationId", "friendIds"],
  });
  const draft: PostDraft = { text, media, locationId, friendIds };
  const textField = register("text");
  const selectedPlace = useAppSelector((state) => {
    for (const arg of socialFeedApi.util.selectCachedArgsForQuery(
      state,
      "getSocialPlaces",
    )) {
      const place = socialFeedApi.endpoints.getSocialPlaces
        .select(arg)(state)
        .data?.find((place) => place.id === draft.locationId);
      if (place) return place;
    }
    return undefined;
  });
  const location = draft.locationId
    ? { name: selectedPlace?.name ?? "Selected place" }
    : null;
  const friends = draft.friendIds;

  useEffect(() => {
    if (hasChangedScreen.current) heading.current?.focus();
    hasChangedScreen.current = true;
  }, [screen]);

  function openScreen(next: typeof screen) {
    setScreen(next);
  }
  function selectPhotos(files: FileList | null) {
    if (!files) return;
    const result = addPostPhotos(draft.media, Array.from(files), () =>
      crypto.randomUUID(),
    );
    setValue("media", result.media, { shouldValidate: true });
    setMediaErrors(result.errors);
  }
  function clearDraft() {
    reset(emptyPostDraft());
    setMediaErrors([]);
    draftId.current = null;
  }
  function requestReset() {
    confirm({
      title: "Discard this draft?",
      description:
        "The text, selected photos, location and friend tags will be cleared from this draft.",
      confirmText: "Discard draft",
      cancelText: "Keep editing",
      variant: "danger",
      onConfirm: clearDraft,
    });
  }

  return (
    <div className="create-post-page">
      <h1
        className={screen === "compose" ? "sr-only" : "post-step-heading"}
        ref={heading}
        tabIndex={-1}
      >
        {screen !== "compose" && (
          <button
            type="button"
            aria-label="Back to post"
            onClick={() => openScreen("compose")}
          >
            <ArrowLeft size={20} />
          </button>
        )}
        {screen === "compose"
          ? "Create Post"
          : screen === "location"
            ? "Check In"
            : "Tag Friends"}
      </h1>
      {screen === "compose" ? (
        <>
          <form
            className="post-composer"
            noValidate
            onSubmit={(event) => {
              event.preventDefault();
              if (busy.current) return;
              busy.current = true;
              void handleSubmit(async (values) => {
                const files = values.media.flatMap((item) =>
                  item.kind === "file" ? [{ id: item.id, file: item.file }] : [],
                );
                if (files.length !== values.media.length) {
                  setStatus("Select actual image files before publishing.");
                  return;
                }
                if (
                  await publisher.publish({
                    text: values.text,
                    files,
                    locationId: values.locationId,
                    friendIds: values.friendIds,
                  })
                ) {
                  reset(emptyPostDraft());
                  setMediaErrors([]);
                  setStatus("Post published.");
                }
              })(event).finally(() => {
                busy.current = false;
              });
            }}
          >
            <fieldset disabled={isSubmitting} className="contents">
              <div className="flex items-start gap-3">
                <span className="post-avatar">{viewer?.name?.slice(0, 2) ?? ""}</span>
                <div className="min-w-0">
                  <p className="text-base font-semibold">
                    {viewer?.name ?? "Identity unavailable"}{" "}
                    {friends.length > 0 && (
                      <button
                        type="button"
                        className="ml-1 text-xs font-normal text-[#8390A3]"
                        onClick={() => openScreen("friends")}
                      >
                        with {friends.length}{" "}
                        {friends.length === 1 ? "friend" : "friends"}
                      </button>
                    )}
                  </p>
                  {location && (
                    <div className="mt-1 flex items-center gap-1 text-xs text-[#B6B7BC]">
                      <button
                        type="button"
                        className="flex min-h-6 items-center gap-1 text-left"
                        onClick={() => openScreen("location")}
                      >
                        <MapPin size={14} className="text-[#FF5733]" />
                        {location.name}
                      </button>
                      <button
                        type="button"
                        aria-label="Remove check-in"
                        onClick={() => setValue("locationId", "")}
                      >
                        <X size={14} />
                      </button>
                    </div>
                  )}
                </div>
              </div>
              <label className="sr-only" htmlFor={fieldId}>
                Post content
              </label>
              <textarea
                {...textField}
                onChange={(event) => {
                  draftId.current = null;
                  void textField.onChange(event);
                }}
                id={fieldId}
                aria-invalid={Boolean(errors.text)}
                aria-describedby={errors.text ? `${fieldId}-error` : undefined}
                placeholder="What's on your mind? Found a delicious food truck? Share your food discovery!"
                className="post-textarea"
              />
              {errors.text && (
                <p
                  id={`${fieldId}-error`}
                  role="alert"
                  className="mb-4 text-sm text-red-300"
                >
                  {errors.text.message}
                </p>
              )}
              <div className="post-media-list" aria-label="Selected photos">
                {draft.media.map((media) => (
                  <PostMediaPreview
                    key={media.id}
                    media={media}
                    onRemove={() => {
                      draftId.current = null;
                      setValue("media", removePostPhoto(draft.media, media.id), {
                        shouldValidate: true,
                      });
                    }}
                  />
                ))}
              </div>
              {mediaErrors.length > 0 && (
                <div role="alert" className="mb-4 break-words text-sm text-red-300">
                  {mediaErrors.map((error, index) => (
                    <p key={index}>{error}</p>
                  ))}
                </div>
              )}
              <input
                ref={photoInput}
                type="file"
                multiple
                accept="image/jpeg,image/png"
                className="hidden"
                onChange={(event) => {
                  draftId.current = null;
                  selectPhotos(event.target.files);
                  event.target.value = "";
                }}
              />
              <input
                ref={cameraInput}
                type="file"
                accept="image/jpeg,image/png"
                capture="environment"
                className="hidden"
                onChange={(event) => {
                  draftId.current = null;
                  selectPhotos(event.target.files);
                  event.target.value = "";
                }}
              />
              <div className="post-toolbar" aria-label="Post options">
                <button
                  type="button"
                  aria-label="Add photos"
                  className="text-[#FF5733]"
                  onClick={() => photoInput.current?.click()}
                >
                  <ImagePlus size={21} />
                </button>
                <button
                  type="button"
                  aria-label="Take a photo or choose a camera image"
                  onClick={() => cameraInput.current?.click()}
                >
                  <Camera size={21} />
                </button>
                <button
                  type="button"
                  aria-label="Check in"
                  className="text-[#00D3DF]"
                  onClick={() => openScreen("location")}
                >
                  <MapPin size={22} />
                </button>
                <button
                  type="button"
                  aria-label="Tag friends"
                  onClick={() => openScreen("friends")}
                >
                  <Tag size={21} />
                </button>
              </div>
              <button className="post-submit" type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Uploading / publishing…" : "Post"}
              </button>
            </fieldset>
          </form>
          <div className="post-local-note">
            <p>JPEG or PNG, up to 10 photos and 5 MB per photo.</p>
            <button type="button" disabled={isSubmitting} onClick={requestReset}>
              Discard draft
            </button>
          </div>
          <p role="status" className="mt-4 max-w-[620px] text-sm text-[#2ED3D1]">
            {publisher.error || status}
          </p>
        </>
      ) : (
        <PostDetailsPicker
          key={screen}
          screen={screen}
          locationId={draft.locationId}
          friendIds={draft.friendIds}
          onLocation={(id) => {
            draftId.current = null;
            setValue("locationId", id);
            openScreen("compose");
          }}
          onFriend={(id) => {
            draftId.current = null;
            setValue("friendIds", togglePostFriend(draft.friendIds, id));
          }}
        />
      )}
      {confirmationProps && <ConfirmationDialog {...confirmationProps} />}
    </div>
  );
}
