# Sprint 3 — T12: Rewards and referrals integration

## Scope and acceptance

The existing Customer invitation UI now reads real referral codes and copies an available code. Existing T06 rewards reads and presentation are preserved. Contract verification is complete for the remaining referral, bonus and redemption operations.

**T12 existing-UI integration and audit scope is complete; referral-code creation is blocked by the absence of an existing Generate/Create action.** The invitation dialog previously offered only Copy invitation link. Copy has not been repurposed to create codes, and opening the dialog never creates one. The brief explicitly allows retaining reads and documenting this blocker. Optional workflows below remain deferred, not implemented. T13 was not started.

## Exact files changed for T12

Earlier sprint changes in the working tree are preserved and are not part of this manifest.

| File                                                                                           | Change                                                                               |
| ---------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| [SettingsInvite.tsx](../src/features/customer/components/settings/SettingsInvite.tsx)          | Real scoped reads, availability/status/usage, loading/errors/retry, actual code copy |
| [referrals.api.ts](../src/features/referrals/api/referrals.api.ts)                             | Shared RTK Query GET endpoint                                                        |
| [referrals.schema.ts](../src/features/referrals/schemas/referrals.schema.ts)                   | Runtime validation of returned codes                                                 |
| [referralAdapters.ts](../src/features/referrals/utils/referralAdapters.ts)                     | Program filtering, availability and guarded clipboard operation                      |
| [referralsIntegration.test.mjs](../src/features/referrals/utils/referralsIntegration.test.mjs) | Focused mocked regressions                                                           |
| [baseApi.ts](../src/services/api/baseApi.ts)                                                   | Adds only the ReferralCodes cache tag                                                |
| [This report](sprint-3-t12-rewards-referrals-integration.md)                                   | Verified contracts, scope decisions and validation                                   |

Backend source, environment files, dependencies, authentication infrastructure, layouts and stylesheets were not changed.

## Verified referral contracts

Source of truth: backend `src/modules/referrals/referrals.controller.ts`, `referrals.service.ts`, `referrals.repository.ts`, both DTOs in `dto/`, and `prisma/schema/24-referrals.prisma`. Routes below include the backend `/api/v1` prefix; the shared frontend base query supplies that prefix.

### GET /api/v1/referrals/codes — connected

- JWT required; controller has no role guard. No body, filters or pagination DTO.
- Returns a **raw array**, scoped by backend to `ownerUserId`, ordered by ID descending. Despite the Swagger description, the repository does not filter out inactive, expired or exhausted codes.
- Each code has `id`, `ownerUserId`, `code`, `programType` (`CUSTOMER` or `VENDOR`), nullable `maximumUses`, `usageCount`, nullable `expiresAt`, and `isActive`. The Prisma code model has **no createdAt/updatedAt** fields; Swagger examples are not used as a contract.
- Repository includes recent referrals (at most 20) and rewards. The frontend strips these unused nested records; usage comes from `usageCount`, not the nested array length.
- Runtime validation checks UUIDs, program enum, integer counters/limits and nullable ISO expiration. A foreign owner or malformed response is rejected, rather than rendering fallback codes.

### POST /api/v1/referrals/codes — audited, not connected

- JWT required; no program-to-role guard in backend. Service checks that the owner exists and is not deleted; it does not enforce an additional ACTIVE-status/vendor-approval rule.
- DTO: required `programType: CUSTOMER | VENDOR`; optional `code: string` (maximum 50 characters), `maximumUses: integer >= 1` (numeric transformation), and ISO `expiresAt`. Service requires expiration to be in the future.
- Service trims/uppercases a supplied code, or generates a code on the server when omitted. The frontend must never generate a substitute. DTO does not enforce a nonempty custom code.
- Creates a **new** globally unique code on every call. There is no reuse/one-code-per-program/idempotency rule. Duplicate custom codes or generated collisions produce 409; invalid input/future-date violations produce 400; missing/deleted user produces 404. JWT failures are handled by the existing auth infrastructure.
- Response is the raw newly created code record, without a wrapper or award confirmation.
- Customer invitation intent supports `CUSTOMER`; this is not permission to invent a campaign or expose the VENDOR program in Customer settings.
- No matching Generate/Create action exists. Therefore there is no unused frontend POST definition, automatic POST, create invalidation or duplicate-create request path. Once a creation action is approved, it must send the verified program, prevent duplicate submission, use only the returned code and invalidate `ReferralCodes` after success.

## SettingsInvite behavior and preserved UI

The existing Settings/Profile entry points, dialog lifecycle, layout, responsive classes, shared controls and `settings-primary` button styling remain in place. The invitation content replaces the generic signup link with returned Customer codes. Multiple codes are displayed independently; no arbitrary default code is selected. VENDOR codes returned for a dual-role owner are excluded from this Customer UI.

Each record displays the actual code, program, expiration, usage count/limit and derived status. Empty codes, inactive codes, expiration at or before the current time, and exhausted limits disable copying. Expiration is updated while the dialog remains open and checked again at copy time. Availability is informational; backend validation remains authoritative if a recipient later applies the code.

Initial loading, background refresh, empty results, normalized API errors, retry and malformed responses are handled. Temporary failures preserve known records with an error; definitive 401/403/404 hides them. Copy is disabled during refresh. No-codes state explicitly explains that creation is unavailable here.

Copy writes **only the actual backend code** and confirms only after clipboard success. Missing/rejected clipboard access gives an error and manual selection remains possible. Concurrent clicks are blocked; completions after unmount/session replacement do not announce success in a newer context. Copy does not apply a referral or award points.

`/signup` exists, but current SignupForm has neither approved referral query parsing nor a referral-code input. An optional `referralCode` in auth schemas/types does not establish a public URL convention. No shareable URL or query parameter is fabricated.

## Existing T06 rewards verification

Existing shared endpoints `GET /api/v1/rewards/me/profile-summary` and `GET /api/v1/rewards/rules`, their schemas, `Rewards` tag and `RewardsPanel` were inspected and left unchanged. The Customer profile and Settings points dialog continue to use these implementations.

The panel distinguishes available, lifetime and redeemed points; uses returned current/next tiers, thresholds, rules and activity; computes next-tier progress from lifetime points and the returned next-tier requirement; and shows maximum-tier state when no next tier exists. Artwork mapping is presentational. No fixed referral bonus, threshold or credit conversion was introduced. These are information displays, not claim/redeem actions.

Backend summary reads already refund expired pending redemptions and ensure a loyalty account. This existing backend behavior was verified, not duplicated or removed in the frontend.

## Remaining endpoint audit and classification

Source: backend referrals module above; `src/modules/rewards/rewards.controller.ts`, `rewards.service.ts`, `rewards.repository.ts`, the reward DTOs, `prisma/schema/23-loyalty.prisma`, and vendor redemption controller/DTO/service paths. No live calls were made.

| Endpoint                                      | Actual inputs and authorization                                                                                                                   | Response and business rules                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              | Existing UI / classification                                                                                                                                                                |
| --------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| POST `/api/v1/referrals/apply`                | JWT, no role guard; `{ code: string }`, max 50                                                                                                    | Trim/uppercase lookup; invalid/missing/inactive 404; own, expired or limit reached 400; already referred 409. Transaction creates raw **PENDING** Referral including referralCode and increments usage atomically. Qualification/award timestamps initially null.                                                                                                                                                                                                                                                                        | No apply input/action in current signup or Settings. **Blocked by missing UI; deferred pending approval.**                                                                                  |
| POST `/api/v1/rewards/redeem`                 | JWT, no Customer role guard; `{ rewardRuleId: UUID }`; throttle 10/min                                                                            | Existing active rule, date window, positive required points, per-user/campaign limits and sufficient balance required. Rule missing 404, business failures 400. Transaction debits points and returns raw **COMPLETED** RewardRedemption including rule. Does not represent a separate vendor-confirmed visit.                                                                                                                                                                                                                           | Rules are displayed but there is no selection/confirmation/redeem action. **Deferred pending approved redemption UI.**                                                                      |
| POST `/api/v1/rewards/me/daily-streak`        | JWT, no role guard, no body DTO; throttle 5/min                                                                                                   | UTC daily idempotency key. Returns `{ awarded, pointsEarned, currentPoints, message }`; currentPoints may be null. Duplicate/no active rule can return `awarded: false`. Points/message alone do not prove a new award. Missing/deleted user 404.                                                                                                                                                                                                                                                                                        | No existing claim action. Page opening is not approval for a mutation. **Deferred pending claim/timing decision.**                                                                          |
| POST `/api/v1/rewards/me/birthday-bonus`      | JWT, no role guard, no body DTO; throttle 5/min                                                                                                   | Stored DOB required and current UTC month/day must match; otherwise 400. Yearly idempotency. Same award result as daily claim; duplicate can return false rather than the Swagger-described error.                                                                                                                                                                                                                                                                                                                                       | Signup DOB is not a bonus-claim action. **Deferred pending approved claim UX.**                                                                                                             |
| POST `/api/v1/rewards/me/redemption-codes`    | JWT, no Customer role guard; throttle 10/min; optional `rewardRuleId: UUID`, `foodTruckId: UUID`; `amount: integer 1..5` required when no rule ID | Rule path derives value/points/funding/minimum purchase from eligible active rule and limits; generic amount path uses backend policy. Selected truck must exist, be active and have eligible vendor/rule scope. Balance and limits checked. Transaction debits points at issuance and creates **PENDING** redemption. Response: redemptionId, private redemptionToken, backupCode, amount/rewardAmount, nullable rewardRuleId/minimumPurchaseAmount, fundingType, pointsSpent, expiresAt, status and message. Expires after 15 minutes. | No approved rule/amount/truck input, confirmation or private-code presentation. **Blocked by missing UI; deferred.** No token/backup-code client storage, logs, analytics or modules added. |
| GET `/api/v1/rewards/me/redemptions`          | JWT, no Customer role guard; no query/pagination DTO                                                                                              | Raw array of completed, used, vendor/truck-bound redemptions eligible for review, ordered usedAt descending; **not all redemption history**. Presenter: id, foodTruckId/name, vendorId, numeric amountApplied, nullable minimumPurchaseAmount, confirmedAt, redemptionMethod, alreadyReviewed, nullable reviewId. No private token/backup code.                                                                                                                                                                                          | No matching history/eligible-review chooser. **Deferred pending product scope**, not an unused query.                                                                                       |
| POST `/api/v1/vendors/me/redemptions/confirm` | JWT + roles VENDOR/VENDOR_STAFF; throttle 20/min; optional string redemptionToken or manualCode (max 10), service requires a usable credential    | Owned vendor or active nondeleted staff vendor; vendor must be approved/pending approval and accept credit. Finds pending unexpired code, validates truck ownership/rule scope, atomically marks COMPLETED and binds vendor/method/usedAt. Missing code 404; ownership/scope/already-used 400; vendor restrictions 403. Returns `{ success: true, amountApplied, minimumPurchaseAmount, customerName, remainingCustomerBalance, message }`.                                                                                              | No scanner, manual-code form or confirmation workflow. **Separate Vendor workflow, deferred pending explicit UI approval. Never called from Customer UI.**                                  |

Referral application does not mean immediate points. Qualification is a separate backend/admin process; no admin award endpoint was connected. Usage updates are conditional and transactional, so competing applications cannot exceed the limit. The referral record's uniqueness prevents a user being referred repeatedly.

Points, monetary credit, redemption ID, token, backup code and completed confirmation remain distinct. Rule-based issuance can differ from the generic amount bound; the client must not invent a universal credit cap/conversion. Expired pending credits are refunded by existing backend logic. Notifications after some mutations occur after persistence, so a future UI must not assume every error means no write occurred or blindly retry financial operations.

## Authorization, caches and errors

Only the referral read is newly connected. It injects into the existing `baseApi`, uses centralized JWT headers/refresh/retry, and reuses `scopedRead`. Verified session ID, user ID, CUSTOMER active role and backend-verified role membership are checked before and after the request. Returned owner IDs must match the requesting user. No persisted role is treated as verified identity.

Query arguments contain session/user/role identity, `keepUnusedDataFor` is zero, and the query provides `ReferralCodes`. Existing logout/reset behavior and stale-response protections are preserved. Role/session-keyed content clears local clipboard feedback. Existing Rewards caches are reused and not invalidated by read/copy; financial/vendor caches are untouched. Error handling uses the existing safe normalization architecture, not raw server messages.

## Validation results

- Focused referral, member/rewards and settings regressions: **87 passed, 0 failed**.
- Referral-only regressions: **29 passed, 0 failed**.
- Final full regression suite (`npm.cmd test`): **750 passed, 0 failed, 0 skipped**; one final full run.
- Development TypeScript and focused ESLint: no diagnostics.
- Production build (`npm.cmd run build`, includes `tsc -b`): **passed**.
- Repository lint (`npm.cmd run lint`): **passed**.
- Changed-file Prettier check, report local-link validation and `git diff --check`: **passed**.
- Backend status matches the starting snapshot: only the two pre-existing untracked audit documents; no backend source changes.

Coverage includes exact GET/JWT/raw-array adaptation, mixed programs, multiple/empty/unavailable codes, usage/expiration boundaries, unexpected response/foreign owner, manual clipboard fallback/rejection and delayed copy suppression, no invented URL/automatic POST, verified-role/session isolation, logout/new login during pending reads, refresh/retry, 400/401/403/404/409/500/network behavior, retained data on temporary failures, definitive denial hiding cached codes, ReferralCodes/Rewards cache separation, and rewards balances/tiers/rules/activity/max-tier regressions. The full suite preserves prior authentication, guards and T01–T11 regressions.

POST creation and duplicate-create execution tests were **not run**: no approved existing creation action exists, so no creation mutation is implemented. Optional mutations were source-audited rather than given unused speculative mocks. Tests use mocked HTTP through the existing server-free runner. No production credentials, live backend calls, development servers, browser automation or screenshots were used. Manual responsive/clipboard/browser verification remains with the user under AGENTS.md sections 12–13.

## Remaining decisions and backend observations

1. Approve an explicit Generate/Create control before implementing creation, including whether custom code, limit or expiration inputs are wanted. Omitted optional values must stay omitted rather than become placeholders.
2. Approve a referral destination and parameter convention before sharing URLs; separately approve any referral application input/timing. No new signup behavior is included here.
3. Define approved claim, reward selection/confirmation, redemption-code display/history and separate Vendor confirmation flows before connecting those endpoints.
4. Backend Swagger examples/descriptions differ from source for code timestamps, active-only lists and some duplicate-claim behavior. This implementation follows source. Backend referral creation also does not restrict programs by account role; Customer UI gating is narrower and does not replace backend authorization.

No backend change is made or required for the implemented read/copy flow. Creation and optional workflows are explicitly deferred, not represented as completed integrations.
