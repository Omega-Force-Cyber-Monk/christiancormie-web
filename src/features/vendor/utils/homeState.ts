import { z } from "zod";
import { vendorHomeBookings } from "@/features/vendor/data/home.data";

export const vendorHomeUpdateSchema = z.object({
  text: z
    .string()
    .trim()
    .min(1, "Enter an update before saving.")
    .max(2200, "Use at most 2200 characters."),
});
export type VendorHomeUpdate = z.infer<typeof vendorHomeUpdateSchema> & { id: string };
export type VendorHomeOverlay =
  "qr" | "post" | "analytics" | { bookingId: string } | null;
export type VendorHomeState = {
  overlay: VendorHomeOverlay;
  updates: VendorHomeUpdate[];
};
export const initialVendorHomeState = (): VendorHomeState => ({
  overlay: null,
  updates: [],
});
export type VendorHomeAction =
  | { type: "open"; overlay: VendorHomeOverlay }
  | { type: "save-update"; update: VendorHomeUpdate };
export function vendorHomeReducer(
  state: VendorHomeState,
  action: VendorHomeAction,
): VendorHomeState {
  if (action.type === "open") {
    if (typeof action.overlay === "object" && action.overlay) {
      const id = action.overlay.bookingId;
      if (!vendorHomeBookings.some((item) => item.id === id)) return state;
    }
    return { ...state, overlay: action.overlay };
  }
  const parsed = vendorHomeUpdateSchema.safeParse(action.update);
  if (!parsed.success || state.updates.some((item) => item.id === action.update.id))
    return state;
  return {
    ...state,
    overlay: null,
    updates: [{ ...parsed.data, id: action.update.id }, ...state.updates],
  };
}

type QrShareEnvironment = {
  share?: (data: ShareData) => Promise<void>;
  canShare?: (data: ShareData) => boolean;
  copy?: (text: string) => Promise<void>;
};
export async function shareVendorHomeQr(
  file: File,
  url: string,
  environment: QrShareEnvironment,
): Promise<"shared" | "copied" | "cancelled" | "manual"> {
  const files = { title: "BiteDrop sample QR code", files: [file] };
  try {
    if (environment.share) {
      await environment.share(
        environment.canShare?.(files)
          ? files
          : { title: "BiteDrop sample QR code", url },
      );
      return "shared";
    }
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") return "cancelled";
  }
  try {
    if (environment.copy) {
      await environment.copy(url);
      return "copied";
    }
  } catch {
    /* The manual-copy field remains available when platform sharing fails. */
  }
  return "manual";
}
