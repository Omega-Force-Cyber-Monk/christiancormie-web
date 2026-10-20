import {
  CalendarDays,
  DollarSign,
  Info,
  MapPin,
  MessageCircle,
  MoreVertical,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { TruckImage } from "@/features/customer/components/discover/DiscoverTruckCard";
import type { CommunityPost } from "@/features/customer/data/community.data";

export function CommunityRequestDetails({ post }: { post: CommunityPost }) {
  const request = post.request;
  if (!request) return null;
  return (
    <dl className="community-request-details">
      {[
        { label: "Date", value: request.date, icon: CalendarDays },
        { label: "Location", value: request.location, icon: MapPin },
        { label: "Guests", value: request.guests, icon: Users },
        { label: "Budget", value: request.budget, icon: DollarSign },
      ].map(({ label, value, icon: Icon }) => (
        <div
          key={label}
          className="min-w-0 rounded-[20px] border border-white/5 bg-[#121826] px-4 py-3"
        >
          <dt className="flex items-center gap-1 text-xs text-[#B8C1D1]">
            <Icon size={14} aria-hidden="true" />
            {label}
          </dt>
          <dd className="mt-1 text-sm font-semibold break-words">{value}</dd>
        </div>
      ))}
    </dl>
  );
}

export function CommunityRequestCard({
  post,
  onActions,
  onOffers,
  onTrack,
  onInterested,
}: {
  post: CommunityPost;
  onActions: (post: CommunityPost) => void;
  onOffers: (post: CommunityPost) => void;
  onTrack: (post: CommunityPost) => void;
  onInterested: (post: CommunityPost) => void;
}) {
  const ongoing = post.status === "Ongoing" || post.status === "Completed";
  return (
    <article
      id={post.id}
      className={`community-my-card ${ongoing ? "community-my-card--ongoing" : post.status === "Requested" ? "community-my-card--requested" : post.callout ? "community-my-card--callout" : ""}`}
    >
      <header className="flex items-start gap-3">
        {post.avatar ? (
          <TruckImage
            name={post.author}
            src={post.avatar}
            className="size-10 shrink-0"
          />
        ) : (
          <span className="size-10 shrink-0" />
        )}
        <div className="min-w-0 flex-1">
          <h2 className="text-lg font-semibold">{post.author}</h2>
          <p className="text-xs text-[#B8C1D1]">{post.age}</p>
        </div>
        {post.callout && (
          <span className="community-category community-category--callout">
            VENDOR CALLOUT
          </span>
        )}
        <button
          type="button"
          className="community-more"
          aria-label={`Request actions for ${post.callout?.title ?? post.request?.occasion ?? post.author}`}
          onClick={() => onActions(post)}
        >
          <MoreVertical size={20} />
        </button>
      </header>
      {post.callout ? (
        <>
          <p className="mt-5 flex gap-2 rounded-2xl border border-[#FFB547]/20 bg-[#FFB547]/5 p-3 text-xs text-[#B8C1D1]">
            <Info size={16} className="shrink-0 text-[#FFB547]" />
            <span>
              <strong className="text-[#FFB547]">Event opportunity:</strong> Organizer
              is offering spots. You sell independently and keep your revenue. Proper
              permits required.
            </span>
          </p>
          <h3 className="mt-4 font-bold">{post.callout.title}</h3>
          <p className="mt-2 text-sm leading-6 text-[#B6B7BC]">{post.body.join(" ")}</p>
          <dl className="community-request-details">
            {[
              ["Date", post.callout.date],
              ["Venue", post.callout.venue],
              ["Expected", post.callout.expected],
              ["Spots Open", `${post.callout.spots} spots`],
            ].map(([label, value]) => (
              <div
                className="rounded-2xl border border-white/5 bg-white/5 p-3"
                key={label}
              >
                <dt className="text-xs text-[#B8C1D1]">{label}</dt>
                <dd className="mt-1 text-sm">{value}</dd>
              </div>
            ))}
          </dl>
          <Button
            className="community-primary mt-3 w-full"
            onClick={() => onInterested(post)}
          >
            View interested trucks
          </Button>
          <p className="mt-3 border-t border-white/5 pt-2 text-sm text-[#B8C1D1]">
            {post.callout.interested} vendors interested
          </p>
        </>
      ) : (
        <>
          <span className="community-request-status">{post.status ?? "Posted"}</span>
          <p className="mt-4 text-sm leading-6 break-words">{post.body.join(" ")}</p>
          <CommunityRequestDetails post={post} />
          {ongoing ? (
            <Button
              className="community-primary mt-4 w-full"
              onClick={() => onTrack(post)}
            >
              Track order
            </Button>
          ) : (
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-white/5 pt-4">
              <span className="flex items-center gap-2 text-sm text-[#B8C1D1]">
                <MessageCircle size={16} />
                {post.request?.offers ?? 0} offers
              </span>
              <Button className="community-primary" onClick={() => onOffers(post)}>
                View offers
              </Button>
            </div>
          )}
        </>
      )}
    </article>
  );
}
