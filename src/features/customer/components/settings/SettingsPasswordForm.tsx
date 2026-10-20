import { zodResolver } from "@hookform/resolvers/zod";
import { useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { FormField } from "@/components/forms/FormField";
import {
  settingsPasswordSchema,
  type SettingsPasswordValues,
} from "@/features/customer/schemas/settings.schema";

export function SettingsPasswordForm({ onCancel }: { onCancel: () => void }) {
  const pending = useRef(false);
  const [status, setStatus] = useState("");
  const {
    register,
    reset,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SettingsPasswordValues>({
    resolver: zodResolver(settingsPasswordSchema),
    defaultValues: { currentPassword: "", newPassword: "", confirmPassword: "" },
  });
  return (
    <form
      className="settings-form-card space-y-4"
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        if (pending.current) return;
        pending.current = true;
        void handleSubmit(() => {
          reset();
          setStatus(
            "Validation passed. No password was changed; secure account updates require backend integration.",
          );
        })(event).finally(() => {
          pending.current = false;
        });
      }}
    >
      <FormField
        {...register("currentPassword")}
        label="Current Password"
        type="password"
        placeholder="Enter current password"
        autoComplete="current-password"
        error={errors.currentPassword?.message}
      />
      <FormField
        {...register("newPassword")}
        label="New Password"
        type="password"
        placeholder="Enter new password"
        autoComplete="new-password"
        error={errors.newPassword?.message}
      />
      <FormField
        {...register("confirmPassword")}
        label="Confirm New Password"
        type="password"
        placeholder="Confirm new password"
        autoComplete="new-password"
        error={errors.confirmPassword?.message}
      />
      <div className="settings-form-actions border-t border-[#343C4C] pt-2">
        <button
          type="button"
          className="settings-secondary"
          onClick={onCancel}
          disabled={isSubmitting}
        >
          Cancel
        </button>
        <button type="submit" className="settings-primary" disabled={isSubmitting}>
          {isSubmitting ? "Checking…" : "Change Password"}
        </button>
      </div>
      <p className="text-xs leading-5 text-[#B8C1D1]" role="status">
        {status || "Local validation preview. Your account password will not change."}
      </p>
    </form>
  );
}
