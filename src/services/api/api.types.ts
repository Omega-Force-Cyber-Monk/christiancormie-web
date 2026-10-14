export type ApiErrorResponse = {
  status: number | string;
  message: string;
  details?: unknown;
};
