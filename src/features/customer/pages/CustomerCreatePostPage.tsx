import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Camera, ImagePlus, MapPin, Tag, X } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { ConfirmationDialog } from "@/components/overlays/ConfirmationDialog/ConfirmationDialog";
import { useConfirmation } from "@/components/overlays/ConfirmationDialog/useConfirmation";
import { PostDetailsPicker } from "@/features/customer/components/create-post/PostDetailsPicker";
import { PostMediaPreview } from "@/features/customer/components/create-post/PostMediaPreview";
import {
  checkInLocations,
  tagFriends,
  emptyPostDraft,
  samplePostDraft,
  type PostDraft,
} from "@/features/customer/data/create-post.data";
import { createPostSchema } from "@/features/customer/schemas/create-post.schema";
import {
  addPostPhotos,
  removePostPhoto,
  togglePostFriend,
  submitLocalPost,
  type LocalPost,
} from "@/features/customer/utils/createPost";
import "@/features/customer/components/create-post/create-post.css";

export default function CustomerCreatePostPage() {
  const [screen, setScreen] = useState<"compose" | "location" | "friends">("compose");
  const [mediaErrors, setMediaErrors] = useState<string[]>([]);
  const [posts, setPosts] = useState<LocalPost[]>([]);
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
    defaultValues: samplePostDraft(),
  });
  const [text, media, locationId, friendIds] = useWatch({
    control,
    name: ["text", "media", "locationId", "friendIds"],
  });
  const draft: PostDraft = { text, media, locationId, friendIds };
  const textField = register("text");
  const location = checkInLocations.find((item) => item.id === draft.locationId);
  const friends = tagFriends.filter((item) => draft.friendIds.includes(item.id));

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
              void handleSubmit((values) => {
                const id = draftId.current ?? crypto.randomUUID();
                draftId.current = id;
                setPosts((current) => submitLocalPost(current, values, id));
                reset(emptyPostDraft());
                setMediaErrors([]);
                setStatus(
                  "Post added to the local preview below. Nothing was published online.",
                );
              })(event).finally(() => {
                busy.current = false;
              });
            }}
          >
            <div className="flex items-start gap-3">
              <span className="post-avatar">AR</span>
              <div className="min-w-0">
                <p className="text-base font-semibold">
                  Alex Rivera{" "}
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
              accept="image/jpeg,image/png,image/webp"
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
              accept="image/jpeg,image/png,image/webp"
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
              {isSubmitting ? "Adding locally…" : "Post"}
            </button>
          </form>
          <div className="post-local-note">
            <p>
              Sample draft · local preview only. JPEG, PNG or WebP, up to 5 MB per
              photo.
            </p>
            <button type="button" onClick={requestReset}>
              Discard draft
            </button>
          </div>
          <p role="status" className="mt-4 max-w-[620px] text-sm text-[#2ED3D1]">
            {status}
          </p>
          {posts.length > 0 && (
            <section
              aria-label="Locally created posts"
              className="mt-6 max-w-[620px] space-y-4"
            >
              <h2 className="text-lg font-semibold">Local posts</h2>
              {posts.map((post) => (
                <article key={post.id} className="rounded-2xl bg-[#121826] p-6">
                  <h3 className="font-semibold">
                    Alex Rivera{" "}
                    <span className="text-xs font-normal text-[#B8C1D1]">
                      · Local preview
                    </span>
                  </h3>
                  <p className="mt-2 text-sm text-[#B8C1D1]">
                    {checkInLocations.find((item) => item.id === post.locationId)?.name}
                    {post.friendIds.length > 0
                      ? ` · With ${tagFriends
                          .filter((friend) => post.friendIds.includes(friend.id))
                          .map((friend) => friend.name)
                          .join(", ")}`
                      : ""}
                  </p>
                  <p className="mt-3 break-words whitespace-pre-wrap">{post.text}</p>
                  <div className="post-media-list mt-6">
                    {post.media.map((media) => (
                      <PostMediaPreview key={media.id} media={media} />
                    ))}
                  </div>
                </article>
              ))}
            </section>
          )}
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
