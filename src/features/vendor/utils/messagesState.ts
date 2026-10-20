import { z } from "zod";
import type { FileUploadItemValue } from "@/components/forms/FileUpload/file-upload.types";
import { vendorConversations } from "@/features/vendor/data/messages.data";
import type {
  VendorChatDraft,
  VendorChatMessage,
  VendorConversation,
} from "@/features/vendor/types/messages.types";
import { validateFile } from "@/utils/files/validateFile";
import { formatFileSize } from "@/utils/files/formatFileSize";
export const vendorMessageTextSchema = z.object({ text: z.string().trim() });
export const messageFileOptions = {
  allowedMimeTypes: ["image/jpeg", "image/png", "image/webp", "application/pdf"],
  allowedExtensions: ["jpg", "jpeg", "png", "webp", "pdf"],
};
export function validateVendorMessage(
  text: string,
  files: FileUploadItemValue[],
): string | undefined {
  if (!text.trim() && !files.length) return "Enter a message or attach a file.";
  for (const item of files) {
    const error = validateFile(item.file, messageFileOptions);
    if (error)
      return `${item.file.name}: ${error} Use JPG, PNG, WebP or PDF up to 5 MB per file.`;
  }
}
export function filterVendorConversations(
  conversations: VendorConversation[],
  query: string,
): VendorConversation[] {
  const term = query.trim().toLowerCase();
  return conversations.filter((c) =>
    `${c.name} ${c.contact} ${c.preview}`.toLowerCase().includes(term),
  );
}
export type VendorMessagesState = {
  conversations: VendorConversation[];
  selectedId: string;
  drafts: Record<string, VendorChatDraft>;
  mobileOpen: boolean;
  status: string;
};
export const initialVendorMessagesState = (): VendorMessagesState => ({
  conversations: structuredClone(vendorConversations),
  selectedId: "seoul-1",
  drafts: {},
  mobileOpen: false,
  status: "",
});
export type VendorMessagesAction =
  | { type: "select"; id: string }
  | { type: "back" }
  | { type: "draft"; id: string; text: string }
  | { type: "files"; id: string; files: FileUploadItemValue[] }
  | {
      type: "send";
      id: string;
      messageId: string;
      text: string;
      files: FileUploadItemValue[];
      time: string;
    }
  | { type: "unread"; id: string }
  | { type: "clear"; id: string };
export function vendorMessagesReducer(
  state: VendorMessagesState,
  action: VendorMessagesAction,
): VendorMessagesState {
  if (action.type === "back") return { ...state, mobileOpen: false };
  if (!state.conversations.some((c) => c.id === action.id)) return state;
  switch (action.type) {
    case "select":
      return {
        ...state,
        selectedId: action.id,
        mobileOpen: true,
        conversations: state.conversations.map((c) =>
          c.id === action.id ? { ...c, unread: 0 } : c,
        ),
      };
    case "draft": {
      if (state.drafts[action.id]?.text === action.text) return state;
      return {
        ...state,
        drafts: {
          ...state.drafts,
          [action.id]: {
            files: state.drafts[action.id]?.files ?? [],
            text: action.text,
          },
        },
      };
    }
    case "files":
      return {
        ...state,
        drafts: {
          ...state.drafts,
          [action.id]: {
            text: state.drafts[action.id]?.text ?? "",
            files: [...action.files],
          },
        },
      };
    case "unread":
      return {
        ...state,
        conversations: state.conversations.map((c) =>
          c.id === action.id ? { ...c, unread: Math.max(1, c.unread) } : c,
        ),
        status: "Conversation marked unread in this preview.",
      };
    case "clear":
      return {
        ...state,
        conversations: state.conversations.map((c) =>
          c.id === action.id
            ? {
                ...c,
                messages: [],
                preview: "No messages in this local preview.",
                unread: 0,
                age: "",
              }
            : c,
        ),
        status: "Conversation history cleared locally. Nothing was deleted remotely.",
      };
    case "send": {
      const parsed = vendorMessageTextSchema.safeParse({ text: action.text });
      if (
        !parsed.success ||
        !action.messageId ||
        validateVendorMessage(parsed.data.text, action.files) ||
        state.conversations.some((c) =>
          c.messages.some((m) => m.id === action.messageId),
        )
      )
        return state;
      const message: VendorChatMessage = {
        id: action.messageId,
        direction: "out",
        text: parsed.data.text,
        time: action.time,
        local: true,
        attachments: action.files.map((item) => ({
          id: item.id,
          name: item.file.name,
          size: formatFileSize(item.file.size),
          file: item.file,
        })),
      };
      return {
        ...state,
        drafts: { ...state.drafts, [action.id]: { text: "", files: [] } },
        conversations: state.conversations.map((c) =>
          c.id === action.id
            ? {
                ...c,
                messages: [...c.messages, message],
                preview:
                  parsed.data.text || action.files.map((f) => f.file.name).join(", "),
                age: "Now",
                unread: 0,
              }
            : c,
        ),
        status: "Message saved in this local preview. It was not delivered.",
      };
    }
  }
}
