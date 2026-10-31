import { Bell, CreditCard, Globe, Shield } from "lucide-react";

import { AdminDataPanel } from "@/features/admin/components/AdminDataPanel";
import { AdminSection } from "@/features/admin/components/AdminSection";

const settings = [
  {
    title: "System Defaults",
    description: "Platform-wide defaults for operational workflows.",
    icon: Globe,
  },
  {
    title: "Security",
    description: "Authentication and administrative security controls.",
    icon: Shield,
  },
  {
    title: "Notifications",
    description: "Email and dashboard notification preferences.",
    icon: Bell,
  },
  {
    title: "Payments",
    description: "Payout, commission, and payment integration settings.",
    icon: CreditCard,
  },
];

export default function AdminSettingsPage() {
  return (
    <AdminSection
      description="Read-only settings overview. Configuration controls are unavailable."
      title="Settings"
    >
      <div className="grid gap-4 md:grid-cols-2">
        {settings.map((setting) => {
          const Icon = setting.icon;

          return (
            <AdminDataPanel
              description={setting.description}
              key={setting.title}
              title={setting.title}
            >
              <Icon className="text-[var(--primary)]" size={24} />
            </AdminDataPanel>
          );
        })}
      </div>
    </AdminSection>
  );
}
