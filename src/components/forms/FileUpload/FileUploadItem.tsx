import { Trash2 } from "lucide-react";

import { FilePreview } from "@/components/forms/FileUpload/FilePreview";
import type { FileUploadItemValue } from "@/components/forms/FileUpload/file-upload.types";
import { formatFileSize } from "@/utils/files/formatFileSize";

type FileUploadItemProps = {
  item: FileUploadItemValue;
  onRemove: (id: string) => void;
  disabled?: boolean;
};

export function FileUploadItem({
  item,
  onRemove,
  disabled = false,
}: FileUploadItemProps) {
  return (
    <li className="flex items-center gap-3 rounded-md border border-[var(--border)] p-3">
      <FilePreview file={item.file} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{item.file.name}</p>
        <p className="text-xs text-[var(--text-muted)]">
          {formatFileSize(item.file.size)}
        </p>
        {item.error ? (
          <p className="mt-1 text-xs text-[var(--danger)]" role="alert">
            {item.error}
          </p>
        ) : null}
      </div>
      <button
        aria-label={`Remove ${item.file.name}`}
        disabled={disabled}
        className="rounded-md p-2 text-[var(--text-muted)] hover:bg-[var(--surface-muted)] hover:text-[var(--danger)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
        onClick={() => onRemove(item.id)}
        type="button"
      >
        <Trash2 size={18} />
      </button>
    </li>
  );
}
