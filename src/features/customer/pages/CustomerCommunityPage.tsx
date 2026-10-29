import { MapPin, Plus } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useLocation, useSearchParams } from "react-router";
import { useAppSelector } from "@/app/hooks";
import {
  selectIsAuthenticated,
  selectCurrentRole,
} from "@/features/auth/store/auth.selectors";
import { Modal } from "@/components/overlays/Modal/Modal";
import { Button } from "@/components/ui/Button";
import { z } from "zod";
import {
  communityScope,
  useGetCommunityPostsInfiniteQuery,
  useGetMyCommunityPostsInfiniteQuery,
  useGetCommunityPostQuery,
  type CommunityListArg,
  type CommunityScope,
} from "@/features/community/api/community.api";
import {
  communityCategories,
  communityFilterParams,
  readCommunityFilters,
  uniqueCommunityPosts,
} from "@/features/community/utils/communityAdapters";
import { CommunityLocationView } from "@/features/customer/components/community/CommunityLocationView";
import { CommunityReadCard } from "@/features/customer/components/community/CommunityReadCard";
import { CommunityReadStates } from "@/features/customer/components/community/CommunityReadStates";
import { CommunityPublishingEditor } from "@/features/community/components/CommunityPublishingEditor";
import { useCommunityPublisher } from "@/features/community/utils/useCommunityPublishing";
import { useCommunityPostManagement } from "@/features/community/utils/useCommunityPostManagement";
import { editableCommunityPost } from "@/features/community/utils/communityPublishing";
import { ConfirmationDialog } from "@/components/overlays/ConfirmationDialog/ConfirmationDialog";
import "@/features/customer/components/community/community.css";

export default function CustomerCommunityPage() {
  const scope = useAppSelector(communityScope);
  const authenticated = useAppSelector(selectIsAuthenticated);
  const role = useAppSelector(selectCurrentRole);
  const [params] = useSearchParams();
  const { hash } = useLocation();
  const filters = readCommunityFilters(params);
  return authenticated && role === "CUSTOMER" ? (
    <CommunityWorkspace
      key={`${scope.sessionId}:${scope.userId}:${scope.role}:${filters.mine}:${filters.label}:${hash}`}
      scope={scope}
      initialId={hash.slice(1)}
    />
  ) : (
    <p role="status">A verified Customer session is required to view Community.</p>
  );
}

function CommunityWorkspace({
  scope,
  initialId,
}: {
  scope: CommunityScope;
  initialId: string;
}) {
  const [params, setParams] = useSearchParams();
  const filters = readCommunityFilters(params);
  const arg: CommunityListArg = {
    ...scope,
    filters: { ...(filters.category ? { category: filters.category } : {}), limit: 20 },
  };
  const all = useGetCommunityPostsInfiniteQuery(arg, { skip: filters.mine });
  const mine = useGetMyCommunityPostsInfiniteQuery(arg, { skip: !filters.mine });
  const query = filters.mine ? mine : all;
  const inaccessible =
    query.error &&
    "status" in query.error &&
    (query.error.status === 403 || query.error.status === 404);
  const posts = uniqueCommunityPosts(
    inaccessible ? [] : (query.currentData?.pages ?? []),
  );
  const [screen, setScreen] = useState<"home" | "location">("home");
  const [selectedId, setSelectedId] = useState(
    z.uuid().safeParse(initialId).success ? initialId : "",
  );
  const [photo, setPhoto] = useState<string | null>(null);
  const [composing, setComposing] = useState(false);
  const [editingId, setEditingId] = useState("");
  const publisher = useCommunityPublisher();
  const editQuery = useGetCommunityPostQuery(
    { ...scope, postId: editingId },
    { skip: !editingId },
  );
  const locationButton = useRef<HTMLButtonElement>(null);
  const previousScreen = useRef(screen);
  useEffect(() => {
    if (previousScreen.current === "location" && screen === "home")
      locationButton.current?.focus();
    previousScreen.current = screen;
  }, [screen]);
  function filter(key?: "view" | "category", value?: string) {
    setParams(communityFilterParams(params, key, value), {
      replace: true,
      preventScrollReset: true,
    });
  }
  const initialLoading = query.isLoading || (!query.currentData && query.isFetching);
  if (composing) {
    const post = editingId ? editQuery.currentData?.post : undefined;
    const cancel = () => {
      setComposing(false);
      setEditingId("");
    };
    if (
      editingId &&
      (!post || editQuery.error || !editableCommunityPost(post, scope.userId, "edit"))
    )
      return (
        <div className="customer-community-page">
          <Button onClick={cancel}>Back to Community</Button>
          <CommunityReadStates
            detail
            loading={editQuery.isLoading}
            fetching={editQuery.isFetching}
            error={editQuery.error}
            empty={!post}
            onRetry={() => void editQuery.refetch()}
          />
          <p>This post must still be open, unexpired and eligible for editing.</p>
        </div>
      );
    return (
      <div className="customer-community-page">
        <CommunityPublishingEditor
          key={editingId || "new"}
          post={post}
          onCancel={cancel}
          onDone={(id) => {
            cancel();
            setSelectedId(id);
          }}
        />
      </div>
    );
  }
  return (
    <div className="customer-community-page">
      {screen === "location" ? (
        <CommunityLocationView
          unavailable
          value={{ city: "", radius: "Any", pin: { x: 0, y: 0 } }}
          onApply={() => {}}
          onBack={() => setScreen("home")}
        />
      ) : (
        <>
          <h1 className="sr-only">Community</h1>
          <div
            className={`community-browse ${filters.mine ? "community-browse--mine" : ""}`}
          >
            <div className="community-topbar">
              <div className="community-location">
                <MapPin
                  aria-hidden="true"
                  className="shrink-0 text-[#FF5733]"
                  size={16}
                />
                <span className="font-semibold">All locations</span>
                <span className="text-[#B8C1D1]">
                  · Geographic filtering unavailable ·
                </span>
                <button
                  ref={locationButton}
                  className="min-h-11 font-semibold text-[#FF5733] focus-visible:outline"
                  type="button"
                  onClick={() => setScreen("location")}
                >
                  Change
                </button>
              </div>
              <button
                aria-label="Create Community post"
                className="community-add"
                type="button"
                disabled={!publisher.allowed}
                title={
                  !publisher.allowed
                    ? "Publishing eligibility is loading or unavailable; vendor onboarding may be required."
                    : undefined
                }
                onClick={() => setComposing(true)}
              >
                <Plus aria-hidden="true" size={22} />
              </button>
            </div>
            <section
              className="community-layout"
              aria-label="Community posts"
              id="community-posts"
            >
              <div
                aria-label="Community view"
                className="community-view-tabs"
                role="group"
              >
                <button
                  aria-pressed={!filters.mine}
                  className={!filters.mine ? "community-view-active" : ""}
                  type="button"
                  onClick={() => filter("view", "all")}
                >
                  All Posts
                </button>
                <button
                  aria-pressed={filters.mine}
                  className={filters.mine ? "community-view-active" : ""}
                  type="button"
                  onClick={() => filter("view", "my-posts")}
                >
                  My Posts
                </button>
              </div>
              <div
                aria-label="Post category"
                className="community-filters"
                role="group"
              >
                {communityCategories.map((item) => (
                  <button
                    aria-pressed={filters.label === item}
                    className={filters.label === item ? "community-filter-active" : ""}
                    type="button"
                    key={item}
                    onClick={() => filter("category", item)}
                  >
                    {item}
                  </button>
                ))}
              </div>
              <div className="mb-3 flex flex-wrap gap-3">
                <Button
                  disabled={query.isFetching}
                  onClick={() => void query.refetch()}
                >
                  Refresh posts
                </Button>
                <Button onClick={() => filter()}>Reset filters</Button>
              </div>
              <CommunityReadStates
                loading={initialLoading}
                fetching={query.isFetching}
                error={query.error}
                empty={!posts.length}
                mine={filters.mine}
                filtered={!!filters.category}
                onRetry={() => void query.refetch()}
              />
              <div className="community-post-list">
                {posts.map((post) => (
                  <CommunityReadCard
                    interactive
                    key={post.id}
                    post={post}
                    mine={filters.mine}
                    onDetails={() => setSelectedId(post.id)}
                    onImage={setPhoto}
                  />
                ))}
              </div>
              {query.currentData && !inaccessible && (
                <p className="mt-4 text-sm text-[#B8C1D1]">
                  {posts.length} loaded · {query.currentData.pages[0]?.pagination.total}{" "}
                  matching posts at last refresh
                </p>
              )}
              {query.hasNextPage && !inaccessible && (
                <Button
                  className="community-primary mt-4"
                  disabled={query.isFetching}
                  onClick={() => void query.fetchNextPage()}
                >
                  {query.isFetchingNextPage
                    ? "Loading more…"
                    : query.isFetchNextPageError
                      ? "Retry loading more"
                      : "Load more"}
                </Button>
              )}
            </section>
          </div>
          <p role="status" className="mt-4 text-xs leading-5 text-[#B8C1D1]">
            Offers, bookings and organizer invitations remain unavailable.
          </p>
        </>
      )}
      {selectedId && (
        <CommunityDetail
          scope={scope}
          postId={selectedId}
          onClose={() => setSelectedId("")}
          onImage={setPhoto}
          onEdit={() => {
            setEditingId(selectedId);
            setSelectedId("");
            setComposing(true);
          }}
        />
      )}
      <Modal
        isOpen={photo !== null}
        onClose={() => setPhoto(null)}
        titleId="community-photo-title"
      >
        {photo && (
          <div className="overflow-y-auto p-6 pt-12">
            <h2 id="community-photo-title" className="mb-4 text-xl font-semibold">
              Community attachment
            </h2>
            <img
              src={photo}
              alt="Selected Community attachment"
              className="community-expanded-photo max-h-[60dvh] w-full rounded-xl object-contain"
            />
          </div>
        )}
      </Modal>
    </div>
  );
}

function CommunityDetail({
  scope,
  postId,
  onClose,
  onImage,
  onEdit,
}: {
  scope: CommunityScope;
  postId: string;
  onClose: () => void;
  onImage: (url: string) => void;
  onEdit: () => void;
}) {
  const query = useGetCommunityPostQuery({ ...scope, postId });
  // A definitive permission/missing response supersedes a previously cached detail.
  const status =
    query.error && "status" in query.error ? query.error.status : undefined;
  const post = status === 403 || status === 404 ? undefined : query.currentData?.post;
  const management = useCommunityPostManagement(
    query.error ? undefined : post,
    onClose,
  );
  return (
    <>
      <Modal
        isOpen
        onClose={onClose}
        titleId="community-detail-title"
        panelClassName="community-drawer"
      >
        <div className="overflow-y-auto p-6 pt-12">
          <h2 id="community-detail-title" className="mb-4 text-xl font-semibold">
            Community post
          </h2>
          <CommunityReadStates
            detail
            loading={query.isLoading}
            fetching={query.isFetching}
            error={query.error}
            empty={!post}
            onRetry={() => void query.refetch()}
          />
          {post && (
            <CommunityReadCard
              interactive
              detail
              post={post}
              onDetails={() => {}}
              onImage={onImage}
              onEdit={management.canEdit && !query.isFetching ? onEdit : undefined}
              onDelete={
                management.canDelete && !query.isFetching
                  ? management.requestDelete
                  : undefined
              }
              busy={management.pending}
            />
          )}
          <p className="mt-4 text-xs text-[#B8C1D1]">
            Offers and booking actions remain unavailable. Organizer invitations are not
            supported.
          </p>
        </div>
      </Modal>
      {management.confirmationProps && (
        <ConfirmationDialog {...management.confirmationProps} />
      )}
    </>
  );
}
