import { Clock3, Eye, MessageCircle } from "lucide-react";
import { useState } from "react";
import { PostLikeButton } from "@/features/social/components/PostLikeButton";
import { VendorFeedCommentsDialog } from "./VendorFeedCommentsDialog";
import type { SocialCard } from "@/features/social/utils/feedAdapters";
export function VendorFeedPostCard({
  post,
  busy = false,
}: {
  post: SocialCard;
  busy?: boolean;
}) {
  const [comments, setComments] = useState(false);
  return (
    <article
      className="vendor-feed-post"
      id={post.id}
      aria-label={`Post by ${post.author}`}
    >
      <header className="flex items-center gap-3 px-4 pt-3">
        {post.avatar && (
          <img
            src={post.avatar}
            alt=""
            className="size-[46px] shrink-0 rounded-full object-cover"
          />
        )}
        <div className="min-w-0">
          <h2 className="text-lg leading-7 font-semibold">{post.author}</h2>
          <p className="flex flex-wrap items-center gap-1 text-xs leading-[18px] text-[#B8C1D1]">
            <Clock3 size={12} aria-hidden="true" />
            {post.age}
            {post.location && ` · ${post.location}`}
          </p>
        </div>
      </header>
      <p className="vendor-feed-post-text whitespace-pre-wrap">{post.text}</p>
      {post.images.map((src, index) => (
        <img
          key={`${src}:${index}`}
          src={src}
          alt={`${post.imageAlt} — photo ${index + 1}`}
          className="vendor-feed-post-image"
          loading="lazy"
        />
      ))}
      <div className="vendor-feed-post-actions">
        <PostLikeButton
          postId={post.id}
          liked={post.liked}
          count={post.likes}
          busy={busy}
        />
        <button
          type="button"
          onClick={() => setComments(true)}
          aria-haspopup="dialog"
          aria-label={`Open ${post.commentCount} comments on ${post.author}'s post`}
        >
          <MessageCircle size={24} aria-hidden="true" />
          <span>{post.commentCount}</span>
        </button>
        <span className="ml-auto flex items-center gap-2 text-sm">
          <Eye size={24} aria-hidden="true" />
          <span className="sr-only">Views: </span>
          {post.views ?? "Unavailable"}
        </span>
      </div>
      <VendorFeedCommentsDialog
        post={post}
        isOpen={comments}
        onClose={() => setComments(false)}
      />
    </article>
  );
}
