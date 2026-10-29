import type { z } from "zod";
import type { FetchArgs } from "@reduxjs/toolkit/query";
import type { ApiBaseQuery } from "./baseQuery";
export const invalidContract = {
  data: undefined,
  error: {
    status: "CUSTOM_ERROR" as const,
    error: "The server response or request is not supported.",
  },
};
export async function readValidated<T>(
  args: FetchArgs,
  schema: z.ZodType<T>,
  query: (args: FetchArgs) => ReturnType<ApiBaseQuery>,
) {
  const result = await query(args);
  if (result.error) return { error: result.error };
  const parsed = schema.safeParse(result.data);
  return parsed.success ? { data: parsed.data } : invalidContract;
}
