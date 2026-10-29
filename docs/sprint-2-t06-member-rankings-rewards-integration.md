# Sprint 2 — T06 member profiles, rankings and rewards integration

Date: 2026-10-28 (Asia/Dhaka). Scope: T06; C22–C25, V21 and V26. The nine required audit/sprint documents and current source were reviewed. Existing T01–T05 working-tree changes are preserved. Backend source, environment files, dependencies, authentication/session architecture, route guards, global styles and layout structures were not changed. Work stops at T06.

## 1. Exact files changed

Paths below are relative to `christinacormie-web`. This is the incremental T06 manifest; the full Git diff also includes previous sprint work.

New files:

- `src/services/api/validatedQuery.ts`
- `src/utils/files/remoteMedia.ts`
- `src/features/social/api/socialProfile.api.ts`
- `src/features/social/schemas/socialProfile.schema.ts`
- `src/features/social/components/MemberFollowButton.tsx`
- `src/features/social/components/MemberConnectionsDialog.tsx`
- `src/features/social/components/SocialPostsGallery.tsx`
- `src/features/social/utils/profileIdentity.ts`
- `src/features/social/utils/member.test-fixtures.mjs`
- `src/features/social/utils/memberIntegration.test.mjs`
- `src/features/leaderboards/api/leaderboards.api.ts`
- `src/features/leaderboards/utils/rankingAdapters.ts`
- `src/features/leaderboards/utils/useRankings.ts`
- `src/features/rewards/api/rewards.api.ts`
- `src/features/rewards/components/RewardsPanel.tsx`
- `src/features/rewards/utils/rewardProgress.ts`
- `src/features/rewards/utils/tierArtwork.ts`
- `docs/sprint-2-t06-member-rankings-rewards-integration.md` (this report)

Updated files:

- `src/services/api/baseApi.ts`
- `src/features/customer/api/discovery.api.ts`
- `src/features/customer/pages/CustomerMemberProfilePage.tsx`
- `src/features/customer/pages/CustomerProfilePage.tsx`
- `src/features/customer/pages/CustomerLeaderboardPage.tsx`
- `src/features/customer/pages/CustomerSettingsPage.tsx`
- `src/features/customer/components/discover/DiscoverLayout.tsx`
- `src/features/customer/components/profile/MemberProfileGallery.tsx`
- `src/features/customer/components/leaderboard/LeaderboardRankings.tsx`
- `src/features/customer/components/settings/SettingsMenu.tsx`
- `src/features/customer/data/leaderboard.test.mjs`
- `src/features/customer/utils/memberProfile.test.mjs`
- `src/features/vendor/pages/VendorLeaderboardPage.tsx`
- `src/features/vendor/pages/VendorProfilePage.tsx`
- `src/features/vendor/components/profile/VendorProfileContent.tsx`
- `src/features/vendor/utils/leaderboardState.test.mjs`
- `src/features/vendor/utils/profileState.test.mjs`

## 2. Endpoints and verified contracts

The configured base URL supplies `/api/v1`; injected definitions use relative paths. No fixture ID, invented body property, rank, point threshold or location is sent.

| Method and endpoint                                | Implemented request                                | Consumed response / authorization                                                                                       |
| -------------------------------------------------- | -------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| GET `/api/v1/social/profiles/:userId`              | Member UUID; no body/query                         | JWT; presented identity, bio/city/state, postCount/followerCount/followingCount and viewer-specific isFollowing         |
| GET `/api/v1/social/profiles/:userId/posts`        | UUID, limit=20, optional cursor                    | JWT; `{items,nextCursor}` with actual authored posts, author identity, content, media and timestamps                    |
| GET `/api/v1/social/profiles/:userId/tagged-posts` | UUID, limit=20, optional cursor                    | JWT; same envelope, filtered by taggedUserId                                                                            |
| GET `/api/v1/social/profiles/:userId/followers`    | UUID, limit=20, offset                             | JWT; `{items,total,limit,offset,nextOffset}` plus backend category counts not consumed                                  |
| GET `/api/v1/social/profiles/:userId/following`    | UUID, limit=20, offset                             | JWT; same envelope                                                                                                      |
| POST `/api/v1/social/profiles/:userId/follow`      | UUID, no body                                      | JWT; UserFollow record with id/followerUserId/followedUserId/createdAt                                                  |
| DELETE `/api/v1/social/profiles/:userId/follow`    | UUID, no body                                      | JWT; `{unfollowed:boolean}`                                                                                             |
| GET `/api/v1/leaderboards/top-rated`               | limit=20, offset; no assumed market or period      | Public; leaderboard object with entries, raw/Decimal metrics, calculatedAt and rank metadata                            |
| GET `/api/v1/leaderboards/most-booked`             | Same                                               | Public; same envelope, distinct board/rule and booking metric                                                           |
| GET `/api/v1/leaderboards/foodie-points`           | limit=20, offset                                   | Public; `{items,total,limit,offset,nextOffset}`, user UUIDs, server rank, displayName/avatarUrl and lifetime points     |
| GET `/api/v1/rewards/me/profile-summary`           | No body/query; verified customer context           | JWT; `{profile,loyalty,tiers,pointsPerAction,recentActivity,actions}`; consumed subset excludes unrelated actions/email |
| GET `/api/v1/rewards/rules`                        | No body/query                                      | JWT; bare presented active reward-rule array                                                                            |
| GET `/api/v1/food-trucks/profile/:slug/reviews`    | Actual owned truck slug, limit=20, optional cursor | Existing T05 public reviews endpoint reused by vendor profile content                                                   |

Source evidence: [social controller](../../christinacormie-backend/src/modules/social/social.controller.ts), [social service](../../christinacormie-backend/src/modules/social/social.service.ts), [social repository](../../christinacormie-backend/src/modules/social/social.repository.ts), [post pagination DTO](../../christinacormie-backend/src/modules/social/dto/feed-query.dto.ts), [connections DTO](../../christinacormie-backend/src/modules/social/dto/profile-social-query.dto.ts), [leaderboard controller](../../christinacormie-backend/src/modules/leaderboards/leaderboards.controller.ts), [leaderboard service](../../christinacormie-backend/src/modules/leaderboards/leaderboards.service.ts), [leaderboard repository](../../christinacormie-backend/src/modules/leaderboards/leaderboards.repository.ts), [truck-ranking query DTO](../../christinacormie-backend/src/modules/leaderboards/dto/leaderboard-query.dto.ts), [foodie query DTO](../../christinacormie-backend/src/modules/leaderboards/dto/foodie-points-query.dto.ts), [rewards controller](../../christinacormie-backend/src/modules/rewards/rewards.controller.ts), [rewards service](../../christinacormie-backend/src/modules/rewards/rewards.service.ts), [rewards repository](../../christinacormie-backend/src/modules/rewards/rewards.repository.ts), and [food-truck reviews implementation](../../christinacormie-backend/src/modules/food-trucks/food-trucks.service.ts).

Verification details:

- Social/reward methods require JWT but have no controller role restriction. This task's private consumers require verified CUSTOMER or VENDOR identity, with rewards enabled for the active CUSTOMER context. No persisted role or presenter accountType is used to grant access.
- Posts use limit 1–100 and optional UUID cursor. Connections support limit 1–100, nonnegative offset, optional search and type ALL/CUSTOMER/VENDOR; current list controls send only pagination. Backend total is distinct from returned item count; customerCount/vendorCount can use a broader counting filter, so they are not repurposed as filtered totals.
- Social profiles require ACTIVE, non-deleted users or return 404. The presenter obtains isFollowing by selecting the current viewer's UserFollow relation; this is reliable for members, unlike T05's combined truck list. Profile postCount is backend-provided and need not equal the viewer-visible gallery count.
- Follow rejects self-action with 400, missing/inactive targets with 404, and blocked relationships with 403. It upserts the relationship; following a vendor user can also create a truck follow. Unfollow deletes the member relation and may remove the corresponding truck follow; false means absent. No 409 business rule is invented, but client-error handling tolerates a returned conflict. Points and follower counts are never incremented locally.
- Profile authored/tagged reads return PUBLISHED, non-deleted eligible posts, enforce author block/follower-only visibility, order newest first and use limit+1 to derive nextCursor. Text-only posts retain their real identity and content; absence of an image is not replaced by a sample photo.
- Truck-ranking DTOs accept optional UUID marketId, period DAILY/WEEKLY/MONTHLY/ALL_TIME, limit 1–100 and nonnegative offset. API types support these verified fields; the existing UI has no market/period selector, so neither is guessed. Backend chooses the latest active matching board. Missing boards return 404.
- Truck-ranking pagination is actually implemented in the service: it prioritizes credit-accepting entries, slices offset/limit, then emits display rank, originalRank and creditAccepted. PreviousRank is retained from the stored entry. Frontend rows preserve returned rank/originalRank/previousRank separately, without calculating rank from local position or claiming the previous rank uses the same reordered basis.
- Foodie points accepts only limit/offset, uses lifetimePoints and excludes inactive/deleted users and vendor accounts. The server supplies offset-based rank and nextOffset; the frontend does not calculate ranks or send truck-only market/period parameters to this endpoint.
- Rewards use availablePoints, lifetimePoints and redeemedPoints separately. Current/next tiers and pointsPerAction come from the service; reward rules have nullable pointsRequired/rewardAmount. Recent activity uses actual transaction identity, points, context and timestamp. The summary GET already ensures the loyalty account and refunds expired pending redemptions on the backend; this client adds no award/redemption/admin write.
- Block/unblock endpoints were inspected: JWT, POST rejects self/missing targets and removes mutual follows, DELETE returns unblocked status. No existing T06 block control exists, so no speculative interface or block mutation is connected.

## 3. Member identity and profile presentation

`/profile/me` resolves the verified current-user UUID. Explicit UUID profile identifiers resolve member APIs; other values retain T05's truck-slug path. Member links use the returned userId, and truck social UUIDs never stand in for member UUIDs. The historical alex-rivera sample is no longer a special member identity. Session-scoped component keys reset member dialogs/edit drafts after session replacement. Existing route paths, guards and metadata remain unchanged; DiscoverLayout recognizes UUID member pages for the existing member shell styling.

The existing member card, stats, tabs, responsive classes, editor entry, public-view link and Modal lifecycle remain. Identity, avatar, bio and counts come from the member response. Public view uses a real UUID link. Posts and tagged panels use independent cursor reads with empty/loading/error/retry states. Gallery buttons retain actual post IDs; expanded views show actual image media, author/content/time, and previous/next post navigation. Non-image media is not fabricated into a still image.

Follower/Following stats open the existing overlay foundation with real paged lists and member UUID links. No follower data is inferred from a truck list. Message remains explicitly unconnected; no conversations are created. The profile editor remains an unconnected draft surface: submission does not overwrite server identity or claim an account update. Profile editing is still a later task.

## 4. Member follow/unfollow and caches

Buttons follow the backend-provided initial isFollowing value, reject self-follow, disable during mutation/refetch, and preserve existing styling. Both client gating and endpoint query functions require verified supported active identity. A per-store/session/member lock prevents concurrent opposite requests. Only confirmed results trigger Sonner success and tag invalidation; counts/state refetch from the server. Temporary/permission/conflict/network failures produce normalized errors and no fabricated confirmation.

Tags are MemberProfile, MemberPosts, MemberFollowers, MemberFollowing, SocialFeed, Leaderboards and Rewards, together with existing truck/favorites tags. Member follow invalidates relevant profile/list/post/feed caches and truck caches affected by backend coupling. The only T05 API change adds reciprocal member-cache invalidation to successful truck relationship actions; endpoints, payloads and T05 blockers are unchanged. T07 feed requests are not implemented; the tag is ready for the actual shared cache boundary.

Shared baseApi, Bearer preparation, single-flight refresh/retry, verified identity, role selection, stale-session protections, logout/cache/socket cleanup and existing error normalization remain. New modules use a small shared validated-query helper over the existing base query, not another client. Runtime schemas strip unreviewed fields, infer DTO types and distinguish nullable data from zero. Remote records stay in RTK Query; local state contains only UI selection, query cursors, dialogs and drafts.

## 5. Customer and vendor leaderboards

Customer and vendor pages use identical injected endpoint/cache definitions through the shared leaderboard domain. Their existing tab structures, keyboard navigation, artwork, independent row styles, responsive shells and vendor role guard remain.

Rows display actual names/images, server rank, rating, score and appropriate metric: review count for Top Rated, booking count for Most Booked, lifetime points for Foodie Points. Unknown ranks remain unavailable, never zero. Stored/previous rank values are shown separately; no movement trend is invented. Fake distances, repeated sample trucks, sample portraits, fixed seven-row claims and real-time claims are removed. The customer leaderboard header no longer implies a San Francisco market.

Truck lists use offset/limit paging and unknown-total Next/Previous controls. A full page permits a next request, which may correctly return an empty page; no global total is inferred. Foodie paging obeys nextOffset. Category changes remove offset; malformed offsets default safely. Returned calculatedAt is displayed for truck snapshots, with unavailable text when missing. No refresh/recalculation endpoint or guessed current market/period is used.

## 6. Vendor profile social content

The gallery uses the verified owner user UUID and shared authored/tagged post queries. The existing gallery and reviews main tabs remain; gallery content offers Posts/Tagged posts and the shared accessible modal/viewer. The old fixture lightbox path is no longer used by this connected gallery.

Reviews reuse T05's public truck-review API, resolving slugs through T04's verified vendor/truck context. A single owned truck resolves directly; multiple trucks require an explicit choice, and zero trucks shows an empty state. No arbitrary first truck, owner impersonation or staff workaround is added. Current vendor/account restrictions remain honored. Review rating/content/author and vendor response are backend data, with cursor paging and retry.

Vendor profile summary, editing and menu preview behavior remain outside T06 and explicitly labelled local previews. T04 identity/dashboard integration is preserved. Profile editing/menu mutations were not connected.

## 7. Rewards and tier integration

The own member profile and existing Settings points dialog share the real reward queries. The settings menu no longer promises a hardcoded 500 referral points. Current tier badges retain the supplied artwork by returned tier slug; tier names, thresholds and current status are server data.

The backend's progress object targets its final tier, while this UI labels the next tier. The pure adapter therefore uses returned lifetimePoints and nextTier.requiredPoints, clamps the progress element, and does not reuse the final-tier percentage under a misleading label. Null nextTier yields Maximum tier reached. Available/lifetime/redeemed points stay separate; empty rules, actions and recent activity are explicit. Current points-per-action and reward rules are read from their respective responses, with no client constants or invented money currency. No points are awarded, redeemed or modified by a frontend rewards mutation.

## 8. Errors, pagination and limitations

Initial loading and resource errors are explicit across member, post, connection, ranking and reward reads. Member temporary refresh failures can retain previously verified data; definitive 401/403/404 hides profile details. Posts/rewards/rankings fail without fixture fallback. Page/cursor controls disable while fetching; profile/gallery identity/tab changes reset paging through keys. Backend totals and cursors are used only for their own envelopes.

Remaining limits:

1. **Blocked identity is not reliably exposed.** findPublicProfile does not filter the viewer's block relationship or return an isBlocked flag. Connection lists likewise do not establish a full block policy. Authored/tagged post queries apply author block filtering and follow rejects blocked pairs. The frontend handles actual 403/404 and hidden/empty content, but cannot reliably label or hide every blocked identity/list without a backend contract. No boolean or block UI is invented.
2. **Existing single profile namespace is reserved by identifier type.** UUIDs identify members, non-UUID values identify truck slugs, and me identifies the verified viewer. A hypothetical UUID-shaped truck slug would collide with this existing routing convention and would need an explicit namespace/product decision. The client does not retry a missing member UUID as an unrelated truck.
3. **Rankings are server snapshots with backend-specific ordering.** Latest active market/period selection and credit prioritization are backend behavior. There is no frontend live-ranking claim, universal total, locally rebuilt rank or guessed previous-rank movement. A changed live dataset between pages has no snapshot token and can shift entries.
4. **T05 blockers remain.** Member follow state is reliable, but the combined truck-favorites mapper, missing independent truck flags, discovery offset defect and map-provider decision are not repaired or guessed. Backend coupling between member/vendor and truck follow means T05's session-cached confirmations still do not replace a reliable relationship-read contract.
5. **Media and scope limits remain explicit.** Gallery uses supported returned image media; it does not invent thumbnails for video/non-image posts. Full post interactions/publishing, messaging, account editing and reward redemption are later tasks. Vendor summary/menu previews remain as documented above.
6. The rewards read's existing backend side effects and access-token account-revocation timing remain backend responsibilities. No backend source was changed.

## 9. Tests and validation results

The existing package scripts and server-free runner were checked before execution. All API tests use backend-shaped fixtures and local mocked HTTP; SSR rendering initializes no browser/server. Existing mock-presentation tests now seed backend-shaped caches, while role guards, route metadata, keyboard tabs and local draft/validation regressions remain.

- New T06 integration suite: **46 passed**.
- Focused member/leaderboard/vendor-profile regressions: **82 passed** (46 new plus 36 affected existing cases).
- Complete `npm.cmd test`: **435 passed, 0 failed, 0 skipped**, including all 389 T01–T05 regressions.
- `npm.cmd run typecheck`: passed during implementation after resolving typed error-result branches and unused imports.
- Final `npm.cmd run build`: passed, including TypeScript project checking and production Vite build.
- Final `npm.cmd run lint`: passed with no errors or warnings after removing one unused test import.
- Changed-file Prettier checks, `git diff --check`, manifest paths and local report links: passed for all 35 T06 files.

All requested frontend automated checks were executable. No test runner, compiler or lint rules were disabled.

Focused coverage includes current/other UUID routing versus T05 truck slugs; actual authored/tagged posts and empty galleries; follower/following query paging; follow/unfollow, self and role gating, duplicate/opposite requests, response validation, 400/401/403/404/409/server/network failures, cache tags/refetch, session replacement and logout; separate truck/foodie ranking shapes, rank/previous/original semantics, correct booking versus review metrics, offsets and vendor cache reuse; real tier progress, final-tier percentage distinction, maximum tier, nullable rules, rewards activity, identity mismatch and safe response subsets.

Live non-production API/CORS verification and manual browser, responsive, keyboard/focus, screen-reader and image checks remain pending. AGENTS.md sections 12–13 prohibit starting servers and browser automation, so these checks were not executed. No production credentials/API calls, backend runtime/build/test commands, dependency installations or environment edits were used.

## 10. T06 acceptance status

**The source-supported T06 integration is implemented and automated checks are recorded above; full blocked-profile semantics remain a backend limitation.** Member identity/posts/tagged content/lists/follow, customer/vendor leaderboards, vendor social/review content and customer reward reads are connected. No initial member follow-state blocker remains because the member presenter supplies a viewer-specific flag. Full acceptance of a reliably identified blocked-profile state needs the backend policy/flag described above. Manual/live verification is not claimed.

T01–T05 infrastructure and T05 truck profiles are preserved. Work stops at T06; no T07 or later task is started.
