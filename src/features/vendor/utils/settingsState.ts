import {
  vendorStaffFixtures,
  type VendorSampleStaff,
} from "@/features/vendor/data/settings.data";
import { vendorStaffEmailSchema } from "@/features/vendor/schemas/settings.schema";
export interface VendorSettingsState {
  staff: VendorSampleStaff[];
  status: string;
}
export type VendorSettingsAction =
  | { type: "add"; id: string; email: string; addedOn: string }
  | { type: "remove" | "toggle-lock" | "reset-pin"; id: string };
export function initialVendorSettingsState(): VendorSettingsState {
  return { staff: vendorStaffFixtures.map((member) => ({ ...member })), status: "" };
}
export function parseVendorSettingsView(value: string | null) {
  return value === "staff" ? "staff" : "settings";
}
export function vendorSettingsViewQuery(
  current: URLSearchParams,
  view: "staff" | "settings",
) {
  const next = new URLSearchParams(current);
  if (view === "staff") next.set("view", "staff");
  else next.delete("view");
  return next;
}
export function hasStaffEmail(staff: readonly VendorSampleStaff[], email: string) {
  return staff.some(
    (member) => member.email.toLowerCase() === email.trim().toLowerCase(),
  );
}
export function formatStaffDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return "Date unavailable";
  const date = new Date(value + "T00:00:00Z");
  if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value)
    return "Date unavailable";
  return `${value.slice(8, 10)}/${value.slice(5, 7)}/${value.slice(0, 4)}`;
}
function nextSamplePin(staff: readonly VendorSampleStaff[], current = "1000"): string {
  let pin = Number(current);
  do {
    pin = pin >= 9999 ? 1000 : pin + 1;
  } while (staff.some((member) => member.pin === String(pin)));
  return String(pin);
}
export function vendorSettingsReducer(
  state: VendorSettingsState,
  action: VendorSettingsAction,
): VendorSettingsState {
  if (action.type === "add") {
    const result = vendorStaffEmailSchema.safeParse({ email: action.email });
    if (
      !result.success ||
      !action.id ||
      formatStaffDate(action.addedOn) === "Date unavailable" ||
      state.staff.some((member) => member.id === action.id) ||
      hasStaffEmail(state.staff, result.data.email)
    )
      return state;
    return {
      staff: [
        ...state.staff,
        {
          id: action.id,
          email: result.data.email,
          addedOn: action.addedOn,
          pin: nextSamplePin(state.staff),
          locked: true,
        },
      ],
      status: `${result.data.email} added to the local sample list. No invitation was sent.`,
    };
  }
  const selected = state.staff.find((member) => member.id === action.id);
  if (!selected) return state;
  if (action.type === "remove")
    return {
      staff: state.staff.filter((member) => member.id !== action.id),
      status: `${selected.email} removed from the local sample list. Real staff access is unchanged.`,
    };
  if (action.type === "reset-pin")
    return {
      staff: state.staff.map((member) =>
        member.id === action.id
          ? { ...member, pin: nextSamplePin(state.staff, member.pin) }
          : member,
      ),
      status: `Sample PIN reset for ${selected.email}. No real credential was changed.`,
    };
  return {
    staff: state.staff.map((member) =>
      member.id === action.id ? { ...member, locked: !member.locked } : member,
    ),
    status: `Local sample access ${selected.locked ? "unlocked" : "locked"} for ${selected.email}. Real permissions are unchanged.`,
  };
}
