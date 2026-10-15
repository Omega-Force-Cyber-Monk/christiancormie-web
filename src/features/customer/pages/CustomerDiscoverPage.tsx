import { Filter, Search, TrendingUp } from "lucide-react";
import { useState } from "react";
import { generatePath, useNavigate } from "react-router";

import { Modal } from "@/components/overlays/Modal/Modal";
import { NoResultsState } from "@/components/states/NoResultsState";
import { Button } from "@/components/ui/Button";
import { ROUTES } from "@/constants/routes";
import offerTag from "@/features/customer/assets/discover/discover-offer-tag.svg";
import truckPin from "@/features/customer/assets/discover/discover-truck-pin.svg";
import { DiscoverFiltersDrawer } from "@/features/customer/components/discover/DiscoverFiltersDrawer";
import {
  DiscoverTruckCard,
  FeaturedBadge,
  TruckDistance,
  TruckImage,
} from "@/features/customer/components/discover/DiscoverTruckCard";
import {
  discoverMapImage,
  discoverMapPins,
  discoverTrucks,
  suggestedTruckIds,
  trendingTruckIds,
  type DiscoverTruck,
} from "@/features/customer/data/discover.data";
import {
  defaultDiscoverFilters,
  getDiscoverFilterCount,
  matchesDiscoverFilters,
  type DiscoverFilters,
} from "@/features/customer/utils/discoverFilters";

export default function CustomerDiscoverPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<DiscoverFilters>(defaultDiscoverFilters);
  const [savedIds, setSavedIds] = useState<string[]>([]);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [selectedTruck, setSelectedTruck] = useState<DiscoverTruck | null>(null);
  const [announcement, setAnnouncement] = useState("");
  const query = search.trim().toLowerCase();
  const matches = discoverTrucks.filter(
    (truck) =>
      `${truck.name} ${truck.cuisine}`.toLowerCase().includes(query) &&
      matchesDiscoverFilters(truck, filters),
  );
  const suggestions = matches.filter((truck) => suggestedTruckIds.includes(truck.id));
  const trending = matches.filter((truck) => trendingTruckIds.includes(truck.id));
  const filterCount = getDiscoverFilterCount(filters);
  const isFiltered = Boolean(query || filterCount);

  function openTruckProfile(truck: DiscoverTruck) {
    if (truck.id === "taco-paradise") {
      void navigate(generatePath(ROUTES.CUSTOMER_PROFILE, { id: truck.id }));
    } else {
      setSelectedTruck(truck);
    }
  }

  function toggleSaved(truck: DiscoverTruck) {
    const saved = savedIds.includes(truck.id);
    setSavedIds((current) =>
      saved ? current.filter((id) => id !== truck.id) : [...current, truck.id],
    );
    setAnnouncement(
      `${truck.name} ${saved ? "removed from" : "added to"} saved trucks for this preview.`,
    );
  }

  function resetFilters() {
    setSearch("");
    setFilters(defaultDiscoverFilters);
  }

  return (
    <div className="discover-page">
      <h1 className="sr-only">Discover food trucks — static design preview</h1>
      <div className="flex items-center gap-4">
        <div className="relative min-w-0 flex-1">
          <Search
            aria-hidden="true"
            className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-[var(--text-muted)]"
            size={20}
          />
          <label className="sr-only" htmlFor="discover-search">
            Search trucks or cuisines
          </label>
          <input
            className="h-[52px] w-full rounded-2xl border border-white/10 bg-transparent pr-4 pl-11 text-base text-white placeholder:text-[var(--text-muted)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
            id="discover-search"
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search trucks, cuisines..."
            type="search"
            value={search}
          />
        </div>
        <button
          aria-label={`Filter trucks${filterCount ? ` (${filterCount} active)` : ""}`}
          aria-expanded={filtersOpen}
          aria-haspopup="dialog"
          className="relative grid size-12 shrink-0 place-items-center rounded-xl border border-white/15 bg-[#FF5733] text-[#121826] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
          onClick={() => setFiltersOpen(true)}
          type="button"
        >
          <Filter aria-hidden="true" size={24} />
          {filterCount > 0 && (
            <span className="absolute -top-2 -right-2 grid size-5 place-items-center rounded-full bg-[#2ED3D1] text-xs font-semibold">
              {filterCount}
            </span>
          )}
        </button>
      </div>
      {isFiltered && (
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-sm">
          <p aria-live="polite" role="status">
            {matches.length} sample {matches.length === 1 ? "truck" : "trucks"} found
          </p>
          <Button onClick={resetFilters} variant="ghost">
            Clear search and filters
          </Button>
        </div>
      )}
      <div className="mt-7 grid items-start gap-7 xl:grid-cols-[minmax(0,584fr)_minmax(0,438fr)] xl:gap-11">
        <section
          aria-label="Sample food truck map of San Francisco"
          className="relative aspect-[584/394.349] overflow-hidden rounded-2xl border-2 border-[#121826] bg-[var(--surface)]"
        >
          <img
            alt="Map of San Francisco around Mission Dolores Park, Noe Valley, and Bernal Heights Park"
            className="absolute inset-0 h-full w-full"
            src={discoverMapImage}
          />
          <img
            alt=""
            className="pointer-events-none absolute top-[15.5%] left-[21.2%] w-[5.1%]"
            src={offerTag}
          />
          {discoverMapPins.map((pin) => {
            const truck = matches.find((item) => item.id === pin.id);
            return (
              truck && (
                <button
                  aria-label={`Preview ${truck.name} on map`}
                  className="absolute grid size-11 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full drop-shadow-md transition-transform hover:scale-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#121826]"
                  key={pin.id}
                  onClick={() => openTruckProfile(truck)}
                  style={{ left: pin.left, top: pin.top }}
                  type="button"
                >
                  <img alt="" className="h-[47px] w-[35px]" src={truckPin} />
                </button>
              )
            );
          })}
          {isFiltered &&
            !discoverMapPins.some((pin) =>
              matches.some((truck) => truck.id === pin.id),
            ) && (
              <p className="absolute right-3 bottom-3 left-3 rounded-lg bg-[#121826]/90 p-2 text-center text-xs">
                No mapped sample trucks match these filters.
              </p>
            )}
        </section>
        <section aria-labelledby="discover-suggested-title">
          <h2
            className="mb-4 text-base leading-6 font-semibold"
            id="discover-suggested-title"
          >
            Suggested For You
          </h2>
          <div className="space-y-4">
            {suggestions.length ? (
              suggestions.map((truck) => (
                <DiscoverTruckCard
                  key={truck.id}
                  onSave={toggleSaved}
                  onView={openTruckProfile}
                  saved={savedIds.includes(truck.id)}
                  suggested
                  truck={truck}
                />
              ))
            ) : (
              <NoResultsState />
            )}
          </div>
        </section>
      </div>
      <section aria-labelledby="discover-trending-title" className="mt-[33px] sm:pl-4">
        <h2
          className="mb-4 flex items-center gap-2 text-xl leading-7 font-semibold"
          id="discover-trending-title"
        >
          <TrendingUp aria-hidden="true" className="text-[#2ED3D1]" size={24} />
          Trending This Week
        </h2>
        {trending.length ? (
          <div
            aria-label="Trending food trucks, scroll for more"
            className="-mt-2 flex snap-x gap-2.5 overflow-x-auto pt-2 pb-3 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
            role="region"
            tabIndex={0}
          >
            {trending.map((truck) => (
              <DiscoverTruckCard
                key={truck.id}
                onSave={toggleSaved}
                onView={openTruckProfile}
                saved={savedIds.includes(truck.id)}
                truck={truck}
              />
            ))}
          </div>
        ) : (
          <NoResultsState />
        )}
      </section>
      <p aria-live="polite" className="sr-only" role="status">
        {announcement}
      </p>
      {filtersOpen && (
        <DiscoverFiltersDrawer
          filters={filters}
          onClose={() => setFiltersOpen(false)}
          onApply={(nextFilters) => {
            setFilters(nextFilters);
            setFiltersOpen(false);
          }}
        />
      )}
      <Modal
        isOpen={selectedTruck !== null}
        onClose={() => setSelectedTruck(null)}
        titleId="discover-truck-title"
        descriptionId="discover-truck-description"
      >
        {selectedTruck && (
          <div className="overflow-y-auto p-6 pt-12">
            <TruckImage
              className="h-48 w-full rounded-xl"
              name={selectedTruck.name}
              src={selectedTruck.suggestedImage ?? selectedTruck.image}
            />
            <h2
              className="mt-4 flex items-center gap-2 text-xl font-semibold"
              id="discover-truck-title"
            >
              {selectedTruck.name}
              {selectedTruck.featured && <FeaturedBadge />}
            </h2>
            <p className="mt-2 flex items-center gap-4 text-sm text-[var(--text-muted)]">
              {selectedTruck.cuisine}
              <TruckDistance distance={selectedTruck.distance} />
            </p>
            <p
              className="mt-4 text-sm leading-6 text-[var(--text-muted)]"
              id="discover-truck-description"
            >
              Static profile preview using the supplied Figma sample. Truck locations,
              ratings, offers, and online status are illustrative. Live profiles, menus,
              booking, and messaging require backend integration.
            </p>
            <Button
              aria-pressed={savedIds.includes(selectedTruck.id)}
              className="mt-5 w-full"
              onClick={() => toggleSaved(selectedTruck)}
              variant="primary"
            >
              {savedIds.includes(selectedTruck.id)
                ? "Remove from saved trucks"
                : "Save truck in this preview"}
            </Button>
          </div>
        )}
      </Modal>
    </div>
  );
}
