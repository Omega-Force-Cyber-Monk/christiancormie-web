type DialogOptions = { closeOnEscape: boolean; onClose: () => void };
type DialogEntry = {
  panel: HTMLElement;
  root: HTMLElement;
  source: HTMLElement;
  options: () => DialogOptions;
  previousFocus: HTMLElement | null;
  previousZIndex: string;
};

const focusableSelector =
  "a[href],button:not([disabled]),textarea:not([disabled]),input:not([disabled]),select:not([disabled]),[tabindex]:not([tabindex='-1'])";
const managers = new WeakMap<Document, ReturnType<typeof createDialogManager>>();

function createDialogManager(doc: Document) {
  const entries: DialogEntry[] = [];
  const inertElements = new Map<HTMLElement, boolean>();
  let previousOverflow = "";
  const top = () => entries.at(-1);
  const updateIsolation = () => {
    inertElements.forEach((value, element) => {
      element.inert = value;
    });
    inertElements.clear();
    entries.forEach((entry, index) => {
      entry.root.style.zIndex = String(50 + index);
      // Copy parent themes before descendant themes, including simultaneous mounts.
      if (entry.source !== entry.root && doc.defaultView) {
        const theme = doc.defaultView.getComputedStyle(entry.source);
        for (const property of Array.from(theme)) {
          if (property.startsWith("--"))
            entry.root.style.setProperty(property, theme.getPropertyValue(property));
        }
        entry.root.style.color = theme.color;
        entry.root.style.fontFamily = theme.fontFamily;
        entry.root.style.colorScheme = theme.colorScheme;
      }
    });
    let branch: HTMLElement | null = top()?.root ?? null;
    while (branch && branch !== doc.body) {
      const parent: HTMLElement | null = branch.parentElement;
      if (!parent) break;
      for (const sibling of Array.from(parent.children)) {
        if (sibling !== branch && sibling instanceof HTMLElement) {
          inertElements.set(sibling, sibling.inert);
          sibling.inert = true;
        }
      }
      branch = parent;
    }
  };
  const focusables = (panel: HTMLElement) =>
    Array.from(panel.querySelectorAll<HTMLElement>(focusableSelector)).filter(
      (element) =>
        element.tabIndex >= 0 &&
        !element.closest("[inert]") &&
        element.getClientRects().length > 0,
    );
  const handleFocus = (event: FocusEvent) => {
    const entry = top();
    if (entry && !entry.panel.contains(event.target as Node)) entry.panel.focus();
  };
  const handleKeyDown = (event: KeyboardEvent) => {
    const entry = top();
    if (!entry) return;
    if (event.key === "Escape") {
      event.preventDefault();
      event.stopImmediatePropagation();
      const options = entry.options();
      if (options.closeOnEscape) options.onClose();
      return;
    }
    if (event.key !== "Tab") return;
    const elements = focusables(entry.panel);
    const first = elements[0];
    const last = elements.at(-1);
    const active = doc.activeElement;
    if (!first || !last) {
      event.preventDefault();
      entry.panel.focus();
    } else if (
      event.shiftKey &&
      (active === first || active === entry.panel || !entry.panel.contains(active))
    ) {
      event.preventDefault();
      last.focus();
    } else if (
      !event.shiftKey &&
      (active === last || active === entry.panel || !entry.panel.contains(active))
    ) {
      event.preventDefault();
      first.focus();
    }
  };

  return {
    register(
      panel: HTMLElement,
      root: HTMLElement,
      options: () => DialogOptions,
      source: HTMLElement,
    ) {
      const entry: DialogEntry = {
        panel,
        root,
        source,
        options,
        previousFocus:
          doc.activeElement instanceof HTMLElement ? doc.activeElement : null,
        previousZIndex: root.style.zIndex,
      };
      if (entries.length === 0) {
        previousOverflow = doc.body.style.overflow;
        doc.body.style.overflow = "hidden";
        doc.addEventListener("keydown", handleKeyDown, true);
        doc.addEventListener("focusin", handleFocus);
      }
      // React mounts child layout effects first. A containing dialog still belongs
      // below its already-registered descendants in the stack.
      const descendant = entries.findIndex((candidate) =>
        panel.contains(candidate.source),
      );
      if (descendant === -1) entries.push(entry);
      else {
        entry.previousFocus = entries[descendant].previousFocus;
        entries.splice(descendant, 0, entry);
      }
      updateIsolation();
      if (top() === entry) panel.focus();
      return () => {
        const index = entries.indexOf(entry);
        if (index === -1) return;
        const wasTop = top() === entry;
        entries.splice(index, 1);
        entries.forEach((remaining) => {
          if (remaining.previousFocus && entry.root.contains(remaining.previousFocus))
            remaining.previousFocus = entry.previousFocus;
        });
        root.style.zIndex = entry.previousZIndex;
        updateIsolation();
        if (entries.length === 0) {
          doc.body.style.overflow = previousOverflow;
          doc.removeEventListener("keydown", handleKeyDown, true);
          doc.removeEventListener("focusin", handleFocus);
        }
        if (wasTop) {
          const parent = top();
          const previous = entry.previousFocus;
          if (
            previous?.isConnected &&
            !previous.closest("[inert]") &&
            (!parent || parent.panel.contains(previous))
          )
            previous.focus();
          else parent?.panel.focus();
        }
      };
    },
  };
}

export function registerDialog(
  panel: HTMLElement,
  root: HTMLElement,
  options: () => DialogOptions,
  source: HTMLElement = root,
) {
  const doc = panel.ownerDocument;
  let manager = managers.get(doc);
  if (!manager) {
    manager = createDialogManager(doc);
    managers.set(doc, manager);
  }
  return manager.register(panel, root, options, source);
}
