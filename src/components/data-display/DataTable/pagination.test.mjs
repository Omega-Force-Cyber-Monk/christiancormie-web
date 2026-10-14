import assert from "node:assert/strict";
import test from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { loadModule } from "../../../lib/testing/loadModule.mjs";

const { getPagination } = await loadModule(
  "/src/components/data-display/DataTable/pagination.ts",
);
const { DataTablePagination } = await loadModule(
  "/src/components/data-display/DataTable/DataTablePagination.tsx",
);

test("shrinking/empty data clamps the page and row slice", () => {
  assert.deepEqual(getPagination(9, 10, 12), {
    page: 2,
    pageSize: 10,
    totalItems: 12,
    pageCount: 2,
    startIndex: 10,
    endIndex: 12,
  });
  assert.equal(getPagination(9, 10, 0).page, 1);
  assert.equal(getPagination(9, 10, 0).endIndex, 0);
});

test("page sizes change the slice and invalid input stays finite", () => {
  assert.equal(getPagination(2, 20, 100).startIndex, 20);
  assert.equal(getPagination(2, 50, 100).endIndex, 100);
  const result = getPagination(NaN, 0, Infinity);
  assert.deepEqual(result, {
    page: 1,
    pageSize: 10,
    totalItems: 0,
    pageCount: 1,
    startIndex: 0,
    endIndex: 0,
  });
});

test("both visual variants expose enabled paging options and bounded page text", () => {
  for (const variant of ["default", "contrast"]) {
    const html = renderToStaticMarkup(
      createElement(DataTablePagination, {
        page: 8,
        pageSize: 5,
        totalItems: 12,
        variant,
        onPageChange() {},
        onPageSizeChange() {},
        showPageNumbers: true,
        showPageSizeSelector: true,
        showResultRange: true,
      }),
    );
    assert.ok(html.includes('aria-label="Rows per page"'));
    assert.ok(html.includes('aria-label="Page 3"'));
    assert.ok(html.includes('aria-current="page"'));
    assert.ok(html.includes('value="5" selected'));
    assert.ok(html.includes("Showing"));
  }
});
