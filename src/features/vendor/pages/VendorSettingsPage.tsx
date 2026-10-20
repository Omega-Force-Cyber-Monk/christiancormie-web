import {
  ChartNoAxesCombined,
  ChevronRight,
  CircleHelp,
  LogOut,
  Settings,
  ShieldCheck,
  Trash2,
  UsersRound,
} from "lucide-react";
import { useReducer, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router";
import { useAppDispatch } from "@/app/hooks";
import { ROUTES } from "@/constants/routes";
import { clearSession } from "@/features/auth/store/auth.slice";
import { VendorHomeDialog } from "@/features/vendor/components/home/VendorHomeDialog";
import { VendorPasswordPreviewForm } from "@/features/vendor/components/settings/VendorPasswordPreviewForm";
import { VendorStaffManagement } from "@/features/vendor/components/settings/VendorStaffManagement";
import {
  vendorSettingsPreviews,
  type VendorSettingsPreview,
} from "@/features/vendor/data/settings.data";
import {
  initialVendorSettingsState,
  parseVendorSettingsView,
  vendorSettingsReducer,
  vendorSettingsViewQuery,
} from "@/features/vendor/utils/settingsState";
import "@/features/vendor/components/settings/settings.css";

export default function VendorSettingsPage() {
  const [params, setParams] = useSearchParams();
  const view = parseVendorSettingsView(params.get("view"));
  const [state, dispatch] = useReducer(
    vendorSettingsReducer,
    undefined,
    initialVendorSettingsState,
  );
  const [passwordOpen, setPasswordOpen] = useState(true);
  const [passwordStatus, setPasswordStatus] = useState("");
  const [preview, setPreview] = useState<VendorSettingsPreview | null>(null);
  const appDispatch = useAppDispatch();
  const navigate = useNavigate();
  const previewContent = preview ? vendorSettingsPreviews[preview] : null;
  return (
    <div className="vendor-settings-page">
      {view === "staff" ? (
        <VendorStaffManagement
          state={state}
          dispatch={dispatch}
          onBack={() => {
            void setParams(vendorSettingsViewQuery(params, "settings"));
          }}
        />
      ) : (
        <section className="vendor-settings-card" aria-label="Vendor Settings">
          <h1 className="sr-only">Settings</h1>
          <h2 className="mb-3 text-lg leading-7 font-semibold">Manage</h2>
          <div className="space-y-1">
            <button
              type="button"
              className="vendor-settings-row"
              onClick={() => {
                void setParams(vendorSettingsViewQuery(params, "staff"));
              }}
            >
              <UsersRound size={22} aria-hidden="true" />
              Staff Management
              <ChevronRight className="ml-auto" size={16} aria-hidden="true" />
            </button>
            <button
              type="button"
              className="vendor-settings-row"
              onClick={() => setPreview("pricing")}
            >
              <ChartNoAxesCombined size={22} aria-hidden="true" />
              Plan and pricing
              <ChevronRight className="ml-auto" size={16} aria-hidden="true" />
            </button>
            <button
              type="button"
              className="vendor-settings-row"
              onClick={() => setPreview("verification")}
            >
              <ShieldCheck size={22} aria-hidden="true" />
              Truck verification
              <ChevronRight className="ml-auto" size={16} aria-hidden="true" />
            </button>
          </div>
          <h2 className="mt-4 mb-3 text-lg leading-7 font-semibold">Security</h2>
          <button
            type="button"
            className="vendor-settings-row"
            aria-expanded={passwordOpen}
            aria-controls="vendor-password-form"
            onClick={() => setPasswordOpen(!passwordOpen)}
          >
            <Settings size={22} aria-hidden="true" />
            Change password
            <ChevronRight className="ml-auto" size={16} aria-hidden="true" />
          </button>
          {passwordOpen && (
            <VendorPasswordPreviewForm
              onCancel={() => {
                setPasswordOpen(false);
                setPasswordStatus("");
              }}
              onValidated={() =>
                setPasswordStatus(
                  "Password fields validated locally. Your account password has not been changed.",
                )
              }
            />
          )}
          <p
            role="status"
            className={
              passwordStatus ? "mt-3 text-sm leading-6 text-[#2ED3D1]" : "sr-only"
            }
          >
            {passwordStatus}
          </p>
          <button
            type="button"
            className="vendor-settings-row mt-4"
            onClick={() => setPreview("support")}
          >
            <CircleHelp size={20} aria-hidden="true" />
            Help and support
          </button>
          <button
            type="button"
            className="vendor-settings-account mt-6 text-[#FF5733]"
            onClick={() => {
              appDispatch(clearSession());
              void navigate(ROUTES.LOGIN, { replace: true });
            }}
          >
            <LogOut size={21} aria-hidden="true" />
            Sign Out
          </button>
          <button
            type="button"
            className="vendor-settings-account mt-4 text-[#FF321A]"
            onClick={() => setPreview("delete")}
          >
            <Trash2 size={21} aria-hidden="true" />
            Delete account
          </button>
        </section>
      )}
      <p
        role="status"
        className={
          view === "staff" && state.status
            ? "mt-3 max-w-[414px] text-sm leading-6 text-[#2ED3D1]"
            : "sr-only"
        }
      >
        {view === "staff" ? state.status : ""}
      </p>
      {previewContent && (
        <VendorHomeDialog title={previewContent.title} onClose={() => setPreview(null)}>
          <p className="text-sm leading-6 text-[#B8C1D1]">
            {previewContent.description}
          </p>
          {preview === "support" && (
            <Link
              className="mt-4 inline-flex min-h-11 items-center text-[#2ED3D1] underline"
              to={ROUTES.HELP_CENTER}
            >
              Open Help Center
            </Link>
          )}
          <button
            type="button"
            className="vendor-settings-secondary mt-5 w-full"
            onClick={() => setPreview(null)}
          >
            Close preview
          </button>
        </VendorHomeDialog>
      )}
    </div>
  );
}
