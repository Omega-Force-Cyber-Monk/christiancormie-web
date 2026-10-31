# Sprint 4 — T14-A: Financial contracts and Connect status

Date: 2026-10-29 (Asia/Dhaka). Scope: one Vendor Connect account GET, small financial value adapters and source-contract audit. Backend read-only. No payment, onboarding, booking, quote, refund or payout mutation was connected or executed.

## 1. Exact files changed

This manifest is incremental to T14-A. The existing uncommitted T13-A/B work is preserved.

| File                                                                                                        | Change                                                                              |
| ----------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| [connectAccount.api.ts](../src/features/payments/api/connectAccount.api.ts)                                 | Shared owner/session-scoped GET with safe provider errors                           |
| [connectAccount.schema.ts](../src/features/payments/schemas/connectAccount.schema.ts)                       | Runtime validation and narrow status-only cached representation                     |
| [financialValues.ts](../src/features/payments/utils/financialValues.ts)                                     | Decimal parsing and explicit-unit/currency presentation; no settlement calculations |
| [VendorConnectAccountStatus.tsx](../src/features/vendor/components/earnings/VendorConnectAccountStatus.tsx) | Account presence/flags/requirements, loading/errors/refresh                         |
| [VendorEarningsOverview.tsx](../src/features/vendor/components/earnings/VendorEarningsOverview.tsx)         | Status content slot and explicit bank-preview distinction                           |
| [VendorEarningsPage.tsx](../src/features/vendor/pages/VendorEarningsPage.tsx)                               | Composes status into existing Earnings area and clarifies preview scope             |
| [baseApi.ts](../src/services/api/baseApi.ts)                                                                | Adds only VendorPaymentAccount tag for T14-A                                        |
| [connectAccountIntegration.test.mjs](../src/features/payments/utils/connectAccountIntegration.test.mjs)     | Mocked API/UI/session regressions                                                   |
| [financialValues.test.mjs](../src/features/payments/utils/financialValues.test.mjs)                         | Precision, currency, null and unit-boundary regressions                             |
| [This report](sprint-4-t14a-financial-contracts-connect-status.md)                                          | Verified contracts, deferred flows, blockers and validation                         |

No backend, environment, dependency, route, stylesheet, shared auth/session/refresh/logout implementation or unrelated API changes. Existing bank-method/quote/payment previews remain local and labeled. No Stripe SDK was installed.

## 2. Verified Stripe Connect contracts

Current source is authoritative: [PaymentsController](../../christinacormie-backend/src/modules/payments/payments.controller.ts), [PaymentsService](../../christinacormie-backend/src/modules/payments/payments.service.ts), [PaymentsRepository](../../christinacormie-backend/src/modules/payments/payments.repository.ts), [StripeClientService](../../christinacormie-backend/src/modules/payments/stripe-client.service.ts), [CreateConnectAccountDto](../../christinacormie-backend/src/modules/payments/dto/create-connect-account.dto.ts), [CreateBookingPaymentDto](../../christinacormie-backend/src/modules/payments/dto/create-booking-payment.dto.ts), [payment models](../../christinacormie-backend/prisma/schema/19-payments.prisma) and [VendorPaymentAccount model](../../christinacormie-backend/prisma/schema/12-vendors.prisma). Required audit/plan/mapping/gaps and relevant T01/T02/T04/T10/T11-A/B/C/T13-B reports and current frontend consumers were reviewed.

All three Connect operations require JWT + **VENDOR**, owner lookup by actor user ID, a nondeleted vendor and platform status **APPROVED or PENDING_APPROVAL**. Optional verification-badge approval is not a prerequisite. Staff cannot use these owner operations. Missing/deleted vendor or ineligible status gives 403, not a null account.

| Operation                                      | Actual request and response                                                                                                           | T14-A status                                               |
| ---------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------- |
| GET `/api/v1/payments/connect/account`         | No body/query. 200 **null** if owner has no payment account; otherwise refreshed raw VendorPaymentAccount plus nested `stripe` status | **Connected**                                              |
| POST `/api/v1/payments/connect/accounts`       | Optional `{ country?: string, refreshUrl?: URL, returnUrl?: URL }`; 201 `{ paymentAccount, onboardingUrl }`                           | Audited only; no endpoint definition/button/mutation added |
| POST `/api/v1/payments/connect/dashboard-link` | No body DTO; requires an existing stripeAccountId or 400; returns Stripe LoginLink object containing `url`                            | Audited only; no endpoint definition/button/mutation added |

GET account object is the database record `{ id, vendorId, stripeAccountId, onboardingCompleted, chargesEnabled, payoutsEnabled, disabledReason, updatedAt }` plus:

```ts
stripe: {
  accountType: string,
  country: string | null,
  detailsSubmitted: boolean,
  chargesEnabled: boolean,
  payoutsEnabled: boolean,
  requirements: {
    currentlyDue: string[], eventuallyDue: string[], pastDue: string[],
    pendingVerification: string[], disabledReason: string | null
  }
}
```

GET retrieves the provider account and updates the database flag snapshot/updatedAt. It is read-only from the frontend's financial-action perspective; it does not create an account or move funds, but does have this server-side status-refresh write. Provider lookup failure is an error, never null. Current service includes nested `stripe`; historical Swagger's database-only example is incomplete.

Frontend validation requires the consumed flags/nullable country/requirements/date and matching vendor UUID. Missing core flags or contradictory database/provider flags fail validation rather than defaulting to false or guessing precedence. Cache retains only vendorId, flags, restriction presence, updatedAt, account type/country and **counts** of requirement entries. Provider IDs, bank details, raw requirement paths, raw restriction text, arbitrary metadata and secrets are stripped. Partial onboarding/readiness is valid data; structurally partial/malformed core responses are errors.

Create-account service reuses an existing database account (refreshing its flags), otherwise creates an Express account requesting card_payments/transfers capabilities with vendor business email or owner email. DTO country is only a string, defaulting to US server-side, not an implemented supported-country allowlist. Deprecated DTO returnUrl/refreshUrl are validated if supplied but ignored by service: **STRIPE_CONNECT_RETURN_URL/STRIPE_CONNECT_REFRESH_URL** must be configured. Account/database creation can precede missing-URL/provider-link failure; a failed POST would not prove nothing persisted.

The backend's public connect/return and connect/refresh pages redirect to configured app deep links, defaulting to `bitedrop://stripe/return` or `bitedrop://stripe/refresh`. They do not verify completion or create replacement links. Web destinations/session-return behavior still need approved scope.

## 3. Read-only status implementation and preserved UI

VendorEarningsPage supplies the status component to the existing Payment Methods section. It uses existing controls, status/error/loading primitives, earnings classes and layout. The sample bank-method Add/default controls remain explicitly local; neither label nor last-four digits is sent to Stripe. The footer distinguishes server-returned status from sample transactions, credit acceptance, charts and financial preview terms. Vendor Earnings was not otherwise migrated.

The panel shows connected presence, onboarding details Submitted/Incomplete, charges and payouts Enabled/Not enabled separately, restrictions Reported/None reported, account type/country, requirement counts and refreshed UTC time. It does not equate details submitted with independently verified identity, account presence with payout readiness, or provider flags with a guaranteed settlement. No bank information or invented readiness fields are displayed.

Initial loading, true null-account state, background refresh, retry and malformed/provider/network failures are distinct. A failed retrieval is never labeled not connected, including a cached null followed by failure. Temporary failures can retain an existing nonnull snapshot clearly labeled **Last reported account status** with the error. Definitive 401/403/404 hides cached account details. Refresh performs only the same GET. No onboarding/dashboard/payment is automatically started.

Provider errors can contain sensitive diagnostics because StripeClient wraps raw errors as 400. The new endpoint preserves HTTP status/error classification but replaces non-5xx diagnostics with a safe status-retrieval message, suppresses server internals through existing normalization, and does not retain raw error metadata. It does not replace the established error architecture.

## 4. Financial representation rules and adapters

`decimalAmount` accepts plain decimal wire strings and finite JSON numbers within the safe integer magnitude, preserving string digits and fractional scale. Null, undefined, blanks, booleans, arbitrary objects, NaN/infinity, unsafe numeric magnitudes and unsupported scientific/comma/currency strings become unavailable, never zero. No arbitrary object toString is invoked. A number already rounded by backend/JSON cannot have its original precision reconstructed.

`financialAmount` requires explicit **major** or **minor** units and returned currency context. It normalizes a three-letter code's case, preserves absent/invalid currency as null, and requires integer minor-unit values. `formatFinancialAmount` groups decimal strings without floating-point arithmetic or rounding; missing amount shows Not available and missing currency is explicit. Minor values remain labeled minor units: there is **no implicit ×100/÷100**, default currency, provider-exponent lookup, credit conversion or financial calculation engine.

Raw Prisma Payment/Payout/Refund/Commission money is Decimal(12,2); commissionRate is Decimal(6,3). Raw records serialize Decimal money as strings. Vendor transaction/refund presenters produce fixed two-decimal strings via backend `Number(...).toFixed(2)`, and summary first aggregates with Number. Client adapters preserve the returned representation but cannot repair upstream precision loss. Existing frontend cents fixtures/formatters are not reused for these real amounts.

Backend quote/payment breakdowns remain authoritative. The helper test passes returned totals/deposit/balance/commission/net through unchanged, without deriving an assumed rate. No separate quote response schema/calculator or unused mutation module is introduced. Real quote/payment UI adoption belongs to later tasks. Quotes do not supply their own currency in the verified calculation result, so no universal quote currency is invented.

Stripe amounts use currency-specific minor units; for example zero-decimal and special-case currencies cannot safely share a universal cents conversion. [Stripe currency documentation](https://docs.stripe.com/currencies) supports this distinction. The current backend uses Math.round(amount × 100) for payment/refund/transfer provider requests regardless of currency. A supported-currency policy/backend correction is required before broader provider confirmation; the frontend helper intentionally does not repeat that assumption.

## 5. Quote pricing, deposits and commission

Sources: [quote-financials.ts](../../christinacormie-backend/src/modules/bookings/quote-financials.ts), [CreateBookingQuoteDto](../../christinacormie-backend/src/modules/bookings/dto/create-booking-quote.dto.ts), [AcceptBookingQuoteDto](../../christinacormie-backend/src/modules/bookings/dto/accept-booking-quote.dto.ts), [CreateVendorOfferDto](../../christinacormie-backend/src/modules/community/dto/create-vendor-offer.dto.ts), [BookingsService](../../christinacormie-backend/src/modules/bookings/bookings.service.ts), [BookingsRepository](../../christinacormie-backend/src/modules/bookings/bookings.repository.ts), [CommunityService](../../christinacormie-backend/src/modules/community/community.service.ts) and [CommunityRepository](../../christinacormie-backend/src/modules/community/community.repository.ts).

- Actual enum is **FLAT_FEE | PER_PERSON**, not FLAT. PER_PERSON requires positive pricePerPerson and a positive request/booking guest count; backend multiplies these and rejects inconsistent explicit baseServiceFee. pricePerPerson is allowed to two decimal places by DTO. FLAT_FEE uses supplied base fee/legacy total fallback and rejects pricePerPerson.
- Base + transport + each extra-charge line + service fee + tax amount − discount amount forms canonical total. Null amounts, negative/nonfinite/over-limit values, blank charge labels, blank selected-menu names, more than 20 extra charges and nonpositive/over-limit total fail. Amounts are major units; server rounds to two decimals with Number/Math.round. No tax rate or fee percentage is inferred.
- Booking quote DTO supports subtotal/baseServiceFee and outsideRadiusFee/transportFee aliases; both values must match when both supplied. Booking totalAmount maps to calculator quotedAmount. Community offer requires foodTruckId UUID and uses quotedAmount; selectedMenuItems are names, not fabricated menu UUIDs. Both support optional message/note/expiry and financial fields; booking quote also has terms.
- Payment preference must be **DEPOSIT_ONLY or PREPAID_IN_FULL**, even though a wider booking DTO enum exists. Deposit-only requires a positive explicit amount or percent-derived amount, no more than total. Percent must be >0 and ≤100; amount and percent must agree if both supplied. **There is no fixed minimum deposit percentage in current calculator code.** Provider minimum charges remain a separate rule. Historical roadmap references to a minimum must not become a guessed frontend percentage.
- Full payment collects total/100%; conflicting explicit deposit amount/percent fails. `balanceDueAtEvent = total − deposit`, and inconsistent supplied balance fails. A deposit may equal total. Remaining event balance is not automatically a second Stripe charge in the verified intent service.
- `PLATFORM_COMMISSION_RATE` is backend environment-driven, source fallback 0.10, validated finite in [0,1]. Neither that fallback nor the design's illustrative 15% is an authoritative client promise. **Commission applies to collected deposit/full amount**, not automatically the entire contract; vendorNetAmount is collected amount minus commission.
- Booking quote creation returns `{ quote, booking, message, breakdown }`; community offer stores/returns canonical fields with included relations. Accepted/paid settlement must use returned current records. Payment success recomputes commission from current configuration, so a quote estimate is not an immutable settlement-rate guarantee.
- Optional expiresAt must be in the future at creation and is checked on acceptance. Booking quote acceptance DTO permits paymentWindowMinutes integer 5–120, default 30; it creates an expiring hold and PAYMENT_PENDING booking. Community acceptance uses a fixed 30-minute hold. The payment-intent service checks booking status but does not itself check hold expiry; overlap reads also count PAYMENT_PENDING bookings independently of hold expiration. No automatic expiry/cancellation guarantee was verified. Later UX must use authoritative booking status rather than a client countdown as payment authorization.

The existing RequestQuoteForm and CommunityOffersView remain clearly labeled local estimates/payment previews. No authoritative hardcoded commission, nonrefundable-deposit promise or settlement action was connected from them.

## 6. Payment-intent/status and financial-read audit — unconnected

### Booking payments

POST `/api/v1/payments/bookings/:bookingId/payment-intent` is JWT-only, not a CUSTOMER role decorator. DTO requires string idempotencyKey (max 255; no nonempty validator) and optional string currency (server default USD; no currency enum validator). New-attempt service flow requires booking exists (404), caller is booking customer (403), status PAYMENT_PENDING, no SUCCEEDED payment and no PENDING/PROCESSING payment (400). Vendor account ID plus onboardingCompleted/chargesEnabled/payoutsEnabled must all be present/true. Vendor platform status is not separately checked in this path.

The service selects accepted offer/latest accepted quote financials, otherwise booking values. DEPOSIT_ONLY charges deposit when positive, otherwise total; other preferences charge total. A Payment UUID/record is created in PENDING, uppercase currency persisted, and provider PaymentIntent gets currency lowercase, amount in provider minor units, paymentId/bookingId metadata and the same idempotency key. The current provider call is a platform PaymentIntent; it does not send connected-account destination/application-fee fields. Later vendor transfer is separate.

New success response is `{ payment, clientSecret }`, payment containing the real Payment UUID, raw monetary/booking fields, stripePaymentIntentId and **PROCESSING** status. This is initialization, not payment success. Provider failure marks the local payment FAILED and throws. Notification failure may occur after initialization persisted.

**Critical replay limitation:** an existing globally unique idempotencyKey is looked up and returned **before** booking/customer ownership checks. The duplicate/P2002 fallback similarly returns existing data with `clientSecret: null`. This is a source-confirmed authorization/data-exposure risk, not a live exploit test; a frontend-generated key alone cannot repair it. Backend ownership/booking binding must be fixed before enabling intent writes. Replays also do not recover a usable secret, including after an uncertain response/provider failure. A secure resume/recovery contract is needed; blindly generating another key can create another attempt or hit in-progress rejection.

GET `/api/v1/payments/:paymentId` is JWT-only, takes the **real payment UUID** (not booking UUID/display number/Stripe intent ID), returns raw Payment plus booking, vendor ID/owner ID, nullable commission/payout and refunds. Missing payment gives 404; nonpayer/nonowner gives 403. Payer can read directly; vendor owner must match vendor and have APPROVED/PENDING_APPROVAL status. There is no staff fallback. It returns no clientSecret recovery field.

Payment states: PENDING, PROCESSING, SUCCEEDED, FAILED, PARTIALLY_REFUNDED, REFUNDED, CANCELLED. Payout states: PENDING, PROCESSING, PAID, FAILED, CANCELLED. Do not collapse these into paid/unpaid or equate vendor payout with customer payment success.

### Vendor reads reserved for T16

All five use JWT + VENDOR and ensureVendor ownership/nondeleted/platform eligibility. None is connected or given a new frontend module in T14-A.

| GET endpoint                                      | Actual query/response                                                                                                                                                                                                                                                                                  |
| ------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `/api/v1/payments/vendor/summary`                 | No query; raw counters plus totalGross/totalCommission/totalNet/totalRefunded and pending/processing/paid/failed payout totals as fixed strings; currency taken from first payment or server USD fallback                                                                                              |
| `/api/v1/payments/vendor/transactions`            | Untyped controller query `{ status?, from?, to?, page?, limit? }`; `{ items, meta:{page,limit,total,totalPages} }`. Presenter has paymentId/bookingId/display number/event/truck/customer, provider intent ID, gross/commission/net/currency/paymentStatus, nullable payout, refunds, paidAt/createdAt |
| `/api/v1/payments/vendor/transactions/:paymentId` | Same transaction presenter scoped by vendor and actual payment UUID; missing/foreign row 404                                                                                                                                                                                                           |
| `/api/v1/payments/vendor/refunds`                 | Same query/paging envelope; refund ID/paymentId/bookingId/display number/event, provider refund ID, amount/currency/reason/status/processedAt/paymentStatus                                                                                                                                            |
| `/api/v1/payments/payouts/mine`                   | No query/pagination DTO; raw array ordered createdAt descending, including selected booking/payment relations and raw Decimal amounts/currency/status                                                                                                                                                  |

Service page defaults to 1, limit 20 bounded 1–100; Number-based clamping does not enforce integer inputs. Dates are passed through new Date; status is cast to the Prisma enum without a dedicated query DTO. Malformed query handling needs care later, not invented client contracts. Summary sums all returned payments, not only succeeded ones, and labels currency from the first record without grouping mixed currencies. Fallback commission/net values are server semantics; these aggregates must not be advertised as settled profit or blindly combined across currencies. T16 must retain those distinctions or obtain backend corrections.

### Verified lifecycle, not implemented

1. Customer booking exists; Vendor supplies an eligible canonical quote (or Community offer).
2. Customer explicitly accepts it; server checks ownership/state/expiry/overlap, creates hold and PAYMENT_PENDING booking.
3. After account readiness and the replay issues above are resolved, an explicit payment attempt obtains real payment UUID and transient clientSecret through a stable logical-attempt idempotency key.
4. Approved provider UI/SDK confirms payment; this step is absent from the current web UI and not implemented here. ClientSecret must not be logged, persisted, exposed in status UI or retained in ordinary RTK response cache in a future integration.
5. Signed raw-body Stripe webhook is authoritative. The backend `/api/v1/payments/webhooks/stripe` verifies stripe-signature/configured webhook secret, records/deduplicates events, and processes payment_intent.succeeded/failure/cancel, account.updated and refund events. The browser never calls this webhook as a confirmation action.
6. On success, a transaction marks payment SUCCEEDED/paidAt, booking CONFIRMED/history, commission and a PENDING payout. Initialization/provider intent status alone does not do this. Frontend must retrieve actual server payment/booking status after approved confirmation, with bounded lifecycle handling.
7. Customer completion approval checks booking ownership/completion request/open issues, then invokes separate payout release; admin issue resolution can release/refund through its own controlled flow. Release requires succeeded payment and account readiness, uses stored commission/net and idempotent transfer key, then records payout state. Refunds have separate ownership/status/provider checks and webhook updates. No such operation is connected here.

## 7. Provider/checkout and Connect decisions still required

- Approve web Connect entry/resume controls and frontend return/refresh destinations; backend currently defaults to mobile deep links. Re-read account status after returning rather than assuming setup completed.
- Account Links are single-use and expiring; a return redirect does not prove completion. The refresh destination must obtain a replacement link. The backend exposes only onboardingUrl, not the provider expires_at. Do not persist/reuse it as a durable account URL. [Stripe Account Links](https://docs.stripe.com/api/account_links/create), [hosted onboarding](https://docs.stripe.com/connect/hosted-onboarding).
- Country/Express capability availability depends on platform/provider configuration and eligible country support. No supported-country list was verified from this deployment. Owner email, provider secret, webhook secret and configured return/refresh URLs must be valid; configuration was not read from secrets or exercised.
- StripeClient's local mock branch is selected when the configured secret contains `change_me`; retrieving an account there returns enabled flags. The UI reports returned status, not independent live-provider verification. Source presence and tests do not prove real Connect eligibility, payouts or settlement.
- Choose and approve the web payment-provider experience (Elements/Payment Element or another matching provider flow), SDK/dependency approval, publishable configuration and return/authentication handling. Existing backend creates PaymentIntents, not Checkout Sessions; do not invent a Checkout contract or install packages in advance.
- Resolve ownership-safe replay/secret recovery, supported currencies/minor units, hold/payment expiry, post-submit reconciliation and bounded status refresh before T14-B payment writes. Provider minimum/maximum and readiness rules must remain authoritative.

No live Stripe API/onboarding calls occurred. Public Stripe documentation was read for provider URL/currency semantics only; all application tests use mocked HTTP.

## 8. Authorization, cache and error handling

The panel reuses T04 useVendorContext/vendorAccessState, verified active VENDOR role, actual owner-user match, account restrictions and dashboardAccess. It does not admit VENDOR_STAFF or infer ownership from an entered vendorId. The endpoint independently checks session/user/role membership and eligible cached owner profile before/after GET, validates returned vendorId, and rejects definitive profile denial. Backend authorization remains authoritative.

Requests inject into shared baseApi, use SessionScope/scopedRead and existing Bearer/refresh/retry/error behavior. Query keys include session/user/role; unused retention is zero. VendorPaymentAccount is the only new tag; status refresh does not invalidate financial lists, rewards, truck or vendor analytics. There are no new mutations. Existing logout/role replacement clears API/socket state, and late responses cannot populate another context. Remote accounts are not copied into ordinary Redux.

## 9. Tests and validation

The existing runner was inspected before execution: production SSR bundling + Node with network/server guard and mocked requests. No provider, application server or browser was started.

- Focused Connect/money + existing Earnings tests: **53 passed, 0 failed** (34 Connect, 6 financial-value, 13 existing Earnings regressions).
- Development TypeScript and focused ESLint: **passed**.
- One final full `npm.cmd test`: **875 passed, 0 failed, 0 skipped**, including the 835-test baseline.
- Final `npm.cmd run build` (includes TypeScript): **passed**.
- Repository `npm.cmd run lint`: **passed**, no diagnostics.
- Changed-file Prettier, report local-link/manifest checks and `git diff --check`: **passed**.
- Backend status matches the initial snapshot: only the two pre-existing untracked audit documents, no backend source changes.

Coverage includes exact JWT GET/no body/query and no payment/Connect POST; null/partial-readiness/malformed/foreign account; private-field removal; approved pending-owner access and denied staff/customer/admin/unverified/foreign/stale/restricted contexts; onboarding/charges/payouts/restriction differences; loading, background retention versus definitive denial, cached-null error, safe 400/403/404/provider/5xx/network failure/retry, established 401 refresh and one retry; focused tag refresh; delayed logout/new-session/role results; layout/preview distinction; Decimal precision/scale, null versus zero, negatives, unknown currency, explicit major/minor boundaries and unchanged server breakdown values.

Audited-but-unconnected operations have source-contract documentation rather than unused endpoint modules or speculative mocks. No financial mutation/live settlement was tested or claimed. Browser/responsive/focus and live non-production Stripe/database/CORS/webhook behavior remain unexecuted under AGENTS.md sections 12–13. Static rendering does not certify visual or provider behavior. No backend runtime/check commands, real credentials, package installs or environment changes were used.

## 10. Remaining blockers

1. **Payment idempotency ownership/recovery:** shortcut precedes ownership binding and returns no secret; must be corrected before intent writes, independently of frontend key choice.
2. **Currency/minor-unit policy and backend precision:** blanket ×100, arbitrary currency DTO and Number-based aggregates/calculations need confirmed limits/corrections; adapters do not certify settlement accuracy.
3. **Expiry:** accepted quote/offer holds are finite, but payment initialization does not enforce their expiry; no automatic release/cancellation guarantee was verified.
4. **Provider UX/configuration:** hosted Connect and payment confirmation/SDK/return flows need explicit approved scope and non-production operational verification.
5. **T16 read semantics:** summary status/currency aggregation and weak query validation need correct labeling/backend decisions; financial lists are not migrated here.
6. **U11:** bank label/last-four previews remain local. Connect account creation is not generic bank CRUD/default-method support.

These are blockers/dependencies for later financial writes or broader data migration, not reasons to fabricate state or modify backend in this task.

## 11. T14-A acceptance

**Implemented:** source-verified, owner-only real Connect status read in the existing applicable UI; honest null/error/readiness states; safe, narrow cache fields; small precision-preserving value adapters and regression coverage. Prior work/design/authentication infrastructure is preserved.

**Audited only:** Connect create/dashboard link, payment intent/status, vendor summary/transactions/refunds/payouts, canonical quote rules and downstream lifecycle. They are not represented as connected features. T14-A's independent read/adapters/audit scope is satisfied; payment-write readiness remains blocked by the findings above. Live provider/manual release checks remain outstanding.

Work stops at T14-A. T14-B, T15, T16 and T17 were not started.
