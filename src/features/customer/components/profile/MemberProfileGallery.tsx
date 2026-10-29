import { Grid3X3, Tag } from "lucide-react";
import { useId, useRef } from "react";
import { SocialPostsGallery } from "@/features/social/components/SocialPostsGallery";
import type { MemberProfileTab } from "@/features/customer/utils/memberProfile";
const tabs = [
  { id: "posts", name: "Posts", icon: Grid3X3 },
  { id: "tagged", name: "Tagged posts", icon: Tag },
] as const;
export function MemberProfileGallery({
  tab,
  onTab,
  userId,
}: {
  tab: MemberProfileTab;
  onTab: (tab: MemberProfileTab) => void;
  userId: string;
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
          {tab === tabId && (
            <SocialPostsGallery
              key={`${userId}:${tabId}`}
              userId={userId}
              tab={tabId}
            />
          )}
        </div>
      ))}
    </section>
  );
}
