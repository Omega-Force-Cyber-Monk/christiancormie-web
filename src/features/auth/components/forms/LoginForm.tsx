import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useLocation, useNavigate } from "react-router";
import { toast } from "sonner";

import { FormField } from "@/components/forms/FormField";
import { Button } from "@/components/ui/Button";
import { ROUTES } from "@/constants/routes";
import { useLoginMutation } from "@/features/auth/api/auth.api";
import {
  loginSchema,
  type LoginFormValues,
} from "@/features/auth/schemas/login.schema";
import { applyServerFieldErrors } from "@/utils/errors/applyServerFieldErrors";
import { normalizeAuthError } from "@/features/auth/utils/authErrors";

export function LoginForm() {
  const [formError, setFormError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [login, { isLoading }] = useLoginMutation();
  const navigate = useNavigate();
  const location = useLocation();
  const {
    formState: { errors, isSubmitting },
    handleSubmit,
    register,
    setError,
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (values: LoginFormValues) => {
    setFormError(null);

    try {
      await login({
        email: values.email.trim(),
        password: values.password,
      }).unwrap();
      const fromPath =
        (location.state as { from?: { pathname?: string } } | null)?.from?.pathname ??
        ROUTES.DASHBOARD;

      toast.success("Login accepted. Verifying your account...");
      void navigate(fromPath, { replace: true });
    } catch (error) {
      const appError = normalizeAuthError(error);
      applyServerFieldErrors(appError, setError, ["email", "password"]);
      setFormError(appError.message);
      toast.error(appError.message);
    }
  };

  return (
    <form
      className="legacy-auth-form space-y-4"
      onSubmit={(event) => {
        void handleSubmit(onSubmit)(event);
      }}
    >
      {formError ? (
        <div
          className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-[var(--danger)]"
          role="alert"
        >
          {formError}
        </div>
      ) : null}
      <FormField
        autoComplete="email"
        error={errors.email?.message}
        label="Email"
        type="email"
        {...register("email")}
      />
      <FormField
        autoComplete="current-password"
        error={errors.password?.message}
        label="Password"
        type={showPassword ? "text" : "password"}
        {...register("password")}
      />
      <button
        className="inline-flex items-center gap-2 text-sm text-[var(--text-muted)] hover:text-[var(--text)]"
        onClick={() => setShowPassword((current) => !current)}
        type="button"
      >
        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
        {showPassword ? "Hide password" : "Show password"}
      </button>
      <Button
        className="legacy-auth-submit w-full"
        disabled={isSubmitting || isLoading}
        type="submit"
        variant="primary"
      >
        {isSubmitting || isLoading ? "Logging in..." : "Login"}
      </Button>
      <p className="mt-4 text-center text-sm text-[#01D449]">Forget Password</p>
      <p className="mt-4 text-center text-sm text-gray-400">
        Don&apos;t have an account?{" "}
        <Link className="ml-1 text-blue-400 hover:text-sky-300" to={ROUTES.SIGNUP}>
          Register
        </Link>
      </p>
      <p className="mt-3 text-center text-xs text-gray-500">
        Need assistance? Visit our{" "}
        <Link className="text-orange-400 hover:underline" to={ROUTES.HELP_CENTER}>
          Help Center
        </Link>
      </p>
    </form>
  );
}
