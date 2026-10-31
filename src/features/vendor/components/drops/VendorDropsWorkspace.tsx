import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { useStore } from "react-redux";
import {
  PencilLine,
  ToggleLeft,
  ToggleRight,
  Clock3,
  Plus,
  MapPin,
  Zap,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import type { RootState, AppDispatch } from "@/app/store";
import type { VendorTrucksResponse } from "../../types/vendor.types";
import { scopeMatches } from "@/services/api/sessionGuard";
import { useConfirmation } from "@/components/overlays/ConfirmationDialog/useConfirmation";
import { ConfirmationDialog } from "@/components/overlays/ConfirmationDialog/ConfirmationDialog";
import { ErrorState } from "@/components/states/ErrorState";
import { EmptyState } from "@/components/states/EmptyState";
import { AppLoader } from "@/components/ui/AppLoader";
import { normalizeApiError } from "@/utils/errors/normalizeApiError";
import {
  financialAmount,
  formatFinancialAmount,
} from "@/features/payments/utils/financialValues";
import { discoveryApi } from "@/features/customer/api/discovery.api";
import {
  vendorDropsApi,
  promotionManagementArg,
  useGoLiveTruckMutation,
  useUpdateTruckLocationMutation,
  type TruckScope,
} from "../../api/vendorDrops.api";
import { vendorApi } from "../../api/vendor.api";
import {
  parseDropCoordinates,
  durationMinutes,
  operatingStatusSchema,
  managedPromotionsSchema,
  type ManagedPromotion,
  type ServerDrop,
} from "../../schemas/dropsIntegration.schema";
import { requestDropLocation } from "../../utils/dropLocation";
import { DropsMap } from "./DropsMap";
import { DropDurationDialog } from "./DropDurationDialog";
import { DropPromoDialog } from "./DropPromoDialog";
type Draft = {
  latitude: string;
  longitude: string;
  address: string;
  title: string;
  message: string;
};
export function VendorDropsWorkspace({
  scope,
  truck,
}: {
  scope: TruckScope;
  truck: VendorTrucksResponse[number];
}) {
  const store = useStore<RootState>();
  const dispatch = store.dispatch as AppDispatch;
  const confirmation = useConfirmation();
  const mounted = useRef(true);
  const locating = useRef(false);
  const [locatingUI, setLocating] = useState(false);
  const [locationError, setLocationError] = useState("");
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);
  const form = useForm<Draft>({
    defaultValues: {
      latitude: "",
      longitude: "",
      address: truck.currentAddress ?? "",
      title: "",
      message: "",
    },
  });
  const [duration, setDuration] = useState({ hours: 1, minutes: 0 });
  const [custom, setCustom] = useState(false);
  const [promo, setPromo] = useState<ManagedPromotion | "new" | null>(null);
  const [status, setStatus] = useState(truck.operatingStatus);
  const [stageError, setStageError] = useState<unknown>(null);
  const promotions = discoveryApi.useGetTruckPromotionsQuery(
    promotionManagementArg(scope),
  );
  const parsed = managedPromotionsSchema.safeParse(promotions.currentData);
  const rows = !promotions.error && parsed.success ? parsed.data : undefined;
  const cacheKey = `${scope.sessionId}:${scope.userId}:${scope.truckId}`;
  const [goLive, go] = useGoLiveTruckMutation({ fixedCacheKey: `${cacheKey}:drop` });
  const [updateLocation, location] = useUpdateTruckLocationMutation({
    fixedCacheKey: `${cacheKey}:location`,
  });
  const drop = go.isSuccess ? go.data : undefined;
  const position =
    location.isSuccess &&
    location.data &&
    (!drop || Date.parse(location.data.locationUpdatedAt) >= Date.parse(drop.startsAt))
      ? location.data
      : drop;
  const pending =
    !!confirmation.confirmationProps?.isProcessing ||
    go.isLoading ||
    location.isLoading;
  async function acquireLocation() {
    if (locating.current) return;
    locating.current = true;
    setLocating(true);
    setLocationError("");
    try {
      const p = await requestDropLocation(
        typeof navigator !== "undefined" ? navigator.geolocation : undefined,
      );
      if (mounted.current && scopeMatches(store.getState(), scope)) {
        form.setValue("latitude", String(p.latitude));
        form.setValue("longitude", String(p.longitude));
        setLocationError(
          `Device accuracy: ${p.accuracy} metres. Review coordinates and enter the correct address.`,
        );
      }
    } catch (e) {
      if (mounted.current && scopeMatches(store.getState(), scope))
        setLocationError(e instanceof Error ? e.message : "Location unavailable.");
    } finally {
      locating.current = false;
      if (mounted.current) setLocating(false);
    }
  }
  function confirmLocation(d: Draft, live: boolean) {
    const c = parseDropCoordinates(d.latitude, d.longitude);
    const minutes = durationMinutes(duration.hours, duration.minutes);
    if (!c || minutes === null) {
      setLocationError(
        "Enter both valid coordinates and a duration from 1 to 1440 minutes.",
      );
      return;
    }
    setStageError(null);
    confirmation.confirm({
      title: live ? "Go live with this Drop?" : "Update truck location?",
      description: `${truck.name} (${truck.id}): ${c.latitude}, ${c.longitude}, ${minutes} minutes. ${live ? "Location and operating status are updated before Drop creation. Partial failures remain visible. Promotions are not attached." : "This updates location only; it does not create a Drop."}`,
      confirmText: live ? "Go live" : "Update location",
      onConfirm: async () => {
        const req = live
          ? goLive({
              ...scope,
              confirmed: true,
              body: {
                ...c,
                durationMinutes: minutes,
                ...(d.address.trim() ? { address: d.address.trim() } : {}),
                ...(d.title ? { title: d.title } : {}),
                ...(d.message ? { message: d.message } : {}),
              },
            })
          : updateLocation({
              ...scope,
              confirmed: true,
              body: {
                ...c,
                validForMinutes: minutes,
                ...(d.address.trim() ? { address: d.address.trim() } : {}),
              },
            });
        try {
          const r = await req.unwrap();
          if (r && mounted.current && scopeMatches(store.getState(), scope))
            toast.success(
              live
                ? "Location, operating status and Drop creation confirmed."
                : "Truck location updated.",
            );
        } catch (e) {
          if (mounted.current && scopeMatches(store.getState(), scope))
            setStageError(e);
          throw e;
        }
      },
    });
  }
  function confirmStatus() {
    const r = operatingStatusSchema.safeParse(status);
    if (!r.success) return;
    confirmation.confirm({
      title: "Change operating status?",
      description: `Set ${truck.name} to ${r.data}? This does not stop or cancel an existing Drop.`,
      confirmText: "Update status",
      onConfirm: async () => {
        const req = dispatch(
          vendorDropsApi.endpoints.setTruckOperatingStatus.initiate({
            ...scope,
            confirmed: true,
            operatingStatus: r.data,
          }),
        );
        try {
          const response = await req.unwrap();
          if (response && mounted.current && scopeMatches(store.getState(), scope))
            toast.success(`Operating status: ${response.operatingStatus}.`);
        } finally {
          req.reset();
        }
      },
    });
  }
  function togglePromotion(p: ManagedPromotion) {
    confirmation.confirm({
      title: p.isActive ? "Disable promotion?" : "Enable promotion?",
      description: `${p.title}. Disabling is not deletion; validity dates still apply.`,
      confirmText: p.isActive ? "Disable" : "Enable",
      onConfirm: async () => {
        const req = dispatch(
          vendorDropsApi.endpoints.updateTruckPromotion.initiate({
            ...scope,
            promotionId: p.id,
            confirmed: true,
            body: { isActive: !p.isActive },
          }),
        );
        try {
          const r = await req.unwrap();
          if (r && mounted.current && scopeMatches(store.getState(), scope))
            toast.success(r.isActive ? "Promotion enabled." : "Promotion disabled.");
        } finally {
          req.reset();
        }
      },
    });
  }
  return (
    <div className="vendor-drops-page">
      <h1 className="sr-only">Vendor Drops and promotions</h1>
      <div className="vendor-drops-card">
        <DropsMap
          live={{
            truckName: truck.name,
            status: truck.operatingStatus,
            address: position
              ? "currentAddress" in position
                ? position.currentAddress
                : position.address
              : truck.currentAddress,
            ...(position
              ? { latitude: position.latitude, longitude: position.longitude }
              : {}),
          }}
        />
        <div className="my-4 flex flex-wrap gap-3">
          <label>
            Operating status
            <select
              className="drop-promo-message"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              {operatingStatusSchema.options.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </label>
          <button
            type="button"
            className="request-secondary"
            disabled={pending}
            onClick={confirmStatus}
          >
            Update status
          </button>
          <button
            type="button"
            className="request-secondary"
            disabled={pending}
            onClick={() => {
              void dispatch(
                vendorApi.endpoints.getMyTrucks.initiate(undefined, {
                  forceRefetch: true,
                  subscribe: false,
                }),
              );
              void promotions.refetch();
            }}
          >
            Refresh server data
          </button>
        </div>
        <form
          className="space-y-4"
          noValidate
          onSubmit={(e) => {
            e.preventDefault();
            if (!pending) void form.handleSubmit((d) => confirmLocation(d, true))(e);
          }}
        >
          <fieldset disabled={pending} className="space-y-3">
            <button
              type="button"
              className="request-secondary"
              disabled={locatingUI}
              onClick={() => void acquireLocation()}
            >
              {locatingUI ? "Requesting location…" : "Use my device location"}
            </button>
            <p className="text-xs">
              Location is requested only when you choose this button. You may enter
              valid coordinates instead.
            </p>
            <label className="block">
              Latitude
              <input
                className="drop-promo-message w-full"
                inputMode="decimal"
                {...form.register("latitude")}
              />
            </label>
            <label className="block">
              Longitude
              <input
                className="drop-promo-message w-full"
                inputMode="decimal"
                {...form.register("longitude")}
              />
            </label>
            <label className="block">
              Address (optional; blank clears the address)
              <input
                className="drop-promo-message w-full"
                {...form.register("address")}
              />
            </label>
            <label className="block">
              Drop title (optional)
              <input
                className="drop-promo-message w-full"
                maxLength={255}
                {...form.register("title")}
              />
            </label>
            <label className="block">
              Message (optional)
              <textarea
                className="drop-promo-message w-full"
                {...form.register("message")}
              />
            </label>
            {locationError && (
              <p role="status" className="text-xs">
                {locationError}
              </p>
            )}
            <fieldset>
              <legend>Drop Duration</legend>
              <div className="drop-preset-options">
                {[1, 2, 4, 24].map((hours) => (
                  <button
                    type="button"
                    key={hours}
                    aria-pressed={duration.hours === hours && duration.minutes === 0}
                    onClick={() => setDuration({ hours, minutes: 0 })}
                  >
                    <Clock3 size={12} />
                    {hours === 24
                      ? "All day (24 hours)"
                      : `${hours} hour${hours === 1 ? "" : "s"}`}
                  </button>
                ))}
                <button type="button" onClick={() => setCustom(true)}>
                  Custom · {duration.hours}h {duration.minutes}m
                </button>
              </div>
            </fieldset>
            <button
              type="button"
              className="request-secondary"
              onClick={() => void form.handleSubmit((d) => confirmLocation(d, false))()}
            >
              Update location only
            </button>
            <button type="submit" className="drop-go-live">
              <MapPin size={24} />
              Go Live Now
              <Zap size={24} />
            </button>
          </fieldset>
        </form>
        {stageError != null && (
          <>
            <ErrorState error={normalizeApiError(stageError)} />
            <p className="mt-2 text-xs">
              Some earlier operations may have succeeded. Truck data has been refreshed.
              A missing Drop acknowledgment is not Go Live success; automatic retry is
              blocked if creation is uncertain.
            </p>
          </>
        )}
        {drop && <ServerDropDetails drop={drop} />}
        <button className="drop-end" type="button" disabled>
          Stop / delete Drop unavailable
        </button>
        <div className="drop-add-promo">
          <span>Promotions (independent of Drops)</span>
          <button
            type="button"
            disabled={pending || promotions.isFetching || !!promotions.error}
            onClick={() => setPromo("new")}
          >
            <Plus size={14} />
            New Promo
          </button>
        </div>
        {promotions.isFetching && (
          <AppLoader variant="compact" label="Loading promotions" />
        )}
        {promotions.error ? (
          <ErrorState
            error={normalizeApiError(promotions.error)}
            onRetry={() => void promotions.refetch()}
          />
        ) : promotions.currentData && !parsed.success ? (
          <ErrorState
            error={{ kind: "UNKNOWN", message: "Promotion records are unavailable." }}
          />
        ) : (
          rows && (
            <PromotionRows
              rows={rows}
              disabled={pending || promotions.isFetching}
              onEdit={setPromo}
              onToggle={togglePromotion}
            />
          )
        )}
        <p className="mt-3 text-xs">
          Up to 100 promotions, including disabled/expired records. No promotion delete
          or promo-to-Drop attachment API is available.
        </p>
      </div>
      {custom && (
        <DropDurationDialog
          backend
          value={duration}
          onSet={(d) => {
            setDuration(d);
            setCustom(false);
          }}
          onClose={() => setCustom(false)}
        />
      )}
      {promo && (
        <DropPromoDialog
          scope={scope}
          promotion={promo === "new" ? null : promo}
          onClose={() => setPromo(null)}
          onSaved={() => setPromo(null)}
        />
      )}
      {confirmation.confirmationProps && (
        <ConfirmationDialog {...confirmation.confirmationProps} />
      )}
    </div>
  );
}
export function ServerDropDetails({ drop: d }: { drop: ServerDrop }) {
  return (
    <section className="mt-4 space-y-2 break-words" aria-label="Last confirmed Drop">
      <h2 className="font-semibold">Last confirmed Drop</h2>
      <p>Drop ID: {d.id}</p>
      <p>Truck ID: {d.foodTruckId}</p>
      <p>Server-reported status: {d.status}</p>
      <p>{d.title}</p>
      <p>{d.message}</p>
      <p>{d.address ?? "Address not supplied"}</p>
      <p>
        {d.latitude}, {d.longitude}
      </p>
      <p>Starts: {d.startsAt}</p>
      <p>Ends: {d.endsAt ?? "Not reported"}</p>
      <p className="text-xs">
        This is the last returned creation record, not a current Drop-history feed.
        Operating status does not cancel it. No provider notification is claimed.
      </p>
    </section>
  );
}
export function PromotionRows({
  rows,
  disabled,
  onEdit,
  onToggle,
}: {
  rows: ManagedPromotion[];
  disabled: boolean;
  onEdit: (p: ManagedPromotion) => void;
  onToggle: (p: ManagedPromotion) => void;
}) {
  if (!rows.length) return <EmptyState title="No promotions" />;
  return (
    <section aria-label="Truck promotions" className="mt-6 space-y-4">
      {rows.map((p) => (
        <article className="drop-promo-row" key={p.id}>
          <div className="min-w-0 flex-1 break-words">
            <h2 className="font-semibold">{p.title}</h2>
            <p className="text-xs">{p.description}</p>
            <p className="text-xs">
              {p.type}:{" "}
              {p.type === "PERCENTAGE"
                ? p.value === null
                  ? "Not supplied"
                  : `${p.value}%`
                : formatFinancialAmount(financialAmount(p.value, null, "major"))}
            </p>
            <p className="text-xs">
              {p.startsAt} — {p.endsAt}
            </p>
            <p className="text-xs">
              Enabled: {p.isActive ? "Yes" : "No"} · Followers only:{" "}
              {p.isFollowerOnly ? "Yes" : "No"}
            </p>
            <p className="text-xs">
              Coupon: {p.couponCode ?? "None"} · Usage limit: {p.usageLimit ?? "None"}
            </p>
            <p className="text-xs">
              Minimum spend:{" "}
              {formatFinancialAmount(financialAmount(p.minimumSpend, null, "major"))} ·
              Maximum discount:{" "}
              {formatFinancialAmount(financialAmount(p.maximumDiscount, null, "major"))}
            </p>
            <p className="text-xs">Promotion ID: {p.id}</p>
          </div>
          <div className="drop-promo-row-actions">
            <button
              type="button"
              role="switch"
              aria-checked={p.isActive}
              aria-label={`${p.isActive ? "Disable" : "Enable"} ${p.title}`}
              disabled={disabled}
              onClick={() => onToggle(p)}
            >
              {p.isActive ? <ToggleRight /> : <ToggleLeft />}
            </button>
            <button
              type="button"
              aria-label={`Edit ${p.title}`}
              disabled={disabled}
              onClick={() => onEdit(p)}
            >
              <PencilLine />
            </button>
            <button type="button" disabled aria-label="Promotion delete unavailable">
              <Trash2 size={16} />
            </button>
          </div>
        </article>
      ))}
    </section>
  );
}
