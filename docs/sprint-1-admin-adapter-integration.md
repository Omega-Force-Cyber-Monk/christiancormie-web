# Sprint 1 - Admin API response integration

Date: 2026-10-27 (Asia/Dhaka). Scope: T03 and G04-G09. The required audit, mapping, plan, gaps, T01 and T02 reports were read; current backend source was checked before implementation. Work proceeded Users -> Bookings -> Vendors -> Community -> Reviews -> Payments -> Rewards, with focused tests before moving to each next page.

Only the frontend was changed. Existing working-tree changes, T01/T02, route guards, shared baseApi/session handling, layouts and global styles were preserved. No backend changes, dependency installation, environment changes, production requests or T04 work occurred.

## 1. Exact files changed

The following manifest lists only T03 changes, relative to `christinacormie-web`. The rest of the working-tree diff predates this task.

- `docs/sprint-1-admin-adapter-integration.md`
- `src/components/data-display/DataTable/data-table.types.ts`
- `src/components/data-display/DataTable/DataTablePagination.tsx`
- `src/features/admin/api/admin.api.ts`
- `src/features/admin/components/AdminOperationalTable.tsx`
- `src/features/admin/components/bookings/bookingBadges.tsx`
- `src/features/admin/components/bookings/BookingDetailsModal.tsx`
- `src/features/admin/components/bookings/bookings.types.ts`
- `src/features/admin/components/vendors/BusinessLicenseModal.tsx`
- `src/features/admin/components/vendors/TruckRequestCards.tsx`
- `src/features/admin/components/vendors/TruckRequestModal.tsx`
- `src/features/admin/components/vendors/vendorBadges.tsx`
- `src/features/admin/components/vendors/VendorDetailsModal.tsx`
- `src/features/admin/components/vendors/vendors.types.ts`
- `src/features/admin/pages/AdminBookingsPage.tsx`
- `src/features/admin/pages/AdminCommunityPage.tsx`
- `src/features/admin/pages/AdminPaymentsPage.tsx`
- `src/features/admin/pages/AdminReviewsModerationPage.tsx`
- `src/features/admin/pages/AdminRewardsPage.tsx`
- `src/features/admin/pages/AdminUsersPage.tsx`
- `src/features/admin/pages/AdminVendorsPage.tsx`
- `src/features/admin/types/admin.dto.ts`
- `src/features/admin/types/admin.types.ts`
- `src/features/admin/utils/admin.test-fixtures.mjs`
- `src/features/admin/utils/adminBookings.test.mjs`
- `src/features/admin/utils/adminBookings.ts`
- `src/features/admin/utils/adminCommunity.test.mjs`
- `src/features/admin/utils/adminList.ts`
- `src/features/admin/utils/adminModeration.ts`
- `src/features/admin/utils/adminOperations.ts`
- `src/features/admin/utils/adminPageStates.test.mjs`
- `src/features/admin/utils/adminPayments.test.mjs`
- `src/features/admin/utils/adminReviews.test.mjs`
- `src/features/admin/utils/adminRewards.test.mjs`
- `src/features/admin/utils/adminUsers.test.mjs`
- `src/features/admin/utils/adminUsers.ts`
- `src/features/admin/utils/adminVendors.test.mjs`
- `src/features/admin/utils/adminVendors.ts`

## 2. Endpoints and actual contracts

All endpoints use the existing `/api/v1` base prefix. Verified against [AdminController](../../christinacormie-backend/src/modules/admin/admin.controller.ts), [AdminService](../../christinacormie-backend/src/modules/admin/admin.service.ts), [AdminRepository](../../christinacormie-backend/src/modules/admin/admin.repository.ts), [AdminListQueryDto](../../christinacormie-backend/src/modules/admin/dto/admin-list-query.dto.ts) and [UpdateNewFoodTruckRequestDto](../../christinacormie-backend/src/modules/admin/dto/update-new-food-truck-request.dto.ts).

The controller requires a valid Bearer JWT and the backend ADMIN role for these operations. Existing frontend verified-session and active-role guards remain authoritative for frontend navigation; backend authorization still controls data and mutations. UUID path parameters use ParseUUIDPipe.

| Operation              | Endpoint                                                                | Response consumed                                                                                                                                   |
| ---------------------- | ----------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| Users                  | GET /admin/users-management                                             | generatedAt, global summary, users with UUID id and display userId, activity.totalBookings/referrals, top-level points and canSuspend/canRetrieve   |
| Suspend / restore user | PATCH /admin/users/:userId/suspend; PATCH /admin/users/:userId/retrieve | Existing account-status mutation result; true UUID supplied, no invented body                                                                       |
| Bookings               | GET /admin/bookings-management                                          | generatedAt, summary including disputedSource, bookings with amount, fees, top-level models, event startsAt/address and nullable payment/commission |
| Vendors                | GET /admin/vendors-management                                           | summary, tabs and vendor rows; no generatedAt or truckRequests member                                                                               |
| Truck requests         | GET /admin/vendors/truck-requests                                       | Bare array of NewFoodTruckRequest records and requestedBy/reviewedBy relations                                                                      |
| Mark communicated      | PATCH /admin/vendors/truck-requests/:requestId                          | Updated request record; body `{status:"COMMUNICATED"}`. Optional notes is supported but omitted to preserve existing request notes                  |
| Community              | GET /admin/community-management                                         | generatedAt, global summary/tabs, posts with UUID id, display postId and isReported                                                                 |
| Reviews                | GET /admin/reviews-management                                           | generatedAt, global summary/tabs, reviews with UUID id, display reviewId, vendor.businessName, isReported and moderation indicators                 |
| Payments               | GET /admin/payments-management                                          | Existing summary, payoutRequests, revenueOverview, transactions and paymentMethods.methods                                                          |
| Rewards                | GET /admin/rewards-management                                           | Existing summary/paymentSummary, leaderboard, redeemTransactions, topUsers and tierCounts                                                           |

AdminListQueryDto permits search, status, category, sortBy, sortOrder, limit and offset, but each repository operation applies only a subset. Limit defaults to 20 and is capped at 100. Management summaries generally count global data independently of the row filters. None of the repaired management lists returns a filtered total or total-pages value.

No user/vendor/detail mutation, moderation action, payout execution or unrelated API was added. Existing suspend/retrieve and truck communication mutations remain; the only newly injected endpoint is the dedicated truck-request GET.

## 3. Original mismatches and corrections

### Users - G05/G09

The original types read userDisplayId, activity.bookings, nested loyalty and nested action permissions directly from HTTP, despite the backend returning different fields. An explicit adapter now maps display userId, activity.totalBookings, loyaltyPoints/lifetimePoints/redeemedPoints and top-level action flags. UUID id remains separate and is used for mutations and row identity.

The existing user table, View modal, confirmation dialog and mutation notifications remain. Missing permissions disable mutation controls instead of assuming permission. Modal selection follows the current row by UUID, so returned permission/status changes are reflected. Search and the status selector use server filters; the frontend no longer searches/slices a single default batch as if it were the whole population.

### Bookings - G04/G09

The adapter now consumes vendor.businessName, bookingNumber, amount, event.startsAt/address, top-level paymentModel/pricingModel, and payment.commission. The UI row retains the original backend record, a UUID id and a separate displayId.

The displayed booking total comes from booking.amount, not a possibly partial payment/deposit. Commission and vendor payout come only from returned commission values. Null payments, null commission and missing optional nested fields display unavailable data without crashing or becoming zero. Known payment preferences distinguish PREPAID_IN_FULL, DEPOSIT_ONLY and NO_PREFERENCE; pricing distinguishes PER_PERSON, FLAT_FEE and unavailable/unknown values.

All backend booking statuses retain their meaning: PENDING, QUOTED, ACCEPTED, PAYMENT_PENDING, CONFIRMED, IN_PROGRESS, COMPLETED, CANCELLED, REJECTED and EXPIRED. Unknown future statuses remain visible in a neutral badge; nothing silently becomes pending. Review-report indicators are not converted into a fabricated booking status.

The details modal now shows actual contacts, guest count, start time, address, payment amount, commission gross amount and commission payout. Partial payments are identified separately from the booking total. The sample per-person calculation and fixed commission percentage were removed. Its payment status comes from the response rather than a hardcoded held state. Times are explicitly shown in UTC because this presenter does not supply eventTimezone. When a payment supplies currency, its currency is used; otherwise monetary rows identify currency as unavailable. The existing Pending Payment Release card remains N/A because no such summary field is returned. No replacement total was invented.

### Vendors and truck requests - G06

Vendor adapters retain real cuisine, contact, service area, description, counts/revenue, memberSince, menu names and verification documents. The complete original vendor row remains available as source data, including trucks, menu detail, verification requests, badges and photo requests.

Document JSON is handled defensively. Type/URL and available metadata are preserved; only HTTP(S) document links are allowed. The existing document panel now links to the submitted document and uses returned metadata. It no longer substitutes a document type for a license number, claims an invented issuing authority/active license, or fabricates a permit. Missing fields remain N/A; document status is not guessed from vendor status. Modal/card layout classes and styling are retained.

Truck requests are loaded separately and mapped from the actual raw model: UUID, truckName, owner contact, city/state, notes, createdAt, status and nullable requestedBy. There is no invented requestDisplayId, usualLocation, requester, description or relative submission date in the HTTP contract. The UI displays the real UUID and actual submission date. Missing phone no longer becomes a sample phone number.

Communication is protected against duplicate in-flight submissions. Failure leaves the modal/context recoverable; success closes only the selected matching request. The request list and vendor aggregate share existing AdminVendors tags, so the existing update invalidates/refetches both. Communicated rows are selected by a backend status query, not by filtering one loaded batch locally.

### Community and reviews - G07/G09

Separate adapters map postId/reviewId to display IDs while retaining UUID row IDs. Active report flags use isReported directly; they are not derived from the mere presence of historical reports. Nullable authors/vendors/content are safe. Reviews use vendor.businessName, preserve hidden text/rating indicators, and never display hidden text as ordinary visible content.

Community category labels map explicitly to NEED_TRUCK, VENDOR_CALLOUT, FOR_SALE, HIRING_JOBS, COMMUNITY_HELP and COMMUNITY. The old label-to-string comparison no longer excludes valid rows. Search and category filtering run on the backend, with debounce and page reset. Reviews send REPORTED for reported-only filtering and use backend search/pagination.

The current presenter hardcodes source BOOKING and the CHECK_IN repository filter uses a sentinel non-UUID. The existing Check in option now explains that this source is unavailable and does not send that unsafe/unsupported category. Booking review results are not relabeled as check-ins. No moderation endpoints/actions were invented or enabled.

### Existing Payments/Rewards tabs - G08

G08 was within the requested gap range, so the existing already-connected responses were inspected as well. Returned payout, transaction, method, monthly revenue, leaderboard, redemption and top-user rows now render inside the existing tab panels through the shared DataTable, replacing unconditional false empty states. This is read-only presentation of existing responses; no financial action or new financial endpoint was connected.

Explicit DTOs replace unknown row arrays, including the actual nested paymentMethods object and reward tier objects (slug, name, level and point thresholds). Top-user rows render tier.name rather than the object itself. Empty messages now mean the corresponding returned array is empty. Top Users retains its existing tier presentation alongside actual user rows. Only returned administrative fields are rendered; raw records and schemaGaps are not dumped into the page.

## 4. Adapter/type and infrastructure changes

`admin.dto.ts` models the consumed backend presenter/model properties separately from UI models. Domain adapters own response-to-UI transformations; components retain the existing feature architecture. Original records stay in the RTK Query cache and are not duplicated into Redux slices. Selected-record UI state remains local React state.

The existing admin API module, shared baseApi, auth headers, refresh/retry protections, tags, error normalization, loading components and confirmation lifecycle are reused. The shared DataTablePagination now has an optional unknown-total mode using hasNextPage and isFetching. Existing known-total callers keep their prior behavior and styling.

## 5. Pagination and filtering behavior

| List/tab                                      | Server behavior used                               | Presentation                                                                  |
| --------------------------------------------- | -------------------------------------------------- | ----------------------------------------------------------------------------- |
| Users                                         | search/status, limit/offset                        | 10/20/50 rows, next/previous; UUID mutation targets                           |
| Bookings                                      | search, limit/offset                               | Existing five-row contrast table; next/previous                               |
| Vendors                                       | search, limit/offset                               | Existing cards plus the same contrast pagination component                    |
| Truck requests                                | search, optional COMMUNICATED status, limit/offset | Separate request pages; global tab counts are not computed from loaded rows   |
| Community                                     | search/category, limit/offset                      | Existing cards with next/previous                                             |
| Reviews                                       | search/REPORTED category, limit/offset             | Existing panels with next/previous; unsupported Check in is explicit          |
| Payout requests                               | limit/offset                                       | Shared table with next/previous                                               |
| Reward redemptions                            | limit/offset                                       | Shared table with next/previous                                               |
| Transactions / reward leaderboard / top users | Repository ignores offset for these arrays         | Up to 100 returned records, explicitly bounded; no pretend next-page controls |
| Payment methods / revenue months              | Presenter supplies its methods/month arrays        | Render all returned rows; no fabricated pagination                            |

Paginated requests ask for pageSize + 1 records (at most 51), show pageSize, and use the extra record only to determine Next. Offset is `(page - 1) * pageSize`, so the lookahead row is not skipped. No total, last-page number or global filtered count is manufactured. The default backend limit of 20 no longer prevents reaching later supported pages.

The existing 400 ms debounce utility handles search. Settled search/status/category/page-size/tab changes reset pagination, including switching back to a previous filter. Pagination controls disable while fetching. currentData keeps results aligned with their actual query; a background failure for the same query retains good rows and shows retry feedback. Initial errors are not presented as empty data.

Backend search semantics remain authoritative. For example, users search name/contact/location rather than a fabricated short-ID filter. Unsupported client-only search predicates were removed; no claim is made that every visible field is searchable.

## 6. Tests and validation

Each page's focused suite passed before proceeding to the next. The server-free runner was inspected before execution. Fixtures use the actual presenter field names and raw truck-request array shape, with local mocked HTTP and static React rendering.

- Users/shared pager: 9 passed initially (6 new Users cases plus 3 existing pagination cases).
- Bookings: 4 passed initially; the later detail-adapter case also passed.
- Vendors: 4 passed.
- Community: 2 passed.
- Reviews: 3 passed.
- Payments: 2 passed.
- Rewards: 2 passed.
- Cross-page state/filter/mutation checks: 9 passed.
- Full `npm.cmd test`: **316 passed, 0 failed, 0 skipped**, including all 283 T01/T02/foundation regressions and 33 new admin tests.
- Focused Bookings/Vendors rerun after tightening a mock filter and removing an unused test import: **9 passed**. The complete 316-test suite was then rerun after aligning reward tier object fixtures and review statuses with backend source; it passed again.
- `npm.cmd run typecheck`: passed during page validation. The final build also checks TypeScript.
- `npm.cmd run build`: passed (`tsc -b` and production Vite build).
- `npm.cmd run lint`: passed with no errors or warnings. The last booking-detail additions also passed focused ESLint.
- Changed-file `prettier --check`: passed for all 38 T03 files.
- `git diff --check` and report source-link checks: passed.

Coverage includes actual response mappings, UUID/display IDs, nullable/missing optional fields, every booking status plus unknown statuses, real totals/commissions, server search/status/category/offset serialization, lookahead paging without invented metadata, request cache invalidation/persistence, suspend/retrieve success/failure, and every page's loading, initial error, retry, retained-data refresh failure and empty states. Authentication, logout, refresh/session and role-route regressions all remain passing. Cross-tab synchronization code was unchanged.

No backend build/lint/test/runtime command or production API call was run. Browser automation and development/preview servers were not used because AGENTS.md sections 12-13 prohibit them. Static rendering does not verify responsive geometry, focus or screen-reader behavior. Manual UI/keyboard/responsive review and live non-production integration checks remain unverified.

## 7. Remaining issues and product/backend decisions

- Filtered totals are absent. Next/previous works for supported lists; exact total-page UX requires backend metadata.
- Pending Payment Release is not returned in the booking summary. It remains N/A. The disputed summary is explicitly sourced from review reports, not booking issues; these must not be treated as the same operational workflow.
- Event timezone and currency for unpaid booking totals are absent from the presenter. UTC/unavailable-currency labels avoid guesses. Existing global monetary summaries and vendor revenue lack per-currency grouping; their established display convention remains and needs a separate currency contract before financial reconciliation.
- Real CHECK_IN review classification is unsupported; the sentinel filter may fail UUID validation in the database. That option stays explicitly unavailable pending a backend contract.
- Transaction history, reward leaderboard and top-user arrays lack effective offset support. Bounded returned rows are displayed; complete traversal needs backend changes. Reward tierCounts are derived from loaded loyalty accounts rather than a guaranteed platform-wide tier distribution.
- Existing vendor/document approval controls, payment release/refund controls and booking-message previews are not newly integrated. G12's issue/conversation mismatch and financial/moderation mutations belong to later tasks; no success or persisted action was fabricated here.
- No generic user/vendor/booking detail endpoint was needed for the repaired read fields. Such endpoints can include broad raw records; future expansion should review their response surface before adding consumers.

## 8. T03 acceptance status

**Supported T03 integration repairs are complete and covered by automated regression tests.** G04-G09 frontend mismatches have been addressed without changing backend contracts, widening auth access or rebuilding page shells. The source-limited items above remain explicit backend/product limitations; full admin operational workflows and production readiness are not claimed.

Work stops at T03. T04 and unrelated customer/vendor integrations were not started.
