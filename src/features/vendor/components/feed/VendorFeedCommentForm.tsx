import { zodResolver } from "@hookform/resolvers/zod";
import { Send, X } from "lucide-react";
import { useEffect, useId, useRef } from "react";
import { useForm } from "react-hook-form";
import { FormError } from "@/components/forms/FormError";
import avatar from "@/features/vendor/assets/feed/Comments-composer-avatar.webp";
import { vendorFeedTextSchema } from "@/features/vendor/utils/feedState";

export function VendorFeedCommentForm({
  text,
  replyingTo,
  onText,
  onCancelReply,
  onSubmit,
}: {
  text: string;
  replyingTo: { id: string; author: string } | null;
  onText: (text: string) => void;
  onCancelReply: () => void;
  onSubmit: (text: string) => void;
}) {
  const id = useId();
  const pending = useRef(false);
  const {
    register,
    setFocus,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<{ text: string }>({
    resolver: zodResolver(vendorFeedTextSchema),
    defaultValues: { text },
  });
  const field = register("text");
  const replyId = replyingTo?.id;
  useEffect(() => {
    if (replyId) setFocus("text");
  }, [replyId, setFocus]);
  return (
    <form
      className="vendor-feed-comment-form"
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        if (pending.current) return;
        pending.current = true;
        void handleSubmit((values) => {
          onSubmit(values.text);
          reset({ text: "" });
        })(event).finally(() => {
          pending.current = false;
        });
      }}
    >
      {replyingTo && (
        <p className="mb-2 flex items-center gap-2 text-xs text-[#B8C1D1]">
          Replying to {replyingTo.author}
          <button
            type="button"
            aria-label="Cancel reply"
            className="grid size-8 place-items-center"
            onClick={onCancelReply}
          >
            <X size={16} />
          </button>
        </p>
      )}
      <div className="flex items-center gap-2">
        <img className="vendor-feed-comment-composer-avatar" src={avatar} alt="" />
        <div className="vendor-feed-comment-input">
          <label htmlFor={id} className="sr-only">
            {replyingTo ? `Reply to ${replyingTo.author}` : "Add a comment"}
          </label>
          <input
            {...field}
            defaultValue={text}
            id={id}
            placeholder={replyingTo ? "Add a reply..." : "Add a comment..."}
            aria-invalid={Boolean(errors.text)}
            aria-describedby={errors.text ? `${id}-error` : undefined}
            onChange={(event) => {
              void field.onChange(event);
              onText(event.target.value);
            }}
          />
          <button
            type="submit"
            aria-label={replyingTo ? "Save local reply" : "Save local comment"}
            disabled={isSubmitting}
          >
            <Send size={18} />
          </button>
        </div>
      </div>
      <FormError id={`${id}-error`} message={errors.text?.message} />
    </form>
  );
}
