import { ArrowLeft, Plus, Trash2, X } from "lucide-react";
import { useId, useRef, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { FormField } from "@/components/forms/FormField";
import { FormError } from "@/components/forms/FormError";
import {
  LiveRequestQuoteForm,
  type LiveRequestQuoteProps,
} from "./LiveRequestQuoteForm";
import {
  defaultQuote,
  dollars,
  quoteSchema,
  quoteTotals,
  validateQuote,
  type QuoteDraft,
  type RequestEvent,
} from "@/features/vendor/utils/requestsState";

export function QuoteBreakdown({
  draft,
  guests,
}: {
  draft: QuoteDraft;
  guests: number;
}) {
  const totals = quoteTotals(draft, guests);
  const commission = Math.round(totals.total * 0.15);
  return (
    <section className="request-breakdown" aria-label="Quote breakdown">
      <h2 className="mb-5 text-lg font-semibold">Quote Breakdown</h2>
      <p className="mb-3 text-sm text-[#B8C1D1]">Menus</p>
      <div className="mb-5 flex flex-wrap gap-2">
        {draft.menus.map((menu) => (
          <span className="request-menu-chip" key={menu}>
            {menu}
          </span>
        ))}
      </div>
      <dl className="space-y-4 text-sm">
        <div>
          <dt>
            Base service fee{draft.pricing === "person" ? ` (${guests} guests)` : ""}
          </dt>
          <dd>{dollars(totals.base)}</dd>
        </div>
        {draft.charges.map((c) => (
          <div key={c.id}>
            <dt>{c.label}</dt>
            <dd>{dollars(Math.round(Number(c.amount || 0) * 100))}</dd>
          </div>
        ))}
        <div className="border-t border-white/10 pt-4 font-semibold">
          <dt>Total</dt>
          <dd>{dollars(totals.total)}</dd>
        </div>
        <div>
          <dt>
            {draft.payment === "full" ? "Prepaid in full" : "Deposit through app"}
          </dt>
          <dd>{dollars(totals.deposit)}</dd>
        </div>
        <div>
          <dt>Balance at event</dt>
          <dd>{dollars(totals.balance)}</dd>
        </div>
        <div>
          <dt>Illustrative commission (15%)</dt>
          <dd>-{dollars(commission)}</dd>
        </div>
        <div>
          <dt>Illustrative subtotal after commission</dt>
          <dd>{dollars(totals.total - commission)}</dd>
        </div>
        <div className="border-t border-white/10 pt-4 text-[#2ED3D1]">
          <dt>Illustrative app payout</dt>
          <dd>{dollars(totals.deposit - commission)}</dd>
        </div>
      </dl>
      <p className="mt-5 text-xs leading-5 text-[#B8C1D1]">
        Local estimate. The design's 15% commission is illustrative; fees, minimum
        deposit and settlement terms require confirmation. No payment is collected.
      </p>
    </section>
  );
}
export function RequestQuoteForm(
  props: LiveRequestQuoteProps | Parameters<typeof RequestQuotePreview>[0],
) {
  return "booking" in props ? (
    <LiveRequestQuoteForm {...props} />
  ) : (
    <RequestQuotePreview {...props} />
  );
}
function RequestQuotePreview({
  event,
  draft = defaultQuote(),
  onBack,
  onSave,
  onQuote,
  readOnly = false,
}: {
  event: RequestEvent;
  draft?: QuoteDraft;
  onBack: () => void;
  onSave: (draft: QuoteDraft) => void;
  onQuote: (draft: QuoteDraft) => void;
  readOnly?: boolean;
}) {
  const id = useId();
  const {
    register,
    control,
    getValues,
    setValue,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<QuoteDraft>({ resolver: zodResolver(quoteSchema), defaultValues: draft });
  const values = useWatch({ control }) as QuoteDraft;
  const [menu, setMenu] = useState("");
  const [chargeLabel, setChargeLabel] = useState("");
  const [chargeAmount, setChargeAmount] = useState("0");
  const [chargeError, setChargeError] = useState("");
  const submitted = useRef(false);
  const menus = values.menus ?? [];
  const charges = values.charges ?? [];
  const totals = quoteTotals({ ...draft, ...values, menus, charges }, event.guests);
  const addMenu = () => {
    if (!menu.trim()) {
      setError("menus", { message: "Enter a menu item." });
      return;
    }
    if (!menus.some((m) => m.toLowerCase() === menu.trim().toLowerCase()))
      setValue("menus", [...menus, menu.trim()], { shouldValidate: true });
    setMenu("");
  };
  return (
    <div className="request-quote-page">
      <div className="mb-7 flex items-start gap-3">
        <button
          type="button"
          className="request-back"
          aria-label="Back to requests, retain quote draft"
          onClick={() => {
            onSave(getValues());
            onBack();
          }}
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-2xl font-semibold">Send Quote</h1>
          <p className="mt-1 text-sm text-[#B8C1D1]">to {event.client}</p>
        </div>
      </div>
      <div className="request-event-summary mb-6">
        <img src={event.avatar} alt="" />
        <div>
          <strong>{event.kind}</strong>
          <p className="mt-2 text-sm text-[#B8C1D1]">
            {event.date} · {event.time}
            <br />
            {event.location} · {event.guests} guests
          </p>
        </div>
        <span className="text-right text-sm text-[#B8C1D1]">
          Budget
          <br />
          <strong className="text-white">{event.budget}</strong>
        </span>
      </div>
      <form
        noValidate
        onSubmit={(submitEvent) => {
          void handleSubmit((data) => {
            if (submitted.current || readOnly) return;
            const error = validateQuote(data, event.guests);
            if (error) {
              setError(
                data.payment === "deposit" &&
                  (error.includes("Deposit") || error.includes("deposit"))
                  ? "deposit"
                  : "root",
                { message: error },
              );
              return;
            }
            submitted.current = true;
            onQuote(data);
          })(submitEvent);
        }}
        className="space-y-7"
      >
        <fieldset disabled={readOnly} className="space-y-7 disabled:opacity-80">
          <fieldset>
            <legend className="request-label">Pricing Model</legend>
            <div className="grid grid-cols-2 gap-4">
              {(
                [
                  ["flat", "Flat fee"],
                  ["person", "Per person"],
                ] as const
              ).map(([v, label]) => (
                <label className="request-radio" key={v}>
                  <input type="radio" value={v} {...register("pricing")} />
                  {label}
                </label>
              ))}
            </div>
          </fieldset>
          <div>
            <label className="request-label" htmlFor={`${id}-menu`}>
              Add menus
            </label>
            <div className="flex gap-3">
              <input
                id={`${id}-menu`}
                className="request-input min-w-0 flex-1"
                placeholder="e.g: Burger"
                aria-invalid={!!errors.menus}
                aria-describedby={errors.menus ? `${id}-menu-error` : undefined}
                value={menu}
                onChange={(e) => setMenu(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addMenu();
                  }
                }}
              />
              <button type="button" className="request-secondary" onClick={addMenu}>
                Add
              </button>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {menus.map((m) => (
                <span className="request-menu-chip" key={m}>
                  {m}
                  <button
                    type="button"
                    aria-label={`Remove ${m}`}
                    onClick={() =>
                      setValue(
                        "menus",
                        menus.filter((item) => item !== m),
                        { shouldValidate: true },
                      )
                    }
                  >
                    <X size={14} />
                  </button>
                </span>
              ))}
            </div>
            <FormError id={`${id}-menu-error`} message={errors.menus?.message} />
          </div>
          <FormField
            label={
              values.pricing === "person"
                ? "Service fee per person (USD)"
                : "Base Service Fee (USD)"
            }
            inputMode="decimal"
            defaultValue={draft.base}
            {...register("base")}
            error={errors.base?.message}
          />
          <div>
            <p className="request-label">Extra Charges</p>
            <div className="grid gap-3 sm:grid-cols-[1fr_110px_auto]">
              <input
                aria-label="Extra charge description"
                className="request-input"
                placeholder="Transport, service charge, setup fee..."
                value={chargeLabel}
                onChange={(e) => setChargeLabel(e.target.value)}
              />
              <input
                aria-label="Extra charge amount in USD"
                inputMode="decimal"
                className="request-input"
                value={chargeAmount}
                onChange={(e) => setChargeAmount(e.target.value)}
              />
              <button
                type="button"
                className="request-secondary"
                onClick={() => {
                  const item = {
                    id: crypto.randomUUID(),
                    label: chargeLabel.trim(),
                    amount: chargeAmount.trim(),
                  };
                  const result = quoteSchema.shape.charges.element.safeParse(item);
                  if (!result.success) {
                    setChargeError(
                      result.error.issues[0]?.message ?? "Check the charge.",
                    );
                    return;
                  }
                  setValue("charges", [...charges, result.data]);
                  setChargeLabel("");
                  setChargeAmount("0");
                  setChargeError("");
                }}
              >
                <Plus size={16} /> Add Charge
              </button>
            </div>
            <FormError message={chargeError} />
            <ul className="mt-3 space-y-2">
              {charges.map((c) => (
                <li
                  className="flex items-center justify-between gap-3 rounded-lg bg-[#121826] p-3 text-sm"
                  key={c.id}
                >
                  <span>{c.label}</span>
                  <span className="ml-auto">
                    {dollars(Math.round(Number(c.amount) * 100))}
                  </span>
                  <button
                    type="button"
                    className="p-2 text-red-400"
                    aria-label={`Remove ${c.label}`}
                    onClick={() =>
                      setValue(
                        "charges",
                        charges.filter((item) => item.id !== c.id),
                      )
                    }
                  >
                    <Trash2 size={18} />
                  </button>
                </li>
              ))}
            </ul>
          </div>
          <fieldset>
            <legend className="request-label">Payment Terms</legend>
            <div className="grid grid-cols-2 gap-4">
              {(
                [
                  ["deposit", "Deposit only"],
                  ["full", "Prepaid in full"],
                ] as const
              ).map(([v, label]) => (
                <label className="request-radio" key={v}>
                  <input type="radio" value={v} {...register("payment")} />
                  {label}
                </label>
              ))}
            </div>
          </fieldset>
          {values.payment === "deposit" && (
            <div>
              <div className="mb-2 flex justify-between">
                <label htmlFor={`${id}-deposit`}>Deposit (USD)</label>
                <span className="text-[#B8C1D1]">
                  {totals.total ? Math.round((totals.deposit / totals.total) * 100) : 0}
                  %
                </span>
              </div>
              <input
                id={`${id}-deposit`}
                className="request-input w-full"
                inputMode="decimal"
                defaultValue={draft.deposit}
                {...register("deposit")}
                aria-invalid={!!errors.deposit}
                aria-describedby={errors.deposit ? `${id}-deposit-error` : undefined}
              />
              <FormError id={`${id}-deposit-error`} message={errors.deposit?.message} />
              <p className="mt-2 text-xs text-[#2ED3D1]">
                Preview only. Minimum deposit is not enforced until terms are confirmed.
              </p>
            </div>
          )}
          <div>
            <label htmlFor={`${id}-note`} className="request-label">
              Note to client
            </label>
            <textarea
              id={`${id}-note`}
              className="request-input min-h-28 w-full resize-y"
              placeholder="Add any details about your offer · menu inclusions, setup requirements, payment info..."
              {...register("note")}
            />
          </div>
        </fieldset>
        <QuoteBreakdown
          draft={{ ...draft, ...values, menus, charges }}
          guests={event.guests}
        />
        <FormError message={errors.root?.message} />
        <p className="text-xs text-[#B8C1D1]">
          {readOnly
            ? "This quote is saved in this local preview. It has not been delivered."
            : "Send quote saves a quote locally for review. Nothing is sent to the client."}
        </p>
        {!readOnly && (
          <button
            disabled={isSubmitting}
            className="request-primary w-full"
            type="submit"
          >
            Send quote · local preview
          </button>
        )}
      </form>
    </div>
  );
}
