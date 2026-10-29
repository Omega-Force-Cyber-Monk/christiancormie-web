import type {
  AdminCommunityPostDto,
  AdminReviewDto,
} from "@/features/admin/types/admin.dto";

export const communityCategories: Record<string, string> = {
  "All posts": "",
  "Need a truck": "NEED_TRUCK",
  "Vendor callout": "VENDOR_CALLOUT",
  "For sale": "FOR_SALE",
  "Hiring / jobs": "HIRING_JOBS",
  "Community help": "COMMUNITY_HELP",
  Community: "COMMUNITY",
};
export const toAdminPost = (post: AdminCommunityPostDto) => ({
  ...post,
  source: post,
  displayId: post.postId,
  authorName: post.author?.name ?? "N/A",
  content: post.content ?? "N/A",
  reported: post.isReported === true,
});
export const toAdminReview = (review: AdminReviewDto) => ({
  ...review,
  sourceRecord: review,
  displayId: review.reviewId,
  customerName: review.customer?.name ?? "N/A",
  vendorName: review.vendor?.businessName ?? "N/A",
  reported: review.isReported === true,
  content: review.contentHidden
    ? "Review text hidden"
    : (review.visibleContent ?? review.content ?? "N/A"),
});
export const reviewCategory = (filter: string) =>
  filter === "Reported only" ? "REPORTED" : undefined;
