import { zodResolver } from "@hookform/resolvers/zod";
import { useRef } from "react";
import { useForm } from "react-hook-form";
import { FormField } from "@/components/forms/FormField";
import { SettingsTextarea } from "@/features/customer/components/settings/SettingsTextarea";
import {
  settingsIssueSchema,
  type SettingsIssueValues,
} from "@/features/customer/schemas/settings.schema";

export function SettingsIssueForm({
  onSubmit,
}: {
  onSubmit: (values: SettingsIssueValues) => void;
}) {
  const pending = useRef(false);
  const {
    register,
    reset,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SettingsIssueValues>({
    resolver: zodResolver(settingsIssueSchema),
    defaultValues: { subject: "", message: "" },
  });
  return (
    <form
      className="settings-issue space-y-4"
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        if (pending.current) return;
        pending.current = true;
        void handleSubmit((values) => {
          onSubmit(values);
          reset();
        })(event).finally(() => {
          pending.current = false;
        });
      }}
    >
      <FormField
        {...register("subject")}
        label="SUBJECT"
        placeholder="e.g., Payment issue, booking or others"
        error={errors.subject?.message}
      />
      <SettingsTextarea
        {...register("message")}
        label="MESSAGE"
        placeholder="Describe your issue in detail..."
        rows={6}
        error={errors.message?.message}
      />
      <p className="settings-notice">
        <strong>Response Time:</strong> Our support team typically responds within 24
        hours. For urgent issues, please call us at +1 (800) 123-4567.
        <span className="mt-2 block text-xs">
          Sample contact details from the design. Tickets created here stay in this
          local preview.
        </span>
      </p>
      <button type="submit" className="settings-primary w-full" disabled={isSubmitting}>
        {isSubmitting ? "Adding locally…" : "Submit a Ticket"}
      </button>
    </form>
  );
}
