import { zodResolver } from "@hookform/resolvers/zod";
import { Image, Paperclip, Send } from "lucide-react";
import { useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { FormField } from "@/components/forms/FormField";
import { composerSchema } from "../schemas/messaging.schema";
import { UnsupportedMessaging } from "./MessageControls";
export type TextComposerProps = {
  text: string;
  onText: (text: string) => void;
  onSend: () => Promise<void>;
  pending: boolean;
  disabled: boolean;
};
export function TextComposer({
  text,
  onText,
  onSend,
  pending,
  disabled,
  vendor = false,
}: TextComposerProps & { vendor?: boolean }) {
  const [unsupported, setUnsupported] = useState(false);
  const lock = useRef(false);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<{ content: string }>({
    resolver: zodResolver(composerSchema),
    values: { content: text },
  });
  const field = register("content");
  const bar = vendor ? "vendor-message-compose-bar" : "message-composer";
  const icon = vendor ? "vendor-message-compose-icon" : "message-icon-button";
  return (
    <div className={vendor ? "vendor-message-composer" : "message-composer-region"}>
      <form
        aria-label="Send text message"
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          if (lock.current || disabled || pending) return;
          lock.current = true;
          void handleSubmit(onSend)(e).finally(() => {
            lock.current = false;
          });
        }}
      >
        <div className={bar}>
          <button
            type="button"
            className={icon}
            aria-label="Attachment uploads unavailable"
            onClick={() => setUnsupported(true)}
          >
            <Paperclip size={24} />
          </button>
          <button
            type="button"
            className={icon}
            aria-label="Image uploads unavailable"
            onClick={() => setUnsupported(true)}
          >
            <Image size={24} />
          </button>
          <div className={vendor ? "min-w-0 flex-1" : "message-compose-field"}>
            {vendor ? (
              <textarea
                {...field}
                defaultValue={text}
                aria-label="Message text"
                aria-invalid={Boolean(errors.content)}
                aria-describedby={errors.content ? "message-text-error" : undefined}
                className="vendor-message-input"
                rows={1}
                placeholder="Type your message..."
                disabled={disabled}
                onChange={(e) => {
                  void field.onChange(e);
                  onText(e.target.value);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
                    e.preventDefault();
                    e.currentTarget.form?.requestSubmit();
                  }
                }}
              />
            ) : (
              <FormField
                {...field}
                defaultValue={text}
                label="Message text"
                placeholder="Type your message..."
                disabled={disabled}
                error={errors.content?.message}
                autoComplete="off"
                onChange={(e) => {
                  void field.onChange(e);
                  onText(e.target.value);
                }}
              />
            )}
          </div>
          <button
            type="submit"
            className={vendor ? "vendor-message-send" : "message-send"}
            aria-label="Send message"
            disabled={disabled || pending || isSubmitting}
          >
            <Send size={24} />
          </button>
        </div>
        {vendor && errors.content && (
          <p role="alert" id="message-text-error">
            {errors.content.message}
          </p>
        )}
        {vendor && (
          <p className="sr-only">Enter sends. Shift plus Enter adds a new line.</p>
        )}
        {disabled && (
          <p className="px-3 text-xs">
            Sending is unavailable for this conversation state.
          </p>
        )}
      </form>
      {unsupported && <UnsupportedMessaging onClose={() => setUnsupported(false)} />}
    </div>
  );
}
