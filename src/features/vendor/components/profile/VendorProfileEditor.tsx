import { ArrowLeft, Save, Users } from "lucide-react";
import { useEffect, useId, useRef } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { FormField } from "@/components/forms/FormField";
import { FormError } from "@/components/forms/FormError";
import { VendorProfilePhotoPicker } from "@/features/vendor/components/profile/VendorProfilePhotoPicker";
import {
  profileCapacityOptions,
  profileCuisineOptions,
  type ProfilePhotoSource,
} from "@/features/vendor/data/profile.data";
import {
  truckProfileFormSchema,
  type TruckProfileForm,
} from "@/features/vendor/schemas/truckSettings.schema";
import { normalizeApiError } from "@/utils/errors/normalizeApiError";
import { toast } from "sonner";
export function VendorProfileEditor({
  draft,
  photo,
  onPhoto,
  onDraft,
  onBack,
  onSave,
  cuisineOptions = profileCuisineOptions,
  maximumGuestCapacity,
  cuisineDisabled = false,
  isCurrent = () => true,
}: {
  draft: TruckProfileForm;
  photo: ProfilePhotoSource;
  onPhoto: (file: File) => void;
  onDraft: (values: TruckProfileForm) => void;
  onBack: (values: TruckProfileForm) => void;
  onSave: (values: TruckProfileForm) => void | Promise<void>;
  cuisineOptions?: readonly { id: string; label: string; image?: string }[];
  maximumGuestCapacity?: number | null;
  cuisineDisabled?: boolean;
  isCurrent?: () => boolean;
}) {
  const id = useId();
  const pending = useRef(false);
  const {
    register,
    control,
    subscribe,
    getValues,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<TruckProfileForm>({
    resolver: zodResolver(truckProfileFormSchema),
    defaultValues: draft,
  });
  const [name, hours] = useWatch({ control, name: ["name", "hours"] });
  useEffect(
    () =>
      subscribe({
        formState: { values: true },
        callback: ({ values }) => onDraft(values),
      }),
    [subscribe, onDraft],
  );
  const openDays = hours.filter((day) => day.enabled).length;
  return (
    <form
      className="vendor-profile-editor"
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        if (pending.current) return;
        pending.current = true;
        void handleSubmit(async (values) => {
          try {
            await onSave(values);
          } catch (error) {
            if (!isCurrent()) return;
            const failure = normalizeApiError(error);
            setError("root", { message: failure.message });
            toast.error(failure.message);
          }
        })(event).finally(() => {
          pending.current = false;
        });
      }}
    >
      <div className="flex items-center gap-3">
        <button
          className="vendor-profile-back"
          type="button"
          aria-label="Back to profile, retain draft"
          disabled={isSubmitting}
          onClick={() => onBack(getValues())}
        >
          <ArrowLeft size={22} />
        </button>
        <h1 className="flex-1 text-xl font-semibold">Edit Profile</h1>
        <button
          className="vendor-profile-primary"
          type="submit"
          disabled={isSubmitting}
        >
          <Save size={18} /> Save
        </button>
      </div>
      <div className="vendor-profile-editor-photo">
        <VendorProfilePhotoPicker
          avatar
          source={photo}
          onChange={onPhoto}
          disabled={isSubmitting}
        />
      </div>
      <fieldset className="vendor-profile-basic">
        <legend>Basic Info</legend>
        <div className="grid gap-x-4 gap-y-4 sm:grid-cols-2">
          <div className="relative">
            <FormField
              label="Truck Name"
              maxLength={255}
              className="vendor-profile-input pr-14"
              {...register("name")}
              defaultValue={draft.name}
              error={errors.name?.message}
            />
            <span
              className="absolute top-[38px] right-4 text-xs text-[#8D96A4]"
              aria-live="polite"
            >
              {name.length}/255
            </span>
          </div>
          <FormField
            label="Handle"
            className="vendor-profile-input"
            {...register("handle")}
            defaultValue={draft.handle}
            error={errors.handle?.message}
          />
          <FormField
            label="Moto"
            className="vendor-profile-input"
            placeholder="e:g: mexican street food"
            {...register("motto")}
            defaultValue={draft.motto}
            error={errors.motto?.message}
          />
          <FormField
            label="Location"
            readOnly
            className="vendor-profile-input"
            placeholder="e:g: san francisco"
            {...register("location")}
            defaultValue={draft.location}
            error={errors.location?.message}
          />
        </div>
      </fieldset>
      <fieldset className="vendor-profile-hours">
        <legend className="w-full">
          <span>Operating Hours</span>
          <span className="text-sm font-normal">
            <span className="text-[#00D3DF]">{openDays} days open</span>
            <span className="text-[#596174]"> &middot; {7 - openDays} closed</span>
          </span>
        </legend>
        <div className="vendor-profile-hours-grid">
          {draft.hours.map((day, index) => {
            const enabled = hours[index]?.enabled ?? day.enabled;
            const openError = errors.hours?.[index]?.opens?.message;
            const closeError = errors.hours?.[index]?.closes?.message;
            return (
              <div className="vendor-profile-day" key={day.day}>
                <div className="vendor-profile-day-controls">
                  <span className="w-9 shrink-0 text-sm">{day.day}</span>
                  <input
                    type="hidden"
                    {...register(`hours.${index}.day`)}
                    defaultValue={day.day}
                  />
                  <label className="vendor-profile-hours-toggle">
                    <input
                      type="checkbox"
                      role="switch"
                      aria-label={`${day.day} open`}
                      {...register(`hours.${index}.enabled`)}
                      defaultChecked={day.enabled}
                    />
                    <span />
                  </label>
                  {enabled ? (
                    <>
                      <input
                        className="vendor-profile-time"
                        type="time"
                        aria-label={`${day.day} opening time`}
                        {...register(`hours.${index}.opens`)}
                        defaultValue={day.opens}
                        aria-invalid={!!openError}
                        aria-describedby={
                          openError ? `${id}-${index}-open-error` : undefined
                        }
                      />
                      <span className="text-[#596174]">-</span>
                      <input
                        className="vendor-profile-time"
                        type="time"
                        aria-label={`${day.day} closing time`}
                        {...register(`hours.${index}.closes`)}
                        defaultValue={day.closes}
                        aria-invalid={!!closeError}
                        aria-describedby={
                          closeError ? `${id}-${index}-close-error` : undefined
                        }
                      />
                    </>
                  ) : (
                    <span className="text-sm text-[#B6B7BC]">Closed</span>
                  )}
                </div>
                <FormError id={`${id}-${index}-open-error`} message={openError} />
                <FormError id={`${id}-${index}-close-error`} message={closeError} />
              </div>
            );
          })}
        </div>
        <FormError message={errors.hours?.root?.message} />
      </fieldset>
      <fieldset className="vendor-profile-capacity" disabled>
        <legend>Guest Capacity</legend>
        <div>
          {profileCapacityOptions.map((capacity) => (
            <label key={capacity}>
              <input
                type="radio"
                value={capacity}
                {...register("capacity")}
                defaultChecked={draft.capacity === capacity}
              />
              <Users size={15} />
              <span>{capacity.replaceAll("-", "\u2013")}</span>
              <span className="text-[#8D96A4]">guests</span>
            </label>
          ))}
        </div>
        <FormError message={errors.capacity?.message} />
        <p className="text-xs text-[#B8C1D1]">
          Current numeric capacity: {maximumGuestCapacity ?? "unavailable"}. Range
          editing needs an approved numeric meaning. Location/service area editing also
          requires coordinates and radius; address text alone is read-only.
        </p>
      </fieldset>
      <fieldset className="vendor-profile-cuisines" disabled={cuisineDisabled}>
        <legend>Cuisine Types</legend>
        <div>
          {cuisineOptions.map((cuisine) => (
            <label key={cuisine.id}>
              <input
                type="checkbox"
                value={cuisine.id}
                {...register("cuisines")}
                defaultChecked={draft.cuisines.includes(cuisine.id)}
              />
              {cuisine.image && <img src={cuisine.image} alt="" />}
              <span>{cuisine.label}</span>
              <span className="vendor-profile-cuisine-check" aria-hidden="true">
                &#10003;
              </span>
            </label>
          ))}
        </div>
        <FormError message={errors.cuisines?.message} />
      </fieldset>
      <p className="mt-5 text-xs leading-5 text-[#B8C1D1]">
        Only supported changed fields are saved. Missing days have no server schedule;
        untouched missing days are not submitted. Times use the backend's HH:mm format
        without inventing a timezone.
      </p>
      {errors.root && <p role="alert">{errors.root.message}</p>}
    </form>
  );
}
