import { z } from "zod";
import type { FetchArgs } from "@reduxjs/toolkit/query";
import type { RootState } from "@/app/store";
import type { ApiBaseQuery } from "./baseQuery";
import {
  selectCurrentRole,
  selectIsAuthenticated,
} from "@/features/auth/store/auth.selectors";
import { readValidated } from "./validatedQuery";
export type SessionScope = { sessionId: string; userId: string; role: string };
export type QueryContext = Parameters<ApiBaseQuery>[1];
export type ValidatedQuery = (args: FetchArgs) => ReturnType<ApiBaseQuery>;
export const sessionDenied = {
  data: undefined,
  error: {
    status: 403 as const,
    data: { message: "The verified account or editing session is unavailable." },
  },
};
export function scopeMatches(state: RootState, scope: SessionScope) {
  return (
    selectIsAuthenticated(state) &&
    state.auth.sessionId === scope.sessionId &&
    state.auth.user?.id === scope.userId &&
    selectCurrentRole(state) === scope.role
  );
}
export async function scopedRead<T>(
  a: QueryContext,
  scope: SessionScope,
  q: ValidatedQuery,
  args: FetchArgs,
  schema: z.ZodType<T>,
) {
  if (!scopeMatches(a.getState() as RootState, scope)) return sessionDenied;
  const result = await readValidated(args, schema, q);
  return scopeMatches(a.getState() as RootState, scope) ? result : sessionDenied;
}
const flights = new WeakMap<object, Set<string>>();
export async function sessionFlight<T>(
  a: QueryContext,
  scope: SessionScope,
  key: string,
  run: () => Promise<T>,
) {
  const pending = flights.get(a.dispatch) ?? new Set<string>();
  flights.set(a.dispatch, pending);
  const id = `${scope.sessionId}:${scope.userId}:${key}`;
  if (pending.has(id))
    return {
      error: {
        status: "CUSTOM_ERROR" as const,
        error: "This change is already pending.",
      },
    };
  pending.add(id);
  try {
    return await run();
  } finally {
    pending.delete(id);
  }
}
