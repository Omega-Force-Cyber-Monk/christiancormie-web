import { useId, useRef, useState } from "react";
import { X } from "lucide-react";
import { useAppSelector } from "@/app/hooks";
import { Modal } from "@/components/overlays/Modal/Modal";
import { ErrorState } from "@/components/states/ErrorState";
import { EmptyState } from "@/components/states/EmptyState";
import { Button } from "@/components/ui/Button";
import { FeedCommentForm } from "@/features/customer/components/feed/FeedCommentForm";
import { VendorFeedCommentForm } from "@/features/vendor/components/feed/VendorFeedCommentForm";
import {
  useGetPostCommentsQuery,
  useSocialPostActionMutation,
} from "../api/socialFeed.api";
import type { SocialCard } from "../utils/feedAdapters";
import type { SocialComment } from "../schemas/socialFeed.schema";
import { PostLikeButton } from "./PostLikeButton";
import { normalizeApiError } from "@/utils/errors/normalizeApiError";
import { remoteMedia } from "@/utils/files/remoteMedia";
export function SocialCommentsDialog({
  post,
  isOpen,
  onClose,
  variant = "customer",
}: {
  post: SocialCard;
  isOpen: boolean;
  onClose: () => void;
  variant?: "customer" | "vendor";
}) {
  const id = useId();
  const composerId = useId();
  const [offset, setOffset] = useState(0);
  const [draft, setDraft] = useState("");
  const [reply, setReply] = useState<SocialComment | null>(null);
  const [error, setError] = useState("");
  const pending = useRef(false);
  const draftVersion = useRef(0);
  const editDraft = (value: string) => {
    draftVersion.current++;
    setDraft(value);
  };
  const session = useAppSelector((s) => s.auth.sessionId);
  const avatar = useAppSelector((s) => s.auth.user?.avatarUrl ?? "");
  const query = useGetPostCommentsQuery({ postId: post.id, offset }, { skip: !isOpen });
  const [submit, mutation] = useSocialPostActionMutation();
  async function add(content: string) {
    if (pending.current || mutation.isLoading) return false;
    pending.current = true;
    const version = draftVersion.current;
    setError("");
    try {
      await submit({
        kind: "comment",
        postId: post.id,
        content,
        parentCommentId: reply?.id,
      }).unwrap();
      if (draftVersion.current === version) {
        setDraft("");
        setReply(null);
      }
      return true;
    } catch (cause) {
      setError(normalizeApiError(cause).message);
      return false;
    } finally {
      pending.current = false;
    }
  }
  function row(comment: SocialComment, child = false) {
    return (
      <article
        key={comment.id}
        className={
          variant === "vendor" ? "vendor-feed-comment-row" : "feed-comment-row"
        }
      >
        {remoteMedia(comment.author.avatarUrl) ? (
          <img
            src={remoteMedia(comment.author.avatarUrl)}
            alt=""
            className={
              variant === "vendor"
                ? "vendor-feed-comment-avatar"
                : "feed-comment-avatar"
            }
          />
        ) : (
          <span
            aria-label="Avatar unavailable"
            className={
              variant === "vendor"
                ? "vendor-feed-comment-avatar"
                : "feed-comment-avatar"
            }
          />
        )}
        <div
          className={
            variant === "vendor" ? "vendor-feed-comment-bubble" : "feed-comment-bubble"
          }
        >
          <h3 className="font-semibold">{comment.author.displayName}</h3>
          <p className="text-sm whitespace-pre-wrap">{comment.content}</p>
          <div
            className={
              variant === "vendor"
                ? "mt-2 flex flex-wrap items-center gap-3 text-xs"
                : "feed-comment-actions"
            }
          >
            <span className="text-xs">
              {Number.isNaN(Date.parse(comment.createdAt))
                ? "Date unavailable"
                : new Date(comment.createdAt).toLocaleString("en-US", {
                    timeZone: "UTC",
                  })}{" "}
              UTC
            </span>
            <PostLikeButton
              postId={post.id}
              commentId={comment.id}
              liked={comment.isLiked}
              count={comment.likeCount}
              busy={query.isFetching}
            />
            {!child && (
              <button
                type="button"
                aria-label={`Reply to ${comment.author.displayName}`}
                onClick={() => {
                  draftVersion.current++;
                  setReply(comment);
                  document.getElementById(composerId)?.focus();
                }}
              >
                Reply
              </button>
            )}
          </div>
        </div>
      </article>
    );
  }
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      titleId={id}
      panelClassName={
        variant === "vendor" ? "vendor-feed-comments-sheet" : "feed-comments-sheet"
      }
      backdropClassName="bg-[#121826]/80"
      showCloseButton={false}
    >
      <div
        className={
          variant === "vendor" ? "flex min-h-0 flex-1 flex-col" : "feed-comments-layout"
        }
      >
        <header
          className={
            variant === "vendor"
              ? "vendor-feed-comments-heading"
              : "feed-comments-header"
          }
        >
          <div>
            <h2 className="text-xl font-bold" id={id}>
              Comments
            </h2>
            <p role="status">
              {query.currentData?.totalCount ?? post.commentCount} comments
            </p>
          </div>
          <button type="button" aria-label="Close comments" onClick={onClose}>
            <X size={20} />
          </button>
        </header>
        <div
          className={
            variant === "vendor"
              ? "vendor-feed-comments-scroll"
              : "feed-comments-scroll"
          }
        >
          <p className="mb-4 text-sm">
            {post.author}: {post.text}
          </p>
          {query.isLoading ? (
            <p role="status">Loading comments…</p>
          ) : query.isError ? (
            <ErrorState onRetry={() => void query.refetch()} />
          ) : query.currentData?.comments.length ? (
            <ul className={variant === "vendor" ? "space-y-4" : "feed-comment-list"}>
              {query.currentData.comments.map((comment) => (
                <li key={comment.id}>
                  {row(comment)}
                  {comment.replies.length > 0 && (
                    <ul
                      className={
                        variant === "vendor"
                          ? "mt-3 ml-8 space-y-3"
                          : "feed-comment-replies"
                      }
                    >
                      {comment.replies.map((child) => (
                        <li key={child.id}>{row(child, true)}</li>
                      ))}
                    </ul>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState title="No comments yet" />
          )}
          <div className="my-4 flex gap-3">
            <Button
              disabled={offset === 0 || query.isFetching}
              onClick={() => setOffset((n) => Math.max(0, n - 20))}
            >
              Previous comments
            </Button>
            <Button
              disabled={
                query.currentData?.comments.length !== 20 ||
                query.isFetching ||
                query.isError
              }
              onClick={() => setOffset((n) => n + 20)}
            >
              Next comments
            </Button>
          </div>
        </div>
        {error && (
          <p role="alert" className="p-3 text-sm text-red-300">
            {error}
          </p>
        )}
        {variant === "vendor" ? (
          <VendorFeedCommentForm
            text={draft}
            replyingTo={
              reply ? { id: reply.id, author: reply.author.displayName } : null
            }
            avatar={remoteMedia(avatar)}
            onText={editDraft}
            onCancelReply={() => setReply(null)}
            onSubmit={add}
          />
        ) : (
          <FeedCommentForm
            key={session}
            avatar={remoteMedia(avatar)}
            onPreview={add}
            composer={{
              draft,
              onDraftChange: editDraft,
              inputId: composerId,
              replyTo: reply?.author.displayName,
              onCancelReply: () => setReply(null),
            }}
          />
        )}
      </div>
    </Modal>
  );
}
