import { useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAppDispatch } from "@/app/hooks";
import { FormField } from "@/components/forms/FormField";
import { ConfirmationDialog } from "@/components/overlays/ConfirmationDialog/ConfirmationDialog";
import { resetVendorStaffPin } from "../../api/vendorStaff.api";
import {
  vendorStaffPinSchema,
  type VendorStaffPinValues,
} from "../../schemas/settings.schema";
import type { VendorStaff } from "../../schemas/vendorStaff.schema";
import type { SessionScope } from "@/services/api/sessionGuard";
import { normalizeApiError } from "@/utils/errors/normalizeApiError";
import { applyServerFieldErrors } from "@/utils/errors/applyServerFieldErrors";

export function VendorStaffPinDialog({
  member,
  scope,
  busy = false,
  onCancel,
  onReset,
}: {
  member: VendorStaff;
  scope: SessionScope;
  busy?: boolean;
  onCancel: () => void;
  onReset: (run: () => Promise<unknown>) => Promise<void>;
}) {
  const dispatch = useAppDispatch();
  const pending = useRef(false);
  const {
    register,
    trigger,
    getValues,
    reset,
    setError,
    formState: { errors },
  } = useForm<VendorStaffPinValues>({
    resolver: zodResolver(vendorStaffPinSchema),
    defaultValues: { pin: "" },
  });
  return (
    <ConfirmationDialog
      isOpen
      isProcessing={busy}
      title="Reset staff PIN?"
      description={`Set a new PIN for ${member.email}. This also sets staff status to ACTIVE.`}
      confirmText="Reset PIN"
      onCancel={() => {
        reset();
        onCancel();
      }}
      onConfirm={async () => {
        if (pending.current) return;
        if (!(await trigger())) throw new Error("Enter exactly four numeric digits.");
        pending.current = true;
        const body = getValues();
        reset();
        try {
          await onReset(() => resetVendorStaffPin(dispatch, scope, member.id, body));
        } catch (cause) {
          applyServerFieldErrors(normalizeApiError(cause), setError, ["pin"]);
          throw cause;
        } finally {
          pending.current = false;
        }
      }}
    >
      <div className="mt-3">
        <FormField
          label="New staff PIN"
          type="password"
          inputMode="numeric"
          autoComplete="new-password"
          maxLength={4}
          disabled={busy}
          error={errors.pin?.message}
          {...register("pin")}
        />
      </div>
    </ConfirmationDialog>
  );
}
