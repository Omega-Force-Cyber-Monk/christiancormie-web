# Sprint 2 - Vendor identity and dashboard integration

Date: 2026-10-27 (Asia/Dhaka). Scope: T04 only. The seven required audit/integration reports were read and their relevant findings were checked against current source before implementation. Backend source, environment values, dependencies, T01-T03 authentication/admin code and unrelated feature APIs were not changed. Existing working-tree changes were preserved.

## 1. Exact files changed

Paths are relative to `christinacormie-web`. This is the incremental T04 manifest, not the complete pre-existing working-tree diff.

- `src/features/vendor/api/vendor.api.ts` (new)
- `src/features/vendor/schemas/vendor.schema.ts` (new)
- `src/features/vendor/types/vendor.types.ts` (new)
- `src/features/vendor/utils/vendorAdapters.ts` (new)
- `src/features/vendor/utils/useVendorContext.ts` (new)
- `src/features/vendor/utils/vendorQr.ts` (new)
- `src/features/vendor/utils/vendor.test-fixtures.mjs` (new)
- `src/features/vendor/utils/vendorIntegration.test.mjs` (new)
- `src/features/vendor/utils/homeState.test.mjs`
- `src/features/vendor/components/home/VendorHomeLayout.tsx`
- `src/features/vendor/components/home/VendorAccessState.tsx` (new)
- `src/features/vendor/components/home/VendorAnalyticsPanel.tsx` (new)
- `src/features/vendor/components/home/VendorQrDrawer.tsx`
- `src/features/vendor/components/home/VendorQrPanel.tsx` (new)
- `src/features/vendor/pages/VendorDashboardPage.tsx`
- `src/services/api/baseApi.ts`
- `docs/sprint-2-vendor-dashboard-integration.md` (new, this report)

## 2. Actual endpoints connected

All five requests are authenticated GETs without a JSON body, query parameters or client-supplied vendor/truck IDs. The shared configured base URL supplies `/api/v1`.

| Endpoint                                    | Backend roles and behavior                                                            | Actual response shape                                                                                                          |
| ------------------------------------------- | ------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| GET /api/v1/vendors/me                      | VENDOR or VENDOR_STAFF; actor lookup; 404 if no vendor                                | Vendor record plus dashboardAccess, verificationBadge and verificationRequirements; includes relations in the backend response |
| GET /api/v1/food-trucks/mine                | VENDOR or VENDOR_STAFF; actor lookup; 403 if no vendor                                | Bare array of non-deleted owned trucks and included relations; ordered newest first                                            |
| GET /api/v1/vendors/me/analytics            | VENDOR only; vendor platform-access check                                             | Bare analytics object with aggregate metrics, recentBookings, paymentSummary and topTrucks                                     |
| GET /api/v1/bookings/vendor/requests/counts | VENDOR or VENDOR_STAFF; platform-access check                                         | `{bookings,community,messages}`                                                                                                |
| GET /api/v1/vendors/me/qr-code              | VENDOR or VENDOR_STAFF; platform-access check; ensures QR records for eligible trucks | `{vendorId,businessName,foodTruckId,qrCode,qrCodeUrl,downloadUrl,shareMessage}`; nullable truck/code/image/link fields         |

Source evidence: [VendorsController](../../christinacormie-backend/src/modules/vendors/vendors.controller.ts), [VendorsService](../../christinacormie-backend/src/modules/vendors/vendors.service.ts), [VendorsRepository](../../christinacormie-backend/src/modules/vendors/vendors.repository.ts), [FoodTrucksController](../../christinacormie-backend/src/modules/food-trucks/food-trucks.controller.ts), [FoodTrucksService](../../christinacormie-backend/src/modules/food-trucks/food-trucks.service.ts), [FoodTrucksRepository](../../christinacormie-backend/src/modules/food-trucks/food-trucks.repository.ts), [BookingsController](../../christinacormie-backend/src/modules/bookings/bookings.controller.ts), [BookingsService](../../christinacormie-backend/src/modules/bookings/bookings.service.ts), [BookingsRepository](../../christinacormie-backend/src/modules/bookings/bookings.repository.ts) and [CheckInsRepository](../../christinacormie-backend/src/modules/check-ins/check-ins.repository.ts).

All controllers use JWT/role guards. These five methods have no request/query DTO to populate. Missing/expired JWTs use existing 401 refresh handling; role/platform restrictions remain 403 responses. No extra response envelope was assumed.

## 3. Request/response contracts and cache behavior

The feature injects into the existing baseApi. It reuses Bearer preparation, single-flight refresh, retry bounds, storage synchronization, stale-session checks and logout cache/socket cleanup. New domain tags are Vendor, FoodTruck, VendorAnalytics, VendorRequests and VendorQr. No feature mutation was added; later approved writes should invalidate the relevant tags. Existing focus/reconnect behavior remains.

Runtime Zod schemas define the consumed HTTP DTOs, and TypeScript response types are inferred from those schemas. Malformed core fields or wrapped payloads produce a recoverable error rather than a fake empty response. Optional/null fields stay unavailable instead of becoming zero. Prisma Decimal strings are accepted for raw booking amounts and truck ratings. Financial strings are retained without passing through Number for display.

The backend profile includes a broad user relation. The client selects only its account status, and does not cache passwordHash or unrelated user/private fields. Other schemas likewise keep reviewed fields needed by this task, without dumping raw records into UI or logs.

Server data remains in RTK Query. Local React state holds drawer/dialog visibility and the existing local update draft. No ordinary Redux entity copy or second API client was introduced.

## 4. Vendor and food-truck identity

The feature enables reads only after verified authentication and explicit active VENDOR selection. A persisted role or unselected multi-role account does not enable the context. T01's full verified role set and role chooser remain unchanged.

Vendor UUID, owner user ID, food-truck UUID and public slug have distinct fields. The profile owner must match the verified current-user ID, and every returned truck must belong to that vendor. Identity mismatch hides connected data rather than guessing ownership. All real requests are actor-scoped `me`/`mine` reads; fixture names, display IDs and slugs never construct API identity.

The navbar uses actual businessName, available logo and vendor market/location data. A single returned truck can supply a missing image/location; multiple trucks are retained as a collection, without arbitrarily selecting one as the active truck. Zero trucks produces a clear onboarding/empty state. All returned trucks are listed in the existing analytics dialog, while backend-ranked topTrucks stay a separate list.

Platform access follows returned dashboardAccess. The current backend permits APPROVED and PENDING_APPROVAL, independently of the optional verification badge. Badge rejection/pending state never becomes an access restriction. DRAFT, SUSPENDED and REJECTED access states are explicit. Returned non-ACTIVE owner account status also blocks dashboard reads without changing authentication roles or removing guards.

## 5. Dashboard integration changes

The existing Home shell, navigation, action buttons, booking cards, activity section, dialogs, shared DashboardLayout and responsive CSS remain. No global styles or layouts were rebuilt.

- The Bookings section uses analytics.recentBookings (the backend's latest five). It displays the real booking number, status, customer, truck, start instant and amount. UUID is retained separately for selection. Fixture event titles, addresses, guest counts, avatars and relative dates are no longer shown as server data.
- Earnings & Analytics opens the existing dialog with real aggregate metrics: truck/bookings/reviews/followers/check-ins, average rating and succeeded-payment revenue. It includes payment status totals, backend top trucks and the owned-truck roster.
- Booking request counts use the backend definition: pending/quoted non-community bookings. Community counts follow the backend's eligible open-request logic. Messages is the active conversation count, not unread messages. The Requests sidebar badge uses the booking-request count.
- The analytics response has no currency, event timezone, historical chart series or recent-activity feed. Amounts identify currency as unavailable, start instants use explicit UTC, no chart points are manufactured, and Recent Activity communicates unavailability. TotalRevenue is labelled as succeeded-payment revenue, not net vendor payout.
- The fixture notification count and fixture notification/activity list were removed from the connected shell. The existing notification control explains that notifications are not connected; T19 was not started.
- The existing Post Update form remains an explicitly local draft. Saving it does not create a server post, pretend publication, or insert fake remote activity. T07 was not started.

Other vendor pages retain their prior static behavior outside this task; shared navbar identity is now real. Historical fixture/reducer/artwork helpers remain for untouched previews and tests, but connected Home, QR and API paths do not use them as identity or fallback data.

## 6. QR integration changes

The existing drawer/modal lifecycle and CSS classes remain. The QR endpoint is loaded when the drawer is mounted for a permitted vendor. Returned vendorId and foodTruckId must match the verified context/roster. No frontend QR ID or encoded image is fabricated.

The backend chooses the returned primary QR. The frontend uses that explicit truck ID even when it is not the first truck in the roster. It does not choose a truck precedence or invent a truck-selection API parameter.

- A real downloadUrl is used for image display and the download/open link.
- Missing image URL shows an unavailable-image state and disables download; the supplied sample SVG is never substituted.
- qrCodeUrl is resolved against the configured API origin, including a root-relative `/api/v1/...` path without duplicating prefixes. It is not resolved as a bundled asset on the SPA origin when an absolute backend base is configured.
- Share uses the returned URL and shareMessage, with native URL sharing, clipboard fallback and a manual-copy field. Cancellation does not report success or copy unexpectedly.
- Unsupported/missing URLs disable sharing. Only HTTP(S) URLs without embedded credentials are used.
- Missing code/truck metadata, identity mismatch, errors and retries are explicit. A Refresh QR information control allows retry even after a successful response with no QR/image.

The browser controls whether a cross-origin download link downloads directly or opens the returned file. No client-side image-fetch proxy or image-generation dependency was added.

## 7. Loading, empty and error handling

- Initial profile/analytics/truck/QR reads use existing loading feedback.
- Background refresh is announced; temporary failures retain valid prior data with retry feedback.
- Profile 404 communicates missing profile/onboarding. Profile/feature 403 is contextual, and denied data is hidden rather than replaced by fixture data.
- Returned account restrictions and vendor dashboard-access restrictions hide cached dashboard details.
- Zero trucks, no recent bookings, missing top trucks/payment summaries and missing QR fields have explicit states.
- Malformed core responses fail validation safely. Null optional values display N/A/unavailable rather than simulated values.
- Definitive refresh 401 follows existing invalid-session cleanup; temporary errors never force a fake login or role switch.
- Cache reset on logout/new session prevents late vendor results from repopulating a previous identity's cache. No stale response callback clears or overwrites a replacement session.

## 8. Tests and results

The existing test scripts/runner were inspected before execution. All HTTP was locally mocked against the fixed test API base; static React rendering used no browser/server. The old Home rendering test now seeds backend-shaped RTK Query responses instead of asserting sample identity/bookings; its route/guard assertions remain.

- New vendor integration suite: **33 passed**.
- Focused vendor/Home/role-route run: **51 passed**.
- Complete `npm.cmd test`: **349 passed, 0 failed, 0 skipped**, including all 316 prior regressions.
- `npm.cmd run typecheck`: passed after correcting an unused import found during implementation.
- `npm.cmd run build`: passed, including the final TypeScript project check and production Vite build.
- `npm.cmd run lint`: passed with no errors or warnings.
- Changed-file `prettier --check`: passed for all 17 T04 files.
- `git diff --check` and local report-link/manifest checks: passed.

Coverage includes all five endpoint paths/envelopes/credentials, sensitive-field exclusion, actual vendor/truck/slug identities, zero/one/multiple trucks, Decimal/null amounts, metrics/count semantics, UTC times, QR ownership/URLs/unavailable controls/share cancellation, vendor and owner-account restrictions, optional badge rejection, unauthorized roles, loading/403/404/network/server errors, retry, cached background data, existing refresh/401 handling, malformed envelopes and delayed data after logout/new session.

No production API calls, real credentials, backend build/lint/test/runtime commands, dependency installation or environment changes were used. Browser/interactive/responsive checks were not executed because AGENTS.md sections 12-13 prohibit starting servers and browser automation. Static rendering is not visual, focus or screen-reader certification. Those manual checks and live non-production API verification remain pending.

## 9. Remaining backend issues and contract limits

1. **G13 source has changed since the audit.** Current VendorsService.getMyVendorProfile calls findVendorForActor, which checks owner first and then ACTIVE, non-deleted staff. Therefore the audited owner-only lookup defect is not present in current local profile/QR source. No backend changes were made by this task. Analytics is still controller-restricted to VENDOR, and staff owner-write operations have separate restrictions. Staff dashboard expansion remains outside T04; no impersonation, guessed vendor ID or guard workaround was added.
2. **QR images are optional.** ensureTruckQrCode creates a code without setting qrImageUrl. downloadUrl can therefore legitimately remain null. Image display/download needs an actual backend-provided image; the frontend explicitly disables the unsupported action.
3. **QR share target is metadata.** The returned qrCodeUrl points to a backend QR profile endpoint returning profile information. A customer-facing web/deep-link destination is a separate product/backend contract; this task does not invent a T05 route.
4. **Analytics omissions remain explicit.** No currency, historical chart series, event timezone, event name/address/guest count, notification count or recent-activity feed is provided by these dashboard reads. The frontend does not reconstruct those values from fixtures or unrelated APIs.
5. **Multi-truck frontend support exceeds current creation constraints.** The list API returns an array and the frontend handles multiple entries, but the current schema has a unique vendorId on FoodTruck and the draft service rejects an additional truck. QR returns one backend-selected record with no truck-choice query. Supporting multi-truck creation/QR selection requires a separate backend/product change.
6. **Raw profile serialization needs backend review.** vendorInclude includes an unrestricted user relation. Client schemas exclude private fields from cache/UI, but a narrower backend presenter is still advisable; this frontend task cannot change what the backend transmits.
7. Current JWT/account revocation timing remains a backend responsibility. This feature honors returned account/vendor restrictions and HTTP denials, while preserving the established authentication infrastructure.

## 10. T04 acceptance status

**Supported T04 read integration is complete and regression-tested.** Vendor identity, roster, analytics, request counts and actual QR metadata use verified backend contracts and shared RTK Query. Approved active-role behavior, guards, logout cleanup, existing layouts and responsive classes remain. No sample server data or staff permission workaround is used.

Unavailable backend fields/image delivery and the limits above remain explicit, rather than being fabricated. Production/live and manual visual validation are not claimed. Work stops at T04; T05 and later integrations were not started.
