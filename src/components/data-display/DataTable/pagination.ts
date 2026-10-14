export function getPagination(page: number, pageSize: number, totalItems: number) {
  const size = Number.isFinite(pageSize) && pageSize >= 1 ? Math.floor(pageSize) : 10;
  const total = Number.isFinite(totalItems) ? Math.max(0, Math.floor(totalItems)) : 0;
  const pageCount = Math.max(1, Math.ceil(total / size));
  const validPage = Number.isFinite(page)
    ? Math.min(Math.max(1, Math.floor(page)), pageCount)
    : 1;
  const startIndex = (validPage - 1) * size;
  return {
    page: validPage,
    pageSize: size,
    totalItems: total,
    pageCount,
    startIndex,
    endIndex: Math.min(startIndex + size, total),
  };
}
