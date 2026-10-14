import { Navigate } from "react-router";

import { useAppSelector } from "@/app/hooks";
import { ROUTES } from "@/constants/routes";
import signupIllustration from "@/features/auth/assets/signup.svg";
import { LoginForm } from "@/features/auth/components/forms/LoginForm";
import { selectIsAuthenticated } from "@/features/auth/store/auth.selectors";

export default function LoginPage() {
  const isAuthenticated = useAppSelector(selectIsAuthenticated);

  if (isAuthenticated) {
    return <Navigate replace to={ROUTES.DASHBOARD} />;
  }

  return (
    <main className="legacy-auth-page flex min-h-dvh items-center justify-center p-6 text-white">
      <section className="legacy-auth-shell flex w-full max-w-5xl overflow-hidden">
        <div className="hidden w-1/2 items-center justify-center md:flex">
          <img
            alt="Bite Drop account access"
            className="h-full w-full rounded-l-xl object-cover"
            src={signupIllustration}
          />
        </div>
        <div className="flex w-full flex-col justify-center p-10 md:w-1/2">
          <h1 className="mb-2 text-center font-sans text-2xl md:text-3xl lg:text-4xl">
            LOG IN
          </h1>
          <LoginForm />
        </div>
      </section>
    </main>
  );
}
