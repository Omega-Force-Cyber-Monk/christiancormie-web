import {
  ArrowLeft,
  ChevronDown,
  LockKeyhole,
  LockKeyholeOpen,
  RotateCw,
  Trash2,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useStore } from "react-redux";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { useAppDispatch, useAppSelector } from "@/app/hooks";
import type { RootState } from "@/app/store";
import { FormField } from "@/components/forms/FormField";
import { EmptyState } from "@/components/states/EmptyState";
import { ErrorState } from "@/components/states/ErrorState";
import { AppLoader } from "@/components/ui/AppLoader";
import { ConfirmationDialog } from "@/components/overlays/ConfirmationDialog/ConfirmationDialog";
import { useConfirmation } from "@/components/overlays/ConfirmationDialog/useConfirmation";
import {
  createVendorStaffSchema,
  type CreateVendorStaffValues,
} from "../../schemas/settings.schema";
import {
  createVendorStaff,
  staffOwnerMatches,
  useGetVendorStaffQuery,
  vendorStaffApi,
} from "../../api/vendorStaff.api";
import { useVendorContext, isVendorAccessError } from "../../utils/useVendorContext";
import { vendorAccessState } from "../home/VendorAccessState";
import { vendorStart } from "../../utils/vendorAdapters";
import { normalizeApiError } from "@/utils/errors/normalizeApiError";
import { applyServerFieldErrors } from "@/utils/errors/applyServerFieldErrors";
import type { SessionScope } from "@/services/api/sessionGuard";
import { VendorStaffPinDialog } from "./VendorStaffPinDialog";

export function VendorStaffManagement({ onBack }: { onBack: () => void }) {
  const context = useVendorContext();
  const auth = useAppSelector((s) => s.auth);
  const access = vendorAccessState(context);
  if (access) return access;
  const scope = {
    sessionId: auth.sessionId ?? "",
    userId: auth.user?.id ?? "",
    role: auth.user?.role ?? "",
  };
  return (
    <VendorStaffContent
      key={`${scope.sessionId}:${scope.userId}:${scope.role}:${context.vendor?.id}`}
      scope={scope}
      onBack={onBack}
    />
  );
}

function VendorStaffContent({
  scope,
  onBack,
}: {
  scope: SessionScope;
  onBack: () => void;
}) {
  const query = useGetVendorStaffQuery(scope);
  const dispatch = useAppDispatch();
  const store = useStore<RootState>();
  const [adding, setAdding] = useState(true);
  const [resetId, setResetId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");
  const pending = useRef(false);
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);
  const current = () => mounted.current && staffOwnerMatches(store.getState(), scope);
  const {
    register,
    handleSubmit,
    reset,
    resetField,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<CreateVendorStaffValues>({
    resolver: zodResolver(createVendorStaffSchema),
    defaultValues: { email: "", pin: "" },
  });
  const { confirm, confirmationProps } = useConfirmation();
  const denied = isVendorAccessError(query.error);
  const members = denied ? [] : (query.currentData?.items ?? []);
  const selected = members.find((m) => m.id === resetId);
  const unavailable = busy || query.isFetching || denied;
  async function change(run: () => Promise<unknown>, message: string) {
    if (pending.current || !current())
      throw new Error(
        "A staff change is pending or this owner session is unavailable.",
      );
    pending.current = true;
    setBusy(true);
    setStatus("");
    try {
      await run();
      if (!current()) return false;
      setStatus(message);
      toast.success(message);
      return true;
    } catch (cause) {
      if (current()) toast.error("Staff change could not be confirmed.");
      throw cause;
    } finally {
      pending.current = false;
      if (current()) setBusy(false);
    }
  }
  return (
    <section className="vendor-staff-management" aria-labelledby="vendor-staff-title">
      <div className="mb-2 flex items-center gap-3">
        <button
          type="button"
          className="grid size-10 shrink-0 place-items-center rounded-full bg-[#1B2233]"
          aria-label="Back to Settings"
          disabled={busy}
          onClick={onBack}
        >
          <ArrowLeft size={22} />
        </button>
        <h1 id="vendor-staff-title" className="text-lg leading-7 font-semibold">
          Staff Management
        </h1>
      </div>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-base font-semibold">
          Staff Members{query.currentData && !denied ? ` (${members.length})` : ""}
        </h2>
        <button
          type="button"
          className="vendor-staff-primary inline-flex items-center gap-1"
          disabled={unavailable}
          aria-expanded={adding}
          aria-controls="vendor-add-staff"
          onClick={() => {
            reset();
            setAdding(!adding);
          }}
        >
          Add Staff
          <ChevronDown size={16} aria-hidden="true" />
        </button>
      </div>
      <button
        type="button"
        className="vendor-staff-secondary mb-3"
        disabled={busy || query.isFetching}
        onClick={() => void query.refetch()}
      >
        Refresh staff
      </button>
      {query.isLoading && <AppLoader label="Loading staff" variant="compact" />}
      {query.isFetching && !query.isLoading && <p role="status">Refreshing staff…</p>}
      {query.error && (
        <ErrorState
          error={normalizeApiError(query.error)}
          onRetry={() => void query.refetch()}
        />
      )}
      {adding && !denied && (
        <form
          id="vendor-add-staff"
          className="vendor-staff-card mb-4"
          noValidate
          onSubmit={(event) => {
            void handleSubmit(async (values) => {
              if (pending.current || !current()) return;
              resetField("pin");
              try {
                if (
                  await change(
                    () => createVendorStaff(dispatch, scope, values),
                    "Staff account created. Email delivery has not been independently verified.",
                  )
                ) {
                  reset();
                  setAdding(false);
                }
              } catch (cause) {
                if (current()) {
                  const error = normalizeApiError(cause);
                  applyServerFieldErrors(error, setError, ["email", "pin"]);
                  setError("root", { message: error.message });
                }
              }
            })(event);
          }}
        >
          <FormField
            label="Staff email address"
            type="email"
            autoComplete="off"
            placeholder="Staff email address"
            disabled={unavailable || isSubmitting}
            error={errors.email?.message}
            {...register("email")}
            className="vendor-staff-email"
          />
          <div className="mt-3">
            <FormField
              label="Staff PIN"
              type="password"
              inputMode="numeric"
              autoComplete="new-password"
              maxLength={4}
              disabled={unavailable || isSubmitting}
              error={errors.pin?.message}
              {...register("pin")}
              className="vendor-staff-email"
            />
          </div>
          <p className="mt-2 text-xs text-[#B8C1D1]">
            Enter exactly four numeric digits. Leading zeros are preserved.
          </p>
          {errors.root && (
            <p role="alert" className="mt-3 text-sm text-[var(--danger)]">
              {errors.root.message}
            </p>
          )}
          <div className="mt-3 grid grid-cols-2 gap-2">
            <button
              type="submit"
              disabled={unavailable || isSubmitting}
              className="vendor-staff-primary"
            >
              {isSubmitting ? "Adding…" : "Add"}
            </button>
            <button
              type="button"
              disabled={busy}
              className="vendor-staff-secondary"
              onClick={() => {
                reset();
                setAdding(false);
              }}
            >
              Cancel
            </button>
          </div>
        </form>
      )}
      {members.length ? (
        <ul className="space-y-3" aria-label="Staff members">
          {members.map((member) => (
            <li key={member.id} className="vendor-staff-card">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <h3 className="text-sm leading-5 font-semibold wrap-anywhere">
                    {member.email}
                  </h3>
                  <p className="mt-1.5 text-xs leading-5 text-[#7D899D]">
                    Added{" "}
                    <time dateTime={member.addedAt}>{vendorStart(member.addedAt)}</time>
                  </p>
                  <p className="text-xs leading-5 text-[#7D899D]">
                    Status: {member.status}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <button
                    type="button"
                    className="vendor-staff-icon"
                    disabled
                    aria-label={`${member.status === "DISABLED" ? "Unlock" : "Lock"} unavailable for ${member.email}`}
                    title="Staff lock/unlock is not supported by the API."
                  >
                    {member.status === "DISABLED" ? (
                      <LockKeyhole size={23} />
                    ) : (
                      <LockKeyholeOpen size={23} />
                    )}
                  </button>
                  <button
                    type="button"
                    className="vendor-staff-delete"
                    disabled={unavailable}
                    aria-label={`Remove ${member.email}`}
                    onClick={() =>
                      confirm({
                        title: "Remove staff member?",
                        description: `Permanently remove ${member.email} and their staff access? This is not a lock operation.`,
                        confirmText: "Remove staff",
                        variant: "danger",
                        onConfirm: async () => {
                          await change(async () => {
                            const req = dispatch(
                              vendorStaffApi.endpoints.deleteVendorStaff.initiate({
                                scope,
                                staffId: member.id,
                                confirmed: true,
                              }),
                            );
                            try {
                              await req.unwrap();
                            } finally {
                              req.reset();
                            }
                          }, "Staff member deleted.");
                        },
                      })
                    }
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                <p className="flex items-center gap-2">
                  <LockKeyhole
                    size={14}
                    className="text-[#7D899D]"
                    aria-hidden="true"
                  />
                  <span className="text-sm text-[#7D899D]">PIN hidden</span>
                </p>
                <button
                  type="button"
                  className="vendor-staff-reset"
                  disabled={unavailable}
                  aria-label={`Reset PIN for ${member.email}`}
                  onClick={() => setResetId(member.id)}
                >
                  <RotateCw size={14} aria-hidden="true" />
                  Reset PIN
                </button>
              </div>
            </li>
          ))}
        </ul>
      ) : !query.isLoading && !query.error ? (
        <EmptyState
          title="No staff members"
          description="Use Add Staff to create a staff account with an email address and four-digit PIN."
        />
      ) : null}
      <p className="mt-4 text-xs leading-5 text-[#B8C1D1]">
        Lock/unlock is unavailable because the API does not support it. Reset PIN sets
        staff status to ACTIVE.
      </p>
      <p role="status" className="mt-3 text-sm leading-6 text-[#2ED3D1]">
        {status}
      </p>
      {confirmationProps && <ConfirmationDialog {...confirmationProps} />}
      {selected && (
        <VendorStaffPinDialog
          key={selected.id}
          member={selected}
          scope={scope}
          busy={busy}
          onCancel={() => setResetId(null)}
          onReset={async (run) => {
            const changed = await change(
              run,
              "Staff PIN reset. Email delivery has not been independently verified.",
            );
            if (changed) setResetId(null);
          }}
        />
      )}
    </section>
  );
}
