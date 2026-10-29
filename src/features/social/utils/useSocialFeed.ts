import { useAppSelector } from "@/app/hooks";
import { useGetSocialFeedInfiniteQuery } from "../api/socialFeed.api";
import { socialActorAllowed } from "../api/socialProfile.api";
import { uniqueFeedPosts, toSocialCard } from "./feedAdapters";
export function useSocialFeed(audience: "following" | "explore") {
  const sessionId = useAppSelector((s) => s.auth.sessionId);
  const enabled = useAppSelector(socialActorAllowed);
  const query = useGetSocialFeedInfiniteQuery(
    { audience, sessionId: sessionId ?? "" },
    { skip: !enabled },
  );
  return {
    query,
    posts: uniqueFeedPosts(query.currentData?.pages ?? []).map(toSocialCard),
  };
}
