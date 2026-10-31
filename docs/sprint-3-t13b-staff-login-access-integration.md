# Sprint 3 — T13-B: Staff PIN login and access verification

Date: 2026-10-29 (Asia/Dhaka). Scope: T13-B only. Backend read-only; no Sprint 4 work.

## 1. Exact files changed

This is the incremental T13-B manifest. All pre-existing, uncommitted T13-A files and changes are preserved; staff-management operations were not edited.

| File                                                                                            | Change                                                                                          |
| ----------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| [auth.api.ts](../src/features/auth/api/auth.api.ts)                                             | Staff login mutation, transient PIN handoff, safe errors and guarded pending-session commit     |
| [auth.types.ts](../src/features/auth/types/auth.types.ts)                                       | Exact StaffLoginRequest type                                                                    |
| [staff-login.schema.ts](../src/features/auth/schemas/staff-login.schema.ts)                     | Email/four-digit string PIN validation                                                          |
| [LoginForm.tsx](../src/features/auth/components/forms/LoginForm.tsx)                            | Explicit regular/staff mode controls around the existing regular form                           |
| [StaffLoginForm.tsx](../src/features/auth/components/forms/StaffLoginForm.tsx)                  | Masked PIN form, field errors, cancellation and duplicate prevention                            |
| [baseQuery.ts](../src/services/api/baseQuery.ts)                                                | Staff login excluded from automatic Bearer attachment                                           |
| [authBaseQuery.ts](../src/services/api/authBaseQuery.ts)                                        | Staff login uses public auth transport without refresh/retry                                    |
| [VendorStaffDashboardPage.tsx](../src/features/vendor-staff/pages/VendorStaffDashboardPage.tsx) | Existing layout/card primitives with unavailable values instead of sample statistics/chart data |
| [VendorStaffTasksPage.tsx](../src/features/vendor-staff/pages/VendorStaffTasksPage.tsx)         | Explicit unavailable task-management description                                                |
| [staffLogin.integration.test.mjs](../src/features/auth/api/staffLogin.integration.test.mjs)     | Backend-shaped authentication/access regressions                                                |
| [This report](sprint-3-t13b-staff-login-access-integration.md)                                  | Contracts, limitations, validation and Sprint 3 summary                                         |

No backend source, environment secrets, dependencies, routes/role guards, layouts, stylesheets, token storage, refresh/logout implementation or T13-A operations were changed.

## 2. Verified Staff Login contract

Verified against current [AuthController](../../christinacormie-backend/src/modules/auth/auth.controller.ts), [AuthService](../../christinacormie-backend/src/modules/auth/auth.service.ts), [StaffLoginDto](../../christinacormie-backend/src/modules/auth/dto/staff-login.dto.ts), [UsersController](../../christinacormie-backend/src/modules/users/users.controller.ts), [UsersService](../../christinacormie-backend/src/modules/users/users.service.ts), [JwtAuthGuard](../../christinacormie-backend/src/common/guards/jwt-auth.guard.ts) and [VendorStaff model](../../christinacormie-backend/prisma/schema/12-vendors.prisma). Relevant plan/mapping/gaps, T01/T02/T04/T13-A reports and current frontend session/route code were reviewed before changes.

```http
POST /api/v1/auth/staff/login
Content-Type: application/json
Accept: application/json

{"email":"<entered email>","pin":"<entered four-digit string>"}
```

- Public endpoint, no access Bearer credential; throttle 10 requests per 60 seconds. Nest success status is **201**.
- DTO uses IsEmail and requires string PIN matching exactly `^\d{4}$`. StaffLogin service lowercases email but does not trim it. Frontend trims/lowercases email before DTO submission. PIN is not trimmed/coerced to a number; leading zeros survive.
- User lookup excludes deleted users and includes roles/profile/vendor/vendorStaff/vendor relation. Missing user/staff, deleted staff, DISABLED staff or a mismatched bcrypt PIN all return **401 `Invalid email or PIN`**.
- After PIN comparison, user account SUSPENDED/DEACTIVATED/BLOCKED returns 403; PENDING returns 400 requiring email verification. Success updates lastLoginAt and creates the normal auth response.
- A staff association is required, but this login service does **not** separately check associated vendor platform status/deletion or require a fresh role-assignment check beyond the returned roles. These are not invented frontend authentication rules; staff-authorized operational services must enforce their own eligibility.

Actual response:

```ts
{
  accessToken: string,
  refreshToken: string,
  user: {
    id: string,
    email: string,
    displayName: string,
    roles: string[],
    // Included conditionally from actual roles and relations:
    vendor?: { id: string; businessName: string },
    staff?: { id: string; vendorId: string; businessName?: string }
  }
}
```

There is no explicit token-expiry field to infer. AuthService signs access JWTs with sub/email/roles and refresh JWTs with sub/jti, storing a hashed refresh record. Staff uses the same rotation and logout contracts as other users. Customer or owner accounts can acquire staff membership through T13-A, so a staff account is not necessarily a singleton role. The frontend does not manufacture CUSTOMER, VENDOR or VENDOR_STAFF membership.

The existing sourceLoginResponseSchema validates the consumed auth surface. Only tokens leave the new mutation; source user/optional actor metadata never establish frontend identity. Unknown/extra response fields, including unexpected PIN material, do not enter the auth profile/cache through this mutation.

## 3. Login UI integration

LoginPage's shell, illustration, responsive classes and navigation remain unchanged. Minimal **Regular Login / Staff Login** buttons use existing Button styling with pressed/selected state. Regular Login retains its password form, visibility control and links. Switching modes unmounts the previous form; there is no extra login route or design system.

Staff Login has email and a password-masked PIN input with numeric inputMode and maximum length four. Zod enforces exactly four ASCII numeric characters while retaining leading zeros. It never submits password and PIN together and never uses `/auth/login` for a PIN. Email survives failure; PIN is cleared at submission, on mode/unmount/session replacement, and after success through the existing guest/session flow. The screen explains that PIN resets are handled by the vendor owner.

Disabled submission/fields, a synchronous pending ref and a per-store API flight guard prevent duplicate requests. Safe failures remain inline with allowlisted field errors and Sonner error notifications. No success toast or privileged navigation is emitted from the token response.

## 4. PIN handling and security

T13-A's single-use transient credential pattern is adapted within auth.api.ts. The form calls beginStaffLogin directly; Redux receives only a random submissionId. The sensitive body is consumed from feature-local memory before HTTP and removed on completion/cancellation. No PIN in Redux action arguments/devtools, localStorage/sessionStorage, query strings, user profile state, analytics or application logs is introduced.

The response is parsed before fulfillment and the new mutation returns only tokens. Raw query metadata is discarded. Error handling reuses normalizeApiError, suppresses 5xx internals, drops raw details and redacts the submitted PIN from validation messages/structured fields before action/cache/UI exposure. Field mapping is limited to reliable structured email/PIN errors or the two exact StaffLoginDto validation diagnostics, not arbitrary text inference.

Tokens use the existing atomic session storage. No second token/session system is added. PINs necessarily exist transiently in masked form state/pending HTTP memory; this is not persistent credential storage. Tests use synthetic fixture values only, never real staff credentials.

## 5. Verified identity and session flow

1. Validate entered fields, send the public DTO, validate returned auth tokens/user shape.
2. Commit sessionStarted only if the tracked RTK mutation still exists, has not been cancelled, and the captured session ID/access/refresh context still matches. Tracking also catches a logout/storage clear while both old/new session IDs are null.
3. This creates the existing **unverified** session with no trusted user. SessionBootstrap invokes initializeSession and authenticated `GET /api/v1/users/me`.
4. Current-user parsing and toAuthenticatedUser preserve the complete returned role set, including unknown entries. Only a supported verified singleton becomes active automatically. Multiple supported roles continue through T01's explicit chooser, with no default role or owner precedence.
5. SessionGate/GuestGuard and DashboardRedirect perform navigation after verification/selection. VENDOR_STAFF maps to `/dashboard/vendor-staff`; a restored redirect to owner settings is not used to impersonate an owner.

Both stale successes and stale failures are silent after cancellation/session replacement/cache clearing. Switching modes/unmounting cancels and resets the staff request. Failure leaves an existing session untouched; legitimate PIN errors are not interpreted as expired access tokens. No role is decoded from a local label or assumed from choosing Staff Login.

## 6. Staff roles and route guards

Existing AuthGuard, RoleGuard, SessionGate, navigation filtering and role-home routing remain unchanged. Staff dashboard/tasks require verified active VENDOR_STAFF. Persisted role hints alone cannot mount protected content. Multi-role owners may choose their verified owner role, but active Staff still cannot enter owner or Admin routes.

The staff shell uses shared DashboardLayout, TopNavbar and Sidebar. Navigation offers only staff Dashboard and Tasks; Sign out uses the existing clearSession flow. These staff pages make no owner API requests. T13-A's independent verified-owner checks reject staff list/create/reset/delete even if a vendor profile is seeded in cache. Owner analytics/financial pages stay behind VENDOR guards; Admin pages remain ADMIN-only.

Current-user verification failure leaves protected content gated. Temporary errors and 403/404 are retryable initialization errors under the existing policy; definitive refresh 401 clears local auth/cache/socket state. A role removed in verified `/users/me` cannot authorize the former staff route.

## 7. G13 findings and staff-compatible reads

**The historical G13 owner-only vendor lookup is not present in current local source.** [VendorsService.getMyVendorProfile/getMyVendorQrCode](../../christinacormie-backend/src/modules/vendors/vendors.service.ts) now uses findVendorForActor, checking owner first and then ACTIVE, nondeleted staff's vendor relation. This confirms the earlier T04 finding; old audit text remains historical. No backend fix or frontend workaround was made here.

| Existing backend operation                              | Current staff contract                                                                            | T13-B decision                                                                       |
| ------------------------------------------------------- | ------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| GET `/api/v1/vendors/me`                                | Guard admits VENDOR_STAFF; service resolves active staff association                              | Verified, not newly connected to staff dashboard                                     |
| GET `/api/v1/vendors/me/qr-code`                        | Same actor lookup; platform status check remains, optional image/primary QR limits from T04       | Verified, no new QR UI/workaround                                                    |
| GET `/api/v1/food-trucks/mine`                          | VENDOR/VENDOR_STAFF with active staff actor fallback in FoodTrucksRepository                      | Verified, full truck experience deferred                                             |
| GET `/api/v1/bookings/vendor/mine`                      | VENDOR/VENDOR_STAFF and VendorBookingsQueryDto; active staff actor fallback in BookingsRepository | Verified, bookings migration deferred                                                |
| GET `/api/v1/vendors/me/analytics` and staff management | VENDOR-only controller/owner-service restrictions                                                 | No staff UI calls; management denies staff locally and remains backend-authoritative |

Sources: [VendorsController](../../christinacormie-backend/src/modules/vendors/vendors.controller.ts), [FoodTrucksController](../../christinacormie-backend/src/modules/food-trucks/food-trucks.controller.ts), [FoodTrucksRepository](../../christinacormie-backend/src/modules/food-trucks/food-trucks.repository.ts), [BookingsController](../../christinacormie-backend/src/modules/bookings/bookings.controller.ts) and [BookingsRepository](../../christinacormie-backend/src/modules/bookings/bookings.repository.ts).

A 404 from an independently requested vendor profile would mean data/association unavailable, not incorrect PIN. The new login/access path requires only auth and `/users/me`, never impersonates an owner, never guesses vendorId, and has no retry loop for vendor-profile 404. Because no profile/QR dependency is connected here, a G13-specific failure is source-audited rather than fabricated with an unused endpoint/mock. Tests verify successful staff access with an unavailable-data dashboard and no vendor/profile/owner calls.

## 8. Dashboard and tasks limitations

Previously StaffDashboard used generic DashboardOverview's sample counts (24/8/+12%) and example chart. The staff page now retains its header, three-card responsive grid, card primitives and Activity trend panel while displaying **Unavailable**, with no sample chart points. Shared generic dashboard components and other roles are untouched.

Tasks remains the existing heading/description view, now explicitly unavailable with no assigned/saved tasks. No task resource, assignments, analytics, financial operations or full staff bookings/truck experience was invented. These are honest unavailable states, not live staff data or a completed staff operations dashboard.

## 9. Errors, refresh, logout and backend limits

Staff login is added to both existing public-auth transport allowlists. It sends no current Bearer header, does not wait for an older refresh, and does not refresh/retry a PIN 401. Errors cover invalid fields, incorrect/inactive/removed credentials, account restrictions, 429, malformed responses and network/server failures. Email remains available for correction; PIN is re-entered. Identity retry calls `/users/me`, not another PIN login.

Authenticated requests retain existing one-flight refresh, rotation, one retry, stale refresh/bootstrap protections and cross-tab storage synchronization. Refresh responses do not replace verified UI identity with a token-user hint. Logout revokes the captured refresh token best-effort and always clears local auth, caches and socket; subsequent staff login works through the same infrastructure.

Backend limits remain explicit: refresh checks user account/token validity but does not separately recheck staff ACTIVE membership or vendor status. `/users/me` serializes roles/user data without a fresh staff-eligibility decision; JWT guards validate signature/expiry rather than querying current membership/account status on every request. Disabling/removing a staff record therefore is not guaranteed to instantly invalidate every previously issued JWT or currently verified UI identity. Staff actor services still enforce association checks, and bootstrap revalidates current roles; no immediate global revocation guarantee is claimed. Stronger membership/session-family revocation requires backend scope, not a frontend role workaround.

## 10. Automated validation

The existing test runner was inspected: production SSR test bundling followed by Node tests with mocked HTTP and a server/network guard; no development server/browser is started.

- Focused new staff login/access + existing auth + T13-A staff management: **110 passed, 0 failed** (44 new tests, 25 existing auth tests, 41 T13-A tests).
- Development TypeScript: **passed** before final refinements; final build rechecks the final source.
- Final full suite (`npm.cmd test`): **835 passed, 0 failed, 0 skipped**, one final complete run including all 791 prior regressions.
- Production build (`npm.cmd run build`, includes TypeScript): **passed**.
- Repository ESLint (`npm.cmd run lint`): **passed**, no diagnostics.
- Changed-file Prettier, report local-link/manifest and `git diff --check`: **passed**.
- Backend status matches the initial snapshot: only the two pre-existing untracked audit documents; no backend source changes.

Coverage: exact endpoint/payload/public transport; leading zeros and invalid PIN/email; safe 400/401/403/404/429/5xx/network errors; actual/malformed token responses; `/users/me` verification/failure/retry; singleton/multi-role/removed-role decisions; actual guarded routes/navigation and unavailable dashboard/tasks; owner management/Admin restrictions; persisted-session bootstrap; role-cache cleanup; shared refresh success/failure/in-flight replacement; logout/socket/cache cleanup and subsequent login; concurrent/cancelled authentication; cross-tab session restore/clear; delayed success/error; PIN exclusion from actions/state/storage/logs and safe validation mapping. T13-A remains included unchanged.

Early focused checks corrected a test assumption: invalid-session cache reset can settle RTK's outer query promise without a rejection, so the test asserts actual auth/content cleanup. Lint findings in new code were corrected without disabling rules.

Browser/manual mode switching, focus/keyboard/responsive behavior and live non-production database/CORS authentication remain unexecuted under AGENTS.md sections 12–13. Static rendering/mocked HTTP do not certify browser appearance or live backend operations. No production calls/credentials, dependency installation, backend runtime/check commands or environment-secret changes were used.

## 11. Remaining decisions

- Approve an actual staff statistics/read workflow before connecting dashboard data, with staff-specific vendor identity semantics rather than owner checks reused indiscriminately.
- Task management lacks a verified persistent resource/approved workflow (U02); no task implementation is included.
- Optional QR presentation/share destination/image availability retain T04 limitations; no staff QR experience is added.
- Immediate staff revocation and membership rechecks during refresh require backend policy/implementation if desired; source-level limits above remain.
- Live backend/provider/database and manual browser release checks remain outstanding. Historical G13 is not a current-local-source blocker.

## 12. T13-B acceptance

**Supported authentication/access scope is complete:** real staff PIN login, existing pending-session/current-user verification, full verified roles and explicit multi-role choice, protected staff routes, owner/Admin exclusions, safe credentials/errors and refresh/logout/session isolation. Existing LoginPage design and T13-A are preserved. Dashboard/task data remains explicitly unavailable rather than fabricated.

Acceptance is based on source-contract verification and automated results above, with live/manual checks and backend revocation limits stated. No full staff dashboard/task system or production certification is claimed. Work stops at T13-B; Sprint 4/T14 is not started.

## Sprint 3 completion summary

| Task                                                                                                                                                                              | Implemented within approved scope                                                                                                                                             | Deferred/blocked                                                                                                                                                                                        |
| --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [T10](sprint-3-t10-profile-settings-vendor-menu-integration.md)                                                                                                                   | Supported Customer profile/avatar/password/account operations and truck leads; Vendor profile/gallery/menu create/edit/availability                                           | Unsupported full-name/bio writes, capacity-range mapping, spatial inputs and permanent menu deletion; provider/idempotency limits                                                                       |
| [T11-A](sprint-3-t11a-community-reads-integration.md) / [T11-B](sprint-3-t11b-community-publishing-integration.md) / [T11-C](sprint-3-t11c-community-interactions-integration.md) | Real community reads/categories/paging/detail; supported Customer/Vendor publishing/media/edit/delete; comments/replies/LIKE/report/hide/restore and organizer interest reads | Geographic input source; optional publishing inputs/asset cleanup; other-user Vendor Orders interest flow dataset; organizer invite/decline, missing reaction/block contracts; financial/realtime scope |
| [T12](sprint-3-t12-rewards-referrals-integration.md)                                                                                                                              | Real referral-code reads/copy and remaining reward contract audit; existing rewards displays retained                                                                         | Creation has no approved existing Generate action; no referral URL convention; optional apply/bonus/redemption/vendor-confirmation workflows lack approved UI                                           |
| [T13-A](sprint-3-t13a-vendor-staff-management-integration.md)                                                                                                                     | Real owner staff list/create/reset/delete with secure PINs, confirmation and session isolation                                                                                | Unsupported lock/unlock; backend plaintext response PIN/email receipt/revocation limits                                                                                                                 |
| T13-B                                                                                                                                                                             | Real Staff Login and verified route access; safe session flow; sample dashboard values removed                                                                                | Staff analytics/tasks/QR/bookings migration remain outside scope; live/manual checks and backend membership/revocation policy                                                                           |

Sprint 3's supported integration work is implemented with the documented product/backend limits. Deferred workflows are not represented as completed roadmap features.
