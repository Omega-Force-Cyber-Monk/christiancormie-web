# Sprint 4 — T14-B: Payment status and secure readiness

Date: 2026-10-29 (Asia/Dhaka). T14-B only; backend read-only. **Payment initiation and checkout remain unimplemented.**

## 1. Exact changed files

Incremental T14-B manifest; existing uncommitted T13-A/B and T14-A work is preserved.

| File                                                                                                     | Change                                                                                   |
| -------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| [paymentStatus.ts](../src/features/payments/utils/paymentStatus.ts)                                      | Reviewed PaymentStatus type and seven distinct labels with safe unknown handling         |
| [paymentStatus.test.mjs](../src/features/payments/utils/paymentStatus.test.mjs)                          | Status/financial representation and preview safety regressions                           |
| [CommunityOffersView.tsx](../src/features/customer/components/community/CommunityOffersView.tsx)         | Explicit sample/payment-preview actions; removes unverified refund terms                 |
| [CommunityBookingDialogs.tsx](../src/features/customer/components/community/CommunityBookingDialogs.tsx) | Local completion no longer headed Booking confirmed; sample review timeline              |
| [CommunityTrackView.tsx](../src/features/customer/components/community/CommunityTrackView.tsx)           | Timeline and financial steps explicitly qualified as samples                             |
| [DiscoverBookingFlow.tsx](../src/features/customer/components/discover/DiscoverBookingFlow.tsx)          | Local completion no longer claims a sent request                                         |
| [RequestOrderDetails.tsx](../src/features/vendor/components/requests/RequestOrderDetails.tsx)            | Explicit sample timeline heading                                                         |
| [VendorEarningsOverview.tsx](../src/features/vendor/components/earnings/VendorEarningsOverview.tsx)      | Fixture transaction heading/badges/disclosure distinguish samples from confirmed records |
| [This report](sprint-4-t14b-payment-status-readiness.md)                                                 | Contract, dependencies, remediation requirements and validation                          |

No backend, environment, package, route, stylesheet, auth/session, RTK endpoint/tag or T14-A financial/Connect implementation changes. Existing layout, illustrations, styling, forms, callbacks, local-preview reducers and confirmation infrastructure remain; changes to preview components are copy-only.

## 2. Verified payment GET contract — verified but unconnected

Reviewed required plan/mapping/gaps, [T14-A](sprint-4-t14a-financial-contracts-connect-status.md), T11-A/B/C and earlier auth/logout reports against current source. Sources: [PaymentsController](../../christinacormie-backend/src/modules/payments/payments.controller.ts), [PaymentsService.getPayment](../../christinacormie-backend/src/modules/payments/payments.service.ts), [PaymentsRepository.findPaymentById](../../christinacormie-backend/src/modules/payments/payments.repository.ts) and [Payment/Commission/Refund/Payout models](../../christinacormie-backend/prisma/schema/19-payments.prisma).

`GET /api/v1/payments/:paymentId` uses a real **Payment UUID**, no body/query DTO, Bearer JWT, and returns HTTP 200 with the **raw payment**, not a `{ payment }` envelope. The controller passes the path string directly; there is no ParseUUIDPipe to justify treating an invalid fixture ID as a valid missing-payment request.

Raw record fields: id, bookingId, payerUserId, vendorId, nullable stripePaymentIntentId/stripeCheckoutSessionId/idempotencyKey, Decimal amount, currency, PaymentStatus, nullable paidAt and createdAt. Repository includes full booking, vendor `{ id, userId }`, nullable commission, nullable payout and refunds array. Commission has grossAmount/rate/commissionAmount/vendorNetAmount; payout has its own amount/currency/status/paidAt/failure fields; refunds have amount/status/reason/processedAt. Decimal fields serialize as strings. Payment amount/currency are required model fields; related commission/payout and timestamps can be unavailable. No clientSecret field exists in this GET/model.

Visibility is service-authoritative:

- Missing payment: **404 Payment not found**.
- `payerUserId === actor user ID`: returns payment directly.
- Otherwise actor must resolve an owner vendor matching payment.vendorId and status APPROVED or PENDING_APPROVAL; failure is **403**.
- No staff-actor fallback or Admin override exists. The endpoint is JWT-only, with no role decorator: a staff-role account that is independently the payer can satisfy the payer branch. This is not staff authorization to view another customer's/vendor's payment. A future Customer/Vendor UI must still reject active VENDOR_STAFF as required by this task.
- Unlike ensureVendor, this owner branch does not separately check vendor.deletedAt; that is a backend policy gap to clarify, not a frontend permission bypass.
- Missing/expired JWT follows established 401/refresh behavior. Network/5xx/provider-independent read failures must remain errors, not payment failure/absence claims.

Future UI should project only reviewed IDs/status/money/currency/actual timestamps and needed related financial states. Provider identifiers, idempotency keys, full booking/private metadata and secrets do not belong in a general status panel. No unused full response schema/query is introduced before a legitimate consumer exists.

## 3. Authoritative Payment UUID source — UI/product-blocked

**No existing integrated Customer/Vendor payment-detail consumer receives an authoritative Payment UUID.**

| Current source                                                                                                           | Finding                                                                                                                               |
| ------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------- |
| [CustomerOrdersPage](../src/features/customer/pages/CustomerOrdersPage.tsx)                                              | Heading/description placeholder; no booking/payment read                                                                              |
| [CustomerCommunityPage](../src/features/customer/pages/CustomerCommunityPage.tsx)                                        | Real T11 community records; offers/bookings explicitly unavailable; does not mount the legacy quote/payment workflow                  |
| [CommunityOffersView](../src/features/customer/components/community/CommunityOffersView.tsx) and local community reducer | Uses communityQuotes fixture IDs and local confirmations, not server Payment UUIDs                                                    |
| [DiscoverProfileView](../src/features/customer/components/discover/DiscoverProfileView.tsx)                              | Booking control explains booking/payments are unconnected; legacy DiscoverBookingFlow is a local draft, not a server booking response |
| [vendor.schema.ts](../src/features/vendor/schemas/vendor.schema.ts)                                                      | T04 recentBookings provides booking IDs and payment aggregates, not a selected Payment UUID                                           |
| [VendorOrdersPage](../src/features/vendor/pages/VendorOrdersPage.tsx)                                                    | requestsState/vendorOrders fixtures, not authoritative financial identity                                                             |
| Vendor Earnings / T14-A                                                                                                  | Only Connect account status is connected; transactions remain fixtures. A Connect account ID is not a Payment UUID                    |
| Existing Admin management                                                                                                | Separate Admin reads/permissions do not establish a Customer payer/Vendor owner consumer or authorize repurposing admin records here  |

T15 must supply a real authenticated booking/payment association and an approved detail selection before wiring GET. Keep payment UUID, booking UUID, quote/offer UUID, display number and Stripe intent ID distinct. Do not select a fixture ID, generate a substitute UUID, parse an ID out of a secret, or arbitrarily assume the first payment is current.

## 4. Connected payment-status UI

**None added, by the brief's dependency rule.** The GET is verified but unconnected; there is no unused payment query module, new cache tag, polling timer, payment route, fabricated identity or fixture-to-API bridge.

This is intentional completion of the independently supported audit/safety scope, not a claim of live payment detail integration. The existing T14-A Connect account GET remains the only connected `/payments/...` endpoint in Customer/Vendor code. T15 was not started.

## 5. Status/type and financial adapters — implemented

The small pure `paymentStatus.ts` adapter exports the verified PaymentStatus union and these labels:

| Payment.status     | Display meaning                       |
| ------------------ | ------------------------------------- |
| PENDING            | Payment request recorded; not paid    |
| PROCESSING         | Payment processing; not yet confirmed |
| SUCCEEDED          | Payment confirmed by the backend      |
| FAILED             | Payment failed                        |
| PARTIALLY_REFUNDED | Payment partially refunded            |
| REFUNDED           | Payment refunded                      |
| CANCELLED          | Payment cancelled                     |

Missing/unknown values, truthy objects, booking CONFIRMED/PAYMENT_PENDING, payout PAID and provider requires_payment_method do not become success. This is a reviewed presentation adapter for a later legitimate consumer, **not** a live status UI or payment state machine. It does not infer settlement, completion approval, a refund or vendor payout from payment success.

T14-A [financialValues.ts](../src/features/payments/utils/financialValues.ts) is reused unchanged in focused tests: Decimal digits/scale and explicit returned currencies remain intact; nullable commission/payout values display unavailable rather than zero; real zero stays zero. No mixed/missing-currency combined total, cents conversion, fixed commission or inferred quote balance is introduced. Actual paidAt/createdAt are the future display source; no client timestamp or local completion is substituted for them.

## 6. Existing UI safety findings and small corrections

- CommunityOffersView remains a fixture workflow. Its heading/actions now say sample quotes/payment preview/review/complete preview. Unverified non-refundable deposit terms were removed; the form now states no payment/refund terms are agreed and no money moves. Form validation and callback behavior remain.
- CommunityBookingConfirmation's local terminal headline is **Booking preview complete**, not Booking confirmed. Its timeline uses sample quote/deposit/balance review steps; View booking is explicitly a preview. Existing modal/illustration/layout remain.
- CommunityTrackView labels the timeline and each financial step sample-only, including payment release; the existing statement that nothing was collected/released remains. Local approval is not a payout/refund operation.
- DiscoverBookingFlow's terminal headline no longer claims a request was sent. Existing text still explains local page-session retention and no vendor contact.
- Vendor order timeline is headed Sample Booking Timeline and retains its existing illustrative-deposit disclosure. Vendor Earnings fixture rows/badges and heading now explicitly say sample, with a nearby statement that no confirmed payment/payout records are loaded. They remain separate from T14-A's real Connect status and labeled local bank entries.
- RequestQuoteForm's 15% is already labeled illustrative with a local-estimate/no-payment disclosure. It remains disconnected; no 15% or source-default 10% becomes an authoritative contract. No quote calculation/financial migration was performed.

Source inspection found no payment-intent POST, clientSecret processing, Stripe confirmation, Checkout Session creation or automatic creation retry in current application code. No payment POST/retry control was added for timeouts, 500/503, missing secrets, provider errors, navigation or hold expiry. Existing preview controls do not issue financial requests. A lost response can follow persistence; it must not become a new-key retry or a local paid flag.

## 7. Idempotency ownership/replay — backend-blocked

Current createBookingPaymentIntent still performs global idempotency-key lookup before booking/customer authorization and returns existing raw payment with `clientSecret: null`. Its unique-key-race fallback similarly returns duplicate data without binding it to the current request. The blocker remains source-confirmed; no live exploit or mutation was attempted. Frontend key unpredictability is not an authorization fix.

Backend remediation required before activation:

1. Authenticate and authorize the booking/customer before replay can return records or secrets, including the duplicate-create race path.
2. Bind each key to verified customer, booking and logical payment attempt/canonical parameters; reject cross-account/cross-booking reuse without disclosing the prior record.
3. Define recovery after an initialized payment/provider intent outlives a lost response. Reconcile the authorized existing attempt and safely resume when possible; never expose another user's record or secret. A null secret is not permission to create a new charge.
4. Apply atomic/race-safe attempt uniqueness and provider idempotency appropriate to supported guarantees; document retention, retries and failure transitions. Do not promise unconditional exactly-once delivery across client/network/provider failures.
5. Add backend tests for cross-account/cross-booking replay, duplicate races, changed parameters, missing/null secret, provider success followed by response loss, notification-after-write failure and authorized recovery. Backend changes/tests are outside this read-only task.

No browser workaround, new key retry strategy, persistent secret, placeholder secret or payment UUID generator was added.

## 8. Currency conversion — backend-blocked

The service still uses `Math.round(amount * 100)` for provider operations and accepts a string currency/default USD without a verified supported-currency allowlist. Stripe minor-unit rules differ across currencies, including zero-decimal and payout-specific cases; the blanket conversion is not universal. See [Stripe currency rules](https://docs.stripe.com/currencies), already reviewed in T14-A.

Backend/provider policy must define supported currencies, correct exponents/special cases, allowed precision, minimum/maximum charges and rounding before activation. The frontend preserves returned currency and unit and does not repair settlement arithmetic, introduce exchange rates or invent credit conversions.

## 9. Booking readiness and hold expiry — backend-blocked

Future readiness must come from an authorized selected booking and accepted eligible quote/offer, PAYMENT_PENDING status, valid authoritative payment/hold window, no conflicting pending/processing/succeeded payment and canonical deposit/full-payment terms. These are prerequisites, not a new client-side ready flag in T14-B.

Current intent service checks payer, booking status/conflicting payments and cached Connect onboarding/charges/payout flags for a new attempt, but not the accepted hold's expiry. Booking quote acceptance creates a default 30-minute hold (DTO allows 5–120); Community acceptance uses 30 minutes. Expired holds do not by themselves cancel PAYMENT_PENDING booking records, which also affect overlap checks. Browser countdowns cannot authorize or revoke payment.

Backend must enforce expiry/eligibility consistently during attempt creation/recovery and define late-provider-success/reconciliation behavior. No new acceptance, booking mutation, countdown authorization, hold cancellation or retry operation was implemented.

## 10. Connect and provider/checkout prerequisites — UI/product-blocked

T14-A's account presence, details submitted, charges/payout enablement and restriction/requirement counts remain distinct. A connected ID alone does not mean payment-ready, and a local bank label/last four is not Connect setup. The status read does not activate payment controls. Backend checks currently use stored readiness flags; authoritative refresh/eligibility policy remains a backend responsibility.

Web provider confirmation is unapproved/unimplemented. Approved SDK/UI, publishable configuration, return/error/cancel handling and safe transient secret handling are still needed after backend remediation. There is no Checkout Session contract in the current PaymentIntent path to invent. Hosted Connect onboarding/dashboard mutations and web return/refresh destinations remain separately deferred. No packages, sessions, provider calls or onboarding operations were added.

## 11. Authentication/cache behavior

No payment-detail query exists yet, so no new payment cache/session logic is falsely represented as implemented. Existing shared baseApi, verified-role selection, SessionScope/scopedRead, refresh/logout cleanup and T14-A Connect protections are unchanged.

When a legitimate consumer becomes available, require verified active CUSTOMER/VENDOR; validate real UUID selection and its server booking/payer association. For Vendor, use verified owner identity and returned vendor association; deny active staff. Backend visibility remains authoritative. Do not assume client-selected IDs confer ownership.

A future read must use shared scoped transport and precise cache tags, hide details after definitive denial, show errors rather than 404-as-zero, retain only clearly labeled last-known data for suitable transient failures, and reject old-session results. Logout/account/role changes must clear sensitive data. Status refresh may be explicit GET; no indefinite polling or financial creation retry is authorized here.

## 12. Tests and results

The server-free runner was inspected: Vite production SSR bundling + Node tests with mocked HTTP/network/server guard, no application server or browser.

- Focused status/safety, T14-A financial/Connect, Customer Community, Vendor Earnings and requests regressions: **95 passed, 0 failed**; includes **16 new T14-B cases**.
- Focused ESLint: **passed**.
- One final complete `npm.cmd test`: **891 passed, 0 failed, 0 skipped**, including all 875 prior regressions.
- Production build (`npm.cmd run build`, includes TypeScript): **passed**.
- Repository ESLint (`npm.cmd run lint`): **passed**, no diagnostics.
- Changed-file Prettier, report local-link/manifest and `git diff --check`: **passed**.
- Backend status matches the initial snapshot: only the two pre-existing untracked audit documents; no backend source changes.

New tests cover every status label, unknown/missing/prototype/truthy/booking/payout/provider states, distinction from timestamps and related financial statuses, Decimal/currency preservation and null versus zero, sample offers/payment consent/confirmation wording, local completion without new financial identities/secrets, sample release/order timelines and fixture transaction/bank separation.

T14-A's mocked real Connect GET tests cover JWT/owner/staff/foreign/session restrictions, 400/401/403/404/provider/network/5xx/retry, tag isolation and delayed logout/account/role replacement. Earlier auth and integration regressions remain in the final full suite. These are **not** claimed as payment-detail GET execution tests.

The new payment-detail HTTP path/UUID/JWT/customer/vendor/foreign/missing-payment/retry/cache cases are **not executable against a connected consumer**, because none exists. Per the brief, they are documented source contracts/dependencies rather than fabricated screen/query mocks. Reviewed pure adapters and actual existing preview safety states were tested instead. No payment POST or clientSecret transport/persistence exists to exercise; source inspection confirms their absence. Backend exploit/regression execution, live API/Stripe/database/CORS behavior and manual browser/modal/keyboard/responsive verification remain unexecuted. AGENTS.md sections 12–13 prohibit servers/browser automation. No real credentials, dependency installation, environment changes or backend runtime/check commands were used.

## 13. Remaining backend/product decisions

- Ownership-bound replay and safe authorized secret recovery, with backend negative/concurrency/ambiguous-outcome tests.
- Currency/minor-unit/precision policy and supported provider configuration; canonical terms rather than fixed fee/deposit promises.
- Authoritative hold expiry, late confirmation and booking/payment reconciliation transitions.
- GET owner soft-deletion/visibility policy clarification; no new staff or Admin financial permission inferred.
- T15 actual booking/payment identity and approved detail consumer, followed by bounded read-refresh/error handling. No history or detail screen fabricated now.
- Approved payment provider UI/SDK/return flows and separate Connect onboarding scope; live/manual release checks.

## 14. T14-B acceptance classification

| Classification               | Result                                                                                                                                            |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Implemented**              | Reviewed seven-state PaymentStatus type/label adapter; small preview safety corrections; existing financial adapter/Connect regressions preserved |
| **Verified but unconnected** | GET `/api/v1/payments/:paymentId` contract, visibility, raw response/status/money/timestamp semantics                                             |
| **Backend-blocked**          | Intent ownership/idempotency/recovery, currency conversion and hold-expiry prerequisites; payment initiation stays absent                         |
| **UI/product-blocked**       | Authoritative Payment UUID consumer depends on T15 booking reads; provider confirmation/checkout and onboarding UX not approved                   |

**The independently supported T14-B audit/adapters/safety scope is complete. Live payment-status integration is deferred by the explicit identity dependency rule; payment initiation and checkout are not implemented.** No backend flaw was worked around, no unused payment query was added, and prior integrations/design/guards are preserved.

Work stops at T14-B. T15, T16 and T17 were not started.
