import { Clock, MapPin, MessageCircle, Share2 } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router";
import { TruckImage } from "@/features/customer/components/discover/DiscoverTruckCard";
import { FeedCommentsDialog } from "./FeedCommentsDialog";
import { PostLikeButton } from "@/features/social/components/PostLikeButton";
import { memberProfilePath } from "@/features/social/utils/profileIdentity";
import type { SocialCard } from "@/features/social/utils/feedAdapters";
export function FeedPostCard({
  post,
  onShare,
  onImage,
  busy = false,
}: {
  post: SocialCard;
  onShare: (post: SocialCard) => void;
  onImage: (post: SocialCard) => void;
  busy?: boolean;
}) {
  const [commentsOpen, setCommentsOpen] = useState(false);
  const headingId = `feed-post-${post.id}-title`;
  return (
    <article aria-labelledby={headingId} className="feed-post" id={post.id}>
      <header className="flex items-center gap-3">
        <TruckImage
          className="feed-post-avatar size-[68px] rounded-full border-2 border-[#FF5733]"
          name={post.author}
          src={post.avatar}
        />
        <div className="min-w-0">
          <h2 className="text-lg leading-7 font-semibold" id={headingId}>
            {post.authorId ? (
              <Link to={memberProfilePath(post.authorId)}>{post.author}</Link>
            ) : (
              post.author
            )}
          </h2>
          <p className="flex flex-wrap items-center gap-x-1.5 gap-y-1 text-sm leading-5 text-[#B8C1D1]">
            <Clock aria-hidden="true" size={16} />
            {post.age}
            {post.location && (
              <>
                <span aria-hidden="true">•</span>
                <MapPin aria-hidden="true" size={16} />
                {post.location}
              </>
            )}
          </p>
        </div>
      </header>
      <p className="feed-post-copy whitespace-pre-wrap">{post.text}</p>
      {post.image && (
        <button
          aria-label={`Enlarge photo in ${post.author} post`}
          className="feed-photo-button"
          onClick={() => onImage(post)}
          type="button"
        >
          <TruckImage
            alt={post.imageAlt}
            className="aspect-[547/423] w-full rounded-2xl"
            name={post.author}
            src={post.image}
          />
        </button>
      )}
      <div aria-label="Post actions" className="feed-post-actions">
        <PostLikeButton
          postId={post.id}
          liked={post.liked}
          count={post.likes}
          busy={busy}
        />
        <button
          aria-expanded={commentsOpen}
          aria-haspopup="dialog"
          aria-label={`Show comments for ${post.author} post`}
          className="feed-reaction text-[#B8C1D1]"
          onClick={() => setCommentsOpen(true)}
          type="button"
        >
          <MessageCircle aria-hidden="true" size={24} />
          <span>{post.commentCount}</span>
        </button>
        <button
          aria-label={`Share ${post.author} post`}
          className="feed-reaction text-[#B8C1D1]"
          onClick={() => onShare(post)}
          type="button"
        >
          <Share2 aria-hidden="true" size={24} />
        </button>
      </div>
      <FeedCommentsDialog
        isOpen={commentsOpen}
        post={post}
        onClose={() => setCommentsOpen(false)}
      />
    </article>
  );
}
