import type { FileUploadItemValue } from "@/components/forms/FileUpload/file-upload.types";
import { validateFile } from "@/utils/files/validateFile";
import { communityFileLimit } from "@/features/community/utils/communityPublishing";
import type {
  GeneralPostCategory,
  VendorPostCategory,
} from "@/features/vendor/data/create-posts.data";
import {
  generalPostSchema,
  truckPostSchema,
  emptyTruckPost,
  type GeneralPostValues,
  type TruckPostValues,
} from "@/features/vendor/schemas/create-posts.schema";

export const postFileOptions = {
  allowedMimeTypes: ["image/jpeg", "image/png", "application/pdf"],
  allowedExtensions: ["jpg", "jpeg", "png", "pdf"],
  maxSizeBytes: communityFileLimit,
};
export const postFilesError = (items: FileUploadItemValue[]): string | undefined => {
  if (items.length > 5) return "Attach up to 5 files.";
  for (const item of items) {
    const error = validateFile(item.file, postFileOptions);
    if (error)
      return `${item.file.name}: ${error} Use JPG, PNG or PDF, up to 10 MB per file.`;
  }
};
export function appendPostFiles(
  current: FileUploadItemValue[],
  files: File[],
  id: () => string = () => crypto.randomUUID(),
): { files: FileUploadItemValue[]; error?: string } {
  if (current.length + files.length > 5)
    return {
      files: current,
      error: "Attach up to 5 files. Remove an attachment or select fewer files.",
    };
  const additions = files.map((file) => ({
    id: id(),
    file,
    error: validateFile(file, postFileOptions) ?? undefined,
  }));
  return { files: [...current, ...additions] };
}
export type LocalVendorPost =
  | {
      id: string;
      kind: "general";
      values: GeneralPostValues;
      files: FileUploadItemValue[];
    }
  | { id: string; kind: "truck"; values: TruckPostValues; files: [] };
export type VendorCreatePostState = {
  generalDrafts: Partial<Record<GeneralPostCategory, GeneralPostValues>>;
  truckDraft: TruckPostValues;
  files: Partial<Record<GeneralPostCategory, FileUploadItemValue[]>>;
  posts: LocalVendorPost[];
  success: LocalVendorPost | null;
};
export const initialVendorCreatePostState = (): VendorCreatePostState => ({
  generalDrafts: {},
  truckDraft: emptyTruckPost(),
  files: {},
  posts: [],
  success: null,
});
export type CreatePostAction =
  | { type: "general-draft"; values: GeneralPostValues }
  | { type: "truck-draft"; values: TruckPostValues }
  | { type: "files"; category: GeneralPostCategory; files: FileUploadItemValue[] }
  | { type: "save"; post: LocalVendorPost }
  | { type: "edit" }
  | { type: "reset"; category: VendorPostCategory };
export function vendorCreatePostReducer(
  state: VendorCreatePostState,
  action: CreatePostAction,
): VendorCreatePostState {
  switch (action.type) {
    case "general-draft":
      return {
        ...state,
        generalDrafts: {
          ...state.generalDrafts,
          [action.values.category]: { ...action.values },
        },
      };
    case "truck-draft":
      return {
        ...state,
        truckDraft: { ...action.values, menus: [...action.values.menus] },
      };
    case "files":
      return {
        ...state,
        files: { ...state.files, [action.category]: [...action.files] },
      };
    case "edit":
      return { ...state, success: null };
    case "reset":
      return action.category === "truck"
        ? { ...state, truckDraft: emptyTruckPost(), success: null }
        : {
            ...state,
            generalDrafts: { ...state.generalDrafts, [action.category]: undefined },
            files: { ...state.files, [action.category]: [] },
            success: null,
          };
    case "save": {
      const post = action.post;
      if (!post.id || state.posts.some((p) => p.id === post.id)) return state;
      if (post.kind === "truck") {
        const parsed = truckPostSchema.safeParse(post.values);
        if (!parsed.success) return state;
        const saved: LocalVendorPost = { ...post, values: parsed.data, files: [] };
        return {
          ...state,
          truckDraft: { ...parsed.data, menus: [...parsed.data.menus] },
          success: saved,
          posts: [...state.posts, saved],
        };
      }
      const parsed = generalPostSchema.safeParse(post.values);
      if (!parsed.success || postFilesError(post.files)) return state;
      const saved: LocalVendorPost = {
        ...post,
        values: parsed.data,
        files: [...post.files],
      };
      return {
        ...state,
        generalDrafts: {
          ...state.generalDrafts,
          [parsed.data.category]: { ...parsed.data },
        },
        files: { ...state.files, [parsed.data.category]: [...post.files] },
        success: saved,
        posts: [...state.posts, saved],
      };
    }
  }
}
