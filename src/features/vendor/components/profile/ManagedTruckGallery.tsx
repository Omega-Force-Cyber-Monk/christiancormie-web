import { zodResolver } from "@hookform/resolvers/zod";
import { useRef, useState, useId } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Modal } from "@/components/overlays/Modal/Modal";
import { ConfirmationDialog } from "@/components/overlays/ConfirmationDialog/ConfirmationDialog";
import { useConfirmation } from "@/components/overlays/ConfirmationDialog/useConfirmation";
import { FormField } from "@/components/forms/FormField";
import { useAccount } from "@/features/account/hooks/useAccount";
import { normalizeApiError } from "@/utils/errors/normalizeApiError";
import { remoteMedia } from "@/utils/files/remoteMedia";
import type { OwnedTruck } from "../../utils/truckSettings";
import type { SessionScope } from "@/services/api/sessionGuard";
import { VendorProfilePhotoPicker } from "./VendorProfilePhotoPicker";
import {
  galleryMetadataSchema,
  type UploadedAsset,
} from "../../schemas/truckAssets.schema";
import {
  useUploadTruckAssetMutation,
  useAddTruckImageMutation,
  useUpdateTruckImageMutation,
  useDeleteTruckImageMutation,
} from "../../api/truckAssets.api";
import { persistTruckAsset } from "../../utils/persistTruckAsset";
import { useGetMyTrucksQuery } from "../../api/vendor.api";
type ImageRecord = NonNullable<OwnedTruck["images"]>[number];
function GalleryImageEditor({
  truck,
  scope,
  image,
  onClose,
}: {
  truck: OwnedTruck;
  scope: SessionScope;
  image?: ImageRecord;
  onClose: () => void;
}) {
  const titleId = useId();
  const account = useAccount();
  const [file, setFile] = useState<File>();
  const uploaded = useRef<{ file: File; asset: UploadedAsset } | undefined>(undefined);
  const pending = useRef(false);
  const [upload] = useUploadTruckAssetMutation();
  const [add] = useAddTruckImageMutation();
  const [update] = useUpdateTruckImageMutation();
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting, isDirty, dirtyFields },
  } = useForm<{ altText: string; sortOrder: number }>({
    resolver: zodResolver(galleryMetadataSchema),
    defaultValues: { altText: image?.altText ?? "", sortOrder: image?.sortOrder ?? 0 },
  });
  return (
    <Modal
      isOpen
      titleId={titleId}
      onClose={() => {
        if (!isSubmitting) onClose();
      }}
    >
      <form
        className="space-y-4 overflow-y-auto p-6 pt-12"
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          if (pending.current) return;
          pending.current = true;
          void handleSubmit(async (v) => {
            try {
              if (image)
                await update({
                  scope,
                  truckId: truck.id,
                  imageId: image.id,
                  body: {
                    ...(dirtyFields.altText ? { altText: v.altText } : {}),
                    ...(dirtyFields.sortOrder ? { sortOrder: v.sortOrder } : {}),
                  },
                }).unwrap();
              else {
                if (!file) {
                  setError("root", { message: "Choose an image." });
                  return;
                }
                const selected = file;
                await persistTruckAsset({
                  uploaded:
                    uploaded.current?.file === selected
                      ? uploaded.current.asset
                      : undefined,
                  upload: () =>
                    upload({ scope, truckId: truck.id, file: selected }).unwrap(),
                  remember: (asset) => {
                    uploaded.current = { file: selected, asset };
                  },
                  persist: (asset) =>
                    add({
                      scope,
                      truckId: truck.id,
                      body: { ...v, imageUrl: asset.url },
                    }).unwrap(),
                  isCurrent: account.isCurrent,
                });
              }
              if (account.isCurrent()) {
                toast.success("Gallery image saved.");
                onClose();
              }
            } catch (error) {
              if (account.isCurrent())
                setError("root", {
                  message: `${normalizeApiError(error).message} No gallery save is confirmed. Uploaded assets, when confirmed, are retained for an explicit retry; refresh gallery before retrying an uncertain save.`,
                });
            }
          })(e).finally(() => {
            pending.current = false;
          });
        }}
      >
        <h2 id={titleId} className="text-xl font-semibold">
          {image ? "Edit image metadata" : "Add truck image"}
        </h2>
        {!image && (
          <VendorProfilePhotoPicker
            source={file}
            onChange={(f) => {
              if (!isSubmitting) setFile(f);
            }}
            disabled={isSubmitting}
          />
        )}
        <FormField
          label="Image description"
          {...register("altText")}
          defaultValue={image?.altText ?? ""}
          error={errors.altText?.message}
        />
        <FormField
          label="Sort order"
          type="number"
          min={0}
          step={1}
          {...register("sortOrder", { valueAsNumber: true })}
          defaultValue={image?.sortOrder ?? 0}
          error={errors.sortOrder?.message}
        />
        <p className="text-xs text-[#B8C1D1]">
          No image category field is supported. A new image must upload and then save
          its gallery record.
        </p>
        {errors.root && <p role="alert">{errors.root.message}</p>}
        <div className="mt-4 flex flex-wrap justify-end gap-3">
          <button
            type="button"
            className="min-h-10 rounded-lg border border-[#414651] px-3 py-2 text-sm"
            disabled={isSubmitting}
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="vendor-profile-primary"
            disabled={isSubmitting || (Boolean(image) && !isDirty)}
          >
            Save image
          </button>
        </div>
      </form>
    </Modal>
  );
}
export function ManagedTruckGallery({
  truck,
  scope,
}: {
  truck: OwnedTruck;
  scope: SessionScope;
}) {
  const [editing, setEditing] = useState<string>();
  const [viewing, setViewing] = useState<string>();
  const editingImage = truck.images?.find((i) => i.id === editing);
  const viewingImage = truck.images?.find((i) => i.id === viewing);
  const hierarchy = useGetMyTrucksQuery();
  const [remove] = useDeleteTruckImageMutation();
  const { confirm, confirmationProps } = useConfirmation();
  return (
    <section className="p-4" aria-label="Truck gallery management">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-lg font-semibold">Truck photos</h2>
        <button
          type="button"
          className="vendor-profile-primary"
          onClick={() => setEditing("new")}
          disabled={truck.images === undefined}
        >
          Add image
        </button>
        <button
          type="button"
          className="vendor-profile-small-primary"
          disabled={hierarchy.isFetching}
          onClick={() => void hierarchy.refetch()}
        >
          Refresh gallery
        </button>
      </div>
      {truck.images === undefined ? (
        <p>Gallery metadata unavailable. Refresh the truck profile.</p>
      ) : !truck.images.length ? (
        <p>No truck images.</p>
      ) : (
        <div className="vendor-profile-gallery">
          {[...truck.images]
            .sort((a, b) => a.sortOrder - b.sortOrder || a.id.localeCompare(b.id))
            .map((image) => (
              <div key={image.id}>
                <button
                  type="button"
                  className="block aspect-[1.5] w-full overflow-hidden"
                  onClick={() => setViewing(image.id)}
                  aria-label={`Open ${image.altText || "truck image"}`}
                >
                  {remoteMedia(image.imageUrl) ? (
                    <img
                      src={remoteMedia(image.imageUrl)}
                      alt={image.altText || "Truck image"}
                    />
                  ) : (
                    <span>Image unavailable</span>
                  )}
                </button>
                <div className="flex flex-wrap gap-2 py-2">
                  <button type="button" onClick={() => setEditing(image.id)}>
                    Edit metadata
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      confirm({
                        title: "Delete gallery image?",
                        description:
                          "This deletes the truck gallery record. It does not guarantee deletion of the uploaded provider asset.",
                        confirmText: "Delete image",
                        variant: "danger",
                        onConfirm: async () => {
                          await remove({
                            scope,
                            truckId: truck.id,
                            imageId: image.id,
                          }).unwrap();
                        },
                      })
                    }
                  >
                    Delete image
                  </button>
                </div>
              </div>
            ))}
        </div>
      )}
      {editing && (editing === "new" || editingImage) && (
        <GalleryImageEditor
          key={editing}
          truck={truck}
          scope={scope}
          image={editingImage}
          onClose={() => setEditing(undefined)}
        />
      )}
      {viewingImage && (
        <Modal
          isOpen
          titleId="truck-image-view-title"
          onClose={() => setViewing(undefined)}
        >
          <div className="p-6 pt-12">
            <h2 id="truck-image-view-title">{viewingImage.altText || "Truck image"}</h2>
            {remoteMedia(viewingImage.imageUrl) && (
              <img
                src={remoteMedia(viewingImage.imageUrl)}
                alt={viewingImage.altText || "Truck image"}
                className="max-h-[70vh] w-full object-contain"
              />
            )}
          </div>
        </Modal>
      )}
      {confirmationProps && <ConfirmationDialog {...confirmationProps} />}
    </section>
  );
}
