import { Heart, X } from "lucide-react";
import { useEffect, useId, useState } from "react";

import { Modal } from "@/components/overlays/Modal/Modal";
import { EmptyState } from "@/components/states/EmptyState";
import tacoSymbol from "@/features/customer/assets/feed/comment-taco.png";
import fireSymbol from "@/features/customer/assets/feed/comment-fire.png";
import { TruckImage } from "@/features/customer/components/discover/DiscoverTruckCard";
import { FeedCommentForm } from "@/features/customer/components/feed/FeedCommentForm";
import type { FeedComment } from "@/features/customer/data/feed-comments.data";
import type { FeedPost } from "@/features/customer/data/feed.data";

type FeedCommentsDialogProps = {
  isOpen: boolean;
  post: FeedPost;
  comments: FeedComment[];
  count: number;
  onClose: () => void;
  onLike: (id: string) => void;
  onAdd: (text: string, parentId: string | null) => void;
};

export function FeedCommentsDialog({
  isOpen,
  post,
  comments,
  count,
  onClose,
  onLike,
  onAdd,
}: FeedCommentsDialogProps) {
  const titleId = useId();
  const descriptionId = useId();
  const composerId = useId();
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [expanded, setExpanded] = useState<string[]>([]);
  const [announcement, setAnnouncement] = useState("");
  const parent = comments.find((comment) => comment.id === replyTo);
  const latestCommentId = comments.at(-1)?.id;

  useEffect(() => {
    if (isOpen) document.getElementById(composerId)?.focus();
  }, [isOpen, replyTo, composerId]);

  useEffect(() => {
    if (isOpen && latestCommentId)
      document
        .getElementById(`${titleId}-${latestCommentId}`)
        ?.scrollIntoView({ block: "nearest" });
  }, [isOpen, latestCommentId, titleId]);

  function commentRow(comment: FeedComment, isReply = false) {
    return (
      <div className="feed-comment-row">
        {comment.avatar ? (
          <TruckImage
            src={comment.avatar}
            name={comment.author}
            alt={`${comment.author} — sample commenter`}
            className="feed-comment-avatar"
          />
        ) : (
          <span className="feed-comment-avatar" aria-hidden="true" />
        )}
        <div className="feed-comment-bubble">
          <h3 className="text-lg leading-7 font-medium">{comment.author}</h3>
          <p className="mt-0.5 text-sm leading-5 break-words whitespace-pre-wrap">
            {comment.text}
          </p>
          <div className="feed-comment-actions">
            <span className="text-xs text-[#B8C1D1]">{comment.age}</span>
            <button
              type="button"
              aria-label={`${comment.liked ? "Unlike" : "Like"} ${comment.author} comment`}
              aria-pressed={comment.liked}
              className={comment.liked ? "text-[#FF5733]" : "text-[#B8C1D1]"}
              onClick={() => {
                onLike(comment.id);
                setAnnouncement(
                  `${comment.liked ? "Unliked" : "Liked"} ${comment.author}'s comment in this local preview.`,
                );
              }}
            >
              <Heart
                aria-hidden="true"
                size={14}
                className={comment.liked ? "fill-current" : ""}
              />
              {comment.likes}
            </button>
            {!isReply && (
              <button
                type="button"
                aria-label={`Reply to ${comment.author}`}
                onClick={() => {
                  setReplyTo(comment.id);
                  document.getElementById(composerId)?.focus();
                }}
              >
                Reply
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      titleId={titleId}
      descriptionId={descriptionId}
      backdropClassName="bg-[#121826]/80"
      panelClassName="feed-comments-sheet"
      showCloseButton={false}
    >
      <div className="feed-comments-layout">
        <header className="feed-comments-header">
          <div>
            <h2 className="text-xl leading-7 font-bold" id={titleId}>
              Comments
            </h2>
            <p className="text-sm leading-5 text-[#B8C1D1]" aria-live="polite">
              {count} {count === 1 ? "comment" : "comments"}
            </p>
          </div>
          <button
            type="button"
            className="feed-comments-close"
            aria-label="Close comments"
            onClick={onClose}
          >
            <X size={20} aria-hidden="true" />
          </button>
        </header>
        <div className="feed-comments-scroll">
          <div className="feed-comments-post">
            <TruckImage
              className="size-[38px] shrink-0 rounded-full"
              src={post.avatar}
              name={post.author}
            />
            <div>
              <p className="text-lg leading-7 font-semibold">{post.author}</p>
              <p className="max-w-[310px] text-sm leading-5 text-[#B8C1D1]">
                {post.textBeforeSymbol}{" "}
                <img alt="" src={tacoSymbol} className="feed-symbol" />{" "}
                {post.textAfterSymbol}{" "}
                <img alt="" src={fireSymbol} className="feed-symbol" />
              </p>
            </div>
          </div>
          {comments.length ? (
            <ul
              className="feed-comment-list"
              aria-label={`Comments on ${post.author}'s post`}
            >
              {comments
                .filter((comment) => comment.parentId === null)
                .map((comment) => {
                  const replies = comments.filter(
                    (item) => item.parentId === comment.id,
                  );
                  const repliesOpen = expanded.includes(comment.id);
                  const repliesId = `${titleId}-${comment.id}-replies`;
                  return (
                    <li key={comment.id} id={`${titleId}-${comment.id}`}>
                      {commentRow(comment)}
                      {replies.length > 0 && (
                        <div className="feed-comment-replies">
                          <button
                            type="button"
                            className="feed-replies-toggle"
                            aria-expanded={repliesOpen}
                            aria-controls={repliesId}
                            onClick={() =>
                              setExpanded((current) =>
                                repliesOpen
                                  ? current.filter((id) => id !== comment.id)
                                  : [...current, comment.id],
                              )
                            }
                          >
                            {repliesOpen ? "Hide" : "View"} {replies.length}{" "}
                            {replies.length === 1 ? "reply" : "replies"}
                          </button>
                          <ul
                            hidden={!repliesOpen}
                            id={repliesId}
                            className="space-y-3"
                            aria-label={`Replies to ${comment.author}`}
                          >
                            {replies.map((reply) => (
                              <li key={reply.id} id={`${titleId}-${reply.id}`}>
                                {commentRow(reply, true)}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </li>
                  );
                })}
            </ul>
          ) : (
            <EmptyState
              title="No comments yet"
              description="Add the first comment to this local preview."
            />
          )}
        </div>
        <footer className="feed-comments-footer">
          <FeedCommentForm
            composer={{
              draft,
              onDraftChange: setDraft,
              inputId: composerId,
              replyTo: parent?.author,
              onCancelReply: () => setReplyTo(null),
            }}
            onPreview={(text) => {
              onAdd(text, replyTo);
              if (replyTo)
                setExpanded((current) =>
                  current.includes(replyTo) ? current : [...current, replyTo],
                );
              setReplyTo(null);
              setAnnouncement(
                `${replyTo ? "Reply" : "Comment"} added locally. Nothing was published.`,
              );
            }}
          />
          <p id={descriptionId} className="feed-comment-note">
            Local preview · Comments and replies stay on this page and are never
            published.
          </p>
        </footer>
        <p role="status" aria-live="polite" className="sr-only">
          {announcement}
        </p>
      </div>
    </Modal>
  );
}
