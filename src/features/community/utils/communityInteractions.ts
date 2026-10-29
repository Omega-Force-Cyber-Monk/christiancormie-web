import type { CommunityPost } from "../schemas/community.schema";
import type {
  CommunityComment,
  CommunityInteraction,
} from "../schemas/communityInteractions.schema";
export function communityInteractionAllowed(
  post: CommunityPost | undefined,
  userId: string,
  role: string,
  publisher: boolean,
  action: CommunityInteraction["kind"],
) {
  if (action === "restore") return true; // Server checks visibility; no hidden-post directory is required.
  if (!post) return false;
  const owner = post.author?.id === userId && post.viewer?.isOwner === true;
  if (action === "comment")
    return post.allowPublicComments !== false || owner || role === "VENDOR"; // Targeted vendor visibility remains a backend check.
  if (action === "react") return true;
  if (action === "report" || action === "ignore")
    return (
      publisher &&
      post.viewer?.isOwner === false &&
      !!post.author &&
      post.author.id !== userId
    );
  if (
    role !== "VENDOR" ||
    !publisher ||
    owner ||
    !post.author ||
    post.viewer?.isOwner !== false ||
    post.author.id === userId ||
    post.category !== "VENDOR_CALLOUT"
  )
    return false;
  if (action === "withdraw") return post.viewer?.isInterested === true;
  return (
    post.status === "OPEN" &&
    (!post.expiresAt || Date.parse(post.expiresAt) > Date.now()) &&
    post.allowedActions?.canSendInterest === true &&
    post.viewer?.isInterested === false
  );
}
export function uniqueCommunityRows<T extends { id: string }>(
  pages: { items: T[] }[],
): T[] {
  const rows = new Map<string, T>();
  for (const page of pages) for (const row of page.items) rows.set(row.id, row);
  return [...rows.values()];
}
export function communityReplyLabel(
  comment: CommunityComment,
  rows: CommunityComment[],
) {
  if (!comment.parentCommentId) return "";
  const parent = rows.find((row) => row.id === comment.parentCommentId);
  return parent
    ? `Reply to ${parent.user.profile?.displayName ?? "author unavailable"}`
    : "Reply to a comment outside the loaded results";
}
