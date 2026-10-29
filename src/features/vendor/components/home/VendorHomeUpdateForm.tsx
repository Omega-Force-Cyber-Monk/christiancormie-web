import { zodResolver } from "@hookform/resolvers/zod";
import { useId, useRef } from "react";
import { useForm } from "react-hook-form";
import { FormError } from "@/components/forms/FormError";
import { vendorHomeUpdateSchema } from "@/features/vendor/utils/homeState";

export function VendorHomeUpdateForm({
  draft,
  onDraft,
  onSave,
  disabled = false,
  error,
}: {
  draft: string;
  onDraft: (text: string) => void;
  onSave: (text: string) => void | Promise<void>;
  disabled?: boolean;
  error?: string;
}) {
  const pending = useRef(false);
  const id = useId();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<{ text: string }>({
    resolver: zodResolver(vendorHomeUpdateSchema),
    defaultValues: { text: draft },
  });
  const field = register("text");
  return (
    <form
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        if (pending.current) return;
        pending.current = true;
        void handleSubmit((values) => onSave(values.text))(event).finally(() => {
          pending.current = false;
        });
      }}
    >
      <label className="mb-2 block text-sm" htmlFor={id}>
        Truck update
      </label>
      <textarea
        disabled={isSubmitting || disabled}
        {...field}
        defaultValue={draft}
        id={id}
        className="min-h-36 w-full resize-y rounded-xl border border-[#343C4C] bg-[#1B2233] p-3"
        placeholder="Write an update for your truck…"
        aria-invalid={Boolean(errors.text)}
        aria-describedby={errors.text ? `${id}-error` : undefined}
        onChange={(event) => {
          void field.onChange(event);
          onDraft(event.target.value);
        }}
      />
      <FormError id={`${id}-error`} message={errors.text?.message || error} />
      <p className="mt-3 text-xs text-[#B8C1D1]">
        Your update is published only after backend confirmation.
      </p>
      <button
        type="submit"
        className="mt-5 min-h-11 rounded-xl bg-[#FF5733] px-5 py-2 font-medium text-black"
        disabled={isSubmitting || disabled}
      >
        {isSubmitting ? "Saving…" : "Publish update"}
      </button>
    </form>
  );
}
