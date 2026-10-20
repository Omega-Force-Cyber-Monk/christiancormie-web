import {
  profileArtwork,
  profileFixture,
  profileGallery,
  profileMenuFixture,
  type ProfileMenuItem,
  type ProfilePhotoSource,
} from "@/features/vendor/data/profile.data";
import {
  vendorMenuItemSchema,
  vendorProfileSchema,
  type VendorMenuValues,
  type VendorProfileValues,
} from "@/features/vendor/schemas/profile.schema";
import { validateFile } from "@/utils/files/validateFile";
export const profilePhotoOptions = {
  allowedMimeTypes: ["image/jpeg", "image/png", "image/webp"],
  allowedExtensions: ["jpg", "jpeg", "png", "webp"],
};
export const validateProfilePhoto = (source?: ProfilePhotoSource) =>
  typeof source === "string" || !source
    ? undefined
    : (validateFile(source, profilePhotoOptions) ?? undefined);
const copyProfile = (values: VendorProfileValues): VendorProfileValues => ({
  ...values,
  cuisines: [...values.cuisines],
  hours: values.hours.map((h) => ({ ...h })),
});
export type VendorProfileState = {
  values: VendorProfileValues;
  photo: ProfilePhotoSource;
  draft: VendorProfileValues;
  draftPhoto: ProfilePhotoSource;
  editing: boolean;
  menu: ProfileMenuItem[];
  menuDialog: "new" | { id: string } | null;
  galleryId: string | null;
  status: string;
};
export const initialVendorProfileState = (): VendorProfileState => {
  const values = vendorProfileSchema.parse(profileFixture);
  return {
    values,
    photo: profileArtwork.truck,
    draft: copyProfile(values),
    draftPhoto: profileArtwork.truck,
    editing: false,
    menu: profileMenuFixture.map((item) => ({ ...item })),
    menuDialog: null,
    galleryId: null,
    status: "",
  };
};
export type VendorProfileAction =
  | { type: "edit-profile"; open: boolean }
  | { type: "profile-draft" | "save-profile"; values: VendorProfileValues }
  | { type: "draft-photo"; source: ProfilePhotoSource }
  | { type: "menu-dialog"; dialog: VendorProfileState["menuDialog"] }
  | {
      type: "save-menu";
      id: string;
      values: VendorMenuValues;
      photo?: ProfilePhotoSource;
    }
  | { type: "delete-menu" | "toggle-menu"; id: string }
  | { type: "gallery"; id: string | null };
export function vendorProfileReducer(
  state: VendorProfileState,
  action: VendorProfileAction,
): VendorProfileState {
  switch (action.type) {
    case "edit-profile":
      return { ...state, editing: action.open };
    case "profile-draft":
      return { ...state, draft: copyProfile(action.values) };
    case "draft-photo":
      return validateProfilePhoto(action.source)
        ? state
        : { ...state, draftPhoto: action.source };
    case "save-profile": {
      const result = vendorProfileSchema.safeParse(action.values);
      if (!result.success || validateProfilePhoto(state.draftPhoto)) return state;
      return {
        ...state,
        values: result.data,
        draft: copyProfile(result.data),
        photo: state.draftPhoto,
        editing: false,
        status: "Profile saved locally. Your account profile has not been changed.",
      };
    }
    case "menu-dialog": {
      const dialog = action.dialog;
      return dialog &&
        dialog !== "new" &&
        !state.menu.some((item) => item.id === dialog.id)
        ? state
        : { ...state, menuDialog: dialog };
    }
    case "save-menu": {
      const result = vendorMenuItemSchema.safeParse(action.values);
      if (!result.success || !action.id || validateProfilePhoto(action.photo))
        return state;
      const editingId =
        state.menuDialog && state.menuDialog !== "new"
          ? state.menuDialog.id
          : undefined;
      if (
        editingId
          ? editingId !== action.id || !state.menu.some((item) => item.id === editingId)
          : state.menuDialog !== "new" ||
            state.menu.some((item) => item.id === action.id)
      )
        return state;
      const previous = state.menu.find((item) => item.id === action.id);
      const item: ProfileMenuItem = {
        id: action.id,
        name: result.data.name,
        description: result.data.description,
        priceCents: Math.round(Number(result.data.price) * 100),
        available: previous?.available ?? true,
        photo: action.photo,
      };
      return {
        ...state,
        menu: previous
          ? state.menu.map((m) => (m.id === item.id ? item : m))
          : [...state.menu, item],
        menuDialog: null,
        status: "Menu item saved in this local preview.",
      };
    }
    case "delete-menu":
      return state.menu.some((item) => item.id === action.id)
        ? {
            ...state,
            menu: state.menu.filter((item) => item.id !== action.id),
            status: "Menu item removed locally.",
          }
        : state;
    case "toggle-menu":
      return state.menu.some((item) => item.id === action.id)
        ? {
            ...state,
            menu: state.menu.map((item) =>
              item.id === action.id ? { ...item, available: !item.available } : item,
            ),
            status: "Menu availability updated locally.",
          }
        : state;
    case "gallery":
      return action.id !== null &&
        !profileGallery.some((image) => image?.id === action.id)
        ? state
        : { ...state, galleryId: action.id };
  }
}
export type VendorProfileTab = "menu" | "gallery" | "reviews";
export const parseVendorProfileTab = (value: string | null): VendorProfileTab =>
  value === "gallery" || value === "reviews" ? value : "menu";
export const formatProfileTime = (time: string): string => {
  const match = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(time);
  if (!match) return "Not available";
  const hour = Number(match[1]);
  return `${hour % 12 || 12}:${match[2]} ${hour >= 12 ? "PM" : "AM"}`;
};
export const profileHoursSummary = (hours: VendorProfileValues["hours"]) => {
  const first = hours.find((h) => h.enabled);
  return first ? `Open until ${formatProfileTime(first.closes)}` : "Closed";
};
export const profileCapacitySummary = (capacity: VendorProfileValues["capacity"]) =>
  `${capacity === "201-500" ? "200+" : capacity.replaceAll("-", "\u2013")} guests serve capacity`;
export const formatMenuPrice = (cents: number) =>
  Number.isFinite(cents)
    ? new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(
        cents / 100,
      )
    : "Not available";

export function nextProfileGalleryId(current: string, direction: -1 | 1): string {
  const photos = profileGallery.filter((photo) => photo !== null);
  const index = photos.findIndex((photo) => photo.id === current);
  return index < 0
    ? photos[0].id
    : photos[(index + direction + photos.length) % photos.length].id;
}
