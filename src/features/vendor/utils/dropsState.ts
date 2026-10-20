import {
  sampleDropPromos,
  type DropDuration,
  type DropPromo,
} from "@/features/vendor/data/drops.data";
import {
  dropDurationSchema,
  dropPromoSchema,
  type CustomDropDuration,
  type DropPromoValues,
} from "@/features/vendor/schemas/drops.schema";

export type DropsOverlay =
  { kind: "duration" } | { kind: "promo"; id: string | null } | null;
export type LocalDropPreview = { duration: DropDuration; promos: DropPromo[] };
export type DropsState = {
  duration: DropDuration;
  promos: DropPromo[];
  online: boolean;
  live: LocalDropPreview | null;
  overlay: DropsOverlay;
  status: string;
};
export const initialDropsState = (): DropsState => ({
  duration: { kind: "preset", hours: 2 },
  promos: sampleDropPromos.map((promo) => ({ ...promo })),
  online: true,
  live: null,
  overlay: null,
  status: "",
});
export type DropsAction =
  | { type: "overlay"; overlay: DropsOverlay }
  | { type: "duration"; duration: DropDuration }
  | { type: "custom-duration"; value: CustomDropDuration }
  | { type: "availability"; online: boolean }
  | { type: "toggle-promo"; id: string }
  | { type: "delete-promo"; id: string }
  | { type: "save-promo"; id: string; editing: boolean; values: DropPromoValues }
  | { type: "go-live" }
  | { type: "end-drop" };

const cloneDuration = (duration: DropDuration): DropDuration =>
  duration.kind === "custom"
    ? { ...duration, value: { ...duration.value } }
    : { ...duration };
const clonePromo = (promo: DropPromo): DropPromo => ({
  ...promo,
  duration: promo.duration ? { ...promo.duration } : null,
});
export function dropsReducer(state: DropsState, action: DropsAction): DropsState {
  switch (action.type) {
    case "overlay": {
      const overlay = action.overlay;
      if (
        overlay?.kind === "promo" &&
        overlay.id &&
        !state.promos.some((promo) => promo.id === overlay.id)
      )
        return state;
      return { ...state, overlay };
    }
    case "duration":
      if (
        action.duration.kind === "custom" &&
        !dropDurationSchema.safeParse(action.duration.value).success
      )
        return state;
      return { ...state, duration: cloneDuration(action.duration) };
    case "custom-duration": {
      const parsed = dropDurationSchema.safeParse(action.value);
      return parsed.success
        ? { ...state, duration: { kind: "custom", value: parsed.data }, overlay: null }
        : state;
    }
    case "availability":
      return {
        ...state,
        online: action.online,
        status: action.online
          ? "Online selected for this local preview."
          : "Offline selected for this local preview.",
      };
    case "toggle-promo":
      if (!state.promos.some((promo) => promo.id === action.id)) return state;
      return {
        ...state,
        promos: state.promos.map((promo) =>
          promo.id === action.id ? { ...promo, enabled: !promo.enabled } : promo,
        ),
        status: "Promo availability updated locally.",
      };
    case "delete-promo":
      if (!state.promos.some((promo) => promo.id === action.id)) return state;
      return {
        ...state,
        promos: state.promos.filter((promo) => promo.id !== action.id),
        status: "Promo removed from the local preview.",
      };
    case "save-promo": {
      const parsed = dropPromoSchema.safeParse(action.values);
      const previous = state.promos.find((promo) => promo.id === action.id);
      if (!parsed.success || (action.editing ? !previous : Boolean(previous)))
        return state;
      const values = parsed.data;
      const promo: DropPromo = {
        id: action.id,
        name: values.name,
        message: values.message,
        enabled: previous?.enabled ?? true,
        duration: values.hasDuration
          ? { hours: values.hours, minutes: values.minutes }
          : null,
      };
      return {
        ...state,
        promos: action.editing
          ? state.promos.map((item) => (item.id === promo.id ? promo : item))
          : [...state.promos, promo],
        overlay: null,
        status: `Promo ${action.editing ? "updated" : "added"} locally. Nothing was sent to customers.`,
      };
    }
    case "go-live":
      return {
        ...state,
        online: true,
        live: {
          duration: cloneDuration(state.duration),
          promos: state.promos.filter((promo) => promo.enabled).map(clonePromo),
        },
        status:
          "Local drop preview started or updated. Your location and promos have not been broadcast.",
      };
    case "end-drop":
      return {
        ...state,
        live: null,
        online: false,
        status: "Local drop preview ended. No real drop was changed.",
      };
  }
}
