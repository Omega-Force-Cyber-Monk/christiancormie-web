import { TruckImage } from "@/features/customer/components/discover/DiscoverTruckCard";
import { profileMenu } from "@/features/customer/data/profile.data";

const priceFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

export function ProfileMenu() {
  return (
    <ul aria-label="Sample menu" className="space-y-4">
      {profileMenu.map((item, index) => (
        <li
          className={`profile-menu-item ${index === 0 ? "profile-menu-featured" : ""}`}
          key={item.id}
        >
          <TruckImage
            alt={item.name}
            className="size-20 shrink-0 rounded-full border border-[#FF5733] sm:size-24"
            name={item.name}
            src={item.image}
          />
          <div className="min-w-0 flex-1">
            <div className="profile-menu-heading">
              <h3 className="text-lg leading-7 font-semibold">{item.name}</h3>
              <p className="shrink-0 text-base leading-6 font-bold text-[#FF5733]">
                {priceFormatter.format(item.priceCents / 100)}
              </p>
            </div>
            <p className="profile-menu-description mt-1 text-sm leading-5 text-[#B6B7BC]">
              {item.description}
            </p>
          </div>
        </li>
      ))}
    </ul>
  );
}
