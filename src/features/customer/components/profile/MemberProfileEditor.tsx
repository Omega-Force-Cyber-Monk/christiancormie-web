import { zodResolver } from "@hookform/resolvers/zod";
import { useId, useRef } from "react";
import { useForm } from "react-hook-form";
import { FormField } from "@/components/forms/FormField";
import { Modal } from "@/components/overlays/Modal/Modal";
import { Button } from "@/components/ui/Button";
import {
  memberProfileEditSchema,
  type MemberProfileEditValues,
} from "@/features/customer/schemas/member-profile.schema";

export function MemberProfileEditor({
  name,
  onSave,
  onClose,
}: {
  name: string;
  onSave: (name: string) => void;
  onClose: () => void;
}) {
  const titleId = useId();
  const busy = useRef(false);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<MemberProfileEditValues>({
    resolver: zodResolver(memberProfileEditSchema),
    defaultValues: { name },
  });
  return (
    <Modal isOpen onClose={onClose} titleId={titleId}>
      <form
        className="overflow-y-auto p-6 pt-12"
        noValidate
        onSubmit={(event) => {
          event.preventDefault();
          if (busy.current) return;
          busy.current = true;
          void handleSubmit((values) => onSave(values.name))(event).finally(() => {
            busy.current = false;
          });
        }}
      >
        <h2 id={titleId} className="mb-5 text-xl font-semibold">
          Edit profile
        </h2>
        <FormField
          {...register("name")}
          defaultValue={name}
          label="Profile name"
          error={errors.name?.message}
          autoComplete="off"
        />
        <p className="mt-4 text-sm leading-6 text-[var(--text-muted)]">
          Changes apply only to this sample profile on this page.
        </p>
        <div className="mt-6 grid grid-cols-2 gap-3">
          <Button onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" disabled={isSubmitting}>
            Save changes
          </Button>
        </div>
      </form>
    </Modal>
  );
}
