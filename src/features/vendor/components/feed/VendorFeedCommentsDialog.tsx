import { Heart, X } from "lucide-react";
import { useId, useState } from "react";
import { Modal } from "@/components/overlays/Modal/Modal";
import { EmptyState } from "@/components/states/EmptyState";
import { VendorFeedText } from "@/features/vendor/components/feed/VendorFeedText";
import { VendorFeedCommentForm } from "@/features/vendor/components/feed/VendorFeedCommentForm";
import type { VendorFeedPost } from "@/features/vendor/data/feed.data";
import {
  getVendorCommentOrder,
  type VendorCommentDraft,
  type VendorFeedAction,
} from "@/features/vendor/utils/feedState";

export function VendorFeedCommentsDialog({
  post,
  draft,
  dispatch,
  onClose,
}: {
  post: VendorFeedPost;
  draft: VendorCommentDraft;
  dispatch: (action: VendorFeedAction) => void;
  onClose: () => void;
}) {
  const titleId = useId();
  const descriptionId = useId();
  const [status, setStatus] = useState("");
  const replyingTo = post.comments.find((comment) => comment.id === draft.replyTo);
  const comments = getVendorCommentOrder(post.comments);
  return (
    <Modal
      isOpen
      onClose={onClose}
      titleId={titleId}
      descriptionId={descriptionId}
      showCloseButton={false}
      panelClassName="vendor-feed-comments-sheet"
      backdropClassName="bg-[#121826]/60"
    >
      <header className="vendor-feed-comments-heading">
        <h2 id={titleId} className="text-xl leading-7 font-semibold">
          Comments
        </h2>
        <p className="mt-1 text-sm text-[#B8C1D1]">
          {post.comments.length} {post.comments.length === 1 ? "comment" : "comments"}
        </p>
        <button
          type="button"
          className="vendor-feed-comments-close"
          aria-label="Close comments"
          onClick={onClose}
        >
          <X size={20} />
        </button>
      </header>
      <div className="vendor-feed-comments-summary">
        <img
          src={post.avatar}
          alt=""
          className="size-9 shrink-0 rounded-full object-cover"
        />
        <div>
          <h3 className="text-lg leading-7 font-semibold">{post.author}</h3>
          <p className="max-w-[295px] text-sm leading-5 text-[#B8C1D1]">
            <VendorFeedText text={post.text} />
          </p>
        </div>
      </div>
      <div className="vendor-feed-comments-scroll">
        {comments.length ? (
          <ul className="space-y-4">
            {comments.map((comment) => (
              <li
                key={comment.id}
                id={`${titleId}-${comment.id}`}
                className="vendor-feed-comment-row"
                style={{ paddingLeft: Math.min(comment.depth, 2) * 20 }}
              >
                <span className="vendor-feed-comment-avatar">
                  {comment.avatar && (
                    <img
                      src={comment.avatar}
                      alt=""
                      className="size-10 rounded-full object-cover"
                    />
                  )}
                </span>
                <div className="vendor-feed-comment-bubble">
                  <h4 className="text-lg leading-7 font-medium">{comment.author}</h4>
                  {comment.parentId && (
                    <p className="text-xs text-[#B8C1D1]">
                      Reply to{" "}
                      {
                        post.comments.find((item) => item.id === comment.parentId)
                          ?.author
                      }
                    </p>
                  )}
                  <p className="mt-0.5 text-sm leading-5 break-words whitespace-pre-wrap">
                    <VendorFeedText text={comment.text} />
                  </p>
                  <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-[#B8C1D1]">
                    <span>{comment.age}</span>
                    <button
                      type="button"
                      className={`inline-flex min-h-8 items-center gap-1 ${comment.liked ? "text-[#FF5733]" : ""}`}
                      aria-pressed={comment.liked}
                      aria-label={`${comment.liked ? "Unlike" : "Like"} comment by ${comment.author}`}
                      onClick={() =>
                        dispatch({
                          type: "like-comment",
                          postId: post.id,
                          commentId: comment.id,
                        })
                      }
                    >
                      <Heart
                        size={14}
                        fill={comment.liked ? "currentColor" : "none"}
                        aria-hidden="true"
                      />
                      {comment.likes}
                    </button>
                    <button
                      type="button"
                      className="min-h-8 px-1 text-white"
                      aria-label={`Reply to ${comment.author}`}
                      onClick={() =>
                        dispatch({
                          type: "draft",
                          postId: post.id,
                          draft: { ...draft, replyTo: comment.id },
                        })
                      }
                    >
                      Reply
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState
            title="No comments yet"
            description="Add the first local comment to this sample post."
          />
        )}
      </div>
      <VendorFeedCommentForm
        text={draft.text}
        replyingTo={replyingTo ?? null}
        onText={(text) =>
          dispatch({ type: "draft", postId: post.id, draft: { ...draft, text } })
        }
        onCancelReply={() =>
          dispatch({
            type: "draft",
            postId: post.id,
            draft: { ...draft, replyTo: null },
          })
        }
        onSubmit={(text) => {
          const id = crypto.randomUUID();
          dispatch({
            type: "comment",
            postId: post.id,
            text,
            id,
            parentId: draft.replyTo,
          });
          setStatus(draft.replyTo ? "Reply added locally." : "Comment added locally.");
          requestAnimationFrame(() =>
            document
              .getElementById(`${titleId}-${id}`)
              ?.scrollIntoView({ block: "nearest" }),
          );
        }}
      />
      <p id={descriptionId} className="vendor-feed-comments-note" role="status">
        {status} Sample thread. Reactions, comments and replies stay in this local
        preview.
      </p>
    </Modal>
  );
}
