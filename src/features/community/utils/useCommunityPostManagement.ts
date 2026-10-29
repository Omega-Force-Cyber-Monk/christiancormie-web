import { useStore } from "react-redux";
import { useRef, useEffect } from "react";
import type { AppDispatch, RootState } from "@/app/store";
import { communityApi } from "../api/community.api";
import type { CommunityPost } from "../schemas/community.schema";
import { useCommunityPublisher } from "./useCommunityPublishing";
import { editableCommunityPost } from "./communityPublishing";
import { useConfirmation } from "@/components/overlays/ConfirmationDialog/useConfirmation";
import { scopeMatches } from "@/services/api/sessionGuard";
import { toast } from "sonner";
export function useCommunityPostManagement(
  post: CommunityPost | undefined,
  onDeleted: () => void,
) {
  const publisher = useCommunityPublisher();
  const store = useStore<RootState>();
  const dispatch = store.dispatch as AppDispatch;
  const confirmation = useConfirmation();
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);
  const canEdit =
    publisher.allowed && editableCommunityPost(post, publisher.scope.userId, "edit");
  const canDelete =
    publisher.allowed && editableCommunityPost(post, publisher.scope.userId, "delete");
  function requestDelete() {
    if (!post || !canDelete) return;
    const scope = publisher.scope;
    confirmation.confirm({
      title: "Delete this Community post?",
      description:
        "The backend will mark this post deleted. This does not remove uploaded assets from storage.",
      confirmText: "Delete post",
      variant: "danger",
      onConfirm: async () => {
        const req = dispatch(
          communityApi.endpoints.deleteCommunityPost.initiate({
            ...scope,
            postId: post.id,
            confirmed: true,
          }),
        );
        try {
          await req.unwrap();
          if (mounted.current && scopeMatches(store.getState(), scope)) {
            toast.success("Community post deleted.");
            onDeleted();
          }
        } finally {
          req.reset();
        }
      },
    });
  }
  return {
    canEdit,
    canDelete,
    requestDelete,
    confirmationProps: confirmation.confirmationProps,
    pending: !!confirmation.confirmationProps?.isProcessing,
  };
}
