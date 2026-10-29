# Sprint 3 — T11-A: Community reads integration

Date: 2026-10-29 (Asia/Dhaka). Scope: C14 and read-only prerequisites for C15–C18. T11-B, T11-C and T12 are not implemented.

## 1. References and source verification

Reviewed the relevant Community sections of the [frontend audit](frontend-audit.md), [API mapping](frontend-backend-api-mapping.md), [integration plan](frontend-api-integration-plan.md), [integration gaps](api-integration-gaps.md), [T10 report](sprint-3-t10-profile-settings-vendor-menu-integration.md), and the earlier [authentication](sprint-1-auth-integration.md), [logout/errors](sprint-1-logout-error-integration.md), [members](sprint-2-t06-member-rankings-rewards-integration.md) and [social feed](sprint-2-t07-social-feed-publishing-integration.md) reports.

Current backend sources override audit prose:

- [CommunityPostsController](../../christinacormie-backend/src/modules/community/community-posts.controller.ts): class JWT guard, exact three GET routes, mine tab override and detail envelope.
- [CommunityPostQueryDto](../../christinacormie-backend/src/modules/community/dto/community-post-query.dto.ts): category/tab, coordinate and limit/offset validation.
- [CommunityPostsService](../../christinacormie-backend/src/modules/community/community-posts.service.ts): list queries, presenter, viewer/actions/counts, pagination and responder eligibility.
- [CommunityService](../../christinacormie-backend/src/modules/community/community.service.ts): detail visibility and ownership checks.
- [CommunityRepository](../../christinacormie-backend/src/modules/community/community.repository.ts): existing/non-deleted request lookup, private target truck/vendor association. The new posts list service queries Prisma directly; it does not use the older open-requests list as the contract.
- [Community Prisma models](../../christinacormie-backend/prisma/schema/17-community.prisma): six categories, request statuses, nullable event/location/budget fields and media associations.

No backend commands, production calls or credentials were used. Existing working-tree changes were retained.

## 2. Exact T11-A files changed

```text
docs/sprint-3-t11a-community-reads-integration.md
src/features/community/api/community.api.ts
src/features/community/schemas/community.schema.ts
src/features/community/utils/community.test-fixtures.mjs
src/features/community/utils/communityAdapters.ts
src/features/community/utils/communityReads.test.mjs
src/features/customer/components/community/CommunityLocationView.tsx
src/features/customer/components/community/CommunityReadCard.tsx
src/features/customer/components/community/CommunityReadStates.tsx
src/features/customer/pages/CustomerCommunityPage.tsx
src/features/customer/utils/communityState.test.mjs
src/services/api/baseApi.ts
```

The shared baseApi change only adds CommunityList and CommunityPost tags. Existing feature APIs, auth middleware, role guards, route definitions, environment files, dependencies and stylesheets are unchanged by T11-A.

## 3. Verified GET contracts

The existing configured base URL supplies /api/v1. All requests reuse baseApi/authBaseQuery, bearer preparation, centralized refresh/retry and validated-query helpers.

| Endpoint                            | Query/request                                                         | Response used                                                                         |
| ----------------------------------- | --------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| GET /api/v1/community/posts         | Supported category, tab, latitude, longitude, radiusKm, limit, offset | {message, items, pagination:{total,limit,offset,nextOffset}}                          |
| GET /api/v1/community/posts/mine    | Same query DTO; controller overrides tab to MINE                      | Same list envelope; all own non-deleted categories, rather than request-only fixtures |
| GET /api/v1/community/posts/:postId | Actual selected UUID; no body                                         | {message,post}; post uses the same presenter as list, not a list envelope             |

These reads require JWT at controller level and do not have a separate CUSTOMER-only decorator. Customer UI additionally requires a verified active CUSTOMER session. The read API permits verified CUSTOMER/VENDOR contexts for later reuse; no Vendor Community page is connected.

Supported query bounds: limit 1–100 (default 20), offset 0–100000 (default 0), integer radiusKm 1–500. Latitude must be in -90..90 and longitude -180..180; both must be supplied together, and radius requires coordinates. No city, search or status filter exists.

All Posts includes non-deleted OPEN/MATCHED/CLOSED posts and excludes the viewer's ignored posts. Visibility is PUBLIC unless the user's owned truck IDs also permit targeted PRIVATE posts. MINE limits createdById to the authenticated account, includes own private/draft/other statuses, and does not apply geographic filtering.

REQUESTS is a supported backend tab but is not exposed by this Customer UI. It excludes the viewer's own posts, limits status to OPEN and unexpired posts, and permits only NEED_TRUCK/VENDOR_CALLOUT categories. Existing visibility restrictions still apply; there is no extra responder-role guard on this GET. Presenter canQuote/canSendInterest additionally depend on current vendor eligibility (APPROVED or PENDING_APPROVAL, not deleted), ownership, category, open/expiry and existing offer/interest state. These booleans are retained without implementing those actions.

Detail first checks visibility: missing/deleted posts return 404; non-owner DRAFT/CANCELLED posts return 404; an unrelated private target returns 403. Owners can read their own records. Current source does not introduce a distinct blocked-account/post read flag or endpoint; errors are handled as returned rather than inventing one.

## 4. List and presentation

CustomerCommunityPage now reads backend collections exclusively. The old fixture reducer, sample request collection, author images, sample city, simulated likes/comments and booking/payment workflows are disconnected from this page. Legacy preview modules and their isolated tests remain for later scoped work; they are not used to populate a failed read.

CommunityReadCard retains existing community-card/community-my-card classes, request/callout/social variants, author header, category pill, request detail grid, media presentation and engagement row. The existing page shell, breakpoints, artwork and shared Modal lifecycle are reused; no stylesheet or layout component was redesigned.

Post UUIDs remain actual identifiers. Reviewed presenter fields include title/description/category/status/visibility/createdAt, actual author ID/name/avatar, media, address/event date/guests/budget/attendance/spots, counts, viewer and allowedActions. Runtime schemas strip unreviewed raw fields. Nullable/missing author, media, location and counts stay unavailable. Zero counts remain zero. The backend's own author fallback, if returned, is accepted; no frontend fixture author is substituted.

Only safe credential-free HTTP(S) media URLs render. Multiple images are retained with the existing image viewer; video uses native controls and other media uses a remote attachment link. Failed image URLs use the established image-unavailable presentation. Event date uses its date component without timezone shifting. Decimal budgets retain their returned decimal text; the backend exposes no currency, so no currency is invented. Created timestamps are formatted from the actual timestamp, rather than sample relative ages.

## 5. Categories, tabs and filters

Explicit mappings cover all six verified categories:

| Existing UI label              | Backend enum   |
| ------------------------------ | -------------- |
| Community                      | COMMUNITY      |
| Need a truck                   | NEED_TRUCK     |
| Callout (card: Vendor callout) | VENDOR_CALLOUT |
| For sale                       | FOR_SALE       |
| Hiring / jobs                  | HIRING_JOBS    |
| Community help                 | COMMUNITY_HELP |

All omits category. All Posts uses /posts; My Posts uses /posts/mine. The previous My Requests label is now My Posts because the endpoint returns all own categories. Its old view=my-requests URL remains an alias. Category buttons retain their existing styling and work in both tabs; the two previously composer-only supported category labels are included.

Filters are sent to the server, never simulated over one loaded page. URL category labels are explicitly mapped; invalid labels resolve to All. Category/tab changes remount the session/filter-scoped workspace and begin at offset zero. Reset filters clears the category and pagination while retaining the selected All/My tab. Legacy city/search/coordinate/page parameters do not affect reads and are removed on filter/reset actions.

## 6. Pagination and recovery

Each list endpoint is an RTK Query infinite query. Page arrays and metadata stay in its server cache; local component state holds only selected IDs, modal/screen state and the currently viewed media URL.

- Initial limit is 20 and offset is 0.
- Load more uses returned nextOffset, not a guessed offset increment or page count.
- Duplicate UUIDs reconcile to the latest returned record without duplicate cards.
- Nonadvancing, out-of-range or empty last-page offsets stop further loading.
- total is the backend count for that query before limit/offset, not the loaded count or a universal platform total. The UI labels it as the matching count at last refresh.
- Unused pages expire on unsubscribe; tab/category/session identity changes restart paging. No remote entity collection is copied into an ordinary reducer.
- Temporary background/network/5xx errors retain valid pages and show retry. Failed reads never fall back to fixture posts.
- Definitive 403/404 list/detail errors hide previously cached content and show an unavailable/private/missing explanation.
- Initial loading, background refresh, empty list, no category matches, empty mine, retry and next-page loading/error states are explicit.

Offset pagination can move when concurrent server writes alter ordering; UUID reconciliation prevents duplicate display, but there is no invented snapshot/cursor guarantee. The DTO's maximum offset remains a backend pagination ceiling.

## 7. Detail and deferred controls

Card title and existing overflow control select the actual post UUID and open the existing Community drawer styling through shared Modal. A valid UUID hash can open the corresponding detail read. Detail uses its own GET, runtime schema and post-ID association check; list data is not mistaken for a full detail response.

Returned viewer and allowedActions are retained. Edit/delete/quote/interest controls are only shown in the detail action area when their respective booleans are true, and remain disabled for this read-only task. Existing reaction/comment/offer/interest controls remain visibly unavailable. Report/hide are likewise disabled without asserting permission. The create control opens an honest unavailable notice rather than a fake composer success. Existing photo enlargement and modal accessibility infrastructure remain.

No Community POST/PATCH/DELETE, comment-list GET, media upload, interest/offer/booking/payment request, new socket operation or clipboard/share workflow is added. Interactive browser/modal certification was not performed.

## 8. Geographic limitations

The existing city/radius/artwork-pin screen cannot supply verified latitude/longitude. It is preserved as an explicitly labeled design illustration with no selected marker; city/radius/apply/default controls are disabled for the integrated page. It does not assume a city, geocode text, persist fake defaults or convert pixel positions to coordinates.

All locations remains the honest default. The API validates the actual optional geographic contract for later approved use, but this UI sends no coordinates/radius. A valid coordinate source/provider and approved location UX remain blockers. The backend geographic query also includes posts with null geography, so it is not a strict guarantee that every returned row has a measured distance.

## 9. Authentication and cache

Query arguments include captured session ID, verified user ID and active role. Shared scopedRead checks the captured identity before and after awaited work; the existing verified-role membership selectors remain authoritative for frontend gating. New session/filter workspace keys clear local selected IDs and dialogs on identity/role replacement.

CommunityList and per-post CommunityPost tags permit future supported mutations to invalidate list/detail readers. Current account profile writes are not expanded into unrelated Community operations; focus/reconnect/manual refresh can update author presentation. Existing auth middleware resets shared RTK Query state on logout, role change and session replacement, and existing socket cleanup is unchanged. Late old-session responses cannot populate a replacement account's view.

## 10. Validation

The package scripts and existing server-free SSR/Node runner were inspected. HTTP is locally mocked with backend-shaped fixtures; no dev/preview server or browser automation was started.

| Check                                                  | Result                            |
| ------------------------------------------------------ | --------------------------------- |
| Standalone TypeScript during implementation            | Passed                            |
| Focused Community reads + legacy Community regressions | 36 passed, 0 failed               |
| Final production build (includes TypeScript)           | Passed; 3,183 modules transformed |
| Final ESLint                                           | Passed                            |
| Final full regression suite                            | 636 passed, 0 failed/skipped      |
| Changed-file Prettier                                  | Passed for all 12 task files      |
| Git diff whitespace check                              | Passed                            |
| Local report links                                     | All 15 resolve                    |

There are 27 new read-integration cases alongside the unchanged nine-case legacy suite (one presentation assertion was adapted to the real page). Coverage includes all three exact GETs and JWT headers; source envelopes/UUIDs/enums; All/My/category mapping; geographic/REQUESTS DTO restrictions; pagination/returned offsets/deduplication/last page; tab/category resets; nullable versus zero values; safe media and Decimal/date presentation; 400/403/404/5xx/network errors; cached-data recovery versus access denial; cache tags; logout/session/role replacement and delayed responses; real cached page presentation; loading/empty/retry and location blocker states.

Live API/database/CORS and manual browser/responsive/keyboard/focus behavior remain unverified. AGENTS.md sections 12–13 prohibit dev/preview servers and browser automation for this task; static rendering and source review do not certify interactive or pixel-level behavior.

## 11. Remaining blockers and acceptance

**Implemented:** the three Community GETs, real All/My Posts cards, six server-backed categories, list/detail schemas/adapters, actual pagination, loading/error/empty/retry states, session isolation and read cache tags.

**Blocked/unsupported:** city text/search/status filtering have no verified read contract; geographic UI lacks a coordinate source. No independent category/city/search endpoint or map provider was invented.

**Deferred by task scope:** post/media mutations (T11-B), comments/reactions/reports/ignore/interests and related actions (T11-C), booking/payment workflows and Vendor page connection. Existing sample workflows are retained in their isolated modules, not applied to real records.

**T11-A acceptance:** supported read functionality is implemented and covered by focused regressions; final validation results are recorded above. Geographic filtering remains explicitly unavailable, as permitted by the brief. Live/browser release verification remains outstanding. Work stops at T11-A.
