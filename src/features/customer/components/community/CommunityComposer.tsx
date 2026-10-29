import { zodResolver } from "@hookform/resolvers/zod";
import {
  ArrowLeft,
  BriefcaseBusiness,
  HeartHandshake,
  Megaphone,
  PartyPopper,
  Tag,
  Truck,
} from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import type { AppError } from "@/utils/errors/error.types";
import { applyServerFieldErrors } from "@/utils/errors/applyServerFieldErrors";
import {
  communityFormErrors,
  customerCommunityFields,
} from "@/features/community/utils/communityFormErrors";
import { useForm, useWatch } from "react-hook-form";
import { FormField } from "@/components/forms/FormField";
import { FormError } from "@/components/forms/FormError";
import { FileUpload } from "@/components/forms/FileUpload/FileUpload";
import type { FileUploadItemValue } from "@/components/forms/FileUpload/file-upload.types";
import { Button } from "@/components/ui/Button";
import {
  bookingMenus,
  discoverArtwork,
} from "@/features/customer/data/discover-booking.data";
import {
  communityComposerSchema,
  communityEventTypes,
  communityMenuChoices,
  emptyCommunityComposer,
  type CommunityComposerValues,
} from "@/features/customer/schemas/community.schema";

const choices = [
  {
    category: "Need a truck",
    title: "Need a truck",
    description: "Hiring for your event",
    icon: Truck,
  },
  {
    category: "Callout",
    title: "Vendor callout",
    description: "Offering spots at an event",
    icon: Megaphone,
  },
  {
    category: "For sale",
    title: "For sale",
    description: "Selling equipment or truck",
    icon: Tag,
  },
  {
    category: "Hiring / jobs",
    title: "Hiring / jobs",
    description: "Jobs & work opportunities",
    icon: BriefcaseBusiness,
  },
  {
    category: "Community help",
    title: "Community help",
    description: "Events, news, general chat",
    icon: HeartHandshake,
  },
  {
    category: "Community",
    title: "Community",
    description: "Events, news, general chat",
    icon: PartyPopper,
  },
] as const;
const copy = {
  "For sale":
    "Selling equipment or a truck? List it here so other vendors in your area can find it. Contact is handled through the app.",
  Community:
    "Share events, flyers, news, or anything relevant to the local food truck scene. No form needed — just post and go.",
  Callout:
    "You're hosting an event and offering spots for food trucks to set up and sell independently. You don't pay them — they keep their own sales and get the exposure.",
  "Hiring / jobs":
    "Connect with the local food truck community — post a job opening or let vendors know you're available.",
  "Community help":
    "Share your question or offer help to the local food truck community.",
  "Need a truck": "",
};

export function CommunityComposer({
  initial,
  initialFiles = [],
  onSave,
  onCancel,
  integrated = false,
  pending = false,
  disabled = false,
  serverError,
}: {
  initial?: CommunityComposerValues;
  initialFiles?: FileUploadItemValue[];
  onSave: (
    values: CommunityComposerValues,
    files: FileUploadItemValue[],
  ) => void | Promise<void>;
  onCancel: () => void;
  integrated?: boolean;
  pending?: boolean;
  disabled?: boolean;
  serverError?: AppError | null;
}) {
  const [choosing, setChoosing] = useState(!initial);
  const [files, setFiles] = useState(initialFiles);
  const [fileError, setFileError] = useState("");
  const busy = useRef(false);
  const id = useId();
  const {
    register,
    control,
    setValue,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<CommunityComposerValues>({
    resolver: zodResolver(communityComposerSchema),
    defaultValues: initial ?? emptyCommunityComposer,
  });
  const [category, menus] = useWatch({ control, name: ["category", "menus"] });
  useEffect(() => {
    if (serverError)
      applyServerFieldErrors(
        communityFormErrors(serverError, customerCommunityFields),
        setError,
        [
          "body",
          "itemName",
          "eventType",
          "date",
          "time",
          "location",
          "guests",
          "budget",
          "menus",
        ],
      );
  }, [serverError, setError]);
  const request = category === "Need a truck";
  const textLabel = request
    ? "Event Description"
    : category === "For sale"
      ? "Item description"
      : category === "Community" || category === "Community help"
        ? "What's on your mind?"
        : "Describe your post";

  return (
    <section className="community-compose-view">
      <div className="community-page-heading">
        <Button
          disabled={pending || isSubmitting}
          aria-label={choosing ? "Back to Community" : "Back to post types"}
          onClick={() => (choosing || initial ? onCancel() : setChoosing(true))}
        >
          <ArrowLeft size={20} />
        </Button>
        <h1>
          {choosing
            ? "Create post"
            : initial
              ? `Edit ${category.toLowerCase()}`
              : request
                ? "Post truck request"
                : category === "Callout"
                  ? "Vendor callout"
                  : category}
        </h1>
      </div>
      {choosing ? (
        <div className="community-compose-choices">
          {choices.map(({ category, title, description, icon: Icon }, index) => (
            <button
              disabled={pending || disabled}
              type="button"
              key={category}
              onClick={() => {
                setValue("category", category);
                setChoosing(false);
              }}
              className={`community-compose-choice community-choice-${index}`}
            >
              <span>
                <Icon aria-hidden="true" size={22} />
              </span>
              <strong>{title}</strong>
              <small>{description}</small>
            </button>
          ))}
        </div>
      ) : (
        <form
          className={`community-form-panel ${request || category === "For sale" ? "community-form-panel--outlined" : "community-form-panel--filled"}`}
          noValidate
          onSubmit={(event) => {
            event.preventDefault();
            if (busy.current) return;
            if (!request && (files.length > 5 || files.some((file) => file.error))) {
              setFileError("Choose up to five valid JPG, PNG, or PDF files.");
              return;
            }
            busy.current = true;
            void handleSubmit(async (values) => {
              try {
                await onSave(values, request ? [] : files);
              } catch (cause) {
                setError("root", {
                  message:
                    cause instanceof Error
                      ? cause.message
                      : "Unable to save this post.",
                });
              }
            })(event).finally(() => {
              busy.current = false;
            });
          }}
        >
          <fieldset className="contents" disabled={pending || isSubmitting}>
            {!request && (
              <p
                className={`community-composer-callout community-composer-callout--${category === "Callout" ? "callout" : category === "For sale" ? "sale" : "social"}`}
              >
                {copy[category]}
              </p>
            )}
            {request && (
              <div className="space-y-5">
                <div>
                  <label
                    className="mb-2 block text-sm font-medium"
                    htmlFor={`${id}-event`}
                  >
                    Event Type
                  </label>
                  <select
                    className="community-input"
                    id={`${id}-event`}
                    {...register("eventType")}
                    aria-invalid={Boolean(errors.eventType)}
                    aria-describedby={
                      errors.eventType ? `${id}-event-error` : undefined
                    }
                  >
                    <option value="">Select Event Type</option>
                    {communityEventTypes.map((type) => (
                      <option key={type}>{type}</option>
                    ))}
                  </select>
                  <FormError
                    id={`${id}-event-error`}
                    message={errors.eventType?.message}
                  />
                </div>
                <FormField
                  label="Event Date"
                  type="date"
                  {...register("date")}
                  error={errors.date?.message}
                />
                <FormField
                  label={
                    integrated
                      ? "Event Time (UTC when no time zone is supplied)"
                      : "Event Time"
                  }
                  type="time"
                  {...register("time")}
                  error={errors.time?.message}
                />
                <FormField
                  label="Location"
                  placeholder="e.g., Golden Gate Park, SF"
                  {...register("location")}
                  error={errors.location?.message}
                />
                <FormField
                  label="Expected Guests"
                  inputMode="numeric"
                  placeholder="e.g., 50"
                  {...register("guests")}
                  error={errors.guests?.message}
                />
                <FormField
                  label="Budget Range"
                  placeholder="e.g., $500–800"
                  {...register("budget")}
                  error={errors.budget?.message}
                />
              </div>
            )}
            {category === "For sale" && (
              <FormField
                label="Item name *"
                placeholder="e.g., Commercial Flat Top Grill"
                {...register("itemName")}
                error={errors.itemName?.message}
              />
            )}
            <div className="mt-5">
              <label className="mb-2 block text-sm font-medium" htmlFor={`${id}-body`}>
                {textLabel}
                {category === "For sale" ? " *" : ""}
              </label>
              <textarea
                id={`${id}-body`}
                className="community-input min-h-40"
                {...register("body")}
                aria-invalid={Boolean(errors.body)}
                aria-describedby={errors.body ? `${id}-body-error` : undefined}
                placeholder={
                  request
                    ? "Describe your event and what you're looking for..."
                    : category === "For sale"
                      ? "Condition, age, reason for selling..."
                      : category === "Callout"
                        ? "Event name, date, venue..."
                        : category === "Hiring / jobs"
                          ? "Role, requirements, pay..."
                          : "Share events, news, or anything..."
                }
              />
              <FormError id={`${id}-body-error`} message={errors.body?.message} />
            </div>
            {request ? (
              <fieldset className="mt-8">
                <legend className="mb-4 text-sm font-semibold">
                  Preferred Menu Items
                </legend>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {communityMenuChoices.map((menu, index) => (
                    <label key={menu} className="cursor-pointer">
                      <input
                        type="checkbox"
                        checked={menus.includes(menu)}
                        onChange={() =>
                          setValue(
                            "menus",
                            menus.includes(menu)
                              ? menus.filter((item) => item !== menu)
                              : [...menus, menu],
                          )
                        }
                        className="peer sr-only"
                      />
                      <span className="community-menu-choice">
                        <img
                          alt=""
                          className="size-6 object-contain"
                          src={discoverArtwork(
                            `8-menu-${bookingMenus[index]?.image}.png`,
                          )}
                        />
                        {menu}
                      </span>
                    </label>
                  ))}
                </div>
              </fieldset>
            ) : (
              <div className="community-uploads mt-5">
                <p className="mb-2 text-sm">
                  Photos / fliers{" "}
                  <span className="text-[#B8C1D1]">
                    ({category === "For sale" ? "recommended" : "optional"}, max 5)
                  </span>
                </p>
                <FileUpload
                  value={files}
                  onChange={(next) => {
                    setFiles(next);
                    setFileError(
                      next.length > 5 ? "You can attach up to five files." : "",
                    );
                  }}
                  multiple
                  allowedExtensions={["jpg", "jpeg", "png", "pdf"]}
                  allowedMimeTypes={["image/jpeg", "image/png", "application/pdf"]}
                  maxSizeBytes={integrated ? 10 * 1024 * 1024 : undefined}
                  disabled={isSubmitting}
                />
                <FormError message={fileError} />
              </div>
            )}
            <div
              className={`mt-5 grid gap-4 ${request ? "grid-cols-2 border-t border-white/5 pt-4" : ""}`}
            >
              {request && (
                <Button disabled={isSubmitting} onClick={onCancel}>
                  Cancel
                </Button>
              )}
              <Button
                type="submit"
                disabled={isSubmitting || pending || disabled}
                className="community-primary"
              >
                {integrated
                  ? pending
                    ? "Saving…"
                    : initial
                      ? "Save changes"
                      : request
                        ? "Post request"
                        : "Post to community"
                  : initial
                    ? "Save changes (preview)"
                    : request
                      ? "Post request (preview)"
                      : "Post to community (preview)"}
              </Button>
            </div>
            <p className="mt-3 text-xs text-[#B8C1D1]">
              {integrated
                ? request
                  ? "No coordinates or event time zone are inferred from your address. The backend interprets an omitted time zone as UTC."
                  : "Attachments upload before publication. Up to five JPG, PNG or PDF files, 10 MB each."
                : "Local preview only. Nothing is published or sent."}
            </p>
            <FormError message={errors.root?.message} />
          </fieldset>
        </form>
      )}
    </section>
  );
}
