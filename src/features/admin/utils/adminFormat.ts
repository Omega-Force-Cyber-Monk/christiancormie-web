export const formatNumber = (value: number | null | undefined) =>
  Number(value ?? 0).toLocaleString();

export const formatCurrency = (value: number | null | undefined) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value ?? 0);

export const formatPercentChange = (value: number | null | undefined) => {
  if (value === null || value === undefined) return undefined;

  return `${value >= 0 ? "+" : ""}${value}%`;
};

export const formatDate = (value: string | null | undefined) => {
  if (!value) return "N/A";

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
};

export const formatRelativeTime = (value: string | null | undefined) => {
  if (!value) return "N/A";

  const diffMs = Date.now() - new Date(value).getTime();
  const diffMinutes = Math.max(1, Math.round(diffMs / 60000));

  if (diffMinutes < 60) return `${diffMinutes}m ago`;

  const diffHours = Math.round(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h ago`;

  return `${Math.round(diffHours / 24)}d ago`;
};

export const getInitials = (name: string) =>
  name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
