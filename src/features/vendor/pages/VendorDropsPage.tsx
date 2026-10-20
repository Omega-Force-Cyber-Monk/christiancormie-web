import {
  Clock3,
  MapPin,
  PencilLine,
  Plus,
  Tag,
  ToggleLeft,
  ToggleRight,
  Trash2,
  X,
  Zap,
} from "lucide-react";
import { useReducer } from "react";
import { ConfirmationDialog } from "@/components/overlays/ConfirmationDialog/ConfirmationDialog";
import { useConfirmation } from "@/components/overlays/ConfirmationDialog/useConfirmation";
import { EmptyState } from "@/components/states/EmptyState";
import { DropsMap } from "@/features/vendor/components/drops/DropsMap";
import { DropDurationDialog } from "@/features/vendor/components/drops/DropDurationDialog";
import { DropPromoDialog } from "@/features/vendor/components/drops/DropPromoDialog";
import promoTag from "@/features/vendor/assets/drops/Drops-promo-tag.webp";
import { formatDropDuration } from "@/features/vendor/data/drops.data";
import { initialDropsState, dropsReducer } from "@/features/vendor/utils/dropsState";
import "@/features/vendor/components/drops/drops.css";

export default function VendorDropsPage() {
  const [state, dispatch] = useReducer(dropsReducer, undefined, initialDropsState);
  const { confirm, confirmationProps } = useConfirmation();
  const overlay = state.overlay;
  const promo =
    overlay?.kind === "promo" && overlay.id
      ? (state.promos.find((item) => item.id === overlay.id) ?? null)
      : null;
  const close = () => dispatch({ type: "overlay", overlay: null });
  return (
    <div className="vendor-drops-page">
      <h1 className="sr-only">Drops — local Vendor preview</h1>
      <div className="vendor-drops-card">
        <DropsMap
          online={state.online}
          onAvailability={(online) => dispatch({ type: "availability", online })}
        />
        <fieldset className="mt-12">
          <legend className="mb-2 text-sm text-[#E7E8E9]">Drop Duration</legend>
          <div className="drop-preset-options">
            {([1, 2, 4] as const).map((hours) => (
              <button
                type="button"
                key={hours}
                aria-pressed={
                  state.duration.kind === "preset" && state.duration.hours === hours
                }
                onClick={() =>
                  dispatch({ type: "duration", duration: { kind: "preset", hours } })
                }
              >
                <Clock3 size={12} aria-hidden="true" />
                {hours} {hours === 1 ? "hour" : "hours"}
              </button>
            ))}
            <button
              type="button"
              aria-pressed={state.duration.kind === "all-day"}
              onClick={() =>
                dispatch({ type: "duration", duration: { kind: "all-day" } })
              }
            >
              <Clock3 size={12} aria-hidden="true" />
              All day
            </button>
            <button
              type="button"
              aria-pressed={state.duration.kind === "custom"}
              aria-haspopup="dialog"
              onClick={() =>
                dispatch({ type: "overlay", overlay: { kind: "duration" } })
              }
            >
              <Clock3 size={12} aria-hidden="true" />
              {state.duration.kind === "custom"
                ? `Custom · ${formatDropDuration(state.duration)}`
                : "Custom"}
            </button>
          </div>
        </fieldset>
        <div className="drop-add-promo">
          <Tag size={18} aria-hidden="true" className="text-[#8390A3]" />
          <span className="text-sm">Add promo / deal</span>
          <button
            type="button"
            aria-haspopup="dialog"
            onClick={() =>
              dispatch({ type: "overlay", overlay: { kind: "promo", id: null } })
            }
          >
            <Plus size={14} aria-hidden="true" />
            New Promo
          </button>
        </div>
        <section aria-label="Local promos" className="mt-6 space-y-4">
          {state.promos.length ? (
            state.promos.map((item) => (
              <article className="drop-promo-row" key={item.id}>
                <span className="drop-promo-tag">
                  <img src={promoTag} alt="" />
                </span>
                <div className="min-w-0 flex-1">
                  <h2 className="text-sm leading-5 font-semibold break-words">
                    {item.name}
                  </h2>
                  <p className="mt-1 text-xs leading-[18px] break-words text-[#B6B7BC]">
                    {item.message}
                  </p>
                  {item.duration && (
                    <p className="mt-1 text-xs text-[#B8C1D1]">
                      {item.duration.hours}h
                      {item.duration.minutes ? ` ${item.duration.minutes}m` : ""}
                    </p>
                  )}
                </div>
                <div className="drop-promo-row-actions">
                  <button
                    type="button"
                    role="switch"
                    aria-checked={item.enabled}
                    aria-label={`Enable ${item.name}`}
                    onClick={() => dispatch({ type: "toggle-promo", id: item.id })}
                  >
                    {item.enabled ? (
                      <ToggleRight size={21} className="text-[#FF5733]" />
                    ) : (
                      <ToggleLeft size={21} className="text-[#687586]" />
                    )}
                  </button>
                  <button
                    type="button"
                    aria-label={`Edit ${item.name}`}
                    onClick={() =>
                      dispatch({
                        type: "overlay",
                        overlay: { kind: "promo", id: item.id },
                      })
                    }
                  >
                    <PencilLine size={16} />
                  </button>
                  <button
                    type="button"
                    className="text-[#FB2C36]"
                    aria-label={`Delete ${item.name}`}
                    onClick={() =>
                      confirm({
                        title: `Delete ${item.name}?`,
                        description:
                          "This removes the promo from this local preview only. No real customer promotion will be changed.",
                        confirmText: "Delete promo",
                        cancelText: "Keep promo",
                        variant: "danger",
                        onConfirm: () =>
                          dispatch({ type: "delete-promo", id: item.id }),
                      })
                    }
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </article>
            ))
          ) : (
            <EmptyState
              title="No promos"
              description="Add a promo to include it in your local drop preview."
            />
          )}
        </section>
        <button
          type="button"
          className="drop-go-live"
          onClick={() => dispatch({ type: "go-live" })}
        >
          <MapPin size={24} fill="currentColor" aria-hidden="true" />
          {state.live ? "Update Local Drop" : "Go Live Now"}
          <Zap size={24} fill="currentColor" aria-hidden="true" />
        </button>
        <p role="status" className="mt-3 text-xs leading-5 text-[#B8C1D1]">
          {state.status ||
            "Local preview only. Location, availability and promos are not broadcast."}
          {state.live
            ? ` Live preview: ${formatDropDuration(state.live.duration)} · ${state.live.promos.length} enabled promo${state.live.promos.length === 1 ? "" : "s"}.`
            : ""}
        </p>
      </div>
      <button
        type="button"
        className="drop-end"
        disabled={!state.live}
        onClick={() =>
          confirm({
            title: "End local drop?",
            description:
              "This ends the local drop preview. Your saved duration and promos will be kept. No real drop is affected.",
            confirmText: "End local drop",
            cancelText: "Keep preview",
            variant: "danger",
            onConfirm: () => dispatch({ type: "end-drop" }),
          })
        }
      >
        <X size={24} aria-hidden="true" />
        End Drop
      </button>
      {overlay?.kind === "duration" && (
        <DropDurationDialog
          value={
            state.duration.kind === "custom"
              ? state.duration.value
              : { hours: 3, minutes: 0 }
          }
          onSet={(value) => dispatch({ type: "custom-duration", value })}
          onClose={close}
        />
      )}
      {overlay?.kind === "promo" && (
        <DropPromoDialog
          key={overlay.id ?? "new"}
          promo={promo}
          onClose={close}
          onSave={(values) =>
            dispatch({
              type: "save-promo",
              id: overlay.id ?? crypto.randomUUID(),
              editing: Boolean(overlay.id),
              values,
            })
          }
        />
      )}
      {confirmationProps && <ConfirmationDialog {...confirmationProps} />}
    </div>
  );
}
