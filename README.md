# Christina Cormie Frontend

Production-ready React dashboard foundation for a large role-based application.

## Stack

- Vite 8
- React 19
- TypeScript 6
- React Router 8
- Redux Toolkit 2 with RTK Query
- React Redux 9
- Tailwind CSS 4
- Lucide React
- Recharts
- Sonner
- Socket.IO Client
- React Hook Form
- Zod

## Prerequisites

- Node.js `>=22.22.0`
- npm `>=10`

React Router 8 currently declares `node >=22.22.0`, so use that patch level or newer.

## Setup

```bash
npm install
cp .env.example .env
npm run dev
```

Environment values:

```env
VITE_API_BASE_URL=
VITE_SOCKET_URL=
```

Do not put server secrets in frontend environment variables.

All role-specific pages require a verified sign-in. Local fixture data remains available within those protected pages; development flags do not grant access.

## Commands

```bash
npm run dev
npm run typecheck
npm test
npm run lint
npm run format
npm run format:check
npm run build
```

## Folder Structure

```text
src/
├── app/                 # Redux store, hooks, root reducer
├── components/          # Generic shared UI, charts, feedback
├── config/              # App, env, and navigation config
├── constants/           # Roles, route paths, storage keys
├── features/            # Feature-owned pages, state, API, types
├── layouts/             # Shared dashboard layout
├── router/              # Router, route modules, guards
├── services/            # RTK Query base API and Socket.IO service
├── styles/              # Tailwind globals and design tokens
├── types/               # Shared domain types
└── utils/               # Shared utilities
```

## Role Architecture

Roles are centralized in `src/constants/roles.ts` and exported as constants plus a
derived `UserRole` type. Login persists tokens, then `/users/me` verifies identity;
persisted sessions are also revalidated through this endpoint before protected
routes render. Static fixture data never grants authenticated identity or role access.

## Routing

Routes live under `src/router`. Public, customer, vendor, vendor-staff, and admin routes are split into separate modules. `AuthGuard`, `GuestGuard`, and `RoleGuard` keep authorization logic out of page components. Authenticated routes share one `DashboardLayout`.

## Redux and RTK Query

Redux setup lives in `src/app`. Typed hooks are exported from `src/app/hooks.ts`. Server state belongs in RTK Query; feature APIs should inject endpoints into `src/services/api/baseApi.ts` rather than creating new API slices.

Authentication headers, 401 handling, token refresh, and retry behavior are centralized in `src/services/api/authBaseQuery.ts`. Concurrent 401 responses share a single refresh promise so one refresh request runs while other failed requests wait. The current refresh endpoint is a documented placeholder until the backend contract is available.

## Forms and Validation

Forms use React Hook Form and Zod. Feature-owned schemas live near their forms, for example `src/features/auth/schemas/login.schema.ts`. Shared lightweight primitives live under `src/components/forms`. Backend field errors should be normalized to `AppError` and mapped with `applyServerFieldErrors`.

## Error Handling

`src/utils/errors` defines the shared `AppError` model and API normalization helpers. `AppErrorBoundary` wraps the app and shows a production-safe fallback for unexpected render/runtime errors while exposing additional details in development.

## Dialogs and Confirmation

Reusable modal primitives live under `src/components/overlays/Modal`. `ConfirmationDialog` and `useConfirmation` provide the destructive-action workflow. Do not use `window.confirm()`.

## DataTable and URL State

`src/components/data-display/DataTable` is presentational: features own fetching, filters, and API adaptation. Reusable search-parameter helpers in `src/router/search-params` parse and update page, page size, search, sort, and filters defensively. Search/filter/page-size changes reset pagination to page 1.

## File Uploads

Upload primitives live under `src/components/forms/FileUpload`, with validation helpers in `src/utils/files`. Frontend checks are only UX validation; backend services must verify content, size, permissions, ownership, and storage path.

## Route Metadata and Document Titles

Route metadata lives in `src/router/metadata/routeMetadata.ts`. `RouteTitleManager` derives document titles from metadata. Avoid setting `document.title` inside pages.

## Logging

Use `src/lib/logger/logger.ts` instead of random console statements. Debug logging is disabled in production, and sensitive data must never be logged.

## Debounce and Request Lifecycle

Use `useDebounce` for value-based search debouncing. Prefer RTK Query for request cancellation and lifecycle behavior; manual async work should use cancellation where stale responses could update UI.

## Architecture Linting

ESLint blocks random `console`, browser alerts/confirms, direct `fetch`, direct `document.title` mutations outside the title system, and private feature-internal imports. These rules are intentionally small guardrails rather than a separate framework.

## Socket.IO

Socket.IO is centralized in `src/services/socket`. Components should use the service or `useSocket` hook instead of creating direct `io()` connections. Event subscriptions return cleanup functions to prevent listener leaks.

## Responsive Layout

The dashboard uses a flex layout with a desktop sidebar and a mobile drawer. Desktop sidebar collapsed state is separate from mobile drawer state. Main content uses `min-width: 0`, constrained max width, responsive spacing, and Recharts `ResponsiveContainer` to prevent horizontal overflow.

The mobile drawer now locks background scroll, supports Escape to close, and restores focus when dismissed.

## Examples

Shared DataTable, confirmation, and file-upload primitives are available for feature
pages. There is currently no `/dashboard/admin/examples` route.

## Documentation

- [`AGENTS.md`](./AGENTS.md): mandatory development rules and constraints.
- [`docs/FOLDER_STRUCTURE.md`](./docs/FOLDER_STRUCTURE.md): detailed architecture and folder-placement guide.
- [`docs/FOUNDATION_READINESS.md`](./docs/FOUNDATION_READINESS.md): scoped foundation fixes, regression checks, and backend questions.
- `README.md`: setup, stack, commands, and high-level onboarding.

## AI Contribution Rules

Read `AGENTS.md` before making changes. It is the canonical development constitution for AI coding agents and covers architecture, state, routing, styling, dependencies, and quality gates.
