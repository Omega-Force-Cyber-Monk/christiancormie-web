# Sprint 4 — T15-C: Customer booking issues

## 1. Files changed

- `src/features/customer/api/bookingIssues.api.ts`
- `src/features/customer/schemas/bookingIssues.schema.ts`
- `src/features/customer/components/orders/CustomerBookingIssues.tsx`
- `src/features/customer/api/bookingIssues.test.mjs`
- `src/features/customer/api/bookings.api.ts`
- `src/features/customer/schemas/booking.schema.ts`
- `src/features/customer/pages/CustomerOrdersPage.tsx`
- `src/features/customer/api/bookings.test.mjs` — detail contract fixture.
- `src/services/api/baseApi.ts` — two issue cache tags only.
- `docs/sprint-4-t15c-customer-booking-issues.md`

Prior uncommitted changes are preserved. No backend, dependency, environment, fixture Community flow or financial API changes.

## 2. Endpoints integrated

All require JWT and reuse shared refresh/retry, session guards and safe errors.

| `/api/v1` endpoint                                   | Verified response                                                                                        |
| ---------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| GET `/bookings/:bookingId/issues`                    | `{items}`; newest issues first, each with chronological messages, messagesCount and lastMessage.         |
| POST `/bookings/:bookingId/issues`                   | HTTP 201 `{message, issue}`; body `{message}` trimmed, nonempty, maximum 2000 characters.                |
| GET `/bookings/:bookingId/issues/:issueId/messages`  | `{issue, messages}`; chronological thread includes the original description as a server-created message. |
| POST `/bookings/:bookingId/issues/:issueId/messages` | HTTP 201 `{message, item}`; same message validation. Only OPEN issues accept messages.                   |

Verified against current [service](../../christinacormie-backend/src/modules/bookings/bookings.service.ts), [repository](../../christinacormie-backend/src/modules/bookings/bookings.repository.ts), [controller](../../christinacormie-backend/src/modules/bookings/bookings.controller.ts) and [DTOs](../../christinacormie-backend/src/modules/bookings/dto/booking-issue.dto.ts).

Issue fields: id, bookingId, OPEN/RESOLVED/DISMISSED status, message, nullable resolutionDecision/resolutionNote/resolvedById/resolvedAt, createdAt. Message projection: id, nullable senderUserId, senderRole, senderName, message, createdAt; unused sender/email objects are stripped. The presenter does not return issueId on each message: thread identity comes from its validated issue envelope and authenticated request path. Send acknowledgments also validate current Customer sender and submitted text.

## 3. Working UI and protections

Selected Customer Orders detail now displays real issue history, status/resolution details, selected messages, issue reporting and message submission. Existing form/error/button/confirmation patterns are reused; no fixture booking or preview callback feeds these actions.

Creation requires the verified Customer owner, completionRequestedAt, no completedAt/COMPLETED status, no open issue, valid message and explicit confirmation that reporting can block completion/payout. The backend remains authoritative and transactionally prevents a second open issue. Sending requires an owned selected booking and known OPEN issue/thread.

Success appears only after a validated server response. Drafts clear only on confirmed success; recoverable errors keep them. Background detail failures hide server content while preserving mounted forms. Booking/issue selection keys and mounted/session checks prevent old results or notifications appearing in a replacement selection/session. Queries use currentData, immediate unused-cache expiry and identity-bound arguments; error/empty/loading/retry states remain distinct.

Writes use a per-session/booking flight. Issues, threads, booking detail and tracking refresh after writes, including uncertain failures, only for the initiating session. No optimistic issue/message/completion/payment state is added.

## 4. Completion approval audit — disabled

Detail now validates and displays actual completionRequestedAt, completionApprovedAt and completedAt; tracking also shows real requested/approved dates. No approve endpoint or control is registered.

PATCH `/bookings/:bookingId/approve-completion` requires Customer ownership, a completion request, an uncompleted booking and no open issues. It calls `releaseBookingPayout()` **before** the booking-completion transaction. Release requires a succeeded payment, ready vendor payment account and eligible positive payout (or an already-paid payout); creating a payout also requires commission data. It can invoke a real Stripe transfer. The later booking transaction checks open issues again, so cross-operation payout/issue concurrency needs financial review.

Future enablement requires an explicitly approved financial workflow, resolved T14 checkout/security blockers, verified payment/booking ownership and currency/amount handling, authoritative settlement/payout status, explicit funds-release confirmation and reviewed idempotency/concurrency/failure reconciliation. Issue resolution decisions and booking completion dates are not proof of refunds or payment settlement.

## 5. Tests and results

- Focused issue regressions: **48 passed**; existing booking regressions also passed.
- Final `npm test`: **994 passed, 0 failed/skipped** (946 baseline + 48 new).
- `npm run build`: passed, including TypeScript and production Vite build.
- `npm run lint`: passed after replacing a flagged RTK enum comparison with the selector's `isSuccess` flag; focused tests and build passed again after that fix.
- Changed-file Prettier checks and `git diff --check`: passed.

Coverage: four contracts, trimmed DTO limits, ownership/UUID matching, completion/open/resolved eligibility, 400/401-refresh/403/404/409/5xx/network errors and retry, duplicate writes, subscribed cache refresh, late session/role writes, real history/thread/completion presentation and absence of payment/approval requests. Tests mock HTTP and render without a server/browser. Interactive draft/confirmation and responsive review remain manual under AGENTS.md restrictions.

## 6. Remaining dependencies

T15-C supported scope is implemented. Completion approval remains intentionally disabled. Message POSTs have no backend idempotency key: concurrent sends are blocked locally, but uncertain delivery must be reconciled against the refreshed thread before manually retrying; no exactly-once guarantee is claimed. T15-B direct creation still requires legitimate event coordinates/timezone, selected truck/menu UUID wiring, DTO-valid inputs and published live terms; none were bypassed. Payment UUID availability and T14 financial blockers remain unchanged. T15-D/T16 were not started.
