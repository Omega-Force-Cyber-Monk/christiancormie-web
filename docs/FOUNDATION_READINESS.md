# Frontend foundation readiness

Prepared 14 October 2026. This preparation preserves route paths, role-only
authorization, API endpoints, design palette, Figma exports, and existing page
layouts. It does not implement unfinished business features.

## Foundation changes

- `src/app/store.ts`: initialize RTK Query focus/reconnect listeners.
- `src/services/api/authBaseQuery.ts`: reuse rotated persisted tokens without
  passing nullable or unverified persisted identity into a refresh response.
- `src/features/auth/types/auth.types.ts`, `store/auth.slice.ts`,
  `store/auth.selectors.ts`, `store/auth.thunks.ts`, `store/auth.middleware.ts`:
  explicitly track verified identity; persisted sessions require `/auth/me`
  validation before role-based access. Successful login remains verified through
  the existing validated login response. A definitive initialization 401 clears
  the session; temporary failures retain credentials for retry.
- `src/features/auth/components/SessionBootstrap.tsx`, `SessionGate.tsx`,
  `src/router/guards/AuthGuard.tsx`, `GuestGuard.tsx`: session initialization is
  global, while loading/error/retry gates apply to protected and guest-only
  routes. Public information pages remain available. Users can abandon a failed
  restoration with “Sign in again”.
- `src/components/overlays/dialogLifecycle.ts`, `useDialogLifecycle.ts`,
  `Modal/Modal.tsx`: one document-level lifecycle owns the active dialog stack,
  background isolation, Tab/Shift+Tab, topmost Escape, scroll locking, and focus
  restoration. Portal wrappers inherit the caller's CSS variables and typography.
- `src/components/overlays/ConfirmationDialog/ConfirmationDialog.tsx`,
  `useConfirmation.ts`, `confirmation.types.ts`: catch failed operations, keep
  errors in the dialog, prevent duplicate submissions, and use unique ARIA IDs.
- `src/components/data-display/DataTable/DataTable.tsx`, `DataTableBody.tsx`,
  `DataTableHeader.tsx`, `DataTableToolbar.tsx`, `DataTablePagination.tsx`,
  `data-table.types.ts`, `pagination.ts`: the existing dark styling is now a
  generic `contrast` variant, with generic search labeling, responsive search
  width, sort announcements, accessible paging controls, and defensive bounds.
- `src/features/admin/pages/AdminBookingsPage.tsx`: consume `contrast` without
  changing the booking table's appearance.
- `src/features/admin/pages/AdminUsersPage.tsx`: page-size selection changes the
  row slice and current page is clamped when results shrink.
- `src/components/forms/FormField.tsx`: unique label/input IDs and merged error
  descriptions. `FileUpload/FileUpload.tsx`, `FileDropzone.tsx`,
  `FileUploadItem.tsx`, `FilePreview.tsx`: disabled means no selection/removal;
  file picker hints reflect validation options; object URLs are created and
  revoked in effects, including StrictMode cleanup.
- `src/components/states/ErrorState.tsx`, `src/components/feedback/InlineLoader.tsx`:
  announce asynchronous errors and status.
- `src/layouts/DashboardLayout/DashboardLayout.tsx`, `Sidebar/MobileSidebar.tsx`,
  `TopNavbar/UserMenu.tsx`: remove the unintended admin width class from other
  roles, stabilize mobile close callbacks, share dialog focus management, close
  mobile navigation on desktop resize, and use native disclosure/link semantics
  with Escape focus restoration for account navigation. Admin desktop sidebar
  remains intentionally expanded; other roles retain existing collapse behavior.
- `src/features/admin/utils/adminFormat.ts`,
  `src/features/admin/pages/AdminPaymentsPage.tsx`: invalid/missing values display
  `N/A`; real zero remains zero; currency preserves cents; invalid dates are safe.
- `src/utils/errors/normalizeApiError.ts`: tolerate null/primitive error values,
  classify timeout/network failures, and avoid exposing 5xx response messages.
- `src/utils/files/formatFileSize.ts`: handle negative/nonfinite byte counts safely.
- `.env.example`, `README.md`: document the existing explicit development mock
  flag and remove the nonexistent examples-route instruction.
- `package.json`: add `npm test` using Node's built-in runner. Tests live next to
  the behavior they verify; `src/lib/testing/loadModule.mjs` uses the existing
  Vite transformer for TypeScript/JSX and aliases. No dependencies were added.

## Checks

Verified in this task: TypeScript, ESLint, production build, and all 22 regression
tests pass. Changed source/documentation files pass formatting, and `git diff
--check` passes. The available browser inventory was empty, so interactive
keyboard, screen-reader, and responsive visual smoke checks remain pending.

Run `npm run typecheck`, `npm run lint`, `npm test`, `npm run build`, and
`npm run format:check`. In Windows PowerShell installations that block `npm.ps1`,
use `npm.cmd` instead. Regression tests cover formatting, null/error handling,
pagination, identity restoration/initialization, and dialog lifecycle ownership.
Dialog lifecycle unit tests use a small DOM double and do not establish browser
rendering, screen-reader behavior, or mobile layout fidelity.

Added test files:

- `src/features/admin/utils/adminFormat.test.mjs`
- `src/utils/errors/normalizeApiError.test.mjs`
- `src/components/data-display/DataTable/pagination.test.mjs`
- `src/components/forms/FormField.test.mjs`
- `src/components/overlays/dialogLifecycle.test.mjs`
- `src/features/auth/store/auth.test.mjs`
- `src/router/routes/routes.test.mjs`

The existing Figma exports fail the full formatting check. They are deliberately
unchanged. Do not run a repository-wide formatting write as part of design work.

## Backend confirmation still required

- The exact `/auth/me` and `/auth/refresh` response shapes. Current schemas are
  preserved; unexpected responses block protected access and permit retry.
- Token expiry units and policy. `expiresAt` is not interpreted as seconds or
  milliseconds without a contract, and a stored deadline alone is not used to
  discard refreshable credentials.
- Definitive refresh rejection statuses beyond the existing explicit 401,
  server-side logout/revocation, and access-token storage policy.
- Role precedence for multiple roles or an empty role list. The existing login
  adapter is unchanged; no new roles or permission system were introduced.
- List pagination envelopes, mutations for unfinished admin controls, messaging,
  uploads, payouts, rewards, and socket authentication/reconnection contracts.

## Design work

Keep assets feature-local and reuse the current layout/shared primitives. The
Figma primitive exports contain different purple/orange brand modes; no mode was
selected or integrated during this task. Confirm design authority before any
token migration. Static frontend work can use `VITE_ENABLE_MOCK_AUTH=true` locally;
this flag never enables mock identity in a production build.
