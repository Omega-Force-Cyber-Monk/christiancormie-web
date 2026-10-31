# Sprint 4 — T15-A: Customer booking reads and tracking

## 1. Files changed

- `src/features/customer/api/bookings.api.ts` — shared RTK Query read endpoints.
- `src/features/customer/schemas/booking.schema.ts` — validated, minimal response projections.
- `src/features/customer/pages/CustomerOrdersPage.tsx` — list, selected detail and tracking.
- `src/features/customer/api/bookings.test.mjs` — 27 focused regressions.
- `src/services/api/baseApi.ts` — CustomerBookings / CustomerBookingTracking tags only.
- `docs/sprint-4-t15a-customer-booking-reads.md` — this report.

Existing uncommitted T13/T14 changes were preserved. Backend code, dependencies, environment files, booking forms/drafts, Community and Vendor flows were not changed.

## 2. APIs integrated

All three are authenticated GETs under `/api/v1`, using the shared bearer/refresh/retry infrastructure:

| Endpoint                        | Actual response and checks                                                                                                                                                                                                |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/bookings/mine`                | Raw booking array, newest created first; repository filters `customerId` to JWT subject. No Customer pagination/filter DTO exists. Every projected record must belong to the verified user; duplicate IDs are rejected.   |
| `/bookings/:bookingId`          | Raw booking with included relations, plus `vendorPhone`. Backend permits customer owner or assigned vendor; this Customer consumer validates the selected UUID and customer ownership and strips unused fields.           |
| `/bookings/:bookingId/tracking` | `{bookingId, bookingNumber, roleView, currentStep, completion, steps}`. Backend checks visibility. This consumer requires matching UUID and `roleView: CUSTOMER`; UI requests it only after successful detail validation. |

Verified against current [controller](../../christinacormie-backend/src/modules/bookings/bookings.controller.ts), [service](../../christinacormie-backend/src/modules/bookings/bookings.service.ts), [repository](../../christinacormie-backend/src/modules/bookings/bookings.repository.ts), [booking model](../../christinacormie-backend/prisma/schema/18-bookings.prisma) and booking DTOs. Vendor-only filter DTOs are not applied to Customer reads.

Schemas retain all ten BookingStatus values, actual event type/dates, booking number/UUID, guest count, address, description/instructions and related truck/vendor identities and names. Relations must match their foreign keys. Unknown private/financial relations are stripped. Tracking preserves backend DONE/CURRENT/PENDING and actual nullable timestamps without generating completion dates.

## 3. UI connected

The previously placeholder Customer Orders page now uses existing header, buttons, loader, empty/error states and theme styling for a minimal responsive list/detail view. Existing route guards and dashboard layout remain. Selecting a real booking opens its detail and server timeline; refresh/retry controls are independent. No fixtures are rendered as backend bookings, and no booking/payment mutation is exposed.

Queries are keyed by session/user/active role, require a verified Customer session, use `scopedRead` before/after requests and expire immediately when unused. Existing auth middleware clears caches on session/role replacement. The page remounts selection on identity replacement and uses `currentData`; read errors hide prior results, including 403/404. Temporary failures remain retryable errors, not empty success.

## 4. Payment UUID findings

**No authoritative Payment UUID is supplied by these responses.** `bookingInclude()` includes customer, truck, vendor, community request, offer, quotes and status history, but no payments. Tracking loads payment records internally, then returns only timeline/completion fields, never payment IDs.

`GET /payments/:paymentId` therefore remains intentionally unconnected. No UUID is inferred from booking/quote/display IDs. Booking CONFIRMED and timeline steps do not produce payment-status success. The UI explicitly explains payment status is unavailable. No amounts/currencies are fabricated; the booking model has monetary fields without a booking currency, so this minimal view omits financial totals.

## 5. Tests and results

- Focused: `npm test -- src/features/customer/api/bookings.test.mjs --test-timeout=10000` — **27 passed**.
- Final full regression: `npm test` — **918 passed, 0 failed/skipped** (891 baseline + 27 new).
- `npm run build` — passed, including TypeScript (`tsc -b`) and Vite production build.
- `npm run lint` — initial run caught an unqualified URL global in the new test; fixed to `globalThis.URL`. Final rerun passed.
- Prettier checks for these six changed files and `git diff --check` — passed.

Coverage includes exact GET paths/bearer credentials, list/detail/tracking schemas, real UUIDs/ownership/relations, all booking statuses, wrong role views, malformed/wrapped/duplicate responses, empty/loading/error/retry UI, denied-refresh stale-data hiding, network retry, session/role replacement and late-response cache isolation, nullable dates and absence of fake payment success.

Tests use mocked HTTP and server-free rendering. No production calls, backend runtime, development server or browser automation were used. Manual visual/responsive/interactive review remains with the developer under AGENTS.md restrictions.

## 6. Remaining blockers / acceptance

Customer booking list/detail/tracking integration is implemented within T15-A. Payment status requires a backend-supplied Payment UUID/booking association. Customer server pagination/filtering is unsupported and was not invented. Tracking is the backend's computed timeline, not GPS tracking or a payment receipt; no polling or unverified location data was added. T15-B was not started.
