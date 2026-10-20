import { zodResolver } from "@hookform/resolvers/zod";
import { ImagePlus, Send, X } from "lucide-react";
import { useRef, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { FilePreview } from "@/components/forms/FileUpload/FilePreview";
import { FormError } from "@/components/forms/FormError";
import {
  settingsMessageSchema,
  type SettingsMessageValues,
} from "@/features/customer/schemas/settings.schema";
import type { SupportTicket } from "@/features/customer/data/settings.data";
import { validateSettingsPhoto } from "@/features/customer/utils/settingsState";

export function SettingsSupportList({
  tickets,
  onSelect,
}: {
  tickets: SupportTicket[];
  onSelect: (id: string) => void;
}) {
  return (
    <section className="settings-support-list" aria-label="Sample support tickets">
      {tickets.map((ticket) => (
        <button
          type="button"
          key={ticket.id}
          className="settings-ticket"
          aria-haspopup="dialog"
          onClick={() => onSelect(ticket.id)}
        >
          <span
            className={`settings-ticket-status settings-ticket-status--${ticket.status.toLowerCase()}`}
          >
            {ticket.status}
          </span>
          <span className="block text-xs leading-[18px] text-[#B8C1D1]">
            {ticket.id}
          </span>
          <span className="mt-1 block text-lg leading-7">{ticket.subject}</span>
          <span className="mt-4 block text-sm leading-5 text-[#B8C1D1]">
            {ticket.message}
          </span>
          <span className="mt-4 flex flex-wrap justify-between gap-2 border-t border-[#2B3446] pt-4 text-sm">
            <span className="text-[#B8C1D1]">{ticket.date}</span>
            <span className="font-semibold text-[#FF5733]">{ticket.age}</span>
          </span>
        </button>
      ))}
    </section>
  );
}

export function SettingsConversation({
  ticket,
  draft,
  onDraft,
  onSend,
}: {
  ticket: SupportTicket;
  draft: SettingsMessageValues;
  onDraft: (values: SettingsMessageValues) => void;
  onSend: (values: SettingsMessageValues) => void;
}) {
  const pending = useRef(false);
  const input = useRef<HTMLInputElement>(null);
  const end = useRef<HTMLDivElement>(null);
  const [fileError, setFileError] = useState("");
  const {
    control,
    register,
    handleSubmit,
    setValue,
    getValues,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<SettingsMessageValues>({
    resolver: zodResolver(settingsMessageSchema),
    defaultValues: draft,
  });
  const textField = register("text");
  const attachment = useWatch({ control, name: "attachment" });
  function changeAttachment(file: File | null) {
    const error = file ? validateSettingsPhoto(file) : null;
    setFileError(error ?? "");
    if (error) return;
    setValue("attachment", file, { shouldValidate: true });
    onDraft({ ...getValues(), attachment: file });
  }
  return (
    <>
      <p className="-mt-2 mb-3 text-xs text-[#B8C1D1]">
        {ticket.id} · Sample conversation. New messages stay local.
      </p>
      <div
        className="settings-chat-messages"
        role="log"
        aria-label={`Conversation for ${ticket.subject}`}
        aria-live="polite"
      >
        {ticket.messages.map((message) => (
          <div
            className={`settings-chat-bubble settings-chat-bubble--${message.sender}`}
            key={message.id}
          >
            <span className="sr-only">
              {message.sender === "you" ? "You" : "Support Team"}:{" "}
            </span>
            <p className="break-words whitespace-pre-wrap">{message.text}</p>
            {message.attachment && (
              <div className="settings-attachment mt-2">
                <FilePreview file={message.attachment} />
                <span className="block text-xs">{message.attachment.name}</span>
              </div>
            )}
            <p className="mt-2 text-sm">{message.time}</p>
          </div>
        ))}
        <div ref={end} />
      </div>
      <form
        noValidate
        className="mt-5 border-t border-[#343C4C] pt-5"
        onSubmit={(event) => {
          event.preventDefault();
          if (pending.current) return;
          pending.current = true;
          void handleSubmit((values) => {
            onSend(values);
            const cleared = { text: "", attachment: null };
            reset(cleared);
            onDraft(cleared);
            setFileError("");
            requestAnimationFrame(() =>
              end.current?.scrollIntoView({ block: "nearest" }),
            );
          })(event).finally(() => {
            pending.current = false;
          });
        }}
      >
        {attachment && (
          <div className="settings-attachment mb-3 flex items-center gap-3">
            <FilePreview file={attachment} />
            <span className="min-w-0 flex-1 truncate text-xs">{attachment.name}</span>
            <button
              type="button"
              aria-label="Remove message photo"
              onClick={() => changeAttachment(null)}
            >
              <X size={18} />
            </button>
          </div>
        )}
        <input
          type="file"
          ref={input}
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={(event) => {
            if (event.target.files?.[0]) changeAttachment(event.target.files[0]);
            event.target.value = "";
          }}
        />
        <div className="flex items-center gap-3">
          <button
            type="button"
            aria-label="Attach a photo"
            className="settings-chat-attach"
            onClick={() => input.current?.click()}
          >
            <ImagePlus size={20} />
          </button>
          <label className="sr-only" htmlFor="settings-chat-text">
            Message to support
          </label>
          <input
            {...textField}
            id="settings-chat-text"
            placeholder="Type a message..."
            className="settings-chat-input"
            aria-invalid={Boolean(errors.text)}
            aria-describedby={errors.text ? "settings-chat-error" : undefined}
            onChange={(event) => {
              void textField.onChange(event);
              onDraft({ ...getValues(), text: event.target.value });
            }}
          />
          <button
            type="submit"
            className="settings-chat-send"
            aria-label="Add message to local preview"
            disabled={isSubmitting}
          >
            <Send size={20} />
          </button>
        </div>
        <FormError id="settings-chat-error" message={errors.text?.message} />
        <FormError message={fileError} />
      </form>
    </>
  );
}
