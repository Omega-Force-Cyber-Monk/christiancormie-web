import { useEffect, useState } from "react";
import { useLocation, useSearchParams } from "react-router";

import { Modal } from "@/components/overlays/Modal/Modal";
import { EmptyState } from "@/components/states/EmptyState";
import { TruckImage } from "@/features/customer/components/discover/DiscoverTruckCard";
import { FeedPostCard } from "@/features/customer/components/feed/FeedPostCard";
import { FeedShareDialog } from "@/features/customer/components/feed/FeedShareDialog";
import { feedPosts, type FeedPost } from "@/features/customer/data/feed.data";
import "@/features/customer/components/feed/feed.css";

export default function CustomerFeedPage() {
  const [params, setParams] = useSearchParams();
  const audience = params.get("audience") === "for-you" ? "for-you" : "following";
  const [sharedPost, setSharedPost] = useState<FeedPost | null>(null);
  const [imagePost, setImagePost] = useState<FeedPost | null>(null);
  const { hash } = useLocation();
  const posts =
    audience === "following" ? feedPosts.filter((post) => post.followed) : feedPosts;

  useEffect(() => {
    const post = feedPosts.find((item) => `#${item.id}` === hash);
    if (post) document.getElementById(post.id)?.scrollIntoView({ block: "start" });
  }, [hash]);

  return (
    <div className="customer-feed-page">
      <h1 className="sr-only">Food truck feed — static preview</h1>
      <div className="feed-grid">
        <div aria-label="Feed audience" className="feed-audience" role="group">
          {[
            { id: "following", label: "Following" },
            { id: "for-you", label: "For you" },
          ].map(({ id, label }) => (
            <button
              aria-pressed={audience === id}
              className={`feed-audience-button ${audience === id ? "feed-audience-button--active" : ""}`}
              key={id}
              onClick={() =>
                setParams(
                  (current) => {
                    const next = new URLSearchParams(current);
                    next.set("audience", id);
                    return next;
                  },
                  { replace: true, preventScrollReset: true },
                )
              }
              type="button"
            >
              {label}
            </button>
          ))}
        </div>
        <section
          aria-label={`${audience === "following" ? "Following" : "For you"} sample posts`}
          className="feed-stream"
        >
          {posts.length ? (
            posts.map((post) => (
              <FeedPostCard
                key={post.id}
                onImage={setImagePost}
                onShare={setSharedPost}
                post={post}
              />
            ))
          ) : (
            <EmptyState
              title="No sample posts"
              description="There are no sample posts in this feed."
            />
          )}
        </section>
      </div>
      <p aria-live="polite" className="feed-preview-note" role="status">
        Static feed preview ·{" "}
        {audience === "for-you"
          ? "For you shows the same three supplied sample posts. "
          : ""}
        Reactions and comments stay on this page.
      </p>
      {sharedPost && (
        <FeedShareDialog onClose={() => setSharedPost(null)} post={sharedPost} />
      )}
      <Modal
        isOpen={imagePost !== null}
        onClose={() => setImagePost(null)}
        titleId="feed-photo-title"
      >
        {imagePost && (
          <div className="overflow-y-auto p-6 pt-12">
            <h2 className="mb-4 text-xl font-semibold" id="feed-photo-title">
              {imagePost.author} — sample photo
            </h2>
            <TruckImage
              alt={imagePost.imageDescription}
              className="feed-expanded-photo max-h-[65dvh] w-full rounded-xl"
              name={imagePost.author}
              src={imagePost.image}
            />
          </div>
        )}
      </Modal>
    </div>
  );
}
