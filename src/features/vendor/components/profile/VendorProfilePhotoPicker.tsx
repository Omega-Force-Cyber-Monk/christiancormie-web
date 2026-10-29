import { Camera, Upload } from "lucide-react";
import { useId, useRef, useState } from "react";
import { FileDropzone } from "@/components/forms/FileUpload/FileDropzone";
import { FormError } from "@/components/forms/FormError";
import { VendorProfilePhoto } from "@/features/vendor/components/profile/VendorProfilePhoto";
import type { ProfilePhotoSource } from "@/features/vendor/data/profile.data";
import { validateProfilePhoto } from "@/features/vendor/utils/profileState";
export function VendorProfilePhotoPicker({
  source,
  onChange,
  avatar = false,
  disabled = false,
}: {
  source?: ProfilePhotoSource;
  onChange: (file: File) => void;
  avatar?: boolean;
  disabled?: boolean;
}) {
  const [error, setError] = useState<string>();
  const input = useRef<HTMLInputElement>(null);
  const id = useId();
  const select = (files: File[]) => {
    if (disabled) return;
    const file = files[0];
    if (!file) return;
    const invalid = validateProfilePhoto(file);
    setError(invalid ? `${invalid} Choose JPG, PNG or WebP up to 5 MB.` : undefined);
    if (!invalid) onChange(file);
  };
  return (
    <div
      className={avatar ? "vendor-profile-photo-picker" : "vendor-menu-photo-picker"}
      role="group"
      aria-label={avatar ? "Profile picture" : "Menu item photo"}
      aria-describedby={error ? id : undefined}
    >
      {avatar ? (
        <>
          <button
            type="button"
            className="vendor-profile-avatar-upload"
            aria-label="Change profile picture"
            disabled={disabled}
            onClick={() => input.current?.click()}
          >
            <VendorProfilePhoto source={source} alt="" />
            <span>
              <Upload size={22} />
            </span>
          </button>
          <input
            ref={input}
            className="sr-only"
            tabIndex={-1}
            type="file"
            accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
            aria-label="Choose profile picture"
            onChange={(event) => {
              select(Array.from(event.target.files ?? []));
              event.target.value = "";
            }}
          />
          <p className="mt-2 text-base font-bold">Profile Picture</p>
        </>
      ) : (
        <FileDropzone
          accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
          onFilesSelected={select}
        >
          {source && (
            <VendorProfilePhoto
              source={source}
              alt="Menu item photo preview"
              className="vendor-menu-photo-preview"
            />
          )}
          <span className="vendor-menu-photo-label">
            <Camera size={14} /> Photo
          </span>
        </FileDropzone>
      )}
      <p className="sr-only">
        Local preview until upload and save are confirmed. JPG, PNG or WebP up to 5 MB.
      </p>
      <FormError id={id} message={error} />
    </div>
  );
}
