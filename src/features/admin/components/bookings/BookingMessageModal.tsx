import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import { useStore } from "react-redux";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { z } from "zod";
import {
  financialAmount,
  formatFinancialAmount,
} from "@/features/payments/utils/financialValues";
import type { RootState } from "@/app/store";
import { useAppSelector } from "@/app/hooks";
import { selectCurrentRole } from "@/features/auth/store/auth.selectors";
import { Modal } from "@/components/overlays/Modal/Modal";
import { ConfirmationDialog } from "@/components/overlays/ConfirmationDialog/ConfirmationDialog";
import { useConfirmation } from "@/components/overlays/ConfirmationDialog/useConfirmation";
import { Button } from "@/components/ui/Button";
import { ErrorState } from "@/components/states/ErrorState";
import { normalizeApiError } from "@/utils/errors/normalizeApiError";
import {
  adminIssueAllowed,
  useGetAdminBookingIssuesQuery,
  useGetAdminIssueMessagesQuery,
  useSendAdminIssueMessageMutation,
  type AdminIssueBooking,
  type AdminIssueSelection,
} from "../../api/adminIssues.api";
import {
  issueMessageInputSchema,
  type BookingIssue,
  type BookingIssueThread,
} from "@/features/customer/schemas/bookingIssues.schema";
import type { BookingRecord } from "./bookings.types";
import type { AdminBookingDto } from "../../types/admin.dto";
import { issueDecisionState } from "../../utils/adminFinancialSafety";

export function BookingMessageModal({
  isOpen,
  onClose,
  booking,
}: {
  isOpen: boolean;
  onClose: () => void;
  booking: BookingRecord | null;
}) {
  const auth = useAppSelector((s) => s.auth);
  const role = useAppSelector(selectCurrentRole);
  const scope = {
    sessionId: auth.sessionId ?? "",
    userId: auth.user?.id ?? "",
    role: role ?? "",
    bookingId: booking?.id ?? "",
  };
  const allowed = useAppSelector((s) => adminIssueAllowed(s, scope));
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      titleId="booking-message-title"
      backdropClassName="bg-black/75 backdrop-blur-sm"
      panelClassName="relative flex max-h-[85vh] w-full max-w-xl flex-col overflow-hidden rounded-2xl border border-[#1e2638] bg-[#141a27] text-slate-200 shadow-2xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ff6542]"
    >
      <div className="overflow-y-auto p-6 pt-12">
        <h2 id="booking-message-title" className="text-lg font-semibold">
          Booking issues
        </h2>
        {isOpen && allowed && booking ? (
          <AdminBookingIssues
            key={`${scope.sessionId}:${scope.userId}:${scope.role}:${booking.id}`}
            scope={scope}
            booking={booking.source}
          />
        ) : (
          <p role="alert">A verified Admin and real booking identity are required.</p>
        )}
      </div>
    </Modal>
  );
}
export function AdminBookingIssues({
  scope,
  booking,
}: {
  scope: AdminIssueBooking;
  booking: AdminBookingDto;
}) {
  const query = useGetAdminBookingIssuesQuery(scope);
  const [selected, select] = useState<string | null>(null);
  const issues = !query.error ? query.currentData?.items : undefined;
  return (
    <section className="space-y-4">
      <p className="break-all text-xs">Booking ID: {scope.bookingId}</p>
      <Button disabled={query.isFetching} onClick={() => void query.refetch()}>
        Refresh issues
      </Button>
      {query.isFetching && <p role="status">Loading booking issues…</p>}
      {query.error && (
        <ErrorState
          error={normalizeApiError(query.error)}
          onRetry={() => void query.refetch()}
        />
      )}
      {issues && !issues.length && <p role="status">No booking issues.</p>}
      {issues?.map((issue) => (
        <article
          key={issue.id}
          className="space-y-2 rounded-xl border border-[#2b374e] p-3"
        >
          <IssueFacts issue={issue} />
          <Button aria-pressed={selected === issue.id} onClick={() => select(issue.id)}>
            View issue messages
          </Button>
        </article>
      ))}
      {selected && (
        <div hidden={!!query.error || !issues?.some((i) => i.id === selected)}>
          <AdminIssueThread
            key={selected}
            scope={{ ...scope, issueId: selected }}
            booking={booking}
            disabled={
              query.isFetching ||
              !!query.error ||
              !issues?.some((i) => i.id === selected && i.status === "OPEN")
            }
          />
        </div>
      )}
    </section>
  );
}
export function IssueFacts({ issue }: { issue: BookingIssue }) {
  return (
    <div className="space-y-1 break-words text-sm">
      <p className="break-all">Issue ID: {issue.id}</p>
      <p>Status: {issue.status}</p>
      <p className="whitespace-pre-wrap">Original description: {issue.message}</p>
      <p>Created: {issue.createdAt}</p>
      <p>Decision: {issue.resolutionDecision ?? "No decision"}</p>
      <p className="whitespace-pre-wrap">
        Resolution notes: {issue.resolutionNote ?? "None returned"}
      </p>
      <p>Resolved: {issue.resolvedAt ?? "Not resolved"}</p>
      <p>Resolved by: {issue.resolvedById ?? "Unavailable"}</p>
    </div>
  );
}
export function IssueMessages({ thread }: { thread: BookingIssueThread }) {
  return (
    <div className="space-y-3">
      <IssueFacts issue={thread.issue} />
      {!thread.messages.length && <p role="status">No issue messages.</p>}
      {thread.messages.map((m) => (
        <article
          key={m.id}
          className={`rounded-xl border border-[#2b374e] p-3 ${m.senderRole === "ADMIN" ? "bg-[#ff6542]/10" : "bg-[#1c2436]"}`}
        >
          <p className="text-xs">
            {m.senderName} · {m.senderRole}
          </p>
          <p className="whitespace-pre-wrap break-words">{m.message}</p>
          <time dateTime={m.createdAt} className="text-xs">
            {m.createdAt}
          </time>
        </article>
      ))}
    </div>
  );
}
export function IssueDecisions({
  issue,
  booking,
}: {
  issue: BookingIssue;
  booking: AdminBookingDto;
}) {
  return (
    <section className="space-y-2 text-xs" aria-label="Resolution eligibility">
      <p>Booking status: {booking.status}</p>
      <p>
        Payment ID:{" "}
        {z.uuid().safeParse(booking.payment?.id).success
          ? booking.payment?.id
          : "Unavailable"}
        ; status: {booking.payment?.status ?? "Unavailable"}
      </p>
      <p>
        Payment amount:{" "}
        {formatFinancialAmount(
          financialAmount(booking.payment?.amount, booking.payment?.currency, "major"),
        )}
      </p>
      <p>
        Returned refund IDs:{" "}
        {booking.payment?.refunds
          .filter((r) => z.uuid().safeParse(r.id).success)
          .map((r) => r.id)
          .join(", ") || "None supplied"}
        . Refund settlement is not returned here.
      </p>
      <p>Payout association/provider settlement: unavailable in booking management.</p>
      {(["RELEASE_PAYOUT", "FULL_REFUND"] as const).map((decision) => {
        const state = issueDecisionState(issue, booking, decision);
        return (
          <div key={decision}>
            <Button disabled>
              {decision === "FULL_REFUND"
                ? "Full refund unavailable"
                : "Release payout unavailable"}
            </Button>
            {state.reasons.map((reason) => (
              <p key={reason}>{reason}</p>
            ))}
          </div>
        );
      })}
    </section>
  );
}
function AdminIssueThread({
  scope,
  booking,
  disabled,
}: {
  scope: AdminIssueSelection;
  booking: AdminBookingDto;
  disabled: boolean;
}) {
  const query = useGetAdminIssueMessagesQuery(scope);
  const thread = !query.error ? query.currentData : undefined;
  const [send, state] = useSendAdminIssueMessageMutation();
  const store = useStore<RootState>();
  const mounted = useRef(false);
  const lock = useRef(false);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);
  const current = () => mounted.current && adminIssueAllowed(store.getState(), scope);
  const form = useForm({
    resolver: zodResolver(issueMessageInputSchema),
    defaultValues: { message: "" },
  });
  const confirmation = useConfirmation();
  const submit = (event: FormEvent<HTMLFormElement>) =>
    form.handleSubmit((body) => {
      if (
        lock.current ||
        disabled ||
        query.isFetching ||
        thread?.issue.status !== "OPEN" ||
        !current()
      )
        return;
      confirmation.confirm({
        title: "Send issue message?",
        description: "Send this message to the Customer/Vendor booking issue thread?",
        confirmText: "Send message",
        onConfirm: async () => {
          if (!current() || lock.current) return;
          lock.current = true;
          try {
            await send({ ...scope, body, confirmed: true }).unwrap();
            if (current()) {
              if (form.getValues("message").trim() === body.message) form.reset();
              toast.success("Issue message sent.");
            }
          } catch (e) {
            if (current()) throw e;
          } finally {
            lock.current = false;
          }
        },
      });
    })(event);
  return (
    <section className="space-y-4" aria-label="Issue messages">
      <Button disabled={query.isFetching} onClick={() => void query.refetch()}>
        Refresh messages
      </Button>
      {query.isFetching && <p role="status">Loading issue messages…</p>}
      {query.error && (
        <ErrorState
          error={normalizeApiError(query.error)}
          onRetry={() => void query.refetch()}
        />
      )}
      {thread && (
        <>
          <IssueMessages thread={thread} />
          <IssueDecisions issue={thread.issue} booking={booking} />
        </>
      )}
      <form
        className="space-y-2 border-t border-[#1e2638] pt-4"
        onSubmit={(e) => void submit(e)}
      >
        <label className="block">
          Admin issue message
          <textarea
            {...form.register("message")}
            maxLength={2000}
            rows={3}
            className="mt-2 w-full rounded-xl border border-[#232d42] bg-[#182030] p-3 text-sm"
            disabled={state.isLoading}
          />
        </label>
        {form.formState.errors.message && (
          <p role="alert">{form.formState.errors.message.message}</p>
        )}
        <Button
          type="submit"
          disabled={
            disabled ||
            query.isFetching ||
            !!query.error ||
            thread?.issue.status !== "OPEN" ||
            state.isLoading
          }
        >
          Review and send message
        </Button>
        {thread && thread.issue.status !== "OPEN" && (
          <p>Messages are unavailable for {thread.issue.status} issues.</p>
        )}
        <p className="text-xs">
          After uncertain delivery, refresh and check the thread before retrying.
        </p>
      </form>
      {confirmation.confirmationProps &&
        !disabled &&
        !query.error &&
        thread?.issue.status === "OPEN" && (
          <ConfirmationDialog {...confirmation.confirmationProps} />
        )}
    </section>
  );
}
