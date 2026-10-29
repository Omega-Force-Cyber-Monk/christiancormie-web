import { AccountPasswordForm } from "@/features/account/components/AccountPasswordForm";
import { useAccount } from "@/features/account/hooks/useAccount";
export function VendorPasswordPreviewForm({
  onCancel,
  onValidated,
}: {
  onCancel: () => void;
  onValidated: () => void;
}) {
  const account = useAccount();
  return (
    <AccountPasswordForm
      key={account.key}
      vendor
      onCancel={onCancel}
      onSaved={onValidated}
    />
  );
}
