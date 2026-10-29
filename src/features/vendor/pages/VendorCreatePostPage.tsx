import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router";
import { useAppSelector } from "@/app/hooks";
import {
  selectCurrentRole,
  selectIsAuthenticated,
} from "@/features/auth/store/auth.selectors";
import { ConfirmationDialog } from "@/components/overlays/ConfirmationDialog/ConfirmationDialog";
import { useConfirmation } from "@/components/overlays/ConfirmationDialog/useConfirmation";
import { VendorPostCategoryPicker } from "@/features/vendor/components/create-posts/VendorPostCategoryPicker";
import { VendorCommunityPostForm } from "@/features/vendor/components/create-posts/VendorCommunityPostForm";
import { VendorTruckRequestForm } from "@/features/vendor/components/create-posts/VendorTruckRequestForm";
import { VendorPostReview } from "@/features/vendor/components/create-posts/VendorPostReview";
import {
  getVendorPostCategory,
  type GeneralPostCategory,
} from "@/features/vendor/data/create-posts.data";
import {
  emptyTruckPost,
  type GeneralPostValues,
  type TruckPostValues,
} from "@/features/vendor/schemas/create-posts.schema";
import type { FileUploadItemValue } from "@/components/forms/FileUpload/file-upload.types";
import type { CommunityComposerValues } from "@/features/customer/schemas/community.schema";
import {
  communityScope,
  useGetCommunityPostQuery,
} from "@/features/community/api/community.api";
import {
  useCommunityPublisher,
  useCommunityPublishing,
} from "@/features/community/utils/useCommunityPublishing";
import {
  composerFromPost,
  composerPatch,
  composerPayload,
} from "@/features/community/utils/communityPublishing";
import {
  vendorGeneralComposer,
  vendorTruckComposer,
  vendorCommunityCategories,
} from "@/features/community/utils/vendorCommunityPublishing";
import { useCommunityPostManagement } from "@/features/community/utils/useCommunityPostManagement";
import { CommunityPublishingFeedback } from "@/features/community/components/CommunityPublishingFeedback";
import { CommunityReadStates } from "@/features/customer/components/community/CommunityReadStates";
import { Button } from "@/components/ui/Button";
import "@/features/vendor/components/create-posts/create-posts.css";

export default function VendorCreatePostPage() {
  const scope = useAppSelector(communityScope);
  const role = useAppSelector(selectCurrentRole);
  const authenticated = useAppSelector(selectIsAuthenticated);
  return authenticated && role === "VENDOR" ? (
    <VendorPublishingWorkspace
      key={`${scope.sessionId}:${scope.userId}:${scope.role}`}
    />
  ) : (
    <p role="status">A verified Vendor session is required.</p>
  );
}
function VendorPublishingWorkspace() {
  const [params, setParams] = useSearchParams();
  const selectedCategory = getVendorPostCategory(params.get("category"));
  const publisher = useCommunityPublisher();
  const publication = useCommunityPublishing();
  const [general, setGeneral] = useState<
    Partial<Record<GeneralPostCategory, GeneralPostValues>>
  >({});
  const [truck, setTruck] = useState<TruckPostValues>(emptyTruckPost);
  const [files, setFiles] = useState<
    Partial<Record<GeneralPostCategory, FileUploadItemValue[]>>
  >({});
  const [postId, setPostId] = useState("");
  const [editing, setEditing] = useState(false);
  const [rewardStatus, setRewardStatus] = useState<string | undefined>();
  const baseline = useRef<CommunityComposerValues | null>(null);
  const [editGeneral, setEditGeneral] = useState<GeneralPostValues | undefined>();
  const [editTruck, setEditTruck] = useState<TruckPostValues | undefined>();
  const detail = useGetCommunityPostQuery(
    { ...publisher.scope, postId },
    { skip: !postId },
  );
  const post = detail.error ? undefined : detail.currentData?.post;
  const category = post
    ? getVendorPostCategory(vendorCommunityCategories[post.category])
    : selectedCategory;
  const management = useCommunityPostManagement(post, () => {
    setPostId("");
    setEditing(false);
  });
  const confirmation = useConfirmation();
  const region = useRef<HTMLDivElement>(null);
  const mounted = useRef(false);
  useEffect(() => {
    if (mounted.current) region.current?.focus();
    mounted.current = true;
  }, [category?.id, postId, editing]);
  function picker() {
    const next = new URLSearchParams(params);
    next.delete("category");
    setParams(next);
  }
  function edit() {
    if (!post || !management.canEdit) return;
    const values = composerFromPost(post);
    baseline.current = values;
    if (category?.id === "truck")
      setEditTruck({
        eventType: values.eventType,
        date: values.date,
        time: values.time,
        location: values.location,
        guests: values.guests,
        budget: values.budget,
        description: values.body,
        menus: values.menus,
      });
    else if (category)
      setEditGeneral({
        category: category.id,
        title: values.itemName,
        description: values.body,
      });
    if (category && category.id !== "truck")
      setFiles((current) => ({ ...current, [category.id]: [] }));
    setEditing(true);
  }
  async function save(
    values: CommunityComposerValues,
    selected: FileUploadItemValue[],
  ) {
    const body =
      editing && baseline.current
        ? composerPatch(baseline.current, values, selected.length > 0)
        : composerPayload(values);
    const result = await publication.publish(
      body,
      selected.map((item) => item.file),
      editing ? postId : undefined,
    );
    if (result && publication.isCurrent()) {
      setPostId(result.id);
      setRewardStatus(result.rewardStatus);
      setEditing(false);
      if (category && category.id !== "truck")
        setFiles((current) => ({ ...current, [category.id]: [] }));
    }
  }
  const blocked =
    !publisher.allowed ||
    (publication.uncertain && !publication.reviewed) ||
    (editing && !management.canEdit);
  const categoryId = category && category.id !== "truck" ? category.id : undefined;
  return (
    <div className="vendor-create-post-page">
      <div tabIndex={-1} ref={region} className="outline-none">
        {!publisher.allowed && (
          <div role="status" className="mb-5 text-sm text-[#B8C1D1]">
            Publishing requires a matching active vendor profile with onboarding
            completed. Drafts remain available.
            <Button
              disabled={publisher.vendor.isUninitialized || publisher.vendor.isFetching}
              onClick={() => void publisher.vendor.refetch()}
            >
              Retry eligibility
            </Button>
          </div>
        )}
        {postId && !editing ? (
          <>
            <CommunityReadStates
              detail
              loading={detail.isLoading}
              fetching={detail.isFetching}
              error={detail.error}
              empty={!post}
              onRetry={() => void detail.refetch()}
            />
            {post && (
              <VendorPostReview
                interactive
                remote={post}
                rewardStatus={rewardStatus}
                editable={management.canEdit && !detail.isFetching}
                onDelete={
                  management.canDelete && !detail.isFetching
                    ? management.requestDelete
                    : undefined
                }
                onEdit={edit}
                onNew={() => {
                  setPostId("");
                  setEditing(false);
                  if (category?.id === "truck") setTruck(emptyTruckPost());
                  else if (categoryId)
                    setGeneral((current) => ({ ...current, [categoryId]: undefined }));
                  picker();
                }}
              />
            )}
          </>
        ) : category?.id === "truck" ? (
          <VendorTruckRequestForm
            key={editing ? `${postId}:edit` : "new-truck"}
            integrated
            editing={editing}
            pending={publication.pending}
            serverError={publication.serverError}
            disabled={blocked}
            draft={editing ? editTruck : truck}
            onDraft={(values) => (editing ? setEditTruck(values) : setTruck(values))}
            onBack={(values) => {
              if (editing) {
                setEditTruck(values);
                setEditing(false);
              } else {
                setTruck(values);
                picker();
              }
            }}
            onCancel={(values) => {
              confirmation.confirm({
                title: "Discard this truck request draft?",
                description: "Only the current unsaved draft will be cleared.",
                confirmText: "Discard draft",
                variant: "danger",
                onConfirm: () => {
                  if (editing) {
                    setEditing(false);
                  } else {
                    setTruck(emptyTruckPost());
                    picker();
                  }
                },
              });
              if (!editing) setTruck(values);
            }}
            onSubmit={(values) => save(vendorTruckComposer(values), [])}
          />
        ) : category && categoryId ? (
          <VendorCommunityPostForm
            key={editing ? `${postId}:edit` : categoryId}
            integrated
            editing={editing}
            pending={publication.pending}
            serverError={publication.serverError}
            disabled={blocked}
            category={categoryId}
            heading={category.heading}
            draft={editing ? editGeneral : general[categoryId]}
            files={files[categoryId] ?? []}
            onFiles={(items) =>
              setFiles((current) => ({ ...current, [categoryId]: items }))
            }
            onDraft={(values) =>
              editing
                ? setEditGeneral(values)
                : setGeneral((current) => ({ ...current, [categoryId]: values }))
            }
            onBack={(values) => {
              if (editing) {
                setEditGeneral(values);
                setEditing(false);
              } else {
                setGeneral((current) => ({ ...current, [categoryId]: values }));
                picker();
              }
            }}
            onSubmit={(values) =>
              save(vendorGeneralComposer(values), files[categoryId] ?? [])
            }
          />
        ) : (
          <>
            <VendorPostCategoryPicker
              onSelect={(id) => {
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
          </>
        )}
        <CommunityPublishingFeedback publication={publication} />
      </div>
      {confirmation.confirmationProps && (
        <ConfirmationDialog {...confirmation.confirmationProps} />
      )}
      {management.confirmationProps && (
        <ConfirmationDialog {...management.confirmationProps} />
      )}
    </div>
  );
}
