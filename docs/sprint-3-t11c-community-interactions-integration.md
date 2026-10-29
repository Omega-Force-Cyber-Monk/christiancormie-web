# Sprint 3 — T11-C: Community interactions integration

Date: 2026-10-29 (Asia/Dhaka). Baseline: 678 tests. Scope: C16/C17/C18 and independently supported Vendor interactions only. Backend source is unchanged; no T12/T13 work.

## 1. References and source verification

Reviewed relevant sections of the [integration plan](frontend-api-integration-plan.md), [mapping](frontend-backend-api-mapping.md), [gaps](api-integration-gaps.md), [T11-A](sprint-3-t11a-community-reads-integration.md), [T11-B](sprint-3-t11b-community-publishing-integration.md), [T10](sprint-3-t10-profile-settings-vendor-menu-integration.md), [authentication](sprint-1-auth-integration.md), [vendor identity](sprint-2-vendor-dashboard-integration.md), [members/block limitations](sprint-2-t06-member-rankings-rewards-integration.md), [social](sprint-2-t07-social-feed-publishing-integration.md) and [messaging](sprint-2-t08-messaging-integration.md) reports.

Current source overrides historical audit/Swagger assumptions:

- [CommunityPostsController](../../christinacormie-backend/src/modules/community/community-posts.controller.ts), [CommunityPostsService](../../christinacormie-backend/src/modules/community/community-posts.service.ts) and [CommunityService](../../christinacormie-backend/src/modules/community/community.service.ts).
- [CommentRequestDto](../../christinacormie-backend/src/modules/community/dto/comment-request.dto.ts), [ReactRequestDto](../../christinacormie-backend/src/modules/community/dto/react-request.dto.ts), [report DTO](../../christinacormie-backend/src/modules/community/dto/report-community-post.dto.ts), and [Community query/interest DTOs](../../christinacormie-backend/src/modules/community/dto/community-post-query.dto.ts).
- [CommunityRepository](../../christinacormie-backend/src/modules/community/community.repository.ts) and [Prisma Community models](../../christinacormie-backend/prisma/schema/17-community.prisma).
- [SocialService](../../christinacormie-backend/src/modules/social/social.service.ts) and [SocialRepository](../../christinacormie-backend/src/modules/social/social.repository.ts) were checked for the conditional author-block scope.

The existing Customer card/detail/report/interested views and Vendor Orders/Create Post consumers were inspected. Vendor Orders Community/request records remain fixtures. Community report actions expose Report/Hide/Copy, with no author Block/Unblock control.

## 2. Exact T11-C files changed

```text
docs/sprint-3-t11c-community-interactions-integration.md
src/features/community/api/community.api.ts
src/features/community/components/CommunityCommentsDialog.tsx
src/features/community/components/CommunityPostInteractions.tsx
src/features/community/components/ConnectedCommunityInterests.tsx
src/features/community/components/ConnectedCommunityReport.tsx
src/features/community/schemas/community.schema.ts
src/features/community/schemas/communityInteractions.schema.ts
src/features/community/utils/communityInteractions.test.mjs
src/features/community/utils/communityInteractions.ts
src/features/community/utils/useCommunityInteraction.ts
src/features/customer/components/community/CommunityInterestedView.tsx
src/features/customer/components/community/CommunityReadCard.tsx
src/features/customer/components/community/CommunityReportPreview.tsx
src/features/customer/pages/CustomerCommunityPage.tsx
src/features/vendor/components/create-posts/VendorPostReview.tsx
src/features/vendor/pages/VendorCreatePostPage.tsx
src/services/api/baseApi.ts
```

No backend, dependency, environment, stylesheet contents, layout, router/guard, auth/session middleware, social/messaging API or test-framework file was changed. Existing working-tree changes were preserved.

## 3. Verified operation contracts

The existing base URL supplies /api/v1; all requests use shared baseApi/authBaseQuery and existing JWT/refresh/retry behavior.

| Operation                                    | Exact body/query used                                                     | Actual response consumed                                                                                                                                                                           |
| -------------------------------------------- | ------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| GET /community/posts/:postId/comments        | limit=20, offset; actual post UUID                                        | {message,items,pagination:{total,limit,offset,nextOffset}}; items are flat comments with id, parentCommentId, content, createdAt, user:{id,profile:{displayName,avatarUrl} or null}                |
| POST /community/posts/:postId/comments       | {content,parentCommentId?}; trimmed nonempty content ≤2000, optional UUID | {message,comment}; raw created comment also has communityRequestId, userId, deletedAt:null and user. Post/user/parent associations are checked                                                     |
| POST /community/posts/:postId/reactions      | {reaction:"LIKE"}                                                         | {message,reaction:{id,communityRequestId,userId,reaction}}; post/user/value associations checked                                                                                                   |
| POST /community/posts/:postId/reports        | {reason}; exact enum below                                                | {message,report:{id,postId,reason,status,createdAt}}; UUID/reason/post association checked                                                                                                         |
| POST /community/posts/:postId/ignore         | No body                                                                   | {message}; persisted IGNORE action via upsert                                                                                                                                                      |
| DELETE /community/posts/:postId/ignore       | No body                                                                   | {message}; deleteMany of this viewer's IGNORE action                                                                                                                                               |
| GET /community/posts/:postId/interests       | limit=20, offset                                                          | {message,items,total}; each item has id/message/createdAt/user, optional profile and vendor{id,businessName,logoUrl,isVerified}. No truck IDs, rating, distance, cuisine or nextOffset is returned |
| POST /community/posts/:postId/interests      | {message}; trimmed, required, ≤2000                                       | {message}; no invented created-interest ID or full post                                                                                                                                            |
| DELETE /community/posts/:postId/interests/me | No body                                                                   | {message}; deleteMany of this viewer's INTEREST action                                                                                                                                             |

Paths in the table are relative to /api/v1. No Social Feed comment endpoint, reaction DELETE/toggle, organizer invite/decline, quote or financial operation is used.

### Authentication and server policy

All nine routes are JWT-protected. POST interest additionally has the VENDOR role decorator. Other operation rules differ; they are not all gated as publishing:

- Comments GET and reactions require visible content. Non-owner DRAFT/CANCELLED content is unavailable; private content requires the target vendor, while the owner can read it.
- Comment POST also honors allowPublicComments: when false, a non-owner must satisfy the backend target-vendor check. The presenter has no complete per-viewer canComment flag. Owner/public-comment behavior is enabled; restricted vendor attempts remain subject to backend target checks.
- Comments/reactions do not call ensurePublisher or impose an OPEN/unexpired constraint. Visible CLOSED/EXPIRED posts can therefore remain readable/reactable/commentable according to those actual policies.
- Report and Ignore POST call ensurePublisher, including ACTIVE account and APPROVED/PENDING_APPROVAL vendor onboarding for any account carrying a VENDOR role. Both reject own posts. They do not introduce an OPEN-only condition.
- Restore and withdrawal DELETE check visibility and delete the viewer's action; no fabricated toggle/count response is assumed.
- Organizer interest GET requires actual ownership and VENDOR_CALLOUT, not OPEN status or publisher eligibility. Owner history remains readable for expired/closed callouts.
- Interest POST requires eligible vendor publishing/responder context, another user's VENDOR_CALLOUT, OPEN/unexpired state and no existing interest (409). Withdrawal has no backend OPEN-only constraint; the client permits withdrawal of an existing interest on an ended visible callout, while still requiring the requested eligible active VENDOR context.

Backend authorization remains authoritative. Current source does not add a separate Community block-relationship visibility filter.

## 4. Comments and replies

Existing Community card comment controls open the existing Community drawer/Modal presentation. CommunityCommentsPanel is separately renderable for server-free state tests; the dialog wrapper retains the shared focus/scroll/modal lifecycle.

Comments are read from their Community endpoint and displayed using actual author profile, content and timestamp. Missing profile/avatar remains unavailable, with safe remote URLs only. Actual parentCommentId relationships are labeled; a parent outside loaded results is identified as outside those results. Replies to replies retain the actual selected UUID. No reply depth, synthetic parent or nested Social Feed structure is fabricated.

The backend comments query returns all non-deleted comments, including replies, in ascending createdAt/id order. Although Swagger mentions a parent filter, CommunityPostQueryDto/service do not implement parentCommentId filtering. The client does not submit that unsupported parameter.

RTK Query infinite pages follow returned nextOffset. UUID deduplication prevents repeated display; total is the actual count including replies. Empty final pages stop further loading. Local state contains a selected reply ID and form draft, not a copied remote comment collection.

Comment/reply submission resets the draft only after validated server confirmation in the same mounted session/post context. Failure retains the draft, displays sanitized errors and permits retry. Ambiguous save errors explain that the user should refresh comments before explicitly retrying; no automatic POST retry is added for network/server failures. Existing authenticated 401 refresh/retry remains.

Initial loading, background refresh, empty comments, refresh/retry, pending forms and access denial are represented. Temporary failures retain valid cached rows. Definitive 401/403/404 errors hide cached rows, reply context and totals rather than revealing stale private data.

## 5. Reactions and counts

The existing heart/count styling is preserved. ReactRequestDto accepts an optional string of up to 30 characters, default LIKE; this UI submits only the verified LIKE value.

The repository performs an upsert keyed by communityRequestId/userId. Repeating LIKE replaces/confirms that reaction; it does not remove it or necessarily increase the total. There is no verified remove endpoint and the list/detail presenter has no initial per-viewer isLiked/reaction ownership field.

Consequently there is no guessed pressed/unlike state, synthetic local ownership flag or local count arithmetic. A validated response confirms LIKE, and list/detail reads refresh the actual server count. An existing reaction can produce the same UUID and unchanged total. Removal remains explicitly unavailable.

## 6. Reports, hide and restore

CommunityReportPreview now has a live-record branch reusing its existing action/report/confirmation drawer styling. Its isolated legacy preview branch remains only for old preview consumers/tests; the integrated page passes a real T11 record.

| Existing label         | Backend reason         |
| ---------------------- | ---------------------- |
| Spam or irrelevant     | SPAM_OR_IRRELEVANT     |
| Inappropriate content  | INAPPROPRIATE_CONTENT  |
| Harassment             | HARASSMENT             |
| Scam or fraud          | SCAM_OR_FRAUD          |
| Not food truck related | NOT_FOOD_TRUCK_RELATED |

Reporting/hiding require known non-owner identity and eligible publisher context. The selected reason is preserved after failures. Concurrent submissions are blocked; a server 409 remains an already-reported failure and disables another report submit in that dialog. Confirmation appears only after the validated report response.

The saved report does not delete or automatically hide a post. The confirmation states this and offers a separate Hide action. Report administration/moderation screens and support-ticket workflows are unchanged.

Hide/Restore use persisted IGNORE operations and refresh authoritative Community readers. No local-only removal is applied. Successful hiding offers a session-scoped Sonner Undo action that remains usable when the removed card unmounts. A detail with returned isIgnored can also show Restore. No hidden-post management page was added; once Undo/detail access is lost, the UI does not provide a directory of hidden IDs.

Copy uses the actual supported Community UUID hash URL and browser clipboard only. Failure/unavailable clipboard access is reported without fake copied success. No block flag or author-block action is manufactured.

## 7. Interested vendors and U15

The existing CommunityInterestedView now has a live organizer branch. Real owner Callout cards and the verified Vendor publishing review expose the existing View interested trucks control. Responses are validated and kept in RTK Query.

Rows show actual vendor/profile names, safe logos/avatars, introduction messages, timestamps and verification metadata. Returned user/vendor UUIDs remain distinct. The profile dialog displays only supplied information. No truck link/identity, cuisine, rating, distance or invented event metric is substituted.

The response has total but no pagination metadata/nextOffset. The next request offset is the previous requested offset plus returned row count, only while below total; empty pages terminate. This internal paging calculation is not described as a returned server cursor. Zero and missing/loading values remain distinct.

Invite/Decline controls are preserved but disabled with an explicit explanation: U15 has no organizer invitation/decline-interest persistence contract. An interest is not an invitation, quote, booking or accepted/declined state.

## 8. Vendor interest/withdrawal and Orders dependency

The shared controls/API support a verified active VENDOR reading an actual other-user Callout: required introduction field, allowedActions.canSendInterest/viewer checks, OPEN/unexpired validation, onboarding/dashboard identity checks, duplicate/conflicting request locks, server-confirmed submission and retained failed drafts.

Withdrawal requires an actual returned interested state, deliberate confirmation and backend confirmation before refreshed counts/viewer state change. Interest/withdrawal endpoints return only a message, so the client refetches authoritative post/count/list data.

**Current surface limitation:** the connected Vendor publishing review contains the vendor's own post; self-interest is correctly unavailable there. VendorOrdersPage's other-user Community cards, comments and interest controls still depend on fixture records without verified server UUIDs/data. They are deliberately not connected. The shared/API implementation is tested, but this is not a claim that Vendor Orders now offers a complete live interest-discovery workflow. A separate real-data prerequisite is required before enabling those specific controls.

No full Orders migration, quote, offer, booking, payment or financial withdrawal is added.

## 9. Author blocking

No existing author Block/Unblock control was found in the Community actions/detail UI or relevant Vendor surface, so both conditional block operations are skipped as instructed. Current social source still rejects self/missing targets, removes mutual follows on block and returns an unblocked result for DELETE; the T06 missing reliable blocked-profile read semantics remain.

No new Block control, false isBlocked flag, Community visibility guarantee or unnecessary social-cache invalidation is introduced.

## 10. Session safety and cache synchronization

The existing Community API is extended, with focused CommunityComments and CommunityInterests tags. Read arguments capture session ID, verified user ID, active role and selected post UUID. The shared scopedRead guard verifies session identity before and after asynchronous work.

Interaction permissions use reviewed current-session detail/list records, not fixture IDs or a caller-supplied server entity. Stale/errored detail data cannot silently grant a mutation through an older list snapshot. Restore can use its actual captured UUID without a hidden-record directory; the backend still verifies visibility.

Per-store/session/post operation locks prevent duplicate comments/reactions/reports and conflicting Ignore/Restore or Interest/Withdrawal requests. UI pending flags disable duplicate submits. Existing logout, role change and replacement-session cache/socket cleanup remain. Mounted-context checks prevent old responses from resetting a new draft or displaying success for a replacement user; Undo separately verifies its captured session after the original card unmounts.

| Successful operation         | Invalidated Community domains                                                              |
| ---------------------------- | ------------------------------------------------------------------------------------------ |
| Comment/reply                | CommunityList, selected CommunityPost, selected CommunityComments                          |
| LIKE, report, ignore/restore | CommunityList, selected CommunityPost                                                      |
| Interest/withdrawal          | CommunityList, selected CommunityPost, selected CommunityInterests                         |
| Existing post edit/delete    | Existing T11-B tags plus that post's comments/interests, so open dependent readers refetch |

Failed operations do not insert comments, increment counts, hide records, clear drafts or invalidate unrelated domains. No new Social/Rewards/financial invalidation is added to interaction actions because no corresponding coupling is verified. T11-B publishing reward invalidation is retained.

Remote records/pages remain in RTK Query. Local state is limited to form values, selected IDs, dialog stages, pending/error/confirmation UI and the short-lived Undo callback. No second client, server-state reducer, package, socket or persisted retry queue is introduced.

## 11. Validation

Package scripts and the server-free SSR/Node runner were inspected. HTTP tests use backend-shaped local mocks; no browser, dev/preview server, production request or backend runtime/build command was used.

| Check                                                    | Result                                                   |
| -------------------------------------------------------- | -------------------------------------------------------- |
| Existing focused T11-A/B and Customer/Vendor regressions | 96 passed                                                |
| New interactions suite                                   | 43 passed                                                |
| Combined focused suite                                   | 139 passed, 0 failed                                     |
| Standalone TypeScript / focused lint                     | Passed                                                   |
| Complete existing suite plus new cases                   | 721 passed, 0 failed/skipped                             |
| Final build (includes TypeScript)                        | Passed; 3,210 modules transformed                        |
| Final repository ESLint                                  | Passed                                                   |
| Changed-file Prettier, diff and report links             | Passed: 18 files, whitespace clean, all 23 links resolve |

The full suite ran once. Afterward a style-dependency check found the shared controls needed an explicit import of the unchanged scoped Community stylesheet for direct Vendor entry. That import was added; the final combined focused suite passed 139 cases again, and final build/lint checks cover the resulting source. The full suite was not repeated for this stylesheet-import-only adjustment.

Coverage includes all nine methods/routes/DTOs/envelopes, JWT/refresh, comment/reply parent mappings and returned pagination, true reaction upsert semantics/counts, report enums/duplicates, server hide/restore, organizer lists/nullable fields/total paging, vendor onboarding/interest/withdrawal, ownership/category/status/expiry rules, cache invalidation, conflicting operations, logout/session/role replacement, malformed/cross-entity responses, empty/loading/error/retry and stale private-data suppression. Earlier T11-A/B tests remain enabled; no test framework or rule is disabled.

Manual/live API/CORS/database and responsive/keyboard/focus/modal checks remain unexecuted under [AGENTS.md](../AGENTS.md) sections 12–13. Static rendering and mocked HTTP cannot certify browser appearance or production operation.

Backend status matches the initial baseline: only the two pre-existing untracked audit documents remain, with no tracked backend changes. All 18 manifest paths exist.

## 12. Blockers and acceptance

**Completed:** real Customer Community comments/replies, LIKE, reporting, hide/restore, organizer interest lists, shared vendor interaction endpoints/controls and interactions on the verified Vendor publishing review. Existing T11-A/B data/session/publishing behavior is preserved.

**Partially available:** Vendor interest/withdrawal has source-backed shared/API support, but existing other-user Vendor Orders controls remain deferred until their dataset/UUIDs are integrated. No fixture record is sent to a real endpoint.

**Unsupported:** organizer invite/decline (U15), removing reactions/reading initial reaction ownership, a hidden-post directory, and a reliable blocked-author flag/policy. No new Block/Unblock UI is introduced.

**Backend limits:** comments/reports have no verified idempotency key; a lost response can follow persistence. Report admin-notification failure can occur after report creation, so an eventual duplicate 409 must not become a second fake success. Geographic, upload, identity, financial and other prior sprint blockers remain unchanged.

**T11-C acceptance:** supported Customer and verified-record interactions are implemented and regression-tested. Full availability of the existing other-user Vendor Orders interest flow remains blocked by its dataset dependency. U15 and missing reaction/block read/removal contracts are explicit. Live/browser verification remains pending.

## 13. Consolidated T11-A/B/C status

| Part  | Status                                                                                                                                                                                    |
| ----- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| T11-A | Real All/My/category/detail reads, actual pagination and session isolation retained; geographic filtering still lacks a coordinate source                                                 |
| T11-B | Source-supported Customer/Vendor create/upload/edit/delete retained; optional uncollected inputs, asset cleanup/idempotency and live verification limits remain                           |
| T11-C | Supported comments/replies, LIKE, report/hide/restore and organizer interest reads connected; vendor interaction API/shared controls implemented with the Orders dataset dependency above |

This completes the independently supported T11 work within the approved boundaries. It does not claim full Vendor Orders migration, unsupported organizer decisions, financial workflows or production/browser certification. Work stops at T11-C; T12/T13 are not started.
