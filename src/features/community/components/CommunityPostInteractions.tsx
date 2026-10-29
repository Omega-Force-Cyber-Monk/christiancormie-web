import { useId, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Heart, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/overlays/Modal/Modal";
import { ConfirmationDialog } from "@/components/overlays/ConfirmationDialog/ConfirmationDialog";
import { useConfirmation } from "@/components/overlays/ConfirmationDialog/useConfirmation";
import { FormField } from "@/components/forms/FormField";
import { FormError } from "@/components/forms/FormError";
import { CommunityReportPreview } from "@/features/customer/components/community/CommunityReportPreview";
import { CommunityInterestedView } from "@/features/customer/components/community/CommunityInterestedView";
import type { CommunityPost } from "../schemas/community.schema";
import { communityInterestInputSchema } from "../schemas/communityInteractions.schema";
import { communityInteractionAllowed } from "../utils/communityInteractions";
import { useCommunityInteraction } from "../utils/useCommunityInteraction";
import { CommunityCommentsDialog } from "./CommunityCommentsDialog";
import "@/features/customer/components/community/community.css";
export function CommunityPostInteractions({
  post,
  mode = "all",
}: {
  post: CommunityPost;
  mode?: "all" | "engagement" | "actions";
}) {
  const action = useCommunityInteraction(post.id);
  const [view, setView] = useState<
    "comments" | "report" | "interests" | "interest" | null
  >(null);
  const title = useId();
  const confirmation = useConfirmation();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<{ message: string }>({
    resolver: zodResolver(communityInterestInputSchema),
    defaultValues: { message: "" },
  });
  const owner =
    post.author?.id === action.scope.userId && post.viewer?.isOwner === true;
  const canInterest = communityInteractionAllowed(
    post,
    action.scope.userId,
    action.scope.role,
    action.allowed,
    "interest",
  );
  const canWithdraw = communityInteractionAllowed(
    post,
    action.scope.userId,
    action.scope.role,
    action.allowed,
    "withdraw",
  );
  return (
    <>
      {mode !== "actions" && (
        <div className="mt-3 flex flex-wrap items-center border-t border-white/5 text-[#B8C1D1]">
          <button
            className="community-reaction"
            type="button"
            disabled={action.pending}
            aria-label="Save LIKE reaction"
            title="Saves or replaces LIKE; removing reactions is unavailable"
            onClick={() => void action.run({ kind: "react" })}
          >
            <Heart size={20} aria-hidden="true" />
            {post.counts?.reactions ?? "Unavailable"}
          </button>
          <button
            className="community-reaction"
            type="button"
            onClick={() => setView("comments")}
            aria-label={`View comments for ${post.title}`}
          >
            <MessageCircle size={20} aria-hidden="true" />
            {post.counts?.comments ?? "Unavailable"} comments
          </button>
          {post.category === "NEED_TRUCK" && (
            <span className="community-reaction">
              {post.counts?.offers ?? "Unavailable"} offers
            </span>
          )}
          {post.category === "VENDOR_CALLOUT" && (
            <span className="community-reaction">
              {post.counts?.interestedVendors ?? "Unavailable"} vendors interested
            </span>
          )}
          {owner && post.category === "VENDOR_CALLOUT" && (
            <Button
              className="community-primary mt-3 w-full"
              onClick={() => setView("interests")}
            >
              View interested trucks
            </Button>
          )}
        </div>
      )}
      {mode !== "engagement" && (
        <div className="mt-4 space-y-2">
          <Button onClick={() => setView("report")}>Post actions</Button>
          {action.scope.role === "VENDOR" &&
            !owner &&
            post.category === "VENDOR_CALLOUT" &&
            (post.viewer?.isInterested ? (
              <Button
                disabled={!canWithdraw || action.pending}
                onClick={() =>
                  confirmation.confirm({
                    title: "Withdraw your interest?",
                    description:
                      "Your introduction will be removed from the organizer's interest list. This does not cancel a booking or quote.",
                    confirmText: "Withdraw interest",
                    onConfirm: async () => {
                      const result = await action.run({ kind: "withdraw" });
                      if (!result)
                        throw new Error(
                          "Withdrawal was not confirmed. Your interest has not been updated here.",
                        );
                    },
                  })
                }
              >
                Withdraw interest
              </Button>
            ) : (
              <Button
                disabled={!canInterest || action.pending}
                onClick={() => setView("interest")}
              >
                Send interest
              </Button>
            ))}
        </div>
      )}
      <FormError message={action.error} />
      {view === "comments" && (
        <CommunityCommentsDialog
          key={post.id}
          post={post}
          onClose={() => setView(null)}
        />
      )}
      {view === "report" && (
        <CommunityReportPreview livePost={post} onCancel={() => setView(null)} />
      )}
      {view === "interests" && (
        <Modal
          isOpen
          onClose={() => setView(null)}
          titleId={title}
          panelClassName="community-drawer"
        >
          <div className="p-5">
            <h2 id={title} className="sr-only">
              Interested vendors
            </h2>
            <CommunityInterestedView livePost={post} onBack={() => setView(null)} />
          </div>
        </Modal>
      )}
      {view === "interest" && (
        <Modal
          isOpen
          onClose={() => setView(null)}
          titleId={title}
          panelClassName="community-drawer"
        >
          <form
            className="p-5 space-y-4"
            noValidate
            onSubmit={(event) => {
              void handleSubmit(async (values) => {
                const result = await action.run({
                  kind: "interest",
                  message: values.message,
                });
                if (result && action.current()) {
                  reset({ message: "" });
                  setView(null);
                }
              })(event);
            }}
          >
            <h2 id={title} className="text-xl font-semibold">
              Send interest
            </h2>
            <FormField
              label="Introduce your business"
              {...register("message")}
              disabled={action.pending}
              error={errors.message?.message}
            />
            <FormError message={action.error} />
            <p className="text-xs text-[#B8C1D1]">
              This sends your introduction to the organizer. It does not create an
              offer, invitation or booking.
            </p>
            <Button
              type="submit"
              disabled={!canInterest || action.pending || isSubmitting}
              className="community-primary"
            >
              Send interest
            </Button>
          </form>
        </Modal>
      )}
      {confirmation.confirmationProps && (
        <ConfirmationDialog {...confirmation.confirmationProps} />
      )}
    </>
  );
}
