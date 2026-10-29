import { USER_ROLES } from "@/constants/roles";
import { Filter, Search, TrendingUp } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { skipToken } from "@reduxjs/toolkit/query";
import { useAppSelector } from "@/app/hooks";
import {
  selectCurrentRole,
  selectIsAuthenticated,
} from "@/features/auth/store/auth.selectors";
import { EmptyState } from "@/components/states/EmptyState";
import { ErrorState } from "@/components/states/ErrorState";
import { Skeleton } from "@/components/states/Skeleton";
import { Button } from "@/components/ui/Button";
import { DiscoverFiltersDrawer } from "@/features/customer/components/discover/DiscoverFiltersDrawer";
import { DiscoverTruckCard } from "@/features/customer/components/discover/DiscoverTruckCard";
import { DiscoverProfileView } from "@/features/customer/components/discover/DiscoverProfileView";
import {
  useGetDiscoveryCuisinesQuery,
  useGetDiscoveryFavoritesQuery,
  useGetNearbyTrucksQuery,
  useGetTrendingTrucksQuery,
} from "@/features/customer/api/discovery.api";
import {
  defaultDiscoverFilters,
  getDiscoverFilterCount,
  type DiscoverFilters,
} from "@/features/customer/utils/discoverFilters";
import {
  discoveryQuery,
  KM_PER_MILE,
  toDiscoveryCard,
  toFavoriteCard,
  validCoordinates,
} from "@/features/customer/utils/discoveryAdapters";
import type { Coordinates } from "@/features/customer/types/discovery.types";
import { useDebounce } from "@/hooks/useDebounce";

export default function CustomerDiscoverPage() {
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<DiscoverFilters>(defaultDiscoverFilters);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [slug, setSlug] = useState<string | null>(null);
  const [coordinates, setCoordinates] = useState<Coordinates | null>(null);
  const [locationState, setLocationState] = useState("Location has not been shared.");
  const [locating, setLocating] = useState(false);
  const [limit, setLimit] = useState(20);
  const mounted = useRef(false);
  const locatingRef = useRef(false);
  const pageRef = useRef<HTMLDivElement>(null);
  const hadProfile = useRef(false);
  const authenticated = useAppSelector(selectIsAuthenticated);
  const role = useAppSelector(selectCurrentRole);
  const allowed = authenticated && role === USER_ROLES.CUSTOMER;
  const debounced = useDebounce(search);
  const params = discoveryQuery(debounced, filters, limit);
  const trending = useGetTrendingTrucksQuery(allowed ? params : skipToken);
  const nearby = useGetNearbyTrucksQuery(
    allowed && validCoordinates(coordinates)
      ? {
          ...params,
          ...coordinates,
          radiusKm: filters.distance === null ? 10 : filters.distance * KM_PER_MILE,
        }
      : skipToken,
  );
  const cuisines = useGetDiscoveryCuisinesQuery(undefined, { skip: !allowed });
  const favorites = useGetDiscoveryFavoritesQuery(undefined, { skip: !allowed });
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);
  useEffect(() => {
    if (slug) {
      pageRef.current?.querySelector<HTMLElement>(".discover-profile-view h1")?.focus();
      hadProfile.current = true;
    } else if (hadProfile.current) {
      pageRef.current?.querySelector<HTMLElement>("#discover-search")?.focus();
      hadProfile.current = false;
    }
  }, [slug]);
  function requestLocation() {
    if (locatingRef.current) return;
    if (!navigator.geolocation) {
      setLocationState(
        "Location is unavailable in this browser. Trending remains available.",
      );
      return;
    }
    locatingRef.current = true;
    setLocating(true);
    setLocationState("Waiting for location permission…");
    navigator.geolocation.getCurrentPosition(
      (position) => {
        locatingRef.current = false;
        if (!mounted.current) return;
        const next = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        };
        setLocating(false);
        if (validCoordinates(next)) {
          setCoordinates(next);
          setLocationState("Using the location you shared for nearby searches.");
        } else setLocationState("Valid coordinates were not provided.");
      },
      () => {
        locatingRef.current = false;
        if (mounted.current) {
          setLocating(false);
          setLocationState(
            "Location could not be shared. Try again or browse trending trucks.",
          );
        }
      },
      { enableHighAccuracy: false, timeout: 15000, maximumAge: 60000 },
    );
  }
  function results(query: typeof trending, suggested = false) {
    if (query.isLoading || query.isUninitialized)
      return (
        <div role="status">
          <p>Loading food trucks…</p>
          <Skeleton className="h-40" />
        </div>
      );
    if (query.isError && !query.currentData)
      return <ErrorState onRetry={() => void query.refetch()} />;
    return (
      <>
        {query.isFetching && <p role="status">Refreshing food trucks…</p>}
        {query.isError && <ErrorState onRetry={() => void query.refetch()} />}
        {query.currentData?.foodTrucks.length ? (
          <div
            className={
              suggested
                ? "space-y-4"
                : "-mt-2 flex snap-x gap-2.5 overflow-x-auto pt-2 pb-3"
            }
          >
            {query.currentData.foodTrucks.map((dto) => (
              <DiscoverTruckCard
                key={dto.id}
                truck={toDiscoveryCard(dto)}
                suggested={suggested}
                onView={(truck) => setSlug(truck.slug)}
              />
            ))}
          </div>
        ) : (
          <EmptyState
            title={suggested ? "No nearby trucks found" : "No trending trucks found"}
            description="Try changing your search or filters."
          />
        )}
      </>
    );
  }
  return (
    <div className="discover-page" ref={pageRef}>
      <div hidden={slug !== null}>
        <h1 className="sr-only">Discover food trucks</h1>
        <div className="flex items-center gap-4">
          <div className="relative min-w-0 flex-1">
            <Search
              aria-hidden="true"
              className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-[var(--text-muted)]"
              size={20}
            />
            <label className="sr-only" htmlFor="discover-search">
              Search truck names
            </label>
            <input
              id="discover-search"
              className="h-[52px] w-full rounded-2xl border border-white/10 bg-transparent pr-4 pl-11 text-base text-white placeholder:text-[var(--text-muted)]"
              type="search"
              maxLength={100}
              placeholder="Search truck names..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setLimit(20);
              }}
            />
          </div>
          <button
            aria-label={`Filter trucks (${getDiscoverFilterCount(filters)} active)`}
            aria-expanded={filtersOpen}
            aria-haspopup="dialog"
            className="relative grid size-12 shrink-0 place-items-center rounded-xl border border-white/15 bg-[#FF5733] text-[#121826]"
            onClick={() => setFiltersOpen(true)}
            type="button"
          >
            <Filter size={24} />
          </button>
        </div>
        <Button
          variant="ghost"
          onClick={() => {
            setSearch("");
            setFilters(defaultDiscoverFilters);
            setLimit(20);
          }}
        >
          Clear search and filters
        </Button>
        <div className="mt-7 grid items-start gap-7 xl:grid-cols-[minmax(0,584fr)_minmax(0,438fr)] xl:gap-11">
          <section
            aria-label="Food truck map"
            className="relative flex aspect-[584/394.349] flex-col items-center justify-center gap-4 overflow-hidden rounded-2xl border-2 border-[#121826] bg-[var(--surface)] p-6 text-center"
          >
            <h2 className="font-semibold">Map unavailable</h2>
            <p className="text-sm text-[var(--text-muted)]">
              A geographic map provider has not been connected. Nearby results use only
              the location you choose to share.
            </p>
            <Button disabled={locating} onClick={requestLocation}>
              {locating ? "Locating…" : "Use my location"}
            </Button>
            <p role="status" className="text-sm">
              {locationState}
            </p>
            {coordinates && (
              <Button
                variant="ghost"
                onClick={() => {
                  setCoordinates(null);
                  setLocationState("Location cleared.");
                }}
              >
                Clear location
              </Button>
            )}
          </section>
          <section aria-labelledby="discover-suggested-title">
            <h2
              id="discover-suggested-title"
              className="mb-4 text-base leading-6 font-semibold"
            >
              Nearby food trucks
            </h2>
            {coordinates ? (
              results(nearby, true)
            ) : (
              <EmptyState
                title="Share location to see nearby trucks"
                description="Trending trucks are available without sharing location."
              />
            )}
            {coordinates && (
              <p className="mt-3 text-xs">
                Within {filters.distance === null ? "10 km" : `${filters.distance} mi`};
                up to {limit} closest matches.
              </p>
            )}
          </section>
        </div>
        <section
          aria-labelledby="discover-trending-title"
          className="mt-[33px] sm:pl-4"
        >
          <h2
            id="discover-trending-title"
            className="mb-4 flex items-center gap-2 text-xl leading-7 font-semibold"
          >
            <TrendingUp aria-hidden="true" className="text-[#2ED3D1]" size={24} />
            Trending food trucks
          </h2>
          {results(trending)}
          <p className="mt-3 text-xs text-[var(--text-muted)]">
            Showing up to {limit} results. Distance filters apply to nearby results
            only.
          </p>
          {limit < 100 && (
            <Button onClick={() => setLimit((n) => Math.min(100, n + 20))}>
              Load a larger result set
            </Button>
          )}
        </section>
        <section className="mt-8" aria-labelledby="discovery-saved-title">
          <h2 id="discovery-saved-title" className="mb-4 text-lg font-semibold">
            Saved or followed trucks
          </h2>
          <p className="mb-3 text-sm text-[var(--text-muted)]">
            This list combines saved and followed trucks. Their individual saved and
            follow states are unavailable until an action is confirmed.
          </p>
          {favorites.isLoading ? (
            <p role="status">Loading saved or followed trucks…</p>
          ) : favorites.isError ? (
            <ErrorState onRetry={() => void favorites.refetch()} />
          ) : favorites.currentData?.items.length ? (
            <div className="flex gap-3 overflow-x-auto">
              {favorites.currentData.items.map((t) => (
                <DiscoverTruckCard
                  key={t.id}
                  truck={toFavoriteCard(t)}
                  onView={(t) => setSlug(t.slug)}
                />
              ))}
            </div>
          ) : (
            <EmptyState title="No saved or followed trucks" />
          )}
        </section>
      </div>
      {filtersOpen && (
        <DiscoverFiltersDrawer
          filters={filters}
          cuisines={cuisines.currentData ?? []}
          cuisineError={cuisines.isError}
          cuisinesLoading={cuisines.isLoading}
          onRetryCuisines={() => void cuisines.refetch()}
          onClose={() => setFiltersOpen(false)}
          onApply={(next) => {
            setFilters(next);
            setLimit(20);
            setFiltersOpen(false);
          }}
        />
      )}
      {slug && (
        <DiscoverProfileView key={slug} slug={slug} onBack={() => setSlug(null)} />
      )}
    </div>
  );
}
