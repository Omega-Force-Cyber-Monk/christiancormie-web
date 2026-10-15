import { useState } from "react";

import { FormField } from "@/components/forms/FormField";
import { Modal } from "@/components/overlays/Modal/Modal";
import { Button } from "@/components/ui/Button";
import { ROUTES } from "@/constants/routes";
import type { FeedPost } from "@/features/customer/data/feed.data";

export function FeedShareDialog({
  post,
  onClose,
  basePath = ROUTES.CUSTOMER_FEED,
}: {
  post: Pick<FeedPost, "id" | "author">;
  onClose: () => void;
  basePath?: string;
}) {
  const [status, setStatus] = useState<"idle" | "copying" | "copied" | "error">("idle");
  const url = `${window.location.origin}${basePath}#${post.id}`;

  async function copyLink() {
    setStatus("copying");
    try {
      await navigator.clipboard.writeText(url);
      setStatus("copied");
    } catch {
      setStatus("error");
    }
  }

  return (
    <Modal
      descriptionId="feed-share-description"
      isOpen
      onClose={onClose}
      titleId="feed-share-title"
    >
      <div className="space-y-4 overflow-y-auto p-6 pt-12">
        <h2 className="text-xl font-semibold" id="feed-share-title">
          Share sample post
        </h2>
        <p
          className="text-sm leading-6 text-[var(--text-muted)]"
          id="feed-share-description"
        >
          Copy a link to this static {post.author} post. No message is sent.
        </p>
        <FormField
          error={
            status === "error"
              ? "Copy is unavailable. Select the link and copy it manually."
              : undefined
          }
          label="Post link"
          onFocus={(event) => event.currentTarget.select()}
          readOnly
          value={url}
        />
        <Button
          disabled={status === "copying"}
          onClick={() => {
            void copyLink();
          }}
          variant="primary"
        >
          {status === "copying" ? "Copying…" : "Copy link"}
        </Button>
        <p aria-live="polite" className="text-sm text-[#2ED3D1]" role="status">
          {status === "copied" ? "Link copied." : ""}
        </p>
      </div>
    </Modal>
  );
}
