import type { ReactNode } from "react";

import { EmptyState } from "@/components/states/EmptyState";

type BookingSummaryCard = {
  title: string;
  amount: string;
  icon?: ReactNode;
};

type BookingSummaryCardsProps = {
  data?: BookingSummaryCard[];
};

export function BookingSummaryCards({ data }: BookingSummaryCardsProps) {
  const cards = data ?? [];

  if (cards.length === 0) {
    return (
      <EmptyState
        description="Booking metrics are not available yet."
        title="No booking summary found"
      />
    );
  }

  return (
    <div className="grid w-full grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
      {cards.map((card) => (
        <div
          className="flex h-32 flex-col justify-between rounded-2xl border border-[#2e3443] bg-[#171e30] p-6 transition hover:border-orange-500/30"
          key={card.title}
        >
          <div className="text-sm font-medium text-[#94a3b8]">{card.title}</div>
          <div className="mt-3 flex items-end justify-between">
            <div className="text-2xl leading-none font-semibold text-white">
              {card.amount}
            </div>
            {card.icon ? (
              <div className="rounded-lg border border-orange-500/20 bg-orange-500/10 p-2">
                {card.icon}
              </div>
            ) : null}
          </div>
        </div>
      ))}
    </div>
  );
}
