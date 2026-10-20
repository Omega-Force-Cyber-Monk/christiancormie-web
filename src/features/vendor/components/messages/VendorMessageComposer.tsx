import { Image, Paperclip, Send } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { FileUploadItem } from "@/components/forms/FileUpload/FileUploadItem";
import { FormError } from "@/components/forms/FormError";
import type { FileUploadItemValue } from "@/components/forms/FileUpload/file-upload.types";
import { VendorMessageFilesDialog } from "@/features/vendor/components/messages/VendorMessageFilesDialog";
import type { VendorChatDraft } from "@/features/vendor/types/messages.types";
import {
  messageFileOptions,
  validateVendorMessage,
  vendorMessageTextSchema,
} from "@/features/vendor/utils/messagesState";
import { validateFile } from "@/utils/files/validateFile";
export function VendorMessageComposer({
  draft,
  onText,
  onFiles,
  onSend,
}: {
  draft: VendorChatDraft;
  onText: (text: string) => void;
  onFiles: (files: FileUploadItemValue[]) => void;
  onSend: (id: string, text: string, files: FileUploadItemValue[]) => void;
}) {
  const id = useId();
  const imagePicker = useRef<HTMLInputElement>(null);
  const [dialogFiles, setDialogFiles] = useState<FileUploadItemValue[] | null>(null);
  const pending = useRef(false);
  const submissionId = useRef<string | null>(null);
  const {
    register,
    handleSubmit,
    subscribe,
    reset,
    setError,
    clearErrors,
    formState: { errors, isSubmitting },
  } = useForm<{ text: string }>({
    resolver: zodResolver(vendorMessageTextSchema),
    defaultValues: { text: draft.text },
  });
  useEffect(
    () =>
      subscribe({
        formState: { values: true },
        callback: ({ values }) => onText(values.text),
      }),
    [subscribe, onText],
  );
  const textField = register("text");
  return (
    <footer className="vendor-message-composer">
      <form
        noValidate
        onSubmit={(event) => {
          event.preventDefault();
          if (pending.current) return;
          pending.current = true;
          void handleSubmit((values) => {
            const error = validateVendorMessage(values.text, draft.files);
            if (error) {
              setError("text", { message: error });
              return;
            }
            submissionId.current ??= crypto.randomUUID();
            onSend(submissionId.current, values.text, draft.files);
            reset({ text: "" });
          })(event).finally(() => {
            pending.current = false;
          });
        }}
      >
        {draft.files.length > 0 && (
          <ul
            className="mb-3 max-h-40 space-y-2 overflow-y-auto"
            aria-label="Draft attachments"
          >
            {draft.files.map((item) => (
              <FileUploadItem
                key={item.id}
                item={item}
                onRemove={(fileId) => {
                  submissionId.current = null;
                  onFiles(draft.files.filter((file) => file.id !== fileId));
                  clearErrors("text");
                }}
              />
            ))}
          </ul>
        )}
        <div className="vendor-message-compose-bar">
          <button
            type="button"
            className="vendor-message-compose-icon"
            aria-label="Attach files"
            onClick={() => setDialogFiles([...draft.files])}
          >
            <Paperclip size={24} />
          </button>
          <button
            type="button"
            className="vendor-message-compose-icon"
            aria-label="Attach images"
            onClick={() => imagePicker.current?.click()}
          >
            <Image size={23} />
          </button>
          <input
            ref={imagePicker}
            tabIndex={-1}
            className="sr-only"
            type="file"
            accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
            multiple
            aria-label="Choose message images"
            onChange={(event) => {
              const files = Array.from(event.target.files ?? []).map((file) => ({
                id: crypto.randomUUID(),
                file,
                error: validateFile(file, messageFileOptions) ?? undefined,
              }));
              if (files.length) setDialogFiles([...draft.files, ...files]);
              event.target.value = "";
            }}
          />
          <label className="sr-only" htmlFor={`${id}-text`}>
            Type your message
          </label>
          <textarea
            id={`${id}-text`}
            className="vendor-message-input"
            rows={1}
            placeholder="Type your message..."
            defaultValue={draft.text}
            {...textField}
            onChange={(event) => {
              submissionId.current = null;
              void textField.onChange(event);
            }}
            aria-invalid={!!errors.text}
            aria-describedby={`${id}-hint${errors.text ? ` ${id}-error` : ""}`}
            onKeyDown={(event) => {
              if (
                event.key === "Enter" &&
                !event.shiftKey &&
                !event.nativeEvent.isComposing
              ) {
                event.preventDefault();
                event.currentTarget.form?.requestSubmit();
              }
            }}
          />
          <button
            className="vendor-message-send"
            type="submit"
            disabled={isSubmitting}
            aria-label="Send message locally"
          >
            <Send size={24} />
          </button>
        </div>
        <span id={`${id}-hint`} className="sr-only">
          Enter saves locally. Shift plus Enter adds a new line. Messages are not
          delivered.
        </span>
        <FormError id={`${id}-error`} message={errors.text?.message} />
      </form>
      {dialogFiles && (
        <VendorMessageFilesDialog
          initialFiles={dialogFiles}
          onClose={() => setDialogFiles(null)}
          onApply={(files) => {
            submissionId.current = null;
            onFiles(files);
            clearErrors("text");
            setDialogFiles(null);
          }}
        />
      )}
    </footer>
  );
}
