import type { ReactNode } from "react";

import type { AppError } from "@/utils/errors/error.types";

export type SortDirection = "asc" | "desc";

export type SortState<TSortKey extends string = string> = {
  key: TSortKey;
  direction: SortDirection;
};

export type PaginationState = {
  page: number;
  pageSize: number;
};

export type ServerTableState<TSortKey extends string = string> = PaginationState & {
  search: string;
  sort: SortState<TSortKey> | null;
  filters: Record<string, string>;
};

export type DataTableColumn<TRow, TSortKey extends string = string> = {
  id: string;
  header: ReactNode;
  accessor: (row: TRow) => ReactNode;
  sortKey?: TSortKey;
  className?: string;
};

export type DataTableProps<TRow, TSortKey extends string = string> = {
  columns: DataTableColumn<TRow, TSortKey>[];
  data: TRow[];
  getRowId: (row: TRow) => string;
  variant?: "default" | "contrast";
  emptyMessage?: string;
  error?: AppError | null;
  isLoading?: boolean;
  onRetry?: () => void;
  pagination?: PaginationState & {
    totalItems?: number;
    hasNextPage?: boolean;
    isFetching?: boolean;
    onPageChange: (page: number) => void;
    onPageSizeChange: (pageSize: number) => void;
    showPageSizeSelector?: boolean;
    showPageNumbers?: boolean;
    showResultRange?: boolean;
  };
  rowActions?: (row: TRow) => ReactNode;
  search?: {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
  };
  sort?: SortState<TSortKey> | null;
  onSortChange?: (sort: SortState<TSortKey>) => void;
};
