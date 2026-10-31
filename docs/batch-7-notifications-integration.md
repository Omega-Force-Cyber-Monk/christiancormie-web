# Batch 7 — Notifications integration

## Files changed

- `src/features/notifications/NotificationBell.tsx`
- `src/features/notifications/notificationNavigation.ts`
- `src/features/notifications/notifications.api.ts`
- `src/features/notifications/notifications.schema.ts`
- `src/features/notifications/notifications.test.mjs`
- `src/services/api/baseApi.ts`
- `src/layouts/DashboardLayout/TopNavbar/NavbarActions.tsx`
- `src/features/customer/components/discover/DiscoverLayout.tsx`
- `src/features/vendor/components/home/VendorHomeLayout.tsx`
- `src/features/customer/pages/CustomerOrdersPage.tsx`
- `src/features/vendor/components/requests/VendorBookingsWorkspace.tsx`
- `src/features/customer/api/bookings.test.mjs`
- `src/features/vendor/api/vendorBookings.test.mjs`
- This report.

## Verified contracts

Backend controller, service, repository, query DTO, navigation helper and Prisma
notification model were inspected without modification.

| Endpoint                                           | Contract                                                                                                                                                                     |
| -------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `GET /api/v1/notifications`                        | Plain notification array, newest first; `unreadOnly`, `limit`, `offset`. DTO accepts up to 100 but service caps results at 50; frontend validates 1–50 and uses pages of 20. |
| `GET /api/v1/notifications/unread-count`           | `{unreadCount}`                                                                                                                                                              |
| `PATCH /api/v1/notifications/:notificationId/read` | Notification record, including the already-read case; no request body.                                                                                                       |
| `PATCH /api/v1/notifications/read-all`             | `{updatedCount}`; no request body.                                                                                                                                           |

Schemas validate UUIDs, owner, backend type, text, nullable association IDs,
metadata/action URL, read state and ISO timestamps. Lists retain the returned
truck/booking/post relations. Individual mutation results must match the selected
notification, owner and confirmed read state. List/count errors are never empty success.

## Working UI, navigation and synchronization

- Existing Customer, Vendor and standard dashboard bells share RTK Query unread data.
  Sample counts/previews were replaced by real read/unread rows, text details, UTC
  timestamps, unread filtering, Previous/Next, refresh, loading/error/retry and read actions.
  Existing round/square triggers, shell styles and responsive dropdown patterns remain.
- Shared `Notifications` / `UnreadCount` tags refresh mounted consumers after writes,
  including uncertain failures. No optimistic clearing or duplicate notification store.
  A shared session write lock prevents concurrent individual/read-all submissions;
  inline failures and Sonner remain recoverable. Opening a link does not claim it was read.
- Queries and actions require a verified active CUSTOMER/VENDOR session. Cache keys
  include session, user and role; existing logout/replacement cache cleanup is preserved.
  Late responses and UI callbacks are checked against the current session.
- Navigation uses validated metadata IDs and hardcoded role-appropriate route constants:
  bookings and conversations for both roles; Community requests, food-truck profiles
  and booking issue history for Customer. Conflicting IDs, unsafe/reserved truck slugs,
  unknown targets and unsupported roles fall back to notification text. `actionUrl` and
  mobile deep links are never followed. Destination APIs/guards still enforce ownership.
- Booking URLs now use `?booking=<UUID>` in existing Orders views. Customer selection
  must also occur in its server-owned list; Vendor detail retains its verified vendor
  authorization. Booking issues open the associated booking's existing issue history,
  where the user selects the actual returned issue; no issue association is assumed.

## Validation

- Focused notification/booking regressions: **136 passed**.
- One final full suite: **1,226 passed, 0 failed** (baseline 1,170; 56 new tests).
- Production build, including TypeScript: **passed**.
- Repository lint: **passed**.
- Changed-file Prettier and repository `git diff --check`: **passed**.
- Coverage includes all four contracts, filters/pagination, owner/UUID validation,
  shared counts/cache invalidation, read/read-all failures, duplicate writes, 401 refresh,
  403/404/5xx/network recovery, session isolation, safe targets, Customer/Vendor navbar
  rendering and booking URL selection. Existing booking SSR tests now include a router.
- All tests use mocked HTTP and server-free execution. No live API calls, browser
  automation or interactive responsive checks were performed under repository restrictions.

## Remaining limitations / status

All supported Batch 7 functionality is implemented. The list has no total/next-page
envelope; Next is offered for full pages and an exhausted page can be empty. There is
no dedicated Vendor Community or booking-issue screen, or verified web detail route for
every notification entity (for example payments/refunds). Those targets show safe text
instead of guessed links. Truck navigation requires a real usable slug as well as UUID.

HTTP is authoritative; focus/reconnect/open/manual refresh update notifications. No push
registration, permission prompt, service worker, polling or notification socket events
were added. Backend, environment and dependencies are unchanged. Batch 8 was not started.
