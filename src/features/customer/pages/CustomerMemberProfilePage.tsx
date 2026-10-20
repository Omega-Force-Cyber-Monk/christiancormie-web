import { Pencil } from "lucide-react";
import { useReducer, useState } from "react";
import { Link, useSearchParams } from "react-router";
import { Modal } from "@/components/overlays/Modal/Modal";
import { Button } from "@/components/ui/Button";
import { ROUTES } from "@/constants/routes";
import { TruckImage } from "@/features/customer/components/discover/DiscoverTruckCard";
import { MemberProfileEditor } from "@/features/customer/components/profile/MemberProfileEditor";
import { MemberProfileGallery } from "@/features/customer/components/profile/MemberProfileGallery";
import {
  memberProfileTiers,
  sampleMemberProfile,
  type MemberProfilePhoto,
} from "@/features/customer/data/member-profile.data";
import {
  getMemberFollowerCount,
  getMemberProfileTab,
  initialMemberProfileState,
  memberProfileReducer,
  type MemberProfileTab,
} from "@/features/customer/utils/memberProfile";
import "@/features/customer/components/profile/member-profile.css";

export default function CustomerMemberProfilePage({ own }: { own: boolean }) {
  const [state, dispatch] = useReducer(memberProfileReducer, initialMemberProfileState);
  const [params, setParams] = useSearchParams();
  const [photo, setPhoto] = useState<MemberProfilePhoto | null>(null);
  const [message, setMessage] = useState(false);
  const tab = getMemberProfileTab(params.get("tab"));
  const currentTier = memberProfileTiers.find(
    (tier) => tier.name === sampleMemberProfile.tier,
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
  const search = tab === "tagged" ? "?tab=tagged" : "";
  return (
    <section
      className={`member-profile-page ${own ? "member-profile-page--own" : "member-profile-page--public"}`}
    >
      <article
        className="member-profile-card"
        aria-label={`${state.name} sample profile`}
      >
        <header className="member-profile-header">
          <span
            role="img"
            aria-label="Profile avatar placeholder from the design"
            className="member-profile-avatar"
          />
          <div className="min-w-0 flex-1">
            <h1 className="text-xl leading-7 font-semibold break-words">
              {state.name}
            </h1>
            <p className="member-profile-rank">
              {currentTier && <img src={currentTier.image} alt="" className="size-6" />}
              {sampleMemberProfile.tier}
            </p>
          </div>
          {own ? (
            <Link
              to={`${ROUTES.CUSTOMER_PUBLIC_PROFILE}${search}`}
              className="member-public-view"
            >
              Public view
            </Link>
          ) : (
            <span className="member-public-view">Public view</span>
          )}
        </header>
        {own && (
          <Button
            className="member-edit-button"
            onClick={() => dispatch({ type: "edit" })}
          >
            <Pencil size={18} aria-hidden="true" />
            Edit profile
          </Button>
        )}
        <dl className="member-profile-stats">
          {[
            { name: "Posts", value: sampleMemberProfile.posts },
            { name: "Following", value: sampleMemberProfile.following },
            { name: "Followers", value: getMemberFollowerCount(state.following) },
          ].map((item) => (
            <div key={item.name}>
              <dd>{item.value}</dd>
              <dt>{item.name}</dt>
            </div>
          ))}
        </dl>
        {own ? (
          <section className="member-profile-progress" aria-label="Tier progress">
            <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
              <p className="text-[#B8C1D1]">Progress to Bite Drop Legend</p>
              <p className="text-[#FF5733]">
                {sampleMemberProfile.points.toLocaleString("en-US")} /{" "}
                {sampleMemberProfile.nextTierPoints.toLocaleString("en-US")} pts
              </p>
            </div>
            <progress
              max={sampleMemberProfile.nextTierPoints}
              value={sampleMemberProfile.points}
              aria-label="Progress to Bite Drop Legend"
              className="member-progress-bar"
            />
            <div className="mt-3 mb-5 flex items-center justify-between gap-3">
              <h2 className="text-xl font-bold">Tier Badges</h2>
              <p className="text-xs text-[#B8C1D1]">4 tiers total</p>
            </div>
            <ul className="member-profile-tiers">
              {memberProfileTiers.map((tier) => (
                <li
                  key={tier.name}
                  className={
                    tier.name === sampleMemberProfile.tier
                      ? "member-tier member-tier--current"
                      : "member-tier"
                  }
                >
                  {tier.name === sampleMemberProfile.tier && (
                    <span className="member-tier-current">Current</span>
                  )}
                  <img src={tier.image} alt="" className="size-9" />
                  <h3
                    className={tier.name === "BiteDrop Legend" ? "text-[#7C8799]" : ""}
                  >
                    {tier.name}
                  </h3>
                  <p className="text-[#C8964A]">
                    {tier.points.toLocaleString("en-US")} pts
                  </p>
                  {tier.credit && <p className="text-[#2ED3D1]">{tier.credit}</p>}
                </li>
              ))}
            </ul>
          </section>
        ) : (
          <div className="member-public-actions">
            <Button
              variant="primary"
              aria-pressed={state.following}
              onClick={() => dispatch({ type: "follow" })}
            >
              {state.following ? "Following" : "Follow"}
            </Button>
            <Button onClick={() => setMessage(true)}>Message</Button>
          </div>
        )}
        <MemberProfileGallery tab={tab} onTab={changeTab} onPhoto={setPhoto} />
      </article>
      <p
        className="mt-4 text-xs leading-5 text-[#B8C1D1]"
        role="status"
        aria-live="polite"
      >
        {state.status ||
          "Static personal-profile preview. Profile details, points, counts, and photos are sample content."}
      </p>
      {!own && (
        <Link
          to={`${ROUTES.CUSTOMER_OWN_PROFILE}${search}`}
          className="mt-3 inline-flex min-h-11 items-center text-sm text-[#2ED3D1] underline"
        >
          Back to own profile
        </Link>
      )}
      {own && state.editing && (
        <MemberProfileEditor
          name={state.name}
          onClose={() => dispatch({ type: "cancel" })}
          onSave={(name) => dispatch({ type: "save", name })}
        />
      )}
      <Modal
        isOpen={message}
        onClose={() => setMessage(false)}
        titleId="member-message-title"
      >
        <div className="p-6 pt-12">
          <h2 id="member-message-title" className="text-xl font-semibold">
            Message {state.name}
          </h2>
          <p className="mt-3 text-sm leading-6 text-[var(--text-muted)]">
            Messaging this sample profile requires backend integration. No message has
            been sent.
          </p>
        </div>
      </Modal>
      <Modal
        isOpen={photo !== null}
        onClose={() => setPhoto(null)}
        titleId="member-photo-title"
      >
        {photo && (
          <div className="overflow-y-auto p-6 pt-12">
            <h2 id="member-photo-title" className="mb-4 text-xl font-semibold">
              {photo.name}
            </h2>
            <TruckImage
              alt={photo.name}
              name={photo.name}
              src={photo.image}
              className="member-profile-expanded-photo max-h-[65dvh] w-full rounded-xl"
            />
            <p className="mt-3 text-sm text-[var(--text-muted)]">
              Sample post by {state.name}
            </p>
          </div>
        )}
      </Modal>
    </section>
  );
}
