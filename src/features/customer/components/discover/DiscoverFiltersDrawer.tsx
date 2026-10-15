import { MapPin, Star, X } from "lucide-react";
import { useId, useState } from "react";

import { Modal } from "@/components/overlays/Modal/Modal";
import { Button } from "@/components/ui/Button";
import {
  defaultDiscoverFilters,
  discoverCuisines,
  getDiscoverFilterCount,
  type DiscoverFilters,
} from "@/features/customer/utils/discoverFilters";

type DiscoverFiltersDrawerProps = {
  filters: DiscoverFilters;
  onApply: (filters: DiscoverFilters) => void;
  onClose: () => void;
};

export function DiscoverFiltersDrawer({
  filters,
  onApply,
  onClose,
}: DiscoverFiltersDrawerProps) {
  const [draft, setDraft] = useState(filters);
  const titleId = useId();
  const countId = useId();
  const filterCount = getDiscoverFilterCount(draft);

  function toggleCuisine(cuisine: string) {
    setDraft((current) => ({
      ...current,
      cuisines: current.cuisines.includes(cuisine)
        ? current.cuisines.filter((value) => value !== cuisine)
        : [...current.cuisines, cuisine],
    }));
  }

  return (
    <Modal
      backdropClassName="bg-[#121826]/80"
      descriptionId={countId}
      isOpen
      onClose={onClose}
      panelClassName="fixed top-0 right-0 flex h-[838px] max-h-dvh w-full max-w-[454px] flex-col overflow-hidden bg-[#1B2233] text-white shadow-2xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#2ED3D1]"
      showCloseButton={false}
      titleId={titleId}
    >
      <div className="flex min-h-[81px] shrink-0 items-center justify-between border-b border-white/5 px-6 min-[400px]:pr-[60px] min-[400px]:pl-12">
        <div>
          <h2 className="text-xl leading-7 font-bold" id={titleId}>
            Filters
          </h2>
          <p
            aria-live="polite"
            className="text-sm leading-5 text-[#B8C1D1]"
            id={countId}
          >
            {filterCount} active
          </p>
        </div>
        <button
          aria-label="Close filters"
          className="grid size-10 place-items-center rounded-full border border-white/5 bg-[#242D42] text-white hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2ED3D1]"
          onClick={onClose}
          type="button"
        >
          <X aria-hidden="true" size={20} />
        </button>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto px-6 pt-[18px] pb-4 min-[400px]:px-12">
        <fieldset>
          <legend className="mb-[14px] text-lg leading-6 font-medium">
            Cuisine Type
          </legend>
          <div className="grid grid-cols-3 gap-x-2 gap-y-3">
            {discoverCuisines.map((cuisine) => (
              <label className="discover-cuisine-option" key={cuisine}>
                <input
                  checked={draft.cuisines.includes(cuisine)}
                  className="peer sr-only"
                  onChange={() => toggleCuisine(cuisine)}
                  type="checkbox"
                />
                <span className="discover-cuisine-tile">
                  <span aria-hidden="true" className="size-6 bg-white" />
                  <span className="text-sm leading-5">{cuisine}</span>
                </span>
              </label>
            ))}
          </div>
        </fieldset>
        <fieldset className="mt-7">
          <legend className="mb-3 w-full">
            <span className="flex items-center justify-between gap-2">
              <span className="text-lg leading-6 font-medium">Distance</span>
              <span className="flex items-center gap-2 text-base text-[#2ED3D1]">
                <MapPin aria-hidden="true" size={16} />
                {draft.distance === null ? "Any" : `${draft.distance} mi`}
              </span>
            </span>
          </legend>
          <div className="grid grid-cols-5 gap-2">
            {[1, 3, 5, 10, null].map((value) => (
              <label className="min-w-0 cursor-pointer" key={value ?? "any"}>
                <input
                  checked={draft.distance === value}
                  className="peer sr-only"
                  name="discover-distance"
                  onChange={() =>
                    setDraft((current) => ({ ...current, distance: value }))
                  }
                  type="radio"
                />
                <span className="discover-filter-chip min-h-[58px] rounded-[20px] px-1 text-xs leading-[18px]">
                  {value === null ? (
                    <span>
                      Any
                      <br />
                      distance
                    </span>
                  ) : (
                    `${value} ${value === 1 ? "mile" : "miles"}`
                  )}
                </span>
              </label>
            ))}
          </div>
        </fieldset>
        <fieldset className="mt-7">
          <legend className="mb-3 w-full">
            <span className="flex items-center justify-between gap-2">
              <span className="text-lg leading-6 font-medium">Minimum Rating</span>
              <span className="flex items-center gap-1 text-base text-[#2ED3D1]">
                <Star aria-hidden="true" className="fill-current" size={16} />
                {draft.minimumRating === null ? "Any" : `${draft.minimumRating}+`}
              </span>
            </span>
          </legend>
          <div className="grid grid-cols-5 gap-2">
            {[null, 3, 3.5, 4, 4.5].map((value) => (
              <label className="min-w-0 cursor-pointer" key={value ?? "any"}>
                <input
                  checked={draft.minimumRating === value}
                  className="peer sr-only"
                  name="discover-minimum-rating"
                  onChange={() =>
                    setDraft((current) => ({ ...current, minimumRating: value }))
                  }
                  type="radio"
                />
                <span className="discover-filter-chip min-h-10 rounded-full px-1 text-xs leading-[18px]">
                  {value === null ? "Any" : `${value}+`}
                </span>
              </label>
            ))}
          </div>
        </fieldset>
      </div>
      <div className="flex min-h-28 shrink-0 items-center justify-between gap-4 border-t border-white/5 px-6 min-[400px]:px-12">
        <Button
          className="discover-filter-reset"
          onClick={() => setDraft(defaultDiscoverFilters)}
        >
          Reset
        </Button>
        <Button
          className="discover-filter-apply"
          onClick={() => onApply(draft)}
          variant="primary"
        >
          Apply Filters
        </Button>
      </div>
    </Modal>
  );
}
