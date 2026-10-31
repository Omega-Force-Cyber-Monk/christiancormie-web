import { useEffect, useRef, useState } from "react";
import { useStore } from "react-redux";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { useAppDispatch } from "@/app/hooks";
import type { RootState } from "@/app/store";
import { Button } from "@/components/ui/Button";
import { FormField } from "@/components/forms/FormField";
import { beginStaffLogin } from "@/features/auth/api/auth.api";
import {
  staffLoginSchema,
  type StaffLoginValues,
} from "@/features/auth/schemas/staff-login.schema";
import { normalizeApiError } from "@/utils/errors/normalizeApiError";
import { applyServerFieldErrors } from "@/utils/errors/applyServerFieldErrors";

export function StaffLoginForm() {
  const dispatch = useAppDispatch();
  const store = useStore<RootState>();
  const [formError, setFormError] = useState<string | null>(null);
  const pending = useRef<ReturnType<typeof beginStaffLogin> | null>(null);
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      pending.current?.cancel();
      pending.current = null;
    };
  }, []);
  const {
    register,
    handleSubmit,
    setError,
    resetField,
    formState: { errors, isSubmitting },
  } = useForm<StaffLoginValues>({
    resolver: zodResolver(staffLoginSchema),
    defaultValues: { email: "", pin: "" },
  });
  return (
    <form
      className="legacy-auth-form space-y-4"
      noValidate
      onSubmit={(event) => {
        void handleSubmit(async (values) => {
          if (pending.current) return;
          setFormError(null);
          const sessionId = store.getState().auth.sessionId;
          const request = beginStaffLogin(dispatch, () => store.getState(), {
            email: values.email,
            pin: values.pin,
          });
          pending.current = request;
          resetField("pin");
          try {
            await request.result;
            // SessionBootstrap verifies /users/me; GuestGuard/SessionGate handle the
            // redirect/role chooser. Tokens alone never trigger a success toast.
          } catch (cause) {
            if (mounted.current && store.getState().auth.sessionId === sessionId) {
              const error = normalizeApiError(cause);
              applyServerFieldErrors(error, setError, ["email", "pin"]);
              setFormError(error.message);
              toast.error(error.message);
            }
          } finally {
            if (pending.current === request) pending.current = null;
          }
        })(event);
      }}
    >
      {formError && (
        <div
          className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-[var(--danger)]"
          role="alert"
        >
          {formError}
        </div>
      )}
      <FormField
        label="Email"
        type="email"
        autoComplete="email"
        disabled={isSubmitting}
        error={errors.email?.message}
        {...register("email")}
      />
      <FormField
        label="Staff PIN"
        type="password"
        inputMode="numeric"
        autoComplete="off"
        maxLength={4}
        disabled={isSubmitting}
        error={errors.pin?.message}
        {...register("pin")}
      />
      <p className="text-sm text-[var(--text-muted)]">
        Enter your four-digit staff PIN. Contact your vendor owner if you need a PIN
        reset.
      </p>
      <Button
        className="legacy-auth-submit w-full"
        type="submit"
        disabled={isSubmitting}
        variant="primary"
      >
        {isSubmitting ? "Signing in…" : "Staff Login"}
      </Button>
    </form>
  );
}
