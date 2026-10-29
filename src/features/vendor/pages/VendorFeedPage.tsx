import { useAppSelector } from "@/app/hooks";
import { VendorFeedComposer } from "@/features/vendor/components/feed/VendorFeedComposer";
import { VendorFeedPostCard } from "@/features/vendor/components/feed/VendorFeedPostCard";
import { useSocialFeed } from "@/features/social/utils/useSocialFeed";
import { usePublishPost } from "@/features/social/utils/usePublishPost";
import { useVendorContext } from "@/features/vendor/utils/useVendorContext";
import { ErrorState } from "@/components/states/ErrorState";
import { EmptyState } from "@/components/states/EmptyState";
import { Button } from "@/components/ui/Button";
import "@/features/vendor/components/feed/feed.css";
export default function VendorFeedPage() {
  const session = useAppSelector((s) => s.auth.sessionId);
  return <VendorFeedContent key={session} />;
}
function VendorFeedContent() {
  const { query, posts } = useSocialFeed("following");
  const context = useVendorContext();
  const publisher = usePublishPost();
  const trucks = context.trucks.currentData ?? [];
  const truck = trucks.length === 1 ? trucks[0] : undefined;
  const allowed = context.allowed && truck?.status === "ACTIVE";
  return (
    <div className="vendor-feed-page">
      <h1 className="sr-only">Vendor Feed</h1>
      <div className="vendor-feed-stream">
        <VendorFeedComposer
          disabled={!allowed}
          avatar={context.identity?.imageUrl ?? ""}
          onPost={async (text) =>
            Boolean(
              allowed && (await publisher.publish({ text, foodTruckId: truck?.id })),
            )
          }
        />
        {!allowed && (
          <p role="status">
            Posting requires a verified accessible vendor and exactly one active owned
            truck.
          </p>
        )}
        {publisher.error && (
          <p role="alert" className="text-sm text-red-300">
            {publisher.error}
          </p>
        )}
        <section aria-label="Vendor feed posts">
          {query.isLoading ? (
            <p role="status">Loading posts…</p>
          ) : query.isError && !posts.length ? (
            <ErrorState onRetry={() => void query.refetch()} />
          ) : posts.length ? (
            posts.map((post) => (
              <VendorFeedPostCard key={post.id} post={post} busy={query.isFetching} />
            ))
          ) : (
            <EmptyState title="No posts yet" />
          )}
          {query.isFetching && <p role="status">Refreshing posts…</p>}
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
    </div>
  );
}
