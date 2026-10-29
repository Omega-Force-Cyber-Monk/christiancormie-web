import type {
  CommunityCategory,
  CommunityList,
  CommunityPost,
} from "../schemas/community.schema";
import { remoteMedia } from "@/utils/files/remoteMedia";

export const communityCategories = [
  "All",
  "Community",
  "Need a truck",
  "Callout",
  "For sale",
  "Hiring / jobs",
  "Community help",
] as const;
export const categoryValues: Record<
  Exclude<(typeof communityCategories)[number], "All">,
  CommunityCategory
> = {
  Community: "COMMUNITY",
  "Need a truck": "NEED_TRUCK",
  Callout: "VENDOR_CALLOUT",
  "For sale": "FOR_SALE",
  "Hiring / jobs": "HIRING_JOBS",
  "Community help": "COMMUNITY_HELP",
};
export function readCommunityFilters(params: URLSearchParams) {
  const label = communityCategories.find((v) => v === params.get("category")) ?? "All";
  return {
    label,
    category: label === "All" ? undefined : categoryValues[label],
    mine: ["my-posts", "my-requests"].includes(params.get("view") ?? ""),
  };
}
export function communityFilterParams(
  params: URLSearchParams,
  key?: "category" | "view",
  value?: string,
) {
  const next = new URLSearchParams(params);
  if (key && value) next.set(key, value);
  else next.delete("category");
  // No coordinate provider or server city/search contract exists for these controls.
  for (const name of [
    "offset",
    "page",
    "city",
    "search",
    "latitude",
    "longitude",
    "radiusKm",
  ])
    next.delete(name);
  return next;
}
export function nextCommunityOffset(page: CommunityList, previous: number) {
  const next = page.pagination.nextOffset;
  return page.items.length && next !== null && next > previous && next <= 100000
    ? next
    : undefined;
}
export function uniqueCommunityPosts(pages: CommunityList[]) {
  const posts = new Map<string, CommunityPost>();
  for (const page of pages) for (const post of page.items) posts.set(post.id, post);
  return [...posts.values()];
}
export function communityPresentation(post: CommunityPost) {
  const category =
    Object.entries(categoryValues).find(([, v]) => v === post.category)?.[0] ??
    post.category;
  return {
    category: category === "Callout" ? "Vendor callout" : category,
    author: post.author?.displayName || "Author unavailable",
    avatar: remoteMedia(post.author?.avatarUrl),
    created: new Date(post.createdAt).toLocaleString("en-US"),
    media: (post.media ?? []).flatMap((m) => {
      const url = remoteMedia(m.mediaUrl);
      return url ? [{ ...m, url }] : [];
    }),
    eventDate:
      post.eventDate && /^\d{4}-\d{2}-\d{2}/.test(post.eventDate)
        ? post.eventDate.slice(0, 10)
        : "Unavailable",
    budget:
      post.budgetMin == null && post.budgetMax == null
        ? "Unavailable"
        : `${post.budgetMin ?? "Unavailable"} – ${post.budgetMax ?? "Unavailable"} (currency unavailable)`,
  };
}
