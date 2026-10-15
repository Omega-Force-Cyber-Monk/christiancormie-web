import { zodResolver } from "@hookform/resolvers/zod";
import { useId } from "react";
import { useForm } from "react-hook-form";

import { FormError } from "@/components/forms/FormError";
import { FormField } from "@/components/forms/FormField";
import { Modal } from "@/components/overlays/Modal/Modal";
import { Button } from "@/components/ui/Button";
import { communityCategories } from "@/features/customer/data/community.data";
import {
  communityLocationSchema,
  communityPostSchema,
  type CommunityLocationValues,
  type CommunityPostValues,
} from "@/features/customer/schemas/community.schema";

export function CommunityLocationDialog({
  city,
  onApply,
  onClose,
}: {
  city: string;
  onApply: (city: string) => void;
  onClose: () => void;
}) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CommunityLocationValues>({
    resolver: zodResolver(communityLocationSchema),
    defaultValues: { city },
  });
  return (
    <Modal isOpen onClose={onClose} titleId="community-location-title">
      <form
        className="space-y-4 overflow-y-auto p-6 pt-12"
        onSubmit={(event) => {
          void handleSubmit((values) => onApply(values.city))(event);
        }}
      >
        <h2 className="text-xl font-semibold" id="community-location-title">
          Change community location
        </h2>
        <FormField error={errors.city?.message} label="City" {...register("city")} />
        <FormField label="Radius (design sample)" readOnly value="25 mi" />
        <p className="text-sm leading-6 text-[var(--text-muted)]">
          This preview filters by city name. Distance filtering requires coordinates;
          the supplied radius is illustrative.
        </p>
        <Button disabled={isSubmitting} type="submit" variant="primary">
          Apply preview location
        </Button>
      </form>
    </Modal>
  );
}

export function CommunityComposerDialog({
  onCreate,
  onClose,
}: {
  onCreate: (values: CommunityPostValues) => void;
  onClose: () => void;
}) {
  const id = useId();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CommunityPostValues>({
    resolver: zodResolver(communityPostSchema),
    defaultValues: { category: "Community", body: "" },
  });
  return (
    <Modal isOpen onClose={onClose} titleId="community-compose-title">
      <form
        className="space-y-4 overflow-y-auto p-6 pt-12"
        onSubmit={(event) => {
          void handleSubmit(onCreate)(event);
        }}
      >
        <h2 className="text-xl font-semibold" id="community-compose-title">
          Create a local post preview
        </h2>
        <div>
          <label className="mb-2 block text-sm font-medium" htmlFor={`${id}-category`}>
            Category
          </label>
          <select
            className="community-input"
            id={`${id}-category`}
            {...register("category")}
          >
            {communityCategories.slice(1).map((option) => (
              <option key={option}>{option}</option>
            ))}
          </select>
          <FormError message={errors.category?.message} />
        </div>
        <div>
          <label className="mb-2 block text-sm font-medium" htmlFor={`${id}-body`}>
            Post text
          </label>
          <textarea
            aria-describedby={errors.body ? `${id}-error` : undefined}
            aria-invalid={Boolean(errors.body)}
            className="community-input min-h-32"
            id={`${id}-body`}
            {...register("body")}
          />
          <FormError id={`${id}-error`} message={errors.body?.message} />
        </div>
        <p className="text-sm leading-6 text-[var(--text-muted)]">
          This adds a preview only to this page. Nothing is published, sent to vendors,
          or saved to an account.
        </p>
        <Button disabled={isSubmitting} type="submit" variant="primary">
          Add local preview
        </Button>
      </form>
    </Modal>
  );
}
