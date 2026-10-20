import { Star } from "lucide-react";
import { profileGallery, profileReviews } from "@/features/vendor/data/profile.data";
export function VendorProfileGallery({ onOpen }: { onOpen: (id: string) => void }) {
  return (
    <section aria-label="Profile gallery" className="vendor-profile-gallery">
      {profileGallery.map((photo, index) =>
        photo ? (
          <button
            key={photo.id}
            type="button"
            aria-label={`View ${photo.alt}`}
            onClick={() => onOpen(photo.id)}
          >
            <img src={photo.source} alt={photo.alt} />
          </button>
        ) : (
          <span
            key={`missing-${index}`}
            className="vendor-profile-gallery-placeholder"
            aria-hidden="true"
          />
        ),
      )}
    </section>
  );
}
export function VendorProfileReviews() {
  return (
    <section aria-label="Sample profile reviews" className="vendor-profile-reviews">
      <ul className="space-y-4">
        {profileReviews.map((review) => (
          <li key={review.id} className="vendor-profile-review">
            <div className="flex items-start gap-3">
              <img
                className={`size-10 object-cover ${review.round ? "rounded-full" : ""}`}
                src={review.photo}
                alt=""
              />
              <div>
                <h2 className="text-base font-semibold">{review.name}</h2>
                <p
                  className="mt-1 flex gap-1 text-[#FFB800]"
                  aria-label="5 out of 5 stars"
                >
                  {Array.from({ length: 5 }, (_, index) => (
                    <Star
                      key={index}
                      size={16}
                      fill="currentColor"
                      aria-hidden="true"
                    />
                  ))}
                </p>
              </div>
            </div>
            <p className="mt-3 text-sm leading-5 text-[#B6B7BC]">{review.text}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
