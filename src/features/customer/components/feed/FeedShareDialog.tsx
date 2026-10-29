import { useState } from "react";
import { Modal } from "@/components/overlays/Modal/Modal";
import { FormField } from "@/components/forms/FormField";
import { Button } from "@/components/ui/Button";
import { useSocialPostActionMutation } from "@/features/social/api/socialFeed.api";
import { shareSchema } from "@/features/social/schemas/socialFeed.schema";
import type { SocialCard } from "@/features/social/utils/feedAdapters";
import { normalizeApiError } from "@/utils/errors/normalizeApiError";
export function FeedShareDialog({
  post,
  onClose,
  basePath,
}: {
  post: Pick<SocialCard, "id" | "author">;
  onClose: () => void;
  basePath?: string;
}) {
  const [copied, setCopied] = useState(false);
  const [submit, state] = useSocialPostActionMutation();
  const [error, setError] = useState("");
  const data = shareSchema.safeParse(state.data);
  if (basePath) {
    const previewUrl =
      typeof window !== "undefined"
        ? `${window.location.origin}${basePath}#${post.id}`
        : `${basePath}#${post.id}`;
    return (
      <Modal isOpen onClose={onClose} titleId="feed-share-title">
        <div className="space-y-4 p-6 pt-12">
          <h2 id="feed-share-title">Share sample post</h2>
          <p>Local community preview link. No message is sent.</p>
          <FormField label="Post link" value={previewUrl} readOnly />
          <Button
            onClick={() =>
              void navigator.clipboard
                .writeText(previewUrl)
                .then(() => setCopied(true))
                .catch(() =>
                  setError("Copy unavailable. Copy the selected link manually."),
                )
            }
          >
            Copy link
          </Button>
          {copied && <p role="status">Link copied.</p>}
          {error && <p role="alert">{error}</p>}
        </div>
      </Modal>
    );
  }
  return (
    <Modal
      isOpen
      onClose={onClose}
      titleId="feed-share-title"
      descriptionId="feed-share-description"
    >
      <div className="space-y-4 overflow-y-auto p-6 pt-12">
        <h2 className="text-xl font-semibold" id="feed-share-title">
          Share post
        </h2>
        <p id="feed-share-description" className="text-sm text-[var(--text-muted)]">
          The backend records a share intent, but returns an authenticated API
          reference. A public web link is not available. No external delivery is
          confirmed.
        </p>
        {data.success && (
          <FormField
            label="Backend API reference (not a public permalink)"
            readOnly
            value={data.data.shareUrl}
          />
        )}
        <Button
          disabled={state.isLoading || data.success}
          onClick={() => {
            setError("");
            void submit({ kind: "share", postId: post.id })
              .unwrap()
              .catch((cause) => setError(normalizeApiError(cause).message));
          }}
        >
          {state.isLoading ? "Recording…" : "Record share intent"}
        </Button>
        <Button disabled>Copy public link unavailable</Button>
        {data.success && (
          <p role="status">Share intent recorded. No message was sent.</p>
        )}
        {error && <p role="alert">{error}</p>}
      </div>
    </Modal>
  );
}
