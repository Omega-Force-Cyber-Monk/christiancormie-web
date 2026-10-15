import { MapPin, Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router";

import { Modal } from "@/components/overlays/Modal/Modal";
import { NoResultsState } from "@/components/states/NoResultsState";
import { Button } from "@/components/ui/Button";
import { ROUTES } from "@/constants/routes";
import {
  CommunityComposerDialog,
  CommunityLocationDialog,
} from "@/features/customer/components/community/CommunityDialogs";
import { CommunityPostCard } from "@/features/customer/components/community/CommunityPostCard";
import { CommunityReportPreview } from "@/features/customer/components/community/CommunityReportPreview";
import { TruckImage } from "@/features/customer/components/discover/DiscoverTruckCard";
import { FeedShareDialog } from "@/features/customer/components/feed/FeedShareDialog";
import {
  communityCategories,
  communityPosts,
  type CommunityPost,
} from "@/features/customer/data/community.data";
import type { CommunityPostValues } from "@/features/customer/schemas/community.schema";
import "@/features/customer/components/community/community.css";

export default function CustomerCommunityPage() {
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();
  const { hash } = useLocation();
  const city = params.get("city")?.trim() || "San Antonio, TX";
  const rawCategory = params.get("category");
  const category = communityCategories.find((item) => item === rawCategory) ?? "All";
  const mine = params.get("view") === "my-requests";
  const [posts, setPosts] = useState(communityPosts);
  const [hiddenIds, setHiddenIds] = useState<string[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(
    communityPosts[0]?.id ?? null,
  );
  const [dialog, setDialog] = useState<"location" | "compose" | null>(null);
  const [sharedPost, setSharedPost] = useState<CommunityPost | null>(null);
  const [detailPost, setDetailPost] = useState<CommunityPost | null>(null);
  const [status, setStatus] = useState("");
  const visibleIds = posts
    .filter(
      (post) =>
        !hiddenIds.includes(post.id) &&
        post.city.toLowerCase().includes(city.toLowerCase()) &&
        (category === "All" || post.category === category) &&
        (!mine || (post.own && post.category === "Need a truck")),
    )
    .map((post) => post.id);
  const selected =
    posts.find((post) => post.id === selectedId && visibleIds.includes(post.id)) ??
    null;

  useEffect(() => {
    const post = communityPosts.find((item) => `#${item.id}` === hash);
    if (post) document.getElementById(post.id)?.scrollIntoView({ block: "start" });
  }, [hash]);

  function updateFilter(key: string, value: string) {
    setParams(
      (current) => {
        const next = new URLSearchParams(current);
        next.set(key, value);
        return next;
      },
      { replace: true, preventScrollReset: true },
    );
  }

  function hidePost(post: CommunityPost) {
    setHiddenIds((current) =>
      current.includes(post.id) ? current : [...current, post.id],
    );
    setSelectedId(null);
    setStatus("Post hidden from this local preview. Use Restore hidden posts to undo.");
    requestAnimationFrame(() =>
      document.getElementById("community-restore-posts")?.focus(),
    );
  }

  function addPost(values: CommunityPostValues) {
    const id = `local-community-${posts.filter((post) => post.own).length + 1}`;
    setPosts((current) => [
      {
        id,
        author: "You",
        badge: "Local preview",
        age: "Local preview",
        city,
        category: values.category,
        body: values.body.split("\n"),
        likes: 0,
        comments: 0,
        own: true,
      },
      ...current,
    ]);
    setDialog(null);
    setParams(
      (current) => {
        const next = new URLSearchParams(current);
        next.set("view", "all");
        next.set("category", "All");
        return next;
      },
      { replace: true, preventScrollReset: true },
    );
    setStatus(
      "Post added to this page's local preview. Nothing was published or sent.",
    );
  }

  return (
    <div className="customer-community-page">
      <h1 className="sr-only">Community � static design preview</h1>
      <div className="community-topbar">
        <div className="community-location">
          <MapPin aria-hidden="true" className="shrink-0 text-[#FF5733]" size={16} />
          <span className="font-semibold">{city}</span>
          <span className="text-[#B8C1D1]">� 25 mi �</span>
          <button
            className="min-h-11 font-semibold text-[#FF5733] focus-visible:outline"
            onClick={() => setDialog("location")}
            type="button"
          >
            Change
          </button>
        </div>
        <button
          aria-label="Create local community post preview"
          className="community-add"
          onClick={() => setDialog("compose")}
          type="button"
        >
          <Plus aria-hidden="true" size={22} />
        </button>
      </div>
      <div className="community-layout">
        <section aria-label="Community posts" id="community-posts">
          <div aria-label="Community view" className="community-view-tabs" role="group">
            <button
              aria-pressed={!mine}
              className={!mine ? "community-view-active" : ""}
              onClick={() => updateFilter("view", "all")}
              type="button"
            >
              All Posts
            </button>
            <button
              aria-pressed={mine}
              className={mine ? "community-view-active" : ""}
              onClick={() => updateFilter("view", "my-requests")}
              type="button"
            >
              My Requests
            </button>
          </div>
          <div aria-label="Post category" className="community-filters" role="group">
            {communityCategories.map((item) => (
              <button
                aria-pressed={category === item}
                className={category === item ? "community-filter-active" : ""}
                key={item}
                onClick={() => updateFilter("category", item)}
                type="button"
              >
                {item}
              </button>
            ))}
          </div>
          {hiddenIds.length > 0 && (
            <Button
              className="mb-4"
              id="community-restore-posts"
              onClick={() => {
                setHiddenIds([]);
                setStatus("Hidden sample posts restored.");
              }}
            >
              Restore hidden posts ({hiddenIds.length})
            </Button>
          )}
          {!visibleIds.length && (
            <div className="mb-4">
              <NoResultsState />
              {mine && (
                <p className="mt-3 text-sm leading-6 text-[#B8C1D1]">
                  My Requests includes only local previews you create with the Need a
                  truck category.
                </p>
              )}
              <Button
                className="mt-3"
                onClick={() => {
                  setParams({});
                  setHiddenIds([]);
                }}
              >
                Reset filters and restore posts
              </Button>
            </div>
          )}
          <div className="flex flex-col gap-4">
            {posts.map((post) => (
              <div hidden={!visibleIds.includes(post.id)} key={post.id}>
                <CommunityPostCard
                  onActions={(target) => {
                    setSelectedId(target.id);
                    requestAnimationFrame(() =>
                      document.getElementById("community-post-actions")?.focus(),
                    );
                  }}
                  onImage={setDetailPost}
                  onOffers={setDetailPost}
                  post={post}
                />
              </div>
            ))}
          </div>
          <p
            aria-live="polite"
            className="mt-4 text-xs leading-5 text-[#B8C1D1]"
            role="status"
          >
            {status ||
              "Static community preview. Activity, event details, offers, and locations are sample content."}
          </p>
        </section>
        <CommunityReportPreview
          key={selected?.id ?? "no-selection"}
          onBack={() => {
            void navigate(ROUTES.CUSTOMER_FEED);
          }}
          onCancel={() => {
            setSelectedId(null);
            setStatus("Post actions cancelled.");
            requestAnimationFrame(() => {
              if (selected)
                document.getElementById(`community-actions-${selected.id}`)?.focus();
            });
          }}
          onCopy={setSharedPost}
          onHide={hidePost}
          selected={selected}
        />
      </div>
      {dialog === "location" && (
        <CommunityLocationDialog
          city={city}
          onApply={(value) => {
            updateFilter("city", value);
            setDialog(null);
          }}
          onClose={() => setDialog(null)}
        />
      )}
      {dialog === "compose" && (
        <CommunityComposerDialog onClose={() => setDialog(null)} onCreate={addPost} />
      )}
      {sharedPost && (
        <FeedShareDialog
          basePath={ROUTES.CUSTOMER_COMMUNITY}
          onClose={() => setSharedPost(null)}
          post={sharedPost}
        />
      )}
      <Modal
        isOpen={detailPost !== null}
        onClose={() => setDetailPost(null)}
        titleId="community-detail-title"
      >
        {detailPost && (
          <div className="overflow-y-auto p-6 pt-12">
            <h2 className="mb-4 text-xl font-semibold" id="community-detail-title">
              {detailPost.request ? "Sample offers preview" : "Sample callout photo"}
            </h2>
            {detailPost.image && (
              <TruckImage
                alt="Grilled meat platter from the supplied community design"
                className="community-expanded-photo max-h-[60dvh] w-full rounded-xl"
                name={detailPost.author}
                src={detailPost.image}
              />
            )}
            {detailPost.request && (
              <p className="text-sm leading-6 text-[#B8C1D1]">
                The design shows {detailPost.request.offers} offers. Offer details were
                not supplied; live offers and vendor contact require backend
                integration.
              </p>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
