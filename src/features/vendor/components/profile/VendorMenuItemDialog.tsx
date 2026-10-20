import { useId, useRef, useState } from "react";
import { DollarSign, X } from "lucide-react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Modal } from "@/components/overlays/Modal/Modal";
import { FormField } from "@/components/forms/FormField";
import { FormError } from "@/components/forms/FormError";
import { VendorProfilePhotoPicker } from "@/features/vendor/components/profile/VendorProfilePhotoPicker";
import {
  vendorMenuItemSchema,
  type VendorMenuValues,
} from "@/features/vendor/schemas/profile.schema";
import type {
  ProfileMenuItem,
  ProfilePhotoSource,
} from "@/features/vendor/data/profile.data";
export function VendorMenuItemDialog({
  item,
  onClose,
  onSave,
}: {
  item?: ProfileMenuItem;
  onClose: () => void;
  onSave: (id: string, values: VendorMenuValues, photo?: ProfilePhotoSource) => void;
}) {
  const id = useId();
  return (
    <Modal
      isOpen
      onClose={onClose}
      titleId={`${id}-title`}
      panelClassName="vendor-menu-item-dialog"
      backdropClassName="bg-[#121826]/90"
      showCloseButton={false}
    >
      <VendorMenuItemForm
        item={item}
        titleId={`${id}-title`}
        onClose={onClose}
        onSave={onSave}
      />
    </Modal>
  );
}
export function VendorMenuItemForm({
  item,
  titleId,
  onClose,
  onSave,
}: {
  item?: ProfileMenuItem;
  titleId: string;
  onClose: () => void;
  onSave: (id: string, values: VendorMenuValues, photo?: ProfilePhotoSource) => void;
}) {
  const id = useId();
  const pending = useRef(false);
  const [photo, setPhoto] = useState<ProfilePhotoSource | undefined>(item?.photo);
  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<VendorMenuValues>({
    resolver: zodResolver(vendorMenuItemSchema),
    defaultValues: {
      name: item?.name ?? "",
      price: item ? (item.priceCents / 100).toFixed(2) : "",
      description: item?.description ?? "",
    },
  });
  const description = useWatch({ control, name: "description" });
  return (
    <form
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        if (pending.current) return;
        pending.current = true;
        void handleSubmit((values) =>
          onSave(item?.id ?? crypto.randomUUID(), values, photo),
        )(event).finally(() => {
          pending.current = false;
        });
      }}
    >
      <header className="vendor-menu-dialog-heading">
        <button
          className="vendor-profile-back"
          type="button"
          aria-label="Close menu item dialog"
          onClick={onClose}
        >
          <X size={18} />
        </button>
        <h2 id={titleId}>{item ? "Edit Menu Item" : "Add Menu Item"}</h2>
      </header>
      <VendorProfilePhotoPicker source={photo} onChange={setPhoto} />
      <div className="mt-3 space-y-3">
        <FormField
          label="Item name"
          className="vendor-menu-input"
          placeholder="e.g. Carne Asada Taco"
          {...register("name")}
          defaultValue={item?.name ?? ""}
          error={errors.name?.message}
        />
        <div className="vendor-menu-price-field">
          <DollarSign size={18} aria-hidden="true" />
          <FormField
            label="Price (USD)"
            className="vendor-menu-input"
            placeholder="0.00"
            inputMode="decimal"
            {...register("price")}
            defaultValue={item ? (item.priceCents / 100).toFixed(2) : ""}
            error={errors.price?.message}
          />
        </div>
        <div>
          <label
            className="mb-2 block text-sm font-semibold"
            htmlFor={`${id}-description`}
          >
            Description
          </label>
          <textarea
            id={`${id}-description`}
            className="vendor-menu-input min-h-20 w-full resize-y"
            maxLength={120}
            {...register("description")}
            defaultValue={item?.description ?? ""}
            placeholder="Short description of ingredients or preparation..."
            aria-invalid={!!errors.description}
            aria-describedby={`${id}-count${errors.description ? ` ${id}-description-error` : ""}`}
          />
          <FormError
            id={`${id}-description-error`}
            message={errors.description?.message}
          />
          <p id={`${id}-count`} className="mt-2 text-right text-xs text-[#B8C1D1]">
            {description.length} / 120
          </p>
        </div>
      </div>
      <button
        className="vendor-profile-primary mt-9 w-full"
        type="submit"
        disabled={isSubmitting}
      >
        Save item
      </button>
      <p className="mt-3 text-xs text-[#B8C1D1]">
        Saved locally; nothing is published.
      </p>
    </form>
  );
}
