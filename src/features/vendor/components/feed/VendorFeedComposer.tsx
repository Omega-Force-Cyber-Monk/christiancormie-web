import { zodResolver } from "@hookform/resolvers/zod";
import { useId, useRef } from "react";
import { useForm, useWatch } from "react-hook-form";
import { FormError } from "@/components/forms/FormError";
import { vendorFeedTextSchema } from "@/features/vendor/utils/feedState";

export function VendorFeedComposer({
  onPost,
  disabled = false,
  avatar = "",
}: {
  onPost: (text: string) => void | boolean | Promise<boolean>;
  disabled?: boolean;
  avatar?: string;
}) {
  const id = useId();
  const pending = useRef(false);
  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<{ text: string }>({
    resolver: zodResolver(vendorFeedTextSchema),
    defaultValues: { text: "" },
  });
  const text = useWatch({ control, name: "text" });
  return (
    <form
      className="vendor-feed-composer"
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        if (pending.current) return;
        pending.current = true;
        void handleSubmit(async (values) => {
          if ((await onPost(values.text)) === false) return;
          reset();
        })(event).finally(() => {
          pending.current = false;
        });
      }}
    >
      <img
        src={avatar || undefined}
        alt=""
        className="size-[50px] shrink-0 rounded-full border border-[#FF5733] object-cover"
      />
      <div className="min-w-0 flex-1">
        <label className="sr-only" htmlFor={id}>
          Share a location drop, menu item, or promo
        </label>
        <textarea
          disabled={isSubmitting || disabled}
          {...register("text")}
          id={id}
          className="vendor-feed-compose-input"
          placeholder="Share a location drop, menu item, or promo..."
          aria-invalid={Boolean(errors.text)}
          aria-describedby={errors.text ? `${id}-error` : undefined}
        />
        <FormError id={`${id}-error`} message={errors.text?.message} />
        {text.length > 0 && (
          <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs text-[#B8C1D1]">Publish a truck update.</p>
            <div className="flex gap-2">
              <button
                type="button"
                className="min-h-11 rounded-xl px-3 text-sm"
                disabled={isSubmitting || disabled}
                onClick={() => reset()}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="min-h-11 rounded-xl bg-[#FF5733] px-4 text-sm font-semibold text-black"
                disabled={isSubmitting || disabled}
              >
                {isSubmitting ? "Adding…" : "Post"}
              </button>
            </div>
          </div>
        )}
      </div>
    </form>
  );
}
