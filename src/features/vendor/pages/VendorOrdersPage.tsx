import { RequestOwnPostCard } from "@/features/vendor/components/requests/RequestOwnPostCard";
import { RequestOrderDetails } from "@/features/vendor/components/requests/RequestOrderDetails";
import { ArrowLeft, Plus, Users } from "lucide-react";
import { useEffect, useReducer, useRef, useState } from "react";
import { ConfirmationDialog } from "@/components/overlays/ConfirmationDialog/ConfirmationDialog";
import { useConfirmation } from "@/components/overlays/ConfirmationDialog/useConfirmation";
import { VendorHomeDialog } from "@/features/vendor/components/home/VendorHomeDialog";
import {
  BookingRequestCard,
  OrderCard,
} from "@/features/vendor/components/requests/RequestCards";
import { RequestQuoteForm } from "@/features/vendor/components/requests/RequestQuoteForm";
import {
  RequestPostForm,
  RequestTextForm,
} from "@/features/vendor/components/requests/RequestForms";
import {
  bookingRequests,
  communityRequest,
  initialRequestsState,
  requestsReducer,
  vendorOrders,
  type OwnPost,
} from "@/features/vendor/utils/requestsState";
import "@/features/vendor/components/requests/requests.css";

type Preview =
  | { type: "post"; id?: string }
  | { type: "comments"; id: string }
  | { type: "message"; id: string }
  | { type: "offers" }
  | { type: "vendors" }
  | { type: "location"; id: string }
  | { type: "call"; id: string };
export default function VendorOrdersPage() {
  const [state, dispatch] = useReducer(
    requestsReducer,
    undefined,
    initialRequestsState,
  );
  const [preview, setPreview] = useState<Preview | null>(null);
  const [status, setStatus] = useState("");
  const [messages, setMessages] = useState<Record<string, string[]>>({});
  const { confirm, confirmationProps } = useConfirmation();
  const heading = useRef<HTMLDivElement>(null);
  const mounted = useRef(false);
  useEffect(() => {
    if (mounted.current) heading.current?.focus();
    mounted.current = true;
  }, [state.view]);
  const view = state.view;
  const order =
    view.type === "order" ? vendorOrders.find((o) => o.id === view.id) : undefined;
  const quoteEvent =
    view.type === "quote"
      ? [...bookingRequests, communityRequest].find((r) => r.id === view.id)
      : undefined;
  const selectedOrder =
    preview && "id" in preview
      ? vendorOrders.find((o) => o.id === preview.id)
      : undefined;
  const selectedPost =
    preview && "id" in preview
      ? state.posts.find((p) => p.id === preview.id)
      : undefined;
  const hide = (id: string) => {
    dispatch({ type: "hide", id });
    setStatus("Request ignored in this preview. Use Restore hidden to bring it back.");
  };
  const restore = () => {
    dispatch({ type: "restore" });
    setStatus("Hidden requests restored.");
  };
  const showQuote = (id: string) =>
    dispatch({ type: "view", view: { type: "quote", id } });
  const back = (toOrders = false) =>
    dispatch({ type: "view", view: { type: toOrders ? "orders" : "list" } });
  const postSave = (post: OwnPost) => {
    dispatch({ type: "post", post });
    setPreview(null);
    setStatus("Post saved locally. Nothing was published.");
  };
  return (
    <div className="vendor-requests-page">
      <div ref={heading} tabIndex={-1} className="outline-none">
        {quoteEvent ? (
          <RequestQuoteForm
            key={quoteEvent.id}
            event={quoteEvent}
            draft={state.quotes[quoteEvent.id] ?? state.drafts[quoteEvent.id]}
            readOnly={!!state.quotes[quoteEvent.id]}
            onBack={() => back()}
            onSave={(draft) => dispatch({ type: "draft", id: quoteEvent.id, draft })}
            onQuote={(draft) => {
              dispatch({ type: "quote", id: quoteEvent.id, draft });
              setStatus(
                `Quote for ${quoteEvent.client} saved locally for review. It has not been delivered.`,
              );
            }}
          />
        ) : order ? (
          <RequestOrderDetails
            key={order.id}
            order={order}
            onBack={() => back(true)}
            onLocation={() => setPreview({ type: "location", id: order.id })}
            onMessage={() => setPreview({ type: "message", id: order.id })}
            onCall={() => setPreview({ type: "call", id: order.id })}
          />
        ) : view.type === "orders" ? (
          <section className="request-orders-page">
            <div className="request-page-heading">
              <button
                type="button"
                className="request-back"
                aria-label="Back to requests"
                onClick={() => back()}
              >
                <ArrowLeft size={20} />
              </button>
              <h1>My Orders</h1>
            </div>
            {(["Today", "Upcoming"] as const).map((group) => (
              <section key={group} className="mt-7">
                <h2 className="mb-4 text-base font-semibold">{group}</h2>
                <div className="space-y-4">
                  {vendorOrders
                    .filter((o) => o.group === group)
                    .map((o) => (
                      <OrderCard
                        key={o.id}
                        order={o}
                        onMessage={() => setPreview({ type: "message", id: o.id })}
                        onDetails={() =>
                          dispatch({ type: "view", view: { type: "order", id: o.id } })
                        }
                      />
                    ))}
                </div>
              </section>
            ))}
          </section>
        ) : (
          <section
            className={`request-list-page ${state.tab === "community" ? "request-community-page" : ""} ${state.own && state.tab === "community" ? "request-own-page" : ""}`}
          >
            <div className="mb-6 flex items-center justify-between gap-3">
              <h1 className="text-xl font-semibold">Requests</h1>
              <button className="request-cyan" type="button" onClick={() => back(true)}>
                My orders
              </button>
            </div>
            <div className="request-tabs" aria-label="Request categories">
              {(["bookings", "community"] as const).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  aria-pressed={state.tab === tab}
                  onClick={() => dispatch({ type: "tab", tab })}
                >
                  {tab === "bookings" ? "Bookings" : "Community"}
                  <span>
                    {tab === "bookings"
                      ? bookingRequests.filter((r) => !state.hidden.includes(r.id))
                          .length
                      : Number(!state.hidden.includes(communityRequest.id)) +
                        Number(!state.passed)}
                  </span>
                </button>
              ))}
            </div>
            {state.tab === "bookings" ? (
              <div className="mt-6 space-y-5">
                {bookingRequests
                  .filter((r) => !state.hidden.includes(r.id))
                  .map((event) => (
                    <BookingRequestCard
                      key={event.id}
                      event={event}
                      quoted={!!state.quotes[event.id]}
                      onIgnore={() => hide(event.id)}
                      onQuote={() => showQuote(event.id)}
                    />
                  ))}
                {bookingRequests.every((r) => state.hidden.includes(r.id)) && (
                  <div className="request-empty">
                    <h2>No booking requests</h2>
                    <p>All sample booking requests have been ignored.</p>
                    <button
                      type="button"
                      className="request-secondary"
                      onClick={restore}
                    >
                      Restore hidden
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <>
                <div className="my-6 flex items-center gap-3">
                  <button
                    className={!state.own ? "request-cyan" : "request-secondary"}
                    aria-pressed={!state.own}
                    type="button"
                    onClick={() => dispatch({ type: "own", own: false })}
                  >
                    All
                  </button>
                  <button
                    className={state.own ? "request-cyan" : "request-secondary"}
                    aria-pressed={state.own}
                    type="button"
                    onClick={() => dispatch({ type: "own", own: true })}
                  >
                    My posts
                  </button>
                  <button
                    className="request-primary ml-auto"
                    type="button"
                    aria-label="Create community post"
                    onClick={() => setPreview({ type: "post" })}
                  >
                    <Plus size={20} />
                  </button>
                </div>
                {state.own ? (
                  <div className="space-y-5">
                    {state.posts.map((post) => (
                      <RequestOwnPostCard
                        key={post.id}
                        post={post}
                        onEdit={() => setPreview({ type: "post", id: post.id })}
                        onLike={() => dispatch({ type: "like", id: post.id })}
                        onComments={() => setPreview({ type: "comments", id: post.id })}
                        onDelete={() =>
                          confirm({
                            title: "Delete local post?",
                            description:
                              "This removes the post from this preview only.",
                            confirmText: "Delete post",
                            variant: "danger",
                            onConfirm: () => {
                              dispatch({ type: "delete", id: post.id });
                              setStatus("Local post deleted.");
                            },
                          })
                        }
                      />
                    ))}
                    {!state.posts.length && (
                      <div className="request-empty">
                        <h2>No posts yet</h2>
                        <p>Create a local community post using the + button.</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-6">
                    {!state.hidden.includes(communityRequest.id) && (
                      <BookingRequestCard
                        community
                        event={communityRequest}
                        quoted={!!state.quotes[communityRequest.id]}
                        onIgnore={() => hide(communityRequest.id)}
                        onQuote={() => showQuote(communityRequest.id)}
                        onOffers={() => setPreview({ type: "offers" })}
                      />
                    )}
                    {!state.passed && (
                      <article className="request-callout-card">
                        <div className="flex items-center gap-3">
                          <div className="grid size-11 place-items-center rounded-full bg-[#273348] text-xs">
                            JM
                          </div>
                          <div>
                            <h2 className="font-semibold">Jennifer Martinez</h2>
                            <p className="mt-1 text-xs text-[#B8C1D1]">2 hours ago</p>
                          </div>
                        </div>
                        <span className="request-callout-tag">VENDOR CALLOUT</span>
                        <p className="my-4 rounded-lg border border-amber-400/20 bg-amber-400/10 p-3 text-xs leading-5 text-[#FFCE70]">
                          Event opportunity: Organizer is offering spots. You sell
                          independently and keep your revenue. Proper permits required.
                        </p>
                        <h3 className="mb-3 text-lg font-semibold">
                          Downtown Summer Block Party
                        </h3>
                        <p className="text-sm leading-6 text-[#B8C1D1]">
                          Annual community celebration with live music, kids activities,
                          and local vendors. Expecting 2,000+ attendees throughout the
                          day. Perfect opportunity for food trucks to showcase their
                          specialties!
                        </p>
                        <dl className="request-callout-facts">
                          {[
                            ["Date", "Saturday, June 15, 2026 · 11AM · 8PM"],
                            ["Venue", "Market Street Plaza, Downtown SF"],
                            ["Expected", "2,000 · 2,500 people"],
                            ["Spots Open", "6 spots"],
                          ].map(([label, value]) => (
                            <div key={label}>
                              <dt>{label}</dt>
                              <dd>{value}</dd>
                            </div>
                          ))}
                        </dl>
                        <div className="grid grid-cols-2 gap-3">
                          <button
                            className="request-secondary"
                            type="button"
                            onClick={() => {
                              dispatch({ type: "pass" });
                              setStatus(
                                "Callout passed locally. Use Restore hidden to undo.",
                              );
                            }}
                          >
                            Pass
                          </button>
                          <button
                            className="request-primary"
                            type="button"
                            aria-pressed={state.interested}
                            onClick={() => {
                              dispatch({ type: "interest" });
                              setStatus(
                                state.interested
                                  ? "Local interest removed."
                                  : "Interest noted locally. Organizer has not been contacted.",
                              );
                            }}
                          >
                            {state.interested ? "Interested" : "I'm interested"}
                          </button>
                        </div>
                        <button
                          type="button"
                          className="mt-4 flex min-h-11 items-center gap-2 text-sm text-[#B8C1D1]"
                          onClick={() => setPreview({ type: "vendors" })}
                        >
                          <Users size={18} />
                          {12 + Number(state.interested)} vendors interested
                        </button>
                      </article>
                    )}
                    {state.passed && state.hidden.includes(communityRequest.id) && (
                      <div className="request-empty">
                        <h2>No community requests</h2>
                        <p>
                          Restore hidden requests to view the sample opportunities
                          again.
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
            {(state.hidden.length > 0 || state.passed) && (
              <button
                className="mt-5 min-h-11 text-sm text-[#2ED3D1] underline"
                type="button"
                onClick={restore}
              >
                Restore hidden requests
              </button>
            )}
            <p className="mt-6 text-xs text-[#B8C1D1]">
              Sample Vendor data · changes remain in this page session.
            </p>
          </section>
        )}
      </div>
      <p role="status" className="mt-4 max-w-[760px] text-sm text-[#2ED3D1]">
        {status}
      </p>
      {preview && (
        <VendorHomeDialog
          title={
            preview.type === "post"
              ? `${selectedPost ? "Edit" : "Create"} community post`
              : preview.type === "comments"
                ? "Post comments"
                : preview.type === "message"
                  ? `Message ${selectedOrder?.client ?? "client"}`
                  : preview.type === "offers"
                    ? "Offers preview"
                    : preview.type === "vendors"
                      ? "Interested vendors"
                      : preview.type === "location"
                        ? "Event location"
                        : `Call ${selectedOrder?.client ?? "client"}`
          }
          onClose={() => setPreview(null)}
        >
          {preview.type === "post" && (
            <RequestPostForm
              post={selectedPost}
              onSave={(values) =>
                postSave({
                  ...selectedPost,
                  ...values,
                  id: selectedPost?.id ?? crypto.randomUUID(),
                  liked: selectedPost?.liked ?? false,
                  likeCount: selectedPost?.likeCount ?? 0,
                  comments: selectedPost?.comments ?? [],
                  commentCount: selectedPost?.commentCount ?? 0,
                })
              }
            />
          )}
          {preview.type === "comments" && selectedPost && (
            <>
              <p className="text-sm leading-6 text-[#B8C1D1]">
                {selectedPost.commentCount} comments are shown as an aggregate in the
                source design. Individual sample comments are not supplied.
              </p>
              <ul className="mt-4 space-y-3">
                {selectedPost.comments.map((text, i) => (
                  <li className="rounded-lg bg-[#1B2233] p-3 text-sm" key={i}>
                    <strong className="mb-1 block">You · local preview</strong>
                    {text}
                  </li>
                ))}
              </ul>
              <RequestTextForm
                label="Add a local comment"
                button="Add comment locally"
                onSubmit={(text) =>
                  dispatch({ type: "comment", id: selectedPost.id, text })
                }
              />
            </>
          )}
          {preview.type === "message" && selectedOrder && (
            <>
              <p className="text-sm leading-6 text-[#B8C1D1]">
                Local conversation preview for {selectedOrder.kind}. Messages are kept
                here only and are not delivered.
              </p>
              <ul className="mt-4 space-y-3">
                {(messages[selectedOrder.id] ?? []).map((text, i) => (
                  <li key={i} className="rounded-lg bg-[#1B2233] p-3 text-sm">
                    {text}
                    <span className="mt-1 block text-xs text-[#B8C1D1]">
                      Saved locally · not delivered
                    </span>
                  </li>
                ))}
              </ul>
              <RequestTextForm
                label="Message draft"
                button="Save message locally"
                onSubmit={(text) =>
                  setMessages((current) => ({
                    ...current,
                    [selectedOrder.id]: [...(current[selectedOrder.id] ?? []), text],
                  }))
                }
              />
            </>
          )}
          {preview.type === "offers" && (
            <p className="text-sm leading-6 text-[#B8C1D1]">
              The design shows 2 offers for {communityRequest.client}'s birthday party.
              Offer details are not supplied. Your own quote can be prepared from Send
              quote.
            </p>
          )}
          {preview.type === "vendors" && (
            <p className="text-sm leading-6 text-[#B8C1D1]">
              12 vendors are shown as interested in the sample event.
              {state.interested
                ? " Your local interest is also recorded."
                : " Use I'm interested to record your local interest."}{" "}
              Vendor identities are not supplied.
            </p>
          )}
          {preview.type === "location" && selectedOrder && (
            <>
              <p className="font-semibold">{selectedOrder.location}</p>
              <p className="mt-3 text-sm text-[#B8C1D1]">
                {selectedOrder.date} · {selectedOrder.time}
              </p>
              <p className="mt-4 text-sm leading-6 text-[#B8C1D1]">
                Precise coordinates and directions are not provided in this local
                preview.
              </p>
            </>
          )}
          {preview.type === "call" && (
            <p className="text-sm leading-6 text-[#B8C1D1]">
              No phone number is supplied for {selectedOrder?.client}. Calling requires
              verified client contact details.
            </p>
          )}
        </VendorHomeDialog>
      )}
      {confirmationProps && <ConfirmationDialog {...confirmationProps} />}
    </div>
  );
}
