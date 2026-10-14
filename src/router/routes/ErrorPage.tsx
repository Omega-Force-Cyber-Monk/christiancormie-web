import { isRouteErrorResponse, Link, useRouteError } from "react-router";

import { ROUTES } from "@/constants/routes";

export function ErrorPage() {
  const error = useRouteError();
  const message = isRouteErrorResponse(error)
    ? error.statusText
    : "Something went wrong while rendering this route.";

  return (
    <main className="grid min-h-dvh place-items-center bg-[var(--background)] p-6">
      <section className="max-w-lg rounded-lg border border-[var(--border)] bg-[var(--surface)] p-6 shadow-sm">
        <p className="text-sm font-semibold text-[var(--danger)]">Route error</p>
        <h1 className="mt-2 text-2xl font-semibold">We hit a routing problem.</h1>
        <p className="mt-3 text-sm leading-6 text-[var(--text-muted)]">{message}</p>
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
