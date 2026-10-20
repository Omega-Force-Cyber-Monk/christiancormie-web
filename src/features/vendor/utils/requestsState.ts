import { z } from "zod";
import sarah from "@/features/vendor/assets/requests/requests-sarah.webp";
import alex from "@/features/vendor/assets/requests/community-alex.webp";
import zara from "@/features/vendor/assets/requests/my-orders-zara.webp";
import truck from "@/features/vendor/assets/requests/community-2-truck.webp";
import food from "@/features/vendor/assets/requests/community-2-food.webp";

export type RequestEvent = {
  id: string;
  client: string;
  avatar: string;
  age: string;
  kind: string;
  date: string;
  time: string;
  location: string;
  guests: number;
  budget: string;
};
export const requestMenus = [
  "Personal Veggie Pizzas",
  "Caesar Salad Cups",
  "Garlic Breadsticks",
  "Gelato Cups",
];
export const requestDescription =
  "Looking for a taco truck for my daughter's 10th birthday! Preference for vegetarian options.";
const event = {
  kind: "Birthday Party",
  date: "Thu, Jul 18, 2025",
  time: "11:00 AM – 2:00 PM",
  location: "Golden Gate Park",
  guests: 50,
  budget: "$500–800",
};
export const bookingRequests: RequestEvent[] = [
  { ...event, id: "sarah", client: "Sarah Johnson", avatar: sarah, age: "2 hours ago" },
];
export const communityRequest: RequestEvent = {
  ...event,
  id: "alex-request",
  client: "Alex Thompson",
  avatar: alex,
  age: "2 hours ago",
};
export type VendorOrder = RequestEvent & {
  group: "Today" | "Upcoming";
  price: number;
  note?: string;
};
export const vendorOrders: VendorOrder[] = [
  {
    ...event,
    id: "alex-order",
    client: "Alex Thompson",
    avatar: alex,
    age: "2 hours left",
    group: "Today",
    price: 500,
    note: "Please set up at the outdoor patio area near Building 40. Badge access will be provided at security.",
  },
  {
    ...event,
    id: "zara-order",
    client: "Zara thompson",
    avatar: zara,
    age: "2 Days left",
    group: "Upcoming",
    price: 500,
  },
];
export type OwnPost = {
  id: string;
  title: string;
  category: "For sale" | "Community";
  body: string;
  image?: string;
  liked: boolean;
  likeCount: number;
  comments: string[];
  commentCount: number;
};
export const initialPosts: OwnPost[] = [
  {
    id: "truck",
    title: "Food truck",
    category: "For sale",
    image: truck,
    liked: false,
    likeCount: 8,
    comments: [],
    commentCount: 5,
    body: "Selling 2019 food trailer fully equipped. $15,000 obo. Includes fryer, flat top, POS system. Great condition!",
  },
  {
    id: "food",
    title: "",
    category: "Community",
    image: food,
    liked: false,
    likeCount: 8,
    comments: [],
    commentCount: 5,
    body: "Selling 2019 food trailer fully equipped. $15,000 obo. Includes fryer, flat top, POS system. Great condition!",
  },
];
const moneyInput = z
  .string()
  .trim()
  .regex(/^\d+(?:\.\d{1,2})?$/, "Enter a nonnegative amount with up to 2 decimals.")
  .refine(
    (v) => Number.isSafeInteger(Math.round(Number(v) * 100)),
    "Amount is too large.",
  );
export const quoteSchema = z
  .object({
    pricing: z.enum(["flat", "person"]),
    base: moneyInput.refine((v) => Number(v) > 0, "Enter an amount greater than zero."),
    payment: z.enum(["deposit", "full"]),
    deposit: z.string(),
    note: z.string().trim(),
    menus: z.array(z.string().trim().min(1)).min(1, "Add at least one menu item."),
    charges: z.array(
      z.object({
        id: z.string(),
        label: z.string().trim().min(1, "Enter a description."),
        amount: moneyInput,
      }),
    ),
  })
  .superRefine((data, ctx) => {
    if (data.payment === "deposit") {
      const result = moneyInput.safeParse(data.deposit);
      if (!result.success)
        ctx.addIssue({
          code: "custom",
          path: ["deposit"],
          message: result.error.issues[0]?.message ?? "Check deposit.",
        });
    }
  });
export type QuoteDraft = z.infer<typeof quoteSchema>;
export const defaultQuote = (): QuoteDraft => ({
  pricing: "flat",
  base: "1200",
  payment: "deposit",
  deposit: "240",
  note: "",
  menus: ["Burger", "Pizza"],
  charges: [{ id: "transport", label: "Transport cost", amount: "50" }],
});
export const dollars = (cents: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(cents / 100);
export function quoteTotals(draft: QuoteDraft, guests: number) {
  const cents = (v: string) =>
    /^\d+(?:\.\d{1,2})?$/.test(v) ? Math.round(Number(v) * 100) : 0;
  const base = cents(draft.base) * (draft.pricing === "person" ? guests : 1);
  const extras = draft.charges.reduce((sum, c) => sum + cents(c.amount), 0);
  const total = base + extras;
  const deposit = draft.payment === "full" ? total : cents(draft.deposit);
  return { base, extras, total, deposit, balance: total - deposit };
}
export function validateQuote(draft: QuoteDraft, guests: number): string | undefined {
  const result = quoteSchema.safeParse(draft);
  if (!result.success) return result.error.issues[0]?.message;
  const totals = quoteTotals(result.data, guests);
  if (!Number.isSafeInteger(totals.total)) return "The total is too large.";
  if (totals.deposit > totals.total) return "Deposit cannot exceed the total.";
  if (draft.payment === "deposit" && totals.deposit <= 0)
    return "Enter a deposit greater than zero.";
}
export const postSchema = z.object({
  title: z.string().trim(),
  body: z.string().trim().min(1, "Write something for your post."),
  category: z.enum(["For sale", "Community"]),
});
export type PostValues = z.infer<typeof postSchema>;
export const textSchema = z.object({
  text: z.string().trim().min(1, "Enter a message."),
});
export type RequestsView =
  | { type: "list" }
  | { type: "quote"; id: string }
  | { type: "orders" }
  | { type: "order"; id: string };
export type RequestsState = {
  view: RequestsView;
  tab: "bookings" | "community";
  own: boolean;
  hidden: string[];
  interested: boolean;
  passed: boolean;
  drafts: Record<string, QuoteDraft>;
  quotes: Record<string, QuoteDraft>;
  posts: OwnPost[];
};
export const initialRequestsState = (): RequestsState => ({
  view: { type: "list" },
  tab: "bookings",
  own: false,
  hidden: [],
  interested: false,
  passed: false,
  drafts: {},
  quotes: {},
  posts: structuredClone(initialPosts),
});
export type RequestsAction =
  | { type: "view"; view: RequestsView }
  | { type: "tab"; tab: RequestsState["tab"] }
  | { type: "own"; own: boolean }
  | { type: "hide"; id: string }
  | { type: "restore" }
  | { type: "interest" }
  | { type: "pass" }
  | { type: "draft" | "quote"; id: string; draft: QuoteDraft }
  | { type: "post"; post: OwnPost }
  | { type: "delete" | "like"; id: string }
  | { type: "comment"; id: string; text: string };
export function requestsReducer(
  state: RequestsState,
  action: RequestsAction,
): RequestsState {
  switch (action.type) {
    case "view": {
      const view = action.view;
      if (
        view.type === "quote" &&
        ![...bookingRequests, communityRequest].some((e) => e.id === view.id)
      )
        return state;
      if (view.type === "order" && !vendorOrders.some((e) => e.id === view.id))
        return state;
      return { ...state, view };
    }
    case "tab":
      return { ...state, tab: action.tab };
    case "own":
      return { ...state, own: action.own };
    case "hide":
      return { ...state, hidden: [...new Set([...state.hidden, action.id])] };
    case "restore":
      return { ...state, hidden: [], passed: false };
    case "interest":
      return { ...state, interested: !state.interested };
    case "pass":
      return { ...state, passed: true };
    case "draft":
      return {
        ...state,
        drafts: { ...state.drafts, [action.id]: structuredClone(action.draft) },
      };
    case "quote": {
      const request = [...bookingRequests, communityRequest].find(
        (e) => e.id === action.id,
      );
      if (
        !request ||
        state.quotes[action.id] ||
        validateQuote(action.draft, request.guests)
      )
        return state;
      return {
        ...state,
        view: { type: "list" },
        drafts: { ...state.drafts, [action.id]: structuredClone(action.draft) },
        quotes: { ...state.quotes, [action.id]: structuredClone(action.draft) },
      };
    }
    case "post":
      return {
        ...state,
        posts: state.posts.some((p) => p.id === action.post.id)
          ? state.posts.map((p) => (p.id === action.post.id ? action.post : p))
          : [action.post, ...state.posts],
        tab: "community",
        own: true,
      };
    case "delete":
      return { ...state, posts: state.posts.filter((p) => p.id !== action.id) };
    case "like":
      return {
        ...state,
        posts: state.posts.map((p) =>
          p.id === action.id ? { ...p, liked: !p.liked } : p,
        ),
      };
    case "comment":
      return action.text.trim()
        ? {
            ...state,
            posts: state.posts.map((p) =>
              p.id === action.id
                ? { ...p, comments: [...p.comments, action.text.trim()] }
                : p,
            ),
          }
        : state;
  }
}
