import { locationInputSchema } from "../schemas/dropsIntegration.schema";
type DeviceLocation = {
  coords: { latitude: number; longitude: number; accuracy: number };
};
type LocationFailure = { code: number };
export type LocationProvider = {
  getCurrentPosition: (
    success: (p: DeviceLocation) => void,
    failure: (e: LocationFailure) => void,
    options?: PositionOptions,
  ) => void;
};
// Called only by the explicit location button, never during render/bootstrap.
export function requestDropLocation(
  provider: LocationProvider | undefined,
): Promise<{ latitude: number; longitude: number; accuracy: number }> {
  if (!provider)
    return Promise.reject(
      new Error("Device location is unavailable. Enter valid coordinates manually."),
    );
  return new Promise((resolve, reject) =>
    provider.getCurrentPosition(
      (p) => {
        const r = locationInputSchema.safeParse({
          latitude: p.coords.latitude,
          longitude: p.coords.longitude,
        });
        if (!r.success) reject(new Error("Device returned invalid coordinates."));
        else
          resolve({
            latitude: p.coords.latitude,
            longitude: p.coords.longitude,
            accuracy: p.coords.accuracy,
          });
      },
      (e) =>
        reject(
          new Error(
            e.code === 1
              ? "Location permission was denied. Enter coordinates manually or grant permission."
              : e.code === 3
                ? "Location request timed out. Try again or enter coordinates."
                : "Your location is unavailable. Enter coordinates manually.",
          ),
        ),
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 },
    ),
  );
}
