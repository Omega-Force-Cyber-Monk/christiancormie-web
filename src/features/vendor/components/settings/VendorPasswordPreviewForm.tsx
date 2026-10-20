import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { FormField } from "@/components/forms/FormField";
import {
  vendorPasswordPreviewSchema,
  type VendorPasswordPreviewValues,
} from "@/features/vendor/schemas/settings.schema";
export function VendorPasswordPreviewForm({
  onCancel,
  onValidated,
}: {
  onCancel: () => void;
  onValidated: () => void;
}) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<VendorPasswordPreviewValues>({
    resolver: zodResolver(vendorPasswordPreviewSchema),
    defaultValues: { currentPassword: "", newPassword: "", confirmPassword: "" },
  });
  return (
    <form
      id="vendor-password-form"
      className="vendor-settings-password"
      noValidate
      onSubmit={(event) => {
        void handleSubmit(() => {
          reset();
          onValidated();
        })(event);
      }}
    >
      <FormField
        label="Current Password"
        type="password"
        autoComplete="current-password"
        placeholder="Enter current password"
        error={errors.currentPassword?.message}
        {...register("currentPassword")}
      />
      <FormField
        label="New Password"
        type="password"
        autoComplete="new-password"
        placeholder="Enter new password"
        error={errors.newPassword?.message}
        {...register("newPassword")}
      />
      <FormField
        label="Confirm New Password"
        type="password"
        autoComplete="new-password"
        placeholder="Confirm new password"
        error={errors.confirmPassword?.message}
        {...register("confirmPassword")}
      />
      <div className="vendor-settings-form-actions">
        <button
          type="button"
          className="vendor-settings-secondary"
          onClick={() => {
            reset();
            onCancel();
          }}
        >
          Cancel
        </button>
        <button
          type="submit"
          className="vendor-settings-primary"
          disabled={isSubmitting}
        >
          Change Password
        </button>
      </div>
      <p className="text-xs leading-5 text-[#B8C1D1]">
        Local validation preview. Your current password is not verified and no password
        is changed.
      </p>
    </form>
  );
}
