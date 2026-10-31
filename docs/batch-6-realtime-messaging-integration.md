# Batch 6 — Realtime messaging integration

## Files changed

- `src/services/socket/socket.ts`
- `src/services/socket/socket.types.ts`
- `src/services/socket/useSocket.ts`
- `src/services/socket/socket.test-fixtures.mjs`
- `src/services/socket/socket.test.mjs`
- `src/features/messaging/realtime/messagingRealtime.ts`
- `src/features/messaging/realtime/messagingRealtime.test.mjs`
- `src/features/messaging/hooks/useMessagingRealtime.ts`
- `src/features/messaging/hooks/useMessagingWorkspace.ts`
- `src/features/messaging/components/RealtimeStatus.tsx`
- `src/features/messaging/components/ConversationListControls.tsx`
- `src/features/messaging/components/MessageControls.tsx`
- `src/features/customer/pages/CustomerMessagePage.tsx`
- `src/features/vendor/pages/VendorMessagesPage.tsx`
- This report.

## Verified socket contract

Source authority: backend `messaging.gateway.ts`, `messaging-realtime.service.ts`,
`messaging.service.ts`, and the installed Nest Socket.IO adapter. No backend changes.

| Direction      | Event                                      | Contract / handling                                                                                |
| -------------- | ------------------------------------------ | -------------------------------------------------------------------------------------------------- |
| Connect        | `/messaging`                               | `auth: { token: accessToken }`                                                                     |
| Emit           | `conversation:join`                        | `{ conversationId }`, after successful HTTP membership verification                                |
| Receive        | `conversation:joined`                      | `{ message, conversation }`, schema/UUID/participant validation                                    |
| Emit / receive | `conversation:leave` / `conversation:left` | `{ conversationId }`; late responses cannot clear a newer room                                     |
| Receive        | `message:new`                              | Raw presented message; validate UUID, conversation and sender participation; revalidate RTK caches |
| Receive        | `conversation:read`                        | `{ conversationId, userId, readAt }`; monotonic hints, authoritative HTTP unread state             |
| Receive        | `exception` / `error`                      | Safe room failure / authentication failure; bounded HTTP revalidation                              |

Nest emits named join/leave response events, not acknowledgement callbacks. Gateway
exceptions have no reliable room/request correlation, so recovery revalidates the
current selection without displaying raw errors. Existing HTTP send and mark-read
remain the only write transports; `message:send` and socket read writes are unused.

## Customer/Vendor behavior and safety

- Both existing workspaces share one owned socket, enabled only for verified active
  CUSTOMER/VENDOR identities. No separate page sockets or duplicate Redux message store.
- Selection changes leave the previous room. Reconnect verifies selected membership
  again and refetches detail/history/lists. Epoch checks discard delayed selection results.
- Valid broadcasts invalidate the existing RTK Query caches. Server UUID reconciliation
  and chronological history rendering prevent duplicate bubbles; counts and read state
  always come from HTTP. Duplicate/out-of-order read events cannot invent receipts.
- Token rotation replaces the captured socket. Logout, account/role replacement and
  unmount clean listeners/rooms/connections; stale callbacks cannot affect new scopes.
  JWT expiry metadata only stops realtime and requests existing HTTP session recovery;
  it never verifies identity. Automatic reconnect attempts are bounded to five.
- Existing layouts, drafts, search, pagination, request decisions, attachment display
  and HTTP sending remain intact. A small shared status/retry control explains fallback.

## Validation

- Focused messaging/socket checks: **82 passed**, including **23 new tests** covering
  lifecycle, rotation/expiry, room races, revoked membership, reconciliation, unread
  ordering, cleanup, Customer/Vendor isolation and safe fallback presentation.
- One final full regression run: **1,170 passed, 0 failed** (baseline 1,147).
- Production build (including TypeScript): passed. Repository lint: passed.
- Changed-file Prettier and repository `git diff --check`: passed.
- Initial lint findings were confined to new method bindings/test globals and corrected;
  focused tests passed again after those corrections.
- No live connections, production requests, browser automation or development servers.
  Interactive/browser layout verification was not run under repository restrictions.

## Remaining backend limitations / status

**Supported Batch 6 behavior is implemented.** The backend broadcasts messages/read
events only to conversation rooms. Although it joins user rooms, it does not broadcast
to them. With the required selected-room-only policy, new messages in unselected chats
or new requests cannot update immediately: HTTP refresh/focus/reconnect remains necessary.
Queued events for a previously selected, known conversation safely refresh its caches.
Immediate inbox-wide realtime requires backend user-room broadcasts in a later scope.

Typing, presence, delivery guarantees, per-message read receipts, deletion/clear-history,
mark-unread and attachment uploads remain unavailable. No backend, dependency or environment
changes were made. Batch 7 was not started.
