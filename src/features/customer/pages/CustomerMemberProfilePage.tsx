import { Pencil } from "lucide-react";
import { useState } from "react";
import { Link, useSearchParams } from "react-router";
import { skipToken } from "@reduxjs/toolkit/query";
import { useAppSelector } from "@/app/hooks";
import { StartConversationButton } from "@/features/messaging/components/StartConversationButton";
import { Button } from "@/components/ui/Button";
import { ErrorState } from "@/components/states/ErrorState";
import { ROUTES } from "@/constants/routes";
import { MemberProfileEditor } from "@/features/customer/components/profile/MemberProfileEditor";
import { MemberProfileGallery } from "@/features/customer/components/profile/MemberProfileGallery";
import {
  getMemberProfileTab,
  type MemberProfileTab,
} from "@/features/customer/utils/memberProfile";
import {
  socialActorAllowed,
  useGetMemberProfileQuery,
} from "@/features/social/api/socialProfile.api";
import { MemberFollowButton } from "@/features/social/components/MemberFollowButton";
import { MemberConnectionsDialog } from "@/features/social/components/MemberConnectionsDialog";
import { memberProfilePath } from "@/features/social/utils/profileIdentity";
import { RewardsPanel } from "@/features/rewards/components/RewardsPanel";
import { useGetMyRewardSummaryQuery } from "@/features/rewards/api/rewards.api";
import { remoteMedia } from "@/utils/files/remoteMedia";
import "@/features/customer/components/profile/member-profile.css";
export default function CustomerMemberProfilePage({
  own,
  userId,
}: {
  own: boolean;
  userId?: string;
}) {
  const viewer = useAppSelector((s) => s.auth.user?.id);
  const allowed = useAppSelector(socialActorAllowed);
  const target = own ? viewer : userId;
  const profileQuery = useGetMemberProfileQuery(allowed && target ? target : skipToken);
  const rewards = useGetMyRewardSummaryQuery(undefined, { skip: !own || !allowed });
  const [params, setParams] = useSearchParams();
  const tab = getMemberProfileTab(params.get("tab"));
  const [editing, setEditing] = useState(false);
  const [notice, setNotice] = useState("");
  const [connections, setConnections] = useState<"followers" | "following" | null>(
    null,
  );
  function changeTab(next: MemberProfileTab) {
    setParams(
      (current) => {
        const updated = new URLSearchParams(current);
        updated.set("tab", next);
        return updated;
      },
      { replace: true, preventScrollReset: true },
    );
  }
  const profile = profileQuery.currentData;
  const denied =
    profileQuery.isError &&
    "status" in profileQuery.error &&
    [401, 403, 404].includes(Number(profileQuery.error.status));
  if (!allowed) return <p>Verified identity is required.</p>;
  if (profileQuery.isLoading || profileQuery.isUninitialized)
    return <p role="status">Loading member profile…</p>;
  if (!profile || denied)
    return (
      <section>
        <h1>Member profile unavailable</h1>
        <p>The profile may be deleted, restricted or unavailable.</p>
        <ErrorState onRetry={() => void profileQuery.refetch()} />
      </section>
    );
  return (
    <section
      className={`member-profile-page ${own ? "member-profile-page--own" : "member-profile-page--public"}`}
    >
      {profileQuery.isFetching && <p role="status">Refreshing member profile…</p>}
      {profileQuery.isError && (
        <ErrorState onRetry={() => void profileQuery.refetch()} />
      )}
      <article
        className="member-profile-card"
        aria-label={`${profile.displayName} profile`}
      >
        <header className="member-profile-header">
          {remoteMedia(profile.avatarUrl) ? (
            <img
              src={remoteMedia(profile.avatarUrl)}
              alt={`${profile.displayName} avatar`}
              className="member-profile-avatar object-cover"
            />
          ) : (
            <span
              role="img"
              aria-label="Avatar unavailable"
              className="member-profile-avatar"
            />
          )}
          <div className="min-w-0 flex-1">
            <h1 className="text-xl leading-7 font-semibold break-words">
              {profile.displayName}
            </h1>
            {own && (
              <p className="member-profile-rank">
                {rewards.currentData?.loyalty.currentTier.name ?? "Tier unavailable"}
              </p>
            )}
            {profile.bio && <p>{profile.bio}</p>}
          </div>
          {own ? (
            <Link
              to={`${memberProfilePath(profile.userId)}${tab === "tagged" ? "?tab=tagged" : ""}`}
              className="member-public-view"
            >
              Public view
            </Link>
          ) : (
            <span className="member-public-view">Public view</span>
          )}
        </header>
        {own && (
          <Button className="member-edit-button" onClick={() => setEditing(true)}>
            <Pencil size={18} aria-hidden="true" />
            Edit profile
          </Button>
        )}
        <dl className="member-profile-stats">
          {[
            { name: "Posts", value: profile.postCount },
            { name: "Following", value: profile.followingCount },
            { name: "Followers", value: profile.followerCount },
          ].map((item) => (
            <div key={item.name}>
              <dd>{item.value}</dd>
              <dt>
                {item.name === "Posts" ? (
                  item.name
                ) : (
                  <button
                    type="button"
                    onClick={() =>
                      setConnections(
                        item.name === "Followers" ? "followers" : "following",
                      )
                    }
                  >
                    {item.name}
                  </button>
                )}
              </dt>
            </div>
          ))}
        </dl>
        {own ? (
          <RewardsPanel />
        ) : (
          <div className="member-public-actions">
            <MemberFollowButton
              userId={profile.userId}
              isFollowing={profile.isFollowing}
              busy={profileQuery.isFetching}
            />
            <StartConversationButton target={{ participantUserId: profile.userId }} />
          </div>
        )}
        <MemberProfileGallery tab={tab} onTab={changeTab} userId={profile.userId} />
      </article>
      {notice && (
        <p role="status" className="mt-4 text-xs text-[#B8C1D1]">
          {notice}
        </p>
      )}
      {!own && (
        <Link
          to={ROUTES.CUSTOMER_OWN_PROFILE}
          className="mt-3 inline-flex min-h-11 items-center text-sm text-[#2ED3D1] underline"
        >
          Back to own profile
        </Link>
      )}
      {editing && (
        <MemberProfileEditor
          name={profile.displayName}
          onClose={() => setEditing(false)}
          onSave={(_name, identityRefreshed) => {
            setEditing(false);
            setNotice(
              identityRefreshed
                ? "Display name saved. Member profile is refreshing."
                : "Display name saved; account refresh failed. Use Refresh account in Settings to retry.",
            );
          }}
        />
      )}
      {connections && (
        <MemberConnectionsDialog
          key={`${target}:${connections}`}
          userId={profile.userId}
          direction={connections}
          onClose={() => setConnections(null)}
        />
      )}
    </section>
  );
}
