import { useId, useRef, useState } from "react";
import { X } from "lucide-react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Modal } from "@/components/overlays/Modal/Modal";
import { FormField } from "@/components/forms/FormField";
import { VendorProfilePhotoPicker } from "./VendorProfilePhotoPicker";
import {
  menuEditorSchema,
  type MenuEditorValues,
  type RemoteMenuItem,
} from "../../schemas/truckMenu.schema";
import type { UploadedAsset } from "../../schemas/truckAssets.schema";
import { persistTruckAsset } from "../../utils/persistTruckAsset";
import { remoteMedia } from "@/utils/files/remoteMedia";
import { normalizeApiError } from "@/utils/errors/normalizeApiError";
import { applyServerFieldErrors } from "@/utils/errors/applyServerFieldErrors";
type Props = {
  item?: RemoteMenuItem;
  onClose: () => void;
  onSave: (values: MenuEditorValues, imageUrl?: string) => Promise<unknown> | void;
  categories?: { id: string; name: string }[];
  setup?: boolean;
  upload?: (file: File) => Promise<UploadedAsset>;
  isCurrent?: () => boolean;
};
export function VendorMenuItemDialog(props: Props) {
  const id = useId();
  const [busy, setBusy] = useState(false);
  return (
    <Modal
      isOpen
      onClose={() => {
        if (!busy) props.onClose();
      }}
      titleId={`${id}-title`}
      panelClassName="vendor-menu-item-dialog"
      backdropClassName="bg-[#121826]/90"
      showCloseButton={false}
    >
      <VendorMenuItemForm {...props} titleId={`${id}-title`} onBusy={setBusy} />
    </Modal>
  );
}
export function VendorMenuItemForm({
  item,
  titleId,
  onClose,
  onSave,
  categories = [],
  setup = false,
  upload,
  isCurrent = () => true,
  onBusy,
}: { titleId: string; onBusy?: (value: boolean) => void } & Props) {
  const id = useId();
  const pending = useRef(false);
  const [photo, setPhoto] = useState<File>();
  const uploaded = useRef<{ file: File; asset: UploadedAsset } | undefined>(undefined);
  const schema = menuEditorSchema.superRefine((v, c) => {
    if (setup) {
      if (!v.menuName)
        c.addIssue({
          code: "custom",
          path: ["menuName"],
          message: "Enter a menu name.",
        });
      if (!v.categoryName)
        c.addIssue({
          code: "custom",
          path: ["categoryName"],
          message: "Enter a category name.",
        });
    } else if (!item && !categories.some((r) => r.id === v.categoryId))
      c.addIssue({
        code: "custom",
        path: ["categoryId"],
        message: "Choose a backend menu category.",
      });
  });
  const {
    register,
    control,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<MenuEditorValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: item?.name ?? "",
      price: item ? String(item.price) : "",
      description: item?.description ?? "",
      isVegetarian: item?.isVegetarian ?? false,
      isVegan: item?.isVegan ?? false,
      isGlutenFree: item?.isGlutenFree ?? false,
      categoryId: item?.categoryId ?? (categories.length === 1 ? categories[0].id : ""),
      menuName: "",
      categoryName: "",
    },
  });
  const description = useWatch({ control, name: "description" });
  return (
    <form
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        if (pending.current) return;
        pending.current = true;
        onBusy?.(true);
        void handleSubmit(async (v) => {
          try {
            if (photo) {
              if (!upload) throw Error("Image upload unavailable.");
              const selected = photo;
              await persistTruckAsset({
                uploaded:
                  uploaded.current?.file === selected
                    ? uploaded.current.asset
                    : undefined,
                upload: () => upload(selected),
                remember: (asset) => {
                  uploaded.current = { file: selected, asset };
                },
                persist: async (asset) => onSave(v, asset.url),
                isCurrent,
              });
            } else await onSave(v);
          } catch (error) {
            if (isCurrent()) {
              const failure = normalizeApiError(error);
              applyServerFieldErrors(failure, setError, [
                "name",
                "price",
                "description",
                "isVegetarian",
                "isVegan",
                "isGlutenFree",
              ]);
              setError("root", {
                message: `${failure.message} Save is unconfirmed. Your draft and confirmed upload are kept; refresh the hierarchy before explicitly retrying an uncertain save.`,
              });
            }
          }
        })(e).finally(() => {
          pending.current = false;
          onBusy?.(false);
        });
      }}
    >
      <header className="vendor-menu-dialog-heading">
        <button
          className="vendor-profile-back"
          type="button"
          aria-label="Close menu item dialog"
          disabled={isSubmitting}
          onClick={onClose}
        >
          <X size={18} />
        </button>
        <h2 id={titleId}>
          {item
            ? "Edit Menu Item"
            : setup
              ? "Set up menu and first item"
              : "Add Menu Item"}
        </h2>
      </header>
      <VendorProfilePhotoPicker
        source={photo ?? remoteMedia(item?.imageUrl)}
        onChange={setPhoto}
        disabled={isSubmitting}
      />
      <div className="mt-3 space-y-3">
        {setup ? (
          <>
            <FormField
              label="Menu name"
              {...register("menuName")}
              error={errors.menuName?.message}
            />
            <FormField
              label="First category name"
              {...register("categoryName")}
              error={errors.categoryName?.message}
            />
          </>
        ) : (
          !item && (
            <label className="block text-sm">
              Menu category
              <select
                className="vendor-menu-input w-full"
                {...register("categoryId")}
                defaultValue={categories.length === 1 ? categories[0].id : ""}
              >
                <option value="">Choose category</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
              {errors.categoryId && (
                <span role="alert">{errors.categoryId.message}</span>
              )}
            </label>
          )
        )}
        <FormField
          label="Item name"
          className="vendor-menu-input"
          {...register("name")}
          defaultValue={item?.name ?? ""}
          error={errors.name?.message}
        />
        <div className="vendor-menu-price-field">
          <FormField
            label="Price (major units; currency unavailable)"
            className="vendor-menu-input"
            inputMode="decimal"
            placeholder="0.00"
            {...register("price")}
            defaultValue={item ? String(item.price) : ""}
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
            {...register("description")}
            defaultValue={item?.description ?? ""}
          />
          <p className="mt-2 text-right text-xs text-[#B8C1D1]">
            {description.length} characters
          </p>
        </div>
        <fieldset>
          <legend>Dietary options</legend>
          {[
            ["isVegetarian", "Vegetarian"],
            ["isVegan", "Vegan"],
            ["isGlutenFree", "Gluten free"],
          ].map(([field, label]) => (
            <label key={field} className="mr-3 inline-flex gap-2">
              <input
                type="checkbox"
                {...register(field as "isVegetarian" | "isVegan" | "isGlutenFree")}
                defaultChecked={Boolean(
                  item?.[field as "isVegetarian" | "isVegan" | "isGlutenFree"],
                )}
              />
              {label}
            </label>
          ))}
        </fieldset>
      </div>
      {errors.root && <p role="alert">{errors.root.message}</p>}
      <button
        className="vendor-profile-primary mt-9 w-full"
        type="submit"
        disabled={isSubmitting || (Boolean(item) && !isDirty && !photo)}
      >
        Save item
      </button>
      <p className="mt-3 text-xs text-[#B8C1D1]">
        Price is sent in the backend's decimal major units, with no cents conversion. A
        menu is created only when no menu exists. Permanent item deletion is
        unavailable.
      </p>
    </form>
  );
}
