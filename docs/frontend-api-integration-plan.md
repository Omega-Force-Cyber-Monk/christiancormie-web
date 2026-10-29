# Frontend API integration implementation plan

Audit date: 2026-10-27. This is a proposed roadmap, not implementation authorization. Preserve approved static UI, current working-tree changes, guards and shared foundations. No backend modifications or dependency installations are included. See [audit](frontend-audit.md), [verified contracts and feature IDs](frontend-backend-api-mapping.md), and [gaps](api-integration-gaps.md).

## Execution rules and reusable task contract

Each numbered task below is an independently reviewable change after its dependencies are met. Feature IDs cover the complete matrix; shared API hooks may serve multiple role-specific views. New filenames are proposals, not existing files. Existing component names/paths are indexed in the mapping. Do not create all proposed folders/modules speculatively.

Every task inherits these requirements, in addition to its specific contract below:

1. Preserve named page/component markup, responsive layout, modal lifecycle and form associations. Change data adapters and handlers first; obtain design approval for missing inputs or new workflows.
2. Use exact endpoint cards/DTO validators and backend service response selections. Define explicit request/response types separately from fixture/UI types; infer validated form types from feature schemas. Never send UI-only fields or File/blob URLs as JSON URLs.
3. Inject into existing `baseApi`. Keep headers/refresh in the shared base query. Use RTK Query data for server entities, local state for tabs/drafts/overlays and approved active-role state only where shared.
4. Queries need initial loading, background refresh with retained data, true empty, filtered no-results and contextual retry/error. Mutations need disabled/pending controls, duplicate-submit protection, success only after fulfillment, inline field/form errors and appropriate Sonner feedback. Preserve draft/dialog state on failure.
5. Preserve verified-session and role guards. Skip identity-dependent queries until identity is verified; backend ownership, account state and role failures remain authoritative. A 403 is not a reason to bypass guards or force logout.
6. Invalidate precise entity/list/aggregate tags after successful mutations; refetch affected views on reconnect where appropriate. Logout/session replacement must clear all identities' caches. Do not cache local optimistic success permanently when the server rejects it.
7. Add focused server-free regression cases for meaningful request/response adapters, failure/retry and state transitions using the existing runner. Mock network/provider behavior; no production requests, servers or browser automation. Run final build/lint, changed-file formatting and diff checks only during an authorized implementation task. User performs manual UI/keyboard/responsive review.

Suggested new tag names in this plan are frontend cache identifiers, not invented API concepts. Add them to `src/services/api/baseApi.ts` only as consumers are implemented. Initially prefer targeted invalidation over complicated optimistic cross-cache updates. No new state manager, API client, test framework or broad generic repository layer is necessary.

## Dependency order

`T00 → T01/T02/T03 → T04–T09 → T10–T17 → T18–T21`. Read-only streams can proceed once their actual prerequisites pass; financial mutations require T14 regardless of UI readiness. T22 is blocked by product/backend decisions and must not be silently filled with fake implementations.

| Phase                                 | Tasks   | Exit condition                                                                                                                      |
| ------------------------------------- | ------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| 0: contracts/access                   | T00–T03 | Vendor multi-role access, role-specific registration, revocation and existing live contract defects understood/resolved.            |
| 1: reliable reads and identity        | T04–T09 | Existing admin screens show actual fields; customer/vendor identity, discovery, social and messaging reads use confirmed contracts. |
| 2: profile/social/community mutations | T10–T13 | Real upload/publish/profile/settings/community/staff operations have correct payloads, ownership handling and cache updates.        |
| 3: booking/financial lifecycle        | T14–T17 | Quote/payment/tracking/completion/issue flows use server financial/state rules; drops support only confirmed transitions.           |
| 4: realtime/admin completion          | T18–T21 | Socket lifecycle, notifications and supported admin actions/rows behave coherently across caches.                                   |
| 5: unresolved requirements            | T22     | Product/backend decisions supply missing contracts and approved UI; otherwise previews remain explicit.                             |

## T00 — Confirm integration decisions and snapshot contracts

**Coverage/dependencies:** all groups; before implementation. Confirm design approval and obtain explicit request to integrate. Resolve active-role selection semantics, missing registration/verification inputs, profile entity URL identity, coordinates/timezone input, monetary representation and unsupported actions listed under U01–U18.

**Files/preservation:** review current `src/config/env.ts`, `.env.example`, `src/services/api/{baseApi,baseQuery,authBaseQuery}.ts`, route constants/metadata and owning schemas. Preserve the active `.env`, existing shells and current user work. The configured API prefix is already `/api/v1`; do not claim the fallback `/api` has a Vite proxy.

**Contract/types/hooks:** endpoint and DTO catalogue in the mapping is the baseline. Establish separate HTTP DTO/UI adapters; preserve current API injection and standard query serialization. No hook required merely to snapshot contracts. Confirm raw Decimal serialization with backend source/test fixtures before financial adapters.

**States/auth/cache:** retain existing foundations. Decide field/error presentation for Nest message arrays. No network calls or cache changes in a contract-only task.

**Acceptance:** every blocked requirement has an explicit decision or remains blocked; no fabricated endpoint, role precedence, geocode, payment method, support ticket or task model. Use local contract fixtures for later tests, not copied production data.

## T01 — Repair authentication/registration/active-role access

**Coverage:** A01–A04, prerequisite for all authenticated features. Preserve LoginForm/SignupForm, FormField/Button and SessionGate/Bootstrap.

**Files:** modify `features/auth/api/auth.api.ts`, `types/auth.types.ts`, `schemas/{signup,session,current-user}.schema.ts` only as needed, `utils/authAdapters.ts`, `store/auth.slice.ts`/selectors and role-home/guard consumers if approved role selection requires it. Add feature-local verification form/page only after UI approval; route/constants/metadata must change together. Do not weaken verified identity.

**Contracts/types/hooks:** keep `POST /auth/login`, `POST /auth/refresh`, `GET /users/me`. Replace `/auth/create-user` with explicit registerCustomer/registerVendor mutations and DTO types. Add verifyEmail/resendVerificationCode hooks. Customer body requires name/email/password/dateOfBirth, optional referralCode; vendor requires email/phone/password with optional vendor fields. PendingVerificationResponse is `{success,status,message,email}`; successful verification/login returns accessToken/refreshToken/user (no explicit expiry in current service).

**Validation/payload:** remove hidden N/A payload fields; do not submit confirmPassword. Add missing birthday and role-specific inputs; enforce DTO lengths/phone/password validation. Code length six; no guessed token expiry. Backend vendor registration/login yields CUSTOMER + VENDOR: retain verified roles and choose an approved active role rather than throwing or selecting arbitrary precedence.

**State/auth/cache:** preserve single-flight refresh and stale session guards; verification establishes tokens only after actual fulfillment; bootstrap verifies `/users/me`. Correct public-auth bypass allowlist when adding public mutations so their 401s cannot trigger irrelevant refresh. Register/verify/resend failures remain in-form. Reset old cache only when replacing session; invalidate CurrentUser after approved profile/role changes.

**Acceptance/tests:** customer login works; normal vendor dual-role response reaches approved role choice/home; zero/unknown roles fail safely; persisted roles never authorize; pending signup cannot enter a protected route; resend/expired/wrong code/duplicate email are recoverable; temporary bootstrap failure retains credentials. Extend existing auth/session/route server-free regressions, including logout/new login while bootstrap/refresh is pending.

## T02 — Complete logout and error compatibility

**Coverage:** A05 and G11; after T01. Preserve all logout controls and existing cleanup.

**Files:** `auth.api.ts` or auth-owned logout thunk, `auth.middleware.ts`, logout consumers in DashboardLayout, DiscoverLayout, VendorHomeLayout and VendorSettingsPage; `utils/errors/normalizeApiError.ts` plus relevant errors tests. Reuse clearSession/cache/socket cleanup.

**Contract/types/hooks:** `POST /auth/logout` with snapshot `{refreshToken}` and current Bearer JWT, success `{success:true}`. A coordinated action can invoke an injected logout mutation and always clear the same local session; use current conventions without a second HTTP client.

**Validation/state/auth/cache:** capture session identity before awaiting revocation; prevent completion from clearing a new login. Local cleanup must succeed when offline or refresh is invalid. Normalize safe Nest string-array validation messages into form-level errors; only assign field names from reliable structured evidence. Keep 500 internals hidden. No optimistic delivery claims.

**Acceptance/tests:** revoke once, clean storage/API/socket, no stale protected render; network failure still signs out locally; concurrent new login survives stale logout completion. Validation array remains readable without inventing field mappings; existing string/structured errors still work.

## T03 — Fix already-live admin response adapters

**Coverage:** D02/D04/D06–D09; G04–G09. Can be split into one PR per page. Requires T01 for runtime access, but source adapters can be tested independently.

**Files:** existing `features/admin/api/admin.api.ts`, `types/admin.types.ts`, pages AdminUsers/Bookings/Vendors/Community/ReviewsModeration, existing detail components; add `features/admin/utils/adminAdapters.ts` only for meaningful repeated adapter logic, or keep separate domain adapters nearby.

**Contracts/types/hooks:** reuse current `GET /admin/{users,bookings,vendors,community,reviews}-management` hooks. Add getTruckRequests (`GET /admin/vendors/truck-requests`) and entity detail hooks only where needed. Type actual outer fields/presenters; map `userId` display ID, activity.totalBookings, loyaltyPoints, top-level canSuspend/canRetrieve; vendor.cuisine and returned detail data; booking amount/paymentModel/pricingModel, event.startsAt/address and nullable payment.commission; isReported and postId/reviewId display IDs. Retain backend UUID separately from display number.

**Query/state/auth/cache:** use supported search/status/category/sort/limit/offset, `useDebounce` and existing URL helper. Reset offsets on filter/page-size changes. Do not invent filtered totals from global summaries. Choose next/previous paging or obtain total metadata contract where total pages cannot be computed. Expand loading/error/no-results states without discarding stale good data. Preserve AdminUsers confirmations and its real suspend/retrieve mutations. Existing tags stay; truck-request mutation invalidates both request list and relevant vendor aggregate.

**Acceptance/tests:** fixtures shaped exactly like current backend presenters render correct names/amounts/report flags; null payment does not crash; searching a row outside first 20 works through server query; completed/rejected statuses retain meaning; vendor documents/details are no longer overwritten with N/A; dedicated requests populate and communicated action persists after refetch. Source hardcoded BOOKING review source remains a documented backend limitation, not inferred CHECK_IN data.

## T04 — Resolve vendor/truck identity and home reads

**Coverage:** V01–V04/V02 identity prerequisite; preserve VendorHomeLayout, VendorDashboardPage, update form and QR drawer.

**Files:** add `features/vendor/api/vendor.api.ts`, `types/vendor.types.ts`, pure `utils/vendorAdapters.ts` as needed; modify VendorHomeLayout/VendorDashboardPage/VendorQrDrawer and home data consumers. Add `Vendor`/`FoodTruck`/`VendorAnalytics` cache tags when used.

**Contracts/hooks:** getVendorMe `/vendors/me`, getMyTrucks `/food-trucks/mine`, getVendorAnalytics `/vendors/me/analytics`, getRequestCounts `/bookings/vendor/requests/counts`, getVendorQr `/vendors/me/qr-code`; request type void/query DTO as applicable. Responses include dashboardAccess/verificationBadge/verificationRequirements; analytics aggregate/recentBookings/paymentSummary/topTrucks; QR vendorId/foodTruckId/qrCode/qrCodeUrl/downloadUrl/shareMessage.

**Mapping/states/auth/cache:** retain server IDs; do not derive real identity from fixture account labels. Render onboarding-required and empty-truck states intentionally; pending optional badge does not block dashboard access. Analytics and QR owner restrictions/availability errors remain contextual. Download/share only actual returned QR; missing downloadUrl is unavailable, not sample QR. Post update mutation shares social contract T07; keep unavailable until ready. No arbitrary recent-activity endpoint inferred.

**Acceptance:** supported vendor states work after approved active-role selection; rejected/suspended state cannot be hidden by fixture data; missing QR/truck produces actionable state; home amounts/charts come from server response. Profile/truck writes later invalidate identity/home analytics as needed.

## T05 — Discovery, truck profile, favorites and map data

**Coverage:** C01-C05/C08. Depends on T01 and location decision; favorites mutate only after verified identity. Preserve discovery cards/filter drawer/profile views, artwork and existing menus/gallery/reviews.

**Files:** add customer-owned `api/discovery.api.ts`, `types/discovery.types.ts`, `utils/discoveryAdapters.ts`; update CustomerDiscoverPage, DiscoverProfileView, CustomerProfilePage/ProfileSummary/ProfileTabs, existing filters. Do not promote APIs into shared infrastructure unless actual unrelated-role reuse requires it.

**Contracts/hooks:** nearby/trending/cuisines, public truck profile/reviews, promotions list, favorite/unfavorite/getFavorites, follow/unfollow/follow-notifications exactly as matrix. DTO types mirror discovery coordinates/filters and cursor reviews; result `{meta,foodTrucks}` maps separately from raw public profile and favorites `{items,totalCount,openCount,closedCount}`.

**Mapping/state:** imageUrl/name/slug/isFeatured/rating/operatingStatus, km-to-display-distance, nullable rating, cuisine UUIDs. Fetch promotions for offer detail; nearby is not approved personalization. Replace demonstration state selector with real query states once integrated. Maintain accessible filter/search/reset interactions, debounce supported server search, reset page/cursor on filters. Map marker coordinates need approved map/provider handling; static percentage pins cannot display real geographic position accurately.

**Auth/cache/acceptance:** public APIs can be called behind existing customer guard without making pages public. Use Truck/Profile/Discovery/Favorites/Follow tags; invalidate favorites in discovery and follows in feed/profile. Test missing coordinates, zero/null rating, no results vs empty dataset, km conversion and distinct slug/UUID. Directions remain explicit unavailable until U12 resolved; no fake map positioning or offer badge.

## T06 — Member profile, rankings and rewards reads

**Coverage:** C22–C25/V26/V21. Preserve CustomerMemberProfilePage, gallery/rankings and VendorLeaderboardPage tabs; depends on T01/T04 identity.

**Files:** add customer-owned social profile/leaderboard/rewards endpoint modules as needed, feature-local DTOs/adapters; consume shared injected endpoint definitions from vendor pages through an explicitly reusable API boundary, avoiding private UI imports. Update member/profile/gallery and leaderboard data consumers.

**Contracts/hooks:** social profiles/posts/tagged/follower/following, follow/unfollow/block; leaderboard top-rated/most-booked/foodie-points; rewards profile-summary/rules. Truck rankings return entries; points returns items/total/limit/offset/nextOffset. Profile summary returns profile/loyalty/tiers/pointsPerAction/recentActivity/actions, not fixture constants.

**Mapping/state/auth/cache:** resolve me from verified identity; member UUID vs truck slug must be explicit. Map cursors/offsets per endpoint; server timestamp/rank/previousRank semantics preserved. Follow actions invalidate profile/follow lists/feed; block invalidates visible profile/feed/conversations as appropriate. Rewards read data remains separate from mutations T12. Render missing leaderboard 404 as unavailable, not invented zero rank. No assumption rankings refresh live.

**Acceptance/tests:** own/member/truck links resolve correct entity types, no fixture-ID routing, empty gallery works, following and counts update, points/ranking paging works, server tiers replace static progress. Unknown/blocked member returns contextual error; no admin award endpoint in customer code.

## T07 — Social feeds, post publishing and media

**Coverage:** C09–C13/V03/V05; preserve customer/vendor cards, comments dialogs/forms, create-post picker/preview and update composer. Depends on T01/T04 and T06 user identity/tag list.

**Files:** add social API request/response types, adapters and upload hooks in the appropriate proven shared domain boundary; update CustomerFeedPage, CustomerCreatePostPage, FeedPostCard/Comments/Share, VendorFeedPage/Composer/Comments and home update handler. Keep fixture files for isolated preview/test data only.

**Contracts/hooks:** following/explore, createPost, uploadPostMedia, listPlaces, following-list tag candidates, likePost/getComments/comment/likeComment/share. Include existing post detail/update/delete/save only for actual corresponding UI, not speculative controls. DTOs: content/media/locationId/taggedUserIds/foodTruckId/status; media upload multipart files, up to ten image files, backend 10 MB per image; existing UI may retain stricter limits. Comment content/parentCommentId map from comment/reply draft.

**Sequence/state:** select and locally preview → upload files → create post with remote metadata → invalidate/refetch feed/profile. Failure retains draft; do not re-upload fulfilled files blindly on retry. Text-or-media requirement must hold after uploads. Cursor cache resets on audience/filter/session changes. Like/comment actions reflect server toggle result and count, not local increment assumptions. Share UI needs a frontend permalink decision because API shareUrl is API-relative; clipboard success is not publishing/delivery.

**Auth/cache/acceptance:** vendor post identity must match authorized truck; handle onboarding/blocked relations and 400/403/409/503. SocialPosts/Feed/PostComments/Profile/Follows tags with entity IDs and list tags. Test parent reply mapping, null avatars, upload rejection/partial failure, stale tab response, duplicate submit, comment tree response and reconnect invalidation. Preserve image preview cleanup and keyboard dialogs.

## T08 — Messaging reads and text mutations

**Coverage:** M01/M02/C07 and order contact entry points. Depends on T01 and actual recipient IDs; before T18 realtime. Preserve both role conversation lists/thread/composer designs.

**Files:** add feature-owned messaging API/types/adapters at an actual shared domain boundary; update CustomerMessagePage, VendorMessagesPage, their list/thread/composer components and profile/order chat entry points. Keep draft state by conversation ID, not copied server message arrays.

**Contracts/hooks:** conversations/requests/recipients/direct/detail/messages/accept/decline/read/send as matrix. Direct body must select exactly one participantUserId/vendorId/foodTruckId; list DTO limit/offset; text body `{messageType:'TEXT',content}` max 5000; responses `{items,total,nextOffset}`, `{message,conversation}`, `{message,item}`, `{conversationId,status}` according to operation. Present message maps id/sender/content/createdAt, not fixture time strings.

**State/auth/cache:** create/get real conversation → history → send → reconcile returned message ID → markRead only for visible conversation. Handle REQUESTED/DECLINED/closed states and membership errors; admin is not automatically a participant. Conversation list/detail/message tags invalidate together after send/accept/read. Cross-conversation draft switching does not leak text or stale responses.

**Acceptance:** send failure retains unsent text; duplicate submit blocked; no local "delivered" claim; pagination and unread counts correct; switching threads preserves draft and isolates responses; blocked recipient/self-chat errors handled. Attachments stay disabled/explained until U06, and clear-history stays local-only until U07.

## T09 — Existing admin dashboard and row-tab reads

**Coverage:** D01/D10/D11. Depends on T03 response model cleanup; preserve existing summaries/tabs/layout.

**Files:** AdminDashboardPage, AdminPaymentsPage, AdminRewardsPage, `admin.types.ts`, existing admin components and new feature-specific row sections only where substantial.

**Contracts/types/hooks:** keep current dashboard/payments-management/rewards-management queries. Replace unknown row arrays with source-backed DTOs for payoutRequests/transactions/paymentMethods/revenueOverview and leaderboard/redeemTransactions/topUsers. The response catalogue includes exact presenters. Retain server schemaGaps as unavailable explanations rather than inventing tax or bank metadata.

**Mapping/state/auth/cache:** render actual selected-tab arrays and chart data; EmptyState only when supported data is empty; unimplemented views must say unavailable. Keep background refresh/error retry and currency formatting. Reuse existing tags. No mutations in this read-only slice.

**Acceptance:** a nonempty payload never renders false empty; null financial values do not turn into zero; top-user row list is not replaced by tier count cards; dashboard error preserves a clear failure state. Focused response adapter tests, no additional framework.

## T10 — Profile, preferences, password and truck lead submission

**Coverage:** C26/C27/C31/C33/V18-V22. Split customer settings, vendor profile and menus into separate reviewable changes. Depends on T01/T04/T05, plus U04/capacity/handle semantics decisions.

**Files:** customer SettingsProfileEditor/Panel/PasswordForm/RequestForm, CustomerSettingsPage, member editor and schemas; vendor profile page/editor/photo/menu dialogs and schemas; endpoint modules/types/adapters already introduced. Keep scoped styling and RHF forms.

**Contracts/hooks:** users profile/avatar; optional settings/notification-preferences only after approved new toggle UI; change-password; new-food-truck-leads; DELETE users/me; truck profile-settings/cuisines; onboarding image upload then gallery metadata CRUD; menu setup/category/item create/update. Exact DTOs in mapping; deletion and menu delete limitations remain in gaps.

**Mapping/sequence:** displayName/email/phone only for user profile; do not send bio or split-name writes. Multipart avatar file then use returned profile avatar, no generic profile URL field. Password confirmPassword → confirmNewPassword, strength/different-password checks. Lead truckName/location → DTO truckName/usualLocation and optional fields. Truck handle/motto/address/hours/cuisines/capacity map to actual consolidated DTO; require approved range-to-number rule, no guessed max. Menu IDs derive from fetched hierarchy; price strings converted carefully to major-unit numeric DTOs. Photo File upload completes before metadata save.

**States/auth/cache:** independent save pending/error per form, local preview cleanup retained; profile edits invalidate CurrentUser/Profile; menu/gallery edits invalidate Truck/Profile/Discovery where relevant; notification/settings updates invalidate CurrentUser/settings. Account deletion requires confirmation, fulfilled delete then same-session cleanup, and handles vendor-account rejection without pretending success. Menu unavailable toggle can PATCH only after approved semantics; no fake remote deletion.

**Acceptance/tests:** unknown fields never sent; password validation matches backend; upload failure leaves editor recoverable; ID/category/amount mappings correct; no duplicate saves/deletes; nullable contact fields handled; real account removal is not simulated. Manual review checks modal focus and mobile form overflow.

## T11 — Community list, composer and moderation by the user

**Coverage:** C14–C18/V09/V12–V13 except financial offers. Depends on T01/T04 and location/upload decisions; preserve current community/request cards, composer, category picker and report dialog.

**Files:** add community API/types/adapters, update CustomerCommunityPage/CommunityComposer/Interested/Report, VendorCreatePostPage forms and VendorOrdersPage own/community sections; update feature schemas/URL adapters.

**Contracts/hooks:** community posts list/mine/detail/create/update/delete/upload; comments/reactions/report/ignore/restore; interests list/send/withdraw. Use allowedActions/viewer/counts returned by present(), plus role/state checks; do not derive permission from a sample button alone. List `{message,items,pagination:{total,limit,offset,nextOffset}}`; create `{message,post,rewardStatus,...}` and update `{message,post}`.

**Mapping/state:** category UI labels → DTO enums; body → description/title as required; date/time/timezone/coordinates/guest count/budget ranges/menu choices and conditional category fields mapped explicitly. Upload media first with files field, maximum five, per-file limits/MIME from backend source. Keep cancel/back draft behavior and distinguish moderation/conflict from network error. Organizer invite/decline-interest remains blocked U15; customer cannot call vendor-only interest/quote action.

**Auth/cache/acceptance:** ownership and closed/expired/linked-booking conflicts handled; remove confirmation waits for server; report duplicate 409 is contextual; actions invalidate list/mine/detail/comments/interest caches. Test every category conditional payload, report enum, pagination reset, stale own-post edit, upload retry and 403/409 transitions. Reaction response/presenters drive counts. No generic support ticket substitution.

## T12 — Loyalty redemption and referrals

**Coverage:** C25/C30 are existing tier/points-guide/invitation reads. Redemption/bonus claims, referral apply and vendor confirmation are backend capabilities without current complete UI; the following mutation work is optional and requires explicit additional UI scope. Depends on T06 and real eligible rule/truck data; preserve current tier/activity/invite presentation, approve any missing redemption/code UI first.

**Files:** rewards/referral injected APIs and types, SettingsInvite, CustomerMemberProfilePage/CustomerSettingsPage and feature forms where approved.

**Contracts/hooks:** profile-summary/rules/redemption-codes/daily-streak/birthday-bonus; referrals codes GET/POST and apply. Requests use actual reward rule/foodTruckId/amount/code DTOs; response redemptionId/redemptionToken/backupCode/amount/fundingType/minimumPurchaseAmount/pointsSpent/expiresAt/status. Vendor confirmation exists at `/vendors/me/redemptions/confirm` but is a separate approved workflow, not customer auto-success.

**States/auth/cache:** only display server-awarded points; already-claimed result is not a new award. Codes expire; protect from duplicate submit and never log tokens. Referral apply may conflict/expire/reach usage limit. Clipboard link generation is local; backend code allocation/apply is remote. Invalidate Loyalty/ProfileSummary/Redemptions/ReferralCodes and affected analytics after real success.

**Acceptance:** insufficient points/expired code/already awarded are distinct; no fixed fixture credit exchange; server tier totals refresh after mutation; referral link and code semantics approved and tested; no admin award call from customer UI.

## T13 — Vendor staff management and staff entry

**Coverage:** V23 and prerequisites for S01/S02. Depends on T01/T04; preserve VendorStaffManagement and confirmation dialogs.

**Files:** vendor settings API/types, VendorStaffManagement, settings.schema.ts; auth API/LoginForm or approved separate PIN form for staff login. Staff dashboard/tasks pages remain unchanged until actual scope is approved.

**Contracts/hooks:** GET/POST vendors/me/staff, POST staff/:staffId/reset-pin, DELETE staff/:staffId; POST auth/staff/login `{email,pin}`. Staff response `{id,email,pin,status,addedAt}` (list wraps items); create/reset add message; delete `{deleted,message}`. PIN must be caller-provided exactly four digits; existing email-only form is insufficient.

**States/auth/cache:** mask PIN display by default and do not log/store response credentials elsewhere. Create/reset/delete show pending and recoverable email/ownership/status errors; invalidate VendorStaff. Do not implement lock/unlock with delete or guessed account status API. Staff truck/bookings reads have actor fallbacks, but vendors/me and QR profile fail the owner-only lookup (G13); block that portion pending backend resolution. Owner analytics and vendor-only mutations remain forbidden.

**Acceptance:** PIN leading zeros retained; email normalization and duplicate errors correct; reset/create only claim email delivery from actual successful contract; stale delete cannot remove a replacement selection; owner and staff guard tests confirm allowed capabilities. No invented task assignments.

## T14 — Financial contract and payment prerequisites

**Coverage:** C06/C19–C21/V11/V15/V17 and all payout/completion dependencies. Depends on T00/T01/T04/T10. Explicitly approve missing checkout/Connect UI; no dependency install assumed.

**Files:** existing request quote state/schema and RequestQuoteForm, CommunityOffersView/Booking dialogs, earnings adapters; add feature-owned payment API/types/adapters. Reuse shared errors/modal/confirmation. Keep payment provider details out of generic UI except where required to complete payment.

**Contracts/hooks:** Connect account creation/status/dashboard-link, vendor summary/history; booking payment-intent `{idempotencyKey,currency?}` → `{payment,clientSecret}`; GET payment status; quote accept `{paymentWindowMinutes?}` (5–120) and server quote-financials calculations. Webhooks are backend-to-provider, never frontend mutations.

**Mapping/state:** frontend illustrative 15% differs from backend environment-driven commission (source default 10%); use returned canonical breakdown, not either hardcoded value as a promise. Major units/currency vs fixture cents must be explicit. Per-person pricing uses pricePerPerson × guest count. Deposit terms/method and server balanceDueAtEvent drive display. Idempotency key persists for one logical payment attempt, not a new key on every retry.

**Auth/cache/acceptance:** no success on payment-intent creation; require confirmed server payment status after approved provider confirmation. Do not expose clientSecret in logs/storage. Retry/unknown outcome refetches status before another charge. Connect onboarding is hosted; four-digit bank-label preview cannot become real bank management. Tests cover rounding, minimum deposit, full/deposit outcomes, duplicate requests, 409/expired hold, Stripe unavailable and network-after-submit uncertainty. No live charge or production call in automated checks.

## T15 — Customer booking, offers, tracking/completion/issues

**Coverage:** C06/C19–C21/C34 (only if placeholder scope approved). Depends on T05/T11/T14; preserve booking wizard, offers/tracking/issue dialogs.

**Files:** customer booking API/types/payload adapters, DiscoverBookingFlow/schema, CommunityOffersView/TrackView/BookingDialogs and CustomerCommunityPage; CustomerOrdersPage only after approved history UI.

**Contracts/hooks/sequence:** direct `POST /bookings` uses real foodTruckId, confirmations and event inputs; list mine/detail. Or community offer accept returns offer + booking (do not create duplicate). Vendor sends quote → customer `PATCH /bookings/quotes/:quoteId/accept` → payment-intent/provider confirmation → GET status/tracking → vendor requests completion → customer approves or reports issue. Issues/list/replies use actual bookingId/issueId, not fixture conversation labels.

**Validation/state/cache:** date/time converted with explicit eventTimezone or paired ISO range; real coordinates/contactPhone/guestCount; select actual menu IDs and separate customMenuItems. Budget range/payment none need explicit DTO semantics. Pending quote/payment/expired hold/issue conflict each get distinct UI. Only server completion releases money; approval must remain pending/error-aware. Invalidate Bookings/BookingDetail/Tracking/Issues/Payments/Summary after transitions, not just local timeline.

**Acceptance:** wizard submits one valid booking and retains draft on failure; quote acceptance does not falsely mark paid; conflicting capacity/time/radius rejects at correct UI; issues block/affect completion as server reports; fulfilled completion refetches financial status. Test timezone/DST, no menu, invalid coordinates, 409 booking conflict, expired quote and stale selection. UI manual review preserves five-step navigation and keyboard focus.

## T16 — Vendor requests, quotes, order status and financial reads

**Coverage:** V10–V16 and contact flows. Depends on T08/T11/T14/T15; preserve RequestQuoteForm/OrderDetails/cards and earnings/analytics layout.

**Files:** vendor booking/community/payment endpoint consumers, VendorOrdersPage, request-state adapters, RequestQuoteForm, VendorEarningsPage/Overview/Analytics/CreditDetails. Keep only draft/overlay state local when replacing fixture arrays.

**Contracts/hooks:** vendor bookings/counts/detail/tracking; accept/reject; quote create; community interest/offer/withdraw; request-completion; vendor financial summary/transactions/detail/refunds/payouts; credits analytics/settings. Distinguish booking quote and community offer payloads. Source response schemas already indexed in mapping.

**Mapping/state:** flat/person enum, selectedMenuItems, extraCharges labels/amounts, tax/discount/deposit/expiresAt; consume returned quote breakdown. Save draft remains local until a remote draft contract exists. UI earnings cents/chart values adapt from actual response fields/currency/count. Credit acceptance PATCH uses its actual DTO enabled key and returned creditAcceptance object, never local toggle alone.

**Auth/cache/acceptance:** list filters/status/pagination use actual DTO; pending actions prevent duplicates and conflicts refetch authoritative state. Bookings/Offers/RequestCounts/Payments/VendorAnalytics/CreditAnalytics invalidate coherently. Tests cover already accepted/rejected/expired requests, unsupported staff writes, quote money mapping, request-completion paid-window constraints, toggle rollback and transaction pagination. Calling/route guidance remains a supported contact link or explicit unavailable state, not a simulated call.

## T17 — Drops and promotion operations

**Coverage:** V06–V08. Depends on T04/T10 and U08/U09 decisions; preserve DropsMap/duration/promo dialogs and confirmations.

**Files:** vendor drop/promotion endpoint modules/types/adapters, VendorDropsPage, DropDurationDialog/Picker, DropPromoDialog and drops schema/reducer. Reducer keeps only draft/overlay state once queries own entities.

**Contracts/hooks:** truck operating-status/location, create drop with latitude/longitude/title/message/address/durationMinutes; promotion list/create/update. Promotion requires foodTruckId/type/value/start/end and other DTO fields, not just preview name/message. No confirmed stop-drop or delete-promo endpoint.

**State/auth/cache:** obtain location before mutation; hours/minutes → 1–1440 total minutes. Handle location permission denial and provider errors. Do not claim promos are attached through drop DTO (no promo IDs). Until contracts change, end-drop/delete controls must communicate unavailable or an explicitly approved alternate meaning. Invalidate truck/drop/discovery/promotions/analytics after successful writes; cross-screen availability updates.

**Acceptance:** failed go-live does not show live; valid duration/location maps exactly; incompatible promo fields are not invented; closed/disabled UI reflects actual result. Test boundaries, denied location, concurrent update and server eligibility rejection. No backend broadcast/notification success is inferred solely from frontend state.

## T18 — Central messaging socket lifecycle

**Coverage:** M04, after reliable HTTP T08. Reuse `services/socket/{socket,useSocket,socket.types}.ts`; do not introduce raw io() calls in pages.

**Contracts/types/hooks:** namespace `/messaging`, auth.token, conversation join/leave, message send/read acknowledgments and message:new/conversation:read events in mapping. HTTP remains authoritative list/history; pick one transport per send. Add typed event payloads from service presenters.

**Changes/state/auth/cache:** one owned connection; update auth on refresh/session changes; prevent duplicate connecting sockets; unsubscribe from captured socket instance; leave selected room on switch/unmount; join after membership validated; rejoin/refetch after reconnect. Deduplicate by server message ID, merge receipt timestamps conservatively, and update/invalidate RTK Query message/conversation caches. Existing logout disconnect stays.

**Acceptance/tests:** fake socket tests for token rotation, connecting/unmount/reconnect/room switches, duplicate HTTP/event order, lost events/refetch, failed membership and session replacement. No stale-account message appears after logout. No typing/presence status without an actual backend contract. Manual realtime testing is user-managed in an approved nonproduction environment.

## T19 — Notification UI

**Coverage:** N01, after T01 and entity URL conventions. Preserve existing navbar icons/dropdowns and customer/vendor shell triggers.

**Files:** owning notification API/types/adapters and existing `DashboardLayout/TopNavbar/NavbarActions.tsx`, DiscoverLayout and VendorHomeLayout. Avoid a new global state slice solely for unread count.

**Contracts/hooks:** notifications list, unread-count, one/read-all PATCH; DTO filters/pagination and backend notification-navigation metadata. Map returned targets to centralized frontend route helpers with validated IDs; do not navigate blindly to arbitrary backend strings.

**States/auth/cache:** unread badge derives from query, optimistic read only with rollback or fulfilled invalidation; loading/error/no-results distinct. Cache tags Notifications/UnreadCount shared by all shells and cleared on session change. No push token registration until browser permission/service-worker/provider flow is explicitly approved.

**Acceptance:** read/unread synchronizes across menus, unknown target shows safe fallback, no forged role route bypass, read failure recoverable. Tests cover missing IDs and mismatched backend mobile navigation metadata.

## T20 — Admin issue resolution and supported financial actions

**Coverage:** D05 and D10 operational actions if UI approved. Depends on T03/T09/T14–T16. Preserve existing details/message modal structure; remove hardcoded issue resolved claim when wiring.

**Files:** `admin.api.ts`/types, AdminBookingsPage and BookingMessageModal; payment row sections. Existing approvePayout endpoint is reusable once actually consumed.

**Contracts/hooks:** booking issues/list/messages plus `PATCH /admin/bookings/:bookingId/issues/:issueId/resolve` with ResolveBookingIssueDto; payout approve PATCH and retry POST. Source action availability must drive buttons. Reject/hold deprecated endpoints intentionally fail 400 and must not be offered as supported operations.

**State/auth/cache:** preserve booking UUID/issue UUID separate from display ID; ordinary conversation ID is not issue identity. Mutation pending/confirmation/inline error must prevent duplicate resolution/payment retries. Resolve result includes decision/issue/booking/payment; refetch affected Bookings/Issues/Payments/Refunds/Payouts/Dashboard summaries. Review-report "disputes" in management output are not automatically BookingIssues.

**Acceptance:** no fabricated conversation/resolution state; admin authorized issue messages persist; resolved issue rejects further writes contextually; real financial result determines notification, not local append. Tests cover missing/mismatched issue IDs, stale selection, 400/403/404, refund/provider pending and double-clicks.

## T21 — Optional admin moderation/configuration workflows

**Coverage:** supported backend actions absent from D06/D08/D09/D11/D12 UI; new controls require explicit product/design scope. Depends on T03/T09. Preserve read-only pages until approved.

**Files:** extend admin API/types and existing page/detail components only where a concrete control is approved; no speculative new admin dashboard app or second component system.

**Contracts/hooks:** vendors approve/reject/suspend/retrieve, verification-document update, review hide/keep/remove/moderate/report resolve, community moderate/delete/comment delete, reward rules/points/badges, platform settings, markets/leaderboard rules/subscription configuration as selected from endpoint catalogue. Prefer admin review actions for admin UX (audit logging); do not mix duplicate moderation endpoints arbitrarily.

**Validation/state/auth/cache:** DTO-defined reason/status/decision keys and typed allowed platform settings. Destructive actions use existing confirmations; approval does not fake completed badge/payment state. Invalidate relevant AdminVendors/Reviews/Community/Rewards/Dashboard and shared affected domain reads. Unknown platform setting schemas remain blocked U18.

**Acceptance:** each approved control has one exact request, source-backed result, pending/retry, proper role checks and affected-cache test; no generic arbitrary JSON editor for sensitive config. Unselected backend capabilities remain documented, not auto-implemented.

## T22 — Explicitly blocked/product-dependent slices

**Coverage:** C18/C32/C34/V07/V08/V17/V20/V23–V25/V27/S01/S02/D12 and attachment parts of M03. U01–U18 enumerate precise gaps. Preserve existing labeled previews/placeholders.

General support tickets, task queues, commerce products/orders, vendor deletion, lock/unlock staff, durable chat deletion, generic document upload/multi-attachment semantics, immediate drop stop, menu delete, promo delete/linkage, bank-method CRUD/default, organizer invitation/decline and typed platform-setting forms need confirmed contracts or an approved alternate workflow. Role-specific onboarding, PIN login, verification and checkout also need missing UI approval. Do not create RTK endpoints/types/hooks for nonexistent contracts.

For each resolved gap, amend its mapping row with exact endpoint/DTO/response/auth/source, specify the owning existing component and cache dependencies, add matching input/error states and focused acceptance tests, then implement as its own authorized slice. A backend operation without UI is not permission to redesign; a database field without DTO support is not a confirmed input.

## Final acceptance and handoff for a future implementation phase

Each authorized slice should report modified files, preserved UI/components, exact live vs remaining preview paths, checks actually run, and remaining contracts. Verify error/loading/empty/no-results and keyboard behavior manually with the user-managed environment; do not start servers or browser automation. Use existing server-free regression runner only after inspecting changed execution paths. Run one final build (includes TS), lint, changed-file Prettier check and git diff --check when application code is actually changed. For this audit, only Markdown formatting/link/whitespace validation applies.
