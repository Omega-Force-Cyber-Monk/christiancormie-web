# Sprint 3 — T10: Profile, settings and vendor menu integration

Date: 2026-10-29 (Asia/Dhaka). Scope: C26/C27/C31/C33 and V18–V22. Batches A → B → C → D were implemented and validated sequentially. Backend read-only; T11 and later work are not started.

## 1. References and preserved baseline

Reviewed the relevant [frontend audit](frontend-audit.md), [API mapping](frontend-backend-api-mapping.md), [integration plan](frontend-api-integration-plan.md) and [gaps](api-integration-gaps.md), with the completed [T01 authentication](sprint-1-auth-integration.md), [T02 logout/errors](sprint-1-logout-error-integration.md), [T03 admin](sprint-1-admin-adapter-integration.md), [T04 vendor](sprint-2-vendor-dashboard-integration.md), [T05 discovery](sprint-2-t05-discovery-integration.md), [T06 members/rankings/rewards](sprint-2-t06-member-rankings-rewards-integration.md), [T07 publishing](sprint-2-t07-social-feed-publishing-integration.md), [T08 messaging](sprint-2-t08-messaging-integration.md) and [T09 verification](sprint-2-t09-admin-verification.md) reports as the 542-test baseline.

Current backend controllers, DTOs, services, repositories, Cloudinary implementation and Prisma profile/truck/image/menu relations were the source of truth. Important differences from the older audit:

- NewFoodTruckLeadDto has **no usualLocation** property. Location, description and reason are preserved in labeled notes; only supported truckName/ownerPhone/notes are sent.
- Menu availability uses **status: AVAILABLE/UNAVAILABLE/SOLD_OUT**, rather than isAvailable. No menu-item DELETE route exists.
- Truck operatingHours are stored as Prisma TIME/Date values and serialize as UTC-anchored ISO strings; writes require HH:mm. The adapter retains the server clock rather than converting through the browser timezone.
- Gallery image metadata has imageUrl, optional altText and sortOrder; no category field is admitted.

V21's T06 Posts/Tagged posts and public reviews remain connected through their existing components. Their endpoints were not implemented again.

## 2. Exact T10 files changed

Only this task's files are listed; prior working-tree changes were preserved. No stylesheet, dependency manifest, environment secret or backend file was changed.

```text
docs/sprint-3-t10-profile-settings-vendor-menu-integration.md
src/features/account/api/account.api.ts
src/features/account/components/AccountPasswordForm.tsx
src/features/account/hooks/useAccount.ts
src/features/account/schemas/account.schema.ts
src/features/account/utils/account.test-fixtures.mjs
src/features/account/utils/accountAdapters.ts
src/features/account/utils/accountIntegration.test.mjs
src/features/customer/components/profile/MemberProfileEditor.tsx
src/features/customer/components/settings/SettingsPasswordForm.tsx
src/features/customer/components/settings/SettingsProfileEditor.tsx
src/features/customer/components/settings/SettingsProfilePanel.tsx
src/features/customer/components/settings/SettingsRequestForm.tsx
src/features/customer/pages/CustomerMemberProfilePage.tsx
src/features/customer/pages/CustomerSettingsPage.tsx
src/features/customer/schemas/member-profile.schema.ts
src/features/customer/schemas/settings.schema.ts
src/features/customer/utils/settingsState.test.mjs
src/features/vendor/api/truckAssets.api.ts
src/features/vendor/api/truckMenu.api.ts
src/features/vendor/api/truckSettings.api.ts
src/features/vendor/components/profile/ManagedTruckGallery.tsx
src/features/vendor/components/profile/ManagedVendorMenu.tsx
src/features/vendor/components/profile/VendorMenuItemDialog.tsx
src/features/vendor/components/profile/VendorProfileEditor.tsx
src/features/vendor/components/profile/VendorProfileMenu.tsx
src/features/vendor/components/profile/VendorProfilePhotoPicker.tsx
src/features/vendor/components/profile/VendorProfileSummary.tsx
src/features/vendor/components/settings/VendorPasswordPreviewForm.tsx
src/features/vendor/pages/VendorProfilePage.tsx
src/features/vendor/pages/VendorSettingsPage.tsx
src/features/vendor/schemas/settings.schema.ts
src/features/vendor/schemas/truckAssets.schema.ts
src/features/vendor/schemas/truckMenu.schema.ts
src/features/vendor/schemas/truckSettings.schema.ts
src/features/vendor/schemas/vendor.schema.ts
src/features/vendor/utils/persistTruckAsset.ts
src/features/vendor/utils/profileState.test.mjs
src/features/vendor/utils/settingsState.test.mjs
src/features/vendor/utils/truckAssetsIntegration.test.mjs
src/features/vendor/utils/truckMenu.test-fixtures.mjs
src/features/vendor/utils/truckMenu.ts
src/features/vendor/utils/truckMenuIntegration.test.mjs
src/features/vendor/utils/truckSettings.test-fixtures.mjs
src/features/vendor/utils/truckSettings.ts
src/features/vendor/utils/truckSettingsIntegration.test.mjs
src/services/api/authBaseQuery.ts
src/services/api/sessionGuard.ts
```

## 3. Verified endpoints, payloads and responses

Paths below include the configured /api/v1 prefix. All calls reuse shared RTK Query baseApi, bearer credentials, normalized errors and existing refresh/retry handling. Responses are runtime checked and restricted to reviewed properties. The frontend never derives write permission from a Prisma model alone.

| Operation                                               | Request used                                                                                                                                    | Actual response consumed and permission                                                                                                                                        |
| ------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| GET /users/me                                           | Existing authenticated read                                                                                                                     | Existing CurrentUserResponse; exact user ID checked before applying refreshed identity                                                                                         |
| PATCH /users/me/profile                                 | Changed subset of displayName (≤150), email (valid email), phone (≤30); strict whitelist                                                        | Raw profile record plus email/phone; userId/displayName/email/phone checked. JWT current user; no fullName, firstName/lastName, bio or avatar URL write                        |
| POST /users/me/profile/avatar/upload                    | FormData field **file**, actual image File                                                                                                      | {message,avatarUrl}; remote credential-free HTTP(S) URL required. Service validates image MIME and ≤5 MB, then upserts avatarUrl                                               |
| POST /auth/change-password                              | {currentPassword,newPassword,confirmNewPassword}; frontend confirmPassword maps explicitly                                                      | {success:true,message}; JWT current user. New password ≥8, uppercase/lowercase and digit or special character; must differ from current; confirmation must match               |
| POST /community/new-food-truck-leads                    | {truckName, optional ownerPhone, notes}; no usualLocation/coordinates                                                                           | Raw NewFoodTruckRequest; UUID id/truckName checked. Current controller is public and does not pass requestedById; this UI still requires verified Customer identity            |
| DELETE /users/me                                        | No body; deliberate confirmation required locally                                                                                               | {deleted:true,message}; JWT user, service refuses any account with a vendor profile. Local cleanup only after fulfilled, validated deletion                                    |
| GET /vendors/me                                         | Existing T04 read                                                                                                                               | Existing vendor owner identity, dashboardAccess, account status and verification metadata                                                                                      |
| GET /food-trucks/mine                                   | Existing T04 read                                                                                                                               | Raw owned truck array, including images, cuisines, operatingHours and Menu → categories → items; reviewed nested fields added to the existing schema                           |
| GET /food-trucks/cuisines                               | No query/body                                                                                                                                   | Active cuisine array; actual UUID/name/slug used, not fixture IDs                                                                                                              |
| PATCH /food-trucks/:id/profile-settings                 | Changed name ≤255, handle ≤80 without @, description, cuisine UUID selections and numeric-day hours; profileImageUrl only from confirmed upload | Raw truck including relations; returned truck/vendor association checked. JWT VENDOR and service owner checks                                                                  |
| POST /vendors/me/onboarding/upload                      | FormData field **file**, actual image File                                                                                                      | {url,publicId,width,height,format,resourceType,originalFilename}; image resource/remote URL checked. JWT VENDOR; uploads do not themselves create gallery/menu/profile records |
| POST /food-trucks/:id/images                            | {imageUrl, optional altText ≤255, sortOrder integer ≥0}                                                                                         | Raw FoodTruckImage {id,foodTruckId,imageUrl,altText,sortOrder}; owned truck required                                                                                           |
| PATCH /food-trucks/:id/images/:imageId                  | Changed altText/sortOrder from metadata form                                                                                                    | Same raw image record; truck/image ownership and response association checked                                                                                                  |
| DELETE /food-trucks/:id/images/:imageId                 | No body; explicit confirmation                                                                                                                  | Deleted raw image record; record ID and truck ID checked before invalidation                                                                                                   |
| POST /food-trucks/:id/menus/basic                       | User-entered menu name ≤150, categories with category name ≤150 and at least one user-entered item                                              | Raw Menu with actual category/item IDs. At least one category/item required by service; only called when verified hierarchy has no menu                                        |
| POST /food-trucks/:id/menus/:menuId/categories          | {name}; no fabricated menu/category ID                                                                                                          | Raw MenuCategory including items; menuId association checked                                                                                                                   |
| POST /food-trucks/:id/menu-categories/:categoryId/items | {name ≤255,description,price,isVegetarian,isVegan,isGlutenFree, optional confirmed imageUrl}                                                    | Raw MenuItem with Decimal price, status and categoryId; existing category must belong to owned menu/truck                                                                      |
| PATCH /food-trucks/:id/menu-items/:itemId               | Supported item properties; availability sends only {status}                                                                                     | Raw MenuItem; item/category association checked. No isAvailable field, fake delete, or cents conversion                                                                        |

Additional DTO properties are not inferred into the UI. Profile-settings also admits coverImageUrl, minimumBookingAmount, numeric maximumGuestCapacity and a complete spatial serviceArea. Existing controls do not supply enough information for all of them. Menu/category DTOs admit optional descriptions/sort order; this UI submits only collected supported fields. Setup's nested item sortOrder is integer, while CreateMenuItemDto admits a nonnegative number.

### Backend source references

- [UsersController](../../christinacormie-backend/src/modules/users/users.controller.ts), [UsersService](../../christinacormie-backend/src/modules/users/users.service.ts) (profile 53, avatar 166, deletion 344), [UpdateProfileDto](../../christinacormie-backend/src/modules/users/dto/update-profile.dto.ts).
- [AuthService](../../christinacormie-backend/src/modules/auth/auth.service.ts) changePassword 423 and [ChangePasswordDto](../../christinacormie-backend/src/modules/auth/dto/change-password.dto.ts).
- [NewFoodTruckLeadDto](../../christinacormie-backend/src/modules/community/dto/new-food-truck-lead.dto.ts), [CommunityController](../../christinacormie-backend/src/modules/community/community.controller.ts), [CommunityRepository](../../christinacormie-backend/src/modules/community/community.repository.ts) createNewFoodTruckLead 669.
- [FoodTrucksController](../../christinacormie-backend/src/modules/food-trucks/food-trucks.controller.ts), [FoodTrucksService](../../christinacormie-backend/src/modules/food-trucks/food-trucks.service.ts), [FoodTrucksRepository](../../christinacormie-backend/src/modules/food-trucks/food-trucks.repository.ts): owner checks, profile settings, images, menus, returned hierarchy and toTimeDate.
- [Profile settings DTO](../../christinacormie-backend/src/modules/food-trucks/dto/update-profile-settings.dto.ts), [hours DTO](../../christinacormie-backend/src/modules/food-trucks/dto/set-operating-hours.dto.ts), [cuisine selections](../../christinacormie-backend/src/modules/food-trucks/dto/set-cuisines.dto.ts), [image DTO](../../christinacormie-backend/src/modules/food-trucks/dto/add-truck-image.dto.ts), [image patch DTO](../../christinacormie-backend/src/modules/food-trucks/dto/update-truck-image.dto.ts).
- [Basic menu DTO](../../christinacormie-backend/src/modules/food-trucks/dto/setup-basic-menu.dto.ts), [category DTO](../../christinacormie-backend/src/modules/food-trucks/dto/create-menu-category.dto.ts), [item DTO](../../christinacormie-backend/src/modules/food-trucks/dto/create-menu-item.dto.ts), [item update DTO](../../christinacormie-backend/src/modules/food-trucks/dto/update-menu-item.dto.ts), [menu schema](../../christinacormie-backend/prisma/schema/14-menus.prisma).
- [VendorsService](../../christinacormie-backend/src/modules/vendors/vendors.service.ts) uploadOnboardingAsset 686 and [CloudinaryService](../../christinacormie-backend/src/infrastructure/cloudinary/cloudinary.service.ts). Provider configuration remains server-side and was not read or changed.

## 4. Batch A — Customer implementation

Settings Profile and the member editor now save the real displayName; Settings also saves supported email/phone changes. Values initialize from verified /users/me rather than the static profile reducer. Null contacts remain empty form values; unchanged optional values are omitted, and no N/A placeholder is submitted. The editor captures its starting baseline so a refreshed untouched contact is not silently overwritten. Full Name/Bio remain visible and read-only, with explicit explanation; there is no multi-field name-to-displayName substitution.

Successful writes refresh /users/me and apply its verified identity while preserving the explicitly selected active role when it remains in the complete backend role set. CurrentUser and member-related caches refresh. If persistence succeeds but the identity read fails, the UI distinguishes saved data from pending identity refresh; Settings provides Refresh account. Failure keeps the editing draft and field/form feedback.

Avatar flow selects a File, previews through existing object-URL cleanup, uploads only on the explicit Upload action, consumes the confirmed remote URL, and refreshes identity/member caches. No blob URL is submitted as a profile value. Safe JPG/PNG/WebP and the existing 5 MB frontend limit are preserved. Provider failure keeps the selection for explicit retry; no progress percentage is fabricated.

The truck request keeps required truck name/location inputs and optional phone/description/reason. The actual DTO has no usualLocation, so location/description/reason are preserved as labeled notes and phone maps to ownerPhone. No city/state/coordinates, ownership attribution or bonus points are invented. Success uses the returned real request, not a locally generated ID/count.

Customer deletion reuses the existing destructive ConfirmationDialog, now explaining permanent deletion and requiring explicit confirmation. The API also requires a current verified non-vendor record. Vendor-profile accounts have the action disabled and are rejected if called anyway. Failed/blocked deletion preserves account access; confirmed fulfillment clears the same session/cache/socket only. The cleanup occurs after mutation fulfillment so resetting RTK Query cannot abort the confirmed deletion result. A delayed old deletion cannot clear a replacement login.

Support, invite and other unrelated Settings previews remain labeled/unchanged. Account data is no longer sourced from their legacy static profile snapshot.

## 5. Password integration — Customer and Vendor

Both existing wrappers use one AccountPasswordForm/mutation/schema with their respective styling. The confirmation field maps to confirmNewPassword, current/new/confirmation validation matches the DTO and service, and duplicate submissions are locked.

Plaintext stays in transient form/request memory, is never written to local/session storage or logs, and the captured RTK mutation result is reset after completion. Successful changes clear sensitive form fields. Errors retain recoverable feedback.

The service uses **401 Current password is incorrect** for an action-level failure. Shared authBaseQuery now skips refresh only for this exact diagnostic on this exact endpoint. Expired JWT responses retain normal bounded refresh/retry behavior; route/session guards are unchanged. The service updates passwordHash only and does not revoke all refresh tokens or sign out every device. The UI does not claim otherwise. Social-login accounts with no password receive the real service rejection.

## 6. Batch B — Vendor profile

VendorProfilePage uses T04 context, actual vendor/truck ownership, dashboardAccess and account restrictions. A singleton owned truck is unambiguous; multiple trucks require explicit selection with no default. Missing/incomplete onboarding has an unavailable state, and no fixture truck/user is used.

The existing editor keeps name/handle/motto/location, hours, capacity and cuisines styling. Name writes truck name; motto writes description. Handle is its own field, not a slug. A name update may regenerate the slug on the backend; cache invalidation obtains the returned identity instead of inventing one.

Cuisine choices come from actual catalogue UUIDs. Existing primary flags are preserved for retained selections; new unchecked-primary selections send false, without arbitrarily choosing a first primary. Catalogue failure disables cuisine editing while independent fields remain editable.

Hours use numeric dayOfWeek 0–6, with the editor's explicit Sunday=0/Monday=1 convention, isClosed and HH:mm. The repository anchors TIME values on 1970-01-01 UTC; returned clock values are converted back to HH:mm without browser timezone conversion. Missing days have no invented opening time and untouched missing days are omitted. Existing unedited hours survive a background refresh when another day is changed. No local-now open/closed status or timezone is inferred.

The server's actual numeric capacity is shown. Existing range choices are disabled, and maximumGuestCapacity is never guessed from a range. Location text stays read-only: the serviceArea DTO requires real coordinates and radius, so changing address text alone cannot supply a valid spatial update. Both blockers are explained without preventing independent name/description/handle/cuisine/hour/photo saves.

Fixture promotions, fixed rank/follower/rating values, credit acceptance and fabricated verification are removed from the connected summary. Actual returned followers/rating/optional verification are used; unsupported statistics remain N/A. T06 social and review content remains in place.

## 7. Batch C — Images and gallery

The existing photo picker/preview remains. Profile-photo Save uploads through onboarding/upload before PATCHing profileImageUrl. Gallery Add uploads before POSTing its real image record; upload success alone is never reported as gallery success.

Confirmed upload metadata is retained with the selected File for explicit retry if persistence fails. A replaced session cannot remember/apply the old upload. Local previews do not appear as persisted gallery rows, and object URLs are released by the existing photo/preview components. Vendor upload's backend checks image MIME but has no service size cap; the frontend deliberately retains its established safe JPG/PNG/WebP, nonempty, ≤5 MB policy.

Gallery records come from /food-trucks/mine and use actual image UUIDs. Metadata editing supports altText/sortOrder, submits dirty metadata only, and does not invent image categories. Deletion requires confirmation and updates the server record; a stale/deleted image remains a recoverable HTTP error, not local simulated success. Refresh gallery is available. Selected image IDs resolve against current cached records instead of retaining a separate server-image collection.

These truck gallery controls are displayed alongside the existing T06 Posts/Tagged posts gallery, preserving that completed functionality.

## 8. Batch D — Menus and items

The hierarchy is read from the existing owned-truck response: FoodTruck → Menu → MenuCategory → MenuItem. Runtime validation checks returned UUID associations. No separate menu GET endpoint, fixture category, generated item UUID or local menu slice is invented.

When no menu exists, the item dialog additionally requires a real menu name and first category name. One basic-menu request contains the first entered item because the backend requires a nonempty category/item hierarchy. Existing menus are reused; multiple menus require explicit selection. Basic setup is rejected client-side when a menu is already present. Category creation uses the actual selected menu ID and then refetches the hierarchy. A category must exist before an item can be added.

Create/edit retains the existing item dialog/photo/name/description/price layout, adding supported dietary controls and actual category selection. The old mock 120-character description restriction is not treated as a backend limit. Names follow the DTO limit. Backend Decimal(12,2) prices are major-unit amounts; the form admits a nonnegative decimal with up to two fractional digits and the database amount bound. No cents conversion occurs. Display formatting preserves Decimal strings; currency is explicitly unavailable because these records contain no currency field.

Availability PATCH sends status AVAILABLE or UNAVAILABLE and preserves the actual returned state, including SOLD_OUT. The existing delete control explains that permanent deletion is unavailable. It does not send a fabricated DELETE, remove a row locally or relabel unavailability as deletion.

Necessary contract-driven UI additions are explicit: menu/category names for initial setup, actual menu/category selectors, dietary flags, gallery metadata inputs/confirmation and upload/refresh actions. Existing responsive classes, tabs, layouts and shared modal/form primitives are retained; no stylesheet/global redesign was introduced.

## 9. Session, errors, ownership and cache behavior

New mutations use SessionScope (session ID, verified user ID, active role), checks before and after awaited requests, and per-store/session operation locks. Vendor writes additionally verify the T04 cached owner/truck and dashboard access; menu/image operations verify the nested record association. Backend owner/membership checks remain authoritative.

Local state is limited to form drafts, selected IDs, modal/filter state and confirmed upload metadata needed for retry. Server entity collections stay in shared RTK Query. Account/role replacement remounts sensitive workspaces; stale callbacks cannot update identity, apply old uploads, report new-account success or clear the replacement session. Existing T01–T09 guards, bootstrap, cross-tab protections, refresh, logout and socket cleanup remain.

Normalized errors and allowlisted field errors are reused; array validation details remain useful at form level when field identity is uncertain. Forms retain drafts on rejected writes and show root errors for permission/not-found/conflict/network/server failures. No server stack, provider secret or fabricated success is shown.

- Account writes invalidate CurrentUser, MemberProfile/Posts/Followers/Following, SocialFeed/SocialPosts and conversation identity caches; profile completion also refreshes Rewards.
- Lead creation refreshes the existing AdminVendors domain.
- Truck/menu/gallery writes invalidate existing Vendor, FoodTruck, TruckProfile, Discovery, VendorAnalytics, VendorQr, MemberProfile/Posts/Followers/Following, SocialFeed/SocialPosts, Favorites and conversation identity tags.
- FoodTruck owns nested gallery/menu lists; public TruckProfile/Discovery consumers refetch across roles. No unrelated API service or new HTTP client is introduced.
- Failed writes do not optimistically remove or fabricate records. Successful writes use confirmed responses and authoritative refetch.

## 10. Validation and results

The existing SSR/Node runner was inspected and used with mocked HTTP. Each batch passed before work proceeded to the next:

| Stage                                                               | Focused execution result                                        |
| ------------------------------------------------------------------- | --------------------------------------------------------------- |
| Batch A: account + existing Customer Settings suite                 | 32 passed (initial 20 new account cases plus 12 existing cases) |
| Batch B: truck settings + existing Vendor profile/settings suites   | 38 passed                                                       |
| Batch C: assets + vendor profile settings                           | 26 passed                                                       |
| Batch D: menu + assets + profile settings                           | 42 passed                                                       |
| Additional account/cache/baseline and existing profile/settings run | 62 passed                                                       |
| Final vendor TIME/asset/menu focused run                            | 44 passed                                                       |
| First complete regression candidate                                 | 604 passed                                                      |
| Subsequent complete regression candidate                            | 608 passed                                                      |
| Final complete regression suite (`npm.cmd test`)                    | **609 passed, 0 failed/skipped**                                |
| Final build (`npm.cmd run build`, includes TypeScript)              | **Passed; 3,198 modules transformed**                           |
| Final lint (`npm.cmd run lint`)                                     | **Passed**                                                      |

Final source adds 67 cases: account 23, truck profile settings 14, gallery/assets 14, menus 16. Existing static reducer tests remain for their unchanged legacy utilities; only presentation/schema fixtures were updated where integrated behavior changed. No regression or compiler/lint rule was disabled. The new coverage includes exact routes/headers/DTOs/envelopes, supported/unsupported fields, nullable contacts/Decimal values, role-preserving identity refresh, cross-feature member refetch, avatar provider failure/retry, password strength/confirmation/incorrect-password versus expired-JWT 401, confirmed/blocked deletion, ownership/dashboard restrictions, duplicate/stale-session handling, TIME serialization, upload/persist partial recovery, actual hierarchy IDs, menu setup reuse, availability, unsupported deletion and error/empty states.

No production credentials/API calls, live destructive operations, backend build/lint/test/runtime commands, dependency installs or environment-secret changes were used. Browser/responsive/keyboard/focus and live non-production email, Cloudinary, CORS/database verification remain unexecuted under AGENTS.md sections 12–13. Static rendering is not interactive/visual certification.

Final changed-file Prettier checks passed for all 48 manifest files. Git diff whitespace checks passed; all 36 report links resolve and every manifest path exists. Backend status matches the initial baseline: only the two pre-existing untracked audit documents, with no tracked backend changes.

## 11. Remaining backend/product limitations

1. **U04 — full name, separate names and bio:** not writable through UpdateProfileDto. Read-only controls remain. A broader identity-editing contract/product mapping is needed.
2. **Capacity range:** no approved one-number meaning exists. Range submission stays blocked; no maximum or midpoint is guessed. A numeric-capacity UX or approved mapping is needed.
3. **Service area:** current address-only control lacks mandatory latitude/longitude/radius. Existing data is preserved, and spatial writes stay blocked pending a suitable UI/provider contract.
4. **U10 — menu deletion:** no item DELETE route exists. Availability is a separate supported status operation, not permanent removal.
5. **Currency and hours:** menu rows have no currency field, and hours have no timezone. The UI does not invent either. Numeric weekday storage has no named enum; this editor uses the stated Sunday-zero convention and preserves numeric round trips.
6. **Upload lifecycle:** Cloudinary must be configured on the backend. Avatar replacement/gallery deletion does not supply a general provider-asset cleanup operation. Abandoned or unconfirmed uploads may leave remote assets; no fake cleanup is called.
7. **Ambiguous persistence/idempotency:** these profile/image/menu/category/lead operations have no verified idempotency or request-correlation key. Lost responses can follow persisted changes. Confirmed uploads are reused, drafts remain, and the UI asks for hierarchy refresh before explicit retries; it does not auto-resend ambiguous mutations or claim exactly-once guarantees. Cross-client duplicate menu/category creation requires backend constraints.
8. **Lead attribution/rewards:** the current public controller does not attach authenticated requestedById, returns no usualLocation and confirms no bonus points. Notes preserve collected meaning; no attribution or points are manufactured.
9. **Email/password/account policy:** profile email updates do not expose a new re-verification workflow in this service; password changes do not revoke every device. Customer deletion is prohibited when a vendor profile exists and may fail on backend constraints; failure never becomes a local deletion success.
10. Previously documented T04–T09 blockers remain. No support, staff, community workflow, booking, payment or realtime implementation is added beyond this task's explicitly requested truck lead.

## 12. T10 acceptance status

**Fully implemented for supported contracts:** Customer display-name/email/phone changes, avatar upload, shared password changes, real truck lead, deliberate non-vendor deletion, owned vendor name/handle/description/cuisine/hour/profile-photo edits, gallery upload/add/metadata/delete, real menu setup/category/item create/edit and availability; existing V21 reads and T01–T09 infrastructure are preserved.

**Partial/blocked portions remain explicit:** full-name/bio writes, capacity-range conversion, spatial updates from address text alone and permanent menu-item deletion. Provider cleanup, exact-once recovery, absent currency/timezone and lead attribution require backend/product support.

**Unverified:** live/provider/database and browser/manual release behavior. Automated results and their limits are recorded above; no production-readiness claim is made.

Work stops at T10. T11 and later Sprint 3 tasks are not started.
