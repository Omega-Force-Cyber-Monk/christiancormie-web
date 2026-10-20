import { X } from "lucide-react";
import { FilePreview } from "@/components/forms/FileUpload/FilePreview";
import type { PostMedia } from "@/features/customer/data/create-post.data";

export function PostMediaPreview({
  media,
  onRemove,
}: {
  media: PostMedia;
  onRemove?: () => void;
}) {
  return (
    <div className="post-media-preview">
      {media.kind === "sample" ? (
        <img src={media.src} alt={media.name} />
      ) : (
        <FilePreview file={media.file} />
      )}
      {onRemove && (
        <button type="button" onClick={onRemove} aria-label={`Remove ${media.name}`}>
          <X size={17} aria-hidden="true" />
        </button>
      )}
      <span className="sr-only">{media.name}</span>
    </div>
  );
}
