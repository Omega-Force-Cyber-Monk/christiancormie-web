import { zodResolver } from "@hookform/resolvers/zod";
import { MapPin, Phone, Send, Truck } from "lucide-react";
import { useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { FormField } from "@/components/forms/FormField";
import { SettingsTextarea } from "@/features/customer/components/settings/SettingsTextarea";
import {
  truckRequestSchema,
  type TruckRequestValues,
} from "@/features/customer/schemas/settings.schema";

export function SettingsRequestForm() {
  const pending = useRef(false);
  const [requests, setRequests] = useState<(TruckRequestValues & { id: string })[]>([]);
  const {
    register,
    reset,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<TruckRequestValues>({
    resolver: zodResolver(truckRequestSchema),
    defaultValues: {
      truckName: "",
      location: "",
      phone: "",
      description: "",
      reason: "",
    },
  });
  return (
    <div className="settings-request">
      <form
        className="space-y-5"
        noValidate
        onSubmit={(event) => {
          event.preventDefault();
          if (pending.current) return;
          pending.current = true;
          void handleSubmit((values) => {
            const request = { ...values, id: crypto.randomUUID() };
            setRequests((current) => [request, ...current]);
            reset();
          })(event).finally(() => {
            pending.current = false;
          });
        }}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="settings-field-with-icon">
            <Truck size={16} aria-hidden="true" />
            <FormField
              {...register("truckName")}
              label="Truck Name *"
              placeholder="e.g., The Taco Truck"
              error={errors.truckName?.message}
              required
            />
          </div>
          <div className="settings-field-with-icon">
            <MapPin size={16} aria-hidden="true" />
            <FormField
              {...register("location")}
              label="Usual Location *"
              placeholder="e.g., Union Square, SF"
              error={errors.location?.message}
              required
            />
          </div>
        </div>
        <div className="settings-field-with-icon">
          <Phone size={16} aria-hidden="true" />
          <FormField
            {...register("phone")}
            label="Phone"
            type="tel"
            placeholder="(555) 123-4567"
            error={errors.phone?.message}
          />
        </div>
        <div className="grid gap-8 pt-3 sm:grid-cols-2">
          <SettingsTextarea
            {...register("description")}
            label="Description (Optional)"
            placeholder="Tell us about their menu, specialties, or what makes them unique..."
          />
          <SettingsTextarea
            {...register("reason")}
            label="Why should we add this truck? (Optional)"
            placeholder="e.g., They have the best tacos in the city, great service, always fresh ingredients..."
          />
        </div>
        <p className="settings-notice">
          Note: Our team will review your request and contact the truck owner. You'll
          earn 100 bonus points if they join BiteDrop!
          <span className="mt-2 block text-xs">
            Design preview only: no request is sent and no points are awarded.
          </span>
        </p>
        <button
          type="submit"
          className="settings-primary w-full"
          disabled={isSubmitting}
        >
          <Send size={20} aria-hidden="true" />
          {isSubmitting ? "Adding locally…" : "Submit Request"}
        </button>
      </form>
      <p role="status" className="mt-3 text-sm text-[#2ED3D1]">
        {requests.length
          ? `${requests[0].truckName} added to ${requests.length} local request preview${requests.length === 1 ? "" : "s"}. Nothing was sent.`
          : ""}
      </p>
    </div>
  );
}
