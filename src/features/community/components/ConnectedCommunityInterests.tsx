import { useId, useState } from "react";
import { ArrowLeft, Send } from "lucide-react";
import { useAppSelector } from "@/app/hooks";
import { Modal } from "@/components/overlays/Modal/Modal";
import { Button } from "@/components/ui/Button";
import { TruckImage } from "@/features/customer/components/discover/DiscoverTruckCard";
import { CommunityReadStates } from "@/features/customer/components/community/CommunityReadStates";
import {
  communityScope,
  useGetCommunityInterestsInfiniteQuery,
} from "../api/community.api";
import { uniqueCommunityRows } from "../utils/communityInteractions";
import type { CommunityPost } from "../schemas/community.schema";
import type { CommunityInterests } from "../schemas/communityInteractions.schema";
import { remoteMedia } from "@/utils/files/remoteMedia";
export function CommunityInterestRows({
  rows,
  onProfile,
}: {
  rows: CommunityInterests["items"];
  onProfile: (userId: string) => void;
}) {
  return (
    <div className="space-y-6">
      {rows.map((row) => {
        const name =
          row.user.vendor?.businessName ??
          row.user.profile?.displayName ??
          "Vendor name unavailable";
        return (
          <article key={row.id} className="community-truck-interest">
            <div className="flex flex-wrap items-center gap-3">
              <TruckImage
                name={name}
                src={remoteMedia(
                  row.user.vendor?.logoUrl ?? row.user.profile?.avatarUrl,
                )}
                className="size-[76px] rounded-xl"
              />
              <div className="min-w-0 flex-1">
                <h2 className="text-lg font-semibold">{name}</h2>
                <p className="text-sm text-[#B8C1D1]">
                  Cuisine, rating and distance unavailable
                </p>
                {row.user.vendor?.isVerified && (
                  <p className="text-xs text-[#2ED3D1]">Verified vendor</p>
                )}
              </div>
              <Button
                className="community-primary"
                onClick={() => onProfile(row.user.id)}
              >
                View Profile
              </Button>
            </div>
            <p className="mt-6 rounded-2xl bg-[#242D42] p-4 text-sm leading-5 whitespace-pre-wrap break-words">
              {row.message ?? "No introduction available"}
            </p>
            <time
              className="mt-3 block text-xs text-[#B8C1D1]"
              dateTime={row.createdAt}
            >
              {new Date(row.createdAt).toLocaleString("en-US")}
            </time>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <Button disabled>Decline</Button>
              <Button disabled className="community-primary">
                <Send size={16} />
                Invite
              </Button>
            </div>
            <p className="mt-2 text-xs text-[#B8C1D1]">
              Invitations and decline decisions are unavailable; no vendor will be
              contacted.
            </p>
          </article>
        );
      })}
    </div>
  );
}
export function ConnectedCommunityInterests({
  post,
  onBack,
}: {
  post: CommunityPost;
  onBack: () => void;
}) {
  const scope = useAppSelector(communityScope);
  const title = useId();
  const [selected, setSelected] = useState("");
  const eligible =
    post.category === "VENDOR_CALLOUT" &&
    post.author?.id === scope.userId &&
    post.viewer?.isOwner === true;
  const query = useGetCommunityInterestsInfiniteQuery(
    { ...scope, postId: post.id },
    { skip: !eligible },
  );
  const denied =
    query.error &&
    "status" in query.error &&
    [401, 403, 404].includes(Number(query.error.status));
  const rows = uniqueCommunityRows(denied ? [] : (query.currentData?.pages ?? []));
  const profile = rows.find((row) => row.user.id === selected);
  return (
    <section className="community-interested-view">
      <div className="community-page-heading">
        <Button aria-label="Back to post" onClick={onBack}>
          <ArrowLeft size={20} />
        </Button>
        <h1>Interested trucks</h1>
      </div>
      {!eligible ? (
        <p role="alert">
          Only the organizer of a Vendor Callout can view interest messages.
        </p>
      ) : (
        <>
          <CommunityReadStates
            loading={query.isLoading}
            fetching={query.isFetching}
            error={query.error}
            empty={false}
            onRetry={() => void query.refetch()}
          />
          {!query.isLoading && !query.error && !rows.length && (
            <p role="status">No interested vendors yet.</p>
          )}
          {!denied && query.currentData && (
            <p className="mb-4 text-sm text-[#B8C1D1]">
              {query.currentData.pages[0]?.total} interested vendors
            </p>
          )}
          <CommunityInterestRows rows={rows} onProfile={setSelected} />
          {query.hasNextPage && !denied && (
            <Button
              disabled={query.isFetching}
              onClick={() => void query.fetchNextPage()}
            >
              Load more interested vendors
            </Button>
          )}
        </>
      )}
      <Modal isOpen={!!profile} onClose={() => setSelected("")} titleId={title}>
        {profile && (
          <div className="overflow-y-auto p-6 pt-12">
            <h2 id={title} className="text-xl font-bold">
              {profile.user.vendor?.businessName ??
                profile.user.profile?.displayName ??
                "Vendor name unavailable"}
            </h2>
            <p className="mt-3 text-sm">
              {profile.message ?? "No introduction available"}
            </p>
            <p className="mt-3 text-xs text-[#B8C1D1]">
              No truck ID, cuisine, rating or location was supplied for this interest.
            </p>
          </div>
        )}
      </Modal>
    </section>
  );
}
