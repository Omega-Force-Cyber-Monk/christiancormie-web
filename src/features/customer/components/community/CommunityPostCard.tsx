import {
  CalendarDays,
  DollarSign,
  Heart,
  MapPin,
  MessageCircle,
  MoreVertical,
  Users,
} from "lucide-react";
import { useState } from "react";

import { TruckImage } from "@/features/customer/components/discover/DiscoverTruckCard";
import { FeedCommentForm } from "@/features/customer/components/feed/FeedCommentForm";
import type { CommunityPost } from "@/features/customer/data/community.data";
import { FilePreview } from "@/components/forms/FileUpload/FilePreview";

type CommunityPostCardProps = {
  post: CommunityPost;
  onActions: (post: CommunityPost) => void;
  onOffers: (post: CommunityPost) => void;
  onImage: (post: CommunityPost) => void;
};

export function CommunityPostCard({
  post,
  onActions,
  onOffers,
  onImage,
}: CommunityPostCardProps) {
  const [liked, setLiked] = useState(false);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [comments, setComments] = useState<string[]>([]);
  const [status, setStatus] = useState("");
  const kind =
    post.category === "Need a truck"
      ? "request"
      : post.category === "Callout"
        ? "callout"
        : "social";
  const commentsId = `community-comments-${post.id}`;

  return (
    <article
      aria-labelledby={`community-post-${post.id}`}
      className={`community-card community-card--${kind}`}
      id={post.id}
    >
      <header className="flex items-start gap-3">
        {post.avatar ? (
          <TruckImage
            alt={`${post.author}, sample author`}
            className={`${kind === "request" ? "size-10" : "size-12 rounded-full"} shrink-0`}
            name={post.author}
            src={post.avatar}
          />
        ) : (
          <span aria-hidden="true" className="size-12 shrink-0" />
        )}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <h2
              className={`${kind === "request" ? "text-lg" : "text-sm"} leading-5 font-bold`}
              id={`community-post-${post.id}`}
            >
              {post.author}
            </h2>
            {post.badge && (
              <span
                className={`community-author-badge ${post.badge === "BiteDrop Legend" ? "community-author-badge--legend" : ""}`}
              >
                {post.badge}
              </span>
            )}
          </div>
          <p className="mt-1 text-xs leading-4 text-[#B8C1D1]">
            {post.age}
            {kind !== "request" && ` · ${post.city}`}
          </p>
        </div>
        <span className={`community-category community-category--${kind}`}>
          {post.category === "Callout" ? "Vendor callout" : post.category}
        </span>
        <button
          aria-label={`Post actions for ${post.author}`}
          className="community-more"
          id={`community-actions-${post.id}`}
          onClick={() => onActions(post)}
          type="button"
        >
          <MoreVertical aria-hidden="true" size={18} />
        </button>
      </header>
      {post.request && (
        <p className="mt-3 inline-flex rounded-full bg-[#2ED3D1]/10 px-3 py-2 text-sm leading-4 font-semibold text-[#2ED3D1]">
          {post.request.occasion}
        </p>
      )}
      {post.attachments && post.attachments.length > 0 && (
        <ul className="mt-4 space-y-2" aria-label="Local post attachments">
          {post.attachments.map((attachment) => (
            <li className="flex min-w-0 items-center gap-3 text-sm" key={attachment.id}>
              <FilePreview file={attachment.file} />
              <span className="break-all">{attachment.file.name}</span>
            </li>
          ))}
        </ul>
      )}
      <p className="mt-3 text-base leading-[26px] text-[#E7E8E9]">
        {post.body.map((line, index) => (
          <span className="block break-words" key={index}>
            {line}
          </span>
        ))}
      </p>
      {post.request && (
        <dl className="community-request-details">
          {[
            { label: "Date", value: post.request.date, icon: CalendarDays },
            { label: "Location", value: post.request.location, icon: MapPin },
            { label: "Guests", value: post.request.guests, icon: Users },
            { label: "Budget", value: post.request.budget, icon: DollarSign },
          ].map(({ label, value, icon: Icon }) => (
            <div
              className="min-w-0 rounded-[20px] border border-white/5 px-4 py-3"
              key={label}
            >
              <dt className="flex items-center gap-1 text-xs leading-4 text-[#B8C1D1]">
                <Icon aria-hidden="true" size={14} />
                {label}
              </dt>
              <dd className="mt-1 text-sm leading-5 text-[#E7E8E9]">{value}</dd>
            </div>
          ))}
        </dl>
      )}
      {post.image && (
        <button
          aria-label="Enlarge sample callout photo"
          className="mt-3 block w-full overflow-hidden rounded-2xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#2ED3D1]"
          onClick={() => onImage(post)}
          type="button"
        >
          <TruckImage
            alt="Grilled meat platter with dipping sauce from the supplied callout design"
            className="aspect-[551.667/192] w-full"
            name={post.author}
            src={post.image}
          />
        </button>
      )}
      <div className="mt-3 flex items-center border-t border-white/5 text-[#B8C1D1]">
        {post.request ? (
          <button
            aria-label={`Preview ${post.request.offers} sample offers`}
            className="community-reaction"
            onClick={() => onOffers(post)}
            type="button"
          >
            <MessageCircle aria-hidden="true" size={16} />
            {post.request.offers} offers
          </button>
        ) : (
          <>
            <button
              aria-label={`${liked ? "Unlike" : "Like"} ${post.author} post locally`}
              aria-pressed={liked}
              className={`community-reaction ${liked ? "text-[#FF5733]" : ""}`}
              onClick={() => {
                setLiked((current) => !current);
                setStatus(
                  liked
                    ? "Local like removed."
                    : "Liked locally. No account was updated.",
                );
              }}
              type="button"
            >
              <Heart
                aria-hidden="true"
                className={liked ? "fill-current" : ""}
                size={20}
              />
              {post.likes + Number(liked)}
            </button>
            <button
              aria-controls={commentsId}
              aria-expanded={commentsOpen}
              aria-label={`Preview comments for ${post.author}`}
              className="community-reaction"
              onClick={() => setCommentsOpen((current) => !current)}
              type="button"
            >
              <MessageCircle aria-hidden="true" size={20} />
              {post.comments + comments.length}
            </button>
          </>
        )}
      </div>
      {!post.request && (
        <section
          aria-label="Local comment preview"
          className="pb-3"
          hidden={!commentsOpen}
          id={commentsId}
        >
          <p className="mt-2 text-sm text-[#B8C1D1]">
            The {post.comments} sample comments were not supplied. Added comments are
            local previews.
          </p>
          {comments.length > 0 && (
            <ul className="mt-3 space-y-2">
              {comments.map((comment, index) => (
                <li
                  className="rounded-lg bg-white/5 p-3 text-sm break-words"
                  key={index}
                >
                  <span className="block text-xs text-[#2ED3D1]">
                    You · Local preview
                  </span>
                  {comment}
                </li>
              ))}
            </ul>
          )}
          <FeedCommentForm
            onPreview={(text) => {
              setComments((current) => [...current, text]);
              setStatus("Added to local comment preview. Nothing was published.");
            }}
          />
        </section>
      )}
      <p aria-live="polite" className="sr-only" role="status">
        {status}
      </p>
    </article>
  );
}
