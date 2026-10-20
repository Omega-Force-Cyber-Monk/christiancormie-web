import { Building, CircleCheck, Clock, Plus } from "lucide-react";
import { earningsTransactions } from "@/features/vendor/data/earnings.data";
import {
  formatEarningsMoney,
  type PreviewPaymentMethod,
} from "@/features/vendor/utils/earningsState";
export function VendorEarningsOverview({
  methods,
  defaultMethodId,
  onAdd,
  onDefault,
}: {
  methods: PreviewPaymentMethod[];
  defaultMethodId: string;
  onAdd: () => void;
  onDefault: (id: string) => void;
}) {
  return (
    <div className="vendor-earnings-overview">
      <section className="vendor-payment-methods">
        <div className="mb-5 flex items-center justify-between gap-3">
          <h2 className="text-lg font-medium">Payment Methods</h2>
          <button
            type="button"
            className="flex min-h-11 items-center gap-1 text-sm text-[#FF5733]"
            onClick={onAdd}
          >
            <Plus size={16} /> Add
            <span className="sr-only"> sample payment method</span>
          </button>
        </div>
        <ul className="space-y-4">
          {methods.map((method) => (
            <li key={method.id} className="flex items-center gap-3">
              <span className="vendor-bank-icon">
                <Building size={20} />
              </span>
              <div className="min-w-0 flex-1">
                <h3 className="truncate text-base">{method.label}</h3>
                <p className="mt-1 text-xs text-[#B8C1D1]">
                  &bull;&bull;&bull;&bull; {method.lastFour}
                </p>
              </div>
              {method.id === defaultMethodId ? (
                <span className="vendor-method-default">Default</span>
              ) : (
                <button
                  type="button"
                  className="min-h-11 text-xs text-[#FF5733] underline"
                  onClick={() => onDefault(method.id)}
                >
                  Set default locally
                  <span className="sr-only">
                    {" "}
                    for {method.label} ending {method.lastFour}
                  </span>
                </button>
              )}
            </li>
          ))}
        </ul>
      </section>
      <section className="vendor-recent-transactions">
        <h2 className="mb-4 text-lg font-bold">Recent Transactions</h2>
        <ul>
          {earningsTransactions.map((transaction) => (
            <li key={transaction.id} className="vendor-transaction">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-base">{transaction.name}</h3>
                  <span
                    className={`vendor-transaction-status vendor-transaction-status--${transaction.status}`}
                  >
                    {transaction.status === "completed" ? (
                      <CircleCheck size={16} />
                    ) : (
                      <Clock size={16} />
                    )}{" "}
                    {transaction.status}
                  </span>
                </div>
                {transaction.transactionId && (
                  <p className="mt-1 text-xs text-[#B8C1D1]">
                    Transaction ID: {transaction.transactionId}
                  </p>
                )}
                <p className="mt-1 text-xs text-[#B8C1D1]">{transaction.date}</p>
              </div>
              <span
                className={`shrink-0 text-lg text-[#FF5733] ${transaction.status === "processing" ? "font-semibold" : ""}`}
              >
                {formatEarningsMoney(transaction.amountCents)}
              </span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
