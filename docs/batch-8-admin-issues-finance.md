# Batch 8 — Admin issues and financial operations

## Files changed

- `src/features/admin/api/adminIssues.api.ts`
- `src/features/admin/api/adminIssues.test.mjs`
- `src/features/admin/components/bookings/BookingMessageModal.tsx`
- `src/features/admin/components/bookings/BookingDetailsModal.tsx`
- `src/features/admin/components/AdminFinancialOperations.tsx`
- `src/features/admin/pages/AdminBookingsPage.tsx`
- `src/features/admin/pages/AdminPaymentsPage.tsx`
- `src/features/admin/utils/adminFinancialSafety.ts`
- `src/features/admin/utils/adminOperations.ts`
- `src/features/admin/utils/adminPayments.test.mjs`
- `src/features/admin/utils/adminDashboard.test.mjs`
- `src/services/api/baseApi.ts`
- This report. Prior uncommitted work is preserved.

## Connected features

Verified current controller/service/repository authorization permits Admin issue reads
and Admin messages on OPEN issues. Existing Admin booking/payment reads, layouts,
dialog lifecycle and shared T15-C response schemas are reused.

| Endpoint under `/api/v1`                             | Contract                                                                                            |
| ---------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| GET `/bookings/:bookingId/issues`                    | `{items}` with status, original description, resolution fields and message history                  |
| GET `/bookings/:bookingId/issues/:issueId/messages`  | `{issue,messages}`; chronological messages include actual sender role/name and original description |
| POST `/bookings/:bookingId/issues/:issueId/messages` | Trimmed `{message}`, 1–2000 characters; response `{message,item}`                                   |

The existing issue/message dialog now displays real booking/issue UUIDs, OPEN,
RESOLVED and DISMISSED history, messages and returned resolution notes/decisions.
Generated conversation IDs, local message success and hardcoded resolution claims are
removed. Explicit confirmation, fresh known OPEN issue/thread, verified active ADMIN,
per-booking write lock, mounted/session checks and matching Admin acknowledgements
protect sends. Recoverable errors retain drafts; errors never become empty success.
Message projections lack issueId: association is validated through the real request
path and matching thread issue envelope, without inventing response fields.

Writes revalidate issue history/thread, Admin bookings, payments (including their
refund/payout projections), dashboard and notification tags, also after uncertain errors.
No message is optimistically appended. Existing logout/role/account cache cleanup remains.

## Financial operations: deliberately disabled

Resolution PATCH accepts `RELEASE_PAYOUT` / `FULL_REFUND` and optional resolutionNote
(maximum 1000 characters); its service can transfer/refund funds before recording
subsequent issue/booking transitions. No resolution mutation is registered or invoked.
Approve PATCH and retry POST both call `retryFailedPayout`: only FAILED payouts with
booking/payment links, ready vendor account and positive amount can be retried. The
pre-existing approve API remains unused. Deprecated reject/hold actions are not exposed.

Read-only eligibility panels show actual issue/booking/payment state, valid identities,
returned currency/amounts, refunds and payout failure/paid dates. All money controls
are disabled. Backend payout labels APPROVED and ON_HOLD mean PAID and PROCESSING,
respectively, and are explained alongside the original labels; misleading pending
canApprove flags are not trusted. Payout table amounts reuse the precision-preserving
financial formatter. Backend Number conversion already loses precision irrecoverably.

T14 ownership/idempotency, currency/settlement, concurrent resolution/retry and failure
reconciliation blockers remain unresolved and unapproved. Management payloads omit
provider transfer status, payout booking/payment links and authoritative refund status;
these are marked unavailable. No financial success is inferred from booking/issue state.

## Verification and status

- Focused Admin issue/booking/payment regressions: **66 passed**.
- Final full-suite rerun: **1,276 passed, 0 failed** (1,226 baseline + 50 new tests).
- Production build including TypeScript and repository lint: **passed**.
- Changed-file Prettier and repository `git diff --check`: **passed**.
- The first full run exposed one old rounded-currency assertion; the regression now
  checks explicit currency/precision and null versus zero. A new form handler lint
  finding was corrected. Affected focused rechecks: **64 passed**.
- Mocked checks cover contracts, status/identity matching, confirmed DTOs, duplicate
  sends, 400/401 refresh/403/404/409/5xx/network failures/retry, session replacement,
  cache refresh, real UI content and disabled financial controls/no money requests.
- Backend, dependencies and environment unchanged. No real provider calls, servers or
  browser automation; interactive dialog/draft/responsive review remains manual under AGENTS.md.

All independently supported Batch 8 work is implemented. Uncertain message delivery
still requires checking refreshed history before manual retry: backend message POSTs
have no idempotency key. Financial execution awaits the verified prerequisites and
explicit approval above. Batch 9 was not started.
