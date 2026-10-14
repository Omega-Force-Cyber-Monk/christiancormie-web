import { Button } from "@/components/ui/Button";
import { getErrorMessage } from "@/utils/errors/getErrorMessage";
import type { AppError } from "@/utils/errors/error.types";

type ErrorStateProps = {
  error?: AppError | null;
  onRetry?: () => void;
};

export function ErrorState({ error, onRetry }: ErrorStateProps) {
  return (
    <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-center">
      <h2 className="text-base font-semibold text-[var(--danger)]">
        Something went wrong
      </h2>
      <p className="mt-2 text-sm text-[var(--text-muted)]">{getErrorMessage(error)}</p>
      {onRetry ? (
        <Button className="mt-4" onClick={onRetry}>
          Retry
        </Button>
      ) : null}
    </div>
  );
}
