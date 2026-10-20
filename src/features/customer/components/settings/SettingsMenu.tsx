import {
  ChevronRight,
  CircleHelp,
  KeyRound,
  Share2,
  Trophy,
  Truck,
  UserRound,
} from "lucide-react";

export type SettingsMenuAction =
  "invite" | "request" | "points" | "profile" | "password" | "support";
const general = [
  {
    action: "invite",
    title: "Invite Friends",
    description: "Get 500 points for each friend who joins!",
    Icon: Share2,
  },
  {
    action: "request",
    title: "Request a Truck",
    description: "Help us grow the platform",
    Icon: Truck,
  },
  {
    action: "points",
    title: "How to Earn Points",
    description: "Get 500 points for each friend who joins!",
    Icon: Trophy,
  },
] as const;
const security = [
  { action: "profile", title: "Profile Information", Icon: UserRound },
  { action: "password", title: "Change password", Icon: KeyRound },
  { action: "support", title: "Help & Support", Icon: CircleHelp },
] as const;
export function SettingsMenu({
  onSelect,
}: {
  onSelect: (action: SettingsMenuAction) => void;
}) {
  return (
    <nav aria-label="Settings sections" className="settings-menu">
      <h2 className="mb-3 text-xl leading-7 font-semibold">General</h2>
      <div className="space-y-2">
        {general.map(({ action, title, description, Icon }) => (
          <button
            type="button"
            className="settings-menu-item settings-menu-item--general"
            key={action}
            onClick={() => onSelect(action)}
          >
            <span className="settings-menu-icon">
              <Icon size={20} aria-hidden="true" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-base text-[#FF5733]">{title}</span>
              <span className="mt-1 block text-xs leading-[18px] text-[#B8C1D1]">
                {description}
              </span>
            </span>
            <ChevronRight size={20} aria-hidden="true" />
          </button>
        ))}
      </div>
      <h2 className="mt-7 mb-3 text-xl leading-7 font-semibold">
        Privacy &amp; Security
      </h2>
      <div className="space-y-2">
        {security.map(({ action, title, Icon }) => (
          <button
            type="button"
            className="settings-menu-item"
            key={action}
            onClick={() => onSelect(action)}
          >
            <span className="settings-menu-icon">
              <Icon size={20} aria-hidden="true" />
            </span>
            <span className="min-w-0 flex-1 text-base">{title}</span>
            <ChevronRight size={20} aria-hidden="true" />
          </button>
        ))}
      </div>
    </nav>
  );
}
