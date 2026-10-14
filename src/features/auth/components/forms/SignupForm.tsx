import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router";
import { toast } from "sonner";

import { FormField } from "@/components/forms/FormField";
import { Button } from "@/components/ui/Button";
import { ROUTES } from "@/constants/routes";
import { useRegisterMutation } from "@/features/auth/api/auth.api";
import {
  signupSchema,
  type SignupFormValues,
} from "@/features/auth/schemas/signup.schema";
import { applyServerFieldErrors } from "@/utils/errors/applyServerFieldErrors";
import { normalizeApiError } from "@/utils/errors/normalizeApiError";

export function SignupForm() {
  const [formError, setFormError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [registerAccount, { isLoading }] = useRegisterMutation();
  const navigate = useNavigate();
  const {
    formState: { errors, isSubmitting },
    handleSubmit,
    register,
    setError,
  } = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      name: "",
      businessName: "N/A",
      address_Pickup_Location: "N/A",
      phone: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const onSubmit = async (values: SignupFormValues) => {
    setFormError(null);

    try {
      await registerAccount({
        name: values.name,
        businessName: values.businessName || "N/A",
        address_Pickup_Location: values.address_Pickup_Location || "N/A",
        phone: values.phone,
        email: values.email,
        password: values.password,
      }).unwrap();
      toast.success("Account created. Please log in.");
      void navigate(ROUTES.LOGIN);
    } catch (error) {
      const appError = normalizeApiError(error);
      applyServerFieldErrors(appError, setError);
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
      <FormField error={errors.name?.message} label="Full Name" {...register("name")} />
      <FormField
        error={errors.phone?.message}
        label="Phone Number"
        type="tel"
        {...register("phone")}
      />
      <FormField
        autoComplete="email"
        error={errors.email?.message}
        label="Email"
        type="email"
        {...register("email")}
      />
      <FormField
        autoComplete="new-password"
        error={errors.password?.message}
        label="Password"
        type={showPassword ? "text" : "password"}
        {...register("password")}
      />
      <FormField
        autoComplete="new-password"
        error={errors.confirmPassword?.message}
        label="Confirm Password"
        type={showPassword ? "text" : "password"}
        {...register("confirmPassword")}
      />
      <button
        className="inline-flex items-center gap-2 text-sm text-[var(--text-muted)] hover:text-[var(--text)]"
        onClick={() => setShowPassword((current) => !current)}
        type="button"
      >
        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
        {showPassword ? "Hide passwords" : "Show passwords"}
      </button>
      <Button
        className="legacy-auth-submit w-full"
        disabled={isSubmitting || isLoading}
        type="submit"
        variant="primary"
      >
        {isSubmitting || isLoading ? "Creating account..." : "Register"}
      </Button>
      <p className="text-center text-sm text-[var(--text-muted)]">
        Already have an account?{" "}
        <Link className="font-medium text-[var(--primary)]" to={ROUTES.LOGIN}>
          Log in
        </Link>
      </p>
    </form>
  );
}
