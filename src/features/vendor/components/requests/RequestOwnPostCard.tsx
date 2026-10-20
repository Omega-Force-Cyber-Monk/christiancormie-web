import { Heart, MessageCircle, MoreVertical } from "lucide-react";
import { useRef } from "react";
import type { OwnPost } from "@/features/vendor/utils/requestsState";

export function RequestOwnPostCard({
  post,
  onEdit,
  onDelete,
  onLike,
  onComments,
}: {
  post: OwnPost;
  onEdit: () => void;
  onDelete: () => void;
  onLike: () => void;
  onComments: () => void;
}) {
  const menu = useRef<HTMLDetailsElement>(null);
  return (
    <article className="request-own-card">
      <div className="mb-4 flex items-start gap-3">
        <div className="grid size-10 shrink-0 place-items-center rounded-lg border border-[#596174] text-sm">
          MT
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="font-semibold">Mike T.</h2>
          <p className="mt-1 text-xs text-[#B8C1D1]">2d &middot; San Antonio, TX</p>
        </div>
        <span
          className={`request-post-tag ${post.category === "For sale" ? "request-post-tag--sale" : ""}`}
        >
          {post.category}
        </span>
        <details ref={menu} className="relative">
          <summary
            className="cursor-pointer list-none rounded-lg p-1"
            aria-label={`Actions for ${post.title || "Community post"}`}
          >
            <MoreVertical size={20} />
          </summary>
          <div className="request-post-actions">
            <button
              type="button"
              onClick={() => {
                if (menu.current) {
                  menu.current.open = false;
                  menu.current.querySelector("summary")?.focus();
                }
                onEdit();
              }}
            >
              Edit post
            </button>
            <button
              type="button"
              onClick={() => {
                if (menu.current) {
                  menu.current.open = false;
                  menu.current.querySelector("summary")?.focus();
                }
                onDelete();
              }}
            >
              Delete post
            </button>
          </div>
        </details>
      </div>
      {post.title && (
        <h3 className="mb-3 text-lg font-semibold text-[#2ED3D1]">{post.title}</h3>
      )}
      <p className="mb-5 whitespace-pre-wrap text-sm leading-6">{post.body}</p>
      {post.image && (
        <img
          className="request-post-photo"
          src={post.image}
          alt={
            post.id === "truck"
              ? "Orange Whataburger food truck"
              : "Burgers, fries and pizza"
          }
        />
      )}
      <div className="mt-4 flex gap-6 text-sm text-[#B8C1D1]">
        <button
          type="button"
          className={`flex min-h-11 items-center gap-2 ${post.liked ? "text-[#FF5733]" : ""}`}
          aria-pressed={post.liked}
          aria-label={`Like ${post.title || "community post"}`}
          onClick={onLike}
        >
          <Heart size={20} fill={post.liked ? "currentColor" : "none"} />
          {post.likeCount + Number(post.liked)}
        </button>
        <button
          type="button"
          className="flex min-h-11 items-center gap-2"
          aria-label={`Comments on ${post.title || "community post"}`}
          onClick={onComments}
        >
          <MessageCircle size={20} />
          {post.commentCount + post.comments.length}
        </button>
      </div>
    </article>
  );
}
