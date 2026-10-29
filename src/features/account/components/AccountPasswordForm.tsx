import { zodResolver } from "@hookform/resolvers/zod";
import { useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { FormField } from "@/components/forms/FormField";
import { passwordFieldsSchema, type PasswordFields } from "../schemas/account.schema";
import { useChangeAccountPasswordMutation } from "../api/account.api";
import { useAccount } from "../hooks/useAccount";
import { normalizeApiError } from "@/utils/errors/normalizeApiError";
import { applyServerFieldErrors } from "@/utils/errors/applyServerFieldErrors";
export function AccountPasswordForm({
  onCancel,
  onSaved,
  vendor = false,
}: {
  onCancel: () => void;
  onSaved?: () => void;
  vendor?: boolean;
}) {
  const account = useAccount();
  const [change] = useChangeAccountPasswordMutation();
  const lock = useRef(false);
  const [status, setStatus] = useState("");
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<PasswordFields>({
    resolver: zodResolver(passwordFieldsSchema),
    defaultValues: { currentPassword: "", newPassword: "", confirmPassword: "" },
  });
  return (
    <form
      className={vendor ? "vendor-settings-password" : "settings-form-card space-y-4"}
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        if (lock.current) return;
        lock.current = true;
        void handleSubmit(async (v) => {
          setStatus("");
          const request = change({
            scope: account.scope,
            body: {
              currentPassword: v.currentPassword,
              newPassword: v.newPassword,
              confirmNewPassword: v.confirmPassword,
            },
          });
          try {
            await request.unwrap();
            if (!account.isCurrent()) return;
            reset();
            setStatus(
              "Password changed successfully. Other sessions are not automatically signed out.",
            );
            onSaved?.();
          } catch (error) {
            if (!account.isCurrent()) return;
            const failure = normalizeApiError(error);
            applyServerFieldErrors(
              {
                ...failure,
                fieldErrors: {
                  ...failure.fieldErrors,
                  ...(failure.fieldErrors?.confirmNewPassword
                    ? { confirmPassword: failure.fieldErrors.confirmNewPassword }
                    : {}),
                },
              },
              setError,
              ["currentPassword", "newPassword", "confirmPassword"],
            );
            setError("root", { message: failure.message });
            toast.error(failure.message);
          } finally {
            request.reset();
          }
        })(e).finally(() => {
          lock.current = false;
        });
      }}
    >
      <FormField
        {...register("currentPassword")}
        label="Current Password"
        type="password"
        autoComplete="current-password"
        error={errors.currentPassword?.message}
      />
      <FormField
        {...register("newPassword")}
        label="New Password"
        type="password"
        autoComplete="new-password"
        error={errors.newPassword?.message}
      />
      <FormField
        {...register("confirmPassword")}
        label="Confirm New Password"
        type="password"
        autoComplete="new-password"
        error={errors.confirmPassword?.message}
      />
      {errors.root && <p role="alert">{errors.root.message}</p>}
      <div
        className={
          vendor
            ? "vendor-settings-form-actions"
            : "settings-form-actions border-t border-[#343C4C] pt-2"
        }
      >
        <button
          type="button"
          className={vendor ? "vendor-settings-secondary" : "settings-secondary"}
          disabled={isSubmitting}
          onClick={() => {
            reset();
            onCancel();
          }}
        >
          Cancel
        </button>
        <button
          type="submit"
          className={vendor ? "vendor-settings-primary" : "settings-primary"}
          disabled={isSubmitting || !account.allowed}
        >
          {isSubmitting ? "Changing…" : "Change Password"}
        </button>
      </div>
      <p role="status" className="text-xs leading-5 text-[#B8C1D1]">
        {status ||
          "Use uppercase, lowercase, and a number or special character; at least 8 characters."}
      </p>
    </form>
  );
}
