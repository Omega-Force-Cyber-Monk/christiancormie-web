import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { CheckCircle2, Copy, EyeOff, Flag } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/Button";
import type { CommunityPost } from "@/features/customer/data/community.data";
import {
  communityReportReasons,
  communityReportSchema,
  type CommunityReportValues,
} from "@/features/customer/schemas/community.schema";
import { FormError } from "@/components/forms/FormError";

type CommunityReportPreviewProps = {
  selected: CommunityPost | null;
  onHide: (post: CommunityPost) => void;
  onCopy: (post: CommunityPost) => void;
  onCancel: () => void;
  onBack: () => void;
};

export function CommunityReportPreview({
  selected,
  onHide,
  onCopy,
  onCancel,
  onBack,
}: CommunityReportPreviewProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CommunityReportValues>({
    resolver: zodResolver(communityReportSchema),
    defaultValues: { reason: communityReportReasons[0] },
  });
  const [completed, setCompleted] = useState(false);
  const [status, setStatus] = useState("");

  return (
    <aside aria-label="Reporting workflow preview" className="community-workflow">
      <section
        aria-label="Selected post actions"
        className="community-actions-panel"
        id="community-post-actions"
        tabIndex={-1}
      >
        <button
          className="community-action-row"
          disabled={!selected}
          onClick={() => document.getElementById("community-report-form")?.focus()}
          type="button"
        >
          <span className="bg-[#FF6B4A]/10 text-[#FF5733]">
            <Flag aria-hidden="true" size={20} />
          </span>
          Report post
        </button>
        <button
          className="community-action-row"
          disabled={!selected}
          onClick={() => {
            if (selected) onHide(selected);
          }}
          type="button"
        >
          <span className="bg-[#FFB547]/10 text-[#FFB547]">
            <EyeOff aria-hidden="true" size={20} />
          </span>
          Hide post
        </button>
        <button
          className="community-action-row"
          disabled={!selected}
          onClick={() => {
            if (selected) onCopy(selected);
          }}
          type="button"
        >
          <span className="bg-[#2ED3D1]/10 text-[#2ED3D1]">
            <Copy aria-hidden="true" size={20} />
          </span>
          Copy link
        </button>
        <Button className="community-cancel" onClick={onCancel}>
          Cancel
        </Button>
        <p className="sr-only">
          {selected
            ? `Actions for ${selected.author}'s sample post.`
            : "Select a post's three-dot button to enable these actions."}
        </p>
      </section>
      <form
        aria-labelledby="community-report-title"
        className="community-report-panel"
        id="community-report-form"
        onSubmit={(event) => {
          void handleSubmit(({ reason }) => {
            if (!selected) {
              setStatus(
                "Select a visible sample post using its three-dot button first.",
              );
              return;
            }
            setCompleted(true);
            setStatus(
              `Report preview complete for ${selected.author}: ${reason}. No report was sent or queued.`,
            );
            document.getElementById("community-report-confirmation")?.focus();
          })(event);
        }}
        tabIndex={-1}
      >
        <h2 className="text-2xl leading-8 font-bold" id="community-report-title">
          Why are you reporting this?
        </h2>
        <p className="mt-4 text-sm leading-5 text-[#B8C1D1]">
          Let us know what's wrong with this post
        </p>
        <fieldset className="mt-5 space-y-2">
          <legend className="sr-only">Reason for sample report</legend>
          {communityReportReasons.map((option) => (
            <label className="block cursor-pointer" key={option}>
              <input
                className="peer sr-only"
                {...register("reason")}
                type="radio"
                value={option}
              />
              <span className="community-report-option">
                <span aria-hidden="true" className="community-radio-indicator" />
                {option}
              </span>
            </label>
          ))}
        </fieldset>
        <FormError message={errors.reason?.message} />
        <div className="mt-5 grid grid-cols-2 gap-3">
          <Button
            className="community-report-button"
            onClick={() => {
              reset();
              setCompleted(false);
              setStatus("Report preview cancelled. Nothing was sent.");
            }}
          >
            Cancel
          </Button>
          <Button
            aria-label="Submit local report preview"
            className="community-report-button community-primary"
            disabled={!selected}
            type="submit"
            variant="primary"
          >
            Submit report
          </Button>
        </div>
        <p className="mt-3 text-xs leading-4 text-[#B8C1D1]">
          Local preview only. No report will be sent.
        </p>
      </form>
      <section
        aria-labelledby="community-confirmation-title"
        className="community-confirmation"
        id="community-report-confirmation"
        tabIndex={-1}
      >
        <span
          aria-hidden="true"
          className="mx-auto grid size-16 place-items-center bg-[#2ED3D1]/10 text-[#2ED3D1]"
        >
          <CheckCircle2 size={32} />
        </span>
        <h2
          className="mt-5 text-2xl leading-8 font-bold"
          id="community-confirmation-title"
        >
          Report submitted
        </h2>
        <p className="mt-2 text-xs leading-4 text-[#2ED3D1]">
          {completed
            ? "Local preview complete � nothing sent."
            : "Example confirmation � no report submitted."}
        </p>
        <blockquote
          className="mt-5 text-sm leading-6 text-[#B8C1D1]"
          aria-label="Example confirmation wording from the design"
        >
          Thanks for letting us know. Our team will review this post. If it violates
          community guidelines it will be removed.
        </blockquote>
        <p className="mt-5 text-sm leading-5 text-[#B8C1D1]">
          In the meantime you can hide the post so you don't see it again.
        </p>
        <Button
          className="community-confirmation-button community-primary mt-5"
          disabled={!selected}
          onClick={() => {
            if (selected) onHide(selected);
          }}
          variant="primary"
        >
          Hide this post
        </Button>
        <Button className="community-confirmation-button mt-3" onClick={onBack}>
          Back to feed
        </Button>
      </section>
      <p aria-live="polite" className="text-xs leading-5 text-[#B8C1D1]" role="status">
        {status ||
          (!selected
            ? "Choose a post's three-dot button to enable reporting actions."
            : "These panels preview the reporting workflow; no moderation takes place.")}
      </p>
    </aside>
  );
}
