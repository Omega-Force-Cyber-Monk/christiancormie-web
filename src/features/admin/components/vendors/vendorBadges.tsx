export function getVendorStatusBadge(status: string) {
  switch (status.toLowerCase()) {
    case "active":
    case "approved":
    case "communicated":
      return (
        <span className="rounded-full border border-[#14535e]/60 bg-[#0c2e32] px-2.5 py-0.5 text-[11px] font-semibold text-[#2dd4bf] capitalize">
          {status}
        </span>
      );
    case "pending":
      return (
        <span className="rounded-full border border-[#713f12]/60 bg-[#382b13] px-2.5 py-0.5 text-[11px] font-semibold text-[#eab308] capitalize">
          {status}
        </span>
      );
    case "suspended":
    case "disputed":
    case "declined":
      return (
        <span className="rounded-full border border-[#991b1b]/60 bg-[#381418] px-2.5 py-0.5 text-[11px] font-semibold text-[#f87171] capitalize">
          {status}
        </span>
      );
    default:
      return (
        <span className="rounded-full border border-[#2b374e] px-2.5 py-0.5 text-[11px] font-semibold text-[#94a3b8]">
          {status}
        </span>
      );
  }
}
