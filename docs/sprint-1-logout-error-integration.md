# Sprint 1 - Logout and API error compatibility

Date: 2026-10-27 (Asia/Dhaka). Scope: T02, A05, G10 and G11 only. Read the integration plan, mapping, gaps and T01 report, then verified the current frontend and backend source. Existing working-tree changes, including T01, were preserved. Backend, environment, dependencies, layouts and styling were not changed. T03 was not started.

## 1. Files changed

Paths are relative to `christinacormie-web`. This is the incremental T02 list; the full working-tree diff also contains earlier work.

Application source (13 files):

- `src/features/auth/api/auth.api.ts`: inject logout mutation into shared baseApi.
- `src/features/auth/types/auth.types.ts`: captured logout credentials and response types.
- `src/features/auth/schemas/session.schema.ts`: validate `{ success: true }`.
- `src/features/auth/store/auth.middleware.ts`: immediate cleanup followed by captured-credential revocation for manual logout.
- `src/services/api/authBaseQuery.ts`: logout bypasses refresh coordination and automatic retries.
- `src/services/api/baseQuery.ts`: preserve the logout request's explicit captured Bearer header.
- `src/utils/errors/error.types.ts`: optional validationMessages collection on existing AppError.
- `src/utils/errors/normalizeApiError.ts`: shared array compatibility and safe structured errors.
- `src/utils/errors/applyServerFieldErrors.ts`: optional form-field allowlist and unsafe-path filtering.
- `src/features/auth/utils/authErrors.ts`: use shared normalization and narrowly identify known validator fields.
- `src/features/auth/components/forms/LoginForm.tsx`: allow only this form's error fields.
- `src/features/auth/components/forms/SignupForm.tsx`: allow only this form's error fields.
- `src/features/auth/components/forms/EmailVerificationForm.tsx`: allow only email/code errors.

Tests (7 files):

- `src/features/auth/store/logout.test.mjs` (new): 16 mocked logout lifecycle tests.
- `src/utils/errors/applyServerFieldErrors.test.mjs` (new): 5 form/auth error tests.
- `src/utils/errors/normalizeApiError.test.mjs`: 5 additional normalization tests.
- `src/features/auth/api/auth.integration.test.mjs`: make local-only test invalidation explicit with the storage reason.
- `src/features/auth/utils/current-user.regression.mjs`: same distinction for local-only invalidation.
- `src/services/api/integration-readiness.test.mjs`: same distinction for local-only cleanup.
- `src/router/routes/public-review.test.mjs`: same distinction for local guard/cache cleanup tests.

Those existing test changes prevent newly backend-aware manual logout from introducing unrelated HTTP into local-only scenarios. Their assertions remain; dedicated new tests cover real manual logout orchestration.

Documentation:

- `docs/sprint-1-logout-error-integration.md` (new, this report).

## 2. Exact backend contract

Verified against [AuthController](../../christinacormie-backend/src/modules/auth/auth.controller.ts), [AuthService.logout](../../christinacormie-backend/src/modules/auth/auth.service.ts), [RefreshTokenDto](../../christinacormie-backend/src/modules/auth/dto/refresh-token.dto.ts) and [JwtAuthGuard](../../christinacormie-backend/src/common/guards/jwt-auth.guard.ts).

```http
POST /api/v1/auth/logout
Authorization: Bearer <captured access token>
Content-Type: application/json
Accept: application/json

{"refreshToken":"<captured refresh token>"}
```

The existing base URL supplies `/api/v1`; the injected endpoint uses `/auth/logout`. The access token is a header credential, never an extra JSON property. The DTO requires a string refreshToken. The JWT guard validates the access token and supplies the authenticated user ID; there is no role restriction.

- Success is HTTP 201 with `{ "success": true }`.
- The service verifies the refresh JWT with the refresh secret.
- Invalid or expired refresh JWTs return success as an idempotent no-op; they are not a service-level logout 401.
- A valid refresh token whose subject differs from the authenticated user returns 403.
- A valid matching refresh token sets revokedAt for the matching userId/tokenId record if not already revoked, then returns success. Already revoked or absent matching records also return success.
- Missing/invalid/expired access JWTs return 401 before the service runs. DTO errors can return 400, and database/network failures can prevent revocation confirmation.

The response is schema-checked. A malformed successful HTTP response is treated as an unconfirmed revocation, while local logout remains complete.

## 3. Logout lifecycle

1. Every existing logout control still dispatches the same manual `clearSession()` action. This includes navbar, sidebar, customer discovery, vendor home/settings and SessionGate controls. No markup, navigation, existing toast text or styling changed.
2. Middleware captures the pre-clear credentials. The reducer immediately removes identity, all tokens, session ID, expiry and initialization state, and disables verified access.
3. Existing cleanup removes atomic and legacy storage keys, disconnects the socket and resets shared RTK Query state. The user does not wait for HTTP and cannot be trapped in a signed-in frontend session by a slow or failed request.
4. When both captured tokens exist, middleware dispatches the injected logout mutation with `track: false`. No logout mutation state or response is retained in Redux. No token values or raw backend errors are logged.
5. The request carries the captured access header and refresh body even though local credentials have already been removed. Header preparation cannot substitute a newer session's token.
6. Logout bypasses refresh waiting and automatic 401 handling/retry. An old logout cannot rotate tokens, retry as another identity or clear a newer session.
7. The response never dispatches authentication actions or invalidates tags. Failure is caught with a generic development-only diagnostic; it does not reverse local cleanup. Completion resets only its own request entry, never another session's cache.
8. Concurrent controls in the same store send one revocation: the first action synchronously clears credentials, and subsequent clears have no credentials to submit. Already logged-out or incomplete-token states perform local cleanup only.
9. Storage synchronization and definitive invalid-session cleanup remain local-only, avoiding cross-tab revocation loops and recursive failure handling.

T01 bootstrap verification, complete backend role sets, explicit active-role selection, refresh single-flight/Web Locks, stale response checks, route guards and existing layouts remain intact.

## 4. Error-normalization improvements

The existing AppError -> normalization -> Sonner/inline presentation path remains.

- String messages continue to work; whitespace-only messages fall back safely.
- Arrays of string messages are trimmed, deduplicated and joined into a readable form-level message. For 400/422 arrays, all distinct usable messages are also available as validationMessages. Non-string/empty entries are ignored.
- Generic arrays do not imply field names. Reliable structured `errors: { field: string | string[] }` maps retain field association, status classification, safe client-error codes and client-error details. The first usable structured field message remains the inline message.
- Auth normalization uses shared validationMessages. Only a known auth DTO field followed by a recognizable class-validator diagnostic can map an array entry to a field. General prose such as "email delivery failed" and unknown fields remain form-level messages. Explicit structured messages take priority over inferred auth mappings. The existing displayName-to-name alias is retained.
- Each auth form supplies its own field allowlist. Unsupported server fields cannot create invisible form errors. Prototype-related paths are ignored in structured normalization and application.
- 5xx responses expose only the generic server message and status/kind. Raw server message arrays, structured errors, details and backend codes are omitted. Raw network diagnostics are also omitted from AppError.
- Existing form error regions and Sonner calls remain. Signup, verification and role-selection behavior did not change.

## 5. Validation performed

- `npm.cmd run typecheck`: passed.
- `npm.cmd run build`: passed, including TypeScript project checking and production Vite build.
- `npm.cmd test`: **283 passed, 0 failed, 0 skipped**. This includes 26 additional T02 tests and all 257 earlier regressions.
- Focused logout/error/auth/refresh run during implementation: **55 passed** before the final two logout race tests were added; both additional cases passed in the final full suite.
- `npm.cmd run lint`: passed with no errors or warnings.
- Changed-file `prettier --check`: passed for all 21 T02 files.
- `git diff --check`: passed.

New coverage includes successful revocation and immediate cleanup while HTTP is pending; backend/network failure; access 401; ownership 403; invalid/expired refresh-token no-op success; malformed responses; concurrent controls; newer actual login/bootstrap before delayed 201/401/500 logout responses; stored credentials; cache clearing and socket disconnection; snapshot headers; no refresh/retry on logout; storage/invalid-session reasons; and logout during an in-flight refresh.

Error coverage includes string messages, mixed/empty/repeated arrays, structured messages, useful validation detail preservation, reliable auth field mapping, form allowlists, unsafe paths, and server/network diagnostic suppression. Existing authentication and role-route regressions all pass.

The existing test runner was inspected: it uses a production SSR build and Node assertions, with a server/network guard and local HTTP mocks. No development/preview server, browser automation, live backend call or production credential was used.

## 6. Remaining issues and validation limits

Remote revocation is best-effort when offline, on server failure or with an expired access JWT. The frontend still signs out immediately; it does not falsely claim remote revocation succeeded or retain credentials for later retry. The backend contract revokes the submitted refresh-token record, not every session or already issued access JWTs. A refresh already executing on the backend can race with revocation; the frontend rejects its stale result, but this endpoint cannot guarantee revocation of a newly rotated server-side token. This is a source-level limitation, not a runtime-reproduced failure. Stronger server-wide/session-family revocation would require a separate backend contract and is outside this read-only backend task.

Live non-production revocation and manual keyboard/browser checks remain unverified. Browser/server testing was not executed because AGENTS.md sections 12-13 prohibit those workflows; backend build/lint/test/runtime commands were not run because this task changes only the frontend. All requested frontend automated checks were executable. No outstanding T02 product decision blocks the implementation.

## 7. T02 acceptance status

**Satisfied by source-contract verification and automated regressions.** Backend-aware manual logout uses the exact contract, always completes local cleanup and protects newer sessions. Nest validation arrays remain useful without broad field guessing or 5xx information leakage. All logout controls and T01 authentication/role behavior are preserved. Live environment verification remains a release check. Work stops at T02; no T03 or unrelated API integration was implemented.
