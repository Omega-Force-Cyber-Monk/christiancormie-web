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
  explicitly track verified identity; persisted sessions require `/users/me`
  validation before role-based access. Login tokens also remain unverified until
  this current-user request succeeds. A definitive initialization 401 clears
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
- `package.json`: the foundation task added `npm test` using Node's built-in runner
  and colocated tests. Its original Vite middleware transformer has since been
  replaced by the server-free production-build workflow below. No dependencies
  were added.

## Checks

Verified during the foundation task, before the current-user migration: TypeScript,
ESLint, production build, and all 22 regression tests passed. Changed files passed formatting, and `git diff
--check` passes. The available browser inventory was empty, so interactive
keyboard, screen-reader, and responsive visual smoke checks remain pending.

Follow the validation policy in [AGENTS.md](../AGENTS.md). For application code,
use focused checks during implementation, then one final `npm run build` (includes
TypeScript checking), `npm run lint`, changed-file formatting checks,
`git diff --check` and relevant permitted regressions. Standalone typecheck is
useful during development or when build cannot provide the required verification;
do not repeat successful checks without relevant changes. Documentation-only tasks
need Markdown/link/diff validation; read-only tasks do not run builds/tests unless
explicitly requested. Use `npm.cmd` when PowerShell blocks `npm.ps1`.

`npm test` now uses the server-free workflow below. The old Vite middleware loader
was removed; test assertions were retained and source imports replaced loader calls.
Tests are permitted only after confirming their execution path initializes no
server or browser. Regression coverage includes formatting, null/error handling,
pagination, identity initialization and dialog ownership.
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

The current-user migration's `src/features/auth/utils/current-user.regression.mjs`
is included automatically, covering normalization, roles, login verification,
refresh and stale-session handling. The runner guard has its own regression test.

### Server-free regression workflow

```bash
# All colocated regressions under src
npm test
# One or more explicit files (only selected files are bundled/executed)
npm test -- src/features/auth/store/auth.test.mjs
npm test -- src/features/auth/utils/current-user.regression.mjs
# Optional Node test-runner flags use the equals form
npm test -- src/components/overlays/dialogLifecycle.test.mjs --test-name-pattern=Escape
```

Use `npm.cmd` in PowerShell when necessary. `--test-name-pattern=`,
`--test-reporter=` and `--test-timeout=` are supported; paths must be existing
`.test.mjs` or `.regression.mjs` files inside `src`. Empty discovery, invalid paths,
build failures and test failures exit unsuccessfully.

`src/lib/testing/runTests.mjs` discovers only source tests, invokes Vite's production
`build` API using the existing `vite.config.ts`, and runs Node's built-in test runner
with separate processes per test file. It does not call `createServer`, `preview`,
watch mode or a browser. Unique build output lives under ignored
`node_modules/.tmp/regression-tests` and is removed after each run, including failures.
No dependencies were added. Source maps retain source locations in failures.

Write future tests next to their owning behavior, using `node:test`,
`node:assert/strict` and direct imports of source `.ts`/`.tsx` modules. Use ordinary
static imports or statically resolvable dynamic imports; the old arbitrary-path
`loadModule` helper is unavailable. Shared imports retain module identity within
each test process, while different test files have independent module/global state.
Restore mutable mocks in `finally`, unsubscribe and reset RTK Query caches, and
avoid concurrent tests sharing global mocks.

The existing Vite plugins handle TS/TSX, JSX, `@/` aliases, JSON, assets and CSS
imports through the SSR build. CSS is processed as build output, not rendered in a
DOM; browser-only imports may need a suitable test boundary. React static markup
and explicit DOM doubles are supported, not browser layout/focus/screen-reader QA.
Dependencies follow Vite's SSR externalization; arbitrary runtime source paths,
HMR, browser module mocking and development-server behavior are not supported.
Bundling does not replace the final production build's TypeScript checking.

Local `.env` files are disabled. Build-time `import.meta.env` uses production SSR
semantics with mock auth disabled, an empty socket URL and the fixed test API base
`https://example.invalid/api/v1`. Tests requiring HTTP must replace `globalThis.fetch`
with local responses and restore it afterward. `serverFreeGuard.mjs` runs before
build/test imports and blocks standard Node server factories/listeners, socket
connections, HTTP requests and unmocked fetch. Its guard regression verifies these
calls throw before initialization. This is an accidental-I/O guard, not a security
sandbox; inspect new tests/plugins and do not add server/browser execution paths.

The existing Figma exports fail the full formatting check. They are deliberately
unchanged. Do not run a repository-wide formatting write as part of design work.

## Backend confirmation still required

- The exact `/auth/refresh` response shape. `/users/me` now follows the supplied
  current-user contract, preserving its full response and normalizing dashboard
  name/avatar/role separately. Unexpected responses block access and permit retry.
- Token expiry units and policy. `expiresAt` is not interpreted as seconds or
  milliseconds without a contract, and a stored deadline alone is not used to
  discard refreshable credentials.
- Definitive refresh rejection statuses beyond the existing explicit 401,
  server-side logout/revocation, and access-token storage policy.
- Role precedence for multiple supported roles. Empty/unknown-only roles and
  multiple distinct supported roles are gated without a fallback role. Duplicate
  instances of one supported role are unambiguous. The raw roles array is retained;
  no new roles or permission system were introduced.
- List pagination envelopes, mutations for unfinished admin controls, messaging,
  uploads, payouts, rewards, and socket authentication/reconnection contracts.

## Design work

Keep assets feature-local and reuse the current layout/shared primitives. The
Figma primitive exports contain different purple/orange brand modes; no mode was
selected or integrated during this task. Confirm design authority before any
token migration. Static frontend work can use `VITE_ENABLE_MOCK_AUTH=true` locally;
this flag never enables mock identity in a production build.
