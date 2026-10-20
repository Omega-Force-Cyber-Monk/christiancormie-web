import {
  ArrowLeft,
  CalendarDays,
  Clock,
  DollarSign,
  MapPin,
  Users,
  Utensils,
} from "lucide-react";
import { useEffect, useId, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { FormField } from "@/components/forms/FormField";
import { FormError } from "@/components/forms/FormError";
import {
  truckEventTypes,
  truckMenuOptions,
} from "@/features/vendor/data/create-posts.data";
import {
  emptyTruckPost,
  truckPostSchema,
  type TruckPostValues,
} from "@/features/vendor/schemas/create-posts.schema";

export function VendorTruckRequestForm({
  draft = emptyTruckPost(),
  onBack,
  onCancel,
  onDraft,
  onSubmit,
}: {
  draft?: TruckPostValues;
  onBack: (values: TruckPostValues) => void;
  onCancel: (values: TruckPostValues) => void;
  onDraft: (values: TruckPostValues) => void;
  onSubmit: (values: TruckPostValues) => void;
}) {
  const {
    register,
    getValues,
    subscribe,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<TruckPostValues>({
    resolver: zodResolver(truckPostSchema),
    defaultValues: draft,
  });
  useEffect(
    () =>
      subscribe({
        formState: { values: true },
        callback: ({ values }) => onDraft(values),
      }),
    [subscribe, onDraft],
  );
  const id = useId();
  const pending = useRef(false);
  return (
    <section className="vendor-post-form-page vendor-post-form-page--truck">
      <div className="vendor-post-heading">
        <button
          type="button"
          className="vendor-post-back"
          aria-label="Back to post categories, retain truck request draft"
          onClick={() => onBack(getValues())}
        >
          <ArrowLeft size={20} />
        </button>
        <h1>Post truck request</h1>
      </div>
      <form
        noValidate
        className="vendor-post-form"
        onSubmit={(event) => {
          void handleSubmit((values) => {
            if (pending.current) return;
            pending.current = true;
            onSubmit(values);
          })(event);
        }}
      >
        <div className="grid gap-x-4 gap-y-4 sm:grid-cols-2">
          <div className="space-y-2">
            <label className="vendor-post-label" htmlFor={`${id}-type`}>
              Event Type
            </label>
            <select
              id={`${id}-type`}
              className="vendor-post-control w-full"
              {...register("eventType")}
              defaultValue={draft.eventType}
              aria-invalid={!!errors.eventType}
              aria-describedby={errors.eventType ? `${id}-type-error` : undefined}
            >
              <option value="">Select Event Type</option>
              {truckEventTypes.map((type) => (
                <option key={type}>{type}</option>
              ))}
            </select>
            <FormError id={`${id}-type-error`} message={errors.eventType?.message} />
          </div>
          <div>
            <label
              className="vendor-post-label mb-2 flex items-center gap-1"
              htmlFor={`${id}-date`}
            >
              <CalendarDays size={16} /> Event Date
            </label>
            <input
              className="vendor-post-control w-full"
              id={`${id}-date`}
              type="date"
              {...register("date")}
              defaultValue={draft.date}
              aria-invalid={!!errors.date}
              aria-describedby={errors.date ? `${id}-date-error` : undefined}
            />
            <FormError id={`${id}-date-error`} message={errors.date?.message} />
          </div>
          <div>
            <label
              className="vendor-post-label mb-2 flex items-center gap-1"
              htmlFor={`${id}-time`}
            >
              <Clock size={16} /> Event Time
            </label>
            <input
              className="vendor-post-control w-full"
              id={`${id}-time`}
              type="time"
              {...register("time")}
              defaultValue={draft.time}
              aria-invalid={!!errors.time}
              aria-describedby={errors.time ? `${id}-time-error` : undefined}
            />
            <FormError id={`${id}-time-error`} message={errors.time?.message} />
          </div>
          <div className="relative">
            <MapPin size={16} aria-hidden="true" className="absolute top-0.5 left-0" />
            <FormField
              label="Location"
              id={`${id}-location`}
              className="vendor-post-control"
              placeholder="e.g., Golden Gate Park, SF"
              {...register("location")}
              defaultValue={draft.location}
              error={errors.location?.message}
            />
          </div>
          <div className="relative">
            <Users size={16} aria-hidden="true" className="absolute top-0.5 left-0" />
            <FormField
              label="Expected Guests"
              className="vendor-post-control"
              inputMode="numeric"
              placeholder="e.g., 50"
              {...register("guests")}
              defaultValue={draft.guests}
              error={errors.guests?.message}
            />
          </div>
          <div className="relative">
            <DollarSign
              size={16}
              aria-hidden="true"
              className="absolute top-0.5 left-0"
            />
            <FormField
              label="Budget Range"
              className="vendor-post-control"
              placeholder="e.g., $500-800"
              {...register("budget")}
              defaultValue={draft.budget}
              error={errors.budget?.message}
            />
          </div>
        </div>
        <div className="space-y-2">
          <label className="vendor-post-label" htmlFor={`${id}-description`}>
            Event Description
          </label>
          <textarea
            className="vendor-post-control vendor-post-description"
            id={`${id}-description`}
            placeholder="Describe your event and what you're looking for..."
            {...register("description")}
            defaultValue={draft.description}
            aria-invalid={!!errors.description}
            aria-describedby={
              errors.description ? `${id}-description-error` : undefined
            }
          />
          <FormError
            id={`${id}-description-error`}
            message={errors.description?.message}
          />
        </div>
        <fieldset className="vendor-post-menu">
          <legend className="mb-4 flex items-center gap-3 text-sm font-medium">
            <Utensils size={18} /> Preferred Menu Items
          </legend>
          <div className="grid gap-2 sm:grid-cols-2">
            {truckMenuOptions.map((menu) => (
              <label className="vendor-post-menu-item" key={menu.label}>
                <input
                  type="checkbox"
                  value={menu.label}
                  defaultChecked={draft.menus.includes(menu.label)}
                  {...register("menus")}
                />
                <img src={menu.image} alt="" className="size-6 object-contain" />
                {menu.label}
              </label>
            ))}
          </div>
          <FormError message={errors.menus?.message} />
        </fieldset>
        <div className="vendor-post-form-actions">
          <button
            type="button"
            className="vendor-post-secondary"
            onClick={() => onCancel(getValues())}
          >
            Cancel
          </button>
          <button type="submit" className="vendor-post-submit" disabled={isSubmitting}>
            Post request
          </button>
        </div>
        <p className="text-xs leading-5 text-[#B8C1D1]">
          Local preview: this saves a truck request here. No vendors are contacted.
        </p>
      </form>
    </section>
  );
}
