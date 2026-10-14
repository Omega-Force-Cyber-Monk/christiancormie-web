import { Button } from "@/components/ui/Button";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
import { getPagination } from "@/components/data-display/DataTable/pagination";

type DataTablePaginationProps = {
  page: number;
  pageSize: number;
  totalItems: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  showPageSizeSelector?: boolean;
  showPageNumbers?: boolean;
  showResultRange?: boolean;
  variant?: "default" | "contrast";
};

const pageSizeOptions = [10, 20, 50];

export function DataTablePagination({
  onPageChange,
  onPageSizeChange,
  page,
  pageSize,
  showPageNumbers = false,
  showPageSizeSelector = true,
  showResultRange = false,
  totalItems,
  variant = "default",
}: DataTablePaginationProps) {
  const {
    page: validPage,
    pageSize: validSize,
    totalItems: validTotal,
    pageCount,
    startIndex,
    endIndex,
  } = getPagination(page, pageSize, totalItems);
  const sizeOptions = [...new Set([...pageSizeOptions, validSize])].sort(
    (a, b) => a - b,
  );

  const getPageNumbers = () => {
    const pages: Array<number | string> = [];
    if (pageCount <= 5) {
      for (let index = 1; index <= pageCount; index += 1) pages.push(index);
      return pages;
    }

    pages.push(1);
    if (validPage > 3) pages.push("...");
    const start = Math.max(2, validPage - 1);
    const end = Math.min(pageCount - 1, validPage + 1);
    for (let index = start; index <= end; index += 1) {
      if (!pages.includes(index)) pages.push(index);
    }
    if (validPage < pageCount - 2) pages.push("...");
    pages.push(pageCount);
    return pages;
  };

  if (variant === "contrast") {
    return (
      <div className="flex flex-col items-center justify-between gap-4 border-t border-[#1e2638] bg-[#111726]/60 px-6 py-4 text-xs text-[#8091a7] sm:flex-row">
        {showResultRange ? (
          <div>
            Showing{" "}
            <span className="font-semibold text-slate-200">
              {validTotal > 0 ? startIndex + 1 : 0}
            </span>{" "}
            to <span className="font-semibold text-slate-200">{endIndex}</span> of{" "}
            <span className="font-semibold text-slate-200">{validTotal}</span> results
          </div>
        ) : (
          <p>
            Page {validPage} of {pageCount}
          </p>
        )}

        <div className="flex items-center gap-1.5">
          {showPageSizeSelector ? (
            <select
              aria-label="Rows per page"
              className="min-h-8 rounded-lg border border-[#232d42] bg-[#182030] px-2 text-slate-200"
              onChange={(event) => {
                onPageSizeChange(Number(event.target.value));
                onPageChange(1);
              }}
              value={validSize}
            >
              {sizeOptions.map((option) => (
                <option key={option} value={option}>
                  {option} rows
                </option>
              ))}
            </select>
          ) : null}
          <button
            className="rounded-lg border border-[#232d42] bg-[#182030] p-1.5 text-slate-300 transition-colors hover:bg-[#202b40] hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
            disabled={validPage === 1}
            onClick={() => onPageChange(1)}
            title="First Page"
            aria-label="First page"
            type="button"
          >
            <ChevronsLeft className="size-4" />
          </button>
          <button
            className="rounded-lg border border-[#232d42] bg-[#182030] p-1.5 text-slate-300 transition-colors hover:bg-[#202b40] hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
            disabled={validPage === 1}
            onClick={() => onPageChange(Math.max(1, validPage - 1))}
            title="Previous Page"
            aria-label="Previous page"
            type="button"
          >
            <ChevronLeft className="size-4" />
          </button>
          {showPageNumbers
            ? getPageNumbers().map((pageNumber, index) =>
                typeof pageNumber === "number" ? (
                  <button
                    className={`h-8 min-w-[32px] rounded-lg px-2 text-xs font-medium transition-all ${
                      validPage === pageNumber
                        ? "bg-[#ff6542] font-semibold text-white shadow-sm"
                        : "border border-[#232d42] bg-[#182030] text-slate-300 hover:bg-[#202b40] hover:text-white"
                    }`}
                    key={`${pageNumber}-${index}`}
                    aria-label={`Page ${pageNumber}`}
                    aria-current={validPage === pageNumber ? "page" : undefined}
                    onClick={() => onPageChange(pageNumber)}
                    type="button"
                  >
                    {pageNumber}
                  </button>
                ) : (
                  <span
                    className="px-1.5 font-medium text-slate-500 select-none"
                    key={`${pageNumber}-${index}`}
                  >
                    {pageNumber}
                  </span>
                ),
              )
            : null}
          <button
            className="rounded-lg border border-[#232d42] bg-[#182030] p-1.5 text-slate-300 transition-colors hover:bg-[#202b40] hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
            disabled={validPage === pageCount}
            onClick={() => onPageChange(Math.min(pageCount, validPage + 1))}
            title="Next Page"
            aria-label="Next page"
            type="button"
          >
            <ChevronRight className="size-4" />
          </button>
          <button
            className="rounded-lg border border-[#232d42] bg-[#182030] p-1.5 text-slate-300 transition-colors hover:bg-[#202b40] hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
            disabled={validPage === pageCount}
            onClick={() => onPageChange(pageCount)}
            title="Last Page"
            aria-label="Last page"
            type="button"
          >
            <ChevronsRight className="size-4" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 border-t border-[var(--border)] p-4 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm text-[var(--text-muted)]">
        {showResultRange
          ? `Showing ${validTotal ? startIndex + 1 : 0} to ${endIndex} of ${validTotal} results`
          : `Page ${validPage} of ${pageCount}`}
      </p>
      <div className="flex flex-wrap items-center gap-2">
        {showPageSizeSelector ? (
          <select
            aria-label="Rows per page"
            className="min-h-10 rounded-md border border-[var(--border)] bg-[var(--surface)] px-2 text-sm"
            onChange={(event) => {
              onPageSizeChange(Number(event.target.value));
              onPageChange(1);
            }}
            value={validSize}
          >
            {sizeOptions.map((option) => (
              <option key={option} value={option}>
                {option} rows
              </option>
            ))}
          </select>
        ) : null}
        <Button disabled={validPage <= 1} onClick={() => onPageChange(validPage - 1)}>
          Previous
        </Button>
        {showPageNumbers
          ? getPageNumbers().map((number, index) =>
              typeof number === "number" ? (
                <Button
                  key={`${number}-${index}`}
                  aria-label={`Page ${number}`}
                  aria-current={validPage === number ? "page" : undefined}
                  onClick={() => onPageChange(number)}
                  variant={validPage === number ? "primary" : "secondary"}
                >
                  {number}
                </Button>
              ) : (
                <span key={`gap-${index}`} aria-hidden="true">
                  …
                </span>
              ),
            )
          : null}
        <Button
          disabled={validPage >= pageCount}
          onClick={() => onPageChange(validPage + 1)}
        >
          Next
        </Button>
      </div>
    </div>
  );
}
