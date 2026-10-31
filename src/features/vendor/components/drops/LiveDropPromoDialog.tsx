import { useEffect, useId, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { useStore } from "react-redux";
import { toast } from "sonner";
import type { RootState, AppDispatch } from "@/app/store";
import { Modal } from "@/components/overlays/Modal/Modal";
import { ConfirmationDialog } from "@/components/overlays/ConfirmationDialog/ConfirmationDialog";
import { useConfirmation } from "@/components/overlays/ConfirmationDialog/useConfirmation";
import { FormField } from "@/components/forms/FormField";
import { FormError } from "@/components/forms/FormError";
import { scopeMatches } from "@/services/api/sessionGuard";
import { vendorDropsApi, type TruckScope } from "../../api/vendorDrops.api";
import {
  promotionInputSchema,
  promotionTypeSchema,
  type ManagedPromotion,
} from "../../schemas/dropsIntegration.schema";
export type LivePromoProps = {
  scope: TruckScope;
  promotion: ManagedPromotion | null;
  onClose: () => void;
  onSaved: () => void;
};
type Draft = {
  title: string;
  description: string;
  type: "PERCENTAGE" | "FIXED_AMOUNT" | "FREE_ITEM" | "CUSTOM";
  value: string;
  couponCode: string;
  minimumSpend: string;
  maximumDiscount: string;
  usageLimit: string;
  startsAt: string;
  endsAt: string;
  isActive: boolean;
  isFollowerOnly: boolean;
};
export function LiveDropPromoDialog({
  scope,
  promotion: p,
  onClose,
  onSaved,
}: LivePromoProps) {
  const id = useId();
  const store = useStore<RootState>();
  const dispatch = store.dispatch as AppDispatch;
  const confirmation = useConfirmation();
  const mounted = useRef(true);
  const [error, setError] = useState("");
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);
  const form = useForm<Draft>({
    defaultValues: {
      title: p?.title ?? "",
      description: p?.description ?? "",
      type: p?.type ?? "PERCENTAGE",
      value: p?.value ?? "",
      couponCode: p?.couponCode ?? "",
      minimumSpend: p?.minimumSpend ?? "",
      maximumDiscount: p?.maximumDiscount ?? "",
      usageLimit: p?.usageLimit?.toString() ?? "",
      startsAt: p?.startsAt ?? "",
      endsAt: p?.endsAt ?? "",
      isActive: p?.isActive ?? true,
      isFollowerOnly: p?.isFollowerOnly ?? false,
    },
  });
  const busy = !!confirmation.confirmationProps?.isProcessing;
  function review(d: Draft) {
    const number = (s: string) => (s.trim() ? Number(s) : undefined);
    const input = {
      ...d,
      description: d.description.trim() ? d.description : undefined,
      couponCode: d.couponCode.trim() ? d.couponCode : undefined,
      value: number(d.value),
      minimumSpend: number(d.minimumSpend),
      maximumDiscount: number(d.maximumDiscount),
      usageLimit: number(d.usageLimit),
      startsAt: d.startsAt.trim(),
      endsAt: d.endsAt.trim(),
    };
    const parsed = promotionInputSchema.safeParse(input);
    if (
      !d.title.trim() ||
      !parsed.success ||
      [input.value, input.minimumSpend, input.maximumDiscount, input.usageLimit].some(
        (v) => v !== undefined && Math.abs(v) > Number.MAX_SAFE_INTEGER,
      )
    ) {
      setError(
        parsed.success
          ? "Enter a title and safely representable amounts."
          : parsed.error.issues.map((i) => i.message).join(" "),
      );
      return;
    }
    setError("");
    confirmation.confirm({
      title: p ? "Update this promotion?" : "Create this promotion?",
      description: `${d.title} for truck ${scope.truckId}. Promotions are independent of Drops and will not be attached to a Drop.`,
      confirmText: p ? "Update promotion" : "Create promotion",
      onConfirm: async () => {
        const body = parsed.data;
        const patch = {
          ...body,
          ...(p && !d.description.trim() ? { description: null } : {}),
          ...(p && !d.couponCode.trim() ? { couponCode: null } : {}),
          ...(p && !d.value.trim() ? { value: null } : {}),
          ...(p && !d.minimumSpend.trim() ? { minimumSpend: null } : {}),
          ...(p && !d.maximumDiscount.trim() ? { maximumDiscount: null } : {}),
          ...(p && !d.usageLimit.trim() ? { usageLimit: null } : {}),
        };
        // Preserve exact existing Decimal strings by omitting unchanged numeric fields.
        if (p) {
          if (d.value === p.value) delete patch.value;
          if (d.minimumSpend === p.minimumSpend) delete patch.minimumSpend;
          if (d.maximumDiscount === p.maximumDiscount) delete patch.maximumDiscount;
        }
        const req = p
          ? dispatch(
              vendorDropsApi.endpoints.updateTruckPromotion.initiate({
                ...scope,
                confirmed: true,
                promotionId: p.id,
                body: patch,
              }),
            )
          : dispatch(
              vendorDropsApi.endpoints.createTruckPromotion.initiate({
                ...scope,
                confirmed: true,
                body,
              }),
            );
        try {
          const r = await req.unwrap();
          if (r && mounted.current && scopeMatches(store.getState(), scope)) {
            toast.success(p ? "Promotion updated." : "Promotion created.");
            onSaved();
          }
        } finally {
          req.reset();
        }
      },
    });
  }
  return (
    <>
      <Modal
        isOpen
        onClose={busy ? () => {} : onClose}
        titleId={id}
        showCloseButton={false}
        panelClassName="vendor-drop-dialog vendor-drop-promo-dialog"
        backdropClassName="bg-[#080D1A]/85"
      >
        <header className="drop-dialog-heading">
          <button type="button" disabled={busy} onClick={onClose}>
            Cancel
          </button>
          <h2 id={id}>{p ? "Edit Promotion" : "New Promotion"}</h2>
          <span />
        </header>
        <form
          className="drop-dialog-body space-y-4 max-h-[75dvh] overflow-y-auto"
          noValidate
          onSubmit={(e) => {
            e.preventDefault();
            if (!busy) void form.handleSubmit(review)(e);
          }}
        >
          <fieldset disabled={busy} className="space-y-4">
            <FormField label="Title" {...form.register("title")} maxLength={255} />
            <label className="block">
              Description
              <textarea
                className="drop-promo-message w-full"
                {...form.register("description")}
              />
            </label>
            <label className="block">
              Type
              <select className="drop-promo-message w-full" {...form.register("type")}>
                {promotionTypeSchema.options.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </label>
            {(["value", "minimumSpend", "maximumDiscount", "usageLimit"] as const).map(
              (f) => (
                <FormField
                  key={f}
                  label={
                    {
                      value: "Value (optional)",
                      minimumSpend: "Minimum spend (optional)",
                      maximumDiscount: "Maximum discount (optional)",
                      usageLimit: "Usage limit (optional positive integer)",
                    }[f]
                  }
                  inputMode="decimal"
                  {...form.register(f)}
                />
              ),
            )}
            <FormField
              label="Coupon code (optional)"
              maxLength={100}
              {...form.register("couponCode")}
            />
            <FormField
              label="Starts at (ISO timestamp with timezone)"
              {...form.register("startsAt")}
            />
            <FormField
              label="Ends at (ISO timestamp with timezone)"
              {...form.register("endsAt")}
            />
            <label className="flex gap-2">
              <input type="checkbox" {...form.register("isFollowerOnly")} />
              Followers only
            </label>
            <label className="flex gap-2">
              <input type="checkbox" {...form.register("isActive")} />
              Enabled
            </label>
            <p className="text-xs">
              Monetary values use backend major units; currency is not supplied. Empty
              optional amounts clear those values when editing.
            </p>
            <FormError message={error} />
            <button className="drop-go-live" type="submit">
              Review promotion
            </button>
          </fieldset>
        </form>
      </Modal>
      {confirmation.confirmationProps && (
        <ConfirmationDialog {...confirmation.confirmationProps} />
      )}
    </>
  );
}
