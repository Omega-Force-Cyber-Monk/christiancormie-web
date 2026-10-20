import { Clock3, Eye, Heart, MapPin, MessageCircle } from "lucide-react";
import type { VendorFeedPost } from "@/features/vendor/data/feed.data";
import { VendorFeedText } from "@/features/vendor/components/feed/VendorFeedText";

export function VendorFeedPostCard({
  post,
  onLike,
  onComments,
}: {
  post: VendorFeedPost;
  onLike: () => void;
  onComments: () => void;
}) {
  return (
    <article
      className="vendor-feed-post"
      id={post.id}
      aria-label={`Post by ${post.author}`}
    >
      <header className="flex items-center gap-3 px-4 pt-3">
        <img
          src={post.avatar}
          alt=""
          className="size-[46px] shrink-0 rounded-full object-cover"
        />
        <div className="min-w-0">
          <h2 className="text-lg leading-7 font-semibold">{post.author}</h2>
          <p className="flex flex-wrap items-center gap-1 text-xs leading-[18px] text-[#B8C1D1]">
            <Clock3 size={12} aria-hidden="true" />
            {post.age}
            {post.location && (
              <>
                <span aria-hidden="true">·</span>
                <MapPin size={12} aria-hidden="true" />
                {post.location}
              </>
            )}
          </p>
        </div>
      </header>
      <p className="vendor-feed-post-text">
        <VendorFeedText text={post.text} />
      </p>
      {post.image && (
        <img
          src={post.image}
          alt={post.imageAlt}
          className="vendor-feed-post-image"
          loading="lazy"
        />
      )}
      <div className="vendor-feed-post-actions">
        <button
          type="button"
          onClick={onLike}
          aria-pressed={post.liked}
          aria-label={`${post.liked ? "Unlike" : "Like"} ${post.author}'s post`}
          className={post.liked ? "text-[#FF5733]" : ""}
        >
          <Heart
            size={24}
            fill={post.liked ? "currentColor" : "none"}
            aria-hidden="true"
          />
          <span>{post.likes}</span>
        </button>
        <button
          type="button"
          onClick={onComments}
          aria-haspopup="dialog"
          aria-label={`Open ${post.comments.length} comments on ${post.author}'s post`}
        >
          <MessageCircle size={24} aria-hidden="true" />
          <span>{post.comments.length}</span>
        </button>
        <span className="ml-auto flex items-center gap-2 text-sm">
          <Eye size={24} aria-hidden="true" />
          <span className="sr-only">Views: </span>
          {post.views}
        </span>
      </div>
    </article>
  );
}
