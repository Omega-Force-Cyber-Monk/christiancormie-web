import { useState } from "react";
import { CommunityComposer } from "@/features/customer/components/community/CommunityComposer";
import type { CommunityPost } from "../schemas/community.schema";
import {
  composerFromPost,
  composerPatch,
  composerPayload,
} from "../utils/communityPublishing";
import {
  useCommunityPublisher,
  useCommunityPublishing,
} from "../utils/useCommunityPublishing";
import { CommunityPublishingFeedback } from "./CommunityPublishingFeedback";
import { Button } from "@/components/ui/Button";
import { remoteMedia } from "@/utils/files/remoteMedia";
export function CommunityPublishingEditor({
  post,
  onDone,
  onCancel,
}: {
  post?: CommunityPost;
  onDone: (id: string) => void;
  onCancel: () => void;
}) {
  const publisher = useCommunityPublisher();
  const publication = useCommunityPublishing();
  const [baseline] = useState(() => (post ? composerFromPost(post) : undefined));
  return (
    <>
      {!publisher.allowed && (
        <p role="status">
          Publishing requires an eligible verified account. Vendor-role accounts must
          finish onboarding.
          <Button
            onClick={() => void publisher.vendor.refetch()}
            disabled={publisher.vendor.isUninitialized || publisher.vendor.isFetching}
          >
            Retry vendor eligibility
          </Button>
        </p>
      )}
      {post?.media?.length ? (
        <div className="my-4 text-sm text-[#B8C1D1]">
          Existing attachments are retained. New files append to them (five total).
          {post.media.map((m) =>
            remoteMedia(m.mediaUrl) ? (
              <a
                key={m.id}
                className="ml-3 underline"
                href={remoteMedia(m.mediaUrl)}
                target="_blank"
                rel="noreferrer"
              >
                View saved attachment
              </a>
            ) : null,
          )}
        </div>
      ) : null}
      <CommunityComposer
        integrated
        initial={baseline}
        pending={publication.pending}
        serverError={publication.serverError}
        disabled={
          !publisher.allowed || (publication.uncertain && !publication.reviewed)
        }
        onCancel={onCancel}
        onSave={async (values, files) => {
          const body = baseline
            ? composerPatch(baseline, values, files.length > 0)
            : composerPayload(values);
          const result = await publication.publish(
            body,
            files.map((f) => f.file),
            post?.id,
          );
          if (result && publication.isCurrent()) onDone(result.id);
        }}
      />
      <CommunityPublishingFeedback publication={publication} />
    </>
  );
}
