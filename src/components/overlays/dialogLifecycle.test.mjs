import assert from "node:assert/strict";
import test from "node:test";
import { registerDialog } from "./dialogLifecycle.ts";

// Small DOM double exercises lifecycle ownership, not browser layout/rendering.
class Element {
  constructor(doc, parent = null) {
    this.ownerDocument = doc;
    this.parentElement = parent;
    this.children = [];
    this.style = { overflow: "", zIndex: "" };
    this.inert = false;
    this.isConnected = true;
    this.tabIndex = -1;
    parent?.children.push(this);
  }
  contains(element) {
    return element === this || this.children.some((child) => child.contains(element));
  }
  closest() {
    return this.inert ? this : (this.parentElement?.closest() ?? null);
  }
  querySelectorAll() {
    return this.children;
  }
  getClientRects() {
    return [1];
  }
  focus() {
    this.ownerDocument.activeElement = this;
  }
}

function documentDouble() {
  const handlers = new Map();
  const doc = {
    addEventListener: (event, handler) => handlers.set(event, handler),
    removeEventListener: (event) => handlers.delete(event),
    key(key, shiftKey = false) {
      const event = {
        key,
        shiftKey,
        prevented: false,
        preventDefault() {
          this.prevented = true;
        },
        stopImmediatePropagation() {},
      };
      handlers.get("keydown")?.(event);
      return event;
    },
    handlers,
  };
  doc.body = new Element(doc);
  return doc;
}

test("nested dialogs own Escape, isolation, scroll locking and restored focus", () => {
  const original = globalThis.HTMLElement;
  globalThis.HTMLElement = Element;
  try {
    const doc = documentDouble();
    doc.body.style.overflow = "auto";
    const trigger = new Element(doc, doc.body);
    trigger.focus();
    const parentRoot = new Element(doc, doc.body);
    const parent = new Element(doc, parentRoot);
    const nestedTrigger = new Element(doc, parent);
    let parentCloses = 0;
    let childCloses = 0;
    const closeParent = registerDialog(parent, parentRoot, () => ({
      closeOnEscape: true,
      onClose: () => parentCloses++,
    }));
    nestedTrigger.focus();
    const childRoot = new Element(doc, doc.body);
    const child = new Element(doc, childRoot);
    const closeChild = registerDialog(child, childRoot, () => ({
      closeOnEscape: true,
      onClose: () => childCloses++,
    }));
    assert.equal(parentRoot.inert, true);
    assert.equal(childRoot.style.zIndex, "51");
    doc.key("Escape");
    assert.equal(childCloses, 1);
    assert.equal(parentCloses, 0);
    closeChild();
    assert.equal(doc.body.style.overflow, "hidden");
    assert.equal(doc.activeElement, nestedTrigger);
    assert.equal(parentRoot.inert, false);
    closeParent();
    assert.equal(doc.body.style.overflow, "auto");
    assert.equal(doc.activeElement, trigger);
    assert.equal(trigger.inert, false);
    assert.equal(doc.handlers.size, 0);
  } finally {
    globalThis.HTMLElement = original;
  }
});

test("Tab wraps from the panel and blocked Escape does not close a parent", () => {
  const original = globalThis.HTMLElement;
  globalThis.HTMLElement = Element;
  try {
    const doc = documentDouble();
    const root = new Element(doc, doc.body);
    const panel = new Element(doc, root);
    const first = new Element(doc, panel);
    first.tabIndex = 0;
    const last = new Element(doc, panel);
    last.tabIndex = 0;
    let closes = 0;
    const dispose = registerDialog(panel, root, () => ({
      closeOnEscape: false,
      onClose: () => closes++,
    }));
    assert.equal(doc.key("Tab", true).prevented, true);
    assert.equal(doc.activeElement, last);
    doc.key("Tab");
    assert.equal(doc.activeElement, first);
    doc.key("Escape");
    assert.equal(closes, 0);
    dispose();
    dispose();
    assert.equal(doc.handlers.size, 0);
  } finally {
    globalThis.HTMLElement = original;
  }
});

test("out-of-order parent cleanup does not unlock an active child", () => {
  const original = globalThis.HTMLElement;
  globalThis.HTMLElement = Element;
  try {
    const doc = documentDouble();
    const trigger = new Element(doc, doc.body);
    trigger.focus();
    const parentRoot = new Element(doc, doc.body);
    const parent = new Element(doc, parentRoot);
    const removeParent = registerDialog(parent, parentRoot, () => ({
      closeOnEscape: true,
      onClose() {},
    }));
    const childRoot = new Element(doc, doc.body);
    const child = new Element(doc, childRoot);
    const removeChild = registerDialog(child, childRoot, () => ({
      closeOnEscape: true,
      onClose() {},
    }));
    removeParent();
    assert.equal(doc.body.style.overflow, "hidden");
    assert.equal(doc.activeElement, child);
    removeChild();
    assert.equal(doc.activeElement, trigger);
    assert.equal(doc.body.style.overflow, "");
  } finally {
    globalThis.HTMLElement = original;
  }
});

test("child-first mounting keeps the descendant on top", () => {
  const original = globalThis.HTMLElement;
  globalThis.HTMLElement = Element;
  try {
    const doc = documentDouble();
    const trigger = new Element(doc, doc.body);
    trigger.focus();
    const parentRoot = new Element(doc, doc.body);
    const parent = new Element(doc, parentRoot);
    const marker = new Element(doc, parent);
    const childRoot = new Element(doc, doc.body);
    const child = new Element(doc, childRoot);
    let childCloses = 0;
    const removeChild = registerDialog(
      child,
      childRoot,
      () => ({ closeOnEscape: true, onClose: () => childCloses++ }),
      marker,
    );
    const removeParent = registerDialog(parent, parentRoot, () => ({
      closeOnEscape: true,
      onClose() {
        assert.fail("parent must not receive Escape");
      },
    }));
    assert.equal(doc.activeElement, child);
    assert.equal(childRoot.style.zIndex, "51");
    doc.key("Escape");
    assert.equal(childCloses, 1);
    removeChild();
    assert.equal(doc.activeElement, parent);
    removeParent();
    assert.equal(doc.activeElement, trigger);
  } finally {
    globalThis.HTMLElement = original;
  }
});
