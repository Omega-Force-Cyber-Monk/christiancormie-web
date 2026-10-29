import { useState } from "react";
import { useDebounce } from "@/hooks/useDebounce";
import type { AdminListQuery } from "@/features/admin/types/admin.types";

export function adminListQuery(
  page: number,
  pageSize: number,
  filters: Pick<AdminListQuery, "search" | "status" | "category">,
): AdminListQuery {
  return {
    ...(filters.search?.trim() ? { search: filters.search.trim() } : {}),
    ...(filters.status ? { status: filters.status } : {}),
    ...(filters.category ? { category: filters.category } : {}),
    limit: pageSize + 1,
    offset: (page - 1) * pageSize,
  };
}

/** Management summaries are global; lookahead determines Next without inventing totals. */
export function adminPage<T>(rows: T[] | undefined, pageSize: number) {
  return {
    rows: (rows ?? []).slice(0, pageSize),
    hasNextPage: (rows?.length ?? 0) > pageSize,
  };
}

export function adminListPosition(
  position: { key: string; page: number },
  key: string,
) {
  return position.key === key ? position : { key, page: 1 };
}

export function useAdminList(initialPageSize = 10, scope = "") {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [category, setCategory] = useState("");
  const [pageSize, setPageSize] = useState(initialPageSize);
  const debouncedSearch = useDebounce(search.trim());
  const key = JSON.stringify([debouncedSearch, status, category, pageSize, scope]);
  const [position, setPosition] = useState({ key, page: 1 });
  const current = adminListPosition(position, key);
  // Commit the filter change so returning to an earlier filter cannot revive an old page.
  if (current !== position) setPosition(current);
  const page = current.page;
  return {
    search,
    setSearch,
    status,
    setStatus,
    category,
    setCategory,
    page,
    pageSize,
    query: adminListQuery(page, pageSize, {
      search: debouncedSearch,
      status,
      category,
    }),
    pagination: {
      page,
      pageSize,
      onPageChange: (next: number) => setPosition({ key, page: Math.max(1, next) }),
      onPageSizeChange: (size: number) => setPageSize(Math.min(50, Math.max(1, size))),
    },
  };
}
