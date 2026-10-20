import { z } from "zod";
export const paymentMethodPreviewSchema = z.object({
  label: z.string().trim().min(1, "Enter a display label."),
  lastFour: z
    .string()
    .trim()
    .regex(/^\d{4}$/, "Enter exactly four sample digits."),
});
export type PaymentMethodPreviewValues = z.infer<typeof paymentMethodPreviewSchema>;
export type PreviewPaymentMethod = PaymentMethodPreviewValues & { id: string };
export type VendorEarningsState = {
  acceptingCredits: boolean;
  creditsOpen: boolean;
  methods: PreviewPaymentMethod[];
  defaultMethodId: string;
  addOpen: boolean;
  status: string;
};
export const initialVendorEarningsState = (): VendorEarningsState => ({
  acceptingCredits: true,
  creditsOpen: false,
  methods: [{ id: "sample-bank", label: "Bank Account", lastFour: "4532" }],
  defaultMethodId: "sample-bank",
  addOpen: false,
  status: "",
});
export type EarningsAction =
  | { type: "credits-open"; open: boolean }
  | { type: "toggle-credits" }
  | { type: "add-open"; open: boolean }
  | { type: "add-method"; id: string; values: PaymentMethodPreviewValues }
  | { type: "default-method"; id: string };
export function vendorEarningsReducer(
  state: VendorEarningsState,
  action: EarningsAction,
): VendorEarningsState {
  switch (action.type) {
    case "credits-open":
      return { ...state, creditsOpen: action.open };
    case "toggle-credits":
      return {
        ...state,
        acceptingCredits: !state.acceptingCredits,
        status: `Credit acceptance turned ${state.acceptingCredits ? "off" : "on"} in this local preview only.`,
      };
    case "add-open":
      return { ...state, addOpen: action.open };
    case "add-method": {
      const result = paymentMethodPreviewSchema.safeParse(action.values);
      if (
        !result.success ||
        !action.id ||
        state.methods.some((m) => m.id === action.id)
      )
        return state;
      return {
        ...state,
        methods: [...state.methods, { id: action.id, ...result.data }],
        addOpen: false,
        status: "Sample payment method added locally. No bank account was linked.",
      };
    }
    case "default-method":
      return state.methods.some((m) => m.id === action.id)
        ? {
            ...state,
            defaultMethodId: action.id,
            status: "Default method changed in this preview only.",
          }
        : state;
  }
}
export function formatEarningsMoney(
  cents: number | null | undefined,
  decimals = false,
): string {
  if (typeof cents !== "number" || !Number.isFinite(cents)) return "Not available";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: decimals ? 2 : 0,
    maximumFractionDigits: 2,
  }).format(cents / 100);
}
export type EarningsTab = "earnings" | "analytics";
export const parseEarningsTab = (value: string | null): EarningsTab =>
  value === "analytics" ? "analytics" : "earnings";
