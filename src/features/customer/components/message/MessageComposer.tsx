import { zodResolver } from "@hookform/resolvers/zod";
import { Image, Paperclip, Send } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";

import { FileUpload } from "@/components/forms/FileUpload/FileUpload";
import { FileUploadItem } from "@/components/forms/FileUpload/FileUploadItem";
import type { FileUploadItemValue } from "@/components/forms/FileUpload/file-upload.types";
import { FormField } from "@/components/forms/FormField";
import { Modal } from "@/components/overlays/Modal/Modal";
import { Button } from "@/components/ui/Button";
import {
  messagePreviewSchema,
  type MessagePreviewValues,
} from "@/features/customer/schemas/message.schema";
import {
  DEFAULT_MAX_FILE_SIZE_BYTES,
  SAFE_PREVIEW_MIME_TYPES,
} from "@/utils/files/file.constants";
import { formatFileSize } from "@/utils/files/formatFileSize";

function MessageAttachmentDialog({
  imagesOnly,
  value,
  onApply,
  onClose,
}: {
  imagesOnly: boolean;
  value: FileUploadItemValue[];
  onApply: (value: FileUploadItemValue[]) => void;
  onClose: () => void;
}) {
  const [files, setFiles] = useState(value);
  return (
    <Modal isOpen onClose={onClose} titleId="message-attachment-title">
      <div className="space-y-4 overflow-y-auto p-6 pt-12">
        <h2 className="text-xl font-semibold" id="message-attachment-title">
          {imagesOnly ? "Image" : "Attachment"} preview
        </h2>
        <p className="text-sm leading-6 text-[var(--text-muted)]">
          Files remain in this browser tab. Nothing is uploaded or sent. The existing
          preview limit is {formatFileSize(DEFAULT_MAX_FILE_SIZE_BYTES)} per file.
        </p>
        <FileUpload
          allowedMimeTypes={imagesOnly ? SAFE_PREVIEW_MIME_TYPES : undefined}
          multiple
          onChange={setFiles}
          value={files}
        />
        <Button
          disabled={files.some((file) => Boolean(file.error))}
          onClick={() => onApply(files)}
          variant="primary"
        >
          Use files in local preview
        </Button>
      </div>
    </Modal>
  );
}

export function MessageComposer({
  onPreview,
}: {
  onPreview: (body: string, files: File[]) => void;
}) {
  const [files, setFiles] = useState<FileUploadItemValue[]>([]);
  const [attachmentMode, setAttachmentMode] = useState<"file" | "image" | null>(null);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<MessagePreviewValues>({
    resolver: zodResolver(messagePreviewSchema),
    defaultValues: { body: "" },
  });
  return (
    <div className="message-composer-region">
      {files.length > 0 && (
        <ul
          aria-label="Locally attached files"
          className="mb-3 max-h-40 space-y-2 overflow-y-auto"
        >
          {files.map((item) => (
            <FileUploadItem
              item={item}
              key={item.id}
              onRemove={(id) =>
                setFiles((current) => current.filter((file) => file.id !== id))
              }
            />
          ))}
        </ul>
      )}
      <form
        aria-label="Local message preview"
        className="message-composer"
        onSubmit={(event) => {
          void handleSubmit(({ body }) => {
            onPreview(
              body,
              files.map((item) => item.file),
            );
            reset();
            setFiles([]);
          })(event);
        }}
      >
        <button
          aria-label="Attach files locally"
          className="message-icon-button"
          onClick={() => setAttachmentMode("file")}
          type="button"
        >
          <Paperclip aria-hidden="true" size={24} />
        </button>
        <button
          aria-label="Attach images locally"
          className="message-icon-button"
          onClick={() => setAttachmentMode("image")}
          type="button"
        >
          <Image aria-hidden="true" size={24} />
        </button>
        <div className="message-compose-field">
          <FormField
            autoComplete="off"
            error={errors.body?.message}
            label="Message text (local preview only)"
            placeholder="Type your message..."
            {...register("body")}
          />
        </div>
        <Button
          aria-label="Add message to local preview; nothing is sent"
          className="message-send"
          disabled={isSubmitting}
          title="Add to local preview. No message is sent."
          type="submit"
          variant="primary"
        >
          <Send aria-hidden="true" size={24} />
        </Button>
      </form>
      {attachmentMode && (
        <MessageAttachmentDialog
          imagesOnly={attachmentMode === "image"}
          onApply={(value) => {
            setFiles(value);
            setAttachmentMode(null);
          }}
          onClose={() => setAttachmentMode(null)}
          value={files}
        />
      )}
    </div>
  );
}
