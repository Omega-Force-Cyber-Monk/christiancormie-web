import { useEffect, useReducer, useRef } from "react";
import { useSearchParams } from "react-router";
import { ConfirmationDialog } from "@/components/overlays/ConfirmationDialog/ConfirmationDialog";
import { useConfirmation } from "@/components/overlays/ConfirmationDialog/useConfirmation";
import { VendorPostCategoryPicker } from "@/features/vendor/components/create-posts/VendorPostCategoryPicker";
import { VendorCommunityPostForm } from "@/features/vendor/components/create-posts/VendorCommunityPostForm";
import { VendorTruckRequestForm } from "@/features/vendor/components/create-posts/VendorTruckRequestForm";
import { VendorPostReview } from "@/features/vendor/components/create-posts/VendorPostReview";
import { getVendorPostCategory } from "@/features/vendor/data/create-posts.data";
import {
  initialVendorCreatePostState,
  vendorCreatePostReducer,
} from "@/features/vendor/utils/createPostsState";
import "@/features/vendor/components/create-posts/create-posts.css";

export default function VendorCreatePostPage() {
  const [params, setParams] = useSearchParams();
  const category = getVendorPostCategory(params.get("category"));
  const [state, dispatch] = useReducer(
    vendorCreatePostReducer,
    undefined,
    initialVendorCreatePostState,
  );
  const { confirm, confirmationProps } = useConfirmation();
  const region = useRef<HTMLDivElement>(null);
  const mounted = useRef(false);
  const success =
    state.success &&
    category?.id ===
      (state.success.kind === "truck" ? "truck" : state.success.values.category)
      ? state.success
      : null;
  useEffect(() => {
    if (mounted.current) region.current?.focus();
    mounted.current = true;
  }, [category?.id, success]);
  const toPicker = () => {
    const next = new URLSearchParams(params);
    next.delete("category");
    setParams(next);
  };
  return (
    <div className="vendor-create-post-page">
      <div tabIndex={-1} ref={region} className="outline-none">
        {category && success ? (
          <VendorPostReview
            post={success}
            onEdit={() => dispatch({ type: "edit" })}
            onNew={() => {
              dispatch({ type: "reset", category: category.id });
              toPicker();
            }}
          />
        ) : category?.id === "truck" ? (
          <VendorTruckRequestForm
            draft={state.truckDraft}
            onDraft={(values) => dispatch({ type: "truck-draft", values })}
            onBack={(values) => {
              dispatch({ type: "truck-draft", values });
              toPicker();
            }}
            onCancel={(values) => {
              const discard = () => {
                dispatch({ type: "reset", category: "truck" });
                toPicker();
              };
              if (
                Object.entries(values).some(([, value]) =>
                  Array.isArray(value) ? value.length > 0 : !!value.trim(),
                )
              )
                confirm({
                  title: "Discard this truck request?",
                  description:
                    "This clears the local truck request draft. Your other category drafts are kept.",
                  confirmText: "Discard draft",
                  variant: "danger",
                  onConfirm: discard,
                });
              else discard();
            }}
            onSubmit={(values) =>
              dispatch({
                type: "save",
                post: { id: crypto.randomUUID(), kind: "truck", values, files: [] },
              })
            }
          />
        ) : category ? (
          <VendorCommunityPostForm
            key={category.id}
            category={category.id}
            heading={category.heading}
            draft={state.generalDrafts[category.id]}
            files={state.files[category.id] ?? []}
            onFiles={(files) =>
              dispatch({ type: "files", category: category.id, files })
            }
            onDraft={(values) => dispatch({ type: "general-draft", values })}
            onBack={(values) => {
              dispatch({ type: "general-draft", values });
              toPicker();
            }}
            onSubmit={(values) =>
              dispatch({
                type: "save",
                post: {
                  id: crypto.randomUUID(),
                  kind: "general",
                  values,
                  files: state.files[category.id] ?? [],
                },
              })
            }
          />
        ) : (
          <>
            <VendorPostCategoryPicker
              onSelect={(id) => {
                dispatch({ type: "edit" });
                const next = new URLSearchParams(params);
                next.set("category", id);
                setParams(next);
              }}
            />
            {params.has("category") && (
              <p role="status" className="mt-5 text-sm text-[#B8C1D1]">
                That category is unavailable. Choose a category above.
              </p>
            )}
            {state.posts.length > 0 && (
              <p className="mt-5 text-sm text-[#B8C1D1]">
                {state.posts.length} {state.posts.length === 1 ? "post" : "posts"} saved
                in this local preview.
              </p>
            )}
          </>
        )}
      </div>
      {confirmationProps && <ConfirmationDialog {...confirmationProps} />}
    </div>
  );
}
