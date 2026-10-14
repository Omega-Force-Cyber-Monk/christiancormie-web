import assert from "node:assert/strict";
import test from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { FormField } from "./FormField.tsx";

test("repeated field names get unique label/error associations", () => {
  const html = renderToStaticMarkup(
    createElement(
      "div",
      null,
      createElement(FormField, {
        name: "email",
        label: "Email one",
        error: "Invalid",
        "aria-describedby": "hint",
      }),
      createElement(FormField, { name: "email", label: "Email two" }),
    ),
  );
  const ids = [...html.matchAll(/<input[^>]* id="([^"]+)"/g)].map((match) => match[1]);
  assert.equal(ids.length, 2);
  assert.notEqual(ids[0], ids[1]);
  assert.ok(html.includes(`for="${ids[0]}"`));
  assert.ok(html.includes(`aria-describedby="hint ${ids[0]}-error"`));
  assert.ok(html.includes('aria-invalid="true"'));
});
