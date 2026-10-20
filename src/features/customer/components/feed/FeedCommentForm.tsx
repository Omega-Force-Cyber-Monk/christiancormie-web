import { zodResolver } from "@hookform/resolvers/zod";
import { Send, X } from "lucide-react";
import { useRef, type FormEvent } from "react";
import { useForm } from "react-hook-form";

import { FormError } from "@/components/forms/FormError";
import { FormField } from "@/components/forms/FormField";
import { Button } from "@/components/ui/Button";
import { feedComposerAvatar } from "@/features/customer/data/feed-comments.data";
import {
  feedCommentSchema,
  type FeedCommentValues,
} from "@/features/customer/schemas/feed.schema";

type FeedComposerOptions = {
  draft: string;
  onDraftChange: (text: string) => void;
  inputId: string;
  replyTo?: string;
  onCancelReply: () => void;
};

export function FeedCommentForm({
  onPreview,
  composer,
}: {
  onPreview: (text: string) => void;
  composer?: FeedComposerOptions;
}) {
  const submitting = useRef(false);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FeedCommentValues>({
    resolver: zodResolver(feedCommentSchema),
    defaultValues: { comment: composer?.draft ?? "" },
  });

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting.current) return;
    submitting.current = true;
    try {
      await handleSubmit((values) => {
        onPreview(values.comment);
        reset({ comment: "" });
        composer?.onDraftChange("");
      })(event);
    } finally {
      submitting.current = false;
    }
  }

  if (composer) {
    const field = register("comment");
    return (
      <form
        className="feed-comment-composer"
        onSubmit={(event) => {
          void submit(event);
        }}
      >
        {composer.replyTo && (
          <div className="feed-reply-context">
            <span>Replying to {composer.replyTo}</span>
            <button
              type="button"
              aria-label="Cancel reply"
              onClick={composer.onCancelReply}
            >
              <X aria-hidden="true" size={18} />
            </button>
          </div>
        )}
        <img
          alt="Sample commenter avatar"
          src={feedComposerAvatar}
          className="feed-composer-avatar"
        />
        <div className="min-w-0">
          <div className="feed-comment-input-wrap">
            <label className="sr-only" htmlFor={composer.inputId}>
              {composer.replyTo ? `Reply to ${composer.replyTo}` : "Add a comment"}
            </label>
            <input
              {...field}
              defaultValue={composer.draft}
              id={composer.inputId}
              placeholder={
                composer.replyTo ? `Reply to ${composer.replyTo}…` : "Add a comment..."
              }
              autoComplete="off"
              aria-invalid={Boolean(errors.comment)}
              aria-describedby={
                errors.comment ? `${composer.inputId}-error` : undefined
              }
              onChange={(event) => {
                void field.onChange(event);
                composer.onDraftChange(event.currentTarget.value);
              }}
            />
            <button
              type="submit"
              className="feed-comment-send"
              disabled={isSubmitting}
              aria-label={
                composer.replyTo
                  ? "Add reply to local preview"
                  : "Add comment to local preview"
              }
            >
              <Send aria-hidden="true" size={20} />
            </button>
          </div>
          <FormError
            id={`${composer.inputId}-error`}
            message={errors.comment?.message}
          />
        </div>
      </form>
    );
  }

  return (
    <form
      className="mt-4 space-y-3"
      onSubmit={(event) => {
        void submit(event);
      }}
    >
      <FormField
        error={errors.comment?.message}
        label="Local preview comment"
        placeholder="Write a comment to preview…"
        {...register("comment")}
      />
      <Button disabled={isSubmitting} type="submit" variant="primary">
        Add to local preview
      </Button>
      <p className="text-xs leading-5 text-[#B8C1D1]">
        Comments stay on this page and are never sent or published.
      </p>
    </form>
  );
}
