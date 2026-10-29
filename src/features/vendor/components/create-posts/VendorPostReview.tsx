import { CheckCircle2 } from "lucide-react";
import { FilePreview } from "@/components/forms/FileUpload/FilePreview";
import { getVendorPostCategory } from "@/features/vendor/data/create-posts.data";
import type { LocalVendorPost } from "@/features/vendor/utils/createPostsState";
import type { CommunityPost } from "@/features/community/schemas/community.schema";
import { remoteMedia } from "@/utils/files/remoteMedia";
import { CommunityPostInteractions } from "@/features/community/components/CommunityPostInteractions";

export function VendorPostReview({
  post,
  onEdit,
  onNew,
  remote,
  rewardStatus,
  editable = false,
  onDelete,
  interactive = false,
}: {
  post?: LocalVendorPost;
  onEdit: () => void;
  onNew: () => void;
  remote?: CommunityPost;
  rewardStatus?: string;
  editable?: boolean;
  onDelete?: () => void;
  interactive?: boolean;
}) {
  if (remote)
    return (
      <section className="vendor-post-review">
        <CheckCircle2 className="mb-5 text-[#2ED3D1]" size={36} aria-hidden="true" />
        <h1 className="text-xl font-semibold">Community post saved</h1>
        <p role="status" className="my-4 text-sm leading-6 text-[#B8C1D1]">
          The saved backend record is shown below.
          {rewardStatus ? ` Reward status: ${rewardStatus}.` : ""}
        </p>
        <h2 className="mb-3 text-lg font-semibold">{remote.title}</h2>
        <p className="whitespace-pre-wrap text-sm leading-6">{remote.description}</p>
        {remote.media?.length ? (
          <ul className="mt-5 space-y-3" aria-label="Published attachments">
            {remote.media.map((item) => {
              const url = remoteMedia(item.mediaUrl);
              return url ? (
                <li key={item.id} className="flex items-center gap-3">
                  <a
                    href={url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-sm underline"
                  >
                    {item.mediaType === "IMAGE" ? (
                      <img
                        src={url}
                        alt="Published Community attachment"
                        className="max-h-48 rounded-xl object-contain"
                      />
                    ) : (
                      "View saved PDF attachment"
                    )}
                  </a>
                </li>
              ) : null;
            })}
          </ul>
        ) : null}
        <p className="mt-4 text-xs text-[#B8C1D1]">
          {remote.category} · {remote.status}
        </p>
        {interactive && <CommunityPostInteractions post={remote} />}
        <div className="mt-7 grid gap-3 sm:grid-cols-2">
          <button
            className="vendor-post-secondary"
            type="button"
            disabled={!editable}
            onClick={onEdit}
          >
            Edit post
          </button>
          <button className="vendor-post-submit" type="button" onClick={onNew}>
            Create another post
          </button>
          {onDelete && (
            <button className="vendor-post-secondary" type="button" onClick={onDelete}>
              Delete post
            </button>
          )}
        </div>
      </section>
    );
  if (!post) return null;
  const category = getVendorPostCategory(
    post.kind === "truck" ? "truck" : post.values.category,
  );
  return (
    <section className="vendor-post-review">
      <CheckCircle2 className="mb-5 text-[#2ED3D1]" size={36} aria-hidden="true" />
      <h1 className="text-xl font-semibold">
        {post.kind === "truck" ? "Truck request" : "Post"} saved in this preview
      </h1>
      <p role="status" className="my-4 text-sm leading-6 text-[#B8C1D1]">
        Nothing has been published or sent. This local copy is available while this page
        remains open.
      </p>
      <p className="mb-3 text-sm font-semibold text-[#2ED3D1]">{category?.title}</p>
      {post.kind === "general" && post.values.title && (
        <h2 className="mb-3 text-lg font-semibold">{post.values.title}</h2>
      )}
      <p className="whitespace-pre-wrap text-sm leading-6">{post.values.description}</p>
      {post.kind === "truck" && (
        <>
          <dl className="my-5 grid gap-4 text-sm sm:grid-cols-2">
            {[
              ["Event type", post.values.eventType],
              ["Event date", post.values.date],
              ["Event time", post.values.time],
              ["Location", post.values.location],
              ["Expected guests", post.values.guests],
              ["Budget range", post.values.budget],
            ].map(([label, value]) => (
              <div key={label}>
                <dt className="mb-1 text-[#B8C1D1]">{label}</dt>
                <dd>{value}</dd>
              </div>
            ))}
          </dl>
          <h2 className="mb-2 text-sm font-semibold">Preferred menu items</h2>
          {post.values.menus.length ? (
            <ul className="flex flex-wrap gap-2">
              {post.values.menus.map((menu) => (
                <li
                  key={menu}
                  className="rounded-full border border-[#343C4C] px-3 py-1 text-xs"
                >
                  {menu}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-[#B8C1D1]">No menu preferences selected.</p>
          )}
        </>
      )}
      {post.files.length > 0 && (
        <ul className="mt-5 space-y-3" aria-label="Local attachments">
          {post.files.map((item) => (
            <li key={item.id} className="flex items-center gap-3">
              <FilePreview file={item.file} />
              <span className="min-w-0 truncate text-sm">{item.file.name}</span>
            </li>
          ))}
        </ul>
      )}
      <div className="mt-7 grid gap-3 sm:grid-cols-2">
        <button className="vendor-post-secondary" type="button" onClick={onEdit}>
          Edit draft
        </button>
        <button className="vendor-post-submit" type="button" onClick={onNew}>
          Create another post
        </button>
      </div>
    </section>
  );
}
