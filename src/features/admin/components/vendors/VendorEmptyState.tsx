type VendorEmptyStateProps = {
  title: string;
  message: string;
};

export function VendorEmptyState({ message, title }: VendorEmptyStateProps) {
  return (
    <div className="rounded-2xl border border-[#2e3443] bg-[#171e30] px-6 py-10 text-center">
      <h3 className="text-base font-semibold text-white">{title}</h3>
      <p className="mt-2 text-sm text-[#8091a7]">{message}</p>
    </div>
  );
}
