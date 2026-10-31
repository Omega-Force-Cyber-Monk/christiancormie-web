# Sprint 4 — T15-B: Booking creation and Community offers

## Files changed

- `src/features/community/api/communityOffers.api.ts`
- `src/features/community/schemas/communityOffers.schema.ts`
- `src/features/community/components/CustomerCommunityOffers.tsx`
- `src/features/community/api/communityOffers.test.mjs`
- `src/features/customer/components/community/CommunityOffersView.tsx`
- `src/features/customer/components/community/CommunityReadCard.tsx`
- `src/features/customer/pages/CustomerCommunityPage.tsx`
- `src/services/api/baseApi.ts` — CommunityOffers tag only.
- `docs/sprint-4-t15b-booking-creation-community-offers.md`

Prior uncommitted work is preserved. No backend, dependencies, environment, payment APIs or booking wizard/draft changes.

## Connected endpoints and contracts

All reuse shared RTK Query bearer/refresh/error/session infrastructure.

| Endpoint                                         | Verified contract                                                                                                                                                                                                                                                                                                                                                                           |
| ------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| GET `/api/v1/community/posts/:postId/offers`     | `{message, items: VendorOffer[]}`. JWT required; owner sees received offers, other permitted vendors see only their own. This Customer UI requires a verified owner Need-a-Truck detail. Controller exposes no sort parameter and uses service default RECENT, repository `createdAt desc`; order is preserved.                                                                             |
| PATCH `/api/v1/community/offers/:offerId/accept` | No request body. Request owner only; pending, unexpired offer required. Returns `{offer, booking}`. Transaction locks request/truck, checks request availability/expiry and booking/hold overlap, rejects competing pending offers, matches request and creates/returns the associated booking. New booking is PAYMENT_PENDING with a 30-minute hold. No second POST `/bookings` is issued. |
| PATCH `/api/v1/community/offers/:offerId/reject` | No request body. Owner and pending offer required. Returns the updated VendorOffer, with REJECTED status. Transactional conflict returns 409.                                                                                                                                                                                                                                               |

Verified in current [Community controllers](../../christinacormie-backend/src/modules/community/community-posts.controller.ts), [action controller](../../christinacormie-backend/src/modules/community/community.controller.ts), [service](../../christinacormie-backend/src/modules/community/community.service.ts), [repository](../../christinacormie-backend/src/modules/community/community.repository.ts) and VendorOffer model/DTOs. Expired/not-pending offers can return 400; transactional expiry, unavailable request/offer and truck overlap can return 409. These remain errors, never locally simulated success.

## Working UI and state

The existing My Posts “View offers” control opens live offers in the existing Community detail drawer. Owner details also provide “View received offers.” CommunityOffersView supports a separate typed live variant using existing offer/card/panel classes; fixture quotes and payment-preview callbacks never feed live actions. Other categories/non-owners remain unavailable.

Cards display actual vendor/truck names, status, message/menu, timestamps and Decimal amounts. VendorOffer has **no currency field**: existing financial adapters preserve digits/scale and explicitly show “Currency unavailable”; no dollar symbol, default currency, fixed commission, fixture rating/age or invented calculation is used.

Existing ConfirmationDialog handles confirmation, errors and pending protection. Acceptance explicitly explains booking creation, rejection of competing offers and absence of payment. Only validated server results produce success notifications and actual returned booking number/UUID/status, with a link to Orders. No payment success is inferred.

Writes require matching current owner detail and cached server offer, valid UUIDs, pending/unexpired offer, open/unexpired request, explicit confirmation and active verified CUSTOMER role. A per-session/request flight prevents concurrent accept/reject writes. Backend authorization remains authoritative. After attempted HTTP writes, offers, Community posts/lists and CustomerBookings invalidate only while the initiating session still matches, including uncertain responses/conflicts. Late session/role results cannot update the new session or produce success UI. Read errors hide stale offers; refresh/retry and empty/loading states remain distinct.

## Direct booking creation — blocked

POST `/api/v1/bookings` is verified but **not connected**, as permitted by the brief's missing-input rule. Current CreateBookingDto/service require real foodTruckId, eventType, guestCount, address, contactPhone, latitude/longitude and literal true adult/terms confirmations. Date/time inputs use eventDate + eventTime + explicit eventTimezone (optional endTime; otherwise backend reserves three hours), or a complete ISO startsAt/endsAt pair. Contact uses backend IsPhoneNumber validation. Selected menu IDs must be UUID v4; custom strings are separate (maximum 20, 150 characters each). Budget is optional numeric/nonnegative. Success is HTTP 201 `{message, booking}`.

Exact missing prerequisites in the existing DiscoverBookingFlow:

- No mounted live consumer: the flow accepts only `truckName`, not selected backend truck/menu identity.
- Address is free text; there is no event-coordinate picker/geocoding result or explicit event timezone. Truck coordinates or the browser timezone cannot substitute for the event's location/timezone.
- Menu selection uses fixture names and mixes them with custom names, not the selected truck's menu UUIDs.
- Contact validation is preview-oriented, budget is arbitrary text, and event labels need exact DTO enum mapping.
- Adult confirmation exists, but terms acknowledgment explicitly covers a local preview; no published live terms are supplied. It must not be submitted as binding terms acceptance.

Wizard steps, drafts and preview confirmations remain unchanged; no placeholder coordinates, phone, UUID, timezone or consent are sent. Legitimate event location/timezone, selected truck/menu wiring, DTO-valid contact/budget/enum mapping and published terms are required before enabling direct submission. No unused booking POST endpoint or guessed input workflow was added.

## Validation

- Focused: `npm test -- src/features/community/api/communityOffers.test.mjs src/features/customer/schemas/discover-booking.test.mjs --test-timeout=10000` — **33 passed** (28 new offers tests, 5 existing wizard regressions).
- Final `npm test` — **946 passed, 0 failed/skipped** (918 baseline + 28 new).
- `npm run build` — passed, including TypeScript and production Vite build. Initial type checks exposed a circular inference/metadata annotation mismatch in the new mutation; explicit result/metadata typing resolved it.
- `npm run lint` — passed. The final annotation adjustment also passed changed-file ESLint.
- Prettier checks on all nine task files and `git diff --check` — passed.

Coverage includes exact GET/PATCH contracts, authoritative UUIDs/owner/booking associations, no POST/payment calls, server order/Decimal precision, invalid inputs, expired/closed requests/offers, 400/403/404/409/5xx/network errors, duplicate writes, cache invalidation, session/role replacement, loading/empty/error/retry presentation and existing wizard validation/draft behavior. Direct booking DTO submission/timezone/coordinate tests are deferred with the blocked live adapter; preview tests do not establish live DTO compatibility.

Tests use mocked HTTP and server-free rendering. No production calls, backend runtime or development/browser server. Manual interactive/responsive review remains with the developer under AGENTS.md.

## Remaining blockers / status

**Community offers are integrated; direct booking creation remains blocked by the concrete prerequisites above. T15-B is therefore partially satisfied, not full live-booking completion.** Currency is absent from offer records and remains explicit. Existing T14 financial security/payment blockers are unchanged; no Stripe, quote-payment acceptance, completion, payout, issue/message or Vendor Orders work was started.
