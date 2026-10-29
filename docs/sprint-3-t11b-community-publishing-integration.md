# Sprint 3 — T11-B: Community publishing, editing and media integration

Date: 2026-10-29 (Asia/Dhaka). Scope: T11-B only, starting from T11-A's 636-test baseline. Backend read-only; no T11-C/T12 work.

## 1. References and verified source

Reviewed the relevant Community sections of the [integration plan](frontend-api-integration-plan.md), [API mapping](frontend-backend-api-mapping.md), [gaps](api-integration-gaps.md), [T11-A](sprint-3-t11a-community-reads-integration.md), [T10](sprint-3-t10-profile-settings-vendor-menu-integration.md), [authentication](sprint-1-auth-integration.md), [vendor identity](sprint-2-vendor-dashboard-integration.md) and [publishing/upload/session](sprint-2-t07-social-feed-publishing-integration.md) reports.

Source of truth:

- [CommunityPostsController](../../christinacormie-backend/src/modules/community/community-posts.controller.ts): JWT guard, four mutation routes, ParseUUIDPipe and multipart interceptor.
- [CreateCommunityRequestDto](../../christinacormie-backend/src/modules/community/dto/create-community-request.dto.ts), [update DTO](../../christinacormie-backend/src/modules/community/dto/community-post-query.dto.ts) and [RequestMediaDto](../../christinacormie-backend/src/modules/community/dto/request-media.dto.ts).
- [CommunityPostsService](../../christinacormie-backend/src/modules/community/community-posts.service.ts): presenter, ownership/row locking, update/delete, upload validation and provider failures.
- [CommunityService](../../christinacormie-backend/src/modules/community/community.service.ts): public creation and AWARDED/NOT_AWARDED/UNCONFIRMED reward results.
- [CommunityRepository](../../christinacormie-backend/src/modules/community/community.repository.ts): active publisher/vendor eligibility, persisted request/media and defaults.
- [Category validation](../../christinacormie-backend/src/modules/community/community-validation.ts), [event-window interpretation](../../christinacormie-backend/src/modules/community/community-event-window.ts) and [Prisma models](../../christinacormie-backend/prisma/schema/17-community.prisma).

Important source findings: timezone and coordinates are optional for creation, rather than mandatory Need-a-Truck inputs. Omitted event timezones are interpreted as UTC by the backend event-window code. The UI explicitly explains this and never chooses a timezone from a city/browser/address. Creation is PUBLIC, and omitted requestType defaults to EVENT on the server. Neither default is submitted as a fabricated form value.

## 2. Exact T11-B files changed

Prior working-tree changes were retained. This list describes only T11-B changes:

```text
docs/sprint-3-t11b-community-publishing-integration.md
src/features/community/api/community.api.ts
src/features/community/components/CommunityPublishingEditor.tsx
src/features/community/components/CommunityPublishingFeedback.tsx
src/features/community/schemas/community.schema.ts
src/features/community/schemas/communityPublishing.schema.ts
src/features/community/utils/communityFormErrors.ts
src/features/community/utils/communityPublishing.test.mjs
src/features/community/utils/communityPublishing.ts
src/features/community/utils/useCommunityPostManagement.ts
src/features/community/utils/useCommunityPublishing.ts
src/features/community/utils/vendorCommunityPublishing.ts
src/features/customer/components/community/CommunityComposer.tsx
src/features/customer/components/community/CommunityReadCard.tsx
src/features/customer/pages/CustomerCommunityPage.tsx
src/features/customer/schemas/community.schema.ts
src/features/vendor/components/create-posts/VendorCommunityPostForm.tsx
src/features/vendor/components/create-posts/VendorPostAttachments.tsx
src/features/vendor/components/create-posts/VendorPostReview.tsx
src/features/vendor/components/create-posts/VendorTruckRequestForm.tsx
src/features/vendor/pages/VendorCreatePostPage.tsx
src/features/vendor/schemas/create-posts.schema.ts
src/features/vendor/utils/createPostsState.test.mjs
src/features/vendor/utils/createPostsState.ts
```

No backend source, environment file, dependency manifest, stylesheet, router/guard, shared HTTP client, auth middleware or test framework was modified by this task.

## 3. Verified HTTP contracts

The configured base URL supplies /api/v1. Existing T11-A reads and vendor eligibility reads are reused.

| Operation                              | Request used                                                             | Actual response confirmed                                                                                                              |
| -------------------------------------- | ------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------- |
| POST /api/v1/community/posts           | Strict supported category-specific DTO described below                   | {message,post,rewardStatus,rewardMessage?}; presenter UUID, author ID, owner flag, category, OPEN status and PUBLIC visibility checked |
| PATCH /api/v1/community/posts/:postId  | Actual UUID; changed supported fields only; category omitted             | {message,post}; same post UUID, author ID and category checked                                                                         |
| DELETE /api/v1/community/posts/:postId | Actual UUID, no HTTP body; explicit local confirmation                   | {message,deleted:true}; backend soft deletion, not a remote-asset deletion                                                             |
| POST /api/v1/community/media/upload    | FormData **files**, actual JPG/PNG/PDF Files; browser-generated boundary | {message,media:[{mediaUrl,mediaType}]}; HTTPS URLs, IMAGE/PDF type, count and file/type correspondence checked                         |

Create/update DTOs are strict frontend whitelists of fields the current forms actually collect. Unknown properties, null optional values, local Files/blob URLs, fake IDs and invented response envelopes are rejected. Remote response schemas retain only reviewed fields.

### Publisher and owner rules

Backend ensurePublisher requires an existing non-deleted ACTIVE account with CUSTOMER or VENDOR role. If the account has any VENDOR role, its vendor profile must exist, not be deleted, and have APPROVED or PENDING_APPROVAL status—even if CUSTOMER is active.

Frontend mutations require the captured verified session/user/active role. Vendor-role accounts additionally require a matching cached vendor userId, ACTIVE vendor user relation, eligible status and dashboardAccess.allowed. Customer and Vendor pages load/retry the existing vendor profile read when required. A foodTruckId is not a create DTO field and is never substituted for the authenticated user. No arbitrary owned truck is selected.

Backend update/delete obtain a row lock and reject missing/deleted records (404), other owners (403), non-OPEN/expired posts (409) and any received quote (409). Category changes are rejected. The current lockOwner implementation checks quotes, not an independent linked-booking count; this frontend does not invent that missing check. Bookings reached through received quotes are already constrained by the quote lock.

Frontend edit/delete additionally require the actual detail's author/user match, viewer.isOwner, zero known offers, OPEN/unexpired state and the relevant allowedActions flag. Missing permission/count information never defaults to permission or zero. Backend authorization remains authoritative when state changes after a read.

## 4. Category payloads and supported workflows

| Category       | Current form mapping                                                                                                                                                                                                            | Support                                                                                                  |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| COMMUNITY      | category, body/description → description; confirmed media if selected                                                                                                                                                           | Customer and Vendor create/edit                                                                          |
| COMMUNITY_HELP | Same supported text/media mapping                                                                                                                                                                                               | Customer and Vendor create/edit                                                                          |
| HIRING_JOBS    | Same supported text/media mapping                                                                                                                                                                                               | Customer and Vendor create/edit                                                                          |
| FOR_SALE       | Item name → title; description; confirmed media                                                                                                                                                                                 | Customer and Vendor create/edit                                                                          |
| VENDOR_CALLOUT | Description and confirmed media                                                                                                                                                                                                 | Customer and Vendor create/edit; optional structured attendance/spots fields are not inferred from prose |
| NEED_TRUCK     | Selected event label → actual eventType enum, date → eventDate, time → startTime, location → address, whole guest count → guestCount, optional numeric budget range → budgetMin/budgetMax, menu selections → preferredMenuItems | Customer and Vendor create/edit; current request forms do not collect attachments                        |

The event label mapping covers the seven current backend enum values. Dates must be real dates, current/future according to backend UTC date semantics; startTime uses HH:mm. Positive guest counts, supported numeric/Decimal bounds, 5000-character descriptions and sale-title requirements are validated. Customer item names retain the existing stricter 200-character UI limit; the DTO/vendor title limit is 255.

Budget ranges remain lower/upper major-unit amounts (e.g. 500.50–800.25), never a midpoint, maximum-only amount or cents value. A blank budget omits optional bounds. Existing saved Decimal strings and UTC-anchored TIME values populate edit forms without timezone shifting. Backend menu tags are retained even when absent from the current checkbox catalogue; blank/oversized tags remain invalid.

The forms do not collect endTime, explicit eventTimezone, contactPhone, geographic coordinates, requestType, preferredCuisines, attendance/spots, expiresAt or comment preferences. These properties are omitted, rather than invented. Edits preserve their saved server values. No new timezone/geocoding/map provider or speculative input was added.

**No entire category is blocked by the current create contract:** all six have valid existing inputs. Missing/invalid required event data blocks that submission, and malformed legacy records may need correction before editing. Workflows requiring explicit local event timezone/geographic data or structured callout fields remain unavailable until their inputs are approved.

## 5. Customer publishing and edit/delete presentation

The T11-A create-unavailable notice is replaced by the existing CommunityComposer, with its category choices, inputs, request/menu controls, media picker and back/cancel workflow. Integrated forms display actual publish/save/pending language; the legacy standalone preview mode remains isolated for existing modules/tests.

Creation only reports success after a validated backend response. No fixture post, client-generated post UUID or optimistic local insertion is used. The confirmed UUID opens the real T11-A detail read. Backend rewardStatus is shown exactly through the success notification; UNCONFIRMED rewards do not turn a confirmed publication into a retry or an invented points award.

The existing detail overflow/title path exposes permitted edit/delete controls. Edit uses the saved record to initialize a form baseline; payloads include only changed collected fields. Category changes are unavailable. The existing ConfirmationDialog handles deliberate deletion, inline errors, pending state and retry. Visible records refresh only after validated success. Failed/locked/missing/forbidden operations keep their failure state and never claim deletion.

## 6. Vendor publishing and review

VendorCreatePostPage keeps its existing category picker, form classes, artwork, field layout, independent category drafts, attachment previews, back/cancel and review shell. Remote records are no longer saved into the local preview reducer or assigned crypto-generated post IDs.

General/community and truck-request forms reuse the shared create endpoint. The actual returned UUID identifies a real detail read, which supplies the confirmed review. Reward status and saved media are displayed from confirmed values. Edit initializes the existing Vendor-specific form from the saved post; subsequent save uses PATCH and changed fields. Delete uses the same deliberate confirmation and owner rules.

The existing route/role/navigation protections are unchanged. Cached eligibility can disable submission while preserving editable drafts and a retry control. Vendor creation does not require a truck when this DTO does not require one; it never fabricates a truck/user association or performs an offer/quote.

## 7. Media upload, partial recovery and cleanup

Selection accepts at most five nonempty JPG/PNG/PDF files, at most 10 MB each. The previous Vendor preview-only 5 MB limit is aligned to the verified 10 MB Community contract. API validation also checks JPEG/PNG/PDF signatures, matching the server's binary checks. Backend validation remains authoritative.

Each selected file is uploaded in its own request under files. This stays within the endpoint's batch contract and makes per-file success observable. A later file failure stops saving. Confirmed metadata is retained by actual File identity in transient session/draft state, so an explicit retry uploads only unconfirmed files.

Upload success alone never means publication. If saving fails after uploads, the draft and confirmed metadata remain. The final JSON contains only validated persisted URLs/types. Existing attachments are retained; edit-time new files append to the actual saved metadata, and the combined five-file limit is checked before upload. No unrequested removal or replacement of existing attachments is inferred.

Existing FilePreview primitives own object-URL creation/revocation on file changes/removal/unmount. New code creates no blob URLs. Hook cleanup discards transient metadata/subscriptions; it does not claim a provider asset was deleted. No asset-delete contract exists. Lost upload responses or abandoned uploads can still leave orphaned remote assets.

## 8. Authentication, concurrency, errors and cache

All operations extend the existing Community API injected into shared baseApi. Existing bearer headers, single-flight token refresh and one authenticated 401 retry are preserved. No automatic network/5xx publication retry is introduced.

Captured session ID, verified user ID and active role are checked around awaited requests and upload/save transitions. A stale result cannot publish its metadata into a replacement account, notify success there or reset its state. Component keys clear UI drafts on session/role replacement. Existing logout/cache/socket cleanup remains intact.

Per-store/session/account pipeline locks block concurrent publishing pipelines; endpoint locks also prevent concurrent creates and conflicting edit/delete requests for a post. Form pending state disables duplicate submits and relevant controls; pending refs release on both success and failure.

Confirmed writes invalidate CommunityList, CommunityPost, Rewards and MemberProfile. Active All/My/detail readers refetch authoritative records; failed writes do not invalidate or optimistically remove records. Review/list collections remain in RTK Query. Local state holds forms, baseline values, selections, UI flags and confirmed upload metadata, not a separate remote post collection.

Normalized errors and Sonner remain in use. Explicit structured field errors map through allowlisted DTO-to-form fields using the established applyServerFieldErrors utility. Validation arrays remain useful at form level without guessing field identity. HTTP 400/401/403/404/409/413/503/5xx and network failures remain failures; server internals are sanitized.

### Ambiguous save outcomes

A failed response can follow a persisted backend write; there is no verified idempotency key. Network/5xx/invalid-response save failures are labeled unconfirmed. Automatic resubmission is blocked. The recovery control force-refreshes authoritative My Posts and shows its first page before enabling a deliberate retry. It does not automatically retry or claim that one page proves the earlier request did not save.

Confirmed metadata stays available for that explicit retry within the same mounted session/draft. Cancelling/leaving discards local draft state according to the existing flow; no cross-session retry queue or storage of Files is introduced.

## 9. Validation

Existing package scripts and the server-free SSR/Node runner were inspected. All HTTP tests use local backend-shaped mocks; no server/browser/production calls occurred.

| Check                                               | Result                                                             |
| --------------------------------------------------- | ------------------------------------------------------------------ |
| Focused publishing/read/Customer/Vendor regressions | 96 passed, 0 failed                                                |
| Development TypeScript                              | Passed                                                             |
| Focused ESLint after fixes                          | Passed                                                             |
| Final full regression suite                         | 678 passed, 0 failed/skipped                                       |
| Final build (includes TypeScript)                   | Passed; 3,194 modules transformed                                  |
| Final repository ESLint                             | Passed                                                             |
| Changed-file Prettier, Git diff and local links     | Passed: 24 files formatted; whitespace clean; all 18 links resolve |

There are 42 new publishing cases. Coverage includes the four HTTP operations, exact JWT/payload/multipart contracts, six categories, required and omitted inputs, ranges/Decimal/time values, customer/vendor/dual-role eligibility, signature/count/size/type validation, metadata association, partial uploads, post failure after confirmed upload, explicit retries, owner/action/status/expiry/quote constraints, confirmed/failed deletion, read-cache invalidation, duplicate creates and conflicting post writes, stale sessions, 401 refresh, 400/403/404/409/413/503/500/network errors, structured field mapping and preserved presentation/recovery disclosures.

The earlier focused run exposed a test-fixture mismatch: the reused customer store actually carried CUSTOMER+VENDOR roles and correctly needed onboarding metadata. New publishing fixtures explicitly distinguish singleton roles and dual-role onboarding. No guard was weakened. Existing assertions were updated for the real 10 MB limit and backend-supported string menu tags; no test was disabled.

Live Cloudinary/API/database/CORS behavior and manual responsive/keyboard/focus/modal checks remain unverified under AGENTS.md sections 12–13. Static rendering and mocked transport tests do not certify browser interaction or live provider operation.

## 10. Remaining limitations and acceptance

**Implemented:** supported Customer/Vendor publishing for all six categories, real media upload and retry reuse, backend-confirmed review/detail, owner edit/delete, current eligibility rules, cache refresh, session isolation and regression coverage.

**Uncollected/blocked inputs:** explicit event timezone, geographic coordinates and optional structured callout fields. Omission is supported by this backend; no address geocoding or guessed timezone is used. Existing remote attachments are preserved/appended, with no newly invented asset-removal workflow. The existing stricter Customer title length remains.

**Backend/product limitations:** no idempotency guarantee, no general uploaded-asset cleanup, no independent booking-lock flag in the presenter/service, and a first-page My Posts review cannot prove exactly-once persistence. Backend configuration and authoritative permissions remain necessary. Optional server properties are never overwritten just to satisfy this UI.

**Deferred:** comments/replies, reactions, reporting, ignore/restore, interests/invitations, offers/quotes, booking/payment/tracking, realtime and new reward-awarding behavior. No T11-C or T12 operation is implemented.

**T11-B acceptance:** supported source-backed flows are implemented and focused regressions pass; final checks are recorded above. Uncollected properties and unverified live/browser behavior are explicitly limited. Work stops at T11-B.
