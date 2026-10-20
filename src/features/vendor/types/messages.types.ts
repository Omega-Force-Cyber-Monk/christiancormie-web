import type { FileUploadItemValue } from "@/components/forms/FileUpload/file-upload.types";
export type VendorChatAttachment =
  | { id: string; name: string; size: string; sampleUrl: string }
  | { id: string; name: string; size: string; file: File };
export type VendorChatMessage = {
  id: string;
  direction: "in" | "out";
  text: string;
  time: string;
  attachments: VendorChatAttachment[];
  local?: boolean;
};
export type VendorConversation = {
  id: string;
  name: string;
  contact: string;
  initials: string;
  active: boolean;
  age: string;
  preview: string;
  unread: number;
  messages: VendorChatMessage[];
};
export type VendorChatDraft = { text: string; files: FileUploadItemValue[] };
