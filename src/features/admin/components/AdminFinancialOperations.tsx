import { z } from "zod";
import type { AdminPayoutDto } from "../types/admin.dto";
import { financialBlocker, payoutState } from "../utils/adminFinancialSafety";
import {
  financialAmount,
  formatFinancialAmount,
} from "@/features/payments/utils/financialValues";
import { Button } from "@/components/ui/Button";
export function AdminFinancialOperations({ payouts }: { payouts: AdminPayoutDto[] }) {
  return (
    <section
      aria-label="Financial operation eligibility"
      className="space-y-3 rounded-lg border border-[var(--border)] p-4 text-sm"
    >
      <h3 className="font-semibold">Payout operation readiness</h3>
      <p>{financialBlocker}</p>
      <p>
        Approve and Retry both retry FAILED payouts; pending payouts cannot be approved
        through these endpoints. Provider transfer status and booking/payment links are
        not returned here.
      </p>
      {payouts.map((p, index) => {
        const state = payoutState(p);
        const valid =
          z.uuid().safeParse(p.id).success && z.uuid().safeParse(p.vendorId).success;
        return (
          <article
            key={`${p.id}:${index}`}
            className="space-y-1 break-words rounded-lg border border-[var(--border)] p-3"
          >
            <p>Payout ID: {valid ? p.id : "Invalid payout identity"}</p>
            <p>Vendor ID: {valid ? p.vendorId : "Unavailable"}</p>
            <p>
              Amount:{" "}
              {formatFinancialAmount(financialAmount(p.amount, p.currency, "major"))}
            </p>
            <p>
              Status: {state.status}; backend label: {p.status}
            </p>
            <p>Paid at: {p.paidAt ?? "Not supplied"}</p>
            <p>Failure: {p.failureReason ?? "None returned"}</p>
            <p>{state.reason}</p>
            <Button disabled>Retry payout unavailable</Button>
          </article>
        );
      })}
    </section>
  );
}
