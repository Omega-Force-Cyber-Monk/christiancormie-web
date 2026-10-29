import type { useCommunityPublishing } from "../utils/useCommunityPublishing";
import { Button } from "@/components/ui/Button";
export function CommunityPublishingFeedback({
  publication,
}: {
  publication: ReturnType<typeof useCommunityPublishing>;
}) {
  return (
    <div className="my-4 space-y-3 text-sm text-[#B8C1D1]">
      {publication.error && <p role="alert">{publication.error}</p>}
      {publication.uncertain && (
        <>
          <Button
            disabled={publication.pending}
            onClick={() => void publication.refreshMine()}
          >
            Refresh My Posts before retrying
          </Button>
          {publication.reviewed && (
            <div role="status">
              <p>
                Review these latest posts before explicitly retrying. This first page
                cannot prove an earlier request did not save.
              </p>
              <ul>
                {publication.review?.pages[0]?.items.map((post) => (
                  <li key={post.id}>
                    {post.title} · {post.id}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}
    </div>
  );
}
