import type {
  VendorQrResponse,
  VendorProfileResponse,
  VendorTrucksResponse,
} from "@/features/vendor/types/vendor.types";

export function vendorResourceUrl(
  value: string | null | undefined,
  apiBaseUrl: string,
  appOrigin?: string,
) {
  if (!value) return null;
  try {
    const base = apiBaseUrl
      ? new URL(apiBaseUrl, appOrigin)
      : appOrigin
        ? new URL(appOrigin)
        : null;
    const url = base ? new URL(value, base) : new URL(value);
    return ["https:", "http:"].includes(url.protocol) && !url.username && !url.password
      ? url.href
      : null;
  } catch {
    return null;
  }
}
export function toVendorQr(
  data: VendorQrResponse,
  profile: VendorProfileResponse,
  trucks: VendorTrucksResponse,
  apiBaseUrl: string,
  appOrigin?: string,
) {
  const belongs =
    data.vendorId === profile.id &&
    (data.foodTruckId === null ||
      trucks.some(
        (truck) => truck.id === data.foodTruckId && truck.vendorId === profile.id,
      ));
  const hasCode = belongs && Boolean(data.foodTruckId && data.qrCode);
  return {
    belongs,
    hasCode,
    vendorId: data.vendorId,
    foodTruckId: data.foodTruckId,
    code: hasCode ? data.qrCode : null,
    imageUrl: hasCode
      ? vendorResourceUrl(data.downloadUrl, apiBaseUrl, appOrigin)
      : null,
    shareUrl: hasCode ? vendorResourceUrl(data.qrCodeUrl, apiBaseUrl, appOrigin) : null,
    shareMessage: data.shareMessage ?? "",
  };
}
export async function shareVendorQr(
  url: string,
  message: string,
  environment: {
    share?: (data: ShareData) => Promise<void>;
    copy?: (url: string) => Promise<void>;
  },
): Promise<"shared" | "copied" | "cancelled" | "manual"> {
  try {
    if (environment.share) {
      await environment.share({ title: "BiteDrop QR code", text: message, url });
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
    /* Manual copy remains available. */
  }
  return "manual";
}
