import type { CustomDropDuration } from "@/features/vendor/schemas/drops.schema";

export type DropDuration =
  | { kind: "preset"; hours: 1 | 2 | 4 }
  | { kind: "all-day" }
  | { kind: "custom"; value: CustomDropDuration };
export type DropPromo = {
  id: string;
  name: string;
  message: string;
  enabled: boolean;
  duration: CustomDropDuration | null;
};
export const sampleDropLocation = "4th & Mission St, San Francisco";
export const sampleDropPromos: readonly DropPromo[] = [
  {
    id: "lunch-special",
    name: "Lunch Special",
    message: "20% off all orders before 2PM",
    enabled: true,
    duration: null,
  },
  {
    id: "snacks",
    name: "Snacks",
    message: "20% off on all snacks before 1 pm",
    enabled: false,
    duration: null,
  },
];
export const formatCustomDropDuration = ({ hours, minutes }: CustomDropDuration) =>
  `${hours}h${minutes ? ` ${minutes}m` : ""}`;
export function formatDropDuration(duration: DropDuration) {
  if (duration.kind === "all-day") return "All day";
  if (duration.kind === "custom") return formatCustomDropDuration(duration.value);
  return `${duration.hours} ${duration.hours === 1 ? "hour" : "hours"}`;
}
