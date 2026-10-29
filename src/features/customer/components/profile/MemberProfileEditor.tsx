import { zodResolver } from "@hookform/resolvers/zod";
import { useId, useRef } from "react";
import { useForm } from "react-hook-form";
import { FormField } from "@/components/forms/FormField";
import { Modal } from "@/components/overlays/Modal/Modal";
import { Button } from "@/components/ui/Button";
import { useAccount } from "@/features/account/hooks/useAccount";
import { useUpdateAccountProfileMutation } from "@/features/account/api/account.api";
import { normalizeApiError } from "@/utils/errors/normalizeApiError";
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
  onSave: (name: string, identityRefreshed: boolean) => void;
  onClose: () => void;
}) {
  const titleId = useId();
  const busy = useRef(false);
  const account = useAccount();
  const [save] = useUpdateAccountProfileMutation();
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting, isDirty },
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
          void handleSubmit(async (values) => {
            try {
              const result = await save({
                scope: account.scope,
                body: { displayName: values.name },
              }).unwrap();
              if (account.isCurrent()) onSave(values.name, result.identityRefreshed);
            } catch (e) {
              if (account.isCurrent())
                setError("root", { message: normalizeApiError(e).message });
            }
          })(event).finally(() => {
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
          label="Display Name"
          error={errors.name?.message}
          autoComplete="off"
        />
        <p className="mt-4 text-sm leading-6 text-[var(--text-muted)]">
          Saves your display name. Separate first/last names and bio cannot be updated
          through this API.
        </p>
        {errors.root && <p role="alert">{errors.root.message}</p>}
        <div className="mt-6 grid grid-cols-2 gap-3">
          <Button onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" disabled={isSubmitting || !isDirty}>
            Save changes
          </Button>
        </div>
      </form>
    </Modal>
  );
}
