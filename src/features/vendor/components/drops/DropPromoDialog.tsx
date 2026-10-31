import { zodResolver } from "@hookform/resolvers/zod";
import { useId, useRef } from "react";
import { useForm, useWatch } from "react-hook-form";
import { FormField } from "@/components/forms/FormField";
import { FormError } from "@/components/forms/FormError";
import { Modal } from "@/components/overlays/Modal/Modal";
import { DropDurationPicker } from "@/features/vendor/components/drops/DropDurationPicker";
import type { DropPromo } from "@/features/vendor/data/drops.data";
import {
  countPromoWords,
  dropPromoSchema,
  type DropPromoValues,
} from "@/features/vendor/schemas/drops.schema";
import { LiveDropPromoDialog, type LivePromoProps } from "./LiveDropPromoDialog";

export function DropPromoDialog(
  props: LivePromoProps | Parameters<typeof PreviewDropPromoDialog>[0],
) {
  return "scope" in props ? (
    <LiveDropPromoDialog {...props} />
  ) : (
    <PreviewDropPromoDialog {...props} />
  );
}
function PreviewDropPromoDialog({
  promo,
  onSave,
  onClose,
}: {
  promo: DropPromo | null;
  onSave: (values: DropPromoValues) => void;
  onClose: () => void;
}) {
  const titleId = useId();
  const messageId = useId();
  const toggleId = useId();
  const pending = useRef(false);
  const defaults: DropPromoValues = {
    name: promo?.name ?? "",
    message: promo?.message ?? "",
    hasDuration: promo ? Boolean(promo.duration) : true,
    hours: promo?.duration?.hours ?? 3,
    minutes: promo?.duration?.minutes ?? 0,
  };
  const {
    control,
    register,
    setValue,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<DropPromoValues>({
    resolver: zodResolver(dropPromoSchema),
    defaultValues: defaults,
  });
  const [hasDuration, hours, minutes, message] = useWatch({
    control,
    name: ["hasDuration", "hours", "minutes", "message"],
  });
  const words = countPromoWords(message);
  return (
    <Modal
      isOpen
      onClose={onClose}
      titleId={titleId}
      showCloseButton={false}
      panelClassName="vendor-drop-dialog vendor-drop-promo-dialog"
      backdropClassName="bg-[#080D1A]/85"
    >
      <header className="drop-dialog-heading">
        <button type="button" onClick={onClose} disabled={isSubmitting}>
          Cancel
        </button>
        <h2 id={titleId}>Promo Details</h2>
        <span aria-hidden="true" />
      </header>
      <form
        className="drop-dialog-body space-y-4"
        noValidate
        onSubmit={(event) => {
          event.preventDefault();
          if (pending.current) return;
          pending.current = true;
          void handleSubmit(onSave)(event).finally(() => {
            pending.current = false;
          });
        }}
      >
        <FormField
          {...register("name")}
          defaultValue={defaults.name}
          label="Promo Name *"
          placeholder={'e.g. "Taco Tuesday"'}
          error={errors.name?.message}
          required
        />
        <div>
          <label className="mb-2 block text-xs font-medium" htmlFor={messageId}>
            Message shown to customers *
          </label>
          <textarea
            {...register("message")}
            defaultValue={defaults.message}
            id={messageId}
            className="drop-promo-message"
            placeholder={'e.g. "15% off all tacos today!"'}
            aria-invalid={Boolean(errors.message)}
            aria-describedby={`${messageId}-hint${errors.message ? ` ${messageId}-error` : ""}`}
            required
          />
          <p
            id={`${messageId}-hint`}
            className={`mt-1 text-sm ${words > 25 ? "text-red-300" : "text-[#B8C1D1]"}`}
          >
            25 words maximum{words > 0 ? ` · ${words}/25` : ""}
          </p>
          <FormError id={`${messageId}-error`} message={errors.message?.message} />
        </div>
        <label className="drop-promo-duration-toggle" htmlFor={toggleId}>
          <span>I want to set a duration for the promo</span>
          <input
            {...register("hasDuration")}
            id={toggleId}
            type="checkbox"
            role="switch"
            className="sr-only peer"
          />
          <span className="drop-toggle-track" aria-hidden="true" />
        </label>
        {hasDuration && (
          <div className="pt-2">
            <p className="mb-5 text-sm text-[#B8C1D1]">Set your promo duration</p>
            <DropDurationPicker
              value={{ hours, minutes }}
              onChange={(value) => {
                setValue("hours", value.hours, { shouldValidate: true });
                setValue("minutes", value.minutes, { shouldValidate: true });
              }}
            />
            <FormError message={errors.hours?.message ?? errors.minutes?.message} />
          </div>
        )}
        <button type="submit" className="drop-promo-submit" disabled={isSubmitting}>
          {isSubmitting ? "Saving…" : promo ? "Save changes" : "Add promo"}
        </button>
        <p className="text-xs leading-5 text-[#B8C1D1]">
          Promos stay in this local preview. Nothing is sent to customers.
        </p>
      </form>
    </Modal>
  );
}
