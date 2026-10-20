import { useReducer } from "react";
import { VendorFeedComposer } from "@/features/vendor/components/feed/VendorFeedComposer";
import { VendorFeedPostCard } from "@/features/vendor/components/feed/VendorFeedPostCard";
import { VendorFeedCommentsDialog } from "@/features/vendor/components/feed/VendorFeedCommentsDialog";
import {
  initialVendorFeedState,
  vendorFeedReducer,
} from "@/features/vendor/utils/feedState";
import "@/features/vendor/components/feed/feed.css";

export default function VendorFeedPage() {
  const [state, dispatch] = useReducer(
    vendorFeedReducer,
    undefined,
    initialVendorFeedState,
  );
  const selected = state.posts.find((post) => post.id === state.selectedPostId);
  const localPosts = state.posts.filter((post) => post.local).length;
  return (
    <div className="vendor-feed-page">
      <h1 className="sr-only">Vendor Feed — static preview</h1>
      <div className="vendor-feed-stream">
        <VendorFeedComposer
          onPost={(text) => dispatch({ type: "post", text, id: crypto.randomUUID() })}
        />
        <section aria-label="Sample Vendor feed posts">
          {state.posts.map((post) => (
            <VendorFeedPostCard
              key={post.id}
              post={post}
              onLike={() => dispatch({ type: "like-post", postId: post.id })}
              onComments={() => dispatch({ type: "open-comments", postId: post.id })}
            />
          ))}
        </section>
      </div>
      <p role="status" className="mt-4 max-w-[710px] text-xs leading-5 text-[#B8C1D1]">
        Local Vendor feed preview. Posts and reactions stay on this page; nothing is
        published online.
        {localPosts > 0
          ? ` ${localPosts} local post${localPosts === 1 ? "" : "s"} added.`
          : ""}
      </p>
      {selected && (
        <VendorFeedCommentsDialog
          key={selected.id}
          post={selected}
          draft={state.drafts[selected.id] ?? { text: "", replyTo: null }}
          dispatch={dispatch}
          onClose={() => dispatch({ type: "open-comments", postId: null })}
        />
      )}
    </div>
  );
}
