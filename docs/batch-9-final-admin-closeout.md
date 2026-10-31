# Batch 9 — Final Admin integration and closeout

## Files changed

- `src/features/admin/api/adminVendorOperations.api.ts`
- `src/features/admin/api/adminVendorOperations.test.mjs`
- `src/features/admin/components/vendors/VendorOperations.tsx`
- `src/features/admin/components/vendors/VendorDetailsModal.tsx`
- `src/features/admin/components/vendors/BusinessLicenseModal.tsx`
- `src/features/admin/components/vendors/vendors.types.ts`
- `src/features/admin/utils/adminVendors.ts`
- `src/features/admin/pages/AdminVendorsPage.tsx`
- `src/features/admin/pages/AdminSettingsPage.tsx`
- This report. Prior uncommitted work is preserved.

## Endpoints integrated in Batch 9

| Under `/api/v1`                                                        | Verified contract                                                                                                                                                                                                  |
| ---------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| PATCH `/admin/vendors/:vendorId/suspend`                               | No body; returned vendor must match UUID and SUSPENDED status.                                                                                                                                                     |
| PATCH `/admin/vendors/:vendorId/retrieve`                              | No body; returned vendor must match UUID and APPROVED status. UI restricts this to known suspended accounts.                                                                                                       |
| GET `/admin/verification-requests`                                     | Raw request array with vendor relation and documents JSON; supported limit/offset, pages of 100. No vendor-filter parameter or total is invented.                                                                  |
| PATCH `/admin/verification-requests/:requestId/documents/:documentKey` | `{status, rejectionReason?}`; PENDING/APPROVED/REJECTED, reason maximum 1000 characters. Existing Approve/Decline controls send status only. Updated request, vendor and selected document/file/status must match. |

## Completed Admin functionality

Existing vendor account/document controls now use verified active ADMIN sessions,
real UUIDs, explicit confirmations, shared per-vendor write exclusion, safe errors,
mounted/session guards and authoritative cache refresh. Suspensions/restorations and
document decisions invalidate Admin vendor/dashboard and shared vendor/discovery/profile
caches after confirmed or uncertain writes. No optimistic success is fabricated.

Documents bind to the latest request UUID returned by vendor management. The backend
matches keys against id/type/name/label, case-insensitively; only a key matching exactly
one document is actionable. The original file URL must still match. Missing/changed/
ambiguous documents disable decisions; request pages can be traversed manually. Document
approval changes only document JSON, not request-wide verification, badges or vendor
access. Generic badge removal and initial vendor approval remain explicitly unavailable.

Current Reviews and Community pages contain read-only cards/filters, with no moderation
buttons or comment selection/dialog. Their backend moderation/delete DTOs were checked,
but no unused mutations or new workflow was fabricated. Rewards retains working reads;
Settings now explicitly identifies its read-only overview. Those absent workflows need
approved controls, not guessed transitions or an arbitrary settings editor.

## Final verification

- Focused new/existing Vendor, Review and Community regressions: **61 passed**.
- One full suite: **1,328 passed, 0 failed** (1,276 baseline + 52 new tests).
- Production build/TypeScript and repository lint: **passed**. One unnecessary type
  assertion was removed after lint; the affected 52 tests and build/lint rechecks passed.
- Changed-file Prettier and repository `git diff --check`: **passed**.
- Tests mock HTTP and cover exact contracts, UUID/status/file binding, ambiguity,
  DTO validation, confirmation, duplicate writes, 401 refresh, errors/retry, cache refresh,
  account/role/logout replacement and existing read-only screens. No backend, dependency,
  environment, payment, production-call or browser-automation changes.

## Consolidated remaining blockers — Batches 1–9

**Backend contract missing**

- Selected-room messaging lacks user-room broadcasts for unselected chats/new requests;
  typing, presence, per-message receipts, attachment upload and durable history controls
  remain unsupported. Unsupported notification entities lack verified web detail routes.
- Drop history/recovery, stop/delete and promo-to-Drop association; permanent menu deletion;
  broader name/bio writes, map/geocoding contracts and some Community reaction/block/invite
  operations remain unavailable. Promotion lists and several Admin arrays lack complete
  pagination/totals; currency/timezone metadata and staff task/analytics data remain limited.
- General mutation/upload idempotency, orphan-asset cleanup and stable cross-client recovery
  are absent. Unknown delivery requires reconciliation before manual retry; frontend locks
  do not guarantee exactly-once persistence across reloads/devices.

**Financial/security approval required**

- T14 intent ownership/idempotency/recovery, currency/minor-unit conversion, payment/hold
  expiry, settlement, webhook reconciliation and concurrent transfer/refund/retry safety
  remain unresolved. Quote acceptance/checkout, Stripe confirmation, Connect writes,
  completion/payout release, refunds and Admin resolution/retry remain disabled.
- Management summaries can aggregate currencies/statuses, use Number conversions or omit
  provider/payment/payout associations. They are not settlement ledgers. Immediate account,
  staff-membership and access-token revocation policy still requires backend verification.

**Product decision required**

- Direct booking requires selected truck/menu UUID wiring, legitimate event coordinates
  and explicit timezone, DTO-valid contact/event/budget inputs and published live terms.
  Capacity-range mapping and spatial service-area inputs also need approved UI semantics.
- Review/Community moderation/comment controls, targeted badge removal, initial platform
  approval and explicit reward/referral creation/claim/redemption/configuration workflows
  need approval. Referral share destination/application timing remains unspecified. Markets,
  subscriptions, leaderboard policy and arbitrary platform settings were not invented.
- Provider map/checkout/onboarding experiences, unsupported profile/publishing choices and
  preview-only bank/chart/credit controls require their own approved behavior. T01's explicit
  multi-role chooser is already approved and implemented; it is not an outstanding decision.

**Manual/live testing required**

- Non-production backend/database migrations, deployed CORS/configuration and real
  mail, uploads, Stripe/Connect/webhooks, notification/provider delivery, scheduler freshness
  and recovery/revocation behavior remain unverified. No production credentials were used.
- Browser/responsive/keyboard/focus/screen-reader checks, native location/clipboard behavior,
  cross-tab races and supported-browser refresh coordination need manual/live validation.
  AGENTS.md prohibits automated browser/dev-server verification in this run.

## Release readiness

Source-supported frontend integration within approved existing workflows is complete;
blocked/read-only/preview features remain identified. This is **not production-readiness
certification**: critical financial/security prerequisites and live/manual release checks
remain open. This final batch stops here; no additional batch or speculative feature starts.
