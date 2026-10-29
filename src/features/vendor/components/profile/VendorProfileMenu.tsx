import { Pencil, Plus, ToggleLeft, ToggleRight, Trash2, Utensils } from "lucide-react";
import { EmptyState } from "@/components/states/EmptyState";
import { VendorProfilePhoto } from "@/features/vendor/components/profile/VendorProfilePhoto";
import type { RemoteMenuItem } from "../../schemas/truckMenu.schema";
import { menuPrice } from "../../utils/truckMenu";
import { remoteMedia } from "@/utils/files/remoteMedia";
export function VendorProfileMenu({
  items,
  onAdd,
  onEdit,
  onDelete,
  onToggle,
  pending = false,
}: {
  items: RemoteMenuItem[];
  onAdd: () => void;
  onEdit: (id: string) => void;
  onDelete: (item: RemoteMenuItem) => void;
  onToggle: (id: string) => void;
  pending?: boolean;
}) {
  return (
    <section className="vendor-profile-menu">
      <div className="mb-6 flex items-center justify-between gap-3">
        <h2 className="text-base">
          {items.length} {items.length === 1 ? "Item" : "Items"}
        </h2>
        <button className="vendor-profile-small-primary" type="button" onClick={onAdd}>
          <Plus size={14} /> Add Item
        </button>
      </div>
      <ul className="space-y-4">
        {items.map((item) => (
          <li key={item.id} className="vendor-profile-menu-card">
            <span className="vendor-profile-menu-thumb">
              {remoteMedia(item.imageUrl) ? (
                <VendorProfilePhoto
                  source={remoteMedia(item.imageUrl)}
                  alt={item.name}
                />
              ) : (
                <Utensils size={24} />
              )}
            </span>
            <div className="min-w-0 flex-1">
              <h3 className="text-lg font-semibold">{item.name}</h3>
              <p className="mt-1 text-sm text-[#B8C1D1]">{item.description}</p>
              <p className="mt-1 text-sm font-bold text-[#00D3DF]">
                {menuPrice(item.price)}
              </p>
              <p className="text-xs text-[#B8C1D1]">{item.status}</p>
            </div>
            <div className="vendor-profile-menu-actions">
              <button
                type="button"
                role="switch"
                aria-checked={item.status === "AVAILABLE"}
                aria-label={`${item.name} availability`}
                className={
                  item.status === "AVAILABLE" ? "text-[#00D3DF]" : "text-[#596174]"
                }
                disabled={pending}
                onClick={() => onToggle(item.id)}
              >
                {item.status === "AVAILABLE" ? (
                  <ToggleRight size={26} />
                ) : (
                  <ToggleLeft size={26} />
                )}
              </button>
              <button
                className="vendor-profile-item-edit"
                type="button"
                aria-label={`Edit ${item.name}`}
                onClick={() => onEdit(item.id)}
              >
                <Pencil size={14} />
              </button>
              <button
                className="vendor-profile-item-delete"
                type="button"
                aria-label={`Delete ${item.name} (unavailable)`}
                onClick={() => onDelete(item)}
              >
                <Trash2 size={14} />
              </button>
            </div>
          </li>
        ))}
      </ul>
      {!items.length && (
        <EmptyState
          title="No menu items"
          description="Add an item to a verified backend menu category."
        />
      )}
    </section>
  );
}
