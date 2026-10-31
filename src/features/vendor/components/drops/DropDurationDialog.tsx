import { useId, useState } from "react";
import { Modal } from "@/components/overlays/Modal/Modal";
import { DropDurationPicker } from "@/features/vendor/components/drops/DropDurationPicker";
import type { CustomDropDuration } from "@/features/vendor/schemas/drops.schema";
import { durationMinutes } from "@/features/vendor/schemas/dropsIntegration.schema";

export function DropDurationDialog({
  value,
  onSet,
  onClose,
  backend = false,
}: {
  value: CustomDropDuration;
  onSet: (value: CustomDropDuration) => void;
  onClose: () => void;
  backend?: boolean;
}) {
  const titleId = useId();
  const [draft, setDraft] = useState({ ...value });
  return (
    <Modal
      isOpen
      onClose={onClose}
      titleId={titleId}
      showCloseButton={false}
      panelClassName="vendor-drop-dialog vendor-drop-duration-dialog"
      backdropClassName="bg-[#080D1A]/85"
    >
      <header className="drop-dialog-heading">
        <button type="button" onClick={onClose}>
          Cancel
        </button>
        <h2 id={titleId}>Custom Duration</h2>
        <button
          type="button"
          className="text-[#FF5733]"
          disabled={backend && durationMinutes(draft.hours, draft.minutes) === null}
          onClick={() => onSet(draft)}
        >
          Set
        </button>
      </header>
      <div className="drop-dialog-body">
        <p className="mb-5 text-center text-xs text-[#B8C1D1]">
          SET YOUR DROP DURATION
        </p>
        <DropDurationPicker value={draft} onChange={setDraft} />
        {backend && (
          <div className="mt-4 grid grid-cols-2 gap-3">
            <label>
              Hours
              <input
                className="drop-promo-message w-full"
                type="number"
                min={0}
                max={24}
                value={draft.hours}
                onChange={(e) => setDraft({ ...draft, hours: Number(e.target.value) })}
              />
            </label>
            <label>
              Minutes
              <input
                className="drop-promo-message w-full"
                type="number"
                min={0}
                max={59}
                value={draft.minutes}
                onChange={(e) =>
                  setDraft({ ...draft, minutes: Number(e.target.value) })
                }
              />
            </label>
            <p className="col-span-2 text-xs">
              Choose a total duration from 1 to 1440 minutes.
            </p>
          </div>
        )}
      </div>
    </Modal>
  );
}
