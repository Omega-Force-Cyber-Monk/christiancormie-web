import { Camera, Trash2 } from "lucide-react";
import { useRef, useState } from "react";
import { FilePreview } from "@/components/forms/FileUpload/FilePreview";
import { FormError } from "@/components/forms/FormError";
import type { SettingsProfileValues } from "@/features/customer/schemas/settings.schema";
import { validateSettingsPhoto } from "@/features/customer/utils/settingsState";

export function SettingsProfilePanel({
  profile,
  photo,
  onPhoto,
  onEdit,
  onDelete,
}: {
  profile: SettingsProfileValues;
  photo: File | null;
  onPhoto: (file: File) => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [error, setError] = useState("");
  return (
    <>
      <div className="settings-form-card">
        <button
          type="button"
          className="flex w-full items-center gap-4 text-left"
          onClick={() => input.current?.click()}
        >
          <span className="settings-profile-photo">
            {photo && <FilePreview file={photo} />}
            <span className="settings-photo-camera">
              <Camera size={16} aria-hidden="true" />
            </span>
          </span>
          <span className="min-w-0">
            <span className="block text-lg font-semibold">Profile Photo</span>
            <span className="mt-1 block text-sm text-[#B8C1D1]">
              Click to change your photo
            </span>
          </span>
        </button>
        <input
          type="file"
          className="hidden"
          ref={input}
          accept="image/jpeg,image/png,image/webp"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) {
              const failure = validateSettingsPhoto(file);
              setError(failure ?? "");
              if (!failure) onPhoto(file);
            }
            event.target.value = "";
          }}
        />
        <FormError message={error} />
        <dl className="mt-5 space-y-4 border-t border-[#343C4C] pt-5">
          {[
            ["Name", profile.fullName],
            ["Email", profile.email],
            ["Phone", profile.phone],
          ].map(([label, value]) => (
            <div key={label}>
              <dt className="text-sm text-[#B8C1D1]">{label}</dt>
              <dd className="mt-1 break-words text-base font-semibold">{value}</dd>
            </div>
          ))}
        </dl>
        <button type="button" className="settings-edit-profile mt-4" onClick={onEdit}>
          Edit Profile
        </button>
      </div>
      <button type="button" className="settings-delete" onClick={onDelete}>
        <Trash2 size={20} aria-hidden="true" />
        Delete account
      </button>
      <p className="mt-3 text-xs leading-5 text-[#B8C1D1]">
        Sample profile. Edits and photo changes stay on this Settings page.
      </p>
    </>
  );
}
