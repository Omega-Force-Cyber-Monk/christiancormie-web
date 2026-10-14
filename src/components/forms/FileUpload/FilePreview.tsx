import { useEffect, useMemo } from "react";

import { SAFE_PREVIEW_MIME_TYPES } from "@/utils/files/file.constants";

type FilePreviewProps = {
  file: File;
};

export function FilePreview({ file }: FilePreviewProps) {
  const previewUrl = useMemo(() => {
    if (!SAFE_PREVIEW_MIME_TYPES.includes(file.type as never)) return null;

    return URL.createObjectURL(file);
  }, [file]);

  useEffect(() => {
    if (!previewUrl) return undefined;

    return () => URL.revokeObjectURL(previewUrl);
  }, [previewUrl]);

  if (!previewUrl) {
    return (
      <div className="grid size-12 place-items-center rounded-md bg-[var(--surface-muted)] text-xs text-[var(--text-muted)]">
        File
      </div>
    );
  }

  return (
    <img
      alt=""
      className="size-12 rounded-md object-cover"
      height={48}
      src={previewUrl}
      width={48}
    />
  );
}
