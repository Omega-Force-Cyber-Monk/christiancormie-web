**# AI Development Constitution**

\`AGENTS.md\` is the canonical rule file for AI coding agents working in this repository.

Read this file before making any changes.

The purpose of this file is to prevent architectural drift, duplicated patterns, inconsistent file placement, unnecessary dependencies, and unrelated refactors as the project grows.

If another project document conflicts with this file, follow \`AGENTS.md\`.

**---**

**# Architecture**

\- Follow feature-first architecture.

\- Keep Router separate from Redux.

\- Keep Redux configuration in \`src/app\`.

\- Keep route definitions and guards under \`src/router\`.

\- Keep RTK Query endpoints inside their owning features.

\- Use the shared \`baseApi\` from \`src/services/api/baseApi.ts\`.

\- Never create duplicate dashboard layouts for roles.

\- Use role-driven routing and navigation.

\- Keep shared components generic.

\- Keep business components in their owning features.

The project must maintain clear separation between:

\`\`\`text

Application infrastructure

Routing

Layouts

Business features

Shared UI

External services

Configuration

Utilities

\`\`\`

Do not collapse these responsibilities into a small number of large folders or files.

**---**

**# Folder Structure and File Ownership**

The current high-level architecture follows this responsibility model:

\`\`\`text

src/

├── app/

├── components/

├── config/

├── constants/

├── features/

├── hooks/

├── layouts/

├── lib/

├── router/

├── services/

├── styles/

├── types/

├── utils/

├── App.tsx

└── main.tsx

\`\`\`

Before creating a new file, determine which area owns the responsibility.

Do not place files based only on convenience.

**---**

**## \`src/app\`**

Use \`src/app\` for application-level state configuration.

Examples:

\`\`\`text

src/app/

├── store.ts

├── hooks.ts

└── rootReducer.ts

\`\`\`

This folder may contain:

\- Redux store configuration

\- root reducer configuration

\- typed Redux hooks

\- application-level Redux setup

Do not place here:

\- page components

\- business feature logic

\- feature API endpoints

\- route definitions

\- generic UI components

\- Socket.IO feature logic

Redux configuration belongs here, but business Redux slices should remain inside their owning feature when applicable.

**---**

**## \`src/router\`**

Use \`src/router\` for routing infrastructure.

This includes:

\- central router configuration

\- public routes

\- role routes

\- route guards

\- route metadata

\- document title integration

\- URL search parameter helpers

\- route-level error handling

Examples:

\`\`\`text

src/router/

├── routes/

├── guards/

├── metadata/

├── search-params/

└── RouteTitleManager.tsx

\`\`\`

Do not place Redux store configuration here.

Do not place feature-specific business UI here.

Do not place API endpoint implementations here.

Route definitions must stay separate from \`App.tsx\`.

**---**

**## \`src/layouts\`**

Use \`src/layouts\` for reusable application shells.

Examples:

\`\`\`text

src/layouts/

└── DashboardLayout/

&#x20; ├── DashboardLayout.tsx

&#x20; ├── Sidebar/

&#x20; └── TopNavbar/

\`\`\`

Layouts define page structure such as:

\`\`\`text

DashboardLayout

├── Sidebar

├── TopNavbar

└── Routed Main Content

\`\`\`

Do not create:

\`\`\`text

AdminLayout

VendorLayout

CustomerLayout

VendorStaffLayout

\`\`\`

when the application shell is structurally the same.

All roles should reuse the shared dashboard layout unless product requirements genuinely introduce a different layout.

Role-specific behavior should normally come from:

\- route configuration

\- navigation configuration

\- feature content

not duplicate layout implementations.

**---**

**## \`src/features\`**

Business-specific functionality belongs inside \`src/features\`.

Example:

\`\`\`text

src/features/orders/

├── api/

├── components/

├── hooks/

├── pages/

├── schemas/

├── store/

├── types/

└── utils/

\`\`\`

Only create subfolders actually needed by the feature.

Examples:

\`\`\`text

OrderCard

→ src/features/orders/components/OrderCard.tsx

useOrderFilters

→ src/features/orders/hooks/useOrderFilters.ts

orders.api.ts

→ src/features/orders/api/orders.api.ts

order.types.ts

→ src/features/orders/types/order.types.ts

order.schema.ts

→ src/features/orders/schemas/order.schema.ts

\`\`\`

Do not move business-specific files into global folders merely because they might theoretically be reusable later.

Feature ownership is the default.

Promote code into a shared location only when genuine cross-feature reuse exists.

**---**

**## \`src/components\`**

Use \`src/components\` only for reusable UI or reusable presentation infrastructure.

Possible examples include:

\`\`\`text

src/components/

├── forms/

├── overlays/

├── states/

├── data-display/

├── charts/

├── common/

└── ui/

\`\`\`

Appropriate examples:

\- Button

\- Modal

\- Confirmation dialog

\- DataTable

\- EmptyState

\- ErrorState

\- Skeleton

\- shared form primitives

\- shared chart wrappers

Do not place business-specific components here.

Bad:

\`\`\`text

src/components/VendorOrderCard.tsx

\`\`\`

when the component is only used by the vendor/orders feature.

Prefer:

\`\`\`text

src/features/orders/components/VendorOrderCard.tsx

\`\`\`

Shared components must remain generic.

**---**

**## \`src/services\`**

Use \`src/services\` for shared external communication and infrastructure services.

Examples:

\`\`\`text

src/services/

├── api/

└── socket/

\`\`\`

Appropriate responsibilities:

\- shared RTK Query base API

\- authenticated base query

\- token refresh infrastructure

\- centralized Socket.IO service

Feature endpoints should remain inside the owning feature and inject into the shared \`baseApi\`.

Do not create feature-specific REST clients inside this folder unless there is a clear architectural reason.

Do not create raw API clients inside React components.

Do not create random Socket.IO connections inside feature components.

**---**

**## \`src/config\`**

Use \`src/config\` for centralized application configuration.

Examples:

\`\`\`text

navigation configuration

environment configuration

application configuration

\`\`\`

This folder can contain configuration that controls application behavior.

It should not contain feature business logic.

Navigation configuration should remain separate from Sidebar rendering.

The Sidebar should consume configuration rather than contain large amounts of role/business logic.

**---**

**## \`src/constants\`**

Use \`src/constants\` for fixed application values that require a single source of truth.

Examples:

\`\`\`text

roles

route constants

storage keys

shared fixed values

\`\`\`

Prefer:

\`\`\`ts

USER_ROLES.ADMIN;

\`\`\`

over repeatedly writing:

\`\`\`ts

"ADMIN";

\`\`\`

Do not duplicate constant values across features unnecessarily.

**---**

**## \`src/hooks\`**

Use \`src/hooks\` for generic React hooks reused across multiple unrelated features.

Example:

\`\`\`text

src/hooks/useDebounce.ts

\`\`\`

If a hook belongs specifically to one feature, keep it with the feature.

Example:

\`\`\`text

src/features/orders/hooks/useOrderFilters.ts

\`\`\`

Do not move feature hooks into the global hooks folder merely to shorten import paths.

**---**

**## \`src/utils\`**

Use \`src/utils\` for small reusable helper functions.

Examples:

\- API error normalization helpers

\- file helpers

\- formatting helpers

\- small pure transformation functions

Utilities should generally be:

\- small

\- predictable

\- reusable

\- easy to test

Feature-specific utilities should stay inside their feature.

Example:

\`\`\`text

src/features/orders/utils/

\`\`\`

Do not use \`utils\` as a miscellaneous dumping folder.

**---**

**## \`src/lib\`**

Use \`src/lib\` for reusable infrastructure wrappers or internal libraries.

Example:

\`\`\`text

src/lib/logger/

\`\`\`

General distinction:

\`\`\`text

utils

→ small helper functions

lib

→ reusable infrastructure wrappers

\`\`\`

Do not use \`lib\` as another miscellaneous folder.

**---**

**## \`src/types\`**

Use \`src/types\` only for truly shared/global TypeScript types.

Feature-owned domain types must remain inside their owning feature.

Example:

\`\`\`text

Order

OrderStatus

OrderFilters

\`\`\`

should normally live inside:

\`\`\`text

src/features/orders/types/

\`\`\`

if they belong to the orders domain.

Do not turn \`src/types\` into a dumping ground for every interface in the application.

**---**

**## \`src/styles\`**

Use \`src/styles\` for global styling concerns.

Examples:

\- Tailwind entry/imports

\- application-wide CSS

\- global CSS variables

\- theme tokens

\- root/body styles

Do not unnecessarily place feature-specific styling here.

**---**

**## \`App.tsx\`**

\`App.tsx\` should remain small.

Its responsibility is to compose application-level systems.

It may include things such as:

\- Error Boundary

\- application router

\- global toaster

\- route title manager

\- root-level providers

Do not place here:

\- full route definitions

\- business feature logic

\- large page implementations

\- API calls

\- feature-specific state logic

**---**

**## \`main.tsx\`**

\`main.tsx\` is the application bootstrap entry point.

It should initialize React and required root providers.

Keep it focused on application startup.

Do not place feature/business logic inside \`main.tsx\`.

**---**

**# Feature-Specific Assets**

Feature-specific assets must stay inside their owning feature.

Examples include:

- images
- SVGs
- illustrations
- icons that are unique to one feature
- feature-specific backgrounds
- local media used only by one domain

Example:

```text
src/features/auth/assets/signup.svg
```

is preferred when the asset is only used by the authentication feature.

Do not create or use a global:

```text
src/assets/
```

folder merely for convenience when an asset belongs to one feature.

A global shared asset location should only be introduced when the same asset is genuinely reused by multiple unrelated features.

Before placing an asset globally, ask:

1. Is this asset used by only one feature?
   - Yes → keep it inside that feature.
2. Is it genuinely shared across multiple unrelated features?
   - Yes → a shared asset location may be appropriate.
3. Is it only theoretically reusable?
   - Keep it feature-local.

Do not move feature-specific assets into a shared folder simply to shorten import paths.

Do not create empty asset folders preemptively.

When migrating or copying an asset from another project:

- migrate only assets actually required by the implemented feature
- place each asset inside the owning feature when feature-specific
- avoid copying entire source asset directories
- preserve filenames when useful for traceability
- update imports cleanly
- remove obsolete empty asset folders created by the migration

Example:

```text
Auth-only signup illustration
→ src/features/auth/assets/signup.svg

Orders-only empty-state illustration
→ src/features/orders/assets/empty-orders.svg

Truly shared company logo used by unrelated features
→ shared location only if the existing architecture already provides or justifies one
```

The same ownership rule used for components, hooks, types, utilities, and schemas also applies to assets.

---

**# Shared vs Feature-Specific Decision Rule**

Before placing code in a shared folder, ask:

**### 1. Is this code tied to one business feature?**

If yes:

\`\`\`text

→ keep it inside the owning feature

\`\`\`

**### 2. Is it genuinely reused by multiple unrelated features?**

If yes:

\`\`\`text

→ consider moving it to a shared folder

\`\`\`

**### 3. Is it only theoretically reusable?**

If yes:

\`\`\`text

→ keep it feature-local

\`\`\`

Do not create shared abstractions based only on possible future reuse.

Examples:

\`\`\`text

OrderFilter

→ orders feature

VendorProfileCard

→ vendors feature

useVendorSearch

→ vendors feature

Modal

→ shared components

DataTable

→ shared components

useDebounce

→ shared hooks

formatCurrency

→ shared utils if broadly reused

\`\`\`

**---**

**# Dependency Direction**

Prefer dependency flow approximately like:

\`\`\`text

app

&#x20;↓

router / layouts

&#x20;↓

features

&#x20;↓

shared components / hooks / utils / lib

&#x20;↓

services / infrastructure where appropriate

\`\`\`

Avoid circular dependencies.

Features should not arbitrarily import internal implementation details from unrelated features.

If two unrelated features need the same generic functionality, consider extracting the genuinely shared part.

Do not extract business-specific code just to avoid a cross-feature import.

**---**

**# Components**

\- Keep components small and focused.

\- Split large components by responsibility.

\- Do not over-fragment trivial markup.

\- Page components should compose feature components.

\- Use semantic HTML and accessible buttons, labels, and navigation.

A component should generally have one meaningful responsibility.

Split a component when:

\- the file becomes difficult to understand

\- a section has independent behavior

\- a section is reusable

\- logic can be cleanly isolated

\- a page is becoming too large

Do not split every few lines of JSX into a new component.

**---**

**# Page Responsibility**

Pages should primarily compose feature components.

Prefer:

\`\`\`tsx

function OrdersPage() {

&#x20; return (

&#x20; <>

&#x20; \<OrdersHeader />

&#x20; \<OrdersFilters />

&#x20; \<OrdersTable />

&#x20; \</>

&#x20; );

}

\`\`\`

over putting:

\- all table logic

\- all filter logic

\- modal implementations

\- API normalization

\- complex form handling

directly inside the page.

Pages coordinate features.

They should not become giant implementation files.

**---**

**# TypeScript**

\- Use strict TypeScript.

\- Do not use unnecessary \`any\`.

\- Prefer existing domain types over duplicate interfaces.

\- Keep global types in \`src/types\` and feature-owned types inside the feature.

Prefer:

\- inference

\- generics

\- discriminated unions

\- \`unknown\` when the actual type is unknown

\- schema-inferred types where applicable

Avoid duplicating the same domain model across multiple files.

**---**

**# State**

\- Use local state for local UI concerns.

\- Use Redux for meaningful shared client state.

\- Use RTK Query for server state.

\- Do not duplicate RTK Query server responses in normal Redux slices.

\- Keep temporary development auth role mocking isolated to the auth feature.

Use the following general rule:

\`\`\`text

Temporary component UI state

→ local React state

Shared client-side application state

→ Redux Toolkit

Backend/server state

→ RTK Query

Shareable navigation/filter state

→ URL search parameters

\`\`\`

Examples of local state:

\- modal open/close

\- dropdown state

\- unsaved local input

\- temporary tab state

Examples of RTK Query state:

\- users

\- orders

\- vendors

\- server pagination

\- remote resource details

Do not move server data into Redux slices merely because multiple components consume it.

**---**

**# Forms and Validation**

\- Use React Hook Form for meaningful forms.

\- Use Zod for validation.

\- Keep Zod schemas close to their owning feature.

\- Prefer schema-inferred TypeScript types when appropriate.

\- Do not duplicate validation logic across components.

\- Do not put large forms directly inside page components.

\- Map backend field validation errors to the corresponding form fields.

\- Form-level API errors must be displayed intentionally rather than only through toasts.

Feature form example:

\`\`\`text

src/features/auth/

├── components/

│ └── LoginForm.tsx

├── schemas/

│ └── login.schema.ts

└── types/

\`\`\`

Generic form primitives may live inside:

\`\`\`text

src/components/forms/

\`\`\`

Do not create a large generic form engine unless the application genuinely needs one.

**---**

**# Authentication and Sessions**

\- Authentication lifecycle must be centralized.

\- API authentication logic belongs in the RTK Query base-query layer.

\- Do not manually implement refresh logic in individual API endpoints or components.

\- Prevent multiple simultaneous token-refresh requests.

\- A failed refresh must terminate the session cleanly.

\- Avoid infinite 401 refresh loops.

\- Never log tokens or sensitive authentication information.

\- Frontend route guards provide UX access control only; backend APIs remain authoritative.

Session ownership must remain clear.

Avoid scattering:

\- token updates

\- logout handling

\- refresh handling

\- session cleanup

across components.

**---**

**# Authorization Model**

\- This project currently uses role-based authorization only.

\- Supported roles are:

&#x20; \- \`CUSTOMER\`

&#x20; \- \`VENDOR\`

&#x20; \- \`VENDOR_STAFF\`

&#x20; \- \`ADMIN\`

\- Do not introduce a fine-grained permission system such as \`view\`, \`create\`, \`update\`, \`delete\`, or capability strings unless the backend/product requirements explicitly introduce that concept later.

\- Use centralized role constants and \`RoleGuard\` for protected routes.

\- Use \`allowedRoles\` for role-specific navigation and UI visibility.

\- Do not hardcode role strings throughout components.

\- Frontend role checks are for UI/UX access control only; backend APIs must still enforce authorization.

Current authorization is role-only.

Do not add:

\`\`\`text

Permission

requiredPermissions

view permissions

edit permissions

delete permissions

capability arrays

\`\`\`

unless actual backend/product requirements later introduce them.

**---**

**# APIs**

\- Use the existing RTK Query \`baseApi\`.

\- Inject feature endpoints into \`baseApi\`.

\- Do not call \`fetch\` or Axios directly from React pages/components unless an exception is explicitly documented.

\- Centralize authentication and API error-handling behavior.

Feature APIs should normally look conceptually like:

\`\`\`text

src/features/orders/api/orders.api.ts

&#x20; ↓

shared baseApi

&#x20; ↓

auth base query

&#x20; ↓

backend

\`\`\`

Do not create an independent API client for every feature.

If a different backend/base URL genuinely requires another API slice, document the architectural reason.

**---**

**# Errors**

\- Normalize backend/API errors before presenting them to components.

\- Components should not depend on arbitrary raw backend error shapes.

\- Use the shared \`AppError\` architecture.

\- Unexpected rendering failures must be handled by the application Error Boundary.

\- Do not expose internal stack traces or raw server details to production users.

\- Use field errors, form errors, error states, and toast notifications according to context.

Use error presentation appropriately:

\`\`\`text

field validation error

→ field

form-level API error

→ form

page/resource loading failure

→ ErrorState

unexpected background/action failure

→ toast where appropriate

unexpected render/runtime failure

→ Error Boundary

\`\`\`

Do not use toasts as the only error-handling mechanism.

**---**

**# UI States**

Every asynchronous feature must intentionally support relevant states:

\`\`\`text

loading

success

empty

no results

error

\`\`\`

\- Reuse shared state components where appropriate.

\- Do not create unrelated loading/error UI for every page.

\- Use skeletons when preserving layout improves UX.

Distinguish:

\`\`\`text

Empty

→ there is no data

No Results

→ data may exist, but filters/search matched nothing

\`\`\`

**---**

**# Dialogs and Overlays**

\- Use the shared modal/dialog architecture.

\- Do not create one-off inaccessible modals.

\- Do not use \`window\.confirm()\`.

\- Destructive actions must use the shared confirmation workflow.

\- Overlays must support keyboard navigation, focus management, Escape behavior, ARIA semantics, and focus restoration.

\- Mobile overlays must remain fully usable.

Reuse the shared overlay system rather than creating another modal implementation inside a feature.

**---**

**# Confirmation Workflow**

Destructive actions should use the shared confirmation workflow.

Examples:

\`\`\`text

Delete item

Deactivate user

Remove vendor

Cancel irreversible action

\`\`\`

Do not trigger destructive operations immediately from an accidental click.

Confirmation UIs should support:

\- confirmation

\- cancellation

\- loading/submitting state

\- disabled controls while processing

\- appropriate destructive styling

Do not use browser-native confirmation dialogs.

**---**

**# Tables**

\- Use the shared DataTable foundation where appropriate.

\- DataTable components must not own feature-specific API requests.

\- Keep fetching/filter business logic in the owning feature/page.

\- Tables must support intentional loading, error, empty, and responsive behavior.

\- Prefer server-driven pagination/filtering for large datasets.

\- Do not introduce a heavyweight grid library without explicit need.

Preferred flow:

\`\`\`text

Feature page / hook

&#x20; ↓

URL state

&#x20; ↓

RTK Query

&#x20; ↓

DataTable

\`\`\`

The shared DataTable should not know about:

\`\`\`text

/orders

/vendors

/customers

/admin

\`\`\`

or feature-specific API endpoints.

**---**

**# URL State**

\- Shareable navigation state such as pagination, filters, search, and sorting should use URL search parameters where appropriate.

\- Changing filters/search/page size should reset pagination predictably.

\- Parse URL parameters defensively.

\- Do not store temporary visual UI state in the URL unnecessarily.

Good examples:

\`\`\`text

?page=2

&pageSize=20

&search=pizza

&status=ACTIVE

&sort=createdAt

&order=desc

\`\`\`

Do not store:

\`\`\`text

modalOpen=true

hoveredRow=3

dropdownOpen=true

\`\`\`

in the URL without a real navigation requirement.

**---**

**# Routing**

\- Keep route definitions under \`src/router\`.

\- Do not define application routing inside \`App.tsx\`.

\- Use route guards and role constants.

\- Lazy-load suitable page-level modules.

\- Frontend authorization is a UX layer; backend APIs must enforce permissions independently.

For this project, backend authorization is currently role-based.

The word "permissions" above refers generally to backend authorization responsibility and must not be interpreted as requiring a frontend fine-grained permission system.

**---**

**# Route Metadata**

\- Route-level concerns such as title, breadcrumb, roles, permissions, and navigation metadata should be centralized.

\- Avoid duplicating route information across unrelated files.

\- Not every route must appear in sidebar navigation.

\- Document titles should come from the route metadata/title system, not random page effects.

Important current-project clarification:

The application currently uses role-based authorization only.

Do not add fine-grained permission metadata merely because the architecture could theoretically support it.

Current metadata should focus on actual requirements such as:

\`\`\`text

title

breadcrumb

allowedRoles

navigation relationship

\`\`\`

Add permission-related metadata only if real product/backend requirements introduce permissions later.

**---**

**# Styling**

\- Tailwind CSS is the primary styling system.

\- Maintain fluid responsive behavior.

\- Build mobile-first.

\- Never introduce a second CSS framework without explicit approval.

\- Reuse existing design tokens from \`src/styles/globals.css\`.

\- Avoid arbitrary one-off styling when a reusable pattern already exists.

Responsiveness must be considered whenever UI changes are made.

Check:

\- mobile

\- tablet

\- laptop

\- desktop

\- wide desktop

Avoid fragile fixed-width layouts.

**---**

**# Icons**

\- Use Lucide React.

\- Do not add another icon library without explicit approval.

Do not introduce:

\- random SVG libraries

\- emoji as application icons

\- another icon system

unless there is a documented requirement.

**---**

**# Charts**

\- Use Recharts.

\- Charts must remain responsive.

Feature-specific charts should stay inside the owning feature unless genuinely reusable.

Generic reusable chart wrappers may live in shared components.

**---**

**# Notifications**

\- Use Sonner.

\- Never use browser \`alert()\`.

Use notifications intentionally.

Do not use a toast when:

\- a field error belongs under a field

\- a page failed to load and should show an error state

\- a form-level error belongs inside the form

**---**

**# Logging**

\- Use the centralized logger.

\- Do not commit random \`console.log()\` debugging statements.

\- Debug logs must be disabled in production.

\- Never log passwords, access tokens, refresh tokens, sensitive personal data, or payment information.

\- Keep the logger compatible with future error-monitoring integration.

Do not log complete request objects when they may contain sensitive headers or authentication information.

**---**

**# Socket**

\- Use the centralized Socket.IO service in \`src/services/socket\`.

\- Never create random socket connections inside components.

\- Always clean up subscriptions and listeners.

Feature components may subscribe through the approved service/hook architecture.

Do not call raw:

\`\`\`ts

io(...)

\`\`\`

inside feature components.

**---**

**# Requests and Race Conditions**

\- Prefer RTK Query lifecycle/cancellation functionality for RTK Query requests.

\- Avoid custom request state that duplicates RTK Query behavior.

\- Handle rapidly changing searches/filters carefully.

\- Manual async operations should use cancellation where stale results could update the UI incorrectly.

\- Prevent duplicate form submissions while a mutation is in progress.

Avoid building custom request abstractions around RTK Query unless there is an actual requirement.

**---**

**# Debouncing**

\- Use the shared typed debounce hook for debounced values.

\- Do not install an external dependency solely for debounce behavior.

\- Search input should generally debounce before server requests.

\- Clean up timers correctly.

Feature-specific search behavior should compose the shared debounce hook rather than implementing its own timers repeatedly.

**---**

**# File Uploads**

\- Use shared upload components/utilities when practical.

\- File type/size checks on the frontend are UX validation only.

\- Backend validation remains mandatory.

\- Do not create AWS-specific coupling in generic upload UI.

\- Keep upload logic capable of supporting multipart or presigned uploads later.

\- Never render potentially unsafe uploaded content without appropriate safeguards.

Generic upload UI belongs in shared components.

Feature upload behavior belongs in the owning feature.

Example:

\`\`\`text

shared FileUpload component

&#x20; ↓

feature form

&#x20; ↓

feature mutation

&#x20; ↓

backend/storage

\`\`\`

**---**

**# Accessibility**

\- Interactive UI must work by keyboard.

\- Use semantic elements.

\- Provide accessible names for icon-only controls.

\- Overlays require proper focus management.

\- Do not disable focus outlines without an accessible replacement.

\- Dynamic errors/statuses should be announced appropriately where useful.

\- Mobile navigation must remain accessible.

Accessibility requirements apply to newly created and modified components.

**---**

**# Architecture Boundaries**

Before importing across features:

1\. Determine whether the dependency actually belongs to the other feature.

2\. Do not import internal/private implementation details of unrelated features.

3\. Move genuinely reusable logic to an appropriate shared module.

4\. Avoid circular dependencies.

5\. Follow the established dependency direction.

Do not create new architecture layers unless there is an actual problem they solve.

Cross-feature imports should be treated carefully.

If:

\`\`\`text

feature A

\`\`\`

needs an internal helper from:

\`\`\`text

feature B

\`\`\`

first determine whether:

\- the helper is actually shared

\- the responsibility belongs to another domain

\- an abstraction should move to shared code

Do not expose entire feature internals merely to satisfy another feature.

**---**

**# File Placement**

Before creating a file:

1\. Inspect the existing architecture.

2\. Find the correct owning feature.

3\. Reuse existing components, types, hooks, and utilities when appropriate.

4\. Only create a shared abstraction if it is genuinely reusable.

Also verify:

5\. Whether a similar file already exists.

6\. Whether the responsibility belongs to a feature or shared layer.

7\. Whether creating the file introduces a duplicate architectural pattern.

8\. Whether the new folder is actually necessary.

9\. Whether the naming matches nearby files.

10\. Whether the import direction remains valid.

**---**

**# AI File-Creation Decision Process**

Before creating any file, the AI must reason through this placement sequence:

\`\`\`text

Is it business/domain-specific?

├── Yes

│ ↓

│ Put it inside the owning feature

│

└── No

&#x20; ↓

Is it reusable UI?

├── Yes → src/components

└── No

&#x20; ↓

Is it a reusable React hook?

├── Yes → src/hooks

└── No

&#x20; ↓

Is it a small generic helper?

├── Yes → src/utils

└── No

&#x20; ↓

Is it infrastructure/wrapper logic?

├── Yes → src/lib or src/services

└── No

&#x20; ↓

Is it configuration?

├── Yes → src/config

└── No

&#x20; ↓

Is it a fixed constant?

├── Yes → src/constants

└── No

&#x20; ↓

Inspect the architecture again before creating a new category.

\`\`\`

Do not invent a new top-level folder without architectural justification.

**---**

**# Architecture Drift Prevention**

Never introduce a second competing pattern for functionality already standardized in the repository.

Before implementing something new, search for an existing implementation.

Do not create:

\`\`\`text

another API client

\`\`\`

if \`baseApi\` already handles the responsibility.

Do not create:

\`\`\`text

another modal system

\`\`\`

if shared modal infrastructure already exists.

Do not create:

\`\`\`text

another table implementation

\`\`\`

if the shared DataTable fits the use case.

Do not create:

\`\`\`text

another logger

\`\`\`

if centralized logging already exists.

Do not create:

\`\`\`text

another debounce helper

\`\`\`

if \`useDebounce\` already exists.

Do not create:

\`\`\`text

routing inside App.tsx

\`\`\`

when the router architecture already exists.

Do not create:

\`\`\`text

raw socket connections

\`\`\`

when the Socket.IO service already exists.

Extend existing architecture instead of creating parallel architecture.

**---**

**# Refactoring**

When modifying an existing feature:

\- Preserve current behavior unless requested otherwise.

\- Do not rewrite unrelated code.

\- Follow existing conventions.

\- Remove obsolete code created by the change.

\- Keep imports clean.

\- Avoid duplicate implementations.

Do not use a small task as an excuse to:

\- rename unrelated files

\- restructure unrelated folders

\- replace working architecture

\- switch libraries

\- introduce a new design pattern globally

Keep changes scoped.

**---**

**# Quality Gates**

Before finishing any future task, run:

\`\`\`bash

npm run typecheck

npm run lint

npm run build

\`\`\`

Fix errors caused by the work.

Do not claim completion while known TypeScript, build, or lint errors introduced by the task remain.

If formatting is part of the project workflow, also run the appropriate formatting command.

If tests exist for the affected area, run the relevant tests.

Do not silence errors merely to make checks pass.

Avoid:

\`\`\`ts

// @ts-ignore

\`\`\`

and broad:

\`\`\`ts

eslint - disable;

\`\`\`

unless there is a documented exceptional reason.

**---**

**# Dependency Rules**

Before installing a dependency:

\- Verify an existing dependency cannot reasonably solve the requirement.

\- Use stable releases only.

\- Do not install packages for trivial helpers.

\- Do not change major dependencies unnecessarily.

\- Document why a new dependency was necessary.

Before adding any package:

1\. Check whether the existing stack already solves the problem.

2\. Prefer platform/browser capabilities for simple utilities.

3\. Prefer focused dependencies over huge frameworks.

4\. Use stable versions only.

5\. Do not introduce overlapping libraries.

6\. Explain meaningful new dependencies in the final summary.

Do not add packages merely because they make a few lines of code shorter.

**---**

**# Naming and Consistency**

Follow existing naming conventions before inventing new ones.

Typical conventions include:

\`\`\`text

ComponentName.tsx

useSomething.ts

feature.api.ts

feature.types.ts

feature.schema.ts

feature.slice.ts

\`\`\`

Inspect nearby files before naming new modules.

Do not create filenames such as:

\`\`\`text

helper2.ts

newFile.ts

commonStuff.ts

temp.ts

finalVersion.ts

\`\`\`

Use names based on responsibility.

**---**

**# Reuse Before Creation**

Before creating:

\- a component

\- a hook

\- a type

\- a utility

\- a form primitive

\- a loading state

\- a modal

\- a table

\- an error helper

\- an API wrapper

search the existing repository first.

Prefer extending existing patterns over creating nearly identical versions.

Do not duplicate code merely because importing the existing abstraction requires understanding it.

**---**

**# AI Behavior**

For every future prompt:

1\. Read \`AGENTS.md\` before making changes.

2\. Inspect existing related files before creating replacements.

3\. Follow the current architecture.

4\. Extend existing patterns rather than inventing parallel patterns.

5\. Do not create duplicate components, hooks, types, or services.

6\. Do not move files without architectural justification.

7\. Do not perform unrelated refactors.

8\. Keep changes scoped to the user's request.

9\. Ensure responsive behavior.

10\. Ensure TypeScript correctness.

11\. Run quality checks before completion.

In addition, before implementation:

12\. Determine the owning feature.

13\. Determine whether the requested code already exists in shared infrastructure.

14\. Inspect similar existing implementations.

15\. Decide whether the code is feature-specific or genuinely shared.

16\. Preserve the established import boundaries.

17\. Avoid adding abstractions before they are needed.

18\. Avoid introducing another library when the existing stack already solves the problem.

19\. Do not invent backend contracts or product requirements.

20\. Clearly identify intentional backend integration placeholders when the required backend contract is unknown.

**---**

**# AI Completion Checklist**

Before claiming that a task is complete, verify:

\`\`\`text

[ ] AGENTS.md was followed

[ ] existing patterns were inspected

[ ] file placement is correct

[ ] no unnecessary shared abstraction was created

[ ] no duplicate component/hook/type/service was created

[ ] no architecture boundary was broken

[ ] role-only authorization model was preserved

[ ] responsive behavior was considered

[ ] accessibility was considered

[ ] TypeScript passes

[ ] lint passes

[ ] build passes

\`\`\`

If any item cannot be completed because of an external/backend dependency, state that clearly in the final summary.

**---**

**# Documentation Responsibilities**

This file defines mandatory development rules.

Use:

\`\`\`text

AGENTS.md

\`\`\`

for:

\- architectural constraints

\- AI behavior

\- placement rules

\- dependency rules

\- development rules

\- quality requirements

A separate architecture documentation file such as:

\`\`\`text

docs/FOLDER_STRUCTURE.md

\`\`\`

may provide detailed educational explanations, examples, diagrams, and onboarding guidance.

Recommended responsibility split:

\`\`\`text

AGENTS.md

→ mandatory rules

docs/FOLDER_STRUCTURE.md

→ detailed architecture explanation

README.md

→ setup and onboarding

\`\`\`

\`AGENTS.md\` remains authoritative.

If documentation conflicts with \`AGENTS.md\`, follow \`AGENTS.md\` and update the outdated documentation.
