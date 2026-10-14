import { Link } from "react-router";

import { ROUTES } from "@/constants/routes";

export default function UnauthorizedPage() {
  return (
    <main className="grid min-h-dvh place-items-center bg-[var(--background)] p-6">
      <section className="max-w-lg rounded-lg border border-[var(--border)] bg-[var(--surface)] p-6 text-center shadow-sm">
        <p className="text-sm font-semibold text-[var(--warning)]">403</p>
        <h1 className="mt-2 text-2xl font-semibold">You do not have access.</h1>
        <p className="mt-3 text-sm leading-6 text-[var(--text-muted)]">
          This route is protected by role-aware frontend authorization. Backend APIs
          must enforce the same permissions independently.
        </p>
        <Link
          className="mt-5 inline-flex min-h-10 items-center rounded-md bg-[var(--primary)] px-3 text-sm font-medium text-white"
          to={ROUTES.DASHBOARD}
        >
          Back to dashboard
        </Link>
      </section>
    </main>
  );
}
