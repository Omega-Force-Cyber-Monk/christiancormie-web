import { EmptyState } from "@/components/states/EmptyState";
import { TruckImage } from "@/features/customer/components/discover/DiscoverTruckCard";
import type { TruckProfileDto } from "@/features/customer/types/discovery.types";
import { safeImage } from "@/features/customer/utils/discoveryAdapters";
export function ProfileMenu({ menus }: { menus: TruckProfileDto["menus"] }) {
  if (!menus.some((menu) => menu.categories.some((category) => category.items.length)))
    return <EmptyState title="No menu items available" />;
  return (
    <div className="space-y-6">
      {menus.map((menu) => (
        <section key={menu.id}>
          <h3 className="text-lg font-semibold">{menu.name}</h3>
          {menu.categories.map((category) => (
            <section key={category.id}>
              <h4 className="my-3 font-semibold">{category.name}</h4>
              <ul aria-label={`${category.name} menu`} className="space-y-4">
                {category.items.map((item) => (
                  <li className="profile-menu-item profile-menu-featured" key={item.id}>
                    <TruckImage
                      className="size-20 shrink-0 rounded-full border border-[#FF5733] sm:size-24"
                      name={item.name}
                      src={safeImage(item.imageUrl)}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="profile-menu-heading">
                        <h5 className="text-lg leading-7 font-semibold">{item.name}</h5>
                        <p className="max-w-full text-sm font-bold text-[#FF5733]">
                          {item.price == null
                            ? "Price unavailable"
                            : `${item.price} (currency unavailable)`}
                        </p>
                      </div>
                      <p className="profile-menu-description mt-1 text-sm leading-5 text-[#B6B7BC]">
                        {item.description}
                      </p>
                      <p className="mt-2 text-xs">
                        {item.status}
                        {item.isVegan
                          ? " · Vegan"
                          : item.isVegetarian
                            ? " · Vegetarian"
                            : ""}
                        {item.isGlutenFree ? " · Gluten free" : ""}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </section>
      ))}
    </div>
  );
}
