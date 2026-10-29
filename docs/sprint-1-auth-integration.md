# Sprint 1 authentication integration

Date: 2026-10-27 (Asia/Dhaka). Scope: T00 decisions needed for T01; A01�A04 and G01�G03. Frontend changes only. T02 and later phases were not started.

## Source verification and decisions

Read the four required audit references and checked their authentication findings against the current source. The backend controllers use `/api/v1/auth` and `/api/v1/users`; its global ValidationPipe enables `whitelist`, `forbidNonWhitelisted`, and transformation. `registerCustomer`, `registerVendor`, `verifyEmailCode`, `resendVerificationCode`, `createAuthResponse`, and `users.service.ts` current-user serialization confirm the contracts below.

G01 and G02 were confirmed: `/auth/create-user` is unsupported, customer registration requires dateOfBirth, customer DTO does not accept phone/business/pickup fields, and registration returns a pending result rather than a logged-in user. The exact status returned by `toPendingVerificationResponse` is **PENDING**.

G03 was confirmed: vendor registration creates CUSTOMER and VENDOR assignments, and auth response construction ensures CUSTOMER membership for vendor users. Rejecting every multi-role account prevents the normal vendor flow.

The user explicitly approved:

- Customer/Vendor account-type controls in the existing signup form.
- A customer date-of-birth input and inline verification/resend continuation.
- An explicit role chooser after identity verification, with no default choice.

No unapproved role UX remains blocked. Other T00 product decisions concern later tasks and remain outside this sprint.

## Connected contracts

Paths below include the backend API prefix. The existing configured base URL supplies `/api/v1`; endpoint definitions use relative `/auth/...` and `/users/me` paths.

| Operation                      | Endpoint                                   | JSON request                                                                                              | Consumed response                                                                                                     |
| ------------------------------ | ------------------------------------------ | --------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| Customer registration          | POST /api/v1/auth/register/customer        | name, email, password, dateOfBirth; optional referralCode supported by DTO/type/schema                    | `{success:true,status:"PENDING",message,email}`                                                                       |
| Vendor registration            | POST /api/v1/auth/register/vendor          | email, phone, password; current form optionally sends businessName and maps real full name to displayName | Same pending response                                                                                                 |
| Verify email                   | POST /api/v1/auth/verify-email             | email, code (exactly six characters, leading zeroes preserved)                                            | `{accessToken,refreshToken,user}`; tokens establish an unverified session pending `/users/me`                         |
| Resend verification            | POST /api/v1/auth/resend-verification-code | email                                                                                                     | Same pending response; does not authenticate                                                                          |
| Existing password login        | POST /api/v1/auth/login                    | email, password                                                                                           | `{accessToken,refreshToken,user}`; identity still requires `/users/me`                                                |
| Existing refresh               | POST /api/v1/auth/refresh                  | refreshToken                                                                                              | Rotated accessToken/refreshToken; nested backend auth user never replaces verified UI identity                        |
| Existing identity verification | GET /api/v1/users/me                       | No body; Bearer token                                                                                     | Complete existing schema-validated current-user response, including roles and nullable profile/settings/vendor fields |

Vendor DTO types and strict request schemas also support the backend's optional dateOfBirth, businessEmail, businessPhone, description, websiteUrl, firstName, lastName, timezone, and referralCode fields. These are not silently populated or added as extra UI. Customer name is trimmed and 2�150 characters; passwords remain 8�128 characters; applicable vendor string limits and date/email validation are retained. Vendor phone inputs require international format as a frontend UX check; Nest's IsPhoneNumber remains authoritative for actual number validity. No phone-validation package was added.

Unknown request keys are rejected before HTTP. Form adapters whitelist real DTO properties and omit confirmPassword, accountType, customer phone, and pickup address. No N/A or generated user values are sent. Empty optional businessName is omitted. No token expiry is inferred because the backend auth response has no explicit expiry field.

Nest 400 validation message arrays are adapted only in authentication forms, including displayName-to-name mapping. Duplicate-account, incorrect/expired-code, throttling and server errors remain recoverable. Pending verification retains email context; passwords are cleared after successful registration. �Verify an existing account� allows continuation after reload, duplicate registration or mail-delivery failure without pretending registration or delivery succeeded. Login's unverified-email error remains visible; the existing Register link leads to this continuation.

## Role/session strategy and preserved infrastructure

`AuthenticatedUser.roles` retains the complete deduplicated set returned by verified `/users/me`, including unrecognized entries. Supported singleton roles become active automatically. Multiple supported roles produce a verified identity with a null active role, followed by explicit choice in SessionGate. Unknown-only or empty roles still fail safely.

Choice is limited to supported roles in the verified set. Route selectors recheck active-role membership, and the existing AuthGuard/RoleGuard remain intact. All private layouts stay behind the existing gates. No role is inferred from login order, registration account type, persisted role hints, or token response user data. Restoring a session revalidates `/users/me` and asks multi-role users to choose again; refresh within a verified session preserves the active role. Selection persists through the existing atomic session storage, but persisted state never authorizes access. Cross-tab restoration follows the existing verification path and may require a fresh choice.

The shared baseApi, single-flight refresh, Web Locks coordination, one retry, stale bootstrap/refresh checks, storage listener, initialization retry, public-page access, cache reset, socket cleanup and local logout behavior remain. New public auth requests skip refresh and Bearer attachment. Delayed login/verification responses cannot replace a newer session. Role selection clears previous role caches/socket state through existing middleware.

Logout revocation is still the separate T02 task; this sprint preserves current logout cleanup. No backend, environment, secrets, dependencies, admin endpoints, or other feature API services were modified.

## UI preservation

SignupPage/LoginPage illustrations, page shells, responsive classes, existing layouts, FormField/Button primitives, password visibility, login/register links and legal content remain. The customer-only unsupported phone input is replaced with the required birthday input. Vendor signup displays its phone input and optional business name. Verification is an inline form in the existing signup shell, so no new route, metadata or navigation entry is needed. The approved role chooser lives in the existing SessionGate, before protected layout mounting.

No browser/responsive visual certification is claimed. Manual layout, keyboard, focus and responsive review remains required.

## Exact files changed in this sprint

Paths are relative to `christinacormie-web`. Existing working-tree changes were preserved. In files already modified before this task, the changes below are incremental; the full Git diff includes pre-existing work.

Application source:

- `src/features/auth/api/auth.api.ts`
- `src/features/auth/components/SessionGate.tsx`
- `src/features/auth/components/forms/EmailVerificationForm.tsx` (new)
- `src/features/auth/components/forms/LoginForm.tsx`
- `src/features/auth/components/forms/SignupForm.tsx`
- `src/features/auth/schemas/session.schema.ts`
- `src/features/auth/schemas/signup.schema.ts`
- `src/features/auth/store/auth.middleware.ts`
- `src/features/auth/store/auth.selectors.ts`
- `src/features/auth/store/auth.slice.ts`
- `src/features/auth/types/auth.types.ts`
- `src/features/auth/utils/authAdapters.ts`
- `src/features/auth/utils/authErrors.ts` (new)
- `src/services/api/authBaseQuery.ts`
- `src/services/api/baseQuery.ts`
- `src/types/user.types.ts`

Tests:

- `src/features/auth/api/auth.integration.test.mjs` (new)
- `src/features/auth/store/auth.test.mjs`
- `src/features/auth/utils/current-user.regression.mjs`
- `src/router/routes/public-review.test.mjs`
- `src/services/api/integration-readiness.test.mjs`
- `src/components/ui/AppLoader.test.mjs`
- `src/features/vendor/utils/createPostsState.test.mjs`
- `src/features/vendor/utils/dropsState.test.mjs`
- `src/features/vendor/utils/earningsState.test.mjs`
- `src/features/vendor/utils/feedState.test.mjs`
- `src/features/vendor/utils/homeState.test.mjs`
- `src/features/vendor/utils/leaderboardState.test.mjs`
- `src/features/vendor/utils/messagesState.test.mjs`
- `src/features/vendor/utils/profileState.test.mjs`
- `src/features/vendor/utils/requestsState.test.mjs`
- `src/features/vendor/utils/settingsState.test.mjs`

Vendor, loader and routing regression edits only supply the newly required `roles` collection in existing verified-auth fixtures; no unrelated feature assertions were removed or altered.

Documentation:

- `docs/sprint-1-auth-integration.md` (this report, new)

## Validation and T01 acceptance

- `npm.cmd run typecheck`: passed.
- `npm.cmd run build`: passed, including `tsc -b` and the production Vite build.
- `npm.cmd test`: **257 passed, 0 failed, 0 skipped**, including 25 new auth integration tests and existing route/session/cache regressions.
- `npm.cmd run lint`: passed with no warnings or errors.
- Changed-file `prettier --check`: passed for all 33 changed/new files.
- `git diff --check`: passed.

The first focused run exposed outdated route fixtures; the first full run also exposed vendor fixtures without roles. Those fixtures were updated to the verified identity model, and the complete suite then passed. Initial lint findings were fixed without disabling rules.

Coverage includes both registration endpoints/payloads, pending verification, correct/wrong/expired codes, resend, malformed requests/responses, duplicate accounts, validation arrays, public-auth 401 bypass, singleton and dual-role login in either order, explicit choice/membership, unauthorized routes, persisted unverified identities, actual nested refresh responses, concurrent refresh/retry bounds, transient bootstrap errors, and logout/new login while bootstrap/refresh/auth requests are pending.

All tests use local mocked responses and the existing server-free runner. No live backend/mail-provider call or production credential was used. Backend build/lint/test/runtime commands were not run: the backend is read-only for this task, its lint script writes files, and runtime verification requires a separately authorized non-production environment. Browser/interactive tests were not executed because AGENTS.md sections 12�13 prohibit starting servers or browser automation. Static React rendering tests do not prove layout, keyboard or screen-reader behavior.

**T01 acceptance:** implemented and satisfied by source-contract checks and server-free regression coverage, including the user-approved multi-role choice. Live non-production email delivery, browser/responsive review, and deployed CORS/configuration remain unverified release checks. No outstanding authentication product decision blocks this implementation. T02 and subsequent phases remain untouched.
