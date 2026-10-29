import { zodResolver } from "@hookform/resolvers/zod";
import { MapPin, Phone, Send, Truck } from "lucide-react";
import { useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { FormField } from "@/components/forms/FormField";
import { useAccount } from "@/features/account/hooks/useAccount";
import { useSubmitTruckLeadMutation } from "@/features/account/api/account.api";
import { leadPayload } from "@/features/account/utils/accountAdapters";
import { normalizeApiError } from "@/utils/errors/normalizeApiError";
import { toast } from "sonner";
import { SettingsTextarea } from "@/features/customer/components/settings/SettingsTextarea";
import {
  truckRequestSchema,
  type TruckRequestValues,
} from "@/features/customer/schemas/settings.schema";

export function SettingsRequestForm() {
  const pending = useRef(false);
  const [status, setStatus] = useState("");
  const account = useAccount();
  const [submit] = useSubmitTruckLeadMutation();
  const {
    register,
    reset,
    handleSubmit,
    setError,
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
          void handleSubmit(async (values) => {
            setStatus("");
            try {
              const request = await submit({
                scope: account.scope,
                body: leadPayload(values),
              }).unwrap();
              if (!account.isCurrent()) return;
              reset();
              setStatus(
                `${request.truckName} request submitted. No bonus points are confirmed by this operation.`,
              );
            } catch (error) {
              if (!account.isCurrent()) return;
              const failure = normalizeApiError(error);
              setError("root", { message: failure.message });
              toast.error(failure.message);
            }
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
          The request is sent to the platform for review. Location, description and
          reason are stored in request notes; no bonus points are confirmed here.
        </p>
        <button
          type="submit"
          className="settings-primary w-full"
          disabled={isSubmitting || !account.allowed}
        >
          <Send size={20} aria-hidden="true" />
          {isSubmitting ? "Submitting…" : "Submit Request"}
        </button>
      </form>
      {errors.root && <p role="alert">{errors.root.message}</p>}
      <p role="status" className="mt-3 text-sm text-[#2ED3D1]">
        {status}
      </p>
    </div>
  );
}
