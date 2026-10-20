import { Grid3X3, Tag } from "lucide-react";
import { useId, useRef } from "react";
import { EmptyState } from "@/components/states/EmptyState";
import { TruckImage } from "@/features/customer/components/discover/DiscoverTruckCard";
import {
  memberProfilePhotos,
  type MemberProfilePhoto,
} from "@/features/customer/data/member-profile.data";
import type { MemberProfileTab } from "@/features/customer/utils/memberProfile";

const tabs = [
  { id: "posts", name: "Posts", icon: Grid3X3 },
  { id: "tagged", name: "Tagged posts", icon: Tag },
] as const;
export function MemberProfileGallery({
  tab,
  onTab,
  onPhoto,
}: {
  tab: MemberProfileTab;
  onTab: (tab: MemberProfileTab) => void;
  onPhoto: (photo: MemberProfilePhoto) => void;
}) {
  const id = useId();
  const buttons = useRef<(HTMLButtonElement | null)[]>([]);
  return (
    <section className="member-profile-gallery">
      <div className="member-profile-tabs" role="tablist" aria-label="Profile content">
        {tabs.map(({ id: tabId, name, icon: Icon }, index) => (
          <button
            key={tabId}
            type="button"
            id={`${id}-${tabId}-tab`}
            role="tab"
            aria-label={name}
            aria-selected={tab === tabId}
            aria-controls={`${id}-${tabId}-panel`}
            tabIndex={tab === tabId ? 0 : -1}
            ref={(element) => {
              buttons.current[index] = element;
            }}
            onClick={() => onTab(tabId)}
            onKeyDown={(event) => {
              let next;
              if (event.key === "ArrowRight" || event.key === "ArrowLeft")
                next = 1 - index;
              else if (event.key === "Home") next = 0;
              else if (event.key === "End") next = 1;
              else return;
              event.preventDefault();
              const target = tabs[next];
              if (target) {
                onTab(target.id);
                buttons.current[next]?.focus();
              }
            }}
          >
            <Icon aria-hidden="true" size={22} />
          </button>
        ))}
      </div>
      {tabs.map(({ id: tabId, name }) => (
        <div
          hidden={tab !== tabId}
          key={tabId}
          id={`${id}-${tabId}-panel`}
          role="tabpanel"
          aria-labelledby={`${id}-${tabId}-tab`}
          tabIndex={0}
          className="member-profile-tab-panel"
        >
          <h2 className="sr-only">{name}</h2>
          {tabId === "posts" ? (
            <div className="member-profile-photo-grid">
              {memberProfilePhotos.map((photo, index) =>
                photo ? (
                  <button
                    type="button"
                    key={photo.id}
                    className="member-profile-photo"
                    aria-label={`View ${photo.name} post`}
                    onClick={() => onPhoto(photo)}
                  >
                    <TruckImage
                      name={photo.name}
                      alt={photo.name}
                      src={photo.image}
                      className="h-full w-full"
                    />
                  </button>
                ) : (
                  <div
                    key={`empty-${index}`}
                    className="member-profile-photo member-profile-photo--empty"
                    aria-hidden="true"
                  />
                ),
              )}
            </div>
          ) : (
            <EmptyState
              title="No tagged posts"
              description="There are no tagged posts in this local preview."
            />
          )}
        </div>
      ))}
    </section>
  );
}
