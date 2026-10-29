import { useState } from "react";
import { useSearchParams } from "react-router";
import { useAppSelector } from "@/app/hooks";
import { Modal } from "@/components/overlays/Modal/Modal";
import { EmptyState } from "@/components/states/EmptyState";
import { ErrorState } from "@/components/states/ErrorState";
import { Button } from "@/components/ui/Button";
import { TruckImage } from "@/features/customer/components/discover/DiscoverTruckCard";
import { FeedPostCard } from "@/features/customer/components/feed/FeedPostCard";
import { FeedShareDialog } from "@/features/customer/components/feed/FeedShareDialog";
import { useSocialFeed } from "@/features/social/utils/useSocialFeed";
import type { SocialCard } from "@/features/social/utils/feedAdapters";
import "@/features/customer/components/feed/feed.css";
export default function CustomerFeedPage() {
  const [params, setParams] = useSearchParams();
  const audience = params.get("audience") === "for-you" ? "explore" : "following";
  const session = useAppSelector((s) => s.auth.sessionId);
  return (
    <CustomerFeedContent
      key={`${session}:${audience}`}
      audience={audience}
      onAudience={(id) =>
        setParams(
          (current) => {
            const next = new URLSearchParams(current);
            next.set("audience", id === "explore" ? "for-you" : "following");
            return next;
          },
          { preventScrollReset: true },
        )
      }
    />
  );
}
function CustomerFeedContent({
  audience,
  onAudience,
}: {
  audience: "following" | "explore";
  onAudience: (id: "following" | "explore") => void;
}) {
  const { query, posts } = useSocialFeed(audience);
  const [shared, setShared] = useState<SocialCard | null>(null);
  const [image, setImage] = useState<SocialCard | null>(null);
  return (
    <div className="customer-feed-page">
      <h1 className="sr-only">Social feed</h1>
      <div className="feed-grid">
        <div aria-label="Feed audience" className="feed-audience" role="group">
          {[
            { id: "following", label: "Following" },
            { id: "explore", label: "Explore" },
          ].map(({ id, label }) => (
            <button
              aria-pressed={audience === id}
              className={`feed-audience-button ${audience === id ? "feed-audience-button--active" : ""}`}
              key={id}
              onClick={() => onAudience(id as typeof audience)}
              type="button"
            >
              {label}
            </button>
          ))}
        </div>
        <section className="feed-stream" aria-label="Social feed posts">
          {query.isLoading ? (
            <p role="status">Loading posts…</p>
          ) : query.isError && !posts.length ? (
            <ErrorState onRetry={() => void query.refetch()} />
          ) : posts.length ? (
            posts.map((post) => (
              <FeedPostCard
                key={post.id}
                post={post}
                onShare={setShared}
                onImage={setImage}
                busy={query.isFetching}
              />
            ))
          ) : (
            <EmptyState title="No posts yet" />
          )}
          {query.isFetching && <p role="status">Loading or refreshing posts…</p>}
          {query.isError && posts.length > 0 && (
            <ErrorState onRetry={() => void query.refetch()} />
          )}
          <Button
            disabled={!query.hasNextPage || query.isFetching}
            onClick={() => void query.fetchNextPage()}
          >
            More posts
          </Button>
        </section>
      </div>
      {shared && <FeedShareDialog post={shared} onClose={() => setShared(null)} />}
      <Modal
        isOpen={Boolean(image)}
        onClose={() => setImage(null)}
        titleId="feed-image-title"
      >
        {image && (
          <div className="p-6 pt-12">
            <h2 id="feed-image-title">Post by {image.author}</h2>
            {image.images.map((src, index) => (
              <TruckImage
                key={src}
                src={src}
                name={image.author}
                alt={`${image.imageAlt} — photo ${index + 1}`}
                className="max-h-[65dvh] w-full object-contain"
              />
            ))}
          </div>
        )}
      </Modal>
    </div>
  );
}
