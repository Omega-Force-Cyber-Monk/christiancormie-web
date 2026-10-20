import { useId, useState } from "react";
import { Modal } from "@/components/overlays/Modal/Modal";
import { DropDurationPicker } from "@/features/vendor/components/drops/DropDurationPicker";
import type { CustomDropDuration } from "@/features/vendor/schemas/drops.schema";

export function DropDurationDialog({
  value,
  onSet,
  onClose,
}: {
  value: CustomDropDuration;
  onSet: (value: CustomDropDuration) => void;
  onClose: () => void;
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
        <button type="button" className="text-[#FF5733]" onClick={() => onSet(draft)}>
          Set
        </button>
      </header>
      <div className="drop-dialog-body">
        <p className="mb-5 text-center text-xs text-[#B8C1D1]">
          SET YOUR DROP DURATION
        </p>
        <DropDurationPicker value={draft} onChange={setDraft} />
      </div>
    </Modal>
  );
}
