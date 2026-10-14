# AI Development Constitution

This is the canonical instruction file for AI agents working in `christinacormie-web`.
Read it before every implementation task. Explicit user instructions take precedence;
otherwise follow this file when project documents conflict.

## 1. Project and current workflow

Implement the complete static frontend from supplied full-page Figma SVGs first.
Backend integration is a separate stage, allowed only after design approval and an
explicit user request. Do not implement pages during documentation-only tasks.

Inspect current code rather than relying on an old audit. Read
[foundation readiness](docs/FOUNDATION_READINESS.md) and, for design tasks,
[the Figma design-system reference](docs/FIGMA_DESIGN_SYSTEM.md). Preserve existing
uncommitted work. README and folder guides are context, not authority to bypass these rules.

## 2. Technology stack

Use the existing React 19, strict TypeScript 6, Vite 8, React Router 8,
Redux Toolkit/RTK Query, and Tailwind CSS 4 setup. Use React Hook Form with Zod for
meaningful forms, Lucide React for ordinary interface icons, Recharts for charts,
and Sonner for notifications. Keep Socket.IO centralized.

Do not add a second UI framework, icon library, state manager, API client, or test
framework. Before adding a dependency, check existing tools and browser/platform
capabilities; use stable releases and explain a justified addition. New testing
dependencies require explicit permission. Do not install packages for trivial helpers.

## 3. Architecture and file ownership

Keep the existing feature-first architecture and `@/` imports. Determine ownership
and search for an equivalent implementation before creating a file.

| Location         | Responsibility                                                                                         |
| ---------------- | ------------------------------------------------------------------------------------------------------ |
| `src/app`        | Redux store, root reducer, typed hooks, listener/middleware wiring                                     |
| `src/router`     | Route definitions, guards, metadata/titles, URL helpers, route errors                                  |
| `src/layouts`    | Reusable shells; one `DashboardLayout` with sidebar and navbar                                         |
| `src/features`   | Domain pages, components, API endpoints, hooks, schemas, state, types, utilities, mock data and assets |
| `src/components` | Genuinely generic UI, forms, overlays, tables, states and charts                                       |
| `src/services`   | Shared API/base-query/auth infrastructure and Socket.IO service                                        |
| `src/config`     | Environment, application and role-driven navigation configuration                                      |
| `src/constants`  | Single-source roles, routes, storage keys and fixed shared values                                      |
| `src/hooks`      | Generic hooks reused across unrelated features                                                         |
| `src/utils`      | Small generic helpers; keep domain-specific helpers in their feature                                   |
| `src/lib`        | Infrastructure wrappers such as logging and existing test support                                      |
| `src/types`      | Truly shared types; domain types stay feature-local                                                    |
| `src/styles`     | Global CSS, Tailwind imports, existing theme variables                                                 |
| `src/App.tsx`    | Small composition of error boundary, session bootstrap, router and toaster                             |
| `src/main.tsx`   | React bootstrap and root providers                                                                     |

Current implemented feature areas are `admin`, `auth`, `customer`, `dashboard`,
`public`, `vendor`, and `vendor-staff`. Do not fill empty directories speculatively.
Create only needed feature subfolders; match nearby names such as
`ComponentName.tsx`, `useSomething.ts`, `feature.api.ts`, `feature.schema.ts`,
and `feature.types.ts`.

Keep pages focused on composition/orchestration. Separate substantial forms,
data adaptation, table behavior and independent sections when useful; do not split
trivial markup or invent a generic design framework. Keep imports clean, avoid
cycles/private cross-feature dependencies, and extract shared code only for actual
cross-feature reuse. No unrelated moves, renames, refactors or configuration rewrites.

## 4. Routing, roles and session safeguards

- Keep routes under `src/router`; never define them in `App.tsx` or Redux setup.
- Use centralized `ROUTES` and `USER_ROLES`: `CUSTOMER`, `VENDOR`,
  `VENDOR_STAFF`, `ADMIN`. Do not introduce roles or fine-grained permissions.
- Preserve `AuthGuard`, `GuestGuard`, `RoleGuard`, `SessionGate` and the
  role-home redirect. Use `allowedRoles` for guards/navigation. Existing route
  metadata uses `requiredRoles`; do not extend its unused `requiredPermissions`
  type field into a permission system.
- Reuse `DashboardLayout` for structurally equivalent role shells. Role differences
  belong in route/navigation configuration and feature content, not duplicate layouts.
- Keep titles/breadcrumb metadata in the route metadata system; do not set
  `document.title` in pages. Update relevant routes, constants, metadata and
  navigation together; not every route needs a navigation item.
- Do not bypass guards for static UI. Reuse the existing opt-in, development-only
  mock auth in `features/auth` when the user's environment enables it. Never
  enable mocks in production or edit the user's environment merely to access a page.
- Preserve verified-identity gating: persisted roles are not verified identity.
  Keep bootstrap/storage synchronization, initialization retry, and public-page access.
- Distinguish definitive invalid-session responses from temporary network/server
  failures. Preserve centralized refresh concurrency, stale-session protection,
  bounded retries and logout cache/socket cleanup. Do not guess expiry units,
  response schemas, role precedence or revocation contracts.

Frontend guards provide UX control; backend authorization remains authoritative.

## 5. Shared UI and completed foundations

Search `src/components` and the owning feature before creating replacements.
Reuse or safely extend existing foundations without compromising the supplied
page design or breaking other consumers. Use a feature-specific component when
reuse is unsuitable; promote it only for proven cross-feature reuse.

- Use `Modal`, `useDialogLifecycle` and `dialogLifecycle` for overlays. Preserve
  topmost Escape, focus trapping/restoration, background isolation, nested ordering,
  scroll-lock cleanup and CSS-variable/typography inheritance through portals.
- Use `ConfirmationDialog`/`useConfirmation` for destructive workflows. Keep
  cancellation, inline failure/retry, pending state and duplicate-submit protection.
  Never use `window.confirm()` or `alert()`.
- Keep `DataTable` presentational. Reuse `DataTablePagination` and `getPagination`;
  preserve valid page bounds, working page size and ARIA labels/sort announcements.
  Existing `default` and `contrast` variants are visual variants, not business rules.
- Reuse form controls and upload primitives; preserve unique field associations,
  disabled behavior, safe previews and object-URL cleanup. Frontend file checks are
  UX validation only; backend validation is still mandatory during integration.
- Reuse loading, skeleton, empty, no-results and error states. Empty means no data;
  no-results means filters matched none. Preserve announced status/errors.
- Preserve defensive formatting: invalid dates do not throw, missing/invalid amounts
  remain distinct from zero, and monetary values retain decimal precision.
- Keep `AppError` normalization and the error boundary. Field errors belong at
  fields, form errors in forms, resource errors in error states, and appropriate
  background/action failures in Sonner. Do not expose raw server internals or stacks.

## 6. Figma design-system authority

[docs/FIGMA_DESIGN_SYSTEM.md](docs/FIGMA_DESIGN_SYSTEM.md) records actual values and
relationships from all nine JSON exports. It is an inventory, not approval to
activate a palette or redefine the application theme.

The unresolved `Colors/Brand/500` values are `#8A2BE2` in Primitive Mode and
`#FF6B35` in Primitive Style. Semantic values match Style where primitive aliases
resolve by name; this does not approve Style. Alias IDs differ from the supplied
primitive IDs, and dark mode references a missing `Colors/Base/transparent`.
Report ambiguity rather than silently choosing or repairing a mode.

Tailwind 4 is loaded through `@tailwindcss/vite` and `globals.css`; no custom
`@theme` or Figma-token generator is implemented. Existing root/admin CSS variables
are not automatically equivalent to Figma semantic names. Preserve current
appearance until a design decision authorizes a change.

Use approved semantic tokens for repeated properties; respect light/dark values,
alpha, units, typography, spacing and radii. Do not invent exported names, values
or CSS/Tailwind mappings. Preserve page-specific SVG details where shared tokens
do not represent them. Never globally retheme the app to match one page.

## 7. Visual reference priority

This priority governs visual choices; it never overrides architecture, security,
accessibility or the user's execution restrictions.

1. **Supplied full-page Figma SVG:** primary reference for that page's hierarchy,
   placement, alignment, text, dimensions, artwork, borders, shadows and spacing.
2. **Approved Figma tokens:** shared color, typography and layout properties. If an
   SVG conflicts, report it and preserve the SVG's page-specific detail without
   silently changing the global token. Unapproved exports do not acquire priority.
3. **Existing components and architecture:** reuse infrastructure; safely adapt
   presentation when needed to match the approved page.
4. **Existing UI patterns:** fill only details missing or ambiguous in the SVG.
   Do not override clear SVG details with styling/content from unrelated screens.

## 8. Full-page SVG to React workflow

1. Read these rules and inspect the supplied SVG completely, including viewBox,
   text or outlined text, groups, fills, opacity, clip paths, gradients and assets.
2. Identify section hierarchy, repeated patterns, typography and logical layout.
3. Inspect the target route/page, shared shell and comparable feature components.
4. Search existing UI/types/hooks/utilities/assets; plan meaningful boundaries and
   decide which details use approved tokens versus page-specific presentation.
5. Build real React/TypeScript components with semantic HTML, Flexbox/Grid and
   Tailwind. Keep artwork distinct from ordinary text and interactive controls.
6. Implement Stage A interactions and responsive behavior; preserve desktop detail
   and the shared accessibility/session foundations.
7. Run permitted code checks, review the diff, and report ambiguities and the user's
   manual visual checks. Never claim browser-verified or pixel-perfect fidelity.

Never render the whole page as one SVG, background image or raster; do not paste
Figma-generated page markup as the React implementation. Do not position the whole
layout absolutely, assign fixed coordinates to every element, or turn normal text
into images. Limited positioning for actual overlays/decorations is acceptable.

### Asset ownership

Retain original SVG artwork for logos, illustrations, decorative shapes, unique
branded icons and complex artwork. Do not replace it with unrelated Lucide icons.
Use Lucide for ordinary interface icons when its appearance matches the reference;
a supplied artwork asset does not justify adding another icon library.

Keep feature-only assets under `src/features/<feature>/assets`. Existing layout
assets belong with their shell. Do not introduce `src/assets` for convenience or
copy an entire source asset directory. A shared asset location requires actual
reuse across unrelated features. Migrate only needed assets, preserve traceable
filenames, update imports and remove obsolete empty folders created by the change.

## 9. Stage A: static frontend (current default)

- Build the complete visual layout, responsive components and typed fixture data.
  Keep fixture values in the owning feature, separate from production data. Reuse
  existing domain types or add feature-local UI types without inventing API contracts;
  do not present sample data as a real account, transaction or backend contract.
- Use local React state for local interactions: validation, search/filter/sort,
  pagination, tabs, dropdowns, dialogs and preview actions. Use React Hook Form/Zod
  for meaningful forms; keep schemas and schema-inferred types feature-local.
- Use Redux only for meaningful shared client state; keep RTK Query for server state.
  Use existing URL helpers for shareable search/filter/sort/pagination where useful,
  reset pagination predictably and parse inputs defensively. Temporary hover,
  dropdown and modal state normally remains local. Reuse `useDebounce` as needed.
- Include loading presentation, success presentation, empty, no-results and error
  states with an intentional local way to exercise states where appropriate.
- Navigation and local controls must work. Backend-dependent actions must be an
  explicitly labeled preview or communicate why integration is needed; no dead
  controls, fake delivery/success claims or simulated irreversible operations.
- Do not add API integrations, alter API contracts, connect sockets, upload remotely,
  or call real backend mutations for static interactions. Existing integrations
  remain intact outside the task; isolate the target's static data/action path from
  them without deleting endpoints or weakening authentication.
- A design update to an API-connected page is not permission to integrate new APIs.
  Preserve existing integration outside the static path and explain that boundary.

## 10. Stage B: backend integration (explicitly requested only)

Design approval alone does not authorize integration. Wait for an explicit request
and confirmed contracts, then replace fixtures while preserving the approved UI.

- Inject feature endpoints into `src/services/api/baseApi.ts`; keep authentication,
  headers, refresh and shared error behavior in the base-query/session layers.
- No direct `fetch`/Axios in presentation components, duplicate API slices/clients,
  invented endpoints, fields or status meanings. Document a justified alternative
  backend/base URL before introducing another API slice.
- Use RTK Query for requests, cache invalidation, lifecycle and cancellation; do not
  copy server responses into ordinary Redux slices or duplicate request state.
- Map normalized server field errors to form fields, provide contextual errors and
  pending states, prevent duplicate submissions, and guard stale manual results.
- Use confirmed server pagination/filtering for large datasets. Debounce server
  search with the existing typed hook; reset pagination on filter/page-size changes.
- Keep Socket.IO in `src/services/socket`; no raw `io()` in components. Clean up
  listeners/subscriptions and do not guess socket authentication contracts.
- Keep upload UI storage-provider-neutral; actual content/type/size/ownership checks
  remain backend responsibilities. Never render unsafe uploaded content.

Do not combine Stages A and B without explicit user authorization.

## 11. Styling, responsiveness and accessibility

Use Tailwind and existing theme infrastructure. Avoid unnecessary global CSS;
keep page-specific changes scoped, fluid and mobile-first. Preserve the supplied
desktop design and adapt columns/spacing at existing breakpoints for mobile, tablet,
laptop, desktop and wide desktop. SVG widths are references, not fixed viewport
requirements or automatically breakpoints. Prevent page-level horizontal overflow;
wide tables may scroll horizontally. Keep controls/touch targets usable and preserve
content hierarchy. For missing mobile references, follow established patterns;
do not invent a radically different screen.

Use semantic buttons, links, headings, forms and tables. Provide icon-only names,
labels, visible focus, keyboard operation, meaningful disabled states, appropriate
ARIA and announced error/status feedback. Preserve shared modal/mobile focus
behavior. Do not trade away accessibility to copy SVG geometry.

## 12. Development-server and browser restrictions

Unless explicitly overridden by the user:

- Never start/restart `npm run dev`, `vite`, `yarn dev`, `pnpm dev`, preview
  servers or equivalent development/background servers, including programmatic
  server initialization. Do not manage the developer's existing server.
- Never open localhost or the application in a browser, use Playwright/Puppeteer/
  Selenium/browser automation, capture UI screenshots, compare designs in-browser,
  or perform interactive/responsive browser testing.
- The user manages the development environment and manual UI review. Do not
  repeatedly ask for permission to use these prohibited workflows.

A production build is allowed; a development/preview server or browser test is not.

## 13. Allowed validation and code quality

For implementation changes, inspect scripts/helpers first, then run applicable
non-browser checks: `npm run typecheck`, `npm run lint`, `npm run build`, targeted
format checks and `git diff --check`. Use `npm.cmd` on PowerShell when necessary.
Unit/regression tests are allowed only when they initialize no server or browser;
never assume a `test` script is safe from its name.

**Current test caveat:** `npm test` invokes Node's runner, but the regression files
import `src/lib/testing/loadModule.mjs`, which calls Vite `createServer` in middleware
mode. It has no application listener/HMR/WebSocket, yet initializes a development
server and therefore must not run under the restriction above. Preserve the tests;
report the limitation. Do not change the runner in an unrelated page task.

Preserve strict typing, existing domain/schema types, safe formatting/errors and
completed foundation fixes. Avoid unnecessary `any`, assertions, `@ts-ignore`,
broad ESLint disables, duplicate logic and raw production error details. Use the
central logger; production debug is disabled. Never log credentials, tokens,
personal/payment data or complete sensitive request objects.

Fix errors caused by the task; report pre-existing/external blockers accurately.
Do not run repository-wide formatting writes: the nine Figma exports have known
formatting differences and must not be rewritten incidentally. For documentation-
only tasks, validate changed Markdown, local links and `git diff --check`; do not
claim old TypeScript/build/test results were rerun.

## 14. Definition of done and handoff

Before finishing, confirm ownership/reuse, stage boundaries, guards, accessibility,
responsive code, scoped changes and allowed checks. Preserve the existing foundation
and do not invent product content, actions or backend requirements.

Report:

1. Page/feature implemented and route updated (or documentation-only scope).
2. Components reused/created and static interactions implemented.
3. Files changed and validation commands/results, including checks not run and why.
4. Unresolved design/token/backend ambiguities and any static/integration boundary.
5. Manual visual checks for the user: hierarchy, typography, spacing, artwork,
   desktop fidelity, mobile/tablet layouts, overflow, states and keyboard behavior.

Do not claim pixel-perfect, browser-verified or production-integrated completion
without the corresponding evidence. Do not modify unrelated documentation merely
because it is stale; `AGENTS.md` remains the development authority.
