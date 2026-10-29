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
import type { AppError } from "@/utils/errors/error.types";
import { applyServerFieldErrors } from "@/utils/errors/applyServerFieldErrors";

export function VendorCommunityPostForm({
  category,
  heading,
  draft,
  files,
  onFiles,
  onDraft,
  onBack,
  onSubmit,
  integrated = false,
  pending: externalPending = false,
  disabled = false,
  editing = false,
  serverError,
}: {
  category: GeneralPostCategory;
  heading: string;
  draft?: GeneralPostValues;
  files: FileUploadItemValue[];
  onFiles: (items: FileUploadItemValue[]) => void;
  onBack: (values: GeneralPostValues) => void;
  onDraft: (values: GeneralPostValues) => void;
  onSubmit: (values: GeneralPostValues) => void | Promise<void>;
  integrated?: boolean;
  pending?: boolean;
  disabled?: boolean;
  editing?: boolean;
  serverError?: AppError | null;
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
  useEffect(() => {
    if (serverError)
      applyServerFieldErrors(serverError, setError, ["description", "title"]);
  }, [serverError, setError]);
  const pending = useRef(false);
  const copy = communityFormCopy[category];
  return (
    <section className={`vendor-post-form-page vendor-post-form-page--${category}`}>
      <div className="vendor-post-heading">
        <button
          disabled={externalPending || isSubmitting}
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
          void handleSubmit(async (values) => {
            if (pending.current) return;
            const error = postFilesError(files);
            if (error) {
              setError("root", { message: error });
              return;
            }
            pending.current = true;
            try {
              await onSubmit(values);
            } catch (cause) {
              setError("root", {
                message:
                  cause instanceof Error ? cause.message : "Unable to save this post.",
              });
            } finally {
              pending.current = false;
            }
          })(event);
        }}
      >
        <fieldset className="contents" disabled={externalPending || isSubmitting}>
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
            integrated={integrated}
            disabled={externalPending || isSubmitting}
          />
          <FormError message={errors.root?.message} />
          <button
            type="submit"
            className="vendor-post-submit"
            disabled={isSubmitting || externalPending || disabled}
          >
            {externalPending
              ? "Saving…"
              : editing
                ? "Save changes"
                : "Post to community"}
          </button>
          <p className="text-xs leading-5 text-[#B8C1D1]">
            {integrated
              ? "Publication is confirmed only after the backend saves your post."
              : "Local preview: this saves a post here. Nothing is published or sent."}
          </p>
        </fieldset>
      </form>
    </section>
  );
}
