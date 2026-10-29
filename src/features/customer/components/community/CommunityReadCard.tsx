import {
  CalendarDays,
  DollarSign,
  Heart,
  MapPin,
  MessageCircle,
  MoreVertical,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { TruckImage } from "@/features/customer/components/discover/DiscoverTruckCard";
import type { CommunityPost } from "@/features/community/schemas/community.schema";
import { communityPresentation } from "@/features/community/utils/communityAdapters";
import { CommunityPostInteractions } from "@/features/community/components/CommunityPostInteractions";

export function CommunityReadCard({
  post,
  mine = false,
  detail = false,
  onDetails,
  onImage,
  onEdit,
  onDelete,
  busy = false,
  interactive = false,
}: {
  post: CommunityPost;
  mine?: boolean;
  detail?: boolean;
  onDetails: () => void;
  onImage: (url: string) => void;
  onEdit?: () => void;
  onDelete?: () => void;
  busy?: boolean;
  interactive?: boolean;
}) {
  const view = communityPresentation(post);
  const kind =
    post.category === "NEED_TRUCK"
      ? "request"
      : post.category === "VENDOR_CALLOUT"
        ? "callout"
        : "social";
  const unavailable = "Unavailable until Community actions are integrated";
  return (
    <article
      id={detail ? undefined : post.id}
      aria-labelledby={`community-${detail ? "detail-" : ""}${post.id}`}
      className={
        mine
          ? `community-my-card ${kind === "callout" ? "community-my-card--callout" : ""}`
          : `community-card community-card--${kind}`
      }
    >
      <header className="flex items-start gap-3">
        {view.avatar ? (
          <TruckImage
            alt={view.author}
            name={view.author}
            src={view.avatar}
            className={`${kind === "request" ? "size-10" : "size-12 rounded-full"} shrink-0`}
          />
        ) : (
          <span aria-hidden="true" className="size-12 shrink-0" />
        )}
        <div className="min-w-0 flex-1">
          <h2
            id={`community-${detail ? "detail-" : ""}${post.id}`}
            className={`${kind === "request" ? "text-lg" : "text-sm"} leading-5 font-bold`}
          >
            {view.author}
          </h2>
          <p className="mt-1 text-xs leading-4 text-[#B8C1D1]">
            <time dateTime={post.createdAt}>{view.created}</time>
            {post.address ? ` · ${post.address}` : " · Location unavailable"}
          </p>
        </div>
        <span className={`community-category community-category--${kind}`}>
          {view.category}
        </span>
        {!detail && (
          <button
            aria-label={`Post details and actions for ${post.title}`}
            className="community-more"
            onClick={onDetails}
            type="button"
          >
            <MoreVertical aria-hidden="true" size={18} />
          </button>
        )}
      </header>
      <p className="mt-3 text-xs text-[#B8C1D1]">
        {post.status} · {post.visibility}
        {post.viewer?.isOwner ? " · Your post" : ""}
        {post.viewer?.isIgnored ? " · Ignored" : ""}
        {post.viewer?.isInterested ? " · Interested" : ""}
      </p>
      <h3 className="mt-3 font-bold break-words">
        {detail ? (
          post.title
        ) : (
          <button
            type="button"
            className="text-left break-words focus-visible:outline"
            onClick={onDetails}
          >
            {post.title}
          </button>
        )}
      </h3>
      <p className="mt-3 text-base leading-[26px] whitespace-pre-wrap break-words text-[#E7E8E9]">
        {post.description ?? "Description unavailable"}
      </p>
      {kind === "request" && (
        <>
          {post.eventType && (
            <p className="mt-3 inline-flex rounded-full bg-[#2ED3D1]/10 px-3 py-2 text-sm font-semibold text-[#2ED3D1]">
              {post.eventType.replaceAll("_", " ")}
            </p>
          )}
          <dl className="community-request-details">
            {[
              { label: "Date", value: view.eventDate, icon: CalendarDays },
              { label: "Location", value: post.address ?? "Unavailable", icon: MapPin },
              { label: "Guests", value: post.guestCount ?? "Unavailable", icon: Users },
              { label: "Budget", value: view.budget, icon: DollarSign },
            ].map(({ label, value, icon: Icon }) => (
              <div
                key={label}
                className="min-w-0 rounded-[20px] border border-white/5 px-4 py-3"
              >
                <dt className="flex items-center gap-1 text-xs text-[#B8C1D1]">
                  <Icon size={14} aria-hidden="true" />
                  {label}
                </dt>
                <dd className="mt-1 text-sm break-words">{value}</dd>
              </div>
            ))}
          </dl>
        </>
      )}
      {kind === "callout" && (
        <dl className="community-request-details">
          {[
            ["Date", view.eventDate],
            ["Venue", post.address ?? "Unavailable"],
            [
              "Expected",
              post.attendanceMin == null && post.attendanceMax == null
                ? "Unavailable"
                : `${post.attendanceMin ?? "Unavailable"} – ${post.attendanceMax ?? "Unavailable"}`,
            ],
            ["Spots Open", post.spotsOpen ?? "Unavailable"],
          ].map(([label, value]) => (
            <div key={label} className="min-w-0 rounded-2xl border border-white/5 p-3">
              <dt className="text-xs text-[#B8C1D1]">{label}</dt>
              <dd className="mt-1 text-sm">{value}</dd>
            </div>
          ))}
        </dl>
      )}
      {view.media.map((media) =>
        media.mediaType === "IMAGE" ? (
          <button
            key={media.id}
            aria-label={`Enlarge attachment for ${post.title}`}
            type="button"
            onClick={() => onImage(media.url)}
            className="mt-3 block w-full overflow-hidden rounded-2xl focus-visible:outline"
          >
            <TruckImage
              alt={`Attachment for ${post.title}`}
              name={post.title}
              src={media.url}
              className="aspect-[551.667/192] w-full"
            />
          </button>
        ) : media.mediaType === "VIDEO" ? (
          <video
            key={media.id}
            controls
            preload="metadata"
            src={media.url}
            aria-label={`Video for ${post.title}`}
            className="mt-3 w-full rounded-2xl"
          />
        ) : (
          <a
            key={media.id}
            href={media.url}
            target="_blank"
            rel="noreferrer"
            className="mt-3 block underline"
          >
            View attachment
          </a>
        ),
      )}
      {interactive ? (
        <CommunityPostInteractions post={post} mode="engagement" />
      ) : (
        <div className="mt-3 flex flex-wrap items-center border-t border-white/5 text-[#B8C1D1]">
          <button
            disabled
            title={unavailable}
            className="community-reaction"
            type="button"
          >
            <Heart size={20} aria-hidden="true" />
            {post.counts?.reactions ?? "Unavailable"}
          </button>
          <button
            disabled
            title={unavailable}
            className="community-reaction"
            type="button"
          >
            <MessageCircle size={20} aria-hidden="true" />
            {post.counts?.comments ?? "Unavailable"} comments
          </button>
          {kind === "request" && (
            <span className="community-reaction">
              {post.counts?.offers ?? "Unavailable"} offers
            </span>
          )}
          {kind === "callout" && (
            <span className="community-reaction">
              {post.counts?.interestedVendors ?? "Unavailable"} vendors interested
            </span>
          )}
        </div>
      )}
      {mine && kind !== "social" && (!interactive || kind !== "callout") && (
        <Button disabled className="community-primary mt-3 w-full" title={unavailable}>
          {kind === "callout" ? "View interested trucks" : "View offers"}
        </Button>
      )}
      {detail && (
        <div className="mt-4 space-y-2">
          {post.allowedActions?.canEdit && (
            <Button
              disabled={!onEdit || busy}
              title={!onEdit ? unavailable : undefined}
              onClick={onEdit}
            >
              Edit post
            </Button>
          )}
          {post.allowedActions?.canDelete && (
            <Button
              disabled={!onDelete || busy}
              title={!onDelete ? unavailable : undefined}
              onClick={onDelete}
            >
              Delete post
            </Button>
          )}
          {post.allowedActions?.canQuote && (
            <Button disabled title={unavailable}>
              Send quote
            </Button>
          )}
          {!interactive && post.allowedActions?.canSendInterest && (
            <Button disabled title={unavailable}>
              Send interest
            </Button>
          )}
          {!interactive && (
            <Button disabled title={unavailable}>
              Report post
            </Button>
          )}
          {!interactive && (
            <Button disabled title={unavailable}>
              Hide post
            </Button>
          )}
          {interactive && <CommunityPostInteractions post={post} mode="actions" />}
        </div>
      )}
    </article>
  );
}
