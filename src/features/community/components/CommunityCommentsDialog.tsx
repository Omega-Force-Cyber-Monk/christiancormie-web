import { useId, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Modal } from "@/components/overlays/Modal/Modal";
import { Button } from "@/components/ui/Button";
import { FormField } from "@/components/forms/FormField";
import { FormError } from "@/components/forms/FormError";
import { CommunityReadStates } from "@/features/customer/components/community/CommunityReadStates";
import { useGetCommunityCommentsInfiniteQuery } from "../api/community.api";
import {
  communityCommentInputSchema,
  type CommunityComment,
} from "../schemas/communityInteractions.schema";
import { useCommunityInteraction } from "../utils/useCommunityInteraction";
import {
  communityReplyLabel,
  uniqueCommunityRows,
  communityInteractionAllowed,
} from "../utils/communityInteractions";
import type { CommunityPost } from "../schemas/community.schema";
import { remoteMedia } from "@/utils/files/remoteMedia";
export function CommunityCommentRows({
  rows,
  onReply,
}: {
  rows: CommunityComment[];
  onReply?: (comment: CommunityComment) => void;
}) {
  return (
    <div className="space-y-3">
      {rows.map((row) => (
        <article
          key={row.id}
          className="rounded-2xl border border-white/5 p-3"
          aria-label={`Comment by ${row.user.profile?.displayName ?? "author unavailable"}`}
        >
          <div className="flex items-center gap-3">
            {remoteMedia(row.user.profile?.avatarUrl) && (
              <img
                src={remoteMedia(row.user.profile?.avatarUrl)}
                alt=""
                className="size-9 rounded-full"
              />
            )}
            <h3 className="text-sm font-semibold">
              {row.user.profile?.displayName ?? "Author unavailable"}
            </h3>
          </div>
          {row.parentCommentId && (
            <p className="mt-2 text-xs text-[#B8C1D1]">
              {communityReplyLabel(row, rows)}
            </p>
          )}
          <p className="mt-2 text-sm whitespace-pre-wrap break-words">{row.content}</p>
          <time className="mt-2 block text-xs text-[#B8C1D1]" dateTime={row.createdAt}>
            {new Date(row.createdAt).toLocaleString("en-US")}{" "}
          </time>
          {onReply && (
            <Button className="mt-2" onClick={() => onReply(row)}>
              Reply
            </Button>
          )}
        </article>
      ))}
    </div>
  );
}
export function CommunityCommentsDialog({
  post,
  onClose,
}: {
  post: CommunityPost;
  onClose: () => void;
}) {
  const id = useId();
  return (
    <Modal isOpen onClose={onClose} titleId={id} panelClassName="community-drawer">
      <CommunityCommentsPanel post={post} titleId={id} />
    </Modal>
  );
}
export function CommunityCommentsPanel({
  post,
  titleId,
}: {
  post: CommunityPost;
  titleId?: string;
}) {
  const action = useCommunityInteraction(post.id);
  const generatedId = useId();
  const id = titleId ?? generatedId;
  const [replyId, setReplyId] = useState("");
  const query = useGetCommunityCommentsInfiniteQuery({
    ...action.scope,
    postId: post.id,
  });
  const denied =
    query.error &&
    "status" in query.error &&
    [401, 403, 404].includes(Number(query.error.status));
  const rows = uniqueCommunityRows(denied ? [] : (query.currentData?.pages ?? []));
  const reply = rows.find((row) => row.id === replyId);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<{ content: string }>({
    resolver: zodResolver(communityCommentInputSchema.omit({ parentCommentId: true })),
    defaultValues: { content: "" },
  });
  const canComment =
    communityInteractionAllowed(
      post,
      action.scope.userId,
      action.scope.role,
      action.allowed,
      "comment",
    ) && !denied;
  return (
    <div className="p-5">
      <h2 id={id} className="mb-4 text-xl font-semibold">
        Comments
      </h2>
      <Button disabled={query.isFetching} onClick={() => void query.refetch()}>
        Refresh comments
      </Button>
      <CommunityReadStates
        loading={query.isLoading}
        fetching={query.isFetching}
        error={query.error}
        empty={false}
        onRetry={() => void query.refetch()}
      />
      {!denied && (
        <>
          <CommunityCommentRows
            rows={rows}
            onReply={
              canComment && !action.pending ? (row) => setReplyId(row.id) : undefined
            }
          />
          {!query.isLoading && !query.error && !rows.length && (
            <p role="status">No comments yet.</p>
          )}
        </>
      )}
      {query.hasNextPage && !denied && (
        <Button disabled={query.isFetching} onClick={() => void query.fetchNextPage()}>
          Load more comments
        </Button>
      )}
      {!denied && (
        <p className="mt-3 text-xs text-[#B8C1D1]">
          {query.currentData?.pages[0]?.pagination.total ?? "Unavailable"} comments in
          total. Replies are included.
        </p>
      )}
      {reply && (
        <div className="mt-4 text-sm">
          Replying to {reply.user.profile?.displayName ?? "author unavailable"}
          <Button disabled={action.pending} onClick={() => setReplyId("")}>
            Cancel reply
          </Button>
        </div>
      )}
      <form
        className="mt-4 space-y-3"
        noValidate
        onSubmit={(event) => {
          void handleSubmit(async (values) => {
            const result = await action.run({
              kind: "comment",
              content: values.content,
              ...(reply ? { parentCommentId: reply.id } : {}),
            });
            if (result && action.current()) {
              reset({ content: "" });
              setReplyId("");
            }
          })(event);
        }}
      >
        <FormField
          label={reply ? "Reply" : "Comment"}
          {...register("content")}
          error={errors.content?.message}
          disabled={action.pending || isSubmitting || !canComment}
        />
        <Button
          type="submit"
          className="community-primary"
          disabled={action.pending || isSubmitting || !canComment}
        >
          Post {reply ? "reply" : "comment"}
        </Button>
        <FormError message={action.error} />
        {!canComment && (
          <p className="text-xs text-[#B8C1D1]">
            Commenting is unavailable for this viewer or post.
          </p>
        )}
      </form>
    </div>
  );
}
