# Sprint 2 — T05 discovery, food-truck profiles and social actions

Date: 2026-10-28 (Asia/Dhaka). Scope: T05, C01–C05 and C08. The eight required audit/integration documents and current frontend/backend implementations were reviewed. Earlier working-tree changes are preserved. Backend source, environment files, dependencies, authentication architecture, layouts and global styles were not changed. T06 was not started.

## 1. Exact files changed

This is the incremental T05 manifest, relative to `christinacormie-web`; the working tree also contains earlier sprint changes.

- `src/features/customer/api/discovery.api.ts` (new)
- `src/features/customer/schemas/discovery.schema.ts` (new)
- `src/features/customer/types/discovery.types.ts` (new)
- `src/features/customer/utils/discoveryAdapters.ts` (new)
- `src/features/customer/utils/discovery.test-fixtures.mjs` (new)
- `src/features/customer/utils/discoveryIntegration.test.mjs` (new)
- `src/features/customer/utils/memberProfile.test.mjs`
- `src/features/customer/pages/CustomerDiscoverPage.tsx`
- `src/features/customer/pages/CustomerProfilePage.tsx`
- `src/features/customer/components/discover/DiscoverFiltersDrawer.tsx`
- `src/features/customer/components/discover/DiscoverTruckCard.tsx`
- `src/features/customer/components/discover/DiscoverProfileView.tsx`
- `src/features/customer/components/discover/TruckSocialActions.tsx` (new)
- `src/features/customer/components/profile/ProfileSummary.tsx`
- `src/features/customer/components/profile/ProfileTabs.tsx`
- `src/features/customer/components/profile/ProfileMenu.tsx`
- `src/features/customer/components/profile/ProfileReviews.tsx`
- `src/services/api/baseApi.ts` (domain tags only, retaining T04 tags)
- `docs/sprint-2-t05-discovery-integration.md` (new, this report)

## 2. Connected backend endpoints and request contracts

The configured base URL supplies `/api/v1`; feature definitions use relative paths. All reads use GET, social writes use the indicated verb, and no request includes fixture IDs or invented properties.

| Endpoint                                                  | Implemented request                                                               | Authentication and response                                                                                                                    |
| --------------------------------------------------------- | --------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| GET `/api/v1/discovery/nearby`                            | Required latitude/longitude; radiusKm, limit, optional search/cuisineId/minRating | Public; `{meta:{count,center,radiusKm},foodTrucks}`                                                                                            |
| GET `/api/v1/discovery/trending`                          | limit, optional search/cuisineId/minRating                                        | Public; `{meta:{count},foodTrucks}`                                                                                                            |
| GET `/api/v1/food-trucks/cuisines`                        | No query/body                                                                     | Public; bare active cuisine array ordered by name                                                                                              |
| GET `/api/v1/food-trucks/profile/:slug`                   | Encoded public slug; no body                                                      | Public; raw food-truck record with selected related vendor, cuisines, images, active menus/categories/items, operating hours and service areas |
| GET `/api/v1/food-trucks/profile/:slug/reviews`           | limit=20, optional cursor from previous nextCursor                                | Public; `{items,nextCursor,summary:{averageRating,totalReviews}}`                                                                              |
| GET `/api/v1/promotions/food-trucks/:foodTruckId`         | UUID; activeOnly=true, limit=100                                                  | Public; bare promotion array                                                                                                                   |
| GET `/api/v1/social/favorites`                            | Default unfiltered ALL; no body                                                   | JWT, no backend role restriction; `{items,totalCount,openCount,closedCount}` actually combines favorites and follows                           |
| POST `/api/v1/social/food-trucks/:foodTruckId/favorite`   | UUID; no body                                                                     | JWT; existing/created FavoriteTruck record with id/userId/foodTruckId/createdAt                                                                |
| DELETE `/api/v1/social/food-trucks/:foodTruckId/favorite` | UUID; no body                                                                     | JWT; `{unfavorited:boolean}`                                                                                                                   |
| POST `/api/v1/social/food-trucks/:foodTruckId/follow`     | UUID; no body                                                                     | JWT; existing/created FoodTruckFollow record with notificationsEnabled                                                                         |
| DELETE `/api/v1/social/food-trucks/:foodTruckId/follow`   | UUID; no body                                                                     | JWT; `{unfollowed:boolean}`                                                                                                                    |

Source verification: [discovery controller](../../christinacormie-backend/src/modules/discovery/discovery.controller.ts), [discovery DTOs](../../christinacormie-backend/src/modules/discovery/dto/discovery-query.dto.ts), [discovery service](../../christinacormie-backend/src/modules/discovery/discovery.service.ts), [discovery repository](../../christinacormie-backend/src/modules/discovery/discovery.repository.ts), [food-truck controller](../../christinacormie-backend/src/modules/food-trucks/food-trucks.controller.ts), [food-truck service](../../christinacormie-backend/src/modules/food-trucks/food-trucks.service.ts), [food-truck repository](../../christinacormie-backend/src/modules/food-trucks/food-trucks.repository.ts), [social controller](../../christinacormie-backend/src/modules/social/social.controller.ts), [social service](../../christinacormie-backend/src/modules/social/social.service.ts), [social repository](../../christinacormie-backend/src/modules/social/social.repository.ts), [promotion controller](../../christinacormie-backend/src/modules/promotions/promotions.controller.ts), [promotion service](../../christinacormie-backend/src/modules/promotions/promotions.service.ts), and [promotion repository](../../christinacormie-backend/src/modules/promotions/promotions.repository.ts).

Contract details checked against implementation rather than Swagger examples:

- Discovery coordinates must be within latitude ±90 / longitude ±180. Zero is valid. radiusKm supports 0.1–100, limit 1–100, minRating 1–5, and search is limited to 100 characters. The backend also supports operatingStatus/openOnly, cuisineSlug/cuisine, area/city, but existing UI does not collect them, so they are not sent. Search matches truck name in the repository; cuisine filtering is a separate operation.
- Nearby defaults to 10 km, requires nonexpired stored location, sorts by straight-line spatial distance, and has no offset/cursor. Trending requires a stored truck location, uses the backend's engagement score (not a weekly time window), and permits only APPROVED vendors in its repository. Public profile/reviews permit APPROVED or PENDING_APPROVAL vendors with ACTIVE, non-deleted trucks.
- Reviews expose only PUBLISHED, ratingVisible entries, newest first. limit supports 1–50 and cursor is a review UUID. `nextCursor` is authoritative; local cursor history supports previous/next controls.
- Promotions select currently active windows when activeOnly is true; the repository defaults to 50 despite a DTO example of 20. This client explicitly requests 100. Follower-only listings are not proof of redemption eligibility; redemption is not implemented.
- Social mutations require an existing ACTIVE, non-deleted truck and an available vendor (APPROVED or PENDING_APPROVAL). Missing resources produce 404; unavailable trucks/vendors produce 403. Follow additionally rejects blocked accounts, may follow the owner account, and awards backend points. Unfollow also unfollows the owner. No points/count changes are simulated in the client. DELETE false means no relation existed and therefore confirms absence, rather than implying a failed operation.
- The optional PATCH `/social/food-trucks/:foodTruckId/follow/notifications` was inspected: JWT, `{notificationsEnabled:boolean}`, existing follow required or 404. No existing T05 control collects this setting, so it is intentionally not wired or given a new UI.

## 3. Response schemas, adapters and cache ownership

Feature-local Zod schemas validate the consumed response subset and strip unrelated raw fields. Their inferred types distinguish discovery DTOs, public profiles, reviews, promotions, combined lists, coordinates and UI cards. Malformed core data produces a recoverable error, never fake empty data or fixture fallback.

Pure adapters map discovery and combined-list cards, keep UUID and slug separate, convert kilometers to miles using 1.609344 km/mile, and validate coordinates and HTTP(S) image URLs. Missing ratings, distances and images stay unavailable; real zero values remain zero. Prisma Decimal strings in menus/promotions/ratings are accepted and retained. Menu prices have no currency field in this contract, so currency is explicitly unavailable rather than assumed USD. Dates displayed by this feature use explicit UTC where a timestamp is shown.

All requests inject into existing baseApi. Tags are Discovery, FoodTruck, TruckProfile, Favorites and Follow. Successful social writes invalidate the affected discovery/profile/combined-list caches; failed responses do not manufacture updates or trigger success invalidation. Server-confirmed social results use session/truck/action-scoped RTK Query mutation cache keys shared across matching views. No remote entities are copied into a separate Redux slice or local component arrays. UI state remains local (tabs, dialogs, search/filter selection, cursor history and opt-in coordinates).

The existing Bearer/refresh/retry/base-error infrastructure remains. Mutations independently enforce verified identity plus active CUSTOMER membership and valid UUID before HTTP. Buttons and a per-store/session/truck/action in-flight lock prevent duplicate/opposite concurrent submissions. A session change rejects late confirmation; existing middleware aborts/resets old requests and caches. Action notifications check that the same verified customer is still active before showing Sonner feedback.

## 4. Discovery and filters

The existing search placement, filter drawer, card presentation, Nearby-area column and horizontal trending row are retained. Demo data-state switching, fake map pins, sample recommendation IDs and invented promotion badges are removed from the connected path. Nearby is labelled Nearby food trucks, and trending has no unsupported weekly/personalized claim.

Search uses the existing debounce hook. Cuisine options are loaded from the backend and submit the actual cuisine UUID. The drawer preserves its tiles, distance/rating chips and reset/apply actions; it explicitly permits one cuisine because the backend has no cuisine-array contract. Icons use supplied category images or existing decorative cuisine artwork when available. A failed cuisine load has retry feedback. Filter/search changes reset the result limit to 20. Distance chips convert miles to radiusKm for nearby only; trending explicitly communicates that distance filtering requires nearby results.

**Pagination limitation:** TrendingFoodTrucksQueryDto accepts offset, but findTrendingFoodTrucks does not read it or emit SQL OFFSET. Sending increasing offsets would repeat the first page. The frontend therefore uses the supported limit to request larger sets (20 → 100), clearly labelled as larger result sets rather than distinct pages. `meta.count` is the returned count, not a dataset total. No global page count or reach beyond 100 is claimed. Nearby has no pagination contract beyond increasing limit. A backend pagination fix is required for full distinct-page acceptance.

## 5. Truck profiles, menus, gallery, reviews and promotions

Discovery selections load the real slug. `/profile/:id` retains its route shape but treats a truck value as the public slug, and preserves the existing member `me`/sample-member routing for T06. No route guard, route configuration or metadata was changed.

Both entry points reuse the connected DiscoverProfileView and existing ProfileSummary/ProfileTabs/ProfileMenu/ProfileReviews components, profile CSS, Modal lifecycle, gallery expansion and tab keyboard behavior. The dedicated profile route retains URL tab selection. Profile fields use actual business name/description, images, cuisine links, address, operating status, guest capacity and backend counts. The badge is shown only for returned vendor verification. Operating status is not socket online presence. No unsupported credit-acceptance, distance/directions, hours or sample offer claim is added.

Menu categories/items, availability and dietary flags come from the raw public profile. Gallery images use actual sorted records. Reviews show actual author, rating, title/content, verified flag, date and vendor response; cursor controls use nextCursor. Promotions come from the separate UUID-based query and show real title/description, follower restriction, supplied percentage and expiry, with no sample offer fallback or redemption success.

Message, Book and Directions controls remain and open informative dialogs. They do not create conversations, bookings, payments, routes or fabricated success. Existing booking-preview code remains untouched but is no longer used to suggest completion from real truck profiles. C06/C07 and later booking/messaging integration remain excluded.

## 6. Favorites and follow behavior — backend blocker

Current SocialRepository.getFavorites unions favorite_trucks and food_truck_follows. SQL calculates an `is_fav` value, but the response mapper ignores it and hardcodes `isFavorite: true` for every row. It also supplies followedAt/followedSince for either relation. Public truck profiles and discovery responses contain no viewer-specific follow/favorite flags. Therefore membership cannot distinguish favorite-only, follow-only or both, and followedAt cannot establish following.

The connected collection is accurately labelled **Saved or followed trucks**, not a trustworthy favorites-only list. For active trucks absent from the complete unfiltered, unpaginated ALL collection, both relations are absent. For listed trucks, initial state remains unknown. The frontend does not mark every returned truck saved, infer following from followedAt, or arbitrarily choose a state.

Save/Remove favorite and Follow/Unfollow perform the supported idempotent operations. Present unknown state is labelled; no aria-pressed false/default is assigned to an ambiguous relation. Confirmed responses set the corresponding shared state; failures leave no false confirmation. Profile controls offer explicit removal when the prior state is unknown, and the existing card heart remains the compact save/toggle control. Counts refresh from the backend rather than being incremented locally. Reload/new-session restoration still needs a reliable relationship-read contract.

**Full C03/C05 acceptance is blocked:** backend must return the computed favorite flag and an independent viewer follow flag (or expose equivalent reliable reads). No backend source was modified and no extra endpoint was invented to bypass this defect.

## 7. Location and map limitations

Use my location invokes browser geolocation only after an explicit button action and browser permission. Missing support, denial, timeout and invalid coordinates remain recoverable; trending does not depend on location. Coordinates remain in component memory and can be cleared, without changing stored settings or assuming a city. Nearby sends only real validated coordinates and labels its backend-default radius.

The existing map area's responsive dimensions and position remain, with an explicit unavailable-map panel. Static San Francisco artwork and percentage pins cannot geographically locate real trucks, so they are not used as a real map. No new map/geocoding provider, inferred address coordinates, driving routes, travel time or directions are introduced. A provider/address-input product decision is still required. Browser location permission behavior and manual map-area review remain unverified.

## 8. Loading, errors and empty states

Discovery has initial skeletons, background-refresh status, empty matches, missing-coordinate feedback, network/server error recovery and retry. Cached data can remain visible during temporary discovery/profile refresh failure; denied/missing profile responses hide cached details. Profile loading/unavailability, missing images, empty menu/gallery/reviews/promotions and review pagination errors are explicit. The combined list has loading/error/empty presentation and retry. Social buttons disable while pending and use the established sanitized AppError/Sonner handling on failure. No raw 5xx details or production data are logged.

## 9. Automated validation

The existing runner was checked: production SSR transformation and Node assertions only, with server creation and unmocked network prohibited. Tests use backend-shaped fixtures and mocked test HTTP. The existing member-profile regression now seeds real profile cache data instead of expecting the removed sample food-truck path; personal profile and guard assertions remain.

- Complete `npm.cmd test`: **389 passed, 0 failed, 0 skipped** (40 new T05 tests plus all 349 earlier regressions).
- Focused discovery/member-profile run during implementation: **46 passed** before the final additional absence-state case; all 47 focused cases are included in the complete passing run.
- `npm.cmd run typecheck`: passed during implementation. Final `npm.cmd run build`: passed, including TypeScript project checking and production Vite build.
- `npm.cmd run lint`: passed with no errors or warnings after correcting test-only Node global imports.
- All 19 T05 files pass changed-file Prettier checks; local report links/manifest and `git diff --check` pass.

The build/test bundler emitted nonblocking timing/dynamic-import notices. Initial focused testing identified that established session middleware aborts old mutations with AbortError; the race test now verifies that safe outcome and empty replacement-session cache. No checks or rules were disabled.

Coverage includes exact endpoint methods/paths/headers/params and envelopes; cuisine/search mapping; valid zero and invalid/missing coordinates; null/zero rating/distance and miles conversion; UUID versus slug; Decimal/menu/gallery/review/promotion mapping; complete/empty/error resources; explicit retry; denied roles and unverified identity; social save/remove/follow/unfollow responses; failed actions; duplicate/opposite requests; new session during pending response; cache invalidation; shared confirmation and unknown relationship state; logout cleanup; and existing refresh retry behavior.

No production API calls or backend runtime/build/test commands were executed. Browser, geolocation-dialog, focus, screen-reader and responsive visual checks were not executed under AGENTS.md sections 12–13. Static rendering is not browser or production certification. Live non-production/CORS/provider checks and user-managed manual UI review remain release checks.

## 10. Remaining blockers and T05 acceptance

**Supported read/mutation integration is implemented; full T05 acceptance is not satisfied.**

- C01/C02: real discovery/search/single-cuisine/rating/nearby radius and bounded larger-set loading are connected. True trending pagination remains blocked by the ignored offset; multi-cuisine server semantics would need a confirmed array/union contract.
- C04: real public profiles, menus, gallery, cursor reviews and promotion reads are connected; currency and redemption eligibility are not invented.
- C03/C05: real list and mutations are connected, but reliable initial/restored independent saved/follow state and a favorites-only list are blocked by the combined-list mapper defect and missing viewer flags.
- C08: real consented coordinates and nearby spatial data work at the API integration level. Geographic rendering/geocoding/directions remain blocked by the provider/product decision.
- Backend favorites also synthesizes a closing-time default and normalizes null ratings; this frontend omits the synthetic statusText/followedSince fields. Original nulls already flattened by that backend presenter cannot be recovered client-side.
- Manual/live verification is pending; the shared authentication/session/role/logout foundations and T01–T04 regressions are preserved.

Work stops at T05. No T06 or later APIs, backend changes, dependency installation, environment edits or production calls were made.
