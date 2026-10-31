import { useEffect, useId, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useStore } from "react-redux";
import { toast } from "sonner";
import type { RootState, AppDispatch } from "@/app/store";
import { Button } from "@/components/ui/Button";
import { AppLoader } from "@/components/ui/AppLoader";
import { ErrorState } from "@/components/states/ErrorState";
import { EmptyState } from "@/components/states/EmptyState";
import { FormError } from "@/components/forms/FormError";
import { ConfirmationDialog } from "@/components/overlays/ConfirmationDialog/ConfirmationDialog";
import { useConfirmation } from "@/components/overlays/ConfirmationDialog/useConfirmation";
import { scopeMatches } from "@/services/api/sessionGuard";
import { normalizeApiError } from "@/utils/errors/normalizeApiError";
import {
  bookingIssuesApi,
  useGetBookingIssuesQuery,
  useGetBookingIssueMessagesQuery,
  type IssueSelection,
} from "../../api/bookingIssues.api";
import type { BookingSelection } from "../../api/bookings.api";
import type { CustomerBookingDetail } from "../../schemas/booking.schema";
import {
  canCreateBookingIssue,
  issueMessageInputSchema,
  type BookingIssues,
  type BookingIssueThread,
} from "../../schemas/bookingIssues.schema";

export function CustomerBookingIssues({
  scope,
  booking,
  disabled,
}: {
  scope: BookingSelection;
  booking: CustomerBookingDetail;
  disabled: boolean;
}) {
  const query = useGetBookingIssuesQuery(scope);
  const [selected, select] = useState<string | null>(null);
  const issues = query.error ? undefined : query.currentData;
  return (
    <section aria-label="Booking issues" className="space-y-4">
      <h3 className="text-lg font-semibold">Issues for {booking.bookingNumber}</h3>
      <p className="break-words text-sm">Booking ID: {booking.id}</p>
      <Button disabled={query.isFetching} onClick={() => void query.refetch()}>
        Refresh issues
      </Button>
      {query.isFetching && (
        <AppLoader variant="compact" label="Loading booking issues" />
      )}
      {query.error && (
        <ErrorState
          error={normalizeApiError(query.error)}
          onRetry={() => void query.refetch()}
        />
      )}
      {issues && (
        <BookingIssueHistory issues={issues} onSelect={select} selected={selected} />
      )}
      <IssueEditor
        key="create-issue"
        scope={scope}
        disabled={
          disabled ||
          query.isFetching ||
          !issues ||
          !canCreateBookingIssue(booking, issues)
        }
      />
      <p className="text-sm text-[var(--text-muted)]">
        An issue can be reported after a completion request, before completion, while no
        other issue is open. Approval and payout release are unavailable here.
      </p>
      {selected && (
        <IssueMessages
          key={selected}
          scope={{ ...scope, issueId: selected }}
          disabled={
            disabled ||
            query.isFetching ||
            !issues?.items.some((i) => i.id === selected)
          }
        />
      )}
    </section>
  );
}
export function BookingIssueHistory({
  issues,
  selected,
  onSelect,
}: {
  issues: BookingIssues;
  selected: string | null;
  onSelect: (id: string) => void;
}) {
  if (!issues.items.length) return <EmptyState title="No booking issues" />;
  return (
    <ul className="space-y-3">
      {issues.items.map((i) => (
        <li
          key={i.id}
          className="rounded-lg border border-[var(--border)] p-3 break-words"
        >
          <p>Issue ID: {i.id}</p>
          <p>Status: {i.status}</p>
          <p className="whitespace-pre-wrap">{i.message}</p>
          <p>
            Reported: <time dateTime={i.createdAt}>{i.createdAt}</time>
          </p>
          {i.resolvedAt && (
            <p>
              Resolved: <time dateTime={i.resolvedAt}>{i.resolvedAt}</time>
            </p>
          )}
          {i.resolutionDecision && <p>Resolution decision: {i.resolutionDecision}</p>}
          {i.resolutionNote && <p>{i.resolutionNote}</p>}
          <Button
            className="mt-2"
            aria-pressed={selected === i.id}
            onClick={() => onSelect(i.id)}
          >
            View issue messages
          </Button>
        </li>
      ))}
    </ul>
  );
}
function IssueMessages({
  scope,
  disabled,
}: {
  scope: IssueSelection;
  disabled: boolean;
}) {
  const query = useGetBookingIssueMessagesQuery(scope, { skip: disabled });
  const thread = query.error || disabled ? undefined : query.currentData;
  return (
    <section aria-label="Selected issue messages" className="space-y-3">
      <h4 className="font-semibold">Messages for issue {scope.issueId}</h4>
      <Button
        disabled={disabled || query.isFetching}
        onClick={() => void query.refetch()}
      >
        Refresh messages
      </Button>
      {query.isFetching && (
        <AppLoader variant="compact" label="Loading issue messages" />
      )}
      {query.error && (
        <ErrorState
          error={normalizeApiError(query.error)}
          onRetry={disabled ? undefined : () => void query.refetch()}
        />
      )}
      {thread && <BookingIssueMessages thread={thread} />}
      <IssueEditor
        scope={scope}
        issueId={scope.issueId}
        disabled={
          disabled || query.isFetching || !thread || thread.issue.status !== "OPEN"
        }
      />
    </section>
  );
}
export function BookingIssueMessages({ thread }: { thread: BookingIssueThread }) {
  return (
    <div className="space-y-3">
      <p>Issue status: {thread.issue.status}</p>
      {!thread.messages.length ? (
        <EmptyState title="No issue messages" />
      ) : (
        <ol className="space-y-3">
          {thread.messages.map((m) => (
            <li
              key={m.id}
              className="rounded-lg border border-[var(--border)] p-3 break-words"
            >
              <p className="font-semibold">
                {m.senderName} · {m.senderRole}
              </p>
              <p className="whitespace-pre-wrap">{m.message}</p>
              <time className="text-sm" dateTime={m.createdAt}>
                {m.createdAt}
              </time>
            </li>
          ))}
        </ol>
      )}
      {thread.issue.status !== "OPEN" && (
        <p>This issue is closed; messaging is unavailable.</p>
      )}
    </div>
  );
}
function IssueEditor({
  scope,
  issueId,
  disabled,
}: {
  scope: BookingSelection;
  issueId?: string;
  disabled: boolean;
}) {
  const id = useId();
  const form = useForm({
    resolver: zodResolver(issueMessageInputSchema),
    defaultValues: { message: "" },
  });
  const store = useStore<RootState>();
  const dispatch = store.dispatch as AppDispatch;
  const confirmation = useConfirmation();
  const busy = useRef(false);
  const mounted = useRef(true);
  const [pending, setPending] = useState(false);
  const [failure, setFailure] = useState<unknown>(null);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);
  async function write(body: { message: string }) {
    if (busy.current || !mounted.current || !scopeMatches(store.getState(), scope))
      return;
    busy.current = true;
    setPending(true);
    setFailure(null);
    const request = issueId
      ? dispatch(
          bookingIssuesApi.endpoints.sendBookingIssueMessage.initiate({
            ...scope,
            issueId,
            body,
          }),
        )
      : dispatch(
          bookingIssuesApi.endpoints.createBookingIssue.initiate({
            ...scope,
            body,
            confirmed: true,
          }),
        );
    try {
      const response = await request.unwrap();
      if (response && mounted.current && scopeMatches(store.getState(), scope)) {
        form.reset({ message: "" });
        toast.success(issueId ? "Issue message sent." : "Booking issue reported.");
      }
    } catch (error) {
      if (mounted.current && scopeMatches(store.getState(), scope)) setFailure(error);
      throw error;
    } finally {
      request.reset();
      busy.current = false;
      if (mounted.current) setPending(false);
    }
  }
  return (
    <>
      <form
        className="space-y-3"
        noValidate
        onSubmit={(event) => {
          event.preventDefault();
          if (disabled || busy.current) return;
          void form.handleSubmit(async (body) => {
            if (issueId) {
              try {
                await write(body);
              } catch {
                /* Inline error retains draft. */
              }
            } else
              confirmation.confirm({
                title: "Report this booking issue?",
                description: `Report an issue for booking ${scope.bookingId}? An open issue can block completion and vendor payout.`,
                confirmText: "Report issue",
                onConfirm: () => write(body),
              });
          })(event);
        }}
      >
        <label className="block font-medium" htmlFor={id}>
          {issueId ? "Message" : "Describe the booking issue"}
        </label>
        <textarea
          {...form.register("message")}
          id={id}
          maxLength={2000}
          disabled={pending}
          className="min-h-28 w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] p-3"
          aria-invalid={!!form.formState.errors.message}
          aria-describedby={`${id}-error`}
        />
        <FormError
          id={`${id}-error`}
          message={form.formState.errors.message?.message}
        />
        {failure != null && <ErrorState error={normalizeApiError(failure)} />}
        <Button
          type="submit"
          disabled={disabled || pending || form.formState.isSubmitting}
        >
          {pending ? "Sending…" : issueId ? "Send issue message" : "Report issue"}
        </Button>
      </form>
      {confirmation.confirmationProps && (
        <ConfirmationDialog {...confirmation.confirmationProps} />
      )}
    </>
  );
}
