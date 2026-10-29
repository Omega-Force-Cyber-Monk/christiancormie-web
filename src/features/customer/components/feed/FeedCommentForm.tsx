import { zodResolver } from "@hookform/resolvers/zod";
import { Send, X } from "lucide-react";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { useForm } from "react-hook-form";

import { FormError } from "@/components/forms/FormError";
import { FormField } from "@/components/forms/FormField";
import { Button } from "@/components/ui/Button";
import { normalizeApiError } from "@/utils/errors/normalizeApiError";
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
  avatar = "",
}: {
  onPreview: (text: string) => void | boolean | Promise<boolean>;
  avatar?: string;
  composer?: FeedComposerOptions;
}) {
  const submitting = useRef(false);
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);
  const [submitError, setSubmitError] = useState("");
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
      await handleSubmit(async (values) => {
        if ((await onPreview(values.comment)) === false) return;
        if (!mounted.current) return;
        reset({ comment: "" });
        composer?.onDraftChange("");
      })(event);
    } catch (error) {
      setSubmitError(normalizeApiError(error).message);
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
        <img alt="" src={avatar || undefined} className="feed-composer-avatar" />
        <div className="min-w-0">
          <div className="feed-comment-input-wrap">
            <label className="sr-only" htmlFor={composer.inputId}>
              {composer.replyTo ? `Reply to ${composer.replyTo}` : "Add a comment"}
            </label>
            <input
              disabled={isSubmitting}
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
              aria-label={composer.replyTo ? "Post reply" : "Post comment"}
            >
              <Send aria-hidden="true" size={20} />
            </button>
          </div>
          <FormError
            id={`${composer.inputId}-error`}
            message={errors.comment?.message || submitError}
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
        label="Comment"
        placeholder="Write a comment…"
        {...register("comment")}
      />
      <Button disabled={isSubmitting} type="submit" variant="primary">
        Post comment
      </Button>
      <p className="text-xs leading-5 text-[#B8C1D1]">
        Comments are submitted after confirmation.
      </p>
    </form>
  );
}
