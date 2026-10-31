import { useEffect, useId, useRef, useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { useStore } from "react-redux";
import { toast } from "sonner";
import type { RootState, AppDispatch } from "@/app/store";
import { scopeMatches } from "@/services/api/sessionGuard";
import { useConfirmation } from "@/components/overlays/ConfirmationDialog/useConfirmation";
import { ConfirmationDialog } from "@/components/overlays/ConfirmationDialog/ConfirmationDialog";
import { FormError } from "@/components/forms/FormError";
import { BookingQuoteReview } from "@/features/bookings/components/BookingQuoteReview";
import {
  quoteInputSchema,
  validQuoteForGuests,
  type QuoteInput,
} from "@/features/bookings/schemas/bookingQuote.schema";
import {
  financialAmount,
  formatFinancialAmount,
} from "@/features/payments/utils/financialValues";
import { vendorQuotesApi } from "../../api/vendorQuotes.api";
import {
  vendorBookingsApi,
  type VendorBookingSelection,
} from "../../api/vendorBookings.api";
import type { VendorBooking } from "../../schemas/vendorBookings.schema";
export type LiveRequestQuoteProps = {
  booking: VendorBooking;
  scope: VendorBookingSelection;
  disabled: boolean;
};
type Draft = {
  pricingModel: "FLAT_FEE" | "PER_PERSON";
  paymentPreference: "DEPOSIT_ONLY" | "PREPAID_IN_FULL";
  price: string;
  menus: string;
  transportFee: string;
  serviceFee: string;
  taxAmount: string;
  discountAmount: string;
  depositAmount: string;
  depositPercent: string;
  terms: string;
  noteToClient: string;
  expiresAt: string;
  extraCharges: { label: string; amount: string }[];
};
export function LiveRequestQuoteForm({
  booking,
  scope,
  disabled,
}: LiveRequestQuoteProps) {
  const id = useId();
  const form = useForm<Draft>({
    defaultValues: {
      pricingModel: "FLAT_FEE",
      paymentPreference: "DEPOSIT_ONLY",
      price: "",
      menus: "",
      transportFee: "",
      serviceFee: "",
      taxAmount: "",
      discountAmount: "",
      depositAmount: "",
      depositPercent: "",
      terms: "",
      noteToClient: "",
      expiresAt: "",
      extraCharges: [],
    },
  });
  const charges = useFieldArray({ control: form.control, name: "extraCharges" });
  const confirmation = useConfirmation();
  const store = useStore<RootState>();
  const dispatch = store.dispatch as AppDispatch;
  const mounted = useRef(true);
  const [error, setError] = useState("");
  const [result, setResult] = useState<{
    quote: VendorBooking["quotes"];
    commission: number;
    net: number;
  } | null>(null);
  const [reconcile, setReconcile] = useState(false);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);
  const eligible = ["PENDING", "ACCEPTED"].includes(booking.status) && !!booking.endsAt;
  function submit(d: Draft) {
    if (d.extraCharges.some((e) => !e.amount.trim() || !e.label.trim())) {
      setError("Enter a label and actual amount for every extra charge.");
      return;
    }
    const optional = (s: string) => (s.trim() ? Number(s) : undefined);
    const raw = {
      pricingModel: d.pricingModel,
      paymentPreference: d.paymentPreference,
      ...(d.pricingModel === "FLAT_FEE"
        ? { baseServiceFee: Number(d.price) }
        : { pricePerPerson: Number(d.price) }),
      selectedMenuItems: d.menus
        .split("\n")
        .map((m) => m.trim())
        .filter(Boolean),
      extraCharges: d.extraCharges.map((e) => ({
        label: e.label,
        amount: Number(e.amount),
      })),
      transportFee: optional(d.transportFee),
      serviceFee: optional(d.serviceFee),
      taxAmount: optional(d.taxAmount),
      discountAmount: optional(d.discountAmount),
      ...(d.paymentPreference === "DEPOSIT_ONLY"
        ? {
            depositAmount: optional(d.depositAmount),
            depositPercent: optional(d.depositPercent),
          }
        : {}),
      terms: d.terms,
      noteToClient: d.noteToClient,
      ...(d.expiresAt.trim() ? { expiresAt: d.expiresAt.trim() } : {}),
    };
    const parsed = quoteInputSchema.safeParse(raw);
    if (
      !d.price.trim() ||
      !parsed.success ||
      !validQuoteForGuests(parsed.data, booking.guestCount)
    ) {
      setError(
        parsed.success
          ? "Enter a price, positive total and valid deposit not exceeding the total."
          : parsed.error.issues.map((i) => i.message).join(" "),
      );
      return;
    }
    const body: QuoteInput = parsed.data;
    setError("");
    confirmation.confirm({
      title: "Send this booking quote?",
      description: `Send a real quote for ${booking.bookingNumber} (${booking.id})? Currency is not supplied. The backend determines the final breakdown. No payment will be collected.`,
      confirmText: "Send quote",
      onConfirm: async () => {
        const req = dispatch(
          vendorQuotesApi.endpoints.createVendorBookingQuote.initiate({
            ...scope,
            confirmed: true,
            body,
          }),
        );
        try {
          const r = await req.unwrap();
          if (r && mounted.current && scopeMatches(store.getState(), scope)) {
            setResult({
              quote: [r.quote],
              commission: r.breakdown.commissionAmount,
              net: r.breakdown.vendorNetAmount,
            });
            setReconcile(false);
            toast.success("Booking quote sent. No payment collected.");
          }
        } catch (failure) {
          if (mounted.current && scopeMatches(store.getState(), scope))
            setReconcile(true);
          throw failure;
        } finally {
          req.reset();
        }
      },
    });
  }
  const pending = !!confirmation.confirmationProps?.isProcessing;
  async function recheckBooking() {
    const req = dispatch(
      vendorBookingsApi.endpoints.getVendorBooking.initiate(scope, {
        forceRefetch: true,
        subscribe: false,
      }),
    );
    try {
      const r = await req.unwrap();
      if (r && mounted.current && scopeMatches(store.getState(), scope))
        setReconcile(false);
    } catch {
      /* Retain draft and reconciliation requirement. */
    }
  }
  return (
    <section className="mt-6" aria-label="Live booking quote">
      <BookingQuoteReview
        bookingId={booking.id}
        quotes={result?.quote ?? booking.quotes}
      />
      {result && (
        <p className="mt-3">
          Backend commission:{" "}
          {formatFinancialAmount(financialAmount(result.commission, null, "major"))} ·
          Backend vendor net:{" "}
          {formatFinancialAmount(financialAmount(result.net, null, "major"))}
        </p>
      )}
      {reconcile && (
        <div role="alert">
          <p>
            Quote delivery is uncertain. Review the refreshed server quotes before
            retrying; no automatic resubmission occurs.
          </p>
          <button
            type="button"
            className="request-secondary"
            disabled={disabled || pending}
            onClick={() => void recheckBooking()}
          >
            Recheck booking
          </button>
        </div>
      )}
      <form
        className="mt-5 space-y-4"
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          if (!disabled && !pending && eligible && !reconcile)
            void form.handleSubmit(submit)(e);
        }}
      >
        <h3 className="text-lg font-semibold">Create booking quote</h3>
        <p className="text-xs">
          All amounts are major units; currency unavailable. No minimum deposit or
          commission is assumed.
        </p>
        <fieldset
          disabled={disabled || pending || !eligible || reconcile}
          className="space-y-3"
        >
          <label className="block">
            Pricing model
            <select className="request-input" {...form.register("pricingModel")}>
              <option value="FLAT_FEE">Flat fee</option>
              <option value="PER_PERSON">Per person</option>
            </select>
          </label>
          <label className="block" htmlFor={`${id}-price`}>
            Base fee / price per person
          </label>
          <input
            id={`${id}-price`}
            className="request-input"
            inputMode="decimal"
            {...form.register("price")}
          />
          <label className="block">
            Menu items (one per line)
            <textarea className="request-input" {...form.register("menus")} />
          </label>
          {(
            [
              "transportFee",
              "serviceFee",
              "taxAmount",
              "discountAmount",
              "depositAmount",
              "depositPercent",
            ] as const
          ).map((field) => (
            <label className="block" key={field}>
              {
                {
                  transportFee: "Transport fee",
                  serviceFee: "Service fee",
                  taxAmount: "Tax amount",
                  discountAmount: "Discount amount",
                  depositAmount: "Deposit amount",
                  depositPercent: "Deposit percentage",
                }[field]
              }{" "}
              (optional)
              <input
                className="request-input"
                inputMode="decimal"
                {...form.register(field)}
              />
            </label>
          ))}
          <label className="block">
            Payment preference
            <select className="request-input" {...form.register("paymentPreference")}>
              <option value="DEPOSIT_ONLY">Deposit only</option>
              <option value="PREPAID_IN_FULL">Prepaid in full</option>
            </select>
          </label>
          <p className="text-xs">
            Deposit overrides apply only to deposit-only quotes. Full prepayment is
            calculated by the backend.
          </p>
          {charges.fields.map((f, i) => (
            <div key={f.id} className="flex flex-wrap gap-2">
              <label>
                Charge label
                <input
                  className="request-input"
                  {...form.register(`extraCharges.${i}.label`)}
                />
              </label>
              <label>
                Charge amount
                <input
                  className="request-input"
                  inputMode="decimal"
                  {...form.register(`extraCharges.${i}.amount`)}
                />
              </label>
              <button
                type="button"
                className="request-secondary"
                onClick={() => charges.remove(i)}
              >
                Remove charge
              </button>
            </div>
          ))}
          <button
            type="button"
            className="request-secondary"
            disabled={charges.fields.length >= 20}
            onClick={() => charges.append({ label: "", amount: "" })}
          >
            Add charge
          </button>
          <label className="block">
            Expiry (optional ISO timestamp with timezone)
            <input
              className="request-input"
              placeholder="YYYY-MM-DDTHH:mm:ssZ or explicit offset"
              {...form.register("expiresAt")}
            />
          </label>
          <label className="block">
            Terms
            <textarea className="request-input" {...form.register("terms")} />
          </label>
          <label className="block">
            Note to customer
            <textarea className="request-input" {...form.register("noteToClient")} />
          </label>
          <FormError message={error} />
          <button type="submit" className="request-primary">
            Review and send quote
          </button>
        </fieldset>
        {!eligible && (
          <p>Quotes require a PENDING or ACCEPTED booking with an end time.</p>
        )}
      </form>
      {confirmation.confirmationProps && (
        <ConfirmationDialog {...confirmation.confirmationProps} />
      )}
    </section>
  );
}
