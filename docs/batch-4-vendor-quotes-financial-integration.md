# Batch 4 — Vendor quotes and financial integration

## Files changed

- `src/features/bookings/schemas/bookingQuote.schema.ts`
- `src/features/bookings/components/BookingQuoteReview.tsx`
- `src/features/customer/schemas/booking.schema.ts`
- `src/features/customer/pages/CustomerOrdersPage.tsx`
- `src/features/vendor/api/vendorBookings.api.ts` — reuse verified actor helper.
- `src/features/vendor/api/vendorQuotes.api.ts`
- `src/features/vendor/components/requests/RequestQuoteForm.tsx`
- `src/features/vendor/components/requests/LiveRequestQuoteForm.tsx`
- `src/features/vendor/components/requests/VendorBookingsWorkspace.tsx`
- `src/features/vendor/components/requests/VendorBookingViews.tsx`
- `src/features/payments/api/vendorFinancial.api.ts`
- `src/features/payments/schemas/vendorFinancial.schema.ts`
- `src/features/payments/utils/batch4Integration.test.mjs`
- `src/features/payments/utils/connectAccountIntegration.test.mjs` — updated the obsolete transaction-preview assertion.
- `src/features/vendor/components/earnings/VendorFinancialPanel.tsx`
- `src/features/vendor/components/earnings/VendorEarningsOverview.tsx`
- `src/features/vendor/components/earnings/earnings.css`
- `src/features/vendor/pages/VendorEarningsPage.tsx`
- `src/services/api/baseApi.ts` — VendorFinancial cache tag.
- `docs/batch-4-vendor-quotes-financial-integration.md`

Prior work/tests preserved; no backend, dependencies, environment or shared authentication changes.

## Endpoints integrated

| `/api/v1` endpoint                             | Current contract used                                                                                                                                 |
| ---------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| POST `/bookings/:bookingId/quotes`             | Confirmed owner-only quote creation for PENDING/ACCEPTED booking with endsAt. Returns `{message, quote, booking, breakdown}`; booking becomes QUOTED. |
| GET `/bookings/:bookingId`                     | Existing Customer/Vendor reads retain BookingQuote relations, validating booking/vendor UUID associations.                                            |
| GET `/payments/vendor/summary`                 | Raw summary; only meaningful record/status counts are exposed. Unsafe monetary aggregates and first-record/default currency are stripped.             |
| GET `/payments/vendor/transactions`            | `{items, meta:{page,limit,total,totalPages}}`, actual payment UUIDs and separate gross/commission/net/payment/payout/refund states.                   |
| GET `/payments/vendor/transactions/:paymentId` | One raw transaction projection, validated against selected Payment UUID.                                                                              |
| GET `/payments/vendor/refunds`                 | `{items,meta}`; refund status, amount/currency, reason and actual processing date remain separate from payment status.                                |
| GET `/payments/payouts/mine`                   | Raw payout array; vendor ownership/UUIDs, amount, currency and payout status validated.                                                               |

Verified current controller/service/DTO/repository contracts. Transactions/refunds support page/limit (maximum 100), PaymentStatus filter and from/to; dates filter transaction creation or refund processing respectively. Payouts have no server filtering/pagination. Server ordering is preserved.

## Working Vendor and Customer UI

Vendor Orders uses RequestQuoteForm's separate live variant with current form styles. It supports flat/per-person pricing, deposit/full prepayment, typed menus, up to 20 labeled extra charges, transport/service fees, tax, discount, deposit amount/percentage, explicit ISO expiry, note and supplied terms. DTO/service constraints are checked without invented fees/minimum deposits. Final totals/commission/net come from the backend; no fixed commission calculation is used in live UI.

Creation requires verified active VENDOR ownership, actual booking identity and explicit confirmation. It shares the booking decision flight lock. Drafts survive failure; uncertain writes refresh the booking and require reconciliation before retry. Backend locking/status checks prevent a second quote for an already-QUOTED booking. Customer Orders now reviews actual BookingQuotes, independently of Community VendorOffers.

Earnings replaces its active sample transaction list with summary counts, transaction list/detail, refunds and payouts. It retains the Connect status panel and separates sample bank methods, charts and credits. Amount strings preserve returned digits/scale and explicit currency; currencies are never added together. Missing quote/nested-payout currency is labeled unavailable. Reported commission/net fallback semantics are explained rather than presented as settled earnings or proof of payout.

Reads use session/user/active-role arguments, T04 owner context, runtime schemas, currentData and zero unused-cache retention. Staff cannot access owner financial reads or quote creation. Errors, empty/loading/refresh/retry states remain distinct; provider/internal metadata is stripped. Quote writes invalidate affected Vendor/Customer booking/count/tracking caches and reread server state, with a final session check after reconciliation. Financial reads refresh independently and inherit shared focus/reconnect behavior.

## Blocked functionality and critical dependencies

- **Customer quote acceptance remains disabled.** Its audited PATCH requires owned pending/unexpired quote, QUOTED booking and no overlap; it moves the booking to PAYMENT_PENDING and creates a temporary hold. Safe checkout, hold expiry and recovery still require approval and the existing T14 security fixes.
- Summary amounts combine statuses and potentially currencies; no settled-earnings total is shown. Backend transaction presentation substitutes zero commission/gross-as-net when commission is absent; those values are labeled reported, not independently verified settlement.
- Existing T15 direct-booking inputs/terms blockers remain. Stripe intents/confirmation, completion approval, payout release, refunds, Connect mutations and bank CRUD are not connected.

## Tests and results

- Focused: **160 passed**, including **50 new Batch 4 regressions** and affected existing Customer/Vendor/earnings tests.
- One full suite: **1,096 passed / 1 obsolete assertion failed** out of **1,097 tests** (1,047 baseline + 50 new). The assertion expected transactions to remain previews; it now checks the live panel and preview separation. **All 84 affected tests passed** after correction. No second full-suite run, per the one-run limit.
- One production build: **passed**, including TypeScript. Final `npm run typecheck` also passed after lint cleanup.
- One repository lint found two async-handler issues in the new form. Both were fixed; targeted ESLint passed for the changed form/test. No second repository-wide lint run.
- Changed-file formatting and `git diff --check`: **passed**.

Coverage includes six new endpoint contracts, ownership/UUIDs, DTO boundaries, actual server breakdown, filtering/pagination, missing/mixed-currency safety, status separation, failures/retry, duplicate sends, uncertain-write reconciliation, blocked acceptance and late-session cleanup. All HTTP mocked; no production/Stripe calls. Interactive/responsive browser review remains manual under AGENTS.md restrictions. Batch 5 was not started.
