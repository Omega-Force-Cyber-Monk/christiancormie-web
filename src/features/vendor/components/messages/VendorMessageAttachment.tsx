import { Download, FileText } from "lucide-react";
import { useEffect, useRef } from "react";
import { FilePreview } from "@/components/forms/FileUpload/FilePreview";
import type { VendorChatAttachment } from "@/features/vendor/types/messages.types";
export function VendorMessageAttachment({
  attachment,
}: {
  attachment: VendorChatAttachment;
}) {
  const link = useRef<HTMLAnchorElement>(null);
  const localFile = "file" in attachment ? attachment.file : undefined;
  useEffect(() => {
    const element = link.current;
    if (!localFile || !element) return;
    const url = URL.createObjectURL(localFile);
    element.href = url;
    return () => {
      element.removeAttribute("href");
      URL.revokeObjectURL(url);
    };
  }, [localFile]);
  return (
    <li className="vendor-message-attachment">
      {localFile ? (
        <FilePreview file={localFile} />
      ) : (
        <span className="vendor-message-file-icon">
          <FileText size={20} />
        </span>
      )}
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm" title={attachment.name}>
          {attachment.name}
        </span>
        <span className="block text-xs opacity-75">
          {attachment.size}
          {!localFile && <span className="sr-only">, design sample size</span>}
        </span>
      </span>
      <a
        ref={link}
        className="grid size-10 shrink-0 place-items-center rounded-lg hover:bg-white/10"
        href={"sampleUrl" in attachment ? attachment.sampleUrl : undefined}
        download={localFile ? attachment.name : `Sample - ${attachment.name}`}
        aria-label={`Download ${localFile ? "" : "sample placeholder "}${attachment.name}`}
        title={
          localFile ? "Download your local file" : "Download labeled sample placeholder"
        }
      >
        <Download size={18} />
      </a>
    </li>
  );
}
