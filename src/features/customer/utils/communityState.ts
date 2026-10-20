import type { FileUploadItemValue } from "@/components/forms/FileUpload/file-upload.types";
import {
  communityPosts,
  type CommunityPost,
} from "@/features/customer/data/community.data";
import {
  communityMyRequests,
  communityQuotes,
} from "@/features/customer/data/community-requests.data";
import {
  communityComposerSchema,
  communityIssueSchema,
  emptyCommunityComposer,
  type CommunityComposerValues,
} from "@/features/customer/schemas/community.schema";

export type CommunityScreen =
  "home" | "location" | "compose" | "interested" | "quotes" | "payment" | "track";
export type CommunityOverlay = {
  kind: "actions" | "issue" | "confirmed";
  postId: string;
} | null;
export type CommunityState = {
  posts: CommunityPost[];
  screen: CommunityScreen;
  selectedId: string | null;
  quoteId: string | null;
  overlay: CommunityOverlay;
  hiddenIds: string[];
  truckDecisions: Record<string, "invited" | "declined">;
};
export const initialCommunityState: CommunityState = {
  posts: [
    ...communityPosts,
    ...communityMyRequests.filter((post) => post.status !== "Requested"),
    ...communityMyRequests.filter((post) => post.status === "Requested"),
  ],
  screen: "home",
  selectedId: null,
  quoteId: null,
  overlay: null,
  hiddenIds: [],
  truckDecisions: {},
};
export type CommunityAction =
  | { type: "navigate"; screen: CommunityScreen; postId?: string; quoteId?: string }
  | { type: "overlay"; overlay: CommunityOverlay }
  | { type: "hide"; id: string }
  | { type: "restore" }
  | { type: "delete"; id: string }
  | { type: "save"; post: CommunityPost }
  | { type: "truck"; postId: string; truckId: string; decision: "invited" | "declined" }
  | { type: "confirm-booking"; postId: string; quoteId: string }
  | { type: "approve"; id: string }
  | { type: "ignore-quote"; id: string; quoteId: string }
  | { type: "issue"; id: string; details: string };

export function communityReducer(
  state: CommunityState,
  action: CommunityAction,
): CommunityState {
  if (action.type === "navigate") {
    if (
      ["interested", "quotes", "payment", "track"].includes(action.screen) &&
      !state.posts.some((post) => post.id === action.postId)
    )
      return state;
    return {
      ...state,
      screen: action.screen,
      selectedId: action.postId ?? null,
      quoteId: action.quoteId ?? null,
      overlay: null,
    };
  }
  if (action.type === "overlay") {
    if (
      action.overlay &&
      !state.posts.some((post) => post.id === action.overlay?.postId)
    )
      return state;
    return { ...state, overlay: action.overlay };
  }
  if (action.type === "hide")
    return {
      ...state,
      hiddenIds: [...new Set([...state.hiddenIds, action.id])],
      overlay: null,
    };
  if (action.type === "restore") return { ...state, hiddenIds: [] };
  if (action.type === "delete") {
    if (!state.posts.some((post) => post.id === action.id && post.own)) return state;
    return {
      ...state,
      posts: state.posts.filter((post) => post.id !== action.id),
      overlay: null,
      screen: "home",
      selectedId: null,
    };
  }
  if (action.type === "save") {
    const exists = state.posts.some((post) => post.id === action.post.id);
    return {
      ...state,
      posts: exists
        ? state.posts.map((post) => (post.id === action.post.id ? action.post : post))
        : [action.post, ...state.posts],
      screen: "home",
      selectedId: null,
      overlay: null,
    };
  }
  if (action.type === "truck") {
    const key = `${action.postId}:${action.truckId}`;
    const delta =
      Number(state.truckDecisions[key] === "declined") -
      Number(action.decision === "declined");
    return {
      ...state,
      truckDecisions: { ...state.truckDecisions, [key]: action.decision },
      posts: state.posts.map((post) =>
        post.id === action.postId && post.callout
          ? {
              ...post,
              callout: {
                ...post.callout,
                interested: Math.max(0, post.callout.interested + delta),
              },
            }
          : post,
      ),
    };
  }
  if (action.type === "confirm-booking") {
    if (
      state.screen !== "payment" ||
      state.selectedId !== action.postId ||
      !communityQuotes.some((quote) => quote.id === action.quoteId) ||
      !state.posts.some((post) => post.id === action.postId && post.request)
    )
      return state;
    return {
      ...state,
      posts: state.posts.map((post) =>
        post.id === action.postId
          ? { ...post, status: "Ongoing", acceptedQuoteId: action.quoteId }
          : post,
      ),
      quoteId: action.quoteId,
      overlay: { kind: "confirmed", postId: action.postId },
    };
  }
  if (action.type === "approve")
    return {
      ...state,
      posts: state.posts.map((post) =>
        post.id === action.id && post.status === "Ongoing"
          ? { ...post, status: "Completed" }
          : post,
      ),
    };
  if (action.type === "ignore-quote")
    return {
      ...state,
      posts: state.posts.map((post) =>
        post.id === action.id
          ? {
              ...post,
              ignoredQuoteIds: [
                ...new Set([...(post.ignoredQuoteIds ?? []), action.quoteId]),
              ],
              request: post.request
                ? {
                    ...post.request,
                    offers: Math.max(
                      0,
                      post.request.offers -
                        Number(!post.ignoredQuoteIds?.includes(action.quoteId)),
                    ),
                  }
                : undefined,
            }
          : post,
      ),
    };
  const parsed = communityIssueSchema.safeParse({ details: action.details });
  if (!parsed.success) return state;
  return {
    ...state,
    posts: state.posts.map((post) =>
      post.id === action.id ? { ...post, issue: parsed.data.details } : post,
    ),
    overlay: null,
  };
}

export function getCommunityComposerValues(
  post: CommunityPost,
): CommunityComposerValues {
  if (post.composerValues)
    return { ...post.composerValues, menus: [...post.composerValues.menus] };
  const request = post.request;
  const parsed = request ? new Date(request.date) : null;
  return {
    ...emptyCommunityComposer,
    category: post.category,
    body: post.body.join("\n"),
    itemName: "",
    eventType: request?.occasion ?? "",
    date:
      parsed && Number.isFinite(parsed.getTime())
        ? parsed.toISOString().slice(0, 10)
        : "",
    time: request ? "11:00" : "",
    location: request?.location ?? "",
    guests: request?.guests ?? "",
    budget: request?.budget ?? "",
  };
}

export function createCommunityPost(
  id: string,
  values: CommunityComposerValues,
  city: string,
  files: FileUploadItemValue[],
  existing?: CommunityPost,
): CommunityPost | null {
  const parsed = communityComposerSchema.safeParse(values);
  if (!parsed.success || files.length > 5 || files.some((file) => file.error))
    return null;
  const clean = parsed.data;
  return {
    ...existing,
    id,
    author: "You",
    badge: "Local preview",
    age: "Local preview",
    city,
    category: clean.category,
    body:
      clean.category === "For sale"
        ? [clean.itemName, clean.body]
        : clean.body.split("\n"),
    likes: existing?.likes ?? 0,
    comments: existing?.comments ?? 0,
    own: true,
    attachments: files,
    composerValues: clean,
    status:
      clean.category === "Need a truck" ? (existing?.status ?? "Posted") : undefined,
    request:
      clean.category === "Need a truck"
        ? {
            occasion: clean.eventType,
            date: clean.date,
            location: clean.location,
            guests: clean.guests,
            budget: clean.budget,
            offers: existing?.request?.offers ?? 0,
          }
        : undefined,
  };
}
