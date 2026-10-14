import { useLayoutEffect, useRef, type RefObject } from "react";

import { registerDialog } from "@/components/overlays/dialogLifecycle";

export function useDialogLifecycle(
  open: boolean,
  panelRef: RefObject<HTMLElement | null>,
  rootRef: RefObject<HTMLDivElement | null>,
  onClose: () => void,
  closeOnEscape = true,
  sourceRef?: RefObject<HTMLElement | null>,
) {
  const options = useRef({ onClose, closeOnEscape });
  useLayoutEffect(() => {
    options.current = { onClose, closeOnEscape };
  });
  useLayoutEffect(() => {
    if (!open || !panelRef.current || !rootRef.current) return;
    return registerDialog(
      panelRef.current,
      rootRef.current,
      () => options.current,
      sourceRef?.current ?? rootRef.current,
    );
  }, [open, panelRef, rootRef, sourceRef]);
}
