import {
  sampleSettingsProfile,
  sampleSupportTickets,
  type SupportTicket,
  type SupportMessage,
} from "@/features/customer/data/settings.data";
import {
  settingsProfileSchema,
  settingsIssueSchema,
  type SettingsProfileValues,
  type SettingsIssueValues,
} from "@/features/customer/schemas/settings.schema";
import { validateFile } from "@/utils/files/validateFile";
import { SAFE_PREVIEW_MIME_TYPES } from "@/utils/files/file.constants";

export type SettingsOverlay =
  | { kind: "points" | "profile" | "edit" | "password" | "invite" }
  | { kind: "conversation"; ticketId: string }
  | null;
export type SettingsState = {
  profile: SettingsProfileValues;
  photo: File | null;
  tickets: SupportTicket[];
  overlay: SettingsOverlay;
};
export const initialSettingsState = (): SettingsState => ({
  profile: { ...sampleSettingsProfile },
  photo: null,
  tickets: sampleSupportTickets.map((ticket) => ({
    ...ticket,
    messages: ticket.messages.map((message) => ({ ...message })),
  })),
  overlay: null,
});
export type SettingsAction =
  | { type: "overlay"; overlay: SettingsOverlay }
  | { type: "profile"; values: SettingsProfileValues }
  | { type: "photo"; file: File }
  | { type: "ticket"; values: SettingsIssueValues; id: string; date: string }
  | { type: "message"; ticketId: string; message: SupportMessage };

export const validateSettingsPhoto = (file: File) =>
  validateFile(file, {
    allowedMimeTypes: SAFE_PREVIEW_MIME_TYPES,
    allowedExtensions: ["jpg", "jpeg", "png", "webp"],
  });
export function settingsReducer(
  state: SettingsState,
  action: SettingsAction,
): SettingsState {
  switch (action.type) {
    case "overlay": {
      const overlay = action.overlay;
      if (
        overlay?.kind === "conversation" &&
        !state.tickets.some((ticket) => ticket.id === overlay.ticketId)
      )
        return state;
      return { ...state, overlay };
    }
    case "profile": {
      const parsed = settingsProfileSchema.safeParse(action.values);
      if (!parsed.success) return state;
      const values = parsed.data;
      const names = values.fullName.split(/\s+/);
      const defaultName =
        names.length > 1 ? `${names[0]} ${names.at(-1)?.charAt(0) ?? ""}.` : names[0];
      return {
        ...state,
        profile: { ...values, displayName: values.displayName || defaultName },
        overlay: { kind: "profile" },
      };
    }
    case "photo":
      return validateSettingsPhoto(action.file)
        ? state
        : { ...state, photo: action.file };
    case "ticket": {
      const parsed = settingsIssueSchema.safeParse(action.values);
      if (!parsed.success || state.tickets.some((ticket) => ticket.id === action.id))
        return state;
      return {
        ...state,
        tickets: [
          {
            id: action.id,
            ...parsed.data,
            status: "Pending",
            date: action.date,
            age: "LOCAL PREVIEW",
            messages: [
              {
                id: `${action.id}-initial`,
                sender: "you",
                text: parsed.data.message,
                time: "Local preview",
              },
            ],
          },
          ...state.tickets,
        ],
      };
    }
    case "message": {
      const message = { ...action.message, text: action.message.text.trim() };
      if (
        (!message.text && !message.attachment) ||
        (message.attachment && validateSettingsPhoto(message.attachment))
      )
        return state;
      return {
        ...state,
        tickets: state.tickets.map((ticket) =>
          ticket.id !== action.ticketId ||
          ticket.messages.some((item) => item.id === message.id)
            ? ticket
            : { ...ticket, messages: [...ticket.messages, message] },
        ),
      };
    }
  }
}
