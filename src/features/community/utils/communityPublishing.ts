import type { CommunityPost } from "../schemas/community.schema";
import {
  createCommunitySchema,
  updateCommunitySchema,
  type CommunityWrite,
  type CommunityPatch,
  type CommunityMedia,
} from "../schemas/communityPublishing.schema";
import type { CommunityComposerValues } from "@/features/customer/schemas/community.schema";
import { emptyCommunityComposer } from "@/features/customer/schemas/community.schema";
import { categoryValues } from "./communityAdapters";
export const communityFileLimit = 10 * 1024 * 1024;
export function communityFileError(files: File[]) {
  if (files.length > 5) return "Attach up to five files.";
  for (const file of files)
    if (
      !["image/jpeg", "image/png", "application/pdf"].includes(file.type) ||
      !file.size ||
      file.size > communityFileLimit
    )
      return "Use nonempty JPG, PNG or PDF files, up to 10 MB each.";
}
export async function communityFileSignature(file: File) {
  const b = new Uint8Array(await file.slice(0, 8).arrayBuffer());
  return file.type === "image/jpeg"
    ? b[0] === 255 && b[1] === 216 && b[2] === 255
    : file.type === "image/png"
      ? [137, 80, 78, 71, 13, 10, 26, 10].every((v, i) => v === b[i])
      : file.type === "application/pdf" &&
        [37, 80, 68, 70, 45].every((v, i) => v === b[i]);
}
const events: Record<string, NonNullable<CommunityWrite["eventType"]>> = {
  "Corporate Event": "CORPORATE_EVENT",
  "Birthday Party": "BIRTHDAY_PARTY",
  "Wedding Reception": "WEDDING_RECEPTION",
  "Graduation Party": "GRADUATION_PARTY",
  "Community Event": "COMMUNITY_EVENT",
  Fundraiser: "FUNDRAISER",
  Other: "OTHER",
};
export function communityBudget(value: string) {
  const m =
    /^\s*\$?\s*(\d+(?:,\d{3})*(?:\.\d{1,2})?)\s*(?:[-–]\s*\$?\s*(\d+(?:,\d{3})*(?:\.\d{1,2})?))?\s*$/.exec(
      value,
    );
  if (!m) throw new Error("Enter a numeric budget or range, such as 500–800.");
  const low = Number(m[1].replaceAll(",", ""));
  const high = m[2] ? Number(m[2].replaceAll(",", "")) : low;
  if (!Number.isFinite(low) || low > high || high > 9999999999.99)
    throw new Error("Enter a valid budget range within the supported amount limit.");
  return { budgetMin: low, budgetMax: high };
}
export function composerPayload(values: CommunityComposerValues): CommunityWrite {
  const category = categoryValues[values.category];
  const body = {
    category,
    description: values.body.trim(),
    ...(category === "FOR_SALE" ? { title: values.itemName.trim() } : {}),
    ...(category === "NEED_TRUCK"
      ? {
          eventType: events[values.eventType],
          eventDate: values.date,
          startTime: values.time,
          address: values.location.trim(),
          guestCount: Number(values.guests),
          ...(values.budget.trim() ? communityBudget(values.budget) : {}),
          preferredMenuItems: values.menus,
        }
      : {}),
  };
  return createCommunitySchema.parse(body);
}
export function composerFromPost(post: CommunityPost): CommunityComposerValues {
  const label = Object.entries(categoryValues).find(
    ([, v]) => v === post.category,
  )?.[0] as CommunityComposerValues["category"];
  return {
    ...emptyCommunityComposer,
    category: label,
    body: post.description ?? "",
    itemName: post.category === "FOR_SALE" ? post.title : "",
    eventType: Object.entries(events).find(([, v]) => v === post.eventType)?.[0] ?? "",
    date: post.eventDate?.slice(0, 10) ?? "",
    time: post.startTime?.slice(11, 16) ?? "",
    location: post.address ?? "",
    guests: post.guestCount == null ? "" : String(post.guestCount),
    budget:
      post.budgetMin == null && post.budgetMax == null
        ? ""
        : `${post.budgetMin ?? ""}–${post.budgetMax ?? ""}`,
    menus: post.preferredMenuItems ?? [],
  };
}
export function composerPatch(
  before: CommunityComposerValues,
  after: CommunityComposerValues,
  allowEmpty = false,
) {
  if (before.category !== after.category)
    throw new Error("Post category cannot be changed.");
  const patch: CommunityPatch = {};
  if (before.body !== after.body) patch.description = after.body.trim();
  if (after.category === "For sale" && before.itemName !== after.itemName)
    patch.title = after.itemName.trim();
  if (after.category === "Need a truck") {
    if (before.eventType !== after.eventType) patch.eventType = events[after.eventType];
    if (before.date !== after.date) patch.eventDate = after.date;
    if (before.time !== after.time) patch.startTime = after.time;
    if (before.location !== after.location) patch.address = after.location;
    if (before.guests !== after.guests) patch.guestCount = Number(after.guests);
    if (before.budget !== after.budget)
      Object.assign(patch, communityBudget(after.budget));
    if (JSON.stringify(before.menus) !== JSON.stringify(after.menus))
      patch.preferredMenuItems = after.menus;
  }
  return allowEmpty && !Object.keys(patch).length
    ? patch
    : updateCommunitySchema.parse(patch);
}
export function editableCommunityPost(
  post: CommunityPost | undefined,
  userId: string,
  action: "edit" | "delete",
) {
  return (
    !!post &&
    post.author?.id === userId &&
    post.viewer?.isOwner === true &&
    post.status === "OPEN" &&
    (!post.expiresAt || Date.parse(post.expiresAt) > Date.now()) &&
    post.counts?.offers === 0 &&
    (action === "edit"
      ? post.allowedActions?.canEdit === true
      : post.allowedActions?.canDelete === true)
  );
}
export async function publishCommunityDraft<T>(o: {
  body: CommunityWrite | CommunityPatch;
  editing?: boolean;
  files: File[];
  isCurrent: () => boolean;
  cached: (file: File) => CommunityMedia | undefined;
  upload: (file: File) => Promise<CommunityMedia>;
  remember: (file: File, media: CommunityMedia) => void;
  save: (body: CommunityWrite | CommunityPatch) => Promise<T>;
}) {
  const error = communityFileError(o.files);
  if (error) throw new Error(error);
  const schema = o.editing ? updateCommunitySchema : createCommunitySchema;
  const body = schema.parse(o.body);
  if ((body.media?.length ?? 0) + o.files.length > 5)
    throw new Error(
      "A post can contain at most five attachments, including saved attachments.",
    );
  const media: CommunityMedia[] = [];
  for (const file of o.files) {
    if (!o.isCurrent()) throw new Error("The publishing session changed.");
    let item = o.cached(file);
    if (!item) {
      item = await o.upload(file);
      if (!o.isCurrent()) throw new Error("The publishing session changed.");
      o.remember(file, item);
    }
    media.push(item);
  }
  if (!o.isCurrent()) throw new Error("The publishing session changed.");
  // Existing remote media is retained; selected local files only append confirmed metadata.
  const result = await o.save(
    schema.parse({
      ...body,
      ...(media.length ? { media: [...(body.media ?? []), ...media] } : {}),
    }),
  );
  if (!o.isCurrent()) throw new Error("The publishing session changed.");
  return result;
}
