import {
  BriefcaseBusiness,
  HeartHandshake,
  Megaphone,
  PartyPopper,
  Tag,
  Truck,
} from "lucide-react";
import {
  vendorPostCategories,
  type VendorPostCategory,
} from "@/features/vendor/data/create-posts.data";
const icons = {
  truck: Truck,
  callout: Megaphone,
  sale: Tag,
  jobs: BriefcaseBusiness,
  help: HeartHandshake,
  community: PartyPopper,
};
export function VendorPostCategoryPicker({
  onSelect,
}: {
  onSelect: (category: VendorPostCategory) => void;
}) {
  return (
    <section className="vendor-post-picker">
      <h1 className="mb-6 border-b border-white/5 pb-6 text-xl font-semibold">
        Create post
      </h1>
      <div className="grid gap-3 sm:grid-cols-2">
        {vendorPostCategories.map((category) => {
          const Icon = icons[category.id];
          return (
            <button
              type="button"
              key={category.id}
              className="vendor-post-category"
              onClick={() => onSelect(category.id)}
            >
              <span
                className="vendor-post-category-icon"
                style={{
                  color: category.color,
                  backgroundColor: `${category.color}26`,
                }}
              >
                <Icon size={24} aria-hidden="true" />
              </span>
              <strong>{category.title}</strong>
              <span className="text-xs leading-5 text-[#B8C1D1]">
                {category.description}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
