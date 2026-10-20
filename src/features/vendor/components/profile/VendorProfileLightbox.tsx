import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { useId } from "react";
import { Modal } from "@/components/overlays/Modal/Modal";
import { nextProfileGalleryId } from "@/features/vendor/utils/profileState";
import { profileGallery } from "@/features/vendor/data/profile.data";
export function VendorProfileLightbox({
  imageId,
  onChange,
  onClose,
}: {
  imageId: string;
  onChange: (id: string) => void;
  onClose: () => void;
}) {
  const id = useId();
  const photos = profileGallery.filter((photo) => photo !== null);
  const index = photos.findIndex((photo) => photo.id === imageId);
  const photo = photos[index];
  if (!photo) return null;
  const move = (direction: -1 | 1) =>
    onChange(nextProfileGalleryId(imageId, direction));
  return (
    <Modal
      isOpen
      onClose={onClose}
      titleId={`${id}-title`}
      panelClassName="vendor-profile-lightbox"
      showCloseButton={false}
    >
      <div
        role="group"
        aria-label="Gallery image viewer"
        onKeyDown={(event) => {
          if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
            event.preventDefault();
            move(event.key === "ArrowLeft" ? -1 : 1);
          }
        }}
      >
        <header className="mb-4 flex items-center gap-3">
          <h2 id={`${id}-title`} className="flex-1 pr-4 text-lg font-semibold">
            {photo.alt}
          </h2>
          <button
            type="button"
            aria-label="Close image viewer"
            className="vendor-profile-back"
            onClick={onClose}
          >
            <X size={20} />
          </button>
        </header>
        <img
          src={photo.source}
          alt={photo.alt}
          className="max-h-[65dvh] w-full rounded-xl object-contain"
        />
        <div className="mt-4 flex items-center justify-between gap-3">
          <button
            type="button"
            className="vendor-profile-back"
            aria-label="Previous gallery image"
            onClick={() => move(-1)}
          >
            <ChevronLeft size={22} />
          </button>
          <p className="text-sm text-[#B8C1D1]" role="status">
            {index + 1} of {photos.length}
          </p>
          <button
            type="button"
            className="vendor-profile-back"
            aria-label="Next gallery image"
            onClick={() => move(1)}
          >
            <ChevronRight size={22} />
          </button>
        </div>
      </div>
    </Modal>
  );
}
