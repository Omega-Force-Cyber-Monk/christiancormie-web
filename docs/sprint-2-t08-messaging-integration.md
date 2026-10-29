# Sprint 2 — T08: Messaging integration

Scope: M01, M02, C07. Frontend HTTP messaging only. The backend is read-only. T09 and T18 are not started.

## 1. References and verified source

Compared the messaging sections of frontend-audit.md, frontend-backend-api-mapping.md, frontend-api-integration-plan.md and api-integration-gaps.md against current source, with the T01–T07 reports as the regression baseline. Existing authentication, logout, admin, vendor identity, discovery, member and social integrations are preserved.

Backend source of truth (paths relative to `../christinacormie-backend/`):

- `src/modules/messaging/messaging.controller.ts`: JWT guard, ten registered operations and UUID path parsing. No controller role guard grants implicit conversation membership.
- `src/modules/messaging/dto/create-direct-conversation.dto.ts`, `messaging-query.dto.ts`, `recipient-search.dto.ts`, `send-message.dto.ts`: supported fields and limits.
- `src/modules/messaging/messaging.service.ts`: list (33), recipients (76), requests (147), detail (175), create/reuse (193), accept/decline (252), history (278), send (309), read (418), existing-direct lookup (478), membership (503), conversation/message/user presenters (696/742/756).
- `prisma/schema/21-messaging.prisma`: persisted types/statuses, participants and message IDs. No durable delete-history operation or client idempotency key.
- Existing gateway/realtime service and frontend `services/socket` were inspected, not connected or changed.

The current service/presenters, rather than incomplete Swagger examples, define the implemented response schemas. The client deliberately excludes participant/sender email from its cache.

## 2. Exact files changed in T08

Earlier sprint changes already in the working tree are excluded from this manifest.

```text
docs/sprint-2-t08-messaging-integration.md
src/services/api/baseApi.ts
src/features/customer/pages/CustomerMessagePage.tsx
src/features/customer/pages/CustomerMemberProfilePage.tsx
src/features/customer/components/message/MessageComposer.tsx
src/features/customer/components/message/MessageConversationList.tsx
src/features/customer/components/message/MessageThread.tsx
src/features/customer/components/profile/ProfileSummary.tsx
src/features/vendor/pages/VendorMessagesPage.tsx
src/features/vendor/components/messages/VendorConversationList.tsx
src/features/vendor/components/messages/VendorMessageComposer.tsx
src/features/vendor/components/messages/VendorMessageThread.tsx
src/features/vendor/utils/messagesState.test.mjs
src/features/messaging/api/messaging.api.ts
src/features/messaging/schemas/messaging.schema.ts
src/features/messaging/types/messaging.types.ts
src/features/messaging/hooks/useMessagingWorkspace.ts
src/features/messaging/hooks/useMessageScroll.ts
src/features/messaging/components/ConversationListControls.tsx
src/features/messaging/components/MessageControls.tsx
src/features/messaging/components/RecipientDialog.tsx
src/features/messaging/components/StartConversationButton.tsx
src/features/messaging/components/TextComposer.tsx
src/features/messaging/utils/messagingAdapters.ts
src/features/messaging/utils/messaging.test-fixtures.mjs
src/features/messaging/utils/messagingIntegration.test.mjs
```

## 3. Connected contracts

Every path below is relative to `/api/v1/messaging`. The shared base query supplies the configured `/api/v1` prefix and bearer JWT, retaining refresh/retry behavior. Frontend access requires a verified CUSTOMER or VENDOR active role. The backend determines participation and recipient policy; selecting Vendor mode does not impersonate a vendor owner or another user.

| Method and path                                | Exact request used                                                                                                                  | Validated result                                                                |
| ---------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| GET `/conversations`                           | `limit=20`, `offset`                                                                                                                | `{items,total,nextOffset}`; service also returns `message`                      |
| GET `/requests`                                | `limit=20`, `offset`                                                                                                                | `{items,total,nextOffset}`                                                      |
| GET `/recipients`                              | `search`, `type=ALL/CUSTOMER/VENDOR`, `limit=20`, `offset`                                                                          | `{items,total,nextOffset}`; nullable recipient items allowed; no email required |
| POST `/conversations/direct`                   | Exactly one UUID `participantUserId`, `vendorId` or `foodTruckId`; schema also admits optional `title` ≤255, UI does not invent one | `{message,conversation}`; both new and existing conversations accepted          |
| GET `/conversations/:conversationId`           | UUID path; no body                                                                                                                  | `{message,conversation}`                                                        |
| PATCH `/conversations/:conversationId/accept`  | UUID path; no body                                                                                                                  | `{conversationId,status:'ACTIVE'}`                                              |
| PATCH `/conversations/:conversationId/decline` | UUID path; no body                                                                                                                  | `{conversationId,status:'DECLINED'}`                                            |
| GET `/conversations/:conversationId/messages`  | UUID path, `limit=30`, `offset`                                                                                                     | `{message,items,total,nextOffset}`                                              |
| POST `/conversations/:conversationId/messages` | Strict `{messageType:'TEXT',content}`; nonempty trimmed text, raw input ≤5,000 characters                                           | `{message,item}`; actual server message ID/content/time/sender                  |
| PATCH `/conversations/:conversationId/read`    | UUID path; no body                                                                                                                  | `{message}` only                                                                |

Conversation presenter: UUID, type (DIRECT/BOOKING/COMMUNITY_REQUEST/SUPPORT), nullable title, isClosed, directStatus (ACTIVE/REQUESTED/DECLINED), requestedRecipientId, acceptedAt, createdAt, lastMessageAt, unreadCount, messageCount, otherParticipant, participants and nullable lastMessage. Participant contains id, userId, lastReadAt, isMuted and nullable user. User includes id, accountType, displayName, avatarUrl and nullable vendor/foodTruck identity. Backend accountType reflects vendor-record existence; it is display metadata, not an authorization role.

Message presenter: id, conversationId, senderId, messageType (TEXT/IMAGE/FILE/SYSTEM/OFFER), nullable content/attachmentUrl, createdAt, editedAt and nullable sender. History admits existing backend-only SYSTEM/OFFER records without inventing an offer workflow. UUIDs, timestamps, envelopes, participant identity and conversation associations are runtime checked. Unknown fields are excluded.

## 4. Customer and Vendor interfaces

Both pages use the shared messaging domain, retaining separate list/thread components, bubble classes, composer geometry, existing layout shells and responsive CSS. No stylesheet or route guard is changed. Customer keeps its existing styled text input; Vendor keeps its textarea, Enter/Shift+Enter behavior, mobile Back/focus behavior, native options menu and details dialog.

Real conversation/request lists replace fixtures. No arbitrary initial participant is selected. `?conversation=<UUID>` supports profile entry points, selection survives refresh, and invalid/missing IDs have an explicit unavailable state. Empty/loading/error/retry/background-refresh states never substitute fixture rows. List search explicitly filters loaded rows only: the list DTO has no server search contract. New message opens a shared Modal using real, debounced recipient search, type filtering and returned offset metadata.

Truck-profile Message uses the validated foodTruckId. Member-profile Message uses the validated profile.userId, disabling self-chat. The backend resolves vendor/truck ownership. Direct creation is guarded against duplicate submissions; existing conversations are reused as returned, including closed/declined state. Failed creation leaves the initiating profile/dialog in place. Unmounted buttons and replaced sessions cannot redirect on delayed completion.

Vendor booking/order/request contacts still use fixture/display identities and are not connected. Customer Orders currently has no real recipient data. No booking lifecycle, invitation or support-message integration is inferred.

## 5. Requests, history, sending and read status

Incoming DIRECT/REQUESTED conversations are fetched separately; outgoing requests remain in the regular list. Only the verified requested recipient sees accept/decline actions. Status changes occur after the backend result and authoritative refetch. An already-resolved request returns 404, not an invented 409.

The backend creates ACTIVE when the recipient follows the sender, otherwise REQUESTED. It permits one initial text from the requester; the UI permits this only for a confirmed empty conversation. Further sends wait for acceptance. Incoming requests use explicit accept/decline before reply (the backend also permits auto-accept on reply). Closed and declined chats cannot send. Reopening is not simulated.

History pages remain in RTK Query, use returned nextOffset and backend descending createdAt order, then reconcile by server ID and render chronological timestamps in UTC. Outgoing grouping uses the verified user UUID. Switching queries uses currentData, preventing another thread's history from appearing. Scroll positioning retains loaded earlier content and opens new/updated histories at the latest message. Non-definitive refresh failures retain validated history; authorization/membership failures hide inaccessible content.

Text send uses strict validation and synchronous submission locks in the form/workspace/API. Confirmed server items enter the existing query cache by server ID and relevant caches refetch. There is no optimistic local message, generated message ID, delivery/read receipt or automatic network retry. Ambiguous errors retain the draft and explain that the user should refresh before explicitly retrying. Existing normalized errors and Sonner handle validation, forbidden/missing/conflict/rate-limit/server/network failures without exposing server internals.

Read runs only for the selected, participating, rendered thread in a visible document after the latest reported message is loaded. Background/unselected threads do not trigger read. The backend writes server-now to the viewer's participant lastReadAt for the entire conversation; it returns no timestamp or message receipt. A successful read invalidates list/request/detail counts; failures leave unread counts intact and expose retry. No local readIds or fabricated unread clearing remains.

## 6. Drafts, sessions and caches

Local state contains only selected URL, text drafts/revisions, filters and presentation concerns. Drafts are keyed by conversation; a send captures the submitted revision. Confirmed completion clears only that same revision, even if the user has switched conversations. Later edits (including retyping identical text) survive; failures never clear text. Workspace keys include session, active role and verified user so logout/account/role replacement discards private drafts.

All endpoint cache keys include session/active role. Each request verifies scope before HTTP and after completion, including the viewer UUID; late results cannot repopulate a replacement account's cache. Existing auth middleware still resets RTK Query and disconnects sockets on session/role change. Refreshing JWTs within the same verified session continues to work. Per-store/session action locks protect creation, sends, request resolution and reads.

Cache domains: Conversations, MessageRequests, ConversationDetail and MessageHistory. Send/create invalidate messaging domains; accept/decline refresh list/request/detail (also after stale-request errors); successful read refreshes list/request/detail. No ordinary Redux slice duplicates remote arrays. Existing logout, refresh, guards, layouts and centralized socket infrastructure remain intact.

## 7. Unsupported features and backend limits

- U06: no confirmed messaging upload endpoint. File/image controls explain unavailability; no file picker, blob URL, social upload, fabricated PDF download or multi-file send is used. Existing single remote attachment URLs may be opened only through credential-free HTTP(S) links. Missing/unsafe URLs show unavailable.
- U07: no delete-history endpoint. Clear history and mark-unread options explain unavailability and change no records. Legacy static preview reducers/assets remain unused by the connected pages; their independent regressions remain covered.
- T18: no Socket.IO connection, presence, typing, push or live-delivery behavior. Use explicit Refresh; shared API focus/reconnect refresh remains available.
- No send idempotency key or reconciliation token is available. A lost HTTP response can follow a persisted message. Frontend locks prevent concurrent local submissions, but cannot guarantee exactly-once sends across explicit retries or clients.
- Direct creation uses find-then-create with no unique direct-user-pair constraint. Accept/decline use find-then-update without an atomic pending-state comparison. Cross-client creation/transition races require backend work; frontend locks and authoritative refresh cannot supply database guarantees.
- Offset histories/lists are not snapshot paginated; concurrent writes or equal timestamps can shift boundaries. ID deduplication and full refresh help, but gap-free concurrent pagination requires a backend stable cursor/snapshot contract.
- Mark-read uses server-now, so a message arriving between loading and marking can be included. The endpoint cannot mark only through a particular message ID. This is documented backend semantics, not a per-message read claim.

## 8. Validation

Final checks on the implemented frontend:

| Check                                        | Result                                                                             |
| -------------------------------------------- | ---------------------------------------------------------------------------------- |
| `npm.cmd run typecheck`                      | Passed during implementation; final TypeScript validation also passed within build |
| `npm.cmd run build` (`tsc -b && vite build`) | Passed; 3,181 modules transformed                                                  |
| `npm.cmd run lint`                           | Passed across the repository                                                       |
| `npm.cmd test`                               | **530 passed, 0 failed, 0 skipped**, including T01–T07 regressions                 |
| Changed-file `prettier --check`              | Passed for the 26-file T08 manifest                                                |
| `git diff --check`                           | Passed                                                                             |
| Backend working-tree check                   | Unchanged; only the two pre-existing untracked audit documents remain              |

The full suite includes 46 new messaging integration cases and 13 existing Vendor messaging regressions. Focused files were also run during development; their presentation expectations were updated for real backend data. No regressions were disabled. All tests use backend-shaped fixtures and mocked HTTP in the existing server-free SSR/Node runner.

Coverage includes all ten operation methods/routes/envelopes, JWT and refresh retry, invalid/expired sessions, all three recipient targets, self/multiple/slug rejection, existing conversation reuse, requests and stale 404, returned pagination, sender grouping, safe attachment URLs, malformed/mismatched/membership responses, strict text payloads, reconciliation, duplicate mutation locks, draft revision isolation and asynchronous failure/session handling, conversation switching, read eligibility and authoritative unread refetch, 400/403/404/409/429/5xx/network failures, role/session replacement, empty selection and independent layouts/composers. Existing guard and T01–T07 regression tests passed in the same run.

No production calls, backend runtime/build/test commands, dependency installations or environment-secret edits are used. Browser/manual responsive, keyboard/focus and live non-production CORS verification remain unexecuted: AGENTS.md sections 12–13 prohibit starting servers and browser automation. Static rendering is not browser certification.

## 9. T08 acceptance status

Supported HTTP messaging is implemented for Customer and Vendor using the verified ten operations. Full release acceptance remains subject to the backend limitations above and manual/live verification. Unsupported uploads/deletion/realtime and fixture-only booking contacts are explicitly outside this integration. Work stops at T08.
