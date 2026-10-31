# Sprint 4 — T16-A: Vendor booking reads and decisions

## 1. Files changed

- `src/features/vendor/api/vendorBookings.api.ts`
- `src/features/vendor/schemas/vendorBookings.schema.ts`
- `src/features/vendor/api/vendorBookings.test.mjs`
- `src/features/vendor/components/requests/VendorBookingsWorkspace.tsx`
- `src/features/vendor/components/requests/VendorBookingViews.tsx`
- `src/features/vendor/components/requests/RequestOrderDetails.tsx`
- `src/features/vendor/pages/VendorOrdersPage.tsx`
- `src/features/vendor/utils/requestsState.test.mjs` — route regression now seeds T04 identity and expects live loading instead of a fixture customer.
- `src/services/api/baseApi.ts` — VendorBookings / VendorBookingTracking tags.
- `docs/sprint-4-t16a-vendor-booking-reads-decisions.md`

Existing uncommitted work is preserved. No backend, dependencies, environment, Customer or Community integration changes.

## 2. Endpoints integrated

Contracts verified against current [controller](../../christinacormie-backend/src/modules/bookings/bookings.controller.ts), [service](../../christinacormie-backend/src/modules/bookings/bookings.service.ts), [repository](../../christinacormie-backend/src/modules/bookings/bookings.repository.ts), [filters](../../christinacormie-backend/src/modules/bookings/dto/vendor-bookings-query.dto.ts) and [decision DTO](../../christinacormie-backend/src/modules/bookings/dto/vendor-booking-decision.dto.ts).

| `/api/v1` endpoint                     | Actual contract                                                                                                                                                              |
| -------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| GET `/bookings/vendor/mine`            | Raw booking array, newest created first. Supports tab REQUESTS/ORDERS/ALL, source DIRECT/COMMUNITY/ALL, comma-separated status and optional foodTruckId UUID. No pagination. |
| GET `/bookings/vendor/requests/counts` | Raw `{bookings, community, messages}`. Bookings counts direct PENDING/QUOTED requests, Community counts available requests, messages counts open conversations.              |
| GET `/bookings/:bookingId`             | Raw booking with Customer/Vendor/truck relations and vendorPhone; validates selected UUID and assigned vendor/owner associations.                                            |
| GET `/bookings/:bookingId/tracking`    | Booking identity, roleView, currentStep, completion and steps. This consumer requires VENDOR view and actual Vendor step keys/statuses/timestamps.                           |
| PATCH `/bookings/:bookingId/accept`    | Owner VENDOR only; PENDING → ACCEPTED; requires endsAt and passes backend overlap checks. Raw updated booking, not an envelope.                                              |
| PATCH `/bookings/:bookingId/reject`    | Owner VENDOR only; PENDING/ACCEPTED/QUOTED → REJECTED; requires endsAt. Raw updated booking.                                                                                 |

Decision DTO is optional string reason, with no backend length limit. Blank/whitespace reason is omitted; supplied text is trimmed. Only `{reason?}` is sent. Confirmation/action/session metadata never enters the body.

## 3. Working UI

Existing Requests/My Orders navigation, Bookings/Community tabs, card/detail styling and responsive CSS remain. Real bookings replace fixtures; selection opens RequestOrderDetails' typed live variant. Source/status controls send only supported filters. Explicit status overrides the tab defaults. REQUESTS defaults to PENDING/QUOTED; ORDERS defaults to PAYMENT_PENDING/CONFIRMED/IN_PROGRESS/COMPLETED/CANCELLED/REJECTED. Newly ACCEPTED bookings remain selected and can be found with the explicit status filter.

Cards/details show real UUIDs, Customer identity, vendor/truck associations, event information, status and tracking. Monetary Decimal strings retain precision and show “Currency unavailable,” since bookings supply no currency. Badges explain their actual count semantics. Loading, background refresh, empty, error and retry states are separate; 403/404 never become empty success.

Accept/reject require explicit existing ConfirmationDialog confirmation, valid selected ownership/state and optional reason. Pending flights prevent concurrent writes. Only validated server results produce success; reasons/selection survive recoverable failures. Decisions do not confirm payment. The Orders Community tab is explicitly unavailable; fixture quotes, timelines and Community actions are not mixed into live results. Legacy preview detail components remain separate for existing consumers/tests.

## 4. Authorization and cache behavior

The page retains its VENDOR-only route and T04 useVendorContext gating. Shared APIs support verified VENDOR/VENDOR_STAFF reads using the JWT-resolved `/vendors/me` profile; staff profiles retain the owner's userId. Staff cannot enter this Orders screen or perform decisions, including accounts holding both roles while active as staff. No caller-supplied vendor ID authorizes access.

Queries bind session/user/active role, validate associations and use zero unused-cache retention. Session/role/vendor replacement remounts the workspace; selection changes unmount prior callbacks. Late responses cannot produce success in a replacement context. Writes refresh list, scoped and existing T04 counts, selected detail/tracking and Customer booking/tracking caches, including uncertain failures while the initiating context still matches. No optimistic statuses are added.

## 5. Tests and final totals

- Focused: **53 new API/UI tests passed**; combined with existing Requests regressions, **70 passed**.
- Final `npm test`: **1,047 passed, 0 failed/skipped** (994 baseline + 53 new). The route regression was updated to validate real identity/loading instead of expecting a fixture customer.
- `npm run build`: passed, including TypeScript and production Vite build.
- `npm run lint`: passed; the updated legacy test also passed focused ESLint.
- Changed-file Prettier checks and `git diff --check`: passed.

Coverage includes four GET contracts, filters/envelopes, owner/staff eligibility, associations/UUIDs, valid/invalid decision states, optional reason, 400/403/404/409/5xx/network errors, duplicate writes, subscribed cache refresh, late reads/mutations, session replacement and real UI states without payment/quote calls. Tests use mocked HTTP and server-free rendering. No production calls or backend runtime. Manual interactive/responsive review remains with the developer under AGENTS.md restrictions.

## 6. Remaining blockers

T16-A supported scope is implemented; no T16-B work started. Quote creation, Community writes, payment, completion, payout/refund and staff task workflows remain unavailable here. T15 direct-booking and T14 financial blockers are unchanged.

Backend decision status checks occur before `updateBookingStatus()`, which updates by ID without comparing the previous status. Client single-flight prevents duplicate submissions here but cannot guarantee cross-tab/client atomic transitions; backend concurrency hardening remains a separate concern. No backend changes were made.
