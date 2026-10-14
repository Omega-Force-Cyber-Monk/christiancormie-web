import { useEffect, useRef } from "react";

import { SAFE_PREVIEW_MIME_TYPES } from "@/utils/files/file.constants";

type FilePreviewProps = {
  file: File;
};

export function FilePreview({ file }: FilePreviewProps) {
  const imageRef = useRef<HTMLImageElement>(null);
  const canPreview = SAFE_PREVIEW_MIME_TYPES.some((type) => type === file.type);
  useEffect(() => {
    const image = imageRef.current;
    if (!canPreview || !image) return;
    const url = URL.createObjectURL(file);
    image.src = url;
    return () => {
      image.removeAttribute("src");
      URL.revokeObjectURL(url);
    };
  }, [file, canPreview]);

  if (!canPreview) {
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
      ref={imageRef}
      width={48}
    />
  );
}
