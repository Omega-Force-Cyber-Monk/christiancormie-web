import { zodResolver } from "@hookform/resolvers/zod";
import { useRef } from "react";
import { useForm } from "react-hook-form";
import { FormField } from "@/components/forms/FormField";
import { SettingsTextarea } from "@/features/customer/components/settings/SettingsTextarea";
import {
  settingsProfileSchema,
  type SettingsProfileValues,
} from "@/features/customer/schemas/settings.schema";

export function SettingsProfileEditor({
  profile,
  onSave,
  onCancel,
}: {
  profile: SettingsProfileValues;
  onSave: (values: SettingsProfileValues) => void;
  onCancel: () => void;
}) {
  const pending = useRef(false);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SettingsProfileValues>({
    resolver: zodResolver(settingsProfileSchema),
    defaultValues: profile,
  });
  return (
    <form
      className="settings-form-card space-y-4"
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        if (pending.current) return;
        pending.current = true;
        void handleSubmit(onSave)(event).finally(() => {
          pending.current = false;
        });
      }}
    >
      <FormField
        {...register("fullName")}
        defaultValue={profile.fullName}
        label="Full Name"
        autoComplete="name"
        error={errors.fullName?.message}
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
          Shown on your profile, posts, and comments. Defaults to first name + last
          initial.
        </p>
      </div>
      <SettingsTextarea
        {...register("bio")}
        defaultValue={profile.bio}
        label="Bio"
        placeholder="Tell the community about yourself..."
        error={errors.bio?.message}
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
        <button type="submit" className="settings-primary" disabled={isSubmitting}>
          {isSubmitting ? "Saving…" : "Save changes"}
        </button>
      </div>
    </form>
  );
}
