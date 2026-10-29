import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { Link } from "react-router";
import { toast } from "sonner";

import { FormField } from "@/components/forms/FormField";
import { Button } from "@/components/ui/Button";
import { ROUTES } from "@/constants/routes";
import {
  useRegisterCustomerMutation,
  useRegisterVendorMutation,
} from "@/features/auth/api/auth.api";
import { EmailVerificationForm } from "./EmailVerificationForm";
import {
  signupSchema,
  toCustomerRegistration,
  toVendorRegistration,
  type SignupFormValues,
} from "@/features/auth/schemas/signup.schema";
import { applyServerFieldErrors } from "@/utils/errors/applyServerFieldErrors";
import { normalizeAuthError } from "@/features/auth/utils/authErrors";

export function SignupForm() {
  const [formError, setFormError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [registerCustomer, customer] = useRegisterCustomerMutation();
  const [registerVendor, vendor] = useRegisterVendorMutation();
  const [verificationEmail, setVerificationEmail] = useState<string | null>(null);
  const isLoading = customer.isLoading || vendor.isLoading;
  const {
    formState: { errors, isSubmitting },
    handleSubmit,
    register,
    setError,
    control,
    getValues,
    resetField,
  } = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      name: "",
      accountType: "CUSTOMER",
      businessName: "",
      dateOfBirth: "",
      phone: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });
  const accountType = useWatch({ control, name: "accountType" });

  const onSubmit = async (values: SignupFormValues) => {
    setFormError(null);

    try {
      if (isLoading) return;
      const result =
        values.accountType === "CUSTOMER"
          ? await registerCustomer(toCustomerRegistration(values)).unwrap()
          : await registerVendor(toVendorRegistration(values)).unwrap();
      resetField("password");
      resetField("confirmPassword");
      setVerificationEmail(result.email);
    } catch (error) {
      const appError = normalizeAuthError(error);
      applyServerFieldErrors(appError, setError, [
        "name",
        "businessName",
        "dateOfBirth",
        "phone",
        "email",
        "password",
        "confirmPassword",
      ]);
      setFormError(appError.message);
      toast.error(appError.message);
    }
  };

  if (verificationEmail !== null)
    return (
      <EmailVerificationForm
        email={verificationEmail}
        onBack={() => setVerificationEmail(null)}
      />
    );

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
      <fieldset className="flex gap-4" disabled={isSubmitting || isLoading}>
        <legend className="mb-2 text-sm">Account type</legend>
        <label className="inline-flex items-center gap-2 text-sm">
          <input type="radio" value="CUSTOMER" {...register("accountType")} />
          Customer
        </label>
        <label className="inline-flex items-center gap-2 text-sm">
          <input type="radio" value="VENDOR" {...register("accountType")} />
          Vendor
        </label>
      </fieldset>
      <FormField error={errors.name?.message} label="Full Name" {...register("name")} />
      {accountType === "CUSTOMER" ? (
        <FormField
          label="Date of Birth"
          type="date"
          autoComplete="bday"
          error={errors.dateOfBirth?.message}
          {...register("dateOfBirth")}
        />
      ) : (
        <>
          <FormField
            label="Business Name (optional)"
            error={errors.businessName?.message}
            {...register("businessName")}
          />
          <FormField
            error={errors.phone?.message}
            label="Phone Number"
            type="tel"
            {...register("phone")}
          />
        </>
      )}
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
      <button
        className="w-full text-sm text-[var(--primary)]"
        type="button"
        disabled={isSubmitting || isLoading}
        onClick={() => setVerificationEmail(getValues("email"))}
      >
        Verify an existing account
      </button>
    </form>
  );
}
