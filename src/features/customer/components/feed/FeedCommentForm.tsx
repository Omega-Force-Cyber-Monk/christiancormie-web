import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { FormField } from "@/components/forms/FormField";
import { Button } from "@/components/ui/Button";
import {
  feedCommentSchema,
  type FeedCommentValues,
} from "@/features/customer/schemas/feed.schema";

export function FeedCommentForm({ onPreview }: { onPreview: (text: string) => void }) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FeedCommentValues>({
    resolver: zodResolver(feedCommentSchema),
    defaultValues: { comment: "" },
  });

  return (
    <form
      className="mt-4 space-y-3"
      onSubmit={(event) => {
        void handleSubmit((values) => {
          onPreview(values.comment);
          reset();
        })(event);
      }}
    >
      <FormField
        error={errors.comment?.message}
        label="Local preview comment"
        placeholder="Write a comment to preview…"
        {...register("comment")}
      />
      <Button disabled={isSubmitting} type="submit" variant="primary">
        Add to local preview
      </Button>
      <p className="text-xs leading-5 text-[#B8C1D1]">
        Comments stay on this page and are never sent or published.
      </p>
    </form>
  );
}
