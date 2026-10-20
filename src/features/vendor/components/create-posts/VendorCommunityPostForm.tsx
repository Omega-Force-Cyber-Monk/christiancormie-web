import { useEffect, useId, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { FormField } from "@/components/forms/FormField";
import { FormError } from "@/components/forms/FormError";
import type { FileUploadItemValue } from "@/components/forms/FileUpload/file-upload.types";
import { VendorPostAttachments } from "@/features/vendor/components/create-posts/VendorPostAttachments";
import {
  communityFormCopy,
  type GeneralPostCategory,
} from "@/features/vendor/data/create-posts.data";
import {
  generalPostSchema,
  type GeneralPostValues,
} from "@/features/vendor/schemas/create-posts.schema";
import { postFilesError } from "@/features/vendor/utils/createPostsState";
import { ArrowLeft } from "lucide-react";

export function VendorCommunityPostForm({
  category,
  heading,
  draft,
  files,
  onFiles,
  onDraft,
  onBack,
  onSubmit,
}: {
  category: GeneralPostCategory;
  heading: string;
  draft?: GeneralPostValues;
  files: FileUploadItemValue[];
  onFiles: (items: FileUploadItemValue[]) => void;
  onBack: (values: GeneralPostValues) => void;
  onDraft: (values: GeneralPostValues) => void;
  onSubmit: (values: GeneralPostValues) => void;
}) {
  const {
    register,
    getValues,
    subscribe,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<GeneralPostValues>({
    resolver: zodResolver(generalPostSchema),
    defaultValues: draft ?? { category, title: "", description: "" },
  });
  useEffect(
    () =>
      subscribe({
        formState: { values: true },
        callback: ({ values }) => onDraft(values),
      }),
    [subscribe, onDraft],
  );
  const id = useId();
  const pending = useRef(false);
  const copy = communityFormCopy[category];
  return (
    <section className={`vendor-post-form-page vendor-post-form-page--${category}`}>
      <div className="vendor-post-heading">
        <button
          type="button"
          className="vendor-post-back"
          aria-label="Back to post categories, retain draft"
          onClick={() => onBack(getValues())}
        >
          <ArrowLeft size={20} />
        </button>
        <h1>{heading}</h1>
      </div>
      <form
        noValidate
        className="vendor-post-form"
        onSubmit={(event) => {
          void handleSubmit((values) => {
            if (pending.current) return;
            const error = postFilesError(files);
            if (error) {
              setError("root", { message: error });
              return;
            }
            pending.current = true;
            onSubmit(values);
          })(event);
        }}
      >
        <input type="hidden" {...register("category")} />
        <p className={`vendor-post-notice vendor-post-notice--${category}`}>
          <span>{copy.description}</span>
        </p>
        {category === "sale" && (
          <FormField
            label="Item name *"
            className="vendor-post-control"
            placeholder="e.g., Commercial Flat Top Grill"
            defaultValue={draft?.title ?? ""}
            {...register("title")}
            error={errors.title?.message}
            required
          />
        )}
        <div className="space-y-2">
          <label className="vendor-post-label" htmlFor={`${id}-description`}>
            {copy.label}
            {category === "sale" && <span className="text-[#FF5733]"> *</span>}
          </label>
          <textarea
            id={`${id}-description`}
            className="vendor-post-control vendor-post-description"
            placeholder={copy.placeholder}
            defaultValue={draft?.description ?? ""}
            {...register("description")}
            aria-invalid={!!errors.description}
            aria-describedby={
              errors.description ? `${id}-description-error` : undefined
            }
          />
          <FormError
            id={`${id}-description-error`}
            message={errors.description?.message}
          />
        </div>
        <VendorPostAttachments
          files={files}
          onChange={onFiles}
          recommended={category === "sale"}
        />
        <FormError message={errors.root?.message} />
        <button type="submit" className="vendor-post-submit" disabled={isSubmitting}>
          Post to community
        </button>
        <p className="text-xs leading-5 text-[#B8C1D1]">
          Local preview: this saves a post here. Nothing is published or sent.
        </p>
      </form>
    </section>
  );
}
