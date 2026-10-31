# Batch 5 — Drops and promotions integration

## 1. Files changed

- `src/features/vendor/api/vendorDrops.api.ts`
- `src/features/vendor/api/vendorDrops.test.mjs`
- `src/features/vendor/schemas/dropsIntegration.schema.ts`
- `src/features/vendor/utils/dropLocation.ts`
- `src/features/vendor/utils/dropsState.test.mjs`
- `src/features/vendor/pages/VendorDropsPage.tsx`
- `src/features/vendor/components/drops/VendorDropsWorkspace.tsx`
- `src/features/vendor/components/drops/DropsMap.tsx`
- `src/features/vendor/components/drops/DropDurationDialog.tsx`
- `src/features/vendor/components/drops/DropPromoDialog.tsx`
- `src/features/vendor/components/drops/LiveDropPromoDialog.tsx`
- `src/features/vendor/components/drops/drops.css`
- `src/features/customer/api/discovery.api.ts` — extend existing promotions read.
- `src/services/api/baseApi.ts` — TruckDrops / TruckPromotions tags.
- `docs/batch-5-drops-promotions-integration.md`

Prior work preserved. No backend, dependencies, secrets or authentication changes.

## 2. Endpoints integrated

Current backend controllers/services/DTOs/repositories are authoritative:

| `/api/v1` endpoint                         | Contract used                                                                                                                                                       |
| ------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| PATCH `/food-trucks/:id/operating-status`  | `{operatingStatus: OPEN/CLOSED/BUSY/UNAVAILABLE}` → raw owned truck.                                                                                                |
| PATCH `/food-trucks/:id/location`          | Real latitude/longitude, optional address/validForMinutes → raw location record with coordinates/status/server timestamps. Blank address clears the stored address. |
| POST `/food-trucks/:id/drops`              | Coordinates, optional title/message/address, durationMinutes 1–1440 → raw Drop UUID, truck UUID, ACTIVE status, coordinates and actual start/end timestamps.        |
| GET `/promotions/food-trucks/:foodTruckId` | Existing discovery endpoint reused. Owner management requests `activeOnly=false&limit=100`; Customer discovery retains `activeOnly=true`. Raw promotion array.      |
| POST `/promotions`                         | Validated promotion fields plus owned foodTruckId → raw promotion.                                                                                                  |
| PATCH `/promotions/:promotionId`           | Validated partial fields, including isActive → raw matching promotion.                                                                                              |

Promotion types: PERCENTAGE/FIXED_AMOUNT/FREE_ITEM/CUSTOM. DTO/service rules include nonnegative optional amounts, percentage ≤100, title ≤255, coupon ≤100, positive integer usage limit, booleans and valid ordered ISO dates. Nullable optional fields can be cleared during editing. The actual model has no createdAt/updatedAt, despite Swagger examples; none are invented.

## 3. Working functionality

- Verified Vendor-owned truck selection; real operating status and truck data replace simulated availability.
- Location acquisition occurs only through the explicit device-location button, with denied/unavailable/timeout handling. Manual coordinates are supported; blank inputs never become zero. Addresses are entered, never reverse-geocoded or fabricated.
- Existing duration controls/dialog support hours/minutes → 1–1440 minutes; All day explicitly means 24 hours.
- Confirmed Go Live runs location PATCH, operating-status OPEN PATCH, then Drop POST. Any failed stage stops later operations. Truck reads reconcile partial changes; success is reported only after all acknowledgments validate. The last returned Drop record stays separate from a current-history claim.
- Real promotion list, create/edit dialogs, activation/deactivation and complete supported fields. Disabled/expired entries remain visible. Currency is unavailable for monetary discounts; returned Decimal strings remain precise.
- Existing page/dialog styles retained; the sample map is excluded from live mode. Last acknowledged coordinates are labeled, with no fabricated pin/provider notification.

Mutations require active verified VENDOR ownership, real UUIDs and explicit confirmation. Shared per-truck flights prevent concurrent writes. Session/role/truck changes discard stale callbacks; RTK Query owns backend records. Drafts survive recoverable failures. Truck, promotions, discovery/profile and analytics caches refresh after writes, including uncertain outcomes.

## 4. Unsupported operations

Stop/delete Drop, promotion deletion and promo-to-Drop attachment remain visibly unavailable. Changing operating status does not cancel a Drop; disabling a promotion is not deletion. Existing preview components remain isolated from live records.

## 5. Final verification

- Focused: **103 passed**, including **50 new regressions**.
- Full `npm test`: **1,147 passed, 0 failed/skipped** (1,097 Batch 4 tests + 50 new), including the corrected Batch 4 assertion.
- Production build/TypeScript: **passed**.
- Repository `npm run lint`, changed-file Prettier checks and `git diff --check`: **passed**. This also confirms Batch 4's lint corrections repository-wide.

Tests cover six contracts, ownership/staff/session restrictions, device-location errors, coordinate/duration boundaries, partial Go Live failures, uncertainty locks, promotion validation/edit/activation, cache refresh and unavailable controls. HTTP/location providers were mocked. No live backend/provider calls. Manual interactive/responsive review remains with the developer under AGENTS.md restrictions.

## 6. Remaining blockers

There is no owner Drop-history/recovery endpoint. An uncertain final Drop POST cannot be proved absent by rereading trucks, so resubmission is blocked in the current store/session. Uncertain promotion creation similarly blocks identical draft resubmission; server list refresh supports review. Durable cross-reload exactly-once guarantees require backend idempotency/recovery support.

Promotion management is limited to 100 records without pagination. Map rendering and reverse geocoding are unavailable. No Batch 6 work started.
