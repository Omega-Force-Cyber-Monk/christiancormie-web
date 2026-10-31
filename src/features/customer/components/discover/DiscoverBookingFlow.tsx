import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Info, Plus, Utensils, X } from "lucide-react";
import { useId, useReducer, useRef, useState } from "react";
import { useForm, useWatch } from "react-hook-form";

import { FormField } from "@/components/forms/FormField";
import { FormError } from "@/components/forms/FormError";
import { Modal } from "@/components/overlays/Modal/Modal";
import { Button } from "@/components/ui/Button";
import {
  bookingMenus,
  discoverArtwork,
  eventTypes,
  paymentPreferences,
} from "@/features/customer/data/discover-booking.data";
import {
  bookingReducer,
  bookingSchema,
  bookingStepFields,
  initialBookingState,
  type BookingValues,
} from "@/features/customer/schemas/discover-booking.schema";
import "@/features/customer/components/discover/booking.css";

const titles = [
  "Send booking request",
  "Book Event",
  "Select Menus",
  "How would you like to pay?",
  "Book Event",
];

export function DiscoverBookingFlow({
  truckName,
  onBack,
  onHome,
  onComplete,
}: {
  truckName: string;
  onBack: () => void;
  onHome: () => void;
  onComplete: (booking: BookingValues) => void;
}) {
  const [state, dispatch] = useReducer(bookingReducer, initialBookingState);
  const [termsOpen, setTermsOpen] = useState(false);
  const [customOpen, setCustomOpen] = useState(false);
  const [customItem, setCustomItem] = useState("");
  const [customError, setCustomError] = useState("");
  const [customMenus, setCustomMenus] = useState<string[]>([]);
  const heading = useRef<HTMLHeadingElement>(null);
  const advancing = useRef(false);
  const completed = useRef(false);
  const titleId = useId();
  const termsId = useId();
  const form = useForm<BookingValues>({
    resolver: zodResolver(bookingSchema),
    defaultValues: state.draft,
    shouldUnregister: false,
  });
  const {
    register,
    formState: { errors },
    getValues,
    setValue,
    trigger,
  } = form;
  const [selectedMenus, eventType, payment] = useWatch({
    control: form.control,
    name: ["menus", "eventType", "payment"],
  });
  const step = state.step;
  const values = getValues();

  async function next() {
    if (advancing.current || completed.current) return;
    advancing.current = true;
    try {
      if (
        !(await trigger(step === 5 ? undefined : bookingStepFields[step], {
          shouldFocus: true,
        }))
      )
        return;
      const draft = getValues();
      dispatch({ type: "next", draft });
      if (step === 5) {
        completed.current = true;
        onComplete(draft);
      } else heading.current?.focus();
    } finally {
      advancing.current = false;
    }
  }

  function back() {
    if (step === 1) onBack();
    else {
      dispatch({ type: "back", draft: getValues() });
      heading.current?.focus();
    }
  }

  function toggleMenu(name: string) {
    setValue(
      "menus",
      selectedMenus.includes(name)
        ? selectedMenus.filter((item) => item !== name)
        : [...selectedMenus, name],
      { shouldValidate: true },
    );
  }

  function addCustomItem() {
    const name = customItem.trim();
    if (!name || name.length > 80) {
      setCustomError("Enter an item name between 1 and 80 characters.");
      return;
    }
    const all = [...bookingMenus.map((item) => item.name), ...customMenus];
    if (all.some((item) => item.toLowerCase() === name.toLowerCase())) {
      setCustomError("This item already exists. Select it from the list.");
      return;
    }
    setCustomMenus((items) => [...items, name]);
    setValue("menus", [...selectedMenus, name], { shouldValidate: true });
    setCustomItem("");
    setCustomError("");
    setCustomOpen(false);
  }

  return (
    <section
      className={`discover-booking booking-step-${step}`}
      aria-label={`Booking preview for ${truckName}`}
    >
      <header className="mb-6 flex items-center gap-3">
        <button
          type="button"
          aria-label={step === 1 ? "Back to truck profile" : "Previous booking step"}
          className="grid size-11 shrink-0 place-items-center rounded-lg hover:bg-white/5 focus-visible:outline"
          onClick={back}
        >
          <ArrowLeft size={22} />
        </button>
        <div>
          <h1
            className="text-2xl leading-8 font-semibold focus:outline-none"
            ref={heading}
            tabIndex={-1}
          >
            {titles[step - 1]}
          </h1>
          <p className="text-sm text-[#B8C1D1]" aria-live="polite">
            Step {step} of 5
          </p>
        </div>
      </header>
      <div
        aria-label={`Step ${step} of 5`}
        role="progressbar"
        aria-valuemin={1}
        aria-valuemax={5}
        aria-valuenow={step}
        className="mb-8 grid grid-cols-5 gap-2"
      >
        {[1, 2, 3, 4, 5].map((number) => (
          <span
            key={number}
            className={`h-1 rounded-full ${number <= step ? "bg-[#FF5733]" : "bg-[#242D42]"}`}
          />
        ))}
      </div>
      <form
        noValidate
        onSubmit={(event) => {
          event.preventDefault();
          void next();
        }}
      >
        {step === 1 && (
          <>
            <fieldset className="booking-panel booking-event-grid">
              <legend className="sr-only">Choose your event type</legend>
              {eventTypes.map((item) => (
                <label key={item.name} className="cursor-pointer">
                  <input
                    {...register("eventType")}
                    type="radio"
                    value={item.name}
                    className="peer sr-only"
                    aria-invalid={Boolean(errors.eventType)}
                    aria-describedby={
                      errors.eventType ? "booking-event-error" : undefined
                    }
                  />
                  <span className="booking-event-option">
                    <img
                      src={discoverArtwork(`6-event-${item.image}.png`)}
                      alt=""
                      className="size-10 object-contain"
                    />
                    <span>{item.name}</span>
                  </span>
                </label>
              ))}
              <FormError id="booking-event-error" message={errors.eventType?.message} />
            </fieldset>
            <Button className="booking-continue mt-6" type="submit" variant="primary">
              Continue
            </Button>
          </>
        )}
        {step === 2 && (
          <div className="booking-panel">
            <h2 className="text-2xl font-semibold">Event details</h2>
            <p className="mt-1 mb-9 text-base text-[#B8C1D1]">
              Tell us about your event
            </p>
            <div className="grid gap-x-8 gap-y-8 sm:grid-cols-2">
              <FormField
                {...register("date")}
                type="date"
                label="Event Date"
                error={errors.date?.message}
              />
              <FormField
                {...register("time")}
                type="time"
                label="Event Time"
                error={errors.time?.message}
              />
              <FormField
                {...register("location")}
                label="Location"
                placeholder="Enter event location"
                error={errors.location?.message}
                autoComplete="street-address"
              />
              <FormField
                {...register("contact")}
                type="tel"
                label="Contact number"
                placeholder="Enter Contact number"
                error={errors.contact?.message}
                autoComplete="tel"
              />
              <FormField
                {...register("guests")}
                inputMode="numeric"
                label="Number of Guests"
                placeholder="Expected guest count"
                error={errors.guests?.message}
              />
              <FormField
                {...register("budget")}
                label="Budget (Optional)"
                placeholder="e.g., $500–800"
                error={errors.budget?.message}
              />
            </div>
            <label
              className="mt-8 block text-sm font-medium"
              htmlFor="booking-description"
            >
              Event Description
            </label>
            <textarea
              {...register("description")}
              id="booking-description"
              className="booking-input mt-2 min-h-[122px]"
              placeholder="Describe your event and what you're looking for..."
              aria-invalid={Boolean(errors.description)}
              aria-describedby={
                errors.description ? "booking-description-error" : undefined
              }
            />
            <FormError
              id="booking-description-error"
              message={errors.description?.message}
            />
            <Button className="booking-continue mt-10" type="submit" variant="primary">
              Continue
            </Button>
          </div>
        )}
        {step === 3 && (
          <>
            <fieldset className="booking-panel p-3">
              <legend className="sr-only">Preferred Menu Items</legend>
              <p className="mb-4 flex items-center gap-2 text-sm font-medium">
                <Utensils size={16} aria-hidden="true" />
                Preferred Menu Items
              </p>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {bookingMenus.map((item) => (
                  <label key={item.name} className="cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedMenus.includes(item.name)}
                      onChange={() => toggleMenu(item.name)}
                      className="peer sr-only"
                    />
                    <span className="booking-menu-option">
                      <img
                        src={discoverArtwork(`8-menu-${item.image}.png`)}
                        alt=""
                        className="size-6 object-contain"
                      />
                      {item.name}
                    </span>
                  </label>
                ))}
                {customMenus.map((name) => (
                  <div key={name} className="flex min-w-0 items-center gap-1">
                    <button
                      type="button"
                      className={`booking-menu-option flex-1 break-words ${selectedMenus.includes(name) ? "booking-selected" : ""}`}
                      aria-pressed={selectedMenus.includes(name)}
                      onClick={() => toggleMenu(name)}
                    >
                      {name}
                    </button>
                    <button
                      type="button"
                      aria-label={`Remove custom item ${name}`}
                      className="grid size-10 shrink-0 place-items-center rounded-lg focus-visible:outline"
                      onClick={() => {
                        setCustomMenus((items) =>
                          items.filter((item) => item !== name),
                        );
                        setValue(
                          "menus",
                          selectedMenus.filter((item) => item !== name),
                          { shouldValidate: true },
                        );
                      }}
                    >
                      <X size={16} />
                    </button>
                  </div>
                ))}
              </div>
              {customOpen ? (
                <div className="mt-3 space-y-2">
                  <label htmlFor="booking-custom-item" className="text-sm">
                    Custom menu item
                  </label>
                  <input
                    id="booking-custom-item"
                    className="booking-input"
                    maxLength={80}
                    value={customItem}
                    onChange={(event) => setCustomItem(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        event.preventDefault();
                        addCustomItem();
                      }
                    }}
                    aria-invalid={Boolean(customError)}
                    aria-describedby={customError ? "booking-custom-error" : undefined}
                  />
                  <FormError id="booking-custom-error" message={customError} />
                  <div className="flex gap-2">
                    <Button onClick={addCustomItem}>Add item</Button>
                    <Button
                      variant="ghost"
                      onClick={() => {
                        setCustomOpen(false);
                        setCustomError("");
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <Button
                  className="mt-2 rounded-[20px] border-dotted"
                  onClick={() => setCustomOpen(true)}
                >
                  <Plus size={18} />
                  Add item
                </Button>
              )}
              <FormError message={errors.menus?.message} />
            </fieldset>
            <Button className="booking-continue mt-8" type="submit" variant="primary">
              Continue
            </Button>
          </>
        )}
        {step === 4 && (
          <div className="booking-panel">
            <fieldset className="space-y-4">
              <legend className="sr-only">
                Payment preference only — no payment will be collected
              </legend>
              {paymentPreferences.map((item) => (
                <label
                  key={item.value}
                  className={`booking-payment ${payment === item.value ? "booking-selected" : ""}`}
                >
                  <input
                    {...register("payment")}
                    type="radio"
                    value={item.value}
                    className="size-5 shrink-0 accent-[#FF5733]"
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block text-base">{item.label}</span>
                    <span className="mt-0.5 block text-xs text-[#B8C1D1]">
                      {item.description}
                    </span>
                  </span>
                  {item.badge && (
                    <span
                      className={`rounded-full border px-2 py-1.5 text-[11px] ${item.value === "deposit" ? "border-[#FF5733]/40 bg-[#FF5733]/10 text-[#FF5733]" : "border-[#2ED3D1]/40 bg-[#2ED3D1]/10 text-[#2ED3D1]"}`}
                    >
                      {item.badge}
                    </span>
                  )}
                </label>
              ))}
            </fieldset>
            <p className="mt-4 flex items-center gap-2 rounded-2xl border border-[#2ED3D1]/30 bg-[#2ED3D1]/5 p-3 text-sm text-[#B8C1D1]">
              <Info className="shrink-0 text-[#2ED3D1]" size={16} />
              No charge until you accept the vendor quote. This preview collects no
              payment.
            </p>
            <div className="mt-4">
              <FormField
                {...register("budget")}
                label="Your budget (Optional)"
                placeholder="$ Your budget"
                error={errors.budget?.message}
              />
            </div>
            <Button className="booking-continue mt-4" type="submit" variant="primary">
              Continue
            </Button>
          </div>
        )}
        {step === 5 && (
          <div className="booking-panel">
            <h2 className="text-2xl font-semibold">Final details</h2>
            <p className="mt-2 text-base text-[#B8C1D1]">
              Anything else we should know?
            </p>
            <label
              htmlFor="booking-additional"
              className="mt-7 block text-base font-medium"
            >
              Additional Information (Optional)
            </label>
            <textarea
              {...register("additional")}
              id="booking-additional"
              className="booking-input mt-2 min-h-[130px]"
              placeholder="Dietary restrictions, special requests, etc."
              aria-invalid={Boolean(errors.additional)}
              aria-describedby={
                errors.additional ? "booking-additional-error" : undefined
              }
            />
            <FormError
              id="booking-additional-error"
              message={errors.additional?.message}
            />
            <section className="booking-summary mt-5" aria-label="Booking Summary">
              <h3 className="mb-3 text-lg font-medium">Booking Summary</h3>
              <dl className="space-y-2 text-sm text-[#E7E8E9]">
                {[
                  ["Truck", truckName],
                  ["Event Type", eventType],
                  ["Date", values.date],
                  ["Time", values.time],
                  ["Location", values.location],
                  ["Contact number", values.contact],
                  ["Guests", values.guests],
                  ["Budget", values.budget || "Not specified"],
                  [
                    "Payment preference",
                    paymentPreferences.find((item) => item.value === payment)?.label,
                  ],
                  ["Event description", values.description],
                ].map(([label, value]) => (
                  <div className="flex justify-between gap-5" key={label}>
                    <dt className="shrink-0 text-[#B8C1D1]">{label}</dt>
                    <dd className="min-w-0 text-right break-words">{value}</dd>
                  </div>
                ))}
              </dl>
            </section>
            <section className="booking-summary mt-4" aria-label="Selected Menu">
              <h3 className="mb-3 flex items-center gap-2 text-lg font-medium">
                <Utensils size={20} className="text-[#FF5733]" />
                Selected Menu
              </h3>
              <ul className="space-y-2 text-sm">
                {selectedMenus.map((menu) => (
                  <li key={menu}>1× {menu}</li>
                ))}
              </ul>
            </section>
            <p className="mt-6 mb-3 text-xs font-semibold tracking-wider text-[#B8C1D1]">
              REQUIRED BEFORE SUBMITTING
            </p>
            <label className="flex items-start gap-3 text-sm">
              <input
                {...register("adult")}
                className="mt-0.5 size-5 shrink-0 accent-[#FF5733]"
                type="checkbox"
                aria-invalid={Boolean(errors.adult)}
                aria-describedby={errors.adult ? "booking-adult-error" : undefined}
              />
              <span>
                I confirm that I am <strong>18 years of age or older.</strong>
              </span>
            </label>
            <FormError id="booking-adult-error" message={errors.adult?.message} />
            <div className="mt-3 flex items-start gap-3 text-sm">
              <input
                {...register("terms")}
                id="booking-terms"
                className="mt-0.5 size-5 shrink-0 accent-[#FF5733]"
                type="checkbox"
                aria-invalid={Boolean(errors.terms)}
                aria-describedby={errors.terms ? "booking-terms-error" : undefined}
              />
              <div>
                <label htmlFor="booking-terms">
                  I acknowledge this is a local booking preview.
                </label>{" "}
                <button
                  type="button"
                  onClick={() => setTermsOpen(true)}
                  className="underline focus-visible:outline"
                >
                  Bite Drop Terms and Conditions
                </button>
              </div>
            </div>
            <FormError id="booking-terms-error" message={errors.terms?.message} />
            <p className="mt-3 text-xs text-[#B8C1D1]">
              No binding request, payment, or message will be sent.
            </p>
            <Button className="booking-continue mt-8" type="submit" variant="primary">
              Send request (preview)
            </Button>
          </div>
        )}
      </form>
      <p className="mt-4 text-xs text-[#B8C1D1]">
        Local preview for {truckName}. Details are retained while moving between steps.
      </p>
      <Modal isOpen={termsOpen} onClose={() => setTermsOpen(false)} titleId={termsId}>
        <div className="p-6 pt-12">
          <h2 id={termsId} className="text-xl font-semibold">
            Terms and Conditions preview
          </h2>
          <p className="mt-3 text-sm leading-6 text-[#B8C1D1]">
            The design does not supply legal terms. This local preview creates no
            binding request or payment. Published terms and vendor booking conditions
            are required before live submission.
          </p>
        </div>
      </Modal>
      <Modal
        isOpen={state.complete}
        onClose={onHome}
        titleId={titleId}
        backdropClassName="bg-black/80"
        panelClassName="relative w-full max-w-[548px] text-center text-white focus:outline-none"
        showCloseButton={false}
      >
        <img
          src={discoverArtwork("11-booking-success.svg")}
          alt=""
          className="mx-auto mb-5 h-[114px] w-[120px]"
        />
        <h2 id={titleId} className="text-3xl font-bold">
          Booking request preview complete
        </h2>
        <p className="mx-auto mt-4 max-w-[330px] text-base leading-6 text-[#B8C1D1]">
          Preview complete. Your request is saved only in this page session. No vendor
          has been contacted and no quote is scheduled.
        </p>
        <Button
          className="mt-5 min-h-12 w-full rounded-xl bg-[#FF5733] text-base font-semibold text-[#121826]"
          variant="primary"
          onClick={onHome}
        >
          Back to home
        </Button>
      </Modal>
    </section>
  );
}
