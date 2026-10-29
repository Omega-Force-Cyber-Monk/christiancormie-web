import { AccountPasswordForm } from "@/features/account/components/AccountPasswordForm";
export function SettingsPasswordForm({ onCancel }: { onCancel: () => void }) {
  return <AccountPasswordForm onCancel={onCancel} />;
}
