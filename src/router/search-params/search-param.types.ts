import type {
  PaginationState,
  SortDirection,
  SortState,
} from "@/components/data-display/DataTable/data-table.types";

export type TableSearchParams<TSortKey extends string = string> = PaginationState & {
  search: string;
  sort: SortState<TSortKey> | null;
  filters: Record<string, string>;
};

export type UpdateTableSearchParams<TSortKey extends string = string> = Partial<{
  page: number;
  pageSize: number;
  search: string;
  sort: SortState<TSortKey> | null;
  filters: Record<string, string>;
  order: SortDirection;
}>;
