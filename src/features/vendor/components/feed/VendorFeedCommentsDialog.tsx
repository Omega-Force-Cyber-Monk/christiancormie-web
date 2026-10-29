import { SocialCommentsDialog } from "@/features/social/components/SocialCommentsDialog";
import type { SocialCard } from "@/features/social/utils/feedAdapters";
export function VendorFeedCommentsDialog({
  post,
  isOpen,
  onClose,
}: {
  post: SocialCard;
  isOpen: boolean;
  onClose: () => void;
}) {
  return (
    <SocialCommentsDialog
      post={post}
      isOpen={isOpen}
      onClose={onClose}
      variant="vendor"
    />
  );
}
