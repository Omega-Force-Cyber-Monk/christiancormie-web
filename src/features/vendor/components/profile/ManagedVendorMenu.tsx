import { zodResolver } from "@hookform/resolvers/zod";
import { useState, useRef, useId } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Modal } from "@/components/overlays/Modal/Modal";
import { FormField } from "@/components/forms/FormField";
import { useAccount } from "@/features/account/hooks/useAccount";
import { useGetMyTrucksQuery } from "../../api/vendor.api";
import {
  useSetupTruckMenuMutation,
  useCreateTruckMenuCategoryMutation,
  useCreateTruckMenuItemMutation,
  useUpdateTruckMenuItemMutation,
} from "../../api/truckMenu.api";
import { useUploadTruckAssetMutation } from "../../api/truckAssets.api";
import { menuItemBody } from "../../utils/truckMenu";
import {
  createCategorySchema,
  type MenuEditorValues,
  type RemoteMenu,
} from "../../schemas/truckMenu.schema";
import { normalizeApiError } from "@/utils/errors/normalizeApiError";
import type { OwnedTruck } from "../../utils/truckSettings";
import type { SessionScope } from "@/services/api/sessionGuard";
import { VendorProfileMenu } from "./VendorProfileMenu";
import { VendorMenuItemDialog } from "./VendorMenuItemDialog";
function CategoryDialog({
  truckId,
  menu,
  scope,
  onClose,
}: {
  truckId: string;
  menu: RemoteMenu;
  scope: SessionScope;
  onClose: () => void;
}) {
  const id = useId();
  const account = useAccount();
  const [create] = useCreateTruckMenuCategoryMutation();
  const lock = useRef(false);
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<{ name: string }>({
    resolver: zodResolver(createCategorySchema.pick({ name: true })),
    defaultValues: { name: "" },
  });
  return (
    <Modal
      isOpen
      onClose={() => {
        if (!isSubmitting) onClose();
      }}
      titleId={id}
    >
      <form
        className="space-y-4 p-6 pt-12"
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          if (lock.current) return;
          lock.current = true;
          void handleSubmit(async (v) => {
            try {
              await create({ scope, truckId, menuId: menu.id, body: v }).unwrap();
              if (account.isCurrent()) onClose();
            } catch (error) {
              if (account.isCurrent())
                setError("root", {
                  message: `${normalizeApiError(error).message} Refresh the hierarchy before retrying an uncertain creation.`,
                });
            }
          })(e).finally(() => {
            lock.current = false;
          });
        }}
      >
        <h2 id={id}>Add menu category</h2>
        <FormField
          label="Category name"
          {...register("name")}
          error={errors.name?.message}
        />
        {errors.root && <p role="alert">{errors.root.message}</p>}
        <button
          type="submit"
          className="vendor-profile-primary"
          disabled={isSubmitting || !isDirty}
        >
          Create category
        </button>
      </form>
    </Modal>
  );
}
export function ManagedVendorMenu({
  truck,
  scope,
}: {
  truck: OwnedTruck;
  scope: SessionScope;
}) {
  const account = useAccount();
  const [menuId, setMenuId] = useState("");
  const [dialog, setDialog] = useState<string>();
  const [categoryDialog, setCategoryDialog] = useState(false);
  const [unsupported, setUnsupported] = useState(false);
  const [setup] = useSetupTruckMenuMutation();
  const [create] = useCreateTruckMenuItemMutation();
  const [update, updating] = useUpdateTruckMenuItemMutation();
  const [upload] = useUploadTruckAssetMutation();
  const hierarchy = useGetMyTrucksQuery();
  const menus = truck.menus ?? [];
  const menu = menus.length === 1 ? menus[0] : menus.find((m) => m.id === menuId);
  const items =
    menu?.categories
      .flatMap((c) => c.items)
      .sort((a, b) => a.sortOrder - b.sortOrder || a.id.localeCompare(b.id)) ?? [];
  const item = items.find((i) => i.id === dialog);
  async function save(v: MenuEditorValues, imageUrl?: string) {
    const body = menuItemBody(v, imageUrl);
    if (!menus.length)
      await setup({
        scope,
        truckId: truck.id,
        body: {
          name: v.menuName,
          categories: [{ name: v.categoryName, items: [body] }],
        },
      }).unwrap();
    else if (item)
      await update({ scope, truckId: truck.id, itemId: item.id, body }).unwrap();
    else
      await create({
        scope,
        truckId: truck.id,
        categoryId: v.categoryId,
        body,
      }).unwrap();
    if (account.isCurrent()) {
      setDialog(undefined);
      toast.success("Menu saved. Refreshing backend hierarchy.");
    }
  }
  return (
    <section aria-label="Vendor menu management">
      <div className="flex flex-wrap gap-3 p-4">
        <button
          type="button"
          className="vendor-profile-small-primary"
          disabled={hierarchy.isFetching}
          onClick={() => void hierarchy.refetch()}
        >
          Refresh menu hierarchy
        </button>
        {menus.length > 1 && (
          <label>
            Menu
            <select
              className="vendor-menu-input"
              value={menuId}
              onChange={(e) => {
                setMenuId(e.target.value);
                setDialog(undefined);
              }}
            >
              <option value="">Choose menu</option>
              {menus.map((m) => (
                <option value={m.id} key={m.id}>
                  {m.name}
                  {m.isActive ? "" : " (inactive)"}
                </option>
              ))}
            </select>
          </label>
        )}
        {menu && (
          <button
            type="button"
            className="vendor-profile-primary"
            onClick={() => setCategoryDialog(true)}
          >
            Add category
          </button>
        )}
      </div>
      {hierarchy.isFetching && <p role="status">Refreshing menu…</p>}
      {hierarchy.isError && (
        <p role="alert">
          Menu refresh failed. Previously verified hierarchy is shown; use Refresh to
          retry.
        </p>
      )}
      {truck.menus === undefined ? (
        <p>Menu hierarchy unavailable. Refresh the truck profile.</p>
      ) : menus.length > 1 && !menu ? (
        <p>Choose an actual backend menu before editing.</p>
      ) : menu && !menu.categories.length ? (
        <p className="p-4">
          No menu categories. Create a category before adding items.
        </p>
      ) : (
        <VendorProfileMenu
          items={items}
          pending={updating.isLoading}
          onAdd={() => setDialog("new")}
          onEdit={setDialog}
          onDelete={() => setUnsupported(true)}
          onToggle={(id) => {
            const target = items.find((i) => i.id === id);
            if (!target) return;
            void update({
              scope,
              truckId: truck.id,
              itemId: id,
              body: {
                status: target.status === "AVAILABLE" ? "UNAVAILABLE" : "AVAILABLE",
              },
            })
              .unwrap()
              .catch((e: unknown) => {
                if (account.isCurrent()) toast.error(normalizeApiError(e).message);
              });
          }}
        />
      )}
      {dialog && (dialog === "new" || item) && (
        <VendorMenuItemDialog
          key={dialog}
          item={item}
          categories={menu?.categories ?? []}
          setup={menus.length === 0}
          upload={(file) => upload({ scope, truckId: truck.id, file }).unwrap()}
          isCurrent={account.isCurrent}
          onClose={() => setDialog(undefined)}
          onSave={save}
        />
      )}
      {categoryDialog && menu && (
        <CategoryDialog
          truckId={truck.id}
          menu={menu}
          scope={scope}
          onClose={() => setCategoryDialog(false)}
        />
      )}
      {unsupported && (
        <Modal
          isOpen
          onClose={() => setUnsupported(false)}
          titleId="menu-delete-unavailable"
        >
          <div className="space-y-3 p-6 pt-12">
            <h2 id="menu-delete-unavailable">Menu item deletion unavailable</h2>
            <p>
              The backend has no item-delete endpoint. The availability switch updates
              status only; it does not delete an item.
            </p>
          </div>
        </Modal>
      )}
    </section>
  );
}
