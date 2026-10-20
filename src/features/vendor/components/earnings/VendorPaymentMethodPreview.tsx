import { useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { FormField } from "@/components/forms/FormField";
import { VendorHomeDialog } from "@/features/vendor/components/home/VendorHomeDialog";
import {
  paymentMethodPreviewSchema,
  type PaymentMethodPreviewValues,
} from "@/features/vendor/utils/earningsState";
export function VendorPaymentMethodPreview({
  onClose,
  onAdd,
}: {
  onClose: () => void;
  onAdd: (id: string, values: PaymentMethodPreviewValues) => void;
}) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<PaymentMethodPreviewValues>({
    resolver: zodResolver(paymentMethodPreviewSchema),
    defaultValues: { label: "Bank Account", lastFour: "" },
  });
  const pending = useRef(false);
  return (
    <VendorHomeDialog title="Add sample payment method" onClose={onClose}>
      <p className="mb-5 text-sm leading-6 text-[#B8C1D1]">
        Use sample details only: a display label and four digits. No bank account is
        linked, verified or used for payments.
      </p>
      <form
        noValidate
        className="space-y-5"
        onSubmit={(event) => {
          event.preventDefault();
          if (pending.current) return;
          pending.current = true;
          void handleSubmit((values) => onAdd(crypto.randomUUID(), values))(
            event,
          ).finally(() => {
            pending.current = false;
          });
        }}
      >
        <FormField
          label="Display label"
          defaultValue="Bank Account"
          {...register("label")}
          error={errors.label?.message}
        />
        <FormField
          label="Sample last four digits"
          inputMode="numeric"
          autoComplete="off"
          placeholder="e.g., 1234"
          {...register("lastFour")}
          error={errors.lastFour?.message}
        />
        <div className="flex justify-end gap-3">
          <button className="vendor-earnings-secondary" type="button" onClick={onClose}>
            Cancel
          </button>
          <button
            className="vendor-earnings-primary"
            type="submit"
            disabled={isSubmitting}
          >
            Add local preview
          </button>
        </div>
      </form>
    </VendorHomeDialog>
  );
}
