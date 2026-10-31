import { useAppSelector } from "@/app/hooks";
import { selectCurrentRole } from "@/features/auth/store/auth.selectors";
import { useVendorContext } from "@/features/vendor/utils/useVendorContext";
import { vendorAccessState } from "@/features/vendor/components/home/VendorAccessState";
import { VendorBookingsWorkspace } from "@/features/vendor/components/requests/VendorBookingsWorkspace";
import "@/features/vendor/components/requests/requests.css";

export default function VendorOrdersPage() {
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
    <div className="vendor-requests-page">
      <VendorBookingsWorkspace
        key={`${scope.sessionId}:${scope.userId}:${scope.role}:${context.vendor?.id}`}
        scope={scope}
      />
    </div>
  );
}
