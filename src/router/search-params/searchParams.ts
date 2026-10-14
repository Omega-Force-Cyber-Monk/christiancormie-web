import { useCallback } from "react";
import { useSearchParams } from "react-router";

import type {
  SortDirection,
  SortState,
} from "@/components/data-display/DataTable/data-table.types";
import {
  DEFAULT_PAGE,
  DEFAULT_PAGE_SIZE,
  parsePositiveInt,
} from "@/router/search-params/paginationParams";
import type {
  TableSearchParams,
  UpdateTableSearchParams,
} from "@/router/search-params/search-param.types";

const isSortDirection = (value: string | null): value is SortDirection =>
  value === "asc" || value === "desc";

export const readTableSearchParams = <TSortKey extends string>(
  params: URLSearchParams,
): TableSearchParams<TSortKey> => {
  const sortKey = params.get("sort") as TSortKey | null;
  const direction = params.get("order");
  const filters = [...params.entries()]
    .filter(([key]) => key.startsWith("filter."))
    .reduce<Record<string, string>>((accumulator, [key, value]) => {
      accumulator[key.replace("filter.", "")] = value;
      return accumulator;
    }, {});

  return {
    page: parsePositiveInt(params.get("page"), DEFAULT_PAGE),
    pageSize: parsePositiveInt(params.get("pageSize"), DEFAULT_PAGE_SIZE),
    search: params.get("search") ?? "",
    sort:
      sortKey && isSortDirection(direction)
        ? ({ key: sortKey, direction } satisfies SortState<TSortKey>)
        : null,
    filters,
  };
};

export const useTableSearchParams = <TSortKey extends string>() => {
  const [searchParams, setSearchParams] = useSearchParams();
  const state = readTableSearchParams<TSortKey>(searchParams);

  const update = useCallback(
    (updates: UpdateTableSearchParams<TSortKey>) => {
      setSearchParams((current) => {
        const next = new URLSearchParams(current);
        const shouldResetPage =
          updates.search !== undefined ||
          updates.pageSize !== undefined ||
          updates.sort !== undefined ||
          updates.filters !== undefined;

        if (updates.page !== undefined) next.set("page", String(updates.page));
        if (shouldResetPage) next.set("page", String(DEFAULT_PAGE));
        if (updates.pageSize !== undefined)
          next.set("pageSize", String(updates.pageSize));
        if (updates.search !== undefined) {
          if (updates.search) {
            next.set("search", updates.search);
          } else {
            next.delete("search");
          }
        }
        if (updates.sort !== undefined) {
          if (updates.sort) {
            next.set("sort", updates.sort.key);
            next.set("order", updates.sort.direction);
          } else {
            next.delete("sort");
            next.delete("order");
          }
        }
        if (updates.filters) {
          [...next.keys()]
            .filter((key) => key.startsWith("filter."))
            .forEach((key) => next.delete(key));
          Object.entries(updates.filters).forEach(([key, value]) => {
            if (value) next.set(`filter.${key}`, value);
          });
        }

        return next;
      });
    },
    [setSearchParams],
  );

  return [state, update] as const;
};
