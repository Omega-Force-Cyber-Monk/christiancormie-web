import { MapPin } from "lucide-react";
import { useId, useState } from "react";
import { useAppSelector } from "@/app/hooks";
import { useDebounce } from "@/hooks/useDebounce";
import { useGetSocialPlacesQuery } from "@/features/social/api/socialFeed.api";
import { useGetMemberConnectionsQuery } from "@/features/social/api/socialProfile.api";
import { NoResultsState } from "@/components/states/NoResultsState";
import { ErrorState } from "@/components/states/ErrorState";
import { Button } from "@/components/ui/Button";
export function PostDetailsPicker({
  screen,
  locationId,
  friendIds,
  onLocation,
  onFriend,
}: {
  screen: "location" | "friends";
  locationId: string;
  friendIds: string[];
  onLocation: (id: string) => void;
  onFriend: (id: string) => void;
}) {
  const [search, setSearch] = useState("");
  const debounced = useDebounce(search);
  const [page, setPage] = useState({ search: "", offset: 0 });
  const offset = page.search === debounced ? page.offset : 0;
  const id = useId();
  const userId = useAppSelector((s) =>
    s.auth.isIdentityVerified ? s.auth.user?.id : undefined,
  );
  const places = useGetSocialPlacesQuery(
    { search: debounced, offset },
    { skip: screen !== "location" || !userId },
  );
  const following = useGetMemberConnectionsQuery(
    {
      userId: userId ?? "",
      direction: "following",
      search: debounced,
      offset,
      limit: 20,
    },
    { skip: screen !== "friends" || !userId },
  );
  const query = screen === "location" ? places : following;
  const more =
    screen === "location"
      ? places.currentData?.length === 20
      : following.currentData?.nextOffset != null;
  return (
    <div
      className={`post-picker ${screen === "friends" ? "post-picker--friends" : ""}`}
    >
      <label className="sr-only" htmlFor={id}>
        {screen === "location" ? "Search locations" : "Search friends"}
      </label>
      <input
        id={id}
        type="search"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder={
          screen === "location" ? "Search locations..." : "Search friends..."
        }
        className="post-search"
      />
      <div className="post-picker-list">
        {query.isLoading || (query.isFetching && !query.currentData) ? (
          <p role="status">Loading options…</p>
        ) : query.isError ? (
          <ErrorState onRetry={() => void query.refetch()} />
        ) : screen === "location" ? (
          places.currentData?.length ? (
            places.currentData.map((item) => (
              <button
                className="post-location-option"
                key={item.id}
                type="button"
                aria-pressed={locationId === item.id}
                onClick={() => onLocation(item.id)}
              >
                <span>
                  <MapPin size={22} aria-hidden="true" />
                </span>
                {item.name}
              </button>
            ))
          ) : (
            <NoResultsState />
          )
        ) : following.currentData?.items.length ? (
          following.currentData.items.map((item) => (
            <label className="post-friend-option" key={item.userId}>
              <span className="post-avatar">{item.displayName.slice(0, 2)}</span>
              <span className="flex-1">{item.displayName}</span>
              <input
                type="checkbox"
                disabled={!friendIds.includes(item.userId) && friendIds.length >= 20}
                checked={friendIds.includes(item.userId)}
                onChange={() => onFriend(item.userId)}
              />
            </label>
          ))
        ) : (
          <NoResultsState />
        )}
      </div>
      <div className="mt-4 flex gap-3">
        <Button
          disabled={offset === 0 || query.isFetching}
          onClick={() =>
            setPage({ search: debounced, offset: Math.max(0, offset - 20) })
          }
        >
          Previous options
        </Button>
        <Button
          disabled={!more || query.isFetching}
          onClick={() => setPage({ search: debounced, offset: offset + 20 })}
        >
          More options
        </Button>
      </div>
      {screen === "friends" && (
        <p className="mt-4 text-sm text-[#B8C1D1]" role="status">
          {friendIds.length} selected · Use Back to return to your draft.
        </p>
      )}
    </div>
  );
}
