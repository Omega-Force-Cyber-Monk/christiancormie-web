import {
  memberStore,
  viewerId,
  json,
} from "../../social/utils/member.test-fixtures.mjs";
import {
  currentUserResponse,
  currentUserProfile,
} from "../../auth/utils/current-user.test-fixtures.mjs";
import { authApi } from "../../auth/api/auth.api.ts";
export { memberStore, json, viewerId };
export const scope = { sessionId: "member-test", userId: viewerId, role: "CUSTOMER" };
export const accountDto = (overrides = {}) =>
  currentUserResponse({
    id: viewerId,
    email: "actual@example.invalid",
    roles: ["CUSTOMER", "VENDOR"],
    profile: currentUserProfile({
      userId: viewerId,
      displayName: "Actual Name",
      firstName: "Actual",
      lastName: "Person",
      bio: "Read only bio",
    }),
    ...overrides,
  });
export async function seedAccount(s, overrides = {}) {
  await s.dispatch(
    authApi.util.upsertQueryData("getCurrentUser", undefined, accountDto(overrides)),
  );
}
