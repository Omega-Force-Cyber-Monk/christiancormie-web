import { Link } from "react-router";

import { ROUTES } from "@/constants/routes";
import signupIllustration from "@/features/auth/assets/signup.svg";
import { SignupForm } from "@/features/auth/components/forms/SignupForm";

export default function SignupPage() {
  return (
    <main className="legacy-auth-page flex min-h-dvh items-center justify-center p-6 text-white">
      <section className="legacy-auth-shell flex w-full max-w-5xl overflow-hidden">
        <div className="hidden w-1/2 items-center justify-center md:flex">
          <img
            alt="Create a Bite Drop account"
            className="h-full w-full rounded-l-xl rounded-r-xl object-cover"
            src={signupIllustration}
          />
        </div>
        <div className="flex w-full flex-col justify-center p-10 md:w-1/2">
          <h1 className="mb-2 font-sans text-2xl md:text-3xl lg:text-4xl">
            CREATE YOUR ACCOUNT
          </h1>
          <p className="mb-6 text-sm text-gray-400">
            Sign up to get started and access your dashboard and features.
          </p>
          <SignupForm />
          <p className="mt-4 text-center text-xs leading-relaxed text-gray-400">
            By creating an account, you agree to our{" "}
            <Link
              className="text-orange-400 hover:underline"
              to={ROUTES.TERMS_AND_CONDITIONS}
            >
              Terms & Conditions
            </Link>{" "}
            and{" "}
            <Link
              className="text-orange-400 hover:underline"
              to={ROUTES.PRIVACY_POLICY}
            >
              Privacy Policy
            </Link>
            .
          </p>
        </div>
      </section>
    </main>
  );
}
