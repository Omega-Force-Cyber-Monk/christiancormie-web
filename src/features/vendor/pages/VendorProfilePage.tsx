import { Grid3X3, MessageSquare, Utensils } from "lucide-react";
import { useEffect, useId, useReducer, useRef } from "react";
import { useSearchParams } from "react-router";
import { ConfirmationDialog } from "@/components/overlays/ConfirmationDialog/ConfirmationDialog";
import { useConfirmation } from "@/components/overlays/ConfirmationDialog/useConfirmation";
import { VendorProfileSummary } from "@/features/vendor/components/profile/VendorProfileSummary";
import { VendorProfileMenu } from "@/features/vendor/components/profile/VendorProfileMenu";
import {
  VendorProfileGallery,
  VendorProfileReviews,
} from "@/features/vendor/components/profile/VendorProfileContent";
import { VendorProfileEditor } from "@/features/vendor/components/profile/VendorProfileEditor";
import { VendorMenuItemDialog } from "@/features/vendor/components/profile/VendorMenuItemDialog";
import { VendorProfileLightbox } from "@/features/vendor/components/profile/VendorProfileLightbox";
import {
  initialVendorProfileState,
  parseVendorProfileTab,
  vendorProfileReducer,
  type VendorProfileTab,
} from "@/features/vendor/utils/profileState";
import "@/features/vendor/components/profile/profile.css";
const tabs = [
  { id: "menu", label: "Menu", Icon: Utensils },
  { id: "gallery", label: "Gallery", Icon: Grid3X3 },
  { id: "reviews", label: "Reviews", Icon: MessageSquare },
] as const;
export default function VendorProfilePage() {
  const id = useId();
  const [params, setParams] = useSearchParams();
  const tab = parseVendorProfileTab(params.get("tab"));
  const [state, dispatch] = useReducer(
    vendorProfileReducer,
    undefined,
    initialVendorProfileState,
  );
  const region = useRef<HTMLDivElement>(null);
  const mounted = useRef(false);
  const { confirm, confirmationProps } = useConfirmation();
  useEffect(() => {
    if (mounted.current) region.current?.focus();
    mounted.current = true;
  }, [state.editing]);
  const selectTab = (value: VendorProfileTab) => {
    const next = new URLSearchParams(params);
    if (value === "menu") next.delete("tab");
    else next.set("tab", value);
    setParams(next);
  };
  const dialog = state.menuDialog;
  const selectedMenuItem =
    dialog && dialog !== "new"
      ? state.menu.find((item) => item.id === dialog.id)
      : undefined;
  return (
    <section
      className={`vendor-profile-page${state.editing ? " vendor-profile-page--editing" : ""}`}
    >
      <div ref={region} tabIndex={-1} className="outline-none">
        {state.editing ? (
          <VendorProfileEditor
            draft={state.draft}
            photo={state.draftPhoto}
            onPhoto={(source) => dispatch({ type: "draft-photo", source })}
            onDraft={(values) => dispatch({ type: "profile-draft", values })}
            onBack={(values) => {
              dispatch({ type: "profile-draft", values });
              dispatch({ type: "edit-profile", open: false });
            }}
            onSave={(values) => dispatch({ type: "save-profile", values })}
          />
        ) : (
          <div className={`vendor-profile-surface vendor-profile-surface--${tab}`}>
            <VendorProfileSummary
              values={state.values}
              photo={state.photo}
              compact={tab === "reviews"}
              onEdit={() => dispatch({ type: "edit-profile", open: true })}
            />
            <div
              className="vendor-profile-tabs"
              role="tablist"
              aria-label="Vendor profile sections"
            >
              {tabs.map((entry, index) => (
                <button
                  key={entry.id}
                  id={`${id}-${entry.id}-tab`}
                  type="button"
                  role="tab"
                  aria-label={entry.label}
                  aria-selected={tab === entry.id}
                  aria-controls={`${id}-${entry.id}-panel`}
                  tabIndex={tab === entry.id ? 0 : -1}
                  onClick={() => selectTab(entry.id)}
                  onKeyDown={(event) => {
                    if (
                      ["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)
                    ) {
                      event.preventDefault();
                      const next =
                        event.key === "Home"
                          ? tabs[0]
                          : event.key === "End"
                            ? tabs[2]
                            : tabs[
                                (index +
                                  (event.key === "ArrowLeft" ? -1 : 1) +
                                  tabs.length) %
                                  tabs.length
                              ];
                      selectTab(next.id);
                      document.getElementById(`${id}-${next.id}-tab`)?.focus();
                    }
                  }}
                >
                  <entry.Icon size={21} aria-hidden="true" />
                </button>
              ))}
            </div>
            <div
              role="tabpanel"
              id={`${id}-menu-panel`}
              aria-labelledby={`${id}-menu-tab`}
              hidden={tab !== "menu"}
            >
              {tab === "menu" && (
                <VendorProfileMenu
                  items={state.menu}
                  onAdd={() => dispatch({ type: "menu-dialog", dialog: "new" })}
                  onEdit={(itemId) =>
                    dispatch({ type: "menu-dialog", dialog: { id: itemId } })
                  }
                  onToggle={(itemId) => dispatch({ type: "toggle-menu", id: itemId })}
                  onDelete={(item) =>
                    confirm({
                      title: "Delete local menu item?",
                      description: `Remove ${item.name} from this preview? Nothing is deleted from your account.`,
                      confirmText: "Delete item",
                      variant: "danger",
                      onConfirm: () => dispatch({ type: "delete-menu", id: item.id }),
                    })
                  }
                />
              )}
            </div>
            <div
              role="tabpanel"
              id={`${id}-gallery-panel`}
              aria-labelledby={`${id}-gallery-tab`}
              hidden={tab !== "gallery"}
            >
              {tab === "gallery" && (
                <VendorProfileGallery
                  onOpen={(imageId) => dispatch({ type: "gallery", id: imageId })}
                />
              )}
            </div>
            <div
              role="tabpanel"
              id={`${id}-reviews-panel`}
              aria-labelledby={`${id}-reviews-tab`}
              hidden={tab !== "reviews"}
            >
              {tab === "reviews" && <VendorProfileReviews />}
            </div>
          </div>
        )}
      </div>
      <p className="mt-4 text-xs leading-5 text-[#B8C1D1]">
        Sample Vendor profile. Edits, photos and menu changes stay in this page session.
        Some gallery media is absent from the source design.
      </p>
      <p role="status" className="mt-2 text-sm text-[#2ED3D1]">
        {state.status}
      </p>
      {dialog && (
        <VendorMenuItemDialog
          item={selectedMenuItem}
          onClose={() => dispatch({ type: "menu-dialog", dialog: null })}
          onSave={(itemId, values, photo) =>
            dispatch({ type: "save-menu", id: itemId, values, photo })
          }
        />
      )}{" "}
      {state.galleryId && (
        <VendorProfileLightbox
          imageId={state.galleryId}
          onChange={(imageId) => dispatch({ type: "gallery", id: imageId })}
          onClose={() => dispatch({ type: "gallery", id: null })}
        />
      )}{" "}
      {confirmationProps && <ConfirmationDialog {...confirmationProps} />}
    </section>
  );
}
