export const DEFAULT_PAGE = 1;
export const DEFAULT_PAGE_SIZE = 10;

export const parsePositiveInt = (value: string | null, fallback: number, max = 100) => {
  const parsed = Number(value);

  if (!Number.isInteger(parsed) || parsed < 1) return fallback;
  return Math.min(parsed, max);
};
