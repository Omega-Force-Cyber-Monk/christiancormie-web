import {
  ArrowLeft,
  ChevronDown,
  LockKeyhole,
  LockKeyholeOpen,
  RotateCw,
  Trash2,
} from "lucide-react";
import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { FormField } from "@/components/forms/FormField";
import { EmptyState } from "@/components/states/EmptyState";
import { ConfirmationDialog } from "@/components/overlays/ConfirmationDialog/ConfirmationDialog";
import { useConfirmation } from "@/components/overlays/ConfirmationDialog/useConfirmation";
import {
  vendorStaffEmailSchema,
  type VendorStaffEmailValues,
} from "@/features/vendor/schemas/settings.schema";
import {
  formatStaffDate,
  hasStaffEmail,
  type VendorSettingsAction,
  type VendorSettingsState,
} from "@/features/vendor/utils/settingsState";

export function VendorStaffManagement({
  state,
  dispatch,
  onBack,
}: {
  state: VendorSettingsState;
  dispatch: (action: VendorSettingsAction) => void;
  onBack: () => void;
}) {
  const [adding, setAdding] = useState(true);
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<VendorStaffEmailValues>({
    resolver: zodResolver(vendorStaffEmailSchema),
    defaultValues: { email: "" },
  });
  const { confirm, confirmationProps } = useConfirmation();
  return (
    <section className="vendor-staff-management" aria-labelledby="vendor-staff-title">
      <div className="mb-2 flex items-center gap-3">
        <button
          type="button"
          className="grid size-10 shrink-0 place-items-center rounded-full bg-[#1B2233]"
          aria-label="Back to Settings"
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
          Staff Members ({state.staff.length})
        </h2>
        <button
          type="button"
          className="vendor-staff-primary inline-flex items-center gap-1"
          aria-expanded={adding}
          aria-controls="vendor-add-staff"
          onClick={() => setAdding(!adding)}
        >
          Add Staff
          <ChevronDown size={16} aria-hidden="true" />
        </button>
      </div>
      {adding && (
        <form
          id="vendor-add-staff"
          className="vendor-staff-card mb-4"
          noValidate
          onSubmit={(event) => {
            void handleSubmit(({ email }) => {
              if (hasStaffEmail(state.staff, email)) {
                setError("email", {
                  message: "This email address is already in the local staff list.",
                });
                return;
              }
              dispatch({
                type: "add",
                id: crypto.randomUUID(),
                email,
                addedOn: new Date().toISOString().slice(0, 10),
              });
              reset();
              setAdding(false);
            })(event);
          }}
        >
          <FormField
            label="Staff email address"
            aria-label="Staff email address"
            type="email"
            autoComplete="off"
            placeholder="Staff email address"
            error={errors.email?.message}
            {...register("email")}
            className="vendor-staff-email"
          />
          <div className="mt-3 grid grid-cols-2 gap-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="vendor-staff-primary"
            >
              Add
            </button>
            <button
              type="button"
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
      {state.staff.length ? (
        <ul className="space-y-3" aria-label="Sample staff members">
          {state.staff.map((member) => (
            <li key={member.id} className="vendor-staff-card">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <h3 className="text-sm leading-5 font-semibold wrap-anywhere">
                    {member.email}
                  </h3>
                  <p className="mt-1.5 text-xs leading-5 text-[#7D899D]">
                    Added{" "}
                    <time dateTime={member.addedOn}>
                      {formatStaffDate(member.addedOn)}
                    </time>
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <button
                    type="button"
                    className="vendor-staff-icon"
                    aria-pressed={member.locked}
                    aria-label={`${member.locked ? "Unlock" : "Lock"} local sample access for ${member.email}`}
                    onClick={() => dispatch({ type: "toggle-lock", id: member.id })}
                  >
                    {member.locked ? (
                      <LockKeyhole size={23} />
                    ) : (
                      <LockKeyholeOpen size={23} />
                    )}
                  </button>
                  <button
                    type="button"
                    className="vendor-staff-delete"
                    aria-label={`Remove ${member.email} from sample staff`}
                    onClick={() =>
                      confirm({
                        title: "Remove sample staff member?",
                        description: `Remove ${member.email} from this local list? Real staff access is unchanged.`,
                        confirmText: "Remove sample",
                        variant: "danger",
                        onConfirm: () => dispatch({ type: "remove", id: member.id }),
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
                  <span className="sr-only">Sample PIN: </span>
                  <span className="text-lg leading-7 font-bold tracking-[2px] text-[#20CED0]">
                    {member.pin}
                  </span>
                </p>
                <button
                  type="button"
                  className="vendor-staff-reset"
                  aria-label={`Reset sample PIN for ${member.email}`}
                  onClick={() =>
                    confirm({
                      title: "Reset sample PIN?",
                      description: `Generate a new demonstration PIN for ${member.email}. No real credential will change.`,
                      confirmText: "Reset sample PIN",
                      onConfirm: () => dispatch({ type: "reset-pin", id: member.id }),
                    })
                  }
                >
                  <RotateCw size={14} aria-hidden="true" />
                  Reset PIN
                </button>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState
          title="No staff members"
          description="Use Add Staff to create a local sample member. No invitations are sent."
        />
      )}
      <p className="mt-4 text-xs leading-5 text-[#B8C1D1]">
        Sample staff and demonstration PINs only. Real access is unchanged.
      </p>
      {confirmationProps && <ConfirmationDialog {...confirmationProps} />}
    </section>
  );
}
