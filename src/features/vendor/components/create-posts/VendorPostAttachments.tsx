import { Upload } from "lucide-react";
import { useId, useState } from "react";
import { FileDropzone } from "@/components/forms/FileUpload/FileDropzone";
import { FileUploadItem } from "@/components/forms/FileUpload/FileUploadItem";
import { FormError } from "@/components/forms/FormError";
import type { FileUploadItemValue } from "@/components/forms/FileUpload/file-upload.types";
import { appendPostFiles } from "@/features/vendor/utils/createPostsState";

export function VendorPostAttachments({
  files,
  onChange,
  recommended = false,
  integrated = false,
  disabled = false,
}: {
  files: FileUploadItemValue[];
  onChange: (items: FileUploadItemValue[]) => void;
  recommended?: boolean;
  integrated?: boolean;
  disabled?: boolean;
}) {
  const [error, setError] = useState<string>();
  const id = useId();
  return (
    <div
      className="vendor-post-attachments"
      role="group"
      aria-labelledby={`${id}-label`}
      aria-describedby={`${id}-hint`}
    >
      <p id={`${id}-label`} className="mb-2 text-sm font-medium">
        Photos / fliers{" "}
        <span className="font-normal text-[#B8C1D1]">
          ({recommended ? "recommended" : "optional"}, max 5)
        </span>
      </p>
      <FileDropzone
        disabled={disabled}
        multiple
        accept="image/jpeg,image/png,application/pdf,.jpg,.jpeg,.png,.pdf"
        onFilesSelected={(selected) => {
          const result = appendPostFiles(files, selected);
          setError(result.error);
          if (!result.error) onChange(result.files);
        }}
      >
        <span
          aria-hidden="true"
          className="mb-2 grid size-12 place-items-center bg-[#FF5733]/10 text-[#FF5733]"
        >
          <Upload size={24} />
        </span>
        <span className="font-semibold text-[#FAFAFA]">Tap to upload</span>
        <span className="mt-2 text-xs">JPG, PNG, or PDF</span>
      </FileDropzone>
      <p id={`${id}-hint`} className="mt-2 text-xs text-[#B8C1D1]">
        {integrated
          ? "Up to 10 MB per file. Selected files upload before publication."
          : "Local preview only. Up to 10 MB per file; nothing is uploaded."}
      </p>
      <FormError message={error} />
      {files.length > 0 && (
        <ul className="mt-3 space-y-2">
          {files.map((item) => (
            <FileUploadItem
              disabled={disabled}
              key={item.id}
              item={item}
              onRemove={(id) => {
                setError(undefined);
                onChange(files.filter((file) => file.id !== id));
              }}
            />
          ))}
        </ul>
      )}
    </div>
  );
}
