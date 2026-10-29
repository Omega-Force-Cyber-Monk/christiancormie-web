import { Camera, Trash2 } from "lucide-react";
import { useRef, useState } from "react";
import { FilePreview } from "@/components/forms/FileUpload/FilePreview";
import { FormError } from "@/components/forms/FormError";
import type { SettingsProfileValues } from "@/features/customer/schemas/settings.schema";
import { validateSettingsPhoto } from "@/features/customer/utils/settingsState";
import { useAccount } from "@/features/account/hooks/useAccount";
import {
  useUploadAccountAvatarMutation,
  useRefreshAccountIdentityMutation,
} from "@/features/account/api/account.api";
import { remoteMedia } from "@/utils/files/remoteMedia";
import { normalizeApiError } from "@/utils/errors/normalizeApiError";
import { toast } from "sonner";

export function SettingsProfilePanel({
  profile,
  onEdit,
  onDelete,
}: {
  profile: SettingsProfileValues;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [error, setError] = useState("");
  const [photo, setPhoto] = useState<File | null>(null);
  const account = useAccount();
  const [upload, uploadState] = useUploadAccountAvatarMutation();
  const [refresh, refreshState] = useRefreshAccountIdentityMutation();
  const lock = useRef(false);
  const [confirmedAvatar, setConfirmedAvatar] = useState("");
  return (
    <>
      <div className="settings-form-card">
        <button
          type="button"
          className="flex w-full items-center gap-4 text-left"
          onClick={() => input.current?.click()}
          disabled={uploadState.isLoading}
        >
          <span className="settings-profile-photo">
            {photo ? (
              <FilePreview file={photo} />
            ) : remoteMedia(confirmedAvatar || account.user?.profile?.avatarUrl) ? (
              <img
                src={remoteMedia(confirmedAvatar || account.user?.profile?.avatarUrl)}
                alt="Current avatar"
                className="size-full rounded-full object-cover"
              />
            ) : null}
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
              if (!failure) setPhoto(file);
            }
            event.target.value = "";
          }}
        />
        <FormError message={error} />
        {photo && (
          <div className="settings-form-actions">
            <button
              type="button"
              className="settings-primary"
              disabled={uploadState.isLoading}
              onClick={() => {
                if (lock.current || !photo) return;
                lock.current = true;
                void upload({ scope: account.scope, file: photo })
                  .unwrap()
                  .then((r) => {
                    if (!account.isCurrent()) return;
                    setConfirmedAvatar(r.avatarUrl);
                    setPhoto(null);
                    toast.success(
                      r.identityRefreshed
                        ? "Profile photo saved."
                        : "Photo saved; account refresh pending.",
                    );
                  })
                  .catch((e: unknown) => {
                    if (account.isCurrent()) {
                      setError(normalizeApiError(e).message);
                    }
                  })
                  .finally(() => {
                    lock.current = false;
                  });
              }}
            >
              Upload photo
            </button>
            <button
              type="button"
              className="settings-secondary"
              disabled={uploadState.isLoading}
              onClick={() => setPhoto(null)}
            >
              Cancel photo
            </button>
          </div>
        )}
        <dl className="mt-5 space-y-4 border-t border-[#343C4C] pt-5">
          {[
            ["Display Name", profile.displayName || "N/A"],
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
      <button
        type="button"
        className="settings-delete"
        onClick={onDelete}
        disabled={!account.user || account.user.vendor !== null}
      >
        <Trash2 size={20} aria-hidden="true" />
        Delete account
      </button>
      <p className="mt-3 text-xs leading-5 text-[#B8C1D1]">
        Display name, email, phone and uploaded avatar can be saved. Full Name and Bio
        are read-only. Vendor accounts cannot be deleted here.
      </p>
      <button
        type="button"
        className="settings-secondary mt-3"
        disabled={refreshState.isLoading}
        onClick={() => {
          void refresh(account.scope)
            .unwrap()
            .then((r) => {
              if (account.isCurrent())
                setError(
                  r.identityRefreshed ? "" : "Account refresh failed. Please retry.",
                );
            })
            .catch((failure: unknown) => {
              if (account.isCurrent()) setError(normalizeApiError(failure).message);
            });
        }}
      >
        Refresh account
      </button>
    </>
  );
}
