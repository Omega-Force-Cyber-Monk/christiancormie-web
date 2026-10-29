import { useId, useState } from "react";
import { useAppSelector } from "@/app/hooks";
import {
  socialActorAllowed,
  useGetMemberPostsQuery,
  type PostsQuery,
} from "../api/socialProfile.api";
import { Modal } from "@/components/overlays/Modal/Modal";
import { EmptyState } from "@/components/states/EmptyState";
import { ErrorState } from "@/components/states/ErrorState";
import { Button } from "@/components/ui/Button";
import { remoteMedia } from "@/utils/files/remoteMedia";
export function SocialPostsGallery({
  userId,
  tab,
  variant = "member",
}: {
  userId: string;
  tab: PostsQuery["tab"];
  variant?: "member" | "vendor";
}) {
  const allowed = useAppSelector(socialActorAllowed);
  const [cursors, setCursors] = useState<(string | undefined)[]>([undefined]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const id = useId();
  const query = useGetMemberPostsQuery(
    { userId, tab, cursor: cursors.at(-1) },
    { skip: !allowed },
  );
  const posts = query.currentData?.items ?? [];
  const selected = posts.find((p) => p.id === selectedId);
  const index = posts.findIndex((p) => p.id === selectedId);
  const move = (delta: number) => {
    const next = posts[(index + delta + posts.length) % posts.length];
    if (next) setSelectedId(next.id);
  };
  if (query.isLoading)
    return <p role="status">Loading {tab === "tagged" ? "tagged posts" : "posts"}…</p>;
  if (query.isError) return <ErrorState onRetry={() => void query.refetch()} />;
  return (
    <>
      {query.isFetching && <p role="status">Refreshing posts…</p>}
      {posts.length ? (
        <div
          className={
            variant === "vendor"
              ? "vendor-profile-gallery"
              : "member-profile-photo-grid"
          }
        >
          {posts.map((post) => {
            const media = post.media.find(
              (m) => m.mediaType === "IMAGE" && remoteMedia(m.mediaUrl),
            );
            return (
              <button
                type="button"
                key={post.id}
                data-post-id={post.id}
                className={variant === "member" ? "member-profile-photo" : undefined}
                aria-label={`View post by ${post.author?.displayName ?? "member"}`}
                onClick={() => setSelectedId(post.id)}
              >
                {media ? (
                  <img
                    src={remoteMedia(media.mediaUrl)}
                    alt={post.content || "Post image"}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span className="block p-4 text-sm">
                    {post.content || "Post without an image"}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      ) : (
        <EmptyState title={tab === "tagged" ? "No tagged posts" : "No posts yet"} />
      )}
      <div className="mt-4 flex gap-3">
        <Button
          disabled={cursors.length === 1 || query.isFetching}
          onClick={() => {
            setCursors((c) => c.slice(0, -1));
            setSelectedId(null);
          }}
        >
          Previous posts
        </Button>
        <Button
          disabled={!query.currentData?.nextCursor || query.isFetching}
          onClick={() => {
            const next = query.currentData?.nextCursor;
            if (next) setCursors((c) => [...c, next]);
            setSelectedId(null);
          }}
        >
          Next posts
        </Button>
      </div>
      <Modal
        isOpen={Boolean(selected)}
        onClose={() => setSelectedId(null)}
        titleId={id}
      >
        {selected && (
          <div
            className="overflow-y-auto p-6 pt-12"
            onKeyDown={(e) => {
              if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
                e.preventDefault();
                move(e.key === "ArrowLeft" ? -1 : 1);
              }
            }}
          >
            <h2 id={id} className="mb-4 text-xl font-semibold">
              Post by {selected.author?.displayName ?? "Member"}
            </h2>
            {selected.media.map((media) =>
              media.mediaType === "IMAGE" && remoteMedia(media.mediaUrl) ? (
                <img
                  key={media.id}
                  src={remoteMedia(media.mediaUrl)}
                  alt={selected.content || "Post image"}
                  className="max-h-[65dvh] w-full rounded-xl object-contain"
                />
              ) : null,
            )}
            <p className="mt-3">{selected.content}</p>
            <p className="mt-2 text-xs">
              {Number.isNaN(Date.parse(selected.createdAt))
                ? "Date unavailable"
                : new Date(selected.createdAt).toLocaleString("en-US", {
                    timeZone: "UTC",
                  })}{" "}
              UTC
            </p>
            <div className="mt-4 flex gap-3">
              <Button disabled={posts.length < 2} onClick={() => move(-1)}>
                Previous photo/post
              </Button>
              <Button disabled={posts.length < 2} onClick={() => move(1)}>
                Next photo/post
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}
