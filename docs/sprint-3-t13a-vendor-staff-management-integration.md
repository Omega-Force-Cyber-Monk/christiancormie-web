# Sprint 3 — T13-A: Vendor staff management integration

## 1. Scope and exact changed files

The existing Vendor Settings staff screen now lists, creates, resets PINs and permanently deletes real staff through the shared API. T13-B staff login/access verification, staff dashboards/tasks, unsupported lock/unlock writes and Sprint 4 are outside this change.

| File                                                                                              | Change                                                                                                |
| ------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| [vendorStaff.api.ts](../src/features/vendor/api/vendorStaff.api.ts)                               | Four owner-scoped endpoints, validation, single-flight writes, PIN handoff and safe errors            |
| [vendorStaff.schema.ts](../src/features/vendor/schemas/vendorStaff.schema.ts)                     | Reviewed response schemas that exclude PIN material                                                   |
| [settings.schema.ts](../src/features/vendor/schemas/settings.schema.ts)                           | Four-digit string PIN and create/reset form validation                                                |
| [VendorStaffManagement.tsx](../src/features/vendor/components/settings/VendorStaffManagement.tsx) | Real records, Add Staff, reset/delete actions, loading/errors and owner gating                        |
| [VendorStaffPinDialog.tsx](../src/features/vendor/components/settings/VendorStaffPinDialog.tsx)   | Masked reset input inside the existing confirmation dialog                                            |
| [VendorSettingsPage.tsx](../src/features/vendor/pages/VendorSettingsPage.tsx)                     | Disconnects the sample staff reducer from the live screen                                             |
| [ConfirmationDialog.tsx](../src/components/overlays/ConfirmationDialog/ConfirmationDialog.tsx)    | Optional content slot for reset input; existing lifecycle/confirmation behavior preserved             |
| [confirmation.types.ts](../src/components/overlays/ConfirmationDialog/confirmation.types.ts)      | Optional ReactNode children type                                                                      |
| [baseApi.ts](../src/services/api/baseApi.ts)                                                      | VendorStaff cache tag                                                                                 |
| [vendorStaffIntegration.test.mjs](../src/features/vendor/utils/vendorStaffIntegration.test.mjs)   | Backend-shaped mocked staff regressions                                                               |
| [settingsState.test.mjs](../src/features/vendor/utils/settingsState.test.mjs)                     | Replaces sample UI expectations with real seeded records; keeps prior reducer/password/guard coverage |
| [This report](sprint-3-t13a-vendor-staff-management-integration.md)                               | Contracts, behavior, validation and remaining limits                                                  |

No backend source, environment files, dependencies, stylesheets, routes, authentication infrastructure or unrelated services were changed. The frontend working tree was clean at the start; previous sprint work remains intact. Disconnected sample helpers/fixtures are retained for their isolated historical tests and are not an active UI fallback.

## 2. Verified backend contracts

Current backend source takes precedence over the historical mapping: [VendorsController](../../christinacormie-backend/src/modules/vendors/vendors.controller.ts), [VendorsService](../../christinacormie-backend/src/modules/vendors/vendors.service.ts), [VendorsRepository](../../christinacormie-backend/src/modules/vendors/vendors.repository.ts), [CreateVendorStaffDto](../../christinacormie-backend/src/modules/vendors/dto/create-vendor-staff.dto.ts), [ResetVendorStaffPinDto](../../christinacormie-backend/src/modules/vendors/dto/reset-vendor-staff-pin.dto.ts) and [Vendor/VendorStaff Prisma models](../../christinacormie-backend/prisma/schema/12-vendors.prisma).

All four operations use JwtAuthGuard + RolesGuard with **VENDOR only**. Service lookup is `findByUserId(actor.sub)`, not staff fallback or a caller-supplied vendorId. Vendor status must be **APPROVED or PENDING_APPROVAL**; optional verification badge approval is not required. Missing owner profile gives 404, ineligible platform status 403, and JWT/role restrictions remain authoritative.

| Endpoint                                           | Request                                      | Actual success response                                                                    |
| -------------------------------------------------- | -------------------------------------------- | ------------------------------------------------------------------------------------------ |
| GET `/api/v1/vendors/me/staff`                     | No body, filters or pagination DTO           | 200 `{ items: Staff[] }`; nondeleted records for this vendor, ordered createdAt descending |
| POST `/api/v1/vendors/me/staff`                    | `{ email: string, pin: string }`             | 201 `{ id, email, pin, status, addedAt, message }`                                         |
| POST `/api/v1/vendors/me/staff/:staffId/reset-pin` | Actual staff UUID in path; `{ pin: string }` | 201 same staff details plus message; status set to ACTIVE                                  |
| DELETE `/api/v1/vendors/me/staff/:staffId`         | Actual staff UUID, no body                   | 200 `{ deleted: true, message: string }`                                                   |

`Staff` is `{ id, email, pin, status, addedAt }`. Status is Prisma `ACTIVE | DISABLED`; addedAt is createdAt serialized as an ISO instant. The server presenter decrypts and returns PINs, including in the list. Client schemas deliberately consume only id/email/status/addedAt plus mutation message, removing PIN/hash/encrypted/unknown fields before fulfillment and caching. No PIN is rendered in the roster.

DTO PIN validation is a string matching exactly `^\d{4}$`. Email uses IsEmail; the service normalizes with trim/lowercase. The frontend normalizes email before validation and preserves PIN leading zeros without numeric conversion or random generation. Unsupported form properties are stripped; no placeholder inputs or extra vendorId is sent.

Creation checks duplicate active staff for the same vendor (409), deleted/incompatible suspended or blocked user accounts (400), and assignment to another vendor (409). It can create a new user, add VENDOR_STAFF to an existing compatible account, or reuse a deleted staff association. Creation sets staff ACTIVE and can activate a PENDING user/mark email verified in the backend. The frontend does not simulate these changes or infer staff login behavior.

Reset and deletion require the nondeleted staff ID to belong to the current owner vendor; missing/foreign/deleted staff gives 404. Reset replaces hash/encrypted PIN and sets staff ACTIVE. Deletion physically removes the staff row and VENDOR_STAFF role. If no roles remain, the service also deletes the staff-only user and associated settings/profile/refresh/device records; other roles are retained. Deletion is permanent removal, not disabling access temporarily.

## 3. Staff listing and preserved design

The existing Settings page, staff cards, responsive classes, title/back control, Add Staff disclosure, reset/delete icons and confirmation styles remain. Required PIN fields use existing FormField styling. No global CSS or layout redesign was introduced.

The roster uses actual UUIDs, normalized email, returned status and addedAt displayed in explicit UTC. It has initial loading, background refresh, true empty, retry and safe contextual errors. No sample identity/PIN/status substitutes are shown. Temporary list failures preserve prior records with error feedback; definitive 401/403/404 hides them. Initial pending reads do not report a false zero-member empty state. Refresh permits reconciliation after ambiguous failures.

## 4. Staff creation

Add Staff now requires email plus a password-masked, numeric-keyboard four-character PIN input. React Hook Form/Zod validate both. PINs such as `0007` remain strings. Duplicate or incompatible account responses remain recoverable inline errors, with reliable structured errors assigned only to email/PIN and Nest arrays kept at form level. Failure retains email; PIN must be re-entered.

Creation runs only on explicit submission. UI pending state/ref guards and shared per-session API single-flight prevent duplicate or conflicting staff changes. Success is shown only after validated backend fulfillment. The form closes after success and VendorStaff refetches. No local staff row is inserted as a substitute for the server record.

## 5. PIN reset

Reset PIN opens the existing ConfirmationDialog with the selected real email and a masked **New staff PIN** input. The shared dialog gained only an optional children slot; existing descriptions, errors, processing controls, cancellation, focus/Escape/modal lifecycle and other consumers retain their behavior.

Confirmation explicitly describes the backend ACTIVE-status side effect. A new four-digit string is required and no random PIN is generated. The API checks that the UUID is still in the scoped roster and verifies the response ID/email matches that selected member. The dialog is keyed by staff ID, keeps failures visible, blocks concurrent writes, clears PIN input when submitting/cancelling, and closes after confirmed success. Staff data refreshes after success. Stale responses cannot announce success or change a replacement selection/session.

## 6. Staff deletion

The existing deliberate danger confirmation identifies the actual email and permanent staff-access removal. It captures the selected UUID, revalidates membership before sending, and requires explicit confirmation. No optimistic row removal occurs. Only literal `deleted: true` satisfies the success schema and invalidates VendorStaff. False/malformed success, missing/deleted staff, network and server failures remain failures with the current roster available for reconciliation.

## 7. PIN security

- PIN input exists only in local form drafts and the pending HTTP operation; fields are password-masked, never number inputs.
- Create/reset helpers pass an opaque single-use submission ID into RTK Query. A feature-local memory handoff consumes the sensitive body before HTTP and removes unused entries in finally. PINs are absent from Redux mutation arguments and plain action payloads, including devtools-visible metadata.
- Success schemas strip response credentials before RTK fulfillment/cache; mutation handles are reset on completion. Remote staff records live only in RTK Query.
- Errors pass through established safe normalization; 5xx internals are suppressed and submitted PIN text is redacted from returned validation messages/structured field errors before actions/cache. Raw response metadata is not propagated.
- Inputs clear on submission/cancel/success; unmount/session/role replacement discards local drafts. No PIN localStorage, sessionStorage, analytics, application logs, general Redux state or persistent secret store was added.
- The browser/network and backend necessarily receive submitted PINs. Frontend filtering cannot remove plaintext PINs already transmitted by the server; narrowing the backend presenter remains a backend security improvement outside this task.

## 8. Unsupported lock/unlock — U05

Current vendor controllers still expose only staff list/create/reset/delete. No supported staff lock/unlock route was found. Existing lock/unlock controls remain visible but disabled with a title and visible explanation. Icons follow returned ACTIVE/DISABLED status; there is no local persisted-status claim or invented PATCH. Deletion is never presented as locking. Reset's genuine ACTIVE side effect is stated rather than used as a substitute unlock feature.

## 9. Authorization, session and caches

The screen reuses T04 useVendorContext/vendorAccessState and verified active VENDOR role, owner-user association, account restrictions and dashboardAccess. Staff sessions cannot access this owner screen. API functions independently require matching verified session/user/active role and eligible cached vendor ownership; definitive vendor-profile denial also blocks operations. No user-entered vendorId grants access.

Staff query keys include session/user/role and unused data retention is zero. Shared scopedRead checks session before/after requests; owner eligibility is rechecked at completion. Shared sessionFlight serializes staff writes. Local content is keyed by session/user/role/vendor identity, and feedback is guarded by mounted/current-owner checks. Logout and role/session replacement reuse existing cache/socket cleanup; delayed results cannot populate the new identity or trigger success invalidation.

All endpoints inject into shared baseApi and preserve central Bearer headers, single-flight refresh and bounded retry. Successful create/reset/delete invalidate only **VendorStaff**. No demonstrated dependency requires invalidating analytics, financial, truck, rewards or general vendor caches. Reads do not duplicate server state in ordinary Redux.

## 10. Tests and validation

The existing server-free runner was inspected before execution. It production-builds selected tests and runs Node with mocked HTTP and a server/network guard. No new dependencies or test infrastructure changes were needed.

- Focused staff + existing Settings suite: **52 passed, 0 failed** (41 new staff tests plus 11 preserved/updated Settings regressions).
- Development TypeScript and focused lint: **passed**.
- Final full regression suite (`npm.cmd test`): **791 passed, 0 failed, 0 skipped**, one final full run, including T01–T12 regressions.
- Final production build (`npm.cmd run build`, includes TypeScript): **passed**.
- Repository lint (`npm.cmd run lint`): **passed**, no diagnostics.
- Changed-file Prettier, report local links/manifest and `git diff --check`: **passed**.
- Backend status matches the initial snapshot: only the two pre-existing untracked audit documents, no backend source changes.

Coverage includes all four endpoint URLs/methods/JWTs/body/envelopes; real IDs; malformed schema/deleted:false; normalized email and leading zeros; duplicate/incompatible-account errors; empty/loading/background/error states; correct reset/delete identity and missing staff; owner/staff/customer/admin/unverified/mismatched/status restrictions; duplicate/conflicting changes; PIN exclusion from responses/actions/state and error redaction; shared 401 refresh/retry; precise tag invalidation; and read/create/reset/delete responses after logout, new login or role switch. Historical static reducer tests remain isolated from the connected screen, and Settings route/password/role assertions remain.

Early development checks found a circular inference/type issue and outdated sample/SSR test assumptions; these were corrected without disabling checks. An initial broad PIN-text assertion also matched an unrelated seeded booking display number; it now checks the credential string rather than that substring. Full-suite results below are the final validation, not the historical baseline.

Browser interaction, responsive visual review, real email receipt and live non-production database/CORS behavior were not executed. AGENTS.md sections 12–13 prohibit starting servers/browser automation; tests use static rendering rather than claiming modal/focus/browser certification. No production credentials/API calls, backend runtime/check commands, environment-secret changes or package installs were used.

## 11. Remaining backend/product limitations

1. U05 lock/unlock needs a real backend contract; it remains unavailable.
2. Backend sendStaffPinEmail catches/logs provider failures and does not reject creation/reset. The UI confirms the account/PIN change and explicitly does not claim independently verified delivery. Mail transport/receipt needs environment verification.
3. The plaintext response PIN is filtered from frontend cache/actions/UI but remains on the backend wire response. A narrower backend presenter would address that source exposure; backend changes are prohibited here.
4. No idempotency key or rollback guarantee exists for lost responses. A change may persist even when the client cannot confirm it; use Refresh staff and explicit retry rather than claiming exactly-once semantics. UI/API single-flight prevents duplicates within this session, not cross-client races. HTTP already accepted by the backend cannot be undone by frontend logout; stale completion is suppressed locally.
5. Current JWT revocation/account enforcement remains the existing backend responsibility. No guards or refresh protections are weakened. Staff login and its permitted destinations are reserved for T13-B.

## 12. T13-A acceptance status

**Supported staff management is implemented:** owner-only actual listing, caller-entered four-digit string PIN creation/reset, deliberate confirmed deletion, precise cache refresh and session-safe failure/success handling. Settings design and confirmation infrastructure are preserved. Lock/unlock remains explicitly unsupported; PINs are not shown or retained in frontend caches/state/actions.

Acceptance is based on source-contract verification and automated checks recorded above, with live/mail/browser release checks still outstanding. This does not claim staff login/dashboard/task integration. Work stops at T13-A; T13-B and Sprint 4 are not started.
