import { useId } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { FormField } from "@/components/forms/FormField";
import { FormError } from "@/components/forms/FormError";
import {
  postSchema,
  textSchema,
  type OwnPost,
  type PostValues,
} from "@/features/vendor/utils/requestsState";

export function RequestPostForm({
  post,
  onSave,
}: {
  post?: OwnPost;
  onSave: (values: PostValues) => void;
}) {
  const errorId = useId();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<PostValues>({
    resolver: zodResolver(postSchema),
    defaultValues: {
      title: post?.title ?? "",
      body: post?.body ?? "",
      category: post?.category ?? "Community",
    },
  });
  return (
    <form
      noValidate
      className="space-y-4"
      onSubmit={(event) => {
        void handleSubmit(onSave)(event);
      }}
    >
      <p className="text-xs text-[#B8C1D1]">Posts stay in this local Vendor preview.</p>
      <FormField
        label="Title (optional)"
        {...register("title")}
        defaultValue={post?.title}
      />
      <label className="block text-sm">
        Category
        <select
          className="request-input mt-2 w-full"
          {...register("category")}
          defaultValue={post?.category ?? "Community"}
        >
          <option>Community</option>
          <option>For sale</option>
        </select>
      </label>
      <label className="block text-sm">
        Post
        <textarea
          className="request-input mt-2 min-h-32 w-full"
          {...register("body")}
          defaultValue={post?.body}
          aria-invalid={!!errors.body}
          aria-describedby={errors.body ? errorId : undefined}
        />
      </label>
      <FormError id={errorId} message={errors.body?.message} />
      {post?.image && (
        <img
          src={post.image}
          className="max-h-40 w-full rounded-lg object-cover"
          alt="Existing post attachment"
        />
      )}
      <button disabled={isSubmitting} className="request-primary w-full">
        {post ? "Save changes locally" : "Create local post"}
      </button>
    </form>
  );
}
export function RequestTextForm({
  label,
  button,
  onSubmit,
}: {
  label: string;
  button: string;
  onSubmit: (text: string) => void;
}) {
  const errorId = useId();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<{ text: string }>({
    resolver: zodResolver(textSchema),
    defaultValues: { text: "" },
  });
  return (
    <form
      className="mt-5 space-y-3"
      noValidate
      onSubmit={(event) => {
        void handleSubmit(({ text }) => {
          onSubmit(text);
          reset();
        })(event);
      }}
    >
      <label className="block text-sm">
        {label}
        <textarea
          className="request-input mt-2 min-h-24 w-full"
          {...register("text")}
          aria-invalid={!!errors.text}
          aria-describedby={errors.text ? errorId : undefined}
        />
      </label>
      <FormError id={errorId} message={errors.text?.message} />
      <button className="request-primary w-full">{button}</button>
    </form>
  );
}
