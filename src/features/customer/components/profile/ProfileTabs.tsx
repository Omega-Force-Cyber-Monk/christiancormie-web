import { Grid3X3, MessageSquare, Utensils } from "lucide-react";
import { useRef } from "react";

import { TruckImage } from "@/features/customer/components/discover/DiscoverTruckCard";
import { ProfileMenu } from "@/features/customer/components/profile/ProfileMenu";
import { ProfileReviews } from "@/features/customer/components/profile/ProfileReviews";
import { profileMenu } from "@/features/customer/data/profile.data";

export type ProfileTab = "menu" | "gallery" | "reviews";
const tabs = [
  { id: "menu", label: "Menu", icon: Utensils },
  { id: "gallery", label: "Gallery", icon: Grid3X3 },
  { id: "reviews", label: "Reviews", icon: MessageSquare },
] as const;

type ProfileTabsProps = {
  active: ProfileTab;
  onChange: (tab: ProfileTab) => void;
  onImage: (image: { src: string; name: string }) => void;
};

export function ProfileTabs({ active, onChange, onImage }: ProfileTabsProps) {
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  return (
    <section className="profile-tabs">
      <div
        aria-label="Food truck profile sections"
        className="grid grid-cols-3 border-t border-[#242D42] px-4"
        role="tablist"
      >
        {tabs.map(({ id, label, icon: Icon }, index) => (
          <button
            aria-controls={`profile-panel-${id}`}
            aria-selected={active === id}
            className={`-mt-px flex h-11 items-center justify-center border-t text-[#B8C1D1] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-3px] focus-visible:outline-[#2ED3D1] ${active === id ? "border-[#FF5733]" : "border-transparent"}`}
            id={`profile-tab-${id}`}
            key={id}
            onClick={() => onChange(id)}
            onKeyDown={(event) => {
              let next: number;
              if (event.key === "ArrowRight") next = (index + 1) % tabs.length;
              else if (event.key === "ArrowLeft")
                next = (index + tabs.length - 1) % tabs.length;
              else if (event.key === "Home") next = 0;
              else if (event.key === "End") next = tabs.length - 1;
              else return;
              event.preventDefault();
              const tab = tabs[next];
              if (tab) {
                onChange(tab.id);
                tabRefs.current[next]?.focus();
              }
            }}
            ref={(element) => {
              tabRefs.current[index] = element;
            }}
            role="tab"
            tabIndex={active === id ? 0 : -1}
            type="button"
          >
            <Icon aria-hidden="true" size={20} />
            <span className="sr-only">{label}</span>
          </button>
        ))}
      </div>
      {tabs.map(({ id, label }) => (
        <div
          aria-labelledby={`profile-tab-${id}`}
          className={`profile-tab-panel ${id === "reviews" ? "profile-tab-panel--reviews" : ""}`}
          hidden={active !== id}
          id={`profile-panel-${id}`}
          key={id}
          role="tabpanel"
          tabIndex={0}
        >
          <h2 className="sr-only">{label}</h2>
          {id === "menu" && <ProfileMenu />}
          {id === "gallery" && (
            <>
              <p className="mb-4 text-sm text-[#B8C1D1]">
                Sample photos supplied with the design.
              </p>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                {profileMenu.map((item) => (
                  <button
                    aria-label={`Enlarge ${item.name} photo`}
                    className="overflow-hidden rounded-xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2ED3D1]"
                    key={item.id}
                    onClick={() => onImage({ src: item.image, name: item.name })}
                    type="button"
                  >
                    <TruckImage
                      alt={item.name}
                      className="aspect-square w-full"
                      name={item.name}
                      src={item.image}
                    />
                  </button>
                ))}
              </div>
            </>
          )}
          {id === "reviews" && <ProfileReviews />}
        </div>
      ))}
    </section>
  );
}
