import { MapPin, Pencil, Plus, Trash2 } from "lucide-react";
import { useEffect, useReducer, useRef, useState } from "react";
import { useLocation, useSearchParams } from "react-router";
import { Modal } from "@/components/overlays/Modal/Modal";
import { ConfirmationDialog } from "@/components/overlays/ConfirmationDialog/ConfirmationDialog";
import { useConfirmation } from "@/components/overlays/ConfirmationDialog/useConfirmation";
import { NoResultsState } from "@/components/states/NoResultsState";
import { Button } from "@/components/ui/Button";
import { ROUTES } from "@/constants/routes";
import {
  CommunityLocationView,
  type CommunityLocation,
} from "@/features/customer/components/community/CommunityLocationView";
import { CommunityComposer } from "@/features/customer/components/community/CommunityComposer";
import { CommunityPostCard } from "@/features/customer/components/community/CommunityPostCard";
import { CommunityRequestCard } from "@/features/customer/components/community/CommunityRequestCard";
import { CommunityInterestedView } from "@/features/customer/components/community/CommunityInterestedView";
import { CommunityOffersView } from "@/features/customer/components/community/CommunityOffersView";
import { CommunityTrackView } from "@/features/customer/components/community/CommunityTrackView";
import {
  CommunityIssueDialog,
  CommunityBookingConfirmation,
} from "@/features/customer/components/community/CommunityBookingDialogs";
import { CommunityReportPreview } from "@/features/customer/components/community/CommunityReportPreview";
import { TruckImage } from "@/features/customer/components/discover/DiscoverTruckCard";
import { FeedShareDialog } from "@/features/customer/components/feed/FeedShareDialog";
import {
  communityCategories,
  type CommunityPost,
} from "@/features/customer/data/community.data";
import { communityMyRequests } from "@/features/customer/data/community-requests.data";
import {
  communityReducer,
  createCommunityPost,
  getCommunityComposerValues,
  initialCommunityState,
} from "@/features/customer/utils/communityState";
import "@/features/customer/components/community/community.css";

const sampleRequestIds = new Set(communityMyRequests.map((post) => post.id));

export default function CustomerCommunityPage() {
  const [params, setParams] = useSearchParams();
  const { hash } = useLocation();
  const city = params.get("city")?.trim() || "San Antonio, TX";
  const category =
    communityCategories.find((item) => item === params.get("category")) ?? "All";
  const mine = params.get("view") === "my-requests";
  const [state, dispatch] = useReducer(communityReducer, initialCommunityState);
  const [location, setLocation] = useState<CommunityLocation>({
    city,
    radius: "25 mi",
    pin: { x: 48, y: 52 },
  });
  const [sharedPost, setSharedPost] = useState<CommunityPost | null>(null);
  const [photo, setPhoto] = useState<CommunityPost | null>(null);
  const [status, setStatus] = useState("");
  const root = useRef<HTMLDivElement>(null);
  const { confirm, confirmationProps } = useConfirmation();
  const selected = state.posts.find((post) => post.id === state.selectedId) ?? null;
  const overlayPost =
    state.posts.find((post) => post.id === state.overlay?.postId) ?? null;
  const actionPost = state.overlay?.kind === "actions" ? overlayPost : null;
  const visibleIds = state.posts
    .filter(
      (post) =>
        !state.hiddenIds.includes(post.id) &&
        post.city.toLowerCase().includes(city.toLowerCase()) &&
        (mine
          ? post.own && (post.request || post.category === "Callout")
          : !sampleRequestIds.has(post.id) &&
            (category === "All" || post.category === category)),
    )
    .map((post) => post.id);

  useEffect(() => {
    if (hash) {
      const id = hash.slice(1);
      document.getElementById(id)?.scrollIntoView({ block: "start" });
    }
  }, [hash]);
  useEffect(() => {
    if (state.screen !== "home") {
      const heading = root.current?.querySelector<HTMLElement>(
        ".community-page-heading h1",
      );
      heading?.setAttribute("tabindex", "-1");
      heading?.focus();
    }
  }, [state.screen]);

  function filter(key: string, value: string) {
    setParams(
      (current) => {
        const next = new URLSearchParams(current);
        next.set(key, value);
        return next;
      },
      { replace: true, preventScrollReset: true },
    );
  }
  function home() {
    dispatch({ type: "navigate", screen: "home" });
  }
  function hide(post: CommunityPost) {
    dispatch({ type: "hide", id: post.id });
    setStatus("Post hidden locally. Restore hidden posts to undo.");
  }
  function offers(post: CommunityPost) {
    dispatch({
      type: "navigate",
      screen:
        post.status === "Ongoing" || post.status === "Completed" ? "track" : "quotes",
      postId: post.id,
    });
  }
  function track(post: CommunityPost) {
    dispatch({ type: "navigate", screen: "track", postId: post.id });
  }

  return (
    <div className="customer-community-page" ref={root}>
      <div hidden={state.screen !== "home"}>
        <h1 className="sr-only">Community — static design preview</h1>
        <div className={`community-browse ${mine ? "community-browse--mine" : ""}`}>
          <div className="community-topbar">
            <div className="community-location">
              <MapPin
                aria-hidden="true"
                className="shrink-0 text-[#FF5733]"
                size={16}
              />
              <span className="font-semibold">{city}</span>
              <span className="text-[#B8C1D1]">· {location.radius} ·</span>
              <button
                className="min-h-11 font-semibold text-[#FF5733] focus-visible:outline"
                onClick={() => dispatch({ type: "navigate", screen: "location" })}
                type="button"
              >
                Change
              </button>
            </div>
            <button
              aria-label="Create local community post preview"
              className="community-add"
              onClick={() => dispatch({ type: "navigate", screen: "compose" })}
              type="button"
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
                aria-pressed={!mine}
                className={!mine ? "community-view-active" : ""}
                onClick={() => filter("view", "all")}
                type="button"
              >
                All Posts
              </button>
              <button
                aria-pressed={mine}
                className={mine ? "community-view-active" : ""}
                onClick={() => filter("view", "my-requests")}
                type="button"
              >
                My Requests
              </button>
            </div>
            {!mine && (
              <div
                aria-label="Post category"
                className="community-filters"
                role="group"
              >
                {communityCategories.map((item) => (
                  <button
                    aria-pressed={category === item}
                    className={category === item ? "community-filter-active" : ""}
                    key={item}
                    onClick={() => filter("category", item)}
                    type="button"
                  >
                    {item}
                  </button>
                ))}
              </div>
            )}
            {state.hiddenIds.length > 0 && (
              <Button
                className="mb-4"
                onClick={() => {
                  dispatch({ type: "restore" });
                  setStatus("Hidden posts restored.");
                }}
              >
                Restore hidden posts ({state.hiddenIds.length})
              </Button>
            )}
            {!visibleIds.length && (
              <div className="mb-4">
                <NoResultsState />
                <Button
                  className="mt-3"
                  onClick={() => {
                    setParams({});
                    dispatch({ type: "restore" });
                  }}
                >
                  Reset filters and restore posts
                </Button>
              </div>
            )}
            <div className="community-post-list">
              {state.posts.map((post) => (
                <div hidden={!visibleIds.includes(post.id)} key={post.id}>
                  {mine && (post.request || post.callout) ? (
                    <CommunityRequestCard
                      post={post}
                      onActions={(target) =>
                        dispatch({
                          type: "overlay",
                          overlay: { kind: "actions", postId: target.id },
                        })
                      }
                      onOffers={offers}
                      onTrack={track}
                      onInterested={(target) =>
                        dispatch({
                          type: "navigate",
                          screen: "interested",
                          postId: target.id,
                        })
                      }
                    />
                  ) : (
                    <CommunityPostCard
                      post={post}
                      onActions={(target) =>
                        dispatch({
                          type: "overlay",
                          overlay: { kind: "actions", postId: target.id },
                        })
                      }
                      onImage={setPhoto}
                      onOffers={offers}
                    />
                  )}
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
      {state.screen === "location" && (
        <CommunityLocationView
          value={{ ...location, city }}
          onBack={home}
          onApply={(next, asDefault) => {
            setLocation(next);
            filter("city", next.city);
            home();
            setStatus(
              asDefault
                ? "Default location saved for this page session."
                : "Location preview applied.",
            );
          }}
        />
      )}
      {state.screen === "compose" && (
        <CommunityComposer
          key={selected?.id ?? "new"}
          initial={selected ? getCommunityComposerValues(selected) : undefined}
          initialFiles={selected?.attachments}
          onCancel={home}
          onSave={(values, files) => {
            const post = createCommunityPost(
              selected?.id ?? `community-${crypto.randomUUID()}`,
              values,
              city,
              files,
              selected ?? undefined,
            );
            if (!post) return;
            dispatch({ type: "save", post });
            setParams(
              (current) => {
                const next = new URLSearchParams(current);
                next.set(
                  "view",
                  values.category === "Need a truck" ? "my-requests" : "all",
                );
                next.set("category", "All");
                return next;
              },
              { replace: true, preventScrollReset: true },
            );
            setStatus(
              selected
                ? "Changes saved locally."
                : "Post added locally. Nothing was published or sent.",
            );
          }}
        />
      )}
      {state.screen === "interested" && selected && (
        <CommunityInterestedView
          postId={selected.id}
          decisions={state.truckDecisions}
          onBack={home}
          onDecision={(truckId, decision) =>
            dispatch({ type: "truck", postId: selected.id, truckId, decision })
          }
        />
      )}
      {(state.screen === "quotes" || state.screen === "payment") && selected && (
        <CommunityOffersView
          key={selected.id}
          post={selected}
          payment={state.screen === "payment"}
          selectedQuoteId={state.quoteId}
          onBack={() =>
            state.screen === "payment"
              ? dispatch({ type: "navigate", screen: "quotes", postId: selected.id })
              : home()
          }
          onPayment={(quoteId) =>
            dispatch({
              type: "navigate",
              screen: "payment",
              postId: selected.id,
              quoteId,
            })
          }
          onIgnore={(quoteId) => {
            dispatch({ type: "ignore-quote", id: selected.id, quoteId });
            setStatus("Quote ignored locally.");
          }}
          onConfirm={(quoteId) =>
            dispatch({ type: "confirm-booking", postId: selected.id, quoteId })
          }
        />
      )}
      {state.screen === "track" && selected && (
        <CommunityTrackView
          post={selected}
          onBack={home}
          onIssue={() =>
            dispatch({
              type: "overlay",
              overlay: { kind: "issue", postId: selected.id },
            })
          }
          onApprove={() =>
            confirm({
              title: "Approve completion?",
              description:
                "Mark this sample booking complete locally. No funds will be released.",
              confirmText: "Approve preview",
              onConfirm: () => {
                dispatch({ type: "approve", id: selected.id });
                setStatus("Completion approved locally. No payment was released.");
              },
            })
          }
        />
      )}
      <p
        aria-live="polite"
        role="status"
        className="mt-4 text-xs leading-5 text-[#B8C1D1]"
      >
        {status ||
          "Static Community preview. Activity, dates, offers, and locations are sample content."}
      </p>
      {actionPost?.own && (
        <Modal
          isOpen
          onClose={() => dispatch({ type: "overlay", overlay: null })}
          titleId="community-request-actions-title"
          panelClassName="community-drawer community-request-actions"
        >
          <h2 id="community-request-actions-title" className="sr-only">
            Request actions
          </h2>
          <Button
            className="w-full justify-start"
            onClick={() =>
              dispatch({ type: "navigate", screen: "compose", postId: actionPost.id })
            }
          >
            <Pencil size={18} />
            Edit request
          </Button>
          <Button
            className="mt-2 w-full justify-start text-[#FF5733]"
            onClick={() =>
              confirm({
                title: "Are you sure you want to delete the post?",
                description: "This removes only this local sample request.",
                confirmText: "Yes",
                variant: "danger",
                onConfirm: () => {
                  dispatch({ type: "delete", id: actionPost.id });
                  setStatus("Request deleted locally.");
                },
              })
            }
          >
            <Trash2 size={18} />
            Delete request
          </Button>
        </Modal>
      )}
      {actionPost && !actionPost.own && (
        <CommunityReportPreview
          key={actionPost.id}
          selected={actionPost}
          onHide={hide}
          onCopy={(post) => {
            dispatch({ type: "overlay", overlay: null });
            setSharedPost(post);
          }}
          onCancel={() => dispatch({ type: "overlay", overlay: null })}
          onBack={() => {
            dispatch({ type: "overlay", overlay: null });
            home();
          }}
        />
      )}
      {state.overlay?.kind === "issue" && overlayPost && (
        <CommunityIssueDialog
          post={overlayPost}
          onClose={() => dispatch({ type: "overlay", overlay: null })}
          onSave={(details) => {
            dispatch({ type: "issue", id: overlayPost.id, details });
            setStatus("Issue saved locally. Nothing was sent.");
          }}
        />
      )}
      {state.overlay?.kind === "confirmed" && overlayPost && (
        <CommunityBookingConfirmation
          post={overlayPost}
          onClose={() => {
            dispatch({ type: "overlay", overlay: null });
            home();
          }}
          onView={() => track(overlayPost)}
        />
      )}
      {sharedPost && (
        <FeedShareDialog
          basePath={ROUTES.CUSTOMER_COMMUNITY}
          post={sharedPost}
          onClose={() => setSharedPost(null)}
        />
      )}
      <Modal
        isOpen={photo !== null}
        onClose={() => setPhoto(null)}
        titleId="community-photo-title"
      >
        {photo?.image && (
          <div className="overflow-y-auto p-6 pt-12">
            <h2 id="community-photo-title" className="mb-4 text-xl font-semibold">
              Sample callout photo
            </h2>
            <TruckImage
              name={photo.author}
              alt="Grilled meat platter from the Community design"
              src={photo.image}
              className="community-expanded-photo max-h-[60dvh] w-full rounded-xl"
            />
          </div>
        )}
      </Modal>
      {confirmationProps && <ConfirmationDialog {...confirmationProps} />}
    </div>
  );
}
