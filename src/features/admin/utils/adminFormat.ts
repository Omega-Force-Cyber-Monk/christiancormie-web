const isFiniteNumber = (value: number | null | undefined): value is number =>
  typeof value === "number" && Number.isFinite(value);

export const formatNumber = (value: number | null | undefined) =>
  isFiniteNumber(value) ? value.toLocaleString() : "N/A";

export const formatCurrency = (value: number | null | undefined) =>
  isFiniteNumber(value)
    ? new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(value)
    : "N/A";

export const formatPercentChange = (value: number | null | undefined) => {
  if (!isFiniteNumber(value)) return undefined;

  return `${value >= 0 ? "+" : ""}${value}%`;
};

export const formatDate = (value: string | null | undefined) => {
  if (!value) return "N/A";

  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return "N/A";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
};

export const formatRelativeTime = (value: string | null | undefined) => {
  if (!value) return "N/A";

  const timestamp = new Date(value).getTime();
  if (!Number.isFinite(timestamp)) return "N/A";
  const diffMs = Date.now() - timestamp;
  const diffMinutes = Math.max(1, Math.round(diffMs / 60000));

  if (diffMinutes < 60) return `${diffMinutes}m ago`;

  const diffHours = Math.round(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h ago`;

  return `${Math.round(diffHours / 24)}d ago`;
};

export const getInitials = (name: string | null | undefined) =>
  (name ?? "")
    .trim()
    .split(/\s+/)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase() || "?";
