import { Filter, Search, TrendingUp } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { EmptyState } from "@/components/states/EmptyState";
import { ErrorState } from "@/components/states/ErrorState";
import { Skeleton } from "@/components/states/Skeleton";
import { NoResultsState } from "@/components/states/NoResultsState";
import { Button } from "@/components/ui/Button";
import offerTag from "@/features/customer/assets/discover/discover-offer-tag.svg";
import truckPin from "@/features/customer/assets/discover/discover-truck-pin.svg";
import { DiscoverFiltersDrawer } from "@/features/customer/components/discover/DiscoverFiltersDrawer";
import { DiscoverTruckCard } from "@/features/customer/components/discover/DiscoverTruckCard";
import { DiscoverProfileView } from "@/features/customer/components/discover/DiscoverProfileView";
import { DiscoverBookingFlow } from "@/features/customer/components/discover/DiscoverBookingFlow";
import type { BookingValues } from "@/features/customer/schemas/discover-booking.schema";
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
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<DiscoverFilters>(defaultDiscoverFilters);
  const [savedIds, setSavedIds] = useState<string[]>([]);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [selectedTruck, setSelectedTruck] = useState<DiscoverTruck | null>(null);
  const [announcement, setAnnouncement] = useState("");
  const [bookingOpen, setBookingOpen] = useState(false);
  const pageRef = useRef<HTMLDivElement>(null);
  const hadProfile = useRef(false);
  const [bookings, setBookings] = useState<
    { truckName: string; details: BookingValues }[]
  >([]);
  const [sampleState, setSampleState] = useState<
    "ready" | "loading" | "empty" | "error"
  >("ready");
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

  useEffect(() => {
    if (selectedTruck) {
      pageRef.current
        ?.querySelector<HTMLElement>(
          bookingOpen ? ".discover-booking h1" : ".discover-profile-view h1",
        )
        ?.focus();
      hadProfile.current = true;
    } else if (hadProfile.current) {
      pageRef.current?.querySelector<HTMLElement>("#discover-search")?.focus();
      hadProfile.current = false;
    }
  }, [selectedTruck, bookingOpen]);

  function openTruckProfile(truck: DiscoverTruck) {
    setSelectedTruck(truck);
    setBookingOpen(false);
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
    <div className="discover-page" ref={pageRef}>
      <div hidden={selectedTruck !== null}>
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
        {sampleState === "loading" && (
          <div role="status" className="mt-7 space-y-4">
            <p>
              Loading sample trucks… Select Ready below to finish the state preview.
            </p>
            <Skeleton className="h-72" />
          </div>
        )}
        {sampleState === "error" && (
          <div className="mt-7">
            <ErrorState onRetry={() => setSampleState("ready")} />
          </div>
        )}
        {sampleState === "empty" && (
          <div className="mt-7">
            <EmptyState
              title="No sample trucks available"
              description="Select Ready below to restore the sample listings."
            />
          </div>
        )}
        <div hidden={sampleState !== "ready"}>
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
          <section
            aria-labelledby="discover-trending-title"
            className="mt-[33px] sm:pl-4"
          >
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
        </div>
        <details className="mt-8 text-xs text-[#B8C1D1]">
          <summary className="w-fit cursor-pointer py-2 focus-visible:outline">
            Local preview controls
          </summary>
          <label className="mt-2 flex flex-wrap items-center gap-3">
            Sample data state
            <select
              className="min-h-11 rounded-lg border border-white/15 bg-[#242D42] px-3 text-sm"
              value={sampleState}
              onChange={(event) => {
                const value = event.target.value;
                if (
                  value === "ready" ||
                  value === "loading" ||
                  value === "empty" ||
                  value === "error"
                )
                  setSampleState(value);
              }}
            >
              <option value="ready">Ready</option>
              <option value="loading">Loading</option>
              <option value="empty">Empty</option>
              <option value="error">Error</option>
            </select>
          </label>
          <p className="mt-3" role="status">
            {savedIds.length} saved trucks · {bookings.length} booking previews
            completed in this page session.
          </p>
          {bookings.length > 0 && (
            <ul className="mt-2 space-y-2">
              {bookings.map((booking, index) => (
                <li key={index}>
                  {booking.truckName} · {booking.details.eventType} ·{" "}
                  {booking.details.date} · {booking.details.guests} guests
                </li>
              ))}
            </ul>
          )}
        </details>
      </div>
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
      {selectedTruck && (
        <>
          <div hidden={bookingOpen}>
            <DiscoverProfileView
              key={selectedTruck.id}
              truck={selectedTruck}
              saved={savedIds.includes(selectedTruck.id)}
              onSave={() => toggleSaved(selectedTruck)}
              onBack={() => setSelectedTruck(null)}
              onBook={() => setBookingOpen(true)}
            />
          </div>
          {bookingOpen && (
            <DiscoverBookingFlow
              truckName={selectedTruck.name}
              onBack={() => setBookingOpen(false)}
              onHome={() => {
                setBookingOpen(false);
                setSelectedTruck(null);
              }}
              onComplete={(details) =>
                setBookings((current) => [
                  ...current,
                  { truckName: selectedTruck.name, details },
                ])
              }
            />
          )}
        </>
      )}
    </div>
  );
}
