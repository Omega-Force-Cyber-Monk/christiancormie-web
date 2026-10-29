import { AppLoader } from "@/components/ui/AppLoader";
import { Button } from "@/components/ui/Button";
import { normalizeApiError } from "@/utils/errors/normalizeApiError";

export function CommunityReadStates({
  loading,
  fetching,
  error,
  empty,
  mine = false,
  filtered = false,
  detail = false,
  onRetry,
}: {
  loading: boolean;
  fetching: boolean;
  error?: unknown;
  empty: boolean;
  mine?: boolean;
  filtered?: boolean;
  detail?: boolean;
  onRetry: () => void;
}) {
  const normalized = error ? normalizeApiError(error) : null;
  const inaccessible = normalized?.status === 403 || normalized?.status === 404;
  return (
    <>
      {loading && (
        <AppLoader
          variant="compact"
          label={detail ? "Loading post details" : "Loading Community posts"}
        />
      )}
      {!loading && fetching && (
        <p role="status" className="mb-3 text-sm text-[#B8C1D1]">
          Refreshing Community…
        </p>
      )}
      {normalized && (
        <div role="alert" className="my-4 rounded-2xl border border-white/10 p-4">
          <p>
            {inaccessible
              ? "This content is private, missing, deleted or unavailable to your account."
              : normalized.message}
          </p>
          <Button className="mt-3" onClick={onRetry}>
            Retry
          </Button>
        </div>
      )}
      {!loading && !error && empty && (
        <p role="status" className="my-4 rounded-2xl border border-white/10 p-6">
          {detail
            ? "Post unavailable."
            : mine
              ? "You have no Community posts in this view."
              : filtered
                ? "No Community posts match this category."
                : "No Community posts yet."}
        </p>
      )}
    </>
  );
}
