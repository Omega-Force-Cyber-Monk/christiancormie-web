import { Link } from "react-router";

import { Button } from "@/components/ui/Button";
import type { ErrorFallbackProps } from "@/components/errors/errors.types";
import { ROUTES } from "@/constants/routes";

export function ErrorFallback({ error, errorInfo, onReset }: ErrorFallbackProps) {
  return (
    <main className="grid min-h-dvh place-items-center bg-[var(--background)] p-6">
      <section className="max-w-lg rounded-lg border border-[var(--border)] bg-[var(--surface)] p-6 shadow-sm">
        <p className="text-sm font-semibold text-[var(--danger)]">Application error</p>
        <h1 className="mt-2 text-2xl font-semibold">Something unexpected happened.</h1>
        <p className="mt-3 text-sm leading-6 text-[var(--text-muted)]">
          You can retry the view or return to the dashboard.
        </p>
        {import.meta.env.DEV ? (
          <details className="mt-4 rounded-md bg-[var(--surface-muted)] p-3 text-xs">
            <summary className="cursor-pointer font-medium">
              Development details
            </summary>
            <pre className="mt-2 whitespace-pre-wrap break-words">
              {error.message}
              {"\n"}
              {errorInfo?.componentStack}
            </pre>
          </details>
        ) : null}
        <div className="mt-5 flex flex-wrap gap-3">
          <Button onClick={onReset} variant="primary">
            Retry
          </Button>
          <Link
            className="inline-flex min-h-10 items-center rounded-md border border-[var(--border)] px-3 text-sm font-medium"
            to={ROUTES.DASHBOARD}
          >
            Dashboard
          </Link>
        </div>
      </section>
    </main>
  );
}
