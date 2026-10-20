import { Clock, Heart, MapPin, MessageCircle, Share2 } from "lucide-react";
import { useReducer, useState } from "react";
import { generatePath, Link } from "react-router";

import { ROUTES } from "@/constants/routes";
import { TruckImage } from "@/features/customer/components/discover/DiscoverTruckCard";
import tacoSymbol from "@/features/customer/assets/feed/comment-taco.png";
import fireSymbol from "@/features/customer/assets/feed/comment-fire.png";
import { FeedCommentsDialog } from "@/features/customer/components/feed/FeedCommentsDialog";
import { createFeedComments } from "@/features/customer/data/feed-comments.data";
import type { FeedPost } from "@/features/customer/data/feed.data";
import {
  feedCommentsReducer,
  getFeedCommentCount,
} from "@/features/customer/utils/feedComments";

type FeedPostCardProps = {
  post: FeedPost;
  onShare: (post: FeedPost) => void;
  onImage: (post: FeedPost) => void;
};

export function FeedPostCard({ post, onShare, onImage }: FeedPostCardProps) {
  const [liked, setLiked] = useState(false);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [comments, dispatchComments] = useReducer(
    feedCommentsReducer,
    post.id,
    createFeedComments,
  );
  const [announcement, setAnnouncement] = useState("");
  const headingId = `feed-post-${post.id}-title`;
  const commentCount = getFeedCommentCount(
    post.commentCount,
    createFeedComments(post.id).length,
    comments,
  );

  return (
    <article aria-labelledby={headingId} className="feed-post" id={post.id}>
      <header className="flex items-center gap-3">
        <Link
          aria-label={`View ${post.author} profile`}
          className="shrink-0 rounded-full focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2ED3D1]"
          to={generatePath(ROUTES.CUSTOMER_PROFILE, { id: post.authorId })}
        >
          <TruckImage
            className="feed-post-avatar size-[68px] rounded-full border-2 border-[#FF5733]"
            name={post.author}
            src={post.avatar}
          />
        </Link>
        <div className="min-w-0">
          <h2 className="text-lg leading-7 font-semibold" id={headingId}>
            <Link
              className="rounded-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#2ED3D1]"
              to={generatePath(ROUTES.CUSTOMER_PROFILE, { id: post.authorId })}
            >
              {post.author}
            </Link>
          </h2>
          <p className="flex flex-wrap items-center gap-x-1.5 gap-y-1 text-sm leading-5 text-[#B8C1D1]">
            <span className="inline-flex items-center gap-1">
              <Clock aria-hidden="true" size={16} />
              {post.age}
            </span>
            <span aria-hidden="true">•</span>
            <span className="inline-flex items-center gap-1">
              <MapPin aria-hidden="true" size={16} />
              {post.location}
            </span>
          </p>
        </div>
      </header>
      <p className="feed-post-copy">
        {post.textBeforeSymbol} <img alt="" src={tacoSymbol} className="feed-symbol" />{" "}
        {post.textAfterSymbol} <img alt="" src={fireSymbol} className="feed-symbol" />
      </p>
      <button
        aria-label={`Enlarge photo in ${post.author} post`}
        className="feed-photo-button"
        onClick={() => onImage(post)}
        type="button"
      >
        <TruckImage
          alt={post.imageDescription}
          className="aspect-[547/423] w-full rounded-2xl"
          name={post.author}
          src={post.image}
        />
      </button>
      <div aria-label="Post actions" className="feed-post-actions">
        <button
          aria-label={`${liked ? "Unlike" : "Like"} ${post.author} post in local preview`}
          aria-pressed={liked}
          className={`feed-reaction ${liked ? "text-[#FF5733]" : "text-[#B8C1D1]"}`}
          onClick={() => {
            setLiked((current) => !current);
            setAnnouncement(
              liked
                ? "Like removed from local preview."
                : "Liked in local preview. No account was updated.",
            );
          }}
          type="button"
        >
          <Heart aria-hidden="true" className={liked ? "fill-current" : ""} size={24} />
          <span>{post.likes + Number(liked)}</span>
        </button>
        <button
          aria-expanded={commentsOpen}
          aria-haspopup="dialog"
          aria-label={`Show comments for ${post.author} post`}
          className="feed-reaction text-[#B8C1D1]"
          onClick={() => setCommentsOpen(true)}
          type="button"
        >
          <MessageCircle aria-hidden="true" size={24} />
          <span>{commentCount}</span>
        </button>
        <button
          aria-label={`Share link to ${post.author} sample post`}
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
        comments={comments}
        count={commentCount}
        onClose={() => setCommentsOpen(false)}
        onLike={(id) => dispatchComments({ type: "like", id })}
        onAdd={(text, parentId) => {
          dispatchComments({
            type: "add",
            id: `${post.id}-${crypto.randomUUID()}`,
            text,
            parentId,
          });
          setAnnouncement(
            `${parentId ? "Reply" : "Comment"} added to this local preview. Nothing was published.`,
          );
        }}
      />
      <p aria-live="polite" className="sr-only" role="status">
        {announcement}
      </p>
    </article>
  );
}
