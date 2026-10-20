import { useState } from "react";
import { FileUpload } from "@/components/forms/FileUpload/FileUpload";
import type { FileUploadItemValue } from "@/components/forms/FileUpload/file-upload.types";
import { FormError } from "@/components/forms/FormError";
import { VendorHomeDialog } from "@/features/vendor/components/home/VendorHomeDialog";
import { messageFileOptions } from "@/features/vendor/utils/messagesState";
import { validateFile } from "@/utils/files/validateFile";
export function VendorMessageFilesDialog({
  initialFiles,
  onClose,
  onApply,
}: {
  initialFiles: FileUploadItemValue[];
  onClose: () => void;
  onApply: (files: FileUploadItemValue[]) => void;
}) {
  const [files, setFiles] = useState(initialFiles);
  const [error, setError] = useState<string>();
  return (
    <VendorHomeDialog title="Local message attachments" onClose={onClose}>
      <p className="mb-4 text-sm leading-6 text-[#B8C1D1]">
        Choose JPG, PNG, WebP or PDF files, up to 5 MB each. Images can be previewed
        here. Nothing is uploaded.
      </p>
      <FileUpload
        multiple
        value={files}
        onChange={(next) => {
          setFiles(next);
          setError(undefined);
        }}
        {...messageFileOptions}
      />
      <FormError message={error} />
      <div className="mt-5 flex justify-end gap-3">
        <button type="button" className="vendor-message-secondary" onClick={onClose}>
          Cancel
        </button>
        <button
          type="button"
          className="vendor-message-primary"
          onClick={() => {
            const invalid = files.find((item) =>
              validateFile(item.file, messageFileOptions),
            );
            if (invalid) {
              setError("Remove unsupported or oversized files before attaching.");
              return;
            }
            onApply(files);
          }}
        >
          Attach locally
        </button>
      </div>
    </VendorHomeDialog>
  );
}
