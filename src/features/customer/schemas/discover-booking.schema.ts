import { z } from "zod";
import { eventTypes } from "@/features/customer/data/discover-booking.data";

const dateSchema = z.string().refine((value) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00Z`);
  return (
    Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value
  );
}, "Choose a valid event date.");

export const bookingSchema = z.object({
  eventType: z
    .string()
    .refine(
      (value) => eventTypes.some((event) => event.name === value),
      "Choose an event type.",
    ),
  date: dateSchema,
  time: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Choose an event time."),
  location: z.string().trim().min(1, "Enter the event location.").max(300),
  contact: z
    .string()
    .trim()
    .refine(
      (value) =>
        /^[+\d\s().-]+$/.test(value) &&
        value.replace(/\D/g, "").length >= 7 &&
        value.replace(/\D/g, "").length <= 15,
      "Enter a valid contact number.",
    ),
  guests: z
    .string()
    .regex(/^[1-9]\d*$/, "Enter a positive whole guest count.")
    .refine(
      (value) => Number.isSafeInteger(Number(value)),
      "Enter a valid guest count.",
    ),
  budget: z.string().trim().max(100, "Keep the budget under 100 characters."),
  description: z.string().trim().min(1, "Describe your event.").max(2000),
  menus: z
    .array(z.string().trim().min(1).max(80))
    .min(1, "Select at least one preferred menu item."),
  payment: z.enum(["deposit", "full", "none"]),
  additional: z.string().trim().max(2000),
  adult: z.boolean().refine(Boolean, "Confirm that you are 18 years of age or older."),
  terms: z
    .boolean()
    .refine(Boolean, "Acknowledge the preview terms before continuing."),
});

export type BookingValues = z.infer<typeof bookingSchema>;
export type BookingStep = 1 | 2 | 3 | 4 | 5;
export const bookingStepFields: Record<BookingStep, (keyof BookingValues)[]> = {
  1: ["eventType"],
  2: ["date", "time", "location", "contact", "guests", "budget", "description"],
  3: ["menus"],
  4: ["payment", "budget"],
  5: ["additional", "adult", "terms"],
};

export const emptyBooking: BookingValues = {
  eventType: "",
  date: "",
  time: "",
  location: "",
  contact: "",
  guests: "",
  budget: "",
  description: "",
  menus: [],
  payment: "deposit",
  additional: "",
  adult: false,
  terms: false,
};

export function isBookingStepValid(step: BookingStep, draft: BookingValues) {
  return bookingStepFields[step].every(
    (key) => bookingSchema.shape[key].safeParse(draft[key]).success,
  );
}

export type BookingState = {
  step: BookingStep;
  draft: BookingValues;
  complete: boolean;
};
export const initialBookingState: BookingState = {
  step: 1,
  draft: emptyBooking,
  complete: false,
};
type BookingAction =
  { type: "next" | "back"; draft: BookingValues } | { type: "reset" };

export function bookingReducer(
  state: BookingState,
  action: BookingAction,
): BookingState {
  if (action.type === "reset") return initialBookingState;
  if (state.complete) return state;
  const draft = action.draft;
  if (action.type === "back")
    return {
      ...state,
      draft,
      step: state.step === 1 ? 1 : ((state.step - 1) as BookingStep),
    };
  if (!isBookingStepValid(state.step, draft)) return { ...state, draft };
  if (state.step === 5)
    return { ...state, draft, complete: bookingSchema.safeParse(draft).success };
  return { ...state, draft, step: (state.step + 1) as BookingStep };
}
