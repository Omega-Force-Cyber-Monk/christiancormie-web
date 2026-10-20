import { MapPin } from "lucide-react";
import { useId, useState } from "react";
import { NoResultsState } from "@/components/states/NoResultsState";
import {
  checkInLocations,
  tagFriends,
} from "@/features/customer/data/create-post.data";
import { filterPostOptions } from "@/features/customer/utils/createPost";

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
  const [query, setQuery] = useState("");
  const searchId = useId();
  const locations = filterPostOptions(checkInLocations, query);
  const friends = filterPostOptions(tagFriends, query);
  return (
    <div
      className={`post-picker ${screen === "friends" ? "post-picker--friends" : ""}`}
    >
      <label className="sr-only" htmlFor={searchId}>
        {screen === "location" ? "Search locations" : "Search friends"}
      </label>
      <input
        id={searchId}
        type="search"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder={
          screen === "location" ? "Search locations..." : "Search friends..."
        }
        className="post-search"
      />
      <div className="post-picker-list">
        {screen === "location" ? (
          locations.length ? (
            locations.map((item) => (
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
        ) : friends.length ? (
          friends.map((friend) => (
            <label className="post-friend-option" key={friend.id}>
              <span className="post-avatar">{friend.initials}</span>
              <span className="flex-1">{friend.name}</span>
              <input
                type="checkbox"
                checked={friendIds.includes(friend.id)}
                onChange={() => onFriend(friend.id)}
              />
            </label>
          ))
        ) : (
          <NoResultsState />
        )}
      </div>
      {screen === "friends" && (
        <p className="mt-4 text-sm text-[#B8C1D1]" role="status">
          {friendIds.length} selected · Use Back to return to your draft.
        </p>
      )}
    </div>
  );
}
