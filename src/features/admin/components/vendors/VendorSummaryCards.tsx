import { EmptyState } from "@/components/states/EmptyState";

export type VendorSummaryCard = {
  title: string;
  value: string;
  valueColor: string;
};

type VendorSummaryCardsProps = {
  data?: VendorSummaryCard[];
};

export function VendorSummaryCards({ data }: VendorSummaryCardsProps) {
  const cards = data ?? [];

  if (cards.length === 0) {
    return (
      <EmptyState
        description="Vendor metrics are not available yet."
        title="No vendor summary found"
      />
    );
  }

  return (
    <div className="grid w-full grid-cols-1 gap-4 font-sans sm:grid-cols-2 sm:gap-5 lg:grid-cols-4">
      {cards.map((card) => (
        <div
          className="flex flex-col justify-center space-y-2 rounded-2xl border border-[#2e3443] bg-[#171e30] p-5 shadow-xl transition-colors hover:border-[#2b374e] sm:p-6"
          key={card.title}
        >
          <span className="text-xs font-medium text-[#8091a7]">{card.title}</span>
          <h3
            className={`text-2xl font-bold tracking-normal sm:text-3xl ${card.valueColor}`}
          >
            {card.value}
          </h3>
        </div>
      ))}
    </div>
  );
}
