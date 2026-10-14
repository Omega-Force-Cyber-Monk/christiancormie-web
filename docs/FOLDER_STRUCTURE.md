# Frontend Folder Structure

This document explains the real current architecture of the Christina Cormie frontend. It is meant to help a frontend developer understand where code belongs, how folders relate to each other, and how data flows through the application.

`AGENTS.md` is the mandatory rule file. This document is the learning guide.

## Current Structure

Noisy generated folders such as `node_modules`, `dist`, and `.git` are intentionally omitted.

```text
christinacormie-frontend/
├── AGENTS.md
├── README.md
├── docs/
│   └── FOLDER_STRUCTURE.md
├── src/
│   ├── app/
│   │   ├── hooks.ts
│   │   ├── rootReducer.ts
│   │   └── store.ts
│   ├── assets/
│   ├── components/
│   │   ├── charts/
│   │   ├── common/
│   │   ├── data-display/
│   │   │   └── DataTable/
│   │   ├── errors/
│   │   ├── feedback/
│   │   ├── forms/
│   │   │   └── FileUpload/
│   │   ├── navigation/
│   │   ├── overlays/
│   │   │   ├── ConfirmationDialog/
│   │   │   └── Modal/
│   │   ├── states/
│   │   └── ui/
│   ├── config/
│   │   └── navigation/
│   ├── constants/
│   ├── features/
│   │   ├── admin/
│   │   ├── auth/
│   │   ├── customer/
│   │   ├── dashboard/
│   │   ├── examples/
│   │   ├── vendor/
│   │   └── vendor-staff/
│   ├── hooks/
│   ├── layouts/
│   │   └── DashboardLayout/
│   │       ├── Sidebar/
│   │       └── TopNavbar/
│   ├── lib/
│   │   └── logger/
│   ├── router/
│   │   ├── guards/
│   │   ├── metadata/
│   │   ├── routes/
│   │   └── search-params/
│   ├── services/
│   │   ├── api/
│   │   └── socket/
│   ├── styles/
│   ├── types/
│   ├── utils/
│   │   ├── errors/
│   │   └── files/
│   ├── App.tsx
│   └── main.tsx
├── eslint.config.js
├── package.json
├── tsconfig.app.json
├── tsconfig.json
└── vite.config.ts
```

## Architecture Style

The project uses a feature-first, responsibility-separated architecture.

Feature-first means business code stays near the domain that owns it. Auth pages, auth schemas, auth Redux state, and auth utilities live under `src/features/auth`. Vendor pages live under `src/features/vendor`. Shared reusable infrastructure lives outside features only when it is genuinely reusable.

Responsibility-separated means routing, Redux setup, API infrastructure, layouts, shared UI, services, utilities, and feature code each have clear places. This keeps the app scalable for a large dashboard: teams can add features without creating giant global folders or duplicating layout, API, validation, modal, table, or error-handling patterns.

The main rule is practical: place code where the next developer would naturally look for it.

## `src/app`

`src/app` contains application-level Redux setup:

```text
app/
├── hooks.ts
├── rootReducer.ts
└── store.ts
```

Responsibilities:

- Configure the Redux store.
- Combine reducers in `rootReducer.ts`.
- Add RTK Query middleware.
- Export typed Redux hooks from `hooks.ts`.
- Export `RootState` and `AppDispatch`.

What belongs here:

- Store configuration.
- App-wide Redux wiring.
- Typed `useAppDispatch` and `useAppSelector`.

What does not belong here:

- Business feature components.
- Page components.
- Feature-specific reducers unless they are imported into the root reducer.
- API endpoint definitions. Feature endpoints should inject into `baseApi` from their owning feature.

## `src/router`

`src/router` owns application routing, route guards, route metadata, document title behavior, and URL search-parameter helpers.

```text
router/
├── RouteTitleManager.tsx
├── guards/
│   ├── AuthGuard.tsx
│   ├── DashboardRedirect.tsx
│   ├── GuestGuard.tsx
│   └── RoleGuard.tsx
├── index.tsx
├── metadata/
├── routes/
└── search-params/
```

`index.tsx` is the central router entry. It composes route modules and places authenticated routes under `DashboardLayout`.

Route modules in `router/routes` split routes by concern:

- `public.routes.tsx`
- `customer.routes.tsx`
- `vendor.routes.tsx`
- `vendor-staff.routes.tsx`
- `admin.routes.tsx`
- route-level pages such as `ErrorPage`, `NotFoundPage`, and `UnauthorizedPage`

Route guards:

- `AuthGuard` allows only authenticated users into protected route branches.
- `GuestGuard` keeps authenticated users out of guest-only routes such as login.
- `RoleGuard` checks the current user's role before allowing access to role-specific routes.
- `DashboardRedirect` sends an authenticated user from `/dashboard` to the correct role home route.

The project currently uses role-based authorization only. Supported roles are:

```text
CUSTOMER
VENDOR
VENDOR_STAFF
ADMIN
```

There is no fine-grained permission system in the current codebase. Do not document or implement one unless backend/product requirements introduce it later.

`router/metadata` centralizes route titles, breadcrumbs, role metadata, and navigation-related metadata. `RouteTitleManager` uses this metadata to update document titles. Page components should not set `document.title` themselves.

`router/search-params` contains helpers for URL-driven table/search state. It parses `page`, `pageSize`, `search`, `sort`, `order`, and filter parameters defensively.

Routing is kept separate from Redux and `App.tsx` so route concerns do not turn into page implementation or global state logic.

## `src/layouts`

A layout is a reusable shell around routed content. A page is a specific screen inside that shell.

The current layout is:

```text
DashboardLayout/
├── DashboardLayout.tsx
├── Sidebar/
└── TopNavbar/
```

Conceptually:

```text
DashboardLayout
├── Sidebar
├── TopNavbar
└── Main Content / Outlet
```

All authenticated roles use the same visual dashboard shell. The project intentionally does not create separate `AdminLayout`, `VendorLayout`, `CustomerLayout`, and `VendorStaffLayout` because the shell is the same. Role differences are handled by route guards, navigation configuration, and page content.

The layout owns shell UI such as:

- Desktop sidebar expanded/collapsed state.
- Mobile sidebar drawer state.
- Top navbar placement.
- `<Outlet />` placement for routed pages.

It should not own feature-specific business workflows.

## `src/features`

`src/features` is where business-specific code lives.

Current features:

```text
features/
├── admin/
├── auth/
├── customer/
├── dashboard/
├── examples/
├── vendor/
└── vendor-staff/
```

The most complete current feature is `auth`:

```text
features/auth/
├── api/
├── components/
│   └── forms/
├── hooks/
├── pages/
├── schemas/
├── store/
├── types/
└── utils/
```

Meaning of feature subfolders:

- `api`: RTK Query endpoint injection for that feature.
- `components`: feature-owned UI components.
- `components/forms`: feature-owned forms.
- `hooks`: feature-specific React hooks. This folder exists for `auth`; it may be empty until needed.
- `pages`: route-level page components for the feature.
- `schemas`: Zod validation schemas owned by the feature.
- `store`: feature Redux slices/selectors for meaningful shared client state.
- `types`: feature-specific TypeScript types.
- `utils`: feature-specific helpers.

Business-specific code should stay close to the owning feature. For example, an `OrderCard` used only by an orders feature should live in `features/orders/components` when that feature exists.

Shared UI belongs outside features only when it is truly generic. For example, `Modal` belongs in `src/components/overlays` because many features can use it.

Recommended future structure for a new business feature:

```text
features/orders/
├── api/
├── components/
├── hooks/
├── pages/
├── schemas/
├── store/
├── types/
└── utils/
```

Only create subfolders that the feature actually needs.

## `src/components`

`src/components` is for truly reusable shared UI and UI infrastructure.

Current subfolders:

```text
components/
├── charts/
├── common/
├── data-display/
├── errors/
├── feedback/
├── forms/
├── navigation/
├── overlays/
├── states/
└── ui/
```

Responsibilities:

- `charts`: reusable chart components such as `ResponsiveAreaChart`.
- `common`: generic composition pieces such as `PageHeader`.
- `data-display`: reusable data display systems, currently `DataTable`.
- `errors`: application error boundary and fallback UI.
- `feedback`: loading components such as `PageLoader` and `InlineLoader`.
- `forms`: form primitives and generic upload UI.
- `navigation`: reserved for shared navigation components when needed.
- `overlays`: modal/dialog and confirmation workflow.
- `states`: empty, no-results, skeleton, and error states.
- `ui`: low-level primitives such as `Button`.

What should not go here:

- Business-specific components.
- Components that only one feature uses.
- API-aware components that fetch feature data directly.

If a component knows about vendors, orders, customers, payouts, or a single domain workflow, it probably belongs in a feature.

## `src/services`

`src/services` contains shared external communication and infrastructure.

```text
services/
├── api/
└── socket/
```

### API

```text
services/api/
├── api.types.ts
├── authBaseQuery.ts
├── baseApi.ts
└── baseQuery.ts
```

`baseQuery.ts` defines the raw RTK Query base query and attaches auth headers from Redux state.

`authBaseQuery.ts` wraps the raw base query with centralized 401 handling:

```text
API request
 ↓
authBaseQuery
 ↓
401?
 ├── No → return response
 └── Yes → refresh session
          ↓
          retry original request if refresh succeeds
```

Concurrent 401 handling is centralized with a shared refresh promise. If multiple requests fail with 401 at the same time, one refresh attempt runs and the others wait for it instead of each starting their own refresh.

`baseApi.ts` creates the shared RTK Query API slice. Feature APIs should inject endpoints into this shared `baseApi`:

```text
feature API
 ↓
shared baseApi
 ↓
authBaseQuery
 ↓
backend
```

Do not create raw API clients inside React components. Do not call backend APIs directly from pages. Use RTK Query endpoint injection from the owning feature.

The current refresh endpoint is a backend integration placeholder. The frontend architecture is ready, but real endpoint paths, response shapes, token expiration policy, and logout/session semantics must be confirmed with the backend.

### Socket

```text
services/socket/
├── socket.ts
├── socket.types.ts
└── useSocket.ts
```

Socket.IO ownership is centralized here. Components should not call `io()` directly because that can create duplicate connections and listener leaks. Use `socketService` or `useSocket`.

## `src/config`

`src/config` holds configuration-driven behavior.

```text
config/
├── app.config.ts
├── env.ts
└── navigation/
```

`app.config.ts` centralizes app display values such as the application name.

`env.ts` normalizes Vite environment values such as `VITE_API_BASE_URL` and `VITE_SOCKET_URL`. Components should not repeatedly read `import.meta.env` directly.

`navigation` contains role-driven navigation configuration. Sidebar UI consumes this config instead of hardcoding role-specific sidebars.

Conceptually:

```ts
{
  label: "Orders",
  path: "/dashboard/customer/orders",
  allowedRoles: [USER_ROLES.CUSTOMER],
}
```

UI rendering should consume configuration and filter by current role instead of scattering role checks across sidebar components.

## `src/constants`

`src/constants` contains centralized fixed values:

```text
constants/
├── roles.ts
├── routes.ts
└── storage.ts
```

Use `USER_ROLES.ADMIN` instead of repeatedly writing `"ADMIN"`. This keeps role values typed and prevents typo-driven bugs.

Use `ROUTES.ADMIN_USERS` instead of repeating `"/dashboard/admin/users"` throughout the app.

Use storage constants instead of scattering local-storage keys across components.

## `src/hooks`

`src/hooks` is for shared React hooks that are not owned by one business feature.

Current shared hook:

```text
hooks/useDebounce.ts
```

Decision rule:

- `useDebounce` belongs in `src/hooks` because many features may need debounced values.
- A future `useOrderFilters` should live in `src/features/orders/hooks` if it is order-specific.
- A future `useVendorSearch` should live in `src/features/vendor/hooks` if only vendor screens use it.

## `src/utils`

`src/utils` contains small, predictable, reusable helper functions.

Current utilities:

```text
utils/
├── errors/
├── files/
└── storage.ts
```

`utils/errors` normalizes API/backend errors into the shared `AppError` model and maps backend validation errors to React Hook Form fields.

`utils/files` formats file sizes and performs client-side upload validation.

`storage.ts` wraps browser storage access so components do not call localStorage directly.

Utilities should be small and easy to test. If a helper becomes feature-specific, keep it inside that feature instead.

## `src/lib`

`lib` is for reusable infrastructure wrappers. It differs from `utils` like this:

```text
utils = small helper functions
lib = reusable infrastructure wrappers
```

Current library:

```text
lib/logger/
├── logger.ts
└── logger.types.ts
```

The centralized logger makes it possible to later integrate production monitoring, such as Sentry or another service, without rewriting every feature. Feature code should use `logger` instead of raw console statements.

## `src/types`

`src/types` is for truly shared domain types.

Current shared type:

```text
types/user.types.ts
```

Good use:

- `AuthenticatedUser`, because auth, routing, layout, and navigation may all need to understand the current user.

Bad use:

- Dumping every feature interface into `src/types`.
- Putting vendor-only response shapes in global types.
- Duplicating a feature type that already exists in the owning feature.

Feature-specific types should stay inside the feature.

## `src/styles`

`src/styles` contains global styling foundations.

Current file:

```text
styles/globals.css
```

It owns:

- Tailwind CSS import.
- Global CSS variables and design tokens.
- Body/root styles.
- Global focus/body defaults.

Feature-specific styling should not accumulate here. Prefer component-level Tailwind classes and shared tokens.

## `src/assets`

`src/assets` exists for static frontend assets when needed. It is currently empty. Add files here only when they are application assets that should be bundled with the frontend.

## `App.tsx`

`App.tsx` composes root-level application systems:

- `AppErrorBoundary`
- `RouterProvider`
- global Sonner `Toaster`

It should not contain:

- Route definitions.
- Page implementations.
- Business logic.
- API calls.
- Large provider-specific workflows that belong elsewhere.

Route title handling is inside the router tree through `RouteTitleManager`, not hardcoded in `App.tsx`.

## `main.tsx`

`main.tsx` is the application bootstrapping entry point.

It renders React into `#root`, wraps the app in React `StrictMode`, and provides the Redux store through React Redux `Provider`.

It should stay small. Do not add page logic or routing definitions here.

## Where Should This File Go?

Use this decision tree:

```text
Is it business-specific?
├── Yes → src/features/<feature>/
└── No
    ↓
Is it reusable UI?
├── Yes → src/components/
└── No
    ↓
Is it a shared React hook?
├── Yes → src/hooks/
└── No
    ↓
Is it API/socket infrastructure?
├── Yes → src/services/
└── No
    ↓
Is it a small pure helper?
├── Yes → src/utils/
└── No
    ↓
Is it app configuration or a fixed value?
├── Config → src/config/
└── Constant → src/constants/
```

Examples:

- `OrderFilter`: `src/features/orders/components` when an orders feature exists, because it is business-specific.
- `VendorCard`: `src/features/vendor/components` if only vendor screens use it.
- `Modal`: `src/components/overlays/Modal`, because it is generic UI.
- `useVendorSearch`: `src/features/vendor/hooks`, unless multiple domains reuse it.
- `useDebounce`: `src/hooks`, because it is a shared generic hook.
- `formatCurrency`: `src/utils` if shared; otherwise keep a domain-specific formatter inside the owning feature.
- `users.api.ts`: the owning feature's `api` folder, injecting endpoints into `baseApi`.

## State Management Guide

Use the smallest state owner that fits:

```text
Temporary UI state → local React state
Shared client state → Redux Toolkit
Backend/server state → RTK Query
Shareable navigation/filter state → URL search params
```

Examples from this project:

- Sidebar collapsed/open state is local layout state, with collapsed preference persisted through the storage utility.
- Auth/session state is Redux because route guards, layout, API headers, and navigation need it.
- Server state should live in RTK Query cache, not duplicated into normal Redux slices.
- DataTable search/page/sort state can live in URL search params so views are shareable and back/forward friendly.

## Request Flow Example

Example route flow:

```text
User visits /dashboard/admin/users
 ↓
React Router
 ↓
AuthGuard
 ↓
DashboardLayout
 ↓
RoleGuard for ADMIN route branch
 ↓
Admin Users Page
 ↓
Feature page/component
 ↓
Feature RTK Query endpoint
 ↓
baseApi/authBaseQuery
 ↓
Backend
```

Sidebar flow:

```text
DashboardLayout
 ↓
current role from Redux auth state
 ↓
navigation config
 ↓
filter items by allowedRoles
 ↓
Sidebar renders visible items
```

## Form Flow Example

Typical form flow:

```text
Page
 ↓
Feature Form
 ↓
React Hook Form
 ↓
Zod schema validation
 ↓
RTK Query mutation
 ↓
normalizeApiError
 ↓
field errors / form error / toast as appropriate
```

Where each part lives:

- Page: `src/features/<feature>/pages`
- Feature form: `src/features/<feature>/components/forms`
- Zod schema: `src/features/<feature>/schemas`
- RTK Query mutation: `src/features/<feature>/api`
- API error normalization: `src/utils/errors`
- Shared field UI: `src/components/forms`

## Table Flow Example

Typical server-driven table flow:

```text
URL search params
 ↓
page/search/sort/filter state
 ↓
feature page
 ↓
RTK Query endpoint
 ↓
feature adapts API response
 ↓
shared DataTable renders rows
```

`DataTable` does not call feature APIs. It receives data, columns, loading state, error state, pagination callbacks, and row actions. This keeps it reusable across domains.

## Auth Flow Example

Current centralized API auth/session flow:

```text
API request
 ↓
baseApi
 ↓
authBaseQuery
 ↓
rawBaseQuery attaches access token
 ↓
backend response
 ↓
401?
 ├── No → return response
 └── Yes → run one shared refresh request
          ↓
          refresh succeeds?
          ├── Yes → update session and retry original request
          └── No → clear session
```

Backend integration points still need real backend details:

- Refresh endpoint contract.
- Token expiration policy.
- Logout endpoint behavior.
- Whether refresh tokens are stored client-side or handled another way.
- Exact authenticated user response shape.

## File Upload Flow

Generic upload flow:

```text
FileUpload component
 ↓
client UX validation
 ↓
preview/remove before submission
 ↓
feature submit/upload logic
 ↓
backend validation/storage
```

Frontend validation is not security. The backend must validate file content, MIME type, size, permissions, ownership, and storage path. Do not render unsafe uploaded HTML/SVG without explicit security controls.

## Rules To Remember

1. Business-specific code stays inside the owning feature.
2. Only genuinely reusable UI goes into shared `components`.
3. Backend data belongs in RTK Query, not duplicated Redux slices.
4. Router and Redux remain separate.
5. Do not create raw Socket.IO connections in components.
6. Do not call backend APIs directly from page components.
7. Reuse shared modal, table, error, loading, and form infrastructure.
8. Keep pages focused on composition.
9. Keep TypeScript types close to their domain.
10. Avoid creating abstractions before they are needed.

## How To Explain This Architecture To Another Developer In 60 Seconds

This frontend is organized feature-first with shared infrastructure around it. Business screens live in `src/features`, reusable UI lives in `src/components`, Redux setup lives in `src/app`, routes live in `src/router`, and API/socket infrastructure lives in `src/services`. All authenticated roles share one dashboard layout; routes and sidebar items are role-driven through centralized constants and config. Server data goes through RTK Query, forms use React Hook Form plus Zod, and shared foundations exist for modals, tables, errors, uploads, logging, and URL search state.

## New-Developer Checklist

Before implementing a feature:

- Read `AGENTS.md`.
- Read `docs/FOLDER_STRUCTURE.md`.
- Find the owning feature folder.
- Check whether a shared component already exists.
- Check whether a shared type/helper/hook already exists.
- Use the existing `baseApi` and inject feature endpoints.
- Follow route and navigation conventions.
- Keep role checks centralized and use role constants.
- Keep responsive behavior in mind.
- Run `npm run typecheck`, `npm run lint`, and `npm run build`.

## Relationship With Project Docs

- `AGENTS.md`: mandatory development rules and constraints for AI agents and contributors.
- `docs/FOLDER_STRUCTURE.md`: architecture explanation and learning guide.
- `README.md`: project setup, stack overview, and onboarding entry point.

These files should complement each other. Keep detailed educational explanations here, and keep `AGENTS.md` focused on rules.
