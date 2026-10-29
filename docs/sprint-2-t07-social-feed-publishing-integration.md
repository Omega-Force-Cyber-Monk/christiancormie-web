# Sprint 2 — T07 social feeds, publishing and media integration

Date: 2026-10-28 (Asia/Dhaka). Scope: T07, C09–C13, V03 and V05 only. The ten required audit/sprint references and current controller/DTO/service/repository/frontend source were reviewed. Previous working-tree changes are preserved. Backend source, environment values, dependencies, route guards, authentication/session infrastructure, messaging and global styling were not changed. T08 was not started.

## 1. Exact files modified

Paths are relative to `christinacormie-web`; the complete Git diff includes earlier sprint work as well.

New files:

- `src/features/social/api/socialFeed.api.ts`
- `src/features/social/schemas/socialFeed.schema.ts`
- `src/features/social/utils/feedAdapters.ts`
- `src/features/social/utils/postPublishing.ts`
- `src/features/social/utils/usePublishPost.ts`
- `src/features/social/utils/useSocialFeed.ts`
- `src/features/social/components/PostLikeButton.tsx`
- `src/features/social/components/SocialCommentsDialog.tsx`
- `src/features/social/utils/socialFeed.test-fixtures.mjs`
- `src/features/social/utils/socialFeedIntegration.test.mjs`
- `docs/sprint-2-t07-social-feed-publishing-integration.md` (this report)

Updated files:

- `src/services/api/baseApi.ts`
- `src/features/customer/pages/CustomerFeedPage.tsx`
- `src/features/customer/pages/CustomerCreatePostPage.tsx`
- `src/features/customer/components/feed/FeedPostCard.tsx`
- `src/features/customer/components/feed/FeedCommentsDialog.tsx`
- `src/features/customer/components/feed/FeedCommentForm.tsx`
- `src/features/customer/components/feed/FeedShareDialog.tsx`
- `src/features/customer/components/create-post/PostDetailsPicker.tsx`
- `src/features/customer/schemas/create-post.schema.ts`
- `src/features/customer/utils/createPost.ts`
- `src/features/customer/utils/createPost.test.mjs`
- `src/features/customer/utils/feedComments.test.mjs`
- `src/features/vendor/pages/VendorFeedPage.tsx`
- `src/features/vendor/pages/VendorDashboardPage.tsx`
- `src/features/vendor/components/feed/VendorFeedPostCard.tsx`
- `src/features/vendor/components/feed/VendorFeedComposer.tsx`
- `src/features/vendor/components/feed/VendorFeedCommentsDialog.tsx`
- `src/features/vendor/components/feed/VendorFeedCommentForm.tsx`
- `src/features/vendor/components/home/VendorHomeUpdateForm.tsx`
- `src/features/vendor/utils/feedState.ts`
- `src/features/vendor/utils/homeState.ts`
- `src/features/vendor/utils/feedState.test.mjs`
- `src/features/vendor/utils/homeState.test.mjs`

## 2. Actual endpoints and verified contracts

The configured base URL supplies `/api/v1`; endpoint definitions use relative paths. All requests reuse shared baseApi/authBaseQuery and its existing header, refresh, retry and stale-session behavior.

| Method/path                                     | Implemented request                                                                               | Actual consumed response                                                                                              |
| ----------------------------------------------- | ------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| GET `/api/v1/social/feed/following`             | limit=20; optional cursor                                                                         | `{items,nextCursor}`; presented posts with author/media/location/engagement and viewer flags                          |
| GET `/api/v1/social/feed/explore`               | limit=20, sortBy=newest; optional cursor                                                          | Same envelope; public eligible non-follower-only posts, not an AI recommendation contract                             |
| POST `/api/v1/social/posts`                     | content, status=PUBLISHED; optional media/locationId/taggedUserIds; actual foodTruckId for vendor | Raw created post; client validates/caches only `{id,status:PUBLISHED}` for creation confirmation                      |
| POST `/api/v1/social/media/upload`              | Multipart `files`; one actual image per client request                                            | `{media:[{mediaType:"IMAGE",mediaUrl,sortOrder}]}`                                                                    |
| GET `/api/v1/social/places`                     | search, limit=20, offset                                                                          | Bare active Place array; consumed id/name/nullable address                                                            |
| GET `/api/v1/social/profiles/:userId/following` | Existing T06 endpoint; verified user UUID, search, limit=20, offset                               | `{items,total,limit,offset,nextOffset}`; tags use each returned userId                                                |
| POST `/api/v1/social/posts/:postId/like`        | Actual post UUID; no body                                                                         | Toggle result `{liked:false}` or created like fields plus `{liked:true}`; no authoritative count in this response     |
| GET `/api/v1/social/posts/:postId/comments`     | Actual UUID; limit=20, offset                                                                     | `{totalCount,comments}`; root rows contain nested one-level replies                                                   |
| POST `/api/v1/social/posts/:postId/comments`    | `{content,parentCommentId?}`                                                                      | Presented created comment with actual IDs, content, author, timestamp, likeCount/isLiked and nullable parentCommentId |
| POST `/api/v1/social/comments/:commentId/like`  | Actual comment UUID; no body                                                                      | `{liked,likeCount}` toggle result                                                                                     |
| POST `/api/v1/social/posts/:postId/share`       | Actual post UUID; no body                                                                         | `{success,postId,shareCount,shareUrl,shareText}`; shareUrl is `/api/v1/social/posts/:postId`                          |

All operations above except the public places list have JwtAuthGuard in the current controller. This frontend enables social operations only for verified CUSTOMER or VENDOR active identity. No role is inferred from persisted state or from a feed presenter.

Evidence: [SocialController](../../christinacormie-backend/src/modules/social/social.controller.ts), [SocialService](../../christinacormie-backend/src/modules/social/social.service.ts), [SocialRepository](../../christinacormie-backend/src/modules/social/social.repository.ts), [CreatePostDto](../../christinacormie-backend/src/modules/social/dto/create-post.dto.ts), [PostMediaDto](../../christinacormie-backend/src/modules/social/dto/post-media.dto.ts), [CommentPostDto](../../christinacormie-backend/src/modules/social/dto/comment-post.dto.ts), [comments query DTO](../../christinacormie-backend/src/modules/social/dto/get-comments-query.dto.ts), [following-feed DTO](../../christinacormie-backend/src/modules/social/dto/feed-query.dto.ts), [explore DTO](../../christinacormie-backend/src/modules/social/dto/explore-feed-query.dto.ts), [places DTO](../../christinacormie-backend/src/modules/social/dto/place-query.dto.ts), [connections DTO](../../christinacormie-backend/src/modules/social/dto/profile-social-query.dto.ts), and [social persistence models](../../christinacormie-backend/prisma/schema/15-social.prisma).

Important source details:

- Following uses limit 1–100, a UUID cursor, published/non-deleted eligible posts, followed authors/trucks, author block filtering and newest order. Own posts are not automatically included merely because the user just published them. Explore uses limit 1–50, optional string cursor and newest/trending enum; the current UI requests newest and excludes follower-only posts through the backend. Both service responses derive nextCursor from the extra fetched item and post ID.
- CreatePostDto accepts content up to 2200, optional UUID foodTruckId/locationId, up to 20 UUIDv4 taggedUserIds, status DRAFT/PUBLISHED, optional isPromotion/isFollowerOnly and up to 10 media metadata objects. The UI collects no promotion/follower-only/status selector, so it sends only the reviewed fields and explicit PUBLISHED intent. Server service requires trimmed content or at least one media entry. No frontend-only text/friend/File/preview fields are submitted.
- Place selection must reference an active place. Tags must reference followed active accounts, must not include self and must not involve a block relationship. Current candidate names/UUIDs come from T06's following query, not fixture friend IDs.
- Upload controller uses FilesInterceptor('files',10), maximum 10 MB per file. Service additionally checks JPG/PNG MIME and magic bytes and rejects WebP; it requires configured Cloudinary or returns 503. This differs from the older frontend's JPG/PNG/WebP preview acceptance.
- Missing/invisible/deleted or ineligible posts/comments return 404 through visibility checks; role/ownership/platform relations can return 403; invalid content/relations/media return 400; vendor cardinality can return 409; unconfigured uploads return 503. Existing auth handling handles 401. Client size/MIME checks are UX validation; backend binary validation remains authoritative.
- Comment DTO has string content and optional UUID parentCommentId. Existing frontend nonblank checks remain. The repository flattens a reply-to-reply to the top-level parent. The UI exposes Reply only on top-level comments and sends that real ID. No arbitrary deeper tree is invented.
- Comment totalCount includes all non-deleted comments and replies, while limit/offset pages top-level rows only. Next-page availability uses returned root-page size, not totalCount as a root total. A final full page can therefore permit one empty next page.
- Post like returns toggle state without a count; comment like returns both state and count. Responses are validated and successful actions refetch authoritative feed/comment state. POST is never assumed to mean a new like or a local count increment.
- Detail/update/delete/save routes were inspected. No matching edit/delete/save controls exist in the connected target cards, so those operations were not added. The protected detail route matters to the share limitation below; no speculative permalink page was created.

## 3. Customer feed and pagination

CustomerFeedPage retains its existing feed grid/stream, audience placement, cards, photo modal, actions and responsive CSS. The legacy for-you URL value now selects the actual Explore endpoint and displays Explore, without a personalized/AI claim.

An RTK Query infinite endpoint owns pages and cursors. The audience/session key isolates pending requests; unused feed pages expire on unsubscribe, so returning after a tab switch starts at the initial cursor. Rendered pages deduplicate by actual post UUID and retain returned updated fields. There is no remote post collection in a local reducer or ordinary Redux slice. Loading, background refresh, empty results, next-page errors and retry use actual query state; no fixture fallback is inserted.

Pure adapters retain actual author user UUIDs, author/vendor/truck names where provided, safe remote images, location names, timestamps (explicit UTC), engagement counts and nullable views. Customer author links use user UUIDs. Images remain actual media; customer photo expansion includes returned image records, and vendor cards can display multiple returned images. Unknown authors/media remain unavailable instead of becoming a sample business or artwork. Non-image feed media does not receive fabricated thumbnails.

## 4. Vendor feed and dashboard updates

VendorFeedPage uses the same following-feed endpoint and cache infrastructure with its existing vendor-specific stream/cards/composer. It does not fabricate the vendor's own new post into Following. Real member-profile/post caches are invalidated after publication so authored content can refresh through T06.

Composer and Home update posting use T04's verified owner/vendor/truck context, honor account/platform restrictions, and require one active owned truck UUID. Neither fixture IDs nor slugs enter the create-post payload. Vendor text is validated against the real 2200-character content limit. Restricted/missing/ambiguous identity has explicit feedback and disabled publication.

VendorHomeUpdateForm keeps its existing modal, field, draft updates and validation. It now awaits the complete creation request, clears/closes only after confirmed publication and retains the draft on failure. A pending Home publish prevents a second update composer from opening; completion does not close a different overlay selected while the earlier request was pending.

## 5. Customer publishing and media recovery

CustomerCreatePostPage starts with an empty draft and verified identity, retaining its composer, file/camera selection, previews, place/tag picker screens, discard confirmation and responsive classes. The connected path does not use sample photos, sample friends or locally inserted mock post results.

Publishing sequence:

1. Existing form validation checks meaningful text/media, with the real 2200-character maximum. File selection allows JPG/PNG, at most 10; its existing stricter 5 MB UI limit is retained and labelled. The upload API enforces the backend maximum of 10 MB as well.
2. Picker screens use debounced backend searches, actual place/user IDs, offset pagination and loading/empty/retry states. Selected place names are read from RTK Query cache. Tag selection permits at most 20 users.
3. Each selected File is uploaded in a separate multipart request under `files`. This is within the existing backend contract and makes per-file success observable. No manual Content-Type boundary, blob URL or File object is sent in the final JSON payload.
4. Successful uploaded metadata stays in session/file-keyed RTK Query mutation cache. A later file failure stops creation; retry reuses confirmed earlier uploads. A creation failure retains those successful uploads and the draft for an explicit retry.
5. The pure payload adapter whitelists DTO fields, deduplicates tag IDs, assigns valid media sortOrder, rejects unsupported/local URL schemes and requires text or media after upload.
6. Only a confirmed created UUID and PUBLISHED status clear the draft and show publication success. Upload completion alone never reports publication. UI fields are disabled during active submission to avoid overwriting a later edit.

Preview ownership remains with existing FilePreview, whose effect revokes object URLs on file change/unmount. Upload request handles/cache metadata are cleaned up on unmount or confirmed publication; logout uses existing global abort/cache cleanup. No remote delete/storage service was invented. Upload uses fetchBaseQuery, which offers no upload progress callback here; the UI shows pending text, not invented percentages.

## 6. Likes, comments and replies

FeedPostCard and VendorFeedPostCard use actual engagement values and a shared like action. Buttons disable pending/refreshing operations, and a per-store/session/action/entity lock prevents concurrent duplicate toggles. Failed actions show sanitized Sonner feedback and leave no fabricated optimistic state. Successful actions invalidate feed/post/member content and relevant comment caches.

Existing customer/vendor comments wrappers retain their Modal/sheet/form styling and use a shared backend-driven thread. Comments, author names/avatars, timestamps, nested replies, liked flags and counts come from the comments endpoint. Replies use actual parentCommentId and remain one level deep. Draft text and reply target remain local UI state. Failed submissions return without resetting the form; drafts survive retry. Draft revisions and unmount checks prevent an earlier completion from clearing a newly edited/reopened draft. Root-row paging is independent from the total comments-with-replies count.

No messaging conversation, socket, delivery/read receipt or reward write was added.

## 7. Sharing and its remaining dependency

The real share endpoint increments server shareCount and returns an API-relative URL pointing to GET `/social/posts/:postId`, which currently requires JWT and returns JSON. This is not a customer-facing public web/deep link.

The existing share modal now offers an explicitly labelled Record share intent action and displays the returned API reference. It does not invent a `/feed#id` or `/profile/.../posts/...` public permalink, invoke native sharing for this API reference, or claim external delivery. Public-link copying is unavailable until a valid web/deep-link contract is approved. Recording intent and actual transmission are clearly distinguished.

FeedShareDialog is also an existing consumer of the unrelated community preview. Its explicit basePath preview branch remains local clipboard preview behavior and does not call real social APIs with community fixture IDs. No community integration was started.

## 8. Cache ownership and preserved infrastructure

All operations inject into the existing shared baseApi and reuse T06's validated-query/schema/verified-identity boundaries. New tags are SocialPosts and PostComments; SocialFeed, MemberPosts, MemberProfile and other earlier tags remain.

- Feed entries provide list/entity tags. Successful post/interaction writes invalidate the appropriate feed/post/member caches; comment operations also invalidate the selected post's comment pages.
- Actual counts/flags are refreshed from the backend rather than guessed. Successful publication also refreshes existing reward reads without adding a points mutation.
- Uploaded responses have separate mutation cache keys, so ordinary invalidation does not discard successful-file retry metadata.
- Remote pages, comments, place/tag results and upload responses stay in RTK Query. Local state holds form drafts, selected IDs, dialogs and cursor/offset controls only.
- Session changes abort/reset old queries and mutations through existing middleware. Upload-to-create sequencing rechecks the captured session and active role before further work; stale completions do not notify/reset a replacement session.

The shared refresh single-flight/retry bounds, verified session bootstrap, role chooser, cross-tab/stale protections, route guards, existing logout controls/cache/socket cleanup and error normalization are preserved. No additional HTTP client, package, authentication architecture or socket connection was introduced.

## 9. Error and retry behavior

400/validation arrays, 401/refresh failure, 403 permissions, 404 missing/deleted/blocked-visible resources, 409 identity conflict, upload 413, server 5xx and network failures follow existing sanitized AppError/Sonner/resource/form paths. Comment and publishing drafts survive failed submissions. Empty responses mean empty server data, not sample data. Failed pagination retains previously loaded feed pages with retry; failed comments do not render fixture threads. Partial-upload/create failures never claim publication.

Requests are not automatically retried as new post creations after an ambiguous network/server outcome. A user can explicitly retry with retained media, subject to the backend limitation below. No raw server stack, credentials, complete private records or production data is logged.

## 10. Automated tests and results

The package scripts and existing runner were checked before execution: production SSR transformation plus Node tests with server creation and unmocked network blocked. All HTTP is locally mocked against the fixed test base. Existing fixture-reducer tests remain; affected presentation tests now use backend-shaped fixtures/providers while preserving their role/route, form and local-state regression assertions.

- New T07 integration tests: **49 passed**.
- Affected existing feed/create/Home regression run: **33 passed**.
- Complete final `npm.cmd test`: **484 passed, 0 failed, 0 skipped**, including all 435 prior regressions.
- Standalone TypeScript check passed during implementation. The production build includes the final TypeScript check.
- Final `npm.cmd run build`: passed, including TypeScript project checking and production Vite build.
- Final `npm.cmd run lint`: passed, with no errors or warnings.
- Changed-file Prettier checks: passed for all 34 T07 files.
- `git diff --check`, manifest paths and local report links: passed.

The final build/lint/full-test run includes the draft-revision, unmount and Home-overlay completion safeguards. No tests were skipped or rules disabled. All requested frontend automated checks could run.

Coverage includes Following/Explore paths and JWT/query/envelopes; cursor pages, tab reset and duplicate IDs; real author/location/media/count adaptation; toggle false/true and comment-like responses; comments/root offsets/reply IDs; places and T06 tag candidates; multipart field/boundary/file bytes; invalid MIME/empty/oversize files; payload whitelisting and UUID/URL constraints; customer/vendor eligibility and real owned truck UUID; partial upload/creation retry reuse; session change during upload and new login/old mutation cleanup; concurrent toggles/logout; cache refetch with authoritative counts; initial/empty/error presentation and no sample fallback; multi-image retention; and 400/401/403/404/409/413/500/503/network recovery.

Browser/responsive, focus/keyboard, actual file/camera dialogs, clipboard/native delivery and live non-production/CORS/Cloudinary checks remain unverified. AGENTS.md sections 12–13 prohibit starting servers and browser automation. Static rendering is not visual or interactive certification. No production API calls, backend runtime/build/test commands, environment edits or dependency installation were performed.

## 11. Outstanding blockers and contract limits

1. **Public share destination:** no verified customer-facing post permalink/deep-link route is supplied. The protected JSON reference is not substituted for one. External public sharing is therefore blocked.
2. **Multi-role customer publishing:** resolvePostIdentity chooses vendor identity from backend VENDOR membership, not the frontend active role. CUSTOMER mode for a CUSTOMER+VENDOR account cannot reliably create a personal customer post. The frontend retains the draft and requires an explicit Vendor role for a truck post; it does not silently publish as a truck. A customer-author-context contract would require backend/product work.
3. **Vendor cardinality:** the backend requires exactly one non-deleted vendor truck even when a requested foodTruckId is provided. Zero/multiple trucks cannot be repaired by choosing an arbitrary ID or sending an invented selection field. Supported singleton posting is connected; ambiguous/multi-truck publication remains blocked.
4. **Ambiguous failures/idempotency:** createPost persists before awaiting notifications and exposes no idempotency key. A lost response or later notification failure can leave a published post despite an error. There is no verified correlation/reconciliation endpoint for an unconfirmed draft. The UI does not auto-retry creation or claim exactly-once delivery; it retains the draft and explains that publication is unconfirmed and the feed should be reviewed before an explicit retry.
5. **Unconfirmed uploads/orphans:** a remote upload can succeed before a lost response, and this API returns no partial-success manifest or deletion contract. Confirmed successful files are reused; unknown outcomes and abandoned uploaded assets require backend lifecycle/idempotency support. No invented cleanup call is made.
6. **Existing limits remain:** T05 truck flags/discovery pagination/maps and T06 blocked-profile semantics are not changed. Following-feed membership need not include the publisher's own posts. Image posting is supported; this task does not introduce video upload or fabricated media thumbnails.

## 12. T07 acceptance status

**Supported T07 social feed, interaction and publishing integration is implemented; full acceptance remains limited by the real backend/product blockers above.** Customer/Vendor feeds, actual toggles, one-level comments/replies, supported image uploads, post payloads, real picker IDs and Vendor Home publication use verified contracts and existing infrastructure. No mock publication/like/comment success remains in those connected paths.

Public permalink sharing, personal posting in multi-role CUSTOMER mode, multi-truck vendor posting and exactly-once recovery cannot be manufactured by frontend adapters. Manual/live release verification remains pending. Work stops after T07; no T08 or later integration is started.
