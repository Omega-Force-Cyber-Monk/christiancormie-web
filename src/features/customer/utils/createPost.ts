import { SAFE_PREVIEW_MIME_TYPES } from "@/utils/files/file.constants";
import { validateFile } from "@/utils/files/validateFile";
import type { PostDraft, PostMedia } from "@/features/customer/data/create-post.data";
import { createPostSchema } from "@/features/customer/schemas/create-post.schema";

export function addPostPhotos(current: PostMedia[], files: File[], id: () => string) {
  const errors: string[] = [];
  const media = [...current];
  for (const file of files) {
    const error = validateFile(file, {
      allowedMimeTypes: SAFE_PREVIEW_MIME_TYPES,
      allowedExtensions: ["jpg", "jpeg", "png", "webp"],
    });
    if (error) errors.push(`${file.name}: ${error}`);
    else media.push({ id: id(), name: file.name, kind: "file", file });
  }
  return { media, errors };
}

export const removePostPhoto = (media: PostMedia[], id: string) =>
  media.filter((item) => item.id !== id);
export const togglePostFriend = (ids: string[], id: string) =>
  ids.includes(id) ? ids.filter((item) => item !== id) : [...ids, id];
export const filterPostOptions = <T extends { name: string }>(
  items: readonly T[],
  query: string,
) =>
  items.filter((item) => item.name.toLowerCase().includes(query.trim().toLowerCase()));
export type LocalPost = PostDraft & { id: string };

export function submitLocalPost(
  posts: LocalPost[],
  draft: PostDraft,
  id: string,
): LocalPost[] {
  if (posts.some((post) => post.id === id)) return posts;
  const parsed = createPostSchema.safeParse(draft);
  if (!parsed.success) return posts;
  return [
    { ...parsed.data, media: [...draft.media], friendIds: [...draft.friendIds], id },
    ...posts,
  ];
}
