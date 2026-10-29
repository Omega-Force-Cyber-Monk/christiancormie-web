import { zodResolver } from "@hookform/resolvers/zod";
import { useRef } from "react";
import { useForm } from "react-hook-form";
import { FormField } from "@/components/forms/FormField";
import { SettingsTextarea } from "@/features/customer/components/settings/SettingsTextarea";
import { toast } from "sonner";
import { useAccount } from "@/features/account/hooks/useAccount";
import { useUpdateAccountProfileMutation } from "@/features/account/api/account.api";
import {
  editableProfileSchema,
  type EditableProfile,
} from "@/features/account/schemas/account.schema";
import { profileChanges } from "@/features/account/utils/accountAdapters";
import { normalizeApiError } from "@/utils/errors/normalizeApiError";
import { applyServerFieldErrors } from "@/utils/errors/applyServerFieldErrors";
import { type SettingsProfileValues } from "@/features/customer/schemas/settings.schema";

export function SettingsProfileEditor({
  profile,
  onSave,
  onCancel,
}: {
  profile: SettingsProfileValues;
  onSave: () => void;
  onCancel: () => void;
}) {
  const pending = useRef(false);
  const original = useRef({
    displayName: profile.displayName,
    email: profile.email,
    phone: profile.phone,
  });
  const account = useAccount();
  const [save] = useUpdateAccountProfileMutation();
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<EditableProfile>({
    resolver: zodResolver(editableProfileSchema),
    defaultValues: {
      displayName: profile.displayName,
      email: profile.email,
      phone: profile.phone,
    },
  });
  return (
    <form
      className="settings-form-card space-y-4"
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        if (pending.current) return;
        pending.current = true;
        void handleSubmit(async (values) => {
          const body = profileChanges(original.current, values);
          if (!Object.keys(body).length) return;
          try {
            const result = await save({ scope: account.scope, body }).unwrap();
            if (!account.isCurrent()) return;
            toast.success(
              result.identityRefreshed
                ? "Profile saved."
                : "Profile saved; account refresh is pending.",
            );
            onSave();
          } catch (error) {
            if (!account.isCurrent()) return;
            const failure = normalizeApiError(error);
            applyServerFieldErrors(failure, setError, [
              "displayName",
              "email",
              "phone",
            ]);
            setError("root", { message: failure.message });
            toast.error(failure.message);
          }
        })(event).finally(() => {
          pending.current = false;
        });
      }}
    >
      <FormField
        value={profile.fullName}
        readOnly
        label="Full Name"
        autoComplete="name"
        autoFocus
      />
      <div>
        <FormField
          {...register("displayName")}
          defaultValue={profile.displayName}
          label="Display Name"
          error={errors.displayName?.message}
          aria-describedby="settings-display-hint"
        />
        <p
          id="settings-display-hint"
          className="mt-2 text-xs leading-[18px] text-[#B8C1D1]"
        >
          Shown on your profile, posts, and comments. Full Name and Bio are read-only
          because this API cannot save them.
        </p>
      </div>
      <SettingsTextarea
        value={profile.bio}
        readOnly
        label="Bio"
        placeholder="Tell the community about yourself..."
      />
      <FormField
        {...register("email")}
        defaultValue={profile.email}
        label="Email Address"
        type="email"
        autoComplete="email"
        error={errors.email?.message}
      />
      <FormField
        {...register("phone")}
        defaultValue={profile.phone}
        label="Phone Number"
        type="tel"
        autoComplete="tel"
        error={errors.phone?.message}
      />
      <div className="settings-form-actions">
        <button
          type="button"
          className="settings-secondary"
          onClick={onCancel}
          disabled={isSubmitting}
        >
          Cancel
        </button>
        <button
          type="submit"
          className="settings-primary"
          disabled={isSubmitting || !isDirty || !account.allowed}
        >
          {isSubmitting ? "Saving…" : "Save changes"}
        </button>
      </div>
      {errors.root && <p role="alert">{errors.root.message}</p>}
    </form>
  );
}
