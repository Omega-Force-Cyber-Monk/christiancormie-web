import { useEffect, useId, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { EyeOff, Flag, Copy, CheckCircle2 } from "lucide-react";
import { Modal } from "@/components/overlays/Modal/Modal";
import { Button } from "@/components/ui/Button";
import { FormError } from "@/components/forms/FormError";
import { ROUTES } from "@/constants/routes";
import type { CommunityPost } from "../schemas/community.schema";
import {
  communityReportReasons,
  reportReasonSchema,
} from "../schemas/communityInteractions.schema";
import { communityInteractionAllowed } from "../utils/communityInteractions";
import { useCommunityInteraction } from "../utils/useCommunityInteraction";
import { z } from "zod";
export function ConnectedCommunityReport({
  post,
  onClose,
}: {
  post: CommunityPost;
  onClose: () => void;
}) {
  const [stage, setStage] = useState<"actions" | "report" | "reported">("actions");
  const [copyStatus, setCopyStatus] = useState("");
  const title = useId();
  const action = useCommunityInteraction(post.id);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<{ reason: z.infer<typeof reportReasonSchema> }>({
    resolver: zodResolver(z.object({ reason: reportReasonSchema })),
    defaultValues: { reason: "SPAM_OR_IRRELEVANT" },
  });
  const canReport = communityInteractionAllowed(
    post,
    action.scope.userId,
    action.scope.role,
    action.allowed,
    "report",
  );
  const canHide = communityInteractionAllowed(
    post,
    action.scope.userId,
    action.scope.role,
    action.allowed,
    "ignore",
  );
  useEffect(() => {
    document.getElementById(title)?.focus();
  }, [stage, title]);
  async function hide() {
    const result = await action.run({
      kind: post.viewer?.isIgnored ? "restore" : "ignore",
    });
    if (result && action.current()) onClose();
  }
  return (
    <Modal isOpen onClose={onClose} titleId={title} panelClassName="community-drawer">
      <h2 className="sr-only" tabIndex={-1} id={title}>
        {stage === "actions"
          ? "Post actions"
          : stage === "report"
            ? "Report post"
            : "Report submitted"}
      </h2>
      {stage === "actions" && (
        <section className="community-actions-panel" aria-label="Selected post actions">
          <button
            className="community-action-row"
            type="button"
            disabled={!canReport || action.pending}
            onClick={() => setStage("report")}
          >
            <span className="bg-[#FF6B4A]/10 text-[#FF5733]">
              <Flag size={20} />
            </span>
            Report post
          </button>
          <button
            className="community-action-row"
            type="button"
            disabled={(!canHide && !post.viewer?.isIgnored) || action.pending}
            onClick={() => void hide()}
          >
            <span className="bg-[#FFB547]/10 text-[#FFB547]">
              <EyeOff size={20} />
            </span>
            {post.viewer?.isIgnored ? "Restore post" : "Hide post"}
          </button>
          <button
            className="community-action-row"
            type="button"
            onClick={() => {
              if (!navigator.clipboard) {
                setCopyStatus("Clipboard access is unavailable in this browser.");
                return;
              }
              void navigator.clipboard
                ?.writeText(
                  `${window.location.origin}${ROUTES.CUSTOMER_COMMUNITY}#${post.id}`,
                )
                .then(() => {
                  if (action.current()) setCopyStatus("Post link copied.");
                })
                .catch(() => {
                  if (action.current())
                    setCopyStatus("The post link could not be copied.");
                });
            }}
          >
            <span className="bg-[#2ED3D1]/10 text-[#2ED3D1]">
              <Copy size={20} />
            </span>
            Copy link
          </button>
          <Button className="community-cancel" onClick={onClose}>
            Cancel
          </Button>
          {!canReport && (
            <p className="text-xs text-[#B8C1D1]">
              Reporting and hiding require an eligible publisher account and another
              user's post.
            </p>
          )}
        </section>
      )}
      {stage === "report" && (
        <form
          className="community-report-panel"
          noValidate
          onSubmit={(event) => {
            void handleSubmit(async (values) => {
              const result = await action.run({
                kind: "report",
                reason: values.reason,
              });
              if (result && "report" in result && action.current())
                setStage("reported");
            })(event);
          }}
        >
          <h2 className="text-2xl leading-8 font-bold">Why are you reporting this?</h2>
          <p className="mt-4 text-sm text-[#B8C1D1]">
            Let us know what's wrong with this post
          </p>
          <fieldset
            className="mt-5 space-y-2"
            disabled={action.pending || isSubmitting}
          >
            <legend className="sr-only">Report reason</legend>
            {Object.entries(communityReportReasons).map(([label, value]) => (
              <label className="block cursor-pointer" key={value}>
                <input
                  className="peer sr-only"
                  {...register("reason")}
                  type="radio"
                  value={value}
                />
                <span className="community-report-option">
                  <span aria-hidden="true" className="community-radio-indicator" />
                  {label}
                </span>
              </label>
            ))}
          </fieldset>
          <FormError message={errors.reason?.message} />
          <div className="mt-5 grid grid-cols-2 gap-3">
            <Button className="community-report-button" onClick={onClose}>
              Cancel
            </Button>
            <Button
              className="community-report-button community-primary"
              type="submit"
              disabled={
                !canReport ||
                action.pending ||
                isSubmitting ||
                action.failure?.status === 409
              }
            >
              Submit report
            </Button>
          </div>
        </form>
      )}
      {stage === "reported" && (
        <section className="community-confirmation">
          <CheckCircle2 className="mx-auto size-16 text-[#2ED3D1]" />
          <h2 className="mt-5 text-2xl font-bold">Report submitted</h2>
          <p className="mt-4 text-sm text-[#B8C1D1]">
            Your report was saved for moderation. Reporting does not automatically
            remove or hide this post.
          </p>
          <Button
            className="community-confirmation-button community-primary mt-5"
            disabled={!canHide || action.pending}
            onClick={() => void hide()}
          >
            Hide this post
          </Button>
          <Button className="community-confirmation-button mt-3" onClick={onClose}>
            Back to feed
          </Button>
        </section>
      )}
      <div className="p-4">
        <FormError message={action.error} />
        <p role="status" className="text-xs text-[#B8C1D1]">
          {copyStatus}
        </p>
      </div>
    </Modal>
  );
}
