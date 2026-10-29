import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router";
import type { z } from "zod";
import { FormField } from "@/components/forms/FormField";
import { Button } from "@/components/ui/Button";
import { ROUTES } from "@/constants/routes";
import {
  useVerifyEmailMutation,
  useResendVerificationCodeMutation,
} from "@/features/auth/api/auth.api";
import { verifyEmailSchema } from "@/features/auth/schemas/signup.schema";
import { normalizeAuthError } from "@/features/auth/utils/authErrors";
import { applyServerFieldErrors } from "@/utils/errors/applyServerFieldErrors";

export function EmailVerificationForm({
  email,
  onBack,
}: {
  email: string;
  onBack: () => void;
}) {
  const [verify, verification] = useVerifyEmailMutation();
  const [resend, resending] = useResendVerificationCodeMutation();
  const [message, setMessage] = useState(
    "Enter the code from your registration email. You can request a new code below.",
  );
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    getValues,
    trigger,
    setError: setFieldError,
    formState: { errors, isSubmitting },
  } = useForm<z.infer<typeof verifyEmailSchema>>({
    resolver: zodResolver(verifyEmailSchema),
    defaultValues: { email, code: "" },
  });
  const pending = verification.isLoading || resending.isLoading || isSubmitting;
  const onSubmit = async (values: z.infer<typeof verifyEmailSchema>) => {
    if (verification.isLoading || resending.isLoading) return;
    setError(null);
    try {
      await verify(values).unwrap();
      void navigate(ROUTES.DASHBOARD, { replace: true });
    } catch (failure) {
      const normalized = normalizeAuthError(failure);
      applyServerFieldErrors(normalized, setFieldError, ["email", "code"]);
      setError(normalized.message);
    }
  };
  const resendCode = async () => {
    if (pending || !(await trigger("email"))) return;
    setError(null);
    try {
      const result = await resend({ email: getValues("email") }).unwrap();
      setMessage(result.message);
    } catch (failure) {
      setError(normalizeAuthError(failure).message);
    }
  };
  return (
    <form
      className="legacy-auth-form space-y-4"
      onSubmit={(event) => {
        void handleSubmit(onSubmit)(event);
      }}
    >
      <h2 className="text-lg font-semibold">Verify your email</h2>
      <p className="text-sm text-[var(--text-muted)]" role="status">
        {message}
      </p>
      {error ? (
        <p className="text-sm text-[var(--danger)]" role="alert">
          {error}
        </p>
      ) : null}
      <FormField
        label="Email"
        type="email"
        autoComplete="email"
        disabled={pending}
        error={errors.email?.message}
        {...register("email")}
      />
      <FormField
        label="Verification Code"
        autoComplete="one-time-code"
        maxLength={6}
        disabled={pending}
        error={errors.code?.message}
        {...register("code")}
      />
      <Button className="legacy-auth-submit w-full" type="submit" disabled={pending}>
        {pending ? "Please wait..." : "Verify email"}
      </Button>
      <Button
        className="w-full"
        type="button"
        disabled={pending}
        onClick={() => {
          void resendCode();
        }}
      >
        Resend verification code
      </Button>
      <button
        className="text-sm text-[var(--primary)]"
        type="button"
        disabled={pending}
        onClick={onBack}
      >
        Back to registration
      </button>
      <p className="text-center text-sm">
        <Link to={ROUTES.LOGIN}>Already verified? Log in</Link>
      </p>
    </form>
  );
}
