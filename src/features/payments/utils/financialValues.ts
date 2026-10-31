export type FinancialAmount = {
  value: string | null;
  currency: string | null;
  unit: "major" | "minor";
};

// Wire Decimal strings are preserved, not converted through Number. JSON numbers
// cannot recover precision already lost by the server. Reject unsafe/unsupported
// inputs rather than coercing null, booleans or arbitrary objects to money.
export function decimalAmount(value: unknown): string | null {
  if (
    typeof value === "number" &&
    (!Number.isFinite(value) || Math.abs(value) > Number.MAX_SAFE_INTEGER)
  )
    return null;
  if (typeof value !== "number" && typeof value !== "string") return null;
  const text = String(value).trim();
  return /^-?\d+(?:\.\d+)?$/.test(text) ? text : null;
}
export function financialAmount(
  value: unknown,
  currency: unknown,
  unit: FinancialAmount["unit"],
): FinancialAmount {
  const parsed = decimalAmount(value);
  return {
    value:
      unit === "minor" && parsed !== null && !/^-?\d+$/.test(parsed) ? null : parsed,
    currency:
      typeof currency === "string" && /^[a-z]{3}$/i.test(currency.trim())
        ? currency.trim().toUpperCase()
        : null,
    unit,
  };
}
export function formatFinancialAmount(amount: FinancialAmount): string {
  if (amount.value === null) return "Not available";
  const [integer, fraction] = amount.value.split(".");
  const negative = integer.startsWith("-");
  const digits = integer.replace(/^-/, "").replace(/^0+(?=\d)/, "");
  const grouped = `${negative ? "-" : ""}${digits.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}${fraction === undefined ? "" : `.${fraction}`}`;
  const currency = amount.currency ?? "Currency unavailable";
  return amount.unit === "minor"
    ? `${currency} ${grouped} minor units`
    : `${currency} ${grouped}`;
}
