import { useState } from "react";
import { useAppSelector } from "@/app/hooks";
import { selectCurrentRole } from "@/features/auth/store/auth.selectors";
import { useVendorContext } from "../../utils/useVendorContext";
import { vendorAccessState } from "../home/VendorAccessState";
import type { SessionScope } from "@/services/api/sessionGuard";
import {
  useGetVendorFinancialSummaryQuery,
  useGetVendorTransactionsQuery,
  useGetVendorTransactionQuery,
  useGetVendorRefundHistoryQuery,
  useGetVendorPayoutHistoryQuery,
} from "@/features/payments/api/vendorFinancial.api";
import {
  financialFiltersSchema,
  paymentStateSchema,
  type FinancialFilters,
  type VendorTransaction,
} from "@/features/payments/schemas/vendorFinancial.schema";
import {
  financialAmount,
  formatFinancialAmount,
} from "@/features/payments/utils/financialValues";
import { paymentStatusLabel } from "@/features/payments/utils/paymentStatus";
import { ErrorState } from "@/components/states/ErrorState";
import { EmptyState } from "@/components/states/EmptyState";
import { AppLoader } from "@/components/ui/AppLoader";
import { normalizeApiError } from "@/utils/errors/normalizeApiError";
const money = (v: string, currency: string | null) =>
  formatFinancialAmount(financialAmount(v, currency, "major"));
export function VendorFinancialPanel() {
  const context = useVendorContext();
  const auth = useAppSelector((s) => s.auth);
  const role = useAppSelector(selectCurrentRole);
  const access = vendorAccessState(context);
  if (access) return access;
  const scope = {
    sessionId: auth.sessionId ?? "",
    userId: auth.user?.id ?? "",
    role: role ?? "",
  };
  return (
    <FinancialWorkspace
      key={`${scope.sessionId}:${scope.userId}:${scope.role}:${context.vendor?.id}`}
      scope={scope}
    />
  );
}
function FinancialWorkspace({ scope }: { scope: SessionScope }) {
  const [mode, setMode] = useState<"transactions" | "refunds" | "payouts">(
    "transactions",
  );
  const [filters, setFilters] = useState<FinancialFilters>({ page: 1, limit: 20 });
  const [status, setStatus] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [error, setError] = useState("");
  const [selected, select] = useState<string | null>(null);
  const summary = useGetVendorFinancialSummaryQuery(scope);
  const transactions = useGetVendorTransactionsQuery(
    { ...scope, filters },
    { skip: mode !== "transactions" },
  );
  const refunds = useGetVendorRefundHistoryQuery(
    { ...scope, filters },
    { skip: mode !== "refunds" },
  );
  const payouts = useGetVendorPayoutHistoryQuery(scope, { skip: mode !== "payouts" });
  const query =
    mode === "transactions" ? transactions : mode === "refunds" ? refunds : payouts;
  const meta =
    mode === "transactions"
      ? transactions.currentData?.meta
      : mode === "refunds"
        ? refunds.currentData?.meta
        : undefined;
  return (
    <div className="space-y-5" aria-label="Vendor financial records">
      <section className="space-y-3">
        <h2 className="text-lg font-bold">Payment activity summary</h2>
        <button
          type="button"
          className="vendor-earnings-secondary"
          disabled={summary.isFetching}
          onClick={() => void summary.refetch()}
        >
          Refresh summary
        </button>
        {summary.isFetching && (
          <AppLoader variant="compact" label="Loading financial summary" />
        )}
        {summary.error ? (
          <ErrorState
            error={normalizeApiError(summary.error)}
            onRetry={() => void summary.refetch()}
          />
        ) : (
          summary.currentData && <FinancialSummary summary={summary.currentData} />
        )}
      </section>
      <div className="flex flex-wrap gap-3" aria-label="Financial history">
        {(["transactions", "refunds", "payouts"] as const).map((m) => (
          <button
            type="button"
            className="vendor-earnings-secondary"
            aria-pressed={m === mode}
            key={m}
            onClick={() => {
              setMode(m);
              select(null);
              setFilters({ page: 1, limit: 20 });
              setStatus("");
              setFrom("");
              setTo("");
              setError("");
            }}
          >
            {m}
          </button>
        ))}
      </div>
      {mode !== "payouts" && (
        <form
          className="flex flex-wrap gap-3"
          onSubmit={(e) => {
            e.preventDefault();
            const r = financialFiltersSchema.safeParse({
              page: 1,
              limit: filters.limit,
              ...(status ? { status } : {}),
              ...(from.trim() ? { from: from.trim() } : {}),
              ...(to.trim() ? { to: to.trim() } : {}),
            });
            if (!r.success) {
              setError("Use valid ISO dates with timezone, ordered From to To.");
              return;
            }
            setError("");
            select(null);
            setFilters(r.data);
          }}
        >
          <label className="grid gap-1 text-sm">
            Status
            <select
              className="request-input"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              <option value="">All statuses</option>
              {paymentStateSchema.options.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-1 text-sm">
            From (ISO with timezone)
            <input
              className="request-input"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
            />
          </label>
          <label className="grid gap-1 text-sm">
            To (ISO with timezone)
            <input
              className="request-input"
              value={to}
              onChange={(e) => setTo(e.target.value)}
            />
          </label>
          <label className="grid gap-1 text-sm">
            Page size
            <select
              className="request-input"
              value={filters.limit}
              onChange={(e) => {
                select(null);
                setFilters({ ...filters, page: 1, limit: Number(e.target.value) });
              }}
            >
              {[10, 20, 50, 100].map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </label>
          <button type="submit" className="vendor-earnings-secondary">
            Apply filters
          </button>
          {error && <p role="alert">{error}</p>}
        </form>
      )}
      {mode !== "payouts" && (
        <p className="text-xs">
          Dates filter transaction creation time or refund processing time.
        </p>
      )}
      {mode === "payouts" && (
        <p className="text-xs">
          All server payout records, newest first. Filtering and pagination are
          unavailable.
        </p>
      )}
      <button
        type="button"
        className="vendor-earnings-secondary"
        disabled={query.isFetching}
        onClick={() => void query.refetch()}
      >
        Refresh history
      </button>
      {query.isFetching && (
        <AppLoader
          variant="compact"
          label={
            query.currentData
              ? "Refreshing financial history"
              : "Loading financial history"
          }
        />
      )}
      {query.error ? (
        <ErrorState
          error={normalizeApiError(query.error)}
          onRetry={() => void query.refetch()}
        />
      ) : (
        <>
          {mode === "transactions" &&
            transactions.currentData &&
            (transactions.currentData.items.length ? (
              <ul>
                {transactions.currentData.items.map((t) => (
                  <li className="vendor-transaction flex-wrap" key={t.paymentId}>
                    <div className="min-w-0 break-words">
                      <p>{t.eventName ?? t.bookingNumber ?? t.bookingId}</p>
                      <p>{paymentStatusLabel(t.paymentStatus)}</p>
                      <p>{t.createdAt}</p>
                      <button
                        className="underline"
                        type="button"
                        onClick={() => select(t.paymentId)}
                      >
                        View transaction {t.paymentId}
                      </button>
                    </div>
                    <p>{money(t.grossAmount, t.currency)}</p>
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState title="No transactions" />
            ))}
          {mode === "refunds" &&
            refunds.currentData &&
            (refunds.currentData.items.length ? (
              <ul>
                {refunds.currentData.items.map((r) => (
                  <li className="vendor-transaction flex-wrap" key={r.id}>
                    <div className="min-w-0 break-words">
                      <p>Refund {r.id}</p>
                      <p>
                        Payment: {r.paymentId} · Booking: {r.bookingNumber}
                      </p>
                      <p>Refund status: {r.status}</p>
                      <p>Payment status: {r.paymentStatus}</p>
                      <p>{r.reason}</p>
                      <p>Processed: {r.processedAt ?? "Not reported"}</p>
                    </div>
                    <p>{money(r.amount, r.currency)}</p>
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState title="No refunds" />
            ))}
          {mode === "payouts" &&
            payouts.currentData &&
            (payouts.currentData.length ? (
              <ul>
                {payouts.currentData.map((p) => (
                  <li className="vendor-transaction flex-wrap" key={p.id}>
                    <div className="min-w-0 break-words">
                      <p>Payout {p.id}</p>
                      <p>Status: {p.status}</p>
                      <p>Booking: {p.bookingId ?? "Not linked"}</p>
                      <p>Payment: {p.paymentId ?? "Not linked"}</p>
                      <p>Created: {p.createdAt}</p>
                      <p>Paid: {p.paidAt ?? "Not reported"}</p>
                    </div>
                    <p>{money(p.amount, p.currency)}</p>
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState title="No payouts" />
            ))}
        </>
      )}
      {meta && !query.error && (
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            className="vendor-earnings-secondary"
            disabled={query.isFetching || filters.page <= 1}
            onClick={() => setFilters({ ...filters, page: filters.page - 1 })}
          >
            Previous
          </button>
          <span>
            Page {meta.page} · {meta.total} records
          </span>
          <button
            type="button"
            className="vendor-earnings-secondary"
            disabled={query.isFetching || filters.page >= meta.totalPages}
            onClick={() => setFilters({ ...filters, page: filters.page + 1 })}
          >
            Next
          </button>
        </div>
      )}
      {mode === "transactions" && selected && (
        <TransactionDetail
          key={selected}
          scope={scope}
          paymentId={selected}
          onClose={() => select(null)}
        />
      )}
    </div>
  );
}
export function FinancialSummary({
  summary: s,
}: {
  summary: {
    totalPayments: number;
    succeededPayments: number;
    failedPayments: number;
    processingPayments: number;
    refundedPayments: number;
  };
}) {
  return (
    <div className="space-y-2">
      <p>Total payment records: {s.totalPayments}</p>
      <p>
        Succeeded: {s.succeededPayments} · Pending/processing: {s.processingPayments} ·
        Failed: {s.failedPayments} · Refunded/partially refunded: {s.refundedPayments}
      </p>
      <p className="text-xs text-[#B8C1D1]">
        Monetary summary unavailable: backend totals span payment statuses and do not
        establish a single currency. These counts are not settled earnings.
      </p>
    </div>
  );
}
function TransactionDetail({
  scope,
  paymentId,
  onClose,
}: {
  scope: SessionScope;
  paymentId: string;
  onClose: () => void;
}) {
  const q = useGetVendorTransactionQuery({ ...scope, paymentId });
  return (
    <section
      className="space-y-3 rounded-lg border border-[var(--border)] p-4"
      aria-label="Selected transaction"
    >
      <button type="button" className="vendor-earnings-secondary" onClick={onClose}>
        Close detail
      </button>
      <button
        type="button"
        className="vendor-earnings-secondary"
        disabled={q.isFetching}
        onClick={() => void q.refetch()}
      >
        Refresh detail
      </button>
      {q.isFetching && (
        <AppLoader variant="compact" label="Loading transaction detail" />
      )}
      {q.error ? (
        <ErrorState
          error={normalizeApiError(q.error)}
          onRetry={() => void q.refetch()}
        />
      ) : (
        q.currentData && <VendorTransactionDetails transaction={q.currentData} />
      )}
    </section>
  );
}
export function VendorTransactionDetails({
  transaction: t,
}: {
  transaction: VendorTransaction;
}) {
  return (
    <div className="space-y-2 break-words">
      <h3 className="font-semibold">Payment {t.paymentId}</h3>
      <p>Booking: {t.bookingNumber ?? t.bookingId}</p>
      <p>{t.eventName}</p>
      <p>
        {t.customer?.name ?? "Customer name unavailable"} ·{" "}
        {t.foodTruck?.name ?? "Truck name unavailable"}
      </p>
      <p>{paymentStatusLabel(t.paymentStatus)}</p>
      <p>Reported gross: {money(t.grossAmount, t.currency)}</p>
      <p>Reported commission: {money(t.commissionAmount, t.currency)}</p>
      <p>Reported net: {money(t.vendorNetAmount, t.currency)}</p>
      <p className="text-xs">
        The backend substitutes zero commission and gross as net when commission data is
        absent. Reported values are not proof of settlement or payout.
      </p>
      <p>Created: {t.createdAt}</p>
      <p>Paid: {t.paidAt ?? "Not reported"}</p>
      {t.payout ? (
        <p>
          Payout {t.payout.id}: {t.payout.status} · {money(t.payout.amount, null)} ·
          Paid: {t.payout.paidAt ?? "Not reported"}
        </p>
      ) : (
        <p>No payout record.</p>
      )}
      {t.refunds.length ? (
        t.refunds.map((r) => (
          <p key={r.id}>
            Refund {r.id}: {r.status} · {money(r.amount, t.currency)} ·{" "}
            {r.processedAt ?? "Processing date not reported"}
          </p>
        ))
      ) : (
        <p>No refund records.</p>
      )}
    </div>
  );
}
