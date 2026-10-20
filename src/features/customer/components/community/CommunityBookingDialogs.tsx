import { zodResolver } from "@hookform/resolvers/zod";
import { Check } from "lucide-react";
import { useId, useRef } from "react";
import { useForm } from "react-hook-form";
import { FormError } from "@/components/forms/FormError";
import { Modal } from "@/components/overlays/Modal/Modal";
import { Button } from "@/components/ui/Button";
import successImage from "@/features/customer/assets/community/17-booking-success.svg";
import { communityIssueSchema } from "@/features/customer/schemas/community.schema";
import type { CommunityPost } from "@/features/customer/data/community.data";
import {
  communityMoney,
  communityQuotes,
} from "@/features/customer/data/community-requests.data";

export function CommunityIssueDialog({
  post,
  onSave,
  onClose,
}: {
  post: CommunityPost;
  onSave: (details: string) => void;
  onClose: () => void;
}) {
  const id = useId();
  const busy = useRef(false);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(communityIssueSchema),
    defaultValues: { details: post.issue ?? "" },
  });
  return (
    <Modal
      isOpen
      onClose={onClose}
      titleId={`${id}-title`}
      panelClassName="community-drawer community-issue-drawer"
    >
      <form
        noValidate
        onSubmit={(event) => {
          event.preventDefault();
          if (busy.current) return;
          busy.current = true;
          void handleSubmit((values) => onSave(values.details))(event).finally(() => {
            busy.current = false;
          });
        }}
      >
        <h2 id={`${id}-title`} className="text-lg font-semibold">
          Details your issue*
        </h2>
        <label htmlFor={`${id}-details`} className="sr-only">
          Describe the booking issue
        </label>
        <textarea
          id={`${id}-details`}
          className="community-input mt-3 min-h-40"
          placeholder="Please describe the issue in detail..."
          {...register("details")}
          aria-invalid={Boolean(errors.details)}
          aria-describedby={errors.details ? `${id}-error` : undefined}
        />
        <FormError id={`${id}-error`} message={errors.details?.message} />
        <Button
          type="submit"
          disabled={isSubmitting}
          className="community-primary mt-4 w-full"
        >
          Submit report (preview)
        </Button>
        <Button className="mt-3 w-full" onClick={onClose}>
          Close
        </Button>
        <p className="mt-3 text-xs text-[#B8C1D1]">
          No issue is sent to a vendor or support.
        </p>
      </form>
    </Modal>
  );
}

export function CommunityBookingConfirmation({
  post,
  onClose,
  onView,
}: {
  post: CommunityPost;
  onClose: () => void;
  onView: () => void;
}) {
  const id = useId();
  const quote = communityQuotes.find((item) => item.id === post.acceptedQuoteId);
  return (
    <Modal
      isOpen
      onClose={onClose}
      titleId={id}
      backdropClassName="bg-black/80"
      panelClassName="community-booking-confirmation"
    >
      <img src={successImage} alt="" className="mx-auto h-28 w-28" />
      <h2 id={id} className="mt-3 text-center text-2xl font-bold">
        Booking confirmed!
      </h2>
      <p className="mt-2 text-center text-sm text-[#B8C1D1]">
        Local preview · No deposit paid or vendor notified
      </p>
      {quote && (
        <dl className="mt-8 rounded-2xl bg-[#1B2233] p-4 text-sm">
          <div className="flex justify-between gap-3 border-b border-white/5 pb-4">
            <dt>
              Sample deposit
              <br />
              <span className="text-xs text-[#B8C1D1]">{quote.name}</span>
            </dt>
            <dd className="font-bold text-[#17B26A]">
              {communityMoney(quote.depositCents)}
            </dd>
          </div>
          <div className="mt-4 flex justify-between gap-3">
            <dt>
              Balance at event
              <br />
              <span className="text-xs text-[#B8C1D1]">
                Sample amount due to vendor
              </span>
            </dt>
            <dd className="font-bold text-[#FF5733]">
              {communityMoney(quote.totalCents - quote.depositCents)}
            </dd>
          </div>
        </dl>
      )}
      <h3 className="mt-7 text-xs font-semibold text-[#7C8799]">BOOKING TIMELINE</h3>
      <ol className="mt-6 space-y-6">
        {[
          "Quote accepted",
          "Deposit paid",
          "Event day",
          "Request pending",
          "Balance paid",
        ].map((label, index) => (
          <li key={label} className="flex items-start gap-4 text-sm">
            <span
              className={`grid size-6 shrink-0 place-items-center rounded-full ${index < 2 ? "bg-[#2ED3D1] text-[#121826]" : "border border-[#5A6475] text-[#7C8799]"}`}
            >
              {index < 2 ? <Check size={14} /> : "•"}
            </span>
            <span className={index < 2 ? "" : "text-[#7C8799]"}>
              {label}
              {index < 2 ? " (preview)" : ""}
              <small className="mt-1 block text-xs text-[#7C8799]">
                {index < 2
                  ? "Simulated locally"
                  : index === 2
                    ? post.request?.date
                    : ""}
              </small>
            </span>
          </li>
        ))}
      </ol>
      <Button className="community-primary mt-8 w-full" onClick={onView}>
        View booking
      </Button>
    </Modal>
  );
}
