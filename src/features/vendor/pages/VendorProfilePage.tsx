import { Grid3X3, MessageSquare, Utensils } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import { useSearchParams } from "react-router";
import { toast } from "sonner";
import { useAccount } from "@/features/account/hooks/useAccount";
import { useVendorContext } from "../utils/useVendorContext";
import { vendorAccessState } from "../components/home/VendorAccessState";
import {
  useGetTruckCuisinesQuery,
  useSaveTruckProfileMutation,
} from "../api/truckSettings.api";
import { VendorProfileSummary } from "../components/profile/VendorProfileSummary";
import { VendorProfileEditor } from "../components/profile/VendorProfileEditor";
import {
  VendorProfileGallery,
  VendorProfileReviews,
} from "../components/profile/VendorProfileContent";
import { truckForm, truckProfilePatch, type OwnedTruck } from "../utils/truckSettings";
import type { TruckProfileForm } from "../schemas/truckSettings.schema";
import type { SessionScope } from "@/services/api/sessionGuard";
import { remoteMedia } from "@/utils/files/remoteMedia";
import { parseVendorProfileTab } from "../utils/profileState";
import { ErrorState } from "@/components/states/ErrorState";
import { ManagedTruckGallery } from "../components/profile/ManagedTruckGallery";
import { ManagedVendorMenu } from "../components/profile/ManagedVendorMenu";
import { useUploadTruckAssetMutation } from "../api/truckAssets.api";
import { persistTruckAsset } from "../utils/persistTruckAsset";
import type { UploadedAsset } from "../schemas/truckAssets.schema";
import "../components/profile/profile.css";
const tabs = [
  { id: "menu", label: "Menu", Icon: Utensils },
  { id: "gallery", label: "Gallery", Icon: Grid3X3 },
  { id: "reviews", label: "Reviews", Icon: MessageSquare },
] as const;
function TruckWorkspace({
  truck,
  scope,
  verified,
}: {
  truck: OwnedTruck;
  scope: SessionScope;
  verified: boolean;
}) {
  const id = useId();
  const [params, setParams] = useSearchParams();
  const tab = parseVendorProfileTab(params.get("tab"));
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<TruckProfileForm>();
  const [photo, setPhoto] = useState<File>();
  const region = useRef<HTMLDivElement>(null);
  const mounted = useRef(false);
  const baseline = useRef<TruckProfileForm | undefined>(undefined);
  const account = useAccount();
  const cuisines = useGetTruckCuisinesQuery(scope);
  const [save] = useSaveTruckProfileMutation();
  const [upload] = useUploadTruckAssetMutation();
  const uploaded = useRef<{ file: File; asset: UploadedAsset } | undefined>(undefined);
  useEffect(() => {
    if (mounted.current) region.current?.focus();
    mounted.current = true;
  }, [editing]);
  async function saveProfile(values: TruckProfileForm) {
    const body = truckProfilePatch(truck, values, baseline.current);
    if (!Object.keys(body).length && !photo) {
      setEditing(false);
      setDraft(undefined);
      baseline.current = undefined;
      return;
    }
    if (photo) {
      const selected = photo;
      await persistTruckAsset({
        uploaded:
          uploaded.current?.file === selected ? uploaded.current.asset : undefined,
        upload: () => upload({ scope, truckId: truck.id, file: selected }).unwrap(),
        remember: (asset) => {
          uploaded.current = { file: selected, asset };
        },
        persist: (asset) =>
          save({
            scope,
            truckId: truck.id,
            body: { ...body, profileImageUrl: asset.url },
          }).unwrap(),
        isCurrent: account.isCurrent,
      });
    } else await save({ scope, truckId: truck.id, body }).unwrap();
    if (account.isCurrent()) {
      setEditing(false);
      setDraft(undefined);
      baseline.current = undefined;
      setPhoto(undefined);
      uploaded.current = undefined;
      toast.success("Truck profile saved.");
    }
  }
  return (
    <section
      className={`vendor-profile-page${editing ? " vendor-profile-page--editing" : ""}`}
    >
      <div ref={region} tabIndex={-1} className="outline-none">
        {editing ? (
          <>
            {cuisines.isError && <ErrorState onRetry={() => void cuisines.refetch()} />}
            {!cuisines.currentData && (
              <p role="status">
                Cuisine choices unavailable; other profile fields can still be edited.
              </p>
            )}
            <VendorProfileEditor
              draft={draft ?? truckForm(truck)}
              photo={photo ?? remoteMedia(truck.profileImageUrl)}
              onPhoto={setPhoto}
              onDraft={setDraft}
              onBack={(v) => {
                setDraft(v);
                setEditing(false);
              }}
              onSave={saveProfile}
              cuisineOptions={(
                cuisines.currentData ??
                truck.cuisines?.map((c) => ({
                  id: c.cuisineId,
                  name: c.cuisine.name,
                })) ??
                []
              ).map((c) => ({
                id: c.id,
                label: c.name,
              }))}
              maximumGuestCapacity={truck.maximumGuestCapacity}
              cuisineDisabled={!cuisines.currentData}
              isCurrent={account.isCurrent}
            />
          </>
        ) : (
          <div className={`vendor-profile-surface vendor-profile-surface--${tab}`}>
            <VendorProfileSummary
              values={truckForm(truck)}
              photo={remoteMedia(truck.profileImageUrl)}
              compact={tab === "reviews"}
              onEdit={() => {
                if (!draft) {
                  const original = truckForm(truck);
                  baseline.current = original;
                  setDraft(original);
                }
                setEditing(true);
              }}
              meta={{
                capacity: truck.maximumGuestCapacity ?? null,
                followers: truck.followerCount ?? null,
                rating: truck.averageRating ?? null,
                verified,
              }}
            />
            <div
              className="vendor-profile-tabs"
              role="tablist"
              aria-label="Vendor profile sections"
            >
              {tabs.map((entry, index) => (
                <button
                  key={entry.id}
                  id={`${id}-${entry.id}-tab`}
                  type="button"
                  role="tab"
                  aria-label={entry.label}
                  aria-selected={tab === entry.id}
                  aria-controls={`${id}-${entry.id}-panel`}
                  tabIndex={tab === entry.id ? 0 : -1}
                  onClick={() =>
                    setParams((p) => {
                      const n = new URLSearchParams(p);
                      n.set("tab", entry.id);
                      return n;
                    })
                  }
                  onKeyDown={(e) => {
                    if (["ArrowLeft", "ArrowRight", "Home", "End"].includes(e.key)) {
                      e.preventDefault();
                      const next =
                        tabs[
                          e.key === "Home"
                            ? 0
                            : e.key === "End"
                              ? 2
                              : (index +
                                  (e.key === "ArrowLeft" ? -1 : 1) +
                                  tabs.length) %
                                tabs.length
                        ];
                      setParams((p) => {
                        const n = new URLSearchParams(p);
                        n.set("tab", next.id);
                        return n;
                      });
                      document.getElementById(`${id}-${next.id}-tab`)?.focus();
                    }
                  }}
                >
                  <entry.Icon size={21} aria-hidden="true" />
                </button>
              ))}
            </div>
            {tabs.map((entry) => (
              <div
                key={entry.id}
                role="tabpanel"
                id={`${id}-${entry.id}-panel`}
                aria-labelledby={`${id}-${entry.id}-tab`}
                hidden={tab !== entry.id}
              >
                {tab === entry.id &&
                  (entry.id === "gallery" ? (
                    <>
                      <ManagedTruckGallery truck={truck} scope={scope} />
                      <VendorProfileGallery />
                    </>
                  ) : entry.id === "reviews" ? (
                    <VendorProfileReviews />
                  ) : (
                    <ManagedVendorMenu truck={truck} scope={scope} />
                  ))}
              </div>
            ))}
          </div>
        )}
      </div>
      <p className="mt-4 text-xs leading-5 text-[#B8C1D1]">
        Capacity range and address-only changes are unavailable. Gallery and
        social/review reads use backend data.
      </p>
    </section>
  );
}
function VendorProfileWorkspace() {
  const context = useVendorContext();
  const account = useAccount();
  const [selected, setSelected] = useState("");
  const access = vendorAccessState(context);
  if (access) return access;
  const trucks = context.trucks.currentData ?? [];
  const truck = trucks.find(
    (t) => t.id === (selected || (trucks.length === 1 ? trucks[0].id : "")),
  );
  return (
    <>
      {trucks.length > 1 && (
        <label>
          Food truck
          <select value={selected} onChange={(e) => setSelected(e.target.value)}>
            <option value="">Choose a truck</option>
            {trucks.map((t) => (
              <option value={t.id} key={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </label>
      )}
      {truck ? (
        <TruckWorkspace
          key={`${account.key}:${truck.id}`}
          truck={truck}
          scope={account.scope}
          verified={context.vendor?.verificationBadge?.isVerified ?? false}
        />
      ) : (
        <p>
          {trucks.length
            ? "Choose the owned food truck to edit."
            : "No food truck is available. Complete vendor onboarding."}
        </p>
      )}
    </>
  );
}
export default function VendorProfilePage() {
  const account = useAccount();
  return <VendorProfileWorkspace key={account.key} />;
}
