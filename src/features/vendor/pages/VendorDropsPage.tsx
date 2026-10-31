import { useState } from "react";
import { useAppSelector } from "@/app/hooks";
import { selectCurrentRole } from "@/features/auth/store/auth.selectors";
import { useVendorContext } from "@/features/vendor/utils/useVendorContext";
import { vendorAccessState } from "@/features/vendor/components/home/VendorAccessState";
import { VendorDropsWorkspace } from "@/features/vendor/components/drops/VendorDropsWorkspace";
import { EmptyState } from "@/components/states/EmptyState";
import "@/features/vendor/components/drops/drops.css";

export default function VendorDropsPage() {
  const context = useVendorContext();
  const auth = useAppSelector((s) => s.auth);
  const role = useAppSelector(selectCurrentRole);
  const access = vendorAccessState(context);
  if (access) return access;
  const scope = {
    sessionId: auth.sessionId ?? "",
    userId: auth.user?.id ?? "",
    role: role ?? "",
  };
  return (
    <TruckSelection
      key={`${scope.sessionId}:${scope.userId}:${scope.role}:${context.vendor?.id}`}
      scope={scope}
      trucks={context.trucks.currentData ?? []}
    />
  );
}
function TruckSelection({
  scope,
  trucks,
}: {
  scope: { sessionId: string; userId: string; role: string };
  trucks: ReturnType<typeof useVendorContext>["trucks"]["currentData"];
}) {
  const [selected, select] = useState("");
  if (!trucks?.length)
    return (
      <EmptyState
        title="No owned trucks"
        description="An owned truck is required for Drops and promotions."
      />
    );
  const truck = trucks.find((t) => t.id === selected);
  return (
    <div className="vendor-drops-page">
      <label className="mb-4 block">
        Food truck
        <select
          className="drop-promo-message mt-2 w-full"
          value={selected}
          onChange={(e) => select(e.target.value)}
        >
          <option value="">Choose your truck</option>
          {trucks.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>
      </label>
      {truck && (
        <VendorDropsWorkspace
          key={truck.id}
          scope={{ ...scope, truckId: truck.id }}
          truck={truck}
        />
      )}
    </div>
  );
}
