import type { CurrentUserResponse } from "@/features/auth/types/current-user.types";
import type { EditableProfile } from "../schemas/account.schema";
import { validateFile } from "@/utils/files/validateFile";
export const validAccountImage = (file: File) =>
  !file || !file.size
    ? "Choose a nonempty image."
    : validateFile(file, {
        allowedMimeTypes: ["image/jpeg", "image/png", "image/webp"],
        allowedExtensions: ["jpg", "jpeg", "png", "webp"],
        maxSizeBytes: 5 * 1024 * 1024,
      });
export function accountFields(user: CurrentUserResponse) {
  return {
    fullName: [user.profile?.firstName, user.profile?.lastName]
      .filter(Boolean)
      .join(" "),
    bio: user.profile?.bio ?? "",
    displayName: user.profile?.displayName ?? "",
    email: user.email,
    phone: user.phone ?? "",
  };
}
export function profileChanges(previous: EditableProfile, next: EditableProfile) {
  return Object.fromEntries(
    (Object.keys(next) as (keyof EditableProfile)[])
      .filter((key) => previous[key] !== next[key])
      .map((key) => [key, next[key]]),
  );
}
export function leadPayload(v: {
  truckName: string;
  location: string;
  phone: string;
  description: string;
  reason: string;
}) {
  return {
    truckName: v.truckName,
    ...(v.phone ? { ownerPhone: v.phone } : {}),
    notes: [
      `Usual location: ${v.location}`,
      v.description && `Description: ${v.description}`,
      v.reason && `Reason: ${v.reason}`,
    ]
      .filter(Boolean)
      .join("\n"),
  };
}
