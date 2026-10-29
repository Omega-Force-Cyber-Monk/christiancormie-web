import { ArrowLeft, Send, Star } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/overlays/Modal/Modal";
import { TruckImage } from "@/features/customer/components/discover/DiscoverTruckCard";
import {
  communityInterestedTrucks,
  type CommunityInterestedTruck,
} from "@/features/customer/data/community-requests.data";
import type { CommunityPost } from "@/features/community/schemas/community.schema";
import { ConnectedCommunityInterests } from "@/features/community/components/ConnectedCommunityInterests";

type PreviewProps = {
  postId: string;
  decisions: Record<string, "invited" | "declined">;
  onDecision: (truckId: string, decision: "invited" | "declined") => void;
  onBack: () => void;
};
export function CommunityInterestedView(
  props: PreviewProps | { livePost: CommunityPost; onBack: () => void },
) {
  return "livePost" in props ? (
    <ConnectedCommunityInterests
      key={props.livePost.id}
      post={props.livePost}
      onBack={props.onBack}
    />
  ) : (
    <LegacyCommunityInterestedView {...props} />
  );
}
function LegacyCommunityInterestedView({
  postId,
  decisions,
  onDecision,
  onBack,
}: {
  postId: string;
  decisions: Record<string, "invited" | "declined">;
  onDecision: (truckId: string, decision: "invited" | "declined") => void;
  onBack: () => void;
}) {
  const [profile, setProfile] = useState<CommunityInterestedTruck | null>(null);
  return (
    <section className="community-interested-view">
      <div className="community-page-heading">
        <Button aria-label="Back to My Requests" onClick={onBack}>
          <ArrowLeft size={20} />
        </Button>
        <h1>Interested trucks</h1>
      </div>
      <div className="space-y-6">
        {communityInterestedTrucks.map((truck) => {
          const decision = decisions[`${postId}:${truck.id}`];
          return (
            <article key={truck.id} className="community-truck-interest">
              <div className="flex flex-wrap items-center gap-3">
                <TruckImage
                  name={truck.name}
                  src={truck.image}
                  className="size-[76px] rounded-xl"
                />
                <div className="min-w-0 flex-1">
                  <h2 className="text-lg font-semibold">{truck.name}</h2>
                  <p className="text-sm text-[#B8C1D1]">{truck.cuisine}</p>
                  <p className="flex items-center gap-1 text-sm">
                    <Star size={16} className="fill-[#FFB547] text-[#FFB547]" />
                    {truck.rating}
                    <span className="ml-2 text-[#B8C1D1]">{truck.distance}</span>
                  </p>
                </div>
                <Button className="community-primary" onClick={() => setProfile(truck)}>
                  View Profile
                </Button>
              </div>
              <p className="mt-6 rounded-2xl bg-[#242D42] p-4 text-sm leading-5">
                {truck.description}
              </p>
              <div className="mt-4 grid grid-cols-2 gap-3">
                <Button
                  onClick={() => onDecision(truck.id, "declined")}
                  disabled={decision === "declined"}
                >
                  {decision === "declined" ? "Declined locally" : "Decline"}
                </Button>
                <Button
                  className="community-primary"
                  onClick={() => onDecision(truck.id, "invited")}
                  disabled={decision === "invited"}
                >
                  <Send size={16} />
                  {decision === "invited" ? "Invited locally" : "Invite (preview)"}
                </Button>
              </div>
              <p role="status" className="mt-2 text-xs text-[#B8C1D1]">
                {decision
                  ? `Sample truck ${decision}. No vendor was contacted.`
                  : "Local invitation preview only."}
              </p>
            </article>
          );
        })}
      </div>
      <Modal
        isOpen={profile !== null}
        onClose={() => setProfile(null)}
        titleId="community-truck-profile-title"
      >
        {profile && (
          <div className="overflow-y-auto p-6 pt-12">
            <TruckImage
              name={profile.name}
              src={profile.image}
              className="h-48 w-full rounded-xl"
            />
            <h2 id="community-truck-profile-title" className="mt-4 text-xl font-bold">
              {profile.name}
            </h2>
            <p className="mt-2 text-sm text-[#B8C1D1]">
              {profile.cuisine} · {profile.rating} stars · {profile.distance}
            </p>
            <p className="mt-3 text-sm leading-6">{profile.description}</p>
            <p className="mt-3 text-xs text-[#B8C1D1]">
              Sample interested-truck profile from the design.
            </p>
          </div>
        )}
      </Modal>
    </section>
  );
}
