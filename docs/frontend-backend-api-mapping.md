# Frontend-backend API mapping

Audit date: 2026-10-27. See [audit](frontend-audit.md), [plan](frontend-api-integration-plan.md), and [gaps](api-integration-gaps.md). No integration was implemented.

## Reading the matrix

HTTP paths in the matrix are relative to **`/api/v1`**. The endpoint contract appendix expands the method/path, requests, authentication/roles, validation, responses and source references. A feature row and its endpoint cards together form the mapping. Reused contracts are not duplicated for every page. `WS /messaging` is specified separately.

Frontend file basenames below resolve through the source-reference index following the matrix. P0 means current access/contract blockers; P1 identity/read flows; P2 mutations/financial/realtime sequences; P3 missing product contracts or placeholder UI. SUPPORTED means source-backed operations exist; PARTIAL means only part of the grouped requirement is supported; MISSING means no selected matching operation. It is not a production health claim.

## Feature matrix

| ID  | Frontend route                           | Feature / operation                                   | Current status | Method + backend path                                                                                                                                                                                                                                                      | Frontend files                                                                                     | API support | Dependencies / transformation                                          | Priority |
| --- | ---------------------------------------- | ----------------------------------------------------- | -------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- | ----------- | ---------------------------------------------------------------------- | -------- |
| A01 | /login                                   | Password login                                        | INTEGRATED     | POST /auth/login                                                                                                                                                                                                                                                           | LoginForm.tsx; auth.api.ts                                                                         | SUPPORTED   | Verify identity after tokens                                           | P0       |
| A02 | /signup                                  | Register customer/vendor and verify/resend email      | BROKEN         | POST /auth/register/customer; POST /auth/register/vendor; POST /auth/verify-email; POST /auth/resend-verification-code                                                                                                                                                     | SignupForm.tsx; signup.schema.ts; auth.types.ts                                                    | PARTIAL     | G01/G02; role-specific fields and continuation                         | P0       |
| A03 | protected routes                         | Refresh tokens                                        | INTEGRATED     | POST /auth/refresh                                                                                                                                                                                                                                                         | authBaseQuery.ts                                                                                   | SUPPORTED   | A01; retain stale-session protection                                   | P0       |
| A04 | protected routes                         | Current user and verified role selection              | BROKEN         | GET /users/me                                                                                                                                                                                                                                                              | authAdapters.ts; auth.thunks.ts                                                                    | PARTIAL     | G03; approved active-role workflow                                     | P0       |
| A05 | signed-in shells                         | Logout and revocation                                 | PARTIAL        | POST /auth/logout                                                                                                                                                                                                                                                          | auth.middleware.ts; UserMenu.tsx; DiscoverLayout.tsx; VendorHomeLayout.tsx; VendorSettingsPage.tsx | SUPPORTED   | Snapshot refresh token; always local cleanup                           | P0       |
| C01 | /discover                                | Nearby/suggested trucks and filters/search            | MOCK           | GET /discovery/nearby; GET /food-trucks/cuisines                                                                                                                                                                                                                           | CustomerDiscoverPage.tsx; DiscoverFiltersDrawer.tsx                                                | PARTIAL     | Coordinates; DTO filters; recommendation semantics U13                 | P1       |
| C02 | /discover                                | Trending list                                         | MOCK           | GET /discovery/trending                                                                                                                                                                                                                                                    | CustomerDiscoverPage.tsx                                                                           | SUPPORTED   | C01; response foodTrucks adapter                                       | P1       |
| C03 | /discover                                | Favorite save/unsave/list                             | MOCK           | POST /social/food-trucks/:foodTruckId/favorite; DELETE /social/food-trucks/:foodTruckId/favorite; GET /social/favorites                                                                                                                                                    | CustomerDiscoverPage.tsx                                                                           | SUPPORTED   | UUID truck identity; invalidate favorites                              | P1       |
| C04 | /discover; /profile/:id                  | Truck profile/menu/gallery/reviews/promotions         | MOCK           | GET /food-trucks/profile/:slug; GET /food-trucks/profile/:slug/reviews; GET /promotions/food-trucks/:foodTruckId                                                                                                                                                           | DiscoverProfileView.tsx; CustomerProfilePage.tsx; ProfileTabs.tsx                                  | SUPPORTED   | Separate slug and UUID; cursor reviews                                 | P1       |
| C05 | /discover; /profile/:id                  | Follow/unfollow truck                                 | MOCK           | POST /social/food-trucks/:foodTruckId/follow; DELETE /social/food-trucks/:foodTruckId/follow                                                                                                                                                                               | DiscoverProfileView.tsx; ProfileSummary.tsx                                                        | SUPPORTED   | C04; persist real follow state                                         | P1       |
| C06 | /discover                                | Event booking wizard and reference media              | MOCK           | POST /bookings                                                                                                                                                                                                                                                             | DiscoverBookingFlow.tsx; discover-booking.schema.ts                                                | PARTIAL     | C04; coordinates/timezone; numeric/enum/menu mapping                   | P2       |
| C07 | /discover; /profile/:id                  | Message truck/vendor                                  | MOCK           | POST /messaging/conversations/direct                                                                                                                                                                                                                                       | DiscoverProfileView.tsx; CustomerProfilePage.tsx                                                   | SUPPORTED   | M01; real recipient ID                                                 | P2       |
| C08 | /discover; /profile/:id                  | Map and directions                                    | MOCK           | GET /discovery/nearby; GET /food-trucks/profile/:slug                                                                                                                                                                                                                      | CustomerDiscoverPage.tsx; CustomerProfilePage.tsx                                                  | PARTIAL     | U12; coordinates supported, route guidance not supplied                | P1       |
| C09 | /feed                                    | Following/for-you cursor feed                         | MOCK           | GET /social/feed/following; GET /social/feed/explore                                                                                                                                                                                                                       | CustomerFeedPage.tsx                                                                               | SUPPORTED   | A04; items/nextCursor                                                  | P1       |
| C10 | /feed                                    | Post like toggle                                      | MOCK           | POST /social/posts/:postId/like                                                                                                                                                                                                                                            | FeedPostCard.tsx                                                                                   | SUPPORTED   | C09; reconcile server count/liked                                      | P1       |
| C11 | /feed                                    | Comments/replies/comment likes                        | MOCK           | GET /social/posts/:postId/comments; POST /social/posts/:postId/comments; POST /social/comments/:commentId/like                                                                                                                                                             | FeedCommentsDialog.tsx; FeedCommentForm.tsx                                                        | SUPPORTED   | C09; parentCommentId; nested replies                                   | P1       |
| C12 | /feed                                    | Share count and canonical URL                         | MOCK           | POST /social/posts/:postId/share                                                                                                                                                                                                                                           | FeedShareDialog.tsx                                                                                | PARTIAL     | API shareUrl is API-relative; web deep-link decision                   | P2       |
| C13 | /create-post                             | Upload/publish/place/friend tagging                   | MOCK           | POST /social/media/upload; POST /social/posts; GET /social/places; GET /social/profiles/:userId/following                                                                                                                                                                  | CustomerCreatePostPage.tsx; PostDetailsPicker.tsx; create-post.schema.ts                           | SUPPORTED   | Upload first; File to media metadata; UUID tags/place                  | P1       |
| C14 | /community                               | List/mine/category/city/geographic filters            | MOCK           | GET /community/posts; GET /community/posts/mine                                                                                                                                                                                                                            | CustomerCommunityPage.tsx; CommunityLocationView.tsx                                               | SUPPORTED   | A04; enums; limit/offset/nextOffset                                    | P1       |
| C15 | /community                               | Post create/edit/delete/media                         | MOCK           | POST /community/media/upload; POST /community/posts; PATCH /community/posts/:postId; DELETE /community/posts/:postId                                                                                                                                                       | CommunityComposer.tsx; CustomerCommunityPage.tsx; community.schema.ts                              | SUPPORTED   | C14; conditional event fields; ownership/409                           | P2       |
| C16 | /community                               | Comments/reactions                                    | MOCK           | GET /community/posts/:postId/comments; POST /community/posts/:postId/comments; POST /community/posts/:postId/reactions                                                                                                                                                     | CommunityPostCard.tsx; CustomerCommunityPage.tsx                                                   | SUPPORTED   | C14; use returned counts                                               | P1       |
| C17 | /community                               | Report/ignore/restore/block author                    | MOCK           | POST /community/posts/:postId/reports; POST /community/posts/:postId/ignore; DELETE /community/posts/:postId/ignore; POST /social/profiles/:userId/block; DELETE /social/profiles/:userId/block                                                                            | CommunityReportPreview.tsx; CustomerCommunityPage.tsx                                              | SUPPORTED   | C14; report-reason enum; author user UUID                              | P2       |
| C18 | /community                               | Interested vendors and invite/decline                 | MOCK           | GET /community/posts/:postId/interests                                                                                                                                                                                                                                     | CommunityInterestedView.tsx                                                                        | PARTIAL     | C14; organizer invite/decline missing U15                              | P2       |
| C19 | /community                               | Offers/detail/accept/reject/booking                   | MOCK           | GET /community/posts/:postId/offers; PATCH /community/offers/:offerId/accept; PATCH /community/offers/:offerId/reject; PATCH /bookings/quotes/:quoteId/accept; POST /payments/bookings/:bookingId/payment-intent; GET /payments/:paymentId                                 | CommunityOffersView.tsx                                                                            | SUPPORTED   | C14; offer accept returns booking; payment follow-up                   | P2       |
| C20 | /community                               | Tracking/approve completion                           | MOCK           | GET /bookings/:bookingId/tracking; PATCH /bookings/:bookingId/approve-completion                                                                                                                                                                                           | CommunityTrackView.tsx; CommunityBookingDialogs.tsx                                                | SUPPORTED   | C19; paid booking and server completion state                          | P2       |
| C21 | /community                               | Booking issues and issue messages                     | MOCK           | POST /bookings/:bookingId/issues; GET /bookings/:bookingId/issues; GET /bookings/:bookingId/issues/:issueId/messages; POST /bookings/:bookingId/issues/:issueId/messages                                                                                                   | CommunityBookingDialogs.tsx; CommunityTrackView.tsx                                                | SUPPORTED   | C20; real booking/issue UUIDs                                          | P2       |
| M01 | /message; /dashboard/vendor/messages     | Conversation/request list/search/accept/decline       | MOCK           | GET /messaging/conversations; GET /messaging/requests; GET /messaging/recipients; POST /messaging/conversations/direct; PATCH /messaging/conversations/:conversationId/accept; PATCH /messaging/conversations/:conversationId/decline                                      | CustomerMessagePage.tsx; VendorMessagesPage.tsx                                                    | SUPPORTED   | A04; UUID recipients; nextOffset                                       | P1       |
| M02 | /message; /dashboard/vendor/messages     | History/text/send/read                                | MOCK           | GET /messaging/conversations/:conversationId; GET /messaging/conversations/:conversationId/messages; POST /messaging/conversations/:conversationId/messages; PATCH /messaging/conversations/:conversationId/read                                                           | MessageComposer.tsx; MessageThread.tsx; VendorMessageComposer.tsx; VendorMessageThread.tsx         | SUPPORTED   | M01; server message IDs; content max 5000                              | P1       |
| M03 | /message; /dashboard/vendor/messages     | File/image upload and multi-attachment send           | MOCK           | POST /messaging/conversations/:conversationId/messages                                                                                                                                                                                                                     | MessageComposer.tsx; VendorMessageFilesDialog.tsx; VendorMessageAttachment.tsx                     | PARTIAL     | M02; single attachmentUrl only; upload gap U06                         | P2       |
| M04 | /message; /dashboard/vendor/messages     | Realtime messages/read receipts                       | STATIC         | WS /messaging                                                                                                                                                                                                                                                              | socket.ts; useSocket.ts                                                                            | SUPPORTED   | M02; room joins; token refresh; ID dedupe                              | P2       |
| C22 | /leaderboard                             | Top-rated/most-booked/points rankings                 | MOCK           | GET /leaderboards/top-rated; GET /leaderboards/most-booked; GET /leaderboards/foodie-points                                                                                                                                                                                | CustomerLeaderboardPage.tsx; LeaderboardRankings.tsx                                               | SUPPORTED   | Market/period; entries vs points items                                 | P1       |
| C23 | /profile/:id (member)                    | Member identity/posts/tagged photos and social counts | MOCK           | GET /social/profiles/:userId; GET /social/profiles/:userId/posts; GET /social/profiles/:userId/tagged-posts                                                                                                                                                                | CustomerMemberProfilePage.tsx; MemberProfileGallery.tsx                                            | SUPPORTED   | A04; me resolves user ID; distinguish truck namespace                  | P1       |
| C24 | /profile/:id (member)                    | Follow/unfollow member                                | MOCK           | POST /social/profiles/:userId/follow; DELETE /social/profiles/:userId/follow                                                                                                                                                                                               | CustomerMemberProfilePage.tsx                                                                      | SUPPORTED   | C23; self/block restrictions                                           | P1       |
| C25 | /profile/me; /settings                   | Own reward tier/progress and points guide             | MOCK           | GET /rewards/me/profile-summary; GET /rewards/rules                                                                                                                                                                                                                        | CustomerMemberProfilePage.tsx; CustomerSettingsPage.tsx                                            | SUPPORTED   | A04; server tier/pointsPerAction; redemption UI absent                 | P2       |
| C26 | /settings; /profile/me                   | Edit profile/name/photo                               | MOCK           | PATCH /users/me/profile; POST /users/me/profile/avatar/upload                                                                                                                                                                                                              | SettingsProfileEditor.tsx; SettingsProfilePanel.tsx; MemberProfileEditor.tsx                       | PARTIAL     | A04; bio/full-name split not writable U04                              | P1       |
| C27 | /settings                                | Password change                                       | MOCK           | POST /auth/change-password                                                                                                                                                                                                                                                 | SettingsPasswordForm.tsx; settings.schema.ts                                                       | SUPPORTED   | A04; confirmNewPassword; strength rule                                 | P1       |
| C30 | /settings                                | Referral invitation link/code                         | MOCK           | GET /referrals/codes; POST /referrals/codes                                                                                                                                                                                                                                | SettingsInvite.tsx                                                                                 | SUPPORTED   | A04; code/link convention; no apply form currently                     | P2       |
| C31 | /settings                                | Missing truck request                                 | MOCK           | POST /community/new-food-truck-leads                                                                                                                                                                                                                                       | SettingsRequestForm.tsx                                                                            | SUPPORTED   | A04; location to usualLocation and reason mapping                      | P1       |
| C32 | /settings                                | General support tickets/replies                       | MOCK           | NONE                                                                                                                                                                                                                                                                       | SettingsIssueForm.tsx; SettingsSupport.tsx                                                         | MISSING     | U01; booking issues not generic tickets                                | P3       |
| C33 | /settings                                | Permanent customer deletion                           | STATIC         | DELETE /users/me                                                                                                                                                                                                                                                           | CustomerSettingsPage.tsx                                                                           | SUPPORTED   | A04; non-vendor restriction; confirmation/local cleanup                | P2       |
| C34 | /dashboard/customer/orders               | History placeholder                                   | STATIC         | GET /bookings/mine                                                                                                                                                                                                                                                         | CustomerOrdersPage.tsx                                                                             | PARTIAL     | U03; approve booking meaning and missing UI                            | P3       |
| V01 | /dashboard/vendor                        | Home metrics/bookings/activity                        | MOCK           | GET /vendors/me/analytics; GET /bookings/vendor/mine; GET /bookings/vendor/requests/counts                                                                                                                                                                                 | VendorDashboardPage.tsx                                                                            | PARTIAL     | V02; aggregate fields supported, arbitrary activity feed not confirmed | P1       |
| V02 | vendor shell                             | Vendor/truck identity/onboarding access               | MOCK           | GET /vendors/me; GET /food-trucks/mine                                                                                                                                                                                                                                     | VendorHomeLayout.tsx; VendorProfileSummary.tsx                                                     | SUPPORTED   | A04; server dashboardAccess not verified-badge gate                    | P0       |
| V03 | /dashboard/vendor                        | Post update                                           | MOCK           | POST /social/posts                                                                                                                                                                                                                                                         | VendorHomeUpdateForm.tsx                                                                           | SUPPORTED   | V02; resolve food truck identity                                       | P1       |
| V04 | /dashboard/vendor                        | QR display/download/share                             | MOCK           | GET /vendors/me/qr-code                                                                                                                                                                                                                                                    | VendorQrDrawer.tsx                                                                                 | SUPPORTED   | V02; real downloadUrl/qrCodeUrl; no sample QR                          | P1       |
| V05 | /dashboard/vendor/feed                   | Feed/compose/like/comments/replies                    | MOCK           | GET /social/feed/following; GET /social/feed/explore; POST /social/posts; POST /social/posts/:postId/like; GET /social/posts/:postId/comments; POST /social/posts/:postId/comments; POST /social/comments/:commentId/like                                                  | VendorFeedPage.tsx; VendorFeedComposer.tsx; VendorFeedCommentsDialog.tsx                           | SUPPORTED   | V02; reuse contract logic C09-C13                                      | P1       |
| V06 | /dashboard/vendor/drops                  | Operating status/live location                        | MOCK           | PATCH /food-trucks/:id/operating-status; PATCH /food-trucks/:id/location                                                                                                                                                                                                   | VendorDropsPage.tsx; DropsMap.tsx                                                                  | SUPPORTED   | V02; coordinates; consent/location validity                            | P2       |
| V07 | /dashboard/vendor/drops                  | Go live/end/duration                                  | MOCK           | POST /food-trucks/:id/drops                                                                                                                                                                                                                                                | VendorDropsPage.tsx; DropDurationDialog.tsx                                                        | PARTIAL     | V06; durationMinutes 1-1440; end gap U08                               | P2       |
| V08 | /dashboard/vendor/drops                  | Promo list/create/edit/toggle/delete                  | MOCK           | GET /promotions/food-trucks/:foodTruckId; POST /promotions; PATCH /promotions/:promotionId                                                                                                                                                                                 | DropPromoDialog.tsx; VendorDropsPage.tsx                                                           | PARTIAL     | V02; type/value/window inputs; U09                                     | P2       |
| V09 | /dashboard/vendor/create-post            | Community/truck request publication/media             | MOCK           | POST /community/posts; POST /community/media/upload                                                                                                                                                                                                                        | VendorCreatePostPage.tsx; VendorCommunityPostForm.tsx; VendorTruckRequestForm.tsx                  | SUPPORTED   | V02; C15; budget/date/menu mappings                                    | P2       |
| V10 | /dashboard/vendor/orders                 | Bookings/counts/detail/tracking                       | MOCK           | GET /bookings/vendor/mine; GET /bookings/vendor/requests/counts; GET /bookings/:bookingId; GET /bookings/:bookingId/tracking                                                                                                                                               | VendorOrdersPage.tsx; RequestOrderDetails.tsx                                                      | SUPPORTED   | V02; C06; server statuses                                              | P2       |
| V11 | /dashboard/vendor/orders                 | Accept/reject/send quote                              | MOCK           | PATCH /bookings/:bookingId/accept; PATCH /bookings/:bookingId/reject; POST /bookings/:bookingId/quotes                                                                                                                                                                     | RequestQuoteForm.tsx; VendorOrdersPage.tsx                                                         | SUPPORTED   | V10; canonical quote-financials; expiresAt                             | P2       |
| V12 | /dashboard/vendor/orders                 | Community requests/interests/offers/withdraw/ignore   | MOCK           | GET /community/posts; POST /community/posts/:postId/interests; DELETE /community/posts/:postId/interests/me; POST /community/posts/:postId/offers; PATCH /community/offers/:offerId/withdraw; POST /community/posts/:postId/ignore; DELETE /community/posts/:postId/ignore | VendorOrdersPage.tsx; RequestCards.tsx; RequestQuoteForm.tsx                                       | SUPPORTED   | V02; C14; offers differ from booking quotes                            | P2       |
| V13 | /dashboard/vendor/orders                 | Own community CRUD/reactions/comments                 | MOCK           | GET /community/posts/mine; POST /community/posts; PATCH /community/posts/:postId; DELETE /community/posts/:postId; POST /community/posts/:postId/reactions; GET /community/posts/:postId/comments; POST /community/posts/:postId/comments                                  | RequestOwnPostCard.tsx; RequestForms.tsx                                                           | SUPPORTED   | V09; owner constraints; actual IDs                                     | P2       |
| V14 | /dashboard/vendor/orders                 | Contact/request completion                            | MOCK           | POST /messaging/conversations/direct; PATCH /bookings/:bookingId/request-completion                                                                                                                                                                                        | RequestOrderDetails.tsx; VendorOrdersPage.tsx                                                      | SUPPORTED   | V10; M01; server completion requirements                               | P2       |
| V15 | /dashboard/vendor/earnings-and-analytics | Summary/transactions/refunds/payouts                  | MOCK           | GET /payments/vendor/summary; GET /payments/vendor/transactions; GET /payments/vendor/transactions/:paymentId; GET /payments/vendor/refunds; GET /payments/payouts/mine                                                                                                    | VendorEarningsOverview.tsx; VendorEarningsPage.tsx                                                 | SUPPORTED   | V02; currency/major-unit to UI cents; page/limit                       | P2       |
| V16 | /dashboard/vendor/earnings-and-analytics | Credits/QR/follower/location/redemption analytics     | MOCK           | GET /vendors/me/credits/analytics; PATCH /vendors/me/credits/settings; GET /vendors/me/analytics                                                                                                                                                                           | VendorAnalyticsOverview.tsx; VendorCreditDetails.tsx                                               | SUPPORTED   | V02; chart count to value; invalidation                                | P2       |
| V17 | /dashboard/vendor/earnings-and-analytics | Add/default bank method                               | MOCK           | POST /payments/connect/accounts; GET /payments/connect/account; POST /payments/connect/dashboard-link                                                                                                                                                                      | VendorPaymentMethodPreview.tsx; VendorEarningsOverview.tsx                                         | PARTIAL     | U11; hosted Connect alternative needs UI decision                      | P2       |
| V18 | /dashboard/vendor/profile                | Profile/cuisine/capacity/hours                        | MOCK           | GET /food-trucks/mine; PATCH /food-trucks/:id/profile-settings; GET /food-trucks/cuisines                                                                                                                                                                                  | VendorProfileEditor.tsx; VendorProfilePage.tsx                                                     | SUPPORTED   | V02; UUID cuisine/day enums; range decision                            | P1       |
| V19 | /dashboard/vendor/profile                | Upload and gallery add/edit/delete                    | MOCK           | POST /vendors/me/onboarding/upload; POST /food-trucks/:id/images; PATCH /food-trucks/:id/images/:imageId; DELETE /food-trucks/:id/images/:imageId                                                                                                                          | VendorProfilePhotoPicker.tsx; VendorProfilePage.tsx                                                | SUPPORTED   | V18; file to remote URL then metadata write                            | P1       |
| V20 | /dashboard/vendor/profile                | Menu setup/create/edit/availability/delete            | MOCK           | POST /food-trucks/:id/menus/basic; POST /food-trucks/:id/menus/:menuId/categories; POST /food-trucks/:id/menu-categories/:categoryId/items; PATCH /food-trucks/:id/menu-items/:itemId                                                                                      | VendorMenuItemDialog.tsx; VendorProfileMenu.tsx                                                    | PARTIAL     | V18; category/menu IDs; no delete U10                                  | P1       |
| V21 | /dashboard/vendor/profile                | Gallery/reviews/social content                        | MOCK           | GET /food-trucks/profile/:slug/reviews; GET /social/profiles/:userId/posts; GET /social/profiles/:userId/tagged-posts                                                                                                                                                      | VendorProfileContent.tsx                                                                           | SUPPORTED   | V18; user ID vs truck slug                                             | P1       |
| V22 | /dashboard/vendor/settings               | Password change                                       | MOCK           | POST /auth/change-password                                                                                                                                                                                                                                                 | VendorPasswordPreviewForm.tsx; settings.schema.ts                                                  | SUPPORTED   | A04; strengthen preview validation                                     | P1       |
| V23 | /dashboard/vendor/settings               | Staff create/list/reset/delete/lock                   | MOCK           | GET /vendors/me/staff; POST /vendors/me/staff; POST /vendors/me/staff/:staffId/reset-pin; DELETE /vendors/me/staff/:staffId                                                                                                                                                | VendorStaffManagement.tsx                                                                          | PARTIAL     | V02; input PIN required; lock gap U05                                  | P2       |
| V24 | /dashboard/vendor/settings               | Pricing/subscription/optional verification            | STATIC         | GET /subscriptions/plans; GET /subscriptions/me; POST /vendors/me/verification-requests/upload; POST /vendors/me/verification-requests                                                                                                                                     | VendorSettingsPage.tsx                                                                             | PARTIAL     | V02; approve missing UI; provider checkout not inferred                | P3       |
| V25 | /dashboard/vendor/settings               | Vendor support and delete previews                    | STATIC         | NONE                                                                                                                                                                                                                                                                       | VendorSettingsPage.tsx                                                                             | MISSING     | U01/U14                                                                | P3       |
| V26 | /dashboard/vendor/leaderboard            | Rankings                                              | MOCK           | GET /leaderboards/top-rated; GET /leaderboards/most-booked; GET /leaderboards/foodie-points                                                                                                                                                                                | VendorLeaderboardPage.tsx                                                                          | SUPPORTED   | C22; cache reuse                                                       | P1       |
| V27 | /dashboard/vendor/products               | Product placeholder                                   | STATIC         | NONE                                                                                                                                                                                                                                                                       | VendorProductsPage.tsx                                                                             | MISSING     | U03; profile menu already owns menu UI                                 | P3       |
| S01 | /dashboard/vendor-staff                  | Dashboard sample statistics                           | MOCK           | GET /vendors/me; GET /food-trucks/mine; GET /bookings/vendor/mine                                                                                                                                                                                                          | VendorStaffDashboardPage.tsx; DashboardOverview.tsx                                                | PARTIAL     | Staff PIN login; owner analytics forbidden U17                         | P3       |
| S02 | /dashboard/vendor-staff/tasks            | Task placeholder                                      | STATIC         | NONE                                                                                                                                                                                                                                                                       | VendorStaffTasksPage.tsx                                                                           | MISSING     | U02                                                                    | P3       |
| D01 | /dashboard/admin                         | Dashboard metrics/charts/activity                     | INTEGRATED     | GET /admin/dashboard                                                                                                                                                                                                                                                       | AdminDashboardPage.tsx                                                                             | SUPPORTED   | A04; server shape matches; runtime untested                            | P1       |
| D02 | /dashboard/admin/users                   | Users/detail/search/page/counters                     | BROKEN         | GET /admin/users-management; GET /admin/users/:userId                                                                                                                                                                                                                      | AdminUsersPage.tsx; admin.types.ts                                                                 | SUPPORTED   | G05/G09; adapter and server paging                                     | P0       |
| D03 | /dashboard/admin/users                   | Suspend/restore                                       | INTEGRATED     | PATCH /admin/users/:userId/suspend; PATCH /admin/users/:userId/retrieve                                                                                                                                                                                                    | AdminUsersPage.tsx; admin.api.ts                                                                   | SUPPORTED   | D02; retain confirmation; invalidates AdminUsers                       | P1       |
| D04 | /dashboard/admin/bookings                | Booking list/details/search/page                      | BROKEN         | GET /admin/bookings-management; GET /admin/bookings/:bookingId                                                                                                                                                                                                             | AdminBookingsPage.tsx; BookingDetailsModal.tsx                                                     | SUPPORTED   | G04/G09; UUID and display number separate                              | P0       |
| D05 | /dashboard/admin/bookings                | Issue messages/resolution                             | MOCK           | GET /bookings/:bookingId/issues; GET /bookings/:bookingId/issues/:issueId/messages; POST /bookings/:bookingId/issues/:issueId/messages; PATCH /admin/bookings/:bookingId/issues/:issueId/resolve                                                                           | BookingMessageModal.tsx                                                                            | PARTIAL     | D04; real issue IDs; distinguish direct chat                           | P2       |
| D06 | /dashboard/admin/vendors                 | Vendors/details/documents                             | BROKEN         | GET /admin/vendors-management; GET /admin/vendors/:vendorId                                                                                                                                                                                                                | AdminVendorsPage.tsx; VendorDetailsModal.tsx; BusinessLicenseModal.tsx                             | SUPPORTED   | G06; retain actual detail data                                         | P0       |
| D07 | /dashboard/admin/vendors                 | Truck request list/communicated                       | PARTIAL        | GET /admin/vendors/truck-requests; PATCH /admin/vendors/truck-requests/:requestId                                                                                                                                                                                          | AdminVendorsPage.tsx; TruckRequestModal.tsx                                                        | SUPPORTED   | G06; separate list; notes/status DTO                                   | P0       |
| D08 | /dashboard/admin/community               | List/search/categories/report flags                   | BROKEN         | GET /admin/community-management                                                                                                                                                                                                                                            | AdminCommunityPage.tsx                                                                             | SUPPORTED   | G07/G09; isReported and postId                                         | P0       |
| D09 | /dashboard/admin/reviews                 | List/filter/report flags                              | BROKEN         | GET /admin/reviews-management                                                                                                                                                                                                                                              | AdminReviewsModerationPage.tsx                                                                     | PARTIAL     | G07; presenter source hardcoded BOOKING                                | P0       |
| D10 | /dashboard/admin/payments                | Summary/operational tabs                              | PARTIAL        | GET /admin/payments-management                                                                                                                                                                                                                                             | AdminPaymentsPage.tsx                                                                              | SUPPORTED   | G08; typed arrays and supported action decisions                       | P1       |
| D11 | /dashboard/admin/rewards                 | Summary/rankings/redemptions/top users                | PARTIAL        | GET /admin/rewards-management                                                                                                                                                                                                                                              | AdminRewardsPage.tsx                                                                               | SUPPORTED   | G08; typed row adapters                                                | P1       |
| D12 | /dashboard/admin/settings                | Four configuration cards                              | STATIC         | GET /admin/platform-settings; PATCH /admin/platform-settings/:key                                                                                                                                                                                                          | AdminSettingsPage.tsx                                                                              | PARTIAL     | U18; no current forms or typed key contract                            | P3       |
| N01 | customer/vendor/dashboard shells         | Notification controls/list/count/read                 | STATIC         | GET /notifications; GET /notifications/unread-count; PATCH /notifications/:notificationId/read; PATCH /notifications/read-all                                                                                                                                              | DiscoverLayout.tsx; VendorHomeLayout.tsx; NavbarActions.tsx                                        | SUPPORTED   | A04; backend target to frontend route mapping                          | P2       |

## Local-only operations outside the API feature count

URL tabs/category state, menu expansion, dialogs/lightboxes, keyboard/focus, draft input and reset, local media object URLs, browser clipboard/native share, and pagination presentation remain LOCAL_ONLY. Durable server state behind these controls is represented above. Static legal/help/403/404 content does not require an API. A clear-local-history preview is not a remote delete operation.

## Contract selection and transformations

Use the existing admin `*-management` endpoints for composite summaries and rows: they are already wired and explicitly shaped for admin screens. Use dedicated truck-request listing because vendors-management has no truckRequests array. Generic detail routes are needed only when selected row data is insufficient. Preserve actual UUIDs for mutations, not shortened display IDs.

Use `/food-trucks/profile/:slug` for truck menus/gallery and `/social/profiles/:userId` for people/social identity; they are not alternative endpoints for one identical entity. Use following/explore feeds for existing tabs, and nearby/trending for discovery. Nearby does not establish personalized recommendations. Favorites and follows are separate resources; a save control must have one approved meaning.

Use `/community/posts` as the supported community facade, not an invented generic social-post request. Community offers, booking quotes, and private truck booking requests have different IDs and transitions. Offer acceptance already returns/creates a booking; do not create it twice. Use booking-scoped issue messages for admin disputes, ordinary messaging for participant chats, and never substitute either for unsupported support tickets.

Use consolidated truck `profile-settings` for supported editor fields to avoid partially saved multi-request edits. Separate images/menu operations have their own IDs. Use `vendors/me/onboarding/upload` only for permitted image upload then pass its URL into truck metadata; use verification upload for documents. Social image upload and community image/video upload have different constraints; neither establishes a generic PDF attachment service.

For every integration, the named UI state/types remain presentation models. Create request/response DTO types and pure adapters in the owning feature; preserve nullable values, decimal precision, currency, real timestamps, UUIDs and server action availability. Exact field mismatches and conditional inputs are enumerated in [gaps](api-integration-gaps.md). Do not manufacture fields from Swagger examples.

## WebSocket contract

Source: sibling backend `src/modules/messaging/messaging.gateway.ts` and `messaging-realtime.service.ts`. Namespace `/messaging`, Socket.IO auth `{token: accessToken}` (Bearer handshake header also accepted). Invalid token emits error `{message}` then disconnects. Connect joins a user room; conversation:join validates membership before joining its room.

| Client event       | Body                                  | Acknowledgment / behavior                                                                             |
| ------------------ | ------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| conversation:join  | `{conversationId}`                    | `{event: 'conversation:joined', data: getConversation result}`                                        |
| conversation:leave | `{conversationId}`                    | `{event: 'conversation:left', data: {conversationId}}`                                                |
| message:send       | `{conversationId, ...SendMessageDto}` | `{event: 'message:sent', data: sendMessage result}`; do not also submit the same message through HTTP |
| conversation:read  | `{conversationId}`                    | `{event: 'conversation:read', data: markRead result}`                                                 |

Server room broadcasts are `message:new` and `conversation:read`. Message payload/receipt shape comes from MessagingService. No typing/presence event is defined. Reconcile by returned message ID, leave old rooms, resubscribe and refetch on reconnect, and replace socket auth after token rotation. Existing centralized service needs lifecycle work; no page consumes it now.

## Reconciled totals

83 API-dependent operation groups: 4 INTEGRATED, 7 BROKEN, 4 PARTIAL, 59 MOCK, 9 STATIC. MOCK + STATIC = 68. 79 have at least one matching API: 58 fully supported and 21 partly supported groups; 4 have no selected match. Local-only controls and backend-only capabilities are excluded. BROKEN groups are not double-counted as PARTIAL.

## Frontend source reference index

- LoginForm.tsx: [src/features/auth/components/forms/LoginForm.tsx](../src/features/auth/components/forms/LoginForm.tsx)
- auth.api.ts: [src/features/auth/api/auth.api.ts](../src/features/auth/api/auth.api.ts)
- SignupForm.tsx: [src/features/auth/components/forms/SignupForm.tsx](../src/features/auth/components/forms/SignupForm.tsx)
- signup.schema.ts: [src/features/auth/schemas/signup.schema.ts](../src/features/auth/schemas/signup.schema.ts)
- auth.types.ts: [src/features/auth/types/auth.types.ts](../src/features/auth/types/auth.types.ts)
- authBaseQuery.ts: [src/services/api/authBaseQuery.ts](../src/services/api/authBaseQuery.ts)
- authAdapters.ts: [src/features/auth/utils/authAdapters.ts](../src/features/auth/utils/authAdapters.ts)
- auth.thunks.ts: [src/features/auth/store/auth.thunks.ts](../src/features/auth/store/auth.thunks.ts)
- auth.middleware.ts: [src/features/auth/store/auth.middleware.ts](../src/features/auth/store/auth.middleware.ts)
- UserMenu.tsx: [src/layouts/DashboardLayout/TopNavbar/UserMenu.tsx](../src/layouts/DashboardLayout/TopNavbar/UserMenu.tsx)
- DiscoverLayout.tsx: [src/features/customer/components/discover/DiscoverLayout.tsx](../src/features/customer/components/discover/DiscoverLayout.tsx)
- VendorHomeLayout.tsx: [src/features/vendor/components/home/VendorHomeLayout.tsx](../src/features/vendor/components/home/VendorHomeLayout.tsx)
- VendorSettingsPage.tsx: [src/features/vendor/pages/VendorSettingsPage.tsx](../src/features/vendor/pages/VendorSettingsPage.tsx)
- CustomerDiscoverPage.tsx: [src/features/customer/pages/CustomerDiscoverPage.tsx](../src/features/customer/pages/CustomerDiscoverPage.tsx)
- DiscoverFiltersDrawer.tsx: [src/features/customer/components/discover/DiscoverFiltersDrawer.tsx](../src/features/customer/components/discover/DiscoverFiltersDrawer.tsx)
- DiscoverProfileView.tsx: [src/features/customer/components/discover/DiscoverProfileView.tsx](../src/features/customer/components/discover/DiscoverProfileView.tsx)
- CustomerProfilePage.tsx: [src/features/customer/pages/CustomerProfilePage.tsx](../src/features/customer/pages/CustomerProfilePage.tsx)
- ProfileTabs.tsx: [src/features/customer/components/profile/ProfileTabs.tsx](../src/features/customer/components/profile/ProfileTabs.tsx)
- ProfileSummary.tsx: [src/features/customer/components/profile/ProfileSummary.tsx](../src/features/customer/components/profile/ProfileSummary.tsx)
- DiscoverBookingFlow.tsx: [src/features/customer/components/discover/DiscoverBookingFlow.tsx](../src/features/customer/components/discover/DiscoverBookingFlow.tsx)
- discover-booking.schema.ts: [src/features/customer/schemas/discover-booking.schema.ts](../src/features/customer/schemas/discover-booking.schema.ts)
- CustomerFeedPage.tsx: [src/features/customer/pages/CustomerFeedPage.tsx](../src/features/customer/pages/CustomerFeedPage.tsx)
- FeedPostCard.tsx: [src/features/customer/components/feed/FeedPostCard.tsx](../src/features/customer/components/feed/FeedPostCard.tsx)
- FeedCommentsDialog.tsx: [src/features/customer/components/feed/FeedCommentsDialog.tsx](../src/features/customer/components/feed/FeedCommentsDialog.tsx)
- FeedCommentForm.tsx: [src/features/customer/components/feed/FeedCommentForm.tsx](../src/features/customer/components/feed/FeedCommentForm.tsx)
- FeedShareDialog.tsx: [src/features/customer/components/feed/FeedShareDialog.tsx](../src/features/customer/components/feed/FeedShareDialog.tsx)
- CustomerCreatePostPage.tsx: [src/features/customer/pages/CustomerCreatePostPage.tsx](../src/features/customer/pages/CustomerCreatePostPage.tsx)
- PostDetailsPicker.tsx: [src/features/customer/components/create-post/PostDetailsPicker.tsx](../src/features/customer/components/create-post/PostDetailsPicker.tsx)
- create-post.schema.ts: [src/features/customer/schemas/create-post.schema.ts](../src/features/customer/schemas/create-post.schema.ts)
- CustomerCommunityPage.tsx: [src/features/customer/pages/CustomerCommunityPage.tsx](../src/features/customer/pages/CustomerCommunityPage.tsx)
- CommunityLocationView.tsx: [src/features/customer/components/community/CommunityLocationView.tsx](../src/features/customer/components/community/CommunityLocationView.tsx)
- CommunityComposer.tsx: [src/features/customer/components/community/CommunityComposer.tsx](../src/features/customer/components/community/CommunityComposer.tsx)
- community.schema.ts: [src/features/customer/schemas/community.schema.ts](../src/features/customer/schemas/community.schema.ts)
- CommunityPostCard.tsx: [src/features/customer/components/community/CommunityPostCard.tsx](../src/features/customer/components/community/CommunityPostCard.tsx)
- CommunityReportPreview.tsx: [src/features/customer/components/community/CommunityReportPreview.tsx](../src/features/customer/components/community/CommunityReportPreview.tsx)
- CommunityInterestedView.tsx: [src/features/customer/components/community/CommunityInterestedView.tsx](../src/features/customer/components/community/CommunityInterestedView.tsx)
- CommunityOffersView.tsx: [src/features/customer/components/community/CommunityOffersView.tsx](../src/features/customer/components/community/CommunityOffersView.tsx)
- CommunityTrackView.tsx: [src/features/customer/components/community/CommunityTrackView.tsx](../src/features/customer/components/community/CommunityTrackView.tsx)
- CommunityBookingDialogs.tsx: [src/features/customer/components/community/CommunityBookingDialogs.tsx](../src/features/customer/components/community/CommunityBookingDialogs.tsx)
- CustomerMessagePage.tsx: [src/features/customer/pages/CustomerMessagePage.tsx](../src/features/customer/pages/CustomerMessagePage.tsx)
- VendorMessagesPage.tsx: [src/features/vendor/pages/VendorMessagesPage.tsx](../src/features/vendor/pages/VendorMessagesPage.tsx)
- MessageComposer.tsx: [src/features/customer/components/message/MessageComposer.tsx](../src/features/customer/components/message/MessageComposer.tsx)
- MessageThread.tsx: [src/features/customer/components/message/MessageThread.tsx](../src/features/customer/components/message/MessageThread.tsx)
- VendorMessageComposer.tsx: [src/features/vendor/components/messages/VendorMessageComposer.tsx](../src/features/vendor/components/messages/VendorMessageComposer.tsx)
- VendorMessageThread.tsx: [src/features/vendor/components/messages/VendorMessageThread.tsx](../src/features/vendor/components/messages/VendorMessageThread.tsx)
- VendorMessageFilesDialog.tsx: [src/features/vendor/components/messages/VendorMessageFilesDialog.tsx](../src/features/vendor/components/messages/VendorMessageFilesDialog.tsx)
- VendorMessageAttachment.tsx: [src/features/vendor/components/messages/VendorMessageAttachment.tsx](../src/features/vendor/components/messages/VendorMessageAttachment.tsx)
- socket.ts: [src/services/socket/socket.ts](../src/services/socket/socket.ts)
- useSocket.ts: [src/services/socket/useSocket.ts](../src/services/socket/useSocket.ts)
- CustomerLeaderboardPage.tsx: [src/features/customer/pages/CustomerLeaderboardPage.tsx](../src/features/customer/pages/CustomerLeaderboardPage.tsx)
- LeaderboardRankings.tsx: [src/features/customer/components/leaderboard/LeaderboardRankings.tsx](../src/features/customer/components/leaderboard/LeaderboardRankings.tsx)
- CustomerMemberProfilePage.tsx: [src/features/customer/pages/CustomerMemberProfilePage.tsx](../src/features/customer/pages/CustomerMemberProfilePage.tsx)
- MemberProfileGallery.tsx: [src/features/customer/components/profile/MemberProfileGallery.tsx](../src/features/customer/components/profile/MemberProfileGallery.tsx)
- CustomerSettingsPage.tsx: [src/features/customer/pages/CustomerSettingsPage.tsx](../src/features/customer/pages/CustomerSettingsPage.tsx)
- SettingsProfileEditor.tsx: [src/features/customer/components/settings/SettingsProfileEditor.tsx](../src/features/customer/components/settings/SettingsProfileEditor.tsx)
- SettingsProfilePanel.tsx: [src/features/customer/components/settings/SettingsProfilePanel.tsx](../src/features/customer/components/settings/SettingsProfilePanel.tsx)
- MemberProfileEditor.tsx: [src/features/customer/components/profile/MemberProfileEditor.tsx](../src/features/customer/components/profile/MemberProfileEditor.tsx)
- SettingsPasswordForm.tsx: [src/features/customer/components/settings/SettingsPasswordForm.tsx](../src/features/customer/components/settings/SettingsPasswordForm.tsx)
- settings.schema.ts: [src/features/customer/schemas/settings.schema.ts](../src/features/customer/schemas/settings.schema.ts); [src/features/vendor/schemas/settings.schema.ts](../src/features/vendor/schemas/settings.schema.ts)
- SettingsInvite.tsx: [src/features/customer/components/settings/SettingsInvite.tsx](../src/features/customer/components/settings/SettingsInvite.tsx)
- SettingsRequestForm.tsx: [src/features/customer/components/settings/SettingsRequestForm.tsx](../src/features/customer/components/settings/SettingsRequestForm.tsx)
- SettingsIssueForm.tsx: [src/features/customer/components/settings/SettingsIssueForm.tsx](../src/features/customer/components/settings/SettingsIssueForm.tsx)
- SettingsSupport.tsx: [src/features/customer/components/settings/SettingsSupport.tsx](../src/features/customer/components/settings/SettingsSupport.tsx)
- CustomerOrdersPage.tsx: [src/features/customer/pages/CustomerOrdersPage.tsx](../src/features/customer/pages/CustomerOrdersPage.tsx)
- VendorDashboardPage.tsx: [src/features/vendor/pages/VendorDashboardPage.tsx](../src/features/vendor/pages/VendorDashboardPage.tsx)
- VendorProfileSummary.tsx: [src/features/vendor/components/profile/VendorProfileSummary.tsx](../src/features/vendor/components/profile/VendorProfileSummary.tsx)
- VendorHomeUpdateForm.tsx: [src/features/vendor/components/home/VendorHomeUpdateForm.tsx](../src/features/vendor/components/home/VendorHomeUpdateForm.tsx)
- VendorQrDrawer.tsx: [src/features/vendor/components/home/VendorQrDrawer.tsx](../src/features/vendor/components/home/VendorQrDrawer.tsx)
- VendorFeedPage.tsx: [src/features/vendor/pages/VendorFeedPage.tsx](../src/features/vendor/pages/VendorFeedPage.tsx)
- VendorFeedComposer.tsx: [src/features/vendor/components/feed/VendorFeedComposer.tsx](../src/features/vendor/components/feed/VendorFeedComposer.tsx)
- VendorFeedCommentsDialog.tsx: [src/features/vendor/components/feed/VendorFeedCommentsDialog.tsx](../src/features/vendor/components/feed/VendorFeedCommentsDialog.tsx)
- VendorDropsPage.tsx: [src/features/vendor/pages/VendorDropsPage.tsx](../src/features/vendor/pages/VendorDropsPage.tsx)
- DropsMap.tsx: [src/features/vendor/components/drops/DropsMap.tsx](../src/features/vendor/components/drops/DropsMap.tsx)
- DropDurationDialog.tsx: [src/features/vendor/components/drops/DropDurationDialog.tsx](../src/features/vendor/components/drops/DropDurationDialog.tsx)
- DropPromoDialog.tsx: [src/features/vendor/components/drops/DropPromoDialog.tsx](../src/features/vendor/components/drops/DropPromoDialog.tsx)
- VendorCreatePostPage.tsx: [src/features/vendor/pages/VendorCreatePostPage.tsx](../src/features/vendor/pages/VendorCreatePostPage.tsx)
- VendorCommunityPostForm.tsx: [src/features/vendor/components/create-posts/VendorCommunityPostForm.tsx](../src/features/vendor/components/create-posts/VendorCommunityPostForm.tsx)
- VendorTruckRequestForm.tsx: [src/features/vendor/components/create-posts/VendorTruckRequestForm.tsx](../src/features/vendor/components/create-posts/VendorTruckRequestForm.tsx)
- VendorOrdersPage.tsx: [src/features/vendor/pages/VendorOrdersPage.tsx](../src/features/vendor/pages/VendorOrdersPage.tsx)
- RequestOrderDetails.tsx: [src/features/vendor/components/requests/RequestOrderDetails.tsx](../src/features/vendor/components/requests/RequestOrderDetails.tsx)
- RequestQuoteForm.tsx: [src/features/vendor/components/requests/RequestQuoteForm.tsx](../src/features/vendor/components/requests/RequestQuoteForm.tsx)
- RequestCards.tsx: [src/features/vendor/components/requests/RequestCards.tsx](../src/features/vendor/components/requests/RequestCards.tsx)
- RequestOwnPostCard.tsx: [src/features/vendor/components/requests/RequestOwnPostCard.tsx](../src/features/vendor/components/requests/RequestOwnPostCard.tsx)
- RequestForms.tsx: [src/features/vendor/components/requests/RequestForms.tsx](../src/features/vendor/components/requests/RequestForms.tsx)
- VendorEarningsOverview.tsx: [src/features/vendor/components/earnings/VendorEarningsOverview.tsx](../src/features/vendor/components/earnings/VendorEarningsOverview.tsx)
- VendorEarningsPage.tsx: [src/features/vendor/pages/VendorEarningsPage.tsx](../src/features/vendor/pages/VendorEarningsPage.tsx)
- VendorAnalyticsOverview.tsx: [src/features/vendor/components/earnings/VendorAnalyticsOverview.tsx](../src/features/vendor/components/earnings/VendorAnalyticsOverview.tsx)
- VendorCreditDetails.tsx: [src/features/vendor/components/earnings/VendorCreditDetails.tsx](../src/features/vendor/components/earnings/VendorCreditDetails.tsx)
- VendorPaymentMethodPreview.tsx: [src/features/vendor/components/earnings/VendorPaymentMethodPreview.tsx](../src/features/vendor/components/earnings/VendorPaymentMethodPreview.tsx)
- VendorProfileEditor.tsx: [src/features/vendor/components/profile/VendorProfileEditor.tsx](../src/features/vendor/components/profile/VendorProfileEditor.tsx)
- VendorProfilePage.tsx: [src/features/vendor/pages/VendorProfilePage.tsx](../src/features/vendor/pages/VendorProfilePage.tsx)
- VendorProfilePhotoPicker.tsx: [src/features/vendor/components/profile/VendorProfilePhotoPicker.tsx](../src/features/vendor/components/profile/VendorProfilePhotoPicker.tsx)
- VendorMenuItemDialog.tsx: [src/features/vendor/components/profile/VendorMenuItemDialog.tsx](../src/features/vendor/components/profile/VendorMenuItemDialog.tsx)
- VendorProfileMenu.tsx: [src/features/vendor/components/profile/VendorProfileMenu.tsx](../src/features/vendor/components/profile/VendorProfileMenu.tsx)
- VendorProfileContent.tsx: [src/features/vendor/components/profile/VendorProfileContent.tsx](../src/features/vendor/components/profile/VendorProfileContent.tsx)
- VendorPasswordPreviewForm.tsx: [src/features/vendor/components/settings/VendorPasswordPreviewForm.tsx](../src/features/vendor/components/settings/VendorPasswordPreviewForm.tsx)
- VendorStaffManagement.tsx: [src/features/vendor/components/settings/VendorStaffManagement.tsx](../src/features/vendor/components/settings/VendorStaffManagement.tsx)
- VendorLeaderboardPage.tsx: [src/features/vendor/pages/VendorLeaderboardPage.tsx](../src/features/vendor/pages/VendorLeaderboardPage.tsx)
- VendorProductsPage.tsx: [src/features/vendor/pages/VendorProductsPage.tsx](../src/features/vendor/pages/VendorProductsPage.tsx)
- VendorStaffDashboardPage.tsx: [src/features/vendor-staff/pages/VendorStaffDashboardPage.tsx](../src/features/vendor-staff/pages/VendorStaffDashboardPage.tsx)
- DashboardOverview.tsx: [src/features/dashboard/components/DashboardOverview.tsx](../src/features/dashboard/components/DashboardOverview.tsx)
- VendorStaffTasksPage.tsx: [src/features/vendor-staff/pages/VendorStaffTasksPage.tsx](../src/features/vendor-staff/pages/VendorStaffTasksPage.tsx)
- AdminDashboardPage.tsx: [src/features/admin/pages/AdminDashboardPage.tsx](../src/features/admin/pages/AdminDashboardPage.tsx)
- AdminUsersPage.tsx: [src/features/admin/pages/AdminUsersPage.tsx](../src/features/admin/pages/AdminUsersPage.tsx)
- admin.types.ts: [src/features/admin/types/admin.types.ts](../src/features/admin/types/admin.types.ts)
- admin.api.ts: [src/features/admin/api/admin.api.ts](../src/features/admin/api/admin.api.ts)
- AdminBookingsPage.tsx: [src/features/admin/pages/AdminBookingsPage.tsx](../src/features/admin/pages/AdminBookingsPage.tsx)
- BookingDetailsModal.tsx: [src/features/admin/components/bookings/BookingDetailsModal.tsx](../src/features/admin/components/bookings/BookingDetailsModal.tsx)
- BookingMessageModal.tsx: [src/features/admin/components/bookings/BookingMessageModal.tsx](../src/features/admin/components/bookings/BookingMessageModal.tsx)
- AdminVendorsPage.tsx: [src/features/admin/pages/AdminVendorsPage.tsx](../src/features/admin/pages/AdminVendorsPage.tsx)
- VendorDetailsModal.tsx: [src/features/admin/components/vendors/VendorDetailsModal.tsx](../src/features/admin/components/vendors/VendorDetailsModal.tsx)
- BusinessLicenseModal.tsx: [src/features/admin/components/vendors/BusinessLicenseModal.tsx](../src/features/admin/components/vendors/BusinessLicenseModal.tsx)
- TruckRequestModal.tsx: [src/features/admin/components/vendors/TruckRequestModal.tsx](../src/features/admin/components/vendors/TruckRequestModal.tsx)
- AdminCommunityPage.tsx: [src/features/admin/pages/AdminCommunityPage.tsx](../src/features/admin/pages/AdminCommunityPage.tsx)
- AdminReviewsModerationPage.tsx: [src/features/admin/pages/AdminReviewsModerationPage.tsx](../src/features/admin/pages/AdminReviewsModerationPage.tsx)
- AdminPaymentsPage.tsx: [src/features/admin/pages/AdminPaymentsPage.tsx](../src/features/admin/pages/AdminPaymentsPage.tsx)
- AdminRewardsPage.tsx: [src/features/admin/pages/AdminRewardsPage.tsx](../src/features/admin/pages/AdminRewardsPage.tsx)
- AdminSettingsPage.tsx: [src/features/admin/pages/AdminSettingsPage.tsx](../src/features/admin/pages/AdminSettingsPage.tsx)
- NavbarActions.tsx: [src/layouts/DashboardLayout/TopNavbar/NavbarActions.tsx](../src/layouts/DashboardLayout/TopNavbar/NavbarActions.tsx)

## Backend endpoint contracts

All 281 method/path combinations were checked against current controller decorators after reading the inventory. Cards use actual handler delegation and service/repository returns. Outer return-key lists are indexes, not complete nested DTOs: follow the presenter catalogue and repository select/include with the Prisma model for raw responses. No universal envelope is assumed. JWT uses Authorization: Bearer accessToken. JSON uses application/json; multipart uploads use file (avatar/onboarding/verification) or files (social/community), with browser-generated boundaries. Source exception classes map to their standard statuses: BadRequest 400, Unauthorized 401, Forbidden 403, NotFound 404, Conflict 409, InternalServerError 500, ServiceUnavailable 503. Inventory fields are secondary evidence; exact current validators appear below. Empty error inventories do not imply an operation cannot fail. Common failures: JWT 401, RolesGuard 403, DTO validation 400, throttling 429, and database/provider failures. Source-extracted exceptions are not an exhaustive runtime catalogue.

<a id="endpoint-get-admin-users-management"></a>

### GET /api/v1/admin/users-management

UI groups: D02. Source status: IMPLEMENTED.

Controller: [AdminController.getUsersManagement](../../christinacormie-backend/src/modules/admin/admin.controller.ts#L57).

Auth: Bearer access JWT required; roles ADMIN. Current decorators: `UseGuards(JwtAuthGuard, RolesGuard)`; `Roles(UserRole.ADMIN)`.

Request parameters: `@Query() query: AdminListQueryDto`.

Inventory field index: `queryParams.search optional: string`; `queryParams.status optional: string`; `queryParams.category optional: string`; `queryParams.sortBy optional: string`; `queryParams.sortOrder optional: 'asc' &#124; 'desc'`; `queryParams.limit optional: number`; `queryParams.offset optional: number`.

Response implementation: [AdminService.getUsersManagement](../../christinacormie-backend/src/modules/admin/admin.service.ts#L42).

Response surface / delegation: `this.adminRepository.getUsersManagement(query)`.

Repository references: [AdminRepository.getUsersManagement](../../christinacormie-backend/src/modules/admin/admin.repository.ts#L122); [AdminRepository.startOfMonth](../../christinacormie-backend/src/modules/admin/admin.repository.ts#L1907); [AdminRepository.startOfWeek](../../christinacormie-backend/src/modules/admin/admin.repository.ts#L1919); [AdminRepository.userWhere](../../christinacormie-backend/src/modules/admin/admin.repository.ts#L1960); [AdminRepository.userManagementSelect](../../christinacormie-backend/src/modules/admin/admin.repository.ts#L2037); [AdminRepository.userOrderBy](../../christinacormie-backend/src/modules/admin/admin.repository.ts#L2025).

Success HTTP status: 200 (Nest default unless overridden). Service path exceptions: none explicitly extracted; common failures still apply.

<a id="endpoint-get-admin-users-by-userId"></a>

### GET /api/v1/admin/users/:userId

UI groups: D02. Source status: IMPLEMENTED.

Controller: [AdminController.getUser](../../christinacormie-backend/src/modules/admin/admin.controller.ts#L63).

Auth: Bearer access JWT required; roles ADMIN. Current decorators: `UseGuards(JwtAuthGuard, RolesGuard)`; `Roles(UserRole.ADMIN)`.

Request parameters: `@Param('userId', ParseUUIDPipe) userId: string`.

Inventory field index: `pathParams.userId required: string - URL path parameter userId`.

Response implementation: [AdminService.getUser](../../christinacormie-backend/src/modules/admin/admin.service.ts#L46).

Response surface / delegation: `user`.

Repository references: [AdminRepository.getUser](../../christinacormie-backend/src/modules/admin/admin.repository.ts#L168).

Success HTTP status: 200 (Nest default unless overridden). Service path exceptions: `new NotFoundException('User not found')`.

<a id="endpoint-patch-admin-users-by-userId-suspend"></a>

### PATCH /api/v1/admin/users/:userId/suspend

UI groups: D03. Source status: IMPLEMENTED.

Controller: [AdminController.suspendUser](../../christinacormie-backend/src/modules/admin/admin.controller.ts#L79).

Auth: Bearer access JWT required; roles ADMIN. Current decorators: `UseGuards(JwtAuthGuard, RolesGuard)`; `Roles(UserRole.ADMIN)`.

Request parameters: `@CurrentUser() user: AuthenticatedUser`; `@Param('userId', ParseUUIDPipe) userId: string`.

Inventory field index: `pathParams.userId required: string - URL path parameter userId`.

Response implementation: [AdminService.suspendUser](../../christinacormie-backend/src/modules/admin/admin.service.ts#L77).

Response surface / delegation: `updated`.

Repository references: [AdminRepository.createAuditLog](../../christinacormie-backend/src/modules/admin/admin.repository.ts#L3708).

Success HTTP status: 200 (Nest default unless overridden). Service path exceptions: none explicitly extracted; common failures still apply.

<a id="endpoint-patch-admin-users-by-userId-retrieve"></a>

### PATCH /api/v1/admin/users/:userId/retrieve

UI groups: D03. Source status: IMPLEMENTED.

Controller: [AdminController.retrieveUser](../../christinacormie-backend/src/modules/admin/admin.controller.ts#L88).

Auth: Bearer access JWT required; roles ADMIN. Current decorators: `UseGuards(JwtAuthGuard, RolesGuard)`; `Roles(UserRole.ADMIN)`.

Request parameters: `@CurrentUser() user: AuthenticatedUser`; `@Param('userId', ParseUUIDPipe) userId: string`.

Inventory field index: `pathParams.userId required: string - URL path parameter userId`.

Response implementation: [AdminService.retrieveUser](../../christinacormie-backend/src/modules/admin/admin.service.ts#L91).

Response surface / delegation: `updated`.

Repository references: [AdminRepository.createAuditLog](../../christinacormie-backend/src/modules/admin/admin.repository.ts#L3708).

Success HTTP status: 200 (Nest default unless overridden). Service path exceptions: none explicitly extracted; common failures still apply.

<a id="endpoint-get-admin-vendors-management"></a>

### GET /api/v1/admin/vendors-management

UI groups: D06. Source status: IMPLEMENTED.

Controller: [AdminController.getVendorsManagement](../../christinacormie-backend/src/modules/admin/admin.controller.ts#L109).

Auth: Bearer access JWT required; roles ADMIN. Current decorators: `UseGuards(JwtAuthGuard, RolesGuard)`; `Roles(UserRole.ADMIN)`.

Request parameters: `@Query() query: AdminListQueryDto`.

Inventory field index: `queryParams.search optional: string`; `queryParams.status optional: string`; `queryParams.category optional: string`; `queryParams.sortBy optional: string`; `queryParams.sortOrder optional: 'asc' &#124; 'desc'`; `queryParams.limit optional: number`; `queryParams.offset optional: number`.

Response implementation: [AdminService.getVendorsManagement](../../christinacormie-backend/src/modules/admin/admin.service.ts#L110).

Response surface / delegation: `this.adminRepository.getVendorsManagement(query)`.

Repository references: [AdminRepository.getVendorsManagement](../../christinacormie-backend/src/modules/admin/admin.repository.ts#L218); [AdminRepository.vendorWhere](../../christinacormie-backend/src/modules/admin/admin.repository.ts#L1655); [AdminRepository.vendorManagementSelect](../../christinacormie-backend/src/modules/admin/admin.repository.ts#L3025); [AdminRepository.marketSelect](../../christinacormie-backend/src/modules/admin/admin.repository.ts#L3458); [AdminRepository.limit](../../christinacormie-backend/src/modules/admin/admin.repository.ts#L1651); [AdminRepository.toVendorManagementRow](../../christinacormie-backend/src/modules/admin/admin.repository.ts#L3135).

Success HTTP status: 200 (Nest default unless overridden). Service path exceptions: none explicitly extracted; common failures still apply.

<a id="endpoint-get-admin-vendors-truck-requests"></a>

### GET /api/v1/admin/vendors/truck-requests

UI groups: D07. Source status: IMPLEMENTED.

Controller: [AdminController.listNewFoodTruckRequests](../../christinacormie-backend/src/modules/admin/admin.controller.ts#L115).

Auth: Bearer access JWT required; roles ADMIN. Current decorators: `UseGuards(JwtAuthGuard, RolesGuard)`; `Roles(UserRole.ADMIN)`.

Request parameters: `@Query() query: AdminListQueryDto`.

Inventory field index: `queryParams.search optional: string`; `queryParams.status optional: string`; `queryParams.category optional: string`; `queryParams.sortBy optional: string`; `queryParams.sortOrder optional: 'asc' &#124; 'desc'`; `queryParams.limit optional: number`; `queryParams.offset optional: number`.

Response implementation: [AdminService.listNewFoodTruckRequests](../../christinacormie-backend/src/modules/admin/admin.service.ts#L124).

Response surface / delegation: `this.adminRepository.listNewFoodTruckRequests(query)`.

Repository references: [AdminRepository.listNewFoodTruckRequests](../../christinacormie-backend/src/modules/admin/admin.repository.ts#L289); [AdminRepository.limit](../../christinacormie-backend/src/modules/admin/admin.repository.ts#L1651).

Success HTTP status: 200 (Nest default unless overridden). Service path exceptions: none explicitly extracted; common failures still apply.

<a id="endpoint-patch-admin-vendors-truck-requests-by-requestId"></a>

### PATCH /api/v1/admin/vendors/truck-requests/:requestId

UI groups: D07. Source status: IMPLEMENTED.

Controller: [AdminController.updateNewFoodTruckRequest](../../christinacormie-backend/src/modules/admin/admin.controller.ts#L121).

Auth: Bearer access JWT required; roles ADMIN. Current decorators: `UseGuards(JwtAuthGuard, RolesGuard)`; `Roles(UserRole.ADMIN)`.

Request parameters: `@CurrentUser() user: AuthenticatedUser`; `@Param('requestId', ParseUUIDPipe) requestId: string`; `@Body() dto: UpdateNewFoodTruckRequestDto`.

Inventory field index: `pathParams.requestId required: string - URL path parameter requestId`; `body.status optional: string`; `body.notes optional: string`.

Response implementation: [AdminService.updateNewFoodTruckRequest](../../christinacormie-backend/src/modules/admin/admin.service.ts#L128).

Response surface / delegation: `request`.

Repository references: [AdminRepository.updateNewFoodTruckRequest](../../christinacormie-backend/src/modules/admin/admin.repository.ts#L338); [AdminRepository.createAuditLog](../../christinacormie-backend/src/modules/admin/admin.repository.ts#L3708).

Success HTTP status: 200 (Nest default unless overridden). Service path exceptions: none explicitly extracted; common failures still apply.

<a id="endpoint-get-admin-vendors-by-vendorId"></a>

### GET /api/v1/admin/vendors/:vendorId

UI groups: D06. Source status: IMPLEMENTED.

Controller: [AdminController.getVendor](../../christinacormie-backend/src/modules/admin/admin.controller.ts#L135).

Auth: Bearer access JWT required; roles ADMIN. Current decorators: `UseGuards(JwtAuthGuard, RolesGuard)`; `Roles(UserRole.ADMIN)`.

Request parameters: `@Param('vendorId', ParseUUIDPipe) vendorId: string`.

Inventory field index: `pathParams.vendorId required: string - URL path parameter vendorId`.

Response implementation: [AdminService.getVendor](../../christinacormie-backend/src/modules/admin/admin.service.ts#L114).

Response surface / delegation: `vendor`.

Repository references: [AdminRepository.getVendor](../../christinacormie-backend/src/modules/admin/admin.repository.ts#L282); [AdminRepository.vendorManagementSelect](../../christinacormie-backend/src/modules/admin/admin.repository.ts#L3025); [AdminRepository.marketSelect](../../christinacormie-backend/src/modules/admin/admin.repository.ts#L3458).

Success HTTP status: 200 (Nest default unless overridden). Service path exceptions: `new NotFoundException('Vendor not found')`.

<a id="endpoint-get-admin-bookings-management"></a>

### GET /api/v1/admin/bookings-management

UI groups: D04. Source status: IMPLEMENTED.

Controller: [AdminController.getBookingsManagement](../../christinacormie-backend/src/modules/admin/admin.controller.ts#L225).

Auth: Bearer access JWT required; roles ADMIN. Current decorators: `UseGuards(JwtAuthGuard, RolesGuard)`; `Roles(UserRole.ADMIN)`.

Request parameters: `@Query() query: AdminListQueryDto`.

Inventory field index: `queryParams.search optional: string`; `queryParams.status optional: string`; `queryParams.category optional: string`; `queryParams.sortBy optional: string`; `queryParams.sortOrder optional: 'asc' &#124; 'desc'`; `queryParams.limit optional: number`; `queryParams.offset optional: number`.

Response implementation: [AdminService.getBookingsManagement](../../christinacormie-backend/src/modules/admin/admin.service.ts#L280).

Response surface / delegation: `this.adminRepository.getBookingsManagement(query)`.

Repository references: [AdminRepository.getBookingsManagement](../../christinacormie-backend/src/modules/admin/admin.repository.ts#L557); [AdminRepository.startOfMonth](../../christinacormie-backend/src/modules/admin/admin.repository.ts#L1907); [AdminRepository.addMonths](../../christinacormie-backend/src/modules/admin/admin.repository.ts#L1911); [AdminRepository.bookingWhere](../../christinacormie-backend/src/modules/admin/admin.repository.ts#L1714); [AdminRepository.bookingManagementSelect](../../christinacormie-backend/src/modules/admin/admin.repository.ts#L3283); [AdminRepository.bookingSelect](../../christinacormie-backend/src/modules/admin/admin.repository.ts#L3242).

Success HTTP status: 200 (Nest default unless overridden). Service path exceptions: none explicitly extracted; common failures still apply.

<a id="endpoint-get-admin-bookings-by-bookingId"></a>

### GET /api/v1/admin/bookings/:bookingId

UI groups: D04. Source status: IMPLEMENTED.

Controller: [AdminController.getBooking](../../christinacormie-backend/src/modules/admin/admin.controller.ts#L231).

Auth: Bearer access JWT required; roles ADMIN. Current decorators: `UseGuards(JwtAuthGuard, RolesGuard)`; `Roles(UserRole.ADMIN)`.

Request parameters: `@Param('bookingId', ParseUUIDPipe) bookingId: string`.

Inventory field index: `pathParams.bookingId required: string - URL path parameter bookingId`.

Response implementation: [AdminService.getBooking](../../christinacormie-backend/src/modules/admin/admin.service.ts#L284).

Response surface / delegation: `booking`.

Repository references: [AdminRepository.getBooking](../../christinacormie-backend/src/modules/admin/admin.repository.ts#L598); [AdminRepository.bookingManagementSelect](../../christinacormie-backend/src/modules/admin/admin.repository.ts#L3283); [AdminRepository.bookingSelect](../../christinacormie-backend/src/modules/admin/admin.repository.ts#L3242).

Success HTTP status: 200 (Nest default unless overridden). Service path exceptions: `new NotFoundException('Booking not found')`.

<a id="endpoint-patch-admin-bookings-by-bookingId-issues-by-issueId-resolve"></a>

### PATCH /api/v1/admin/bookings/:bookingId/issues/:issueId/resolve

UI groups: D05. Source status: IMPLEMENTED.

Controller: [AdminController.resolveBookingIssue](../../christinacormie-backend/src/modules/admin/admin.controller.ts#L237).

Auth: Bearer access JWT required; roles ADMIN. Current decorators: `UseGuards(JwtAuthGuard, RolesGuard)`; `Roles(UserRole.ADMIN)`.

Request parameters: `@CurrentUser() user: AuthenticatedUser`; `@Param('bookingId', ParseUUIDPipe) bookingId: string`; `@Param('issueId', ParseUUIDPipe) issueId: string`; `@Body() dto: ResolveBookingIssueDto`.

Inventory field index: `pathParams.bookingId required: string - URL path parameter bookingId`; `pathParams.issueId required: string - URL path parameter issueId`.

Response implementation: [AdminService.resolveBookingIssue](../../christinacormie-backend/src/modules/admin/admin.service.ts#L294).

Response surface / delegation: `this.bookingsService.resolveIssue( adminUserId, bookingId, issueId, dto, )`.

Repository references: [BookingsRepository.findIssueForBooking](../../christinacormie-backend/src/modules/bookings/bookings.repository.ts#L580); [PaymentsRepository.findSucceededPaymentForBooking](../../christinacormie-backend/src/modules/payments/payments.repository.ts#L401); [PaymentsRepository.createPendingPayoutForPayment](../../christinacormie-backend/src/modules/payments/payments.repository.ts#L564); [PaymentsRepository.markPayoutProcessing](../../christinacormie-backend/src/modules/payments/payments.repository.ts#L583); [PaymentsRepository.markPayoutPaid](../../christinacormie-backend/src/modules/payments/payments.repository.ts#L593); [PaymentsRepository.markPayoutFailed](../../christinacormie-backend/src/modules/payments/payments.repository.ts#L605).

Success HTTP status: 200 (Nest default unless overridden). Service path exceptions: `new NotFoundException('Booking issue not found')`; `new BadRequestException('Booking issue is already resolved')`; `new BadRequestException( 'Completed bookings cannot be resolved through issue decisions', )`; `new BadRequestException('Booking deposit payment is not completed')`; `new BadRequestException('Booking payout is not ready')`; `new BadRequestException( 'Booking payout has been cancelled and cannot be released', )`.

<a id="endpoint-get-admin-payments-management"></a>

### GET /api/v1/admin/payments-management

UI groups: D10. Source status: IMPLEMENTED.

Controller: [AdminController.getPaymentsManagement](../../christinacormie-backend/src/modules/admin/admin.controller.ts#L262).

Auth: Bearer access JWT required; roles ADMIN. Current decorators: `UseGuards(JwtAuthGuard, RolesGuard)`; `Roles(UserRole.ADMIN)`.

Request parameters: `@Query() query: AdminListQueryDto`.

Inventory field index: `queryParams.search optional: string`; `queryParams.status optional: string`; `queryParams.category optional: string`; `queryParams.sortBy optional: string`; `queryParams.sortOrder optional: 'asc' &#124; 'desc'`; `queryParams.limit optional: number`; `queryParams.offset optional: number`.

Response implementation: [AdminService.getPaymentsManagement](../../christinacormie-backend/src/modules/admin/admin.service.ts#L312).

Response surface / delegation: `this.adminRepository.getPaymentsManagement(query)`.

Repository references: [AdminRepository.getPaymentsManagement](../../christinacormie-backend/src/modules/admin/admin.repository.ts#L673); [AdminRepository.startOfMonth](../../christinacormie-backend/src/modules/admin/admin.repository.ts#L1907); [AdminRepository.addMonths](../../christinacormie-backend/src/modules/admin/admin.repository.ts#L1911); [AdminRepository.payoutInclude](../../christinacormie-backend/src/modules/admin/admin.repository.ts#L2461); [AdminRepository.limit](../../christinacormie-backend/src/modules/admin/admin.repository.ts#L1651); [AdminRepository.paymentTransactionInclude](../../christinacormie-backend/src/modules/admin/admin.repository.ts#L2485).

Success HTTP status: 200 (Nest default unless overridden). Service path exceptions: none explicitly extracted; common failures still apply.

<a id="endpoint-get-admin-reviews-management"></a>

### GET /api/v1/admin/reviews-management

UI groups: D09. Source status: IMPLEMENTED.

Controller: [AdminController.getReviewsManagement](../../christinacormie-backend/src/modules/admin/admin.controller.ts#L332).

Auth: Bearer access JWT required; roles ADMIN. Current decorators: `UseGuards(JwtAuthGuard, RolesGuard)`; `Roles(UserRole.ADMIN)`.

Request parameters: `@Query() query: AdminListQueryDto`.

Inventory field index: `queryParams.search optional: string`; `queryParams.status optional: string`; `queryParams.category optional: string`; `queryParams.sortBy optional: string`; `queryParams.sortOrder optional: 'asc' &#124; 'desc'`; `queryParams.limit optional: number`; `queryParams.offset optional: number`.

Response implementation: [AdminService.getReviewsManagement](../../christinacormie-backend/src/modules/admin/admin.service.ts#L368).

Response surface / delegation: `this.adminRepository.getReviewsManagement(query)`.

Repository references: [AdminRepository.getReviewsManagement](../../christinacormie-backend/src/modules/admin/admin.repository.ts#L897); [AdminRepository.startOfWeek](../../christinacormie-backend/src/modules/admin/admin.repository.ts#L1919); [AdminRepository.reviewWhere](../../christinacormie-backend/src/modules/admin/admin.repository.ts#L2270); [AdminRepository.toReviewStatus](../../christinacormie-backend/src/modules/admin/admin.repository.ts#L2352); [AdminRepository.reviewManagementSelect](../../christinacormie-backend/src/modules/admin/admin.repository.ts#L2368); [AdminRepository.limit](../../christinacormie-backend/src/modules/admin/admin.repository.ts#L1651).

Success HTTP status: 200 (Nest default unless overridden). Service path exceptions: none explicitly extracted; common failures still apply.

<a id="endpoint-get-admin-community-management"></a>

### GET /api/v1/admin/community-management

UI groups: D08. Source status: IMPLEMENTED.

Controller: [AdminController.getCommunityManagement](../../christinacormie-backend/src/modules/admin/admin.controller.ts#L381).

Auth: Bearer access JWT required; roles ADMIN. Current decorators: `UseGuards(JwtAuthGuard, RolesGuard)`; `Roles(UserRole.ADMIN)`.

Request parameters: `@Query() query: AdminListQueryDto`.

Inventory field index: `queryParams.search optional: string`; `queryParams.status optional: string`; `queryParams.category optional: string`; `queryParams.sortBy optional: string`; `queryParams.sortOrder optional: 'asc' &#124; 'desc'`; `queryParams.limit optional: number`; `queryParams.offset optional: number`.

Response implementation: [AdminService.getCommunityManagement](../../christinacormie-backend/src/modules/admin/admin.service.ts#L474).

Response surface / delegation: `this.adminRepository.getCommunityManagement(query)`.

Repository references: [AdminRepository.getCommunityManagement](../../christinacormie-backend/src/modules/admin/admin.repository.ts#L978); [AdminRepository.startOfDay](../../christinacormie-backend/src/modules/admin/admin.repository.ts#L1927); [AdminRepository.addDays](../../christinacormie-backend/src/modules/admin/admin.repository.ts#L1933); [AdminRepository.communityWhere](../../christinacormie-backend/src/modules/admin/admin.repository.ts#L2129); [AdminRepository.toCommunityCategory](../../christinacormie-backend/src/modules/admin/admin.repository.ts#L2174); [AdminRepository.communityRequestSelect](../../christinacormie-backend/src/modules/admin/admin.repository.ts#L3413).

Success HTTP status: 200 (Nest default unless overridden). Service path exceptions: none explicitly extracted; common failures still apply.

<a id="endpoint-get-admin-platform-settings"></a>

### GET /api/v1/admin/platform-settings

UI groups: D12. Source status: IMPLEMENTED.

Controller: [AdminController.listPlatformSettings](../../christinacormie-backend/src/modules/admin/admin.controller.ts#L440).

Auth: Bearer access JWT required; roles ADMIN. Current decorators: `UseGuards(JwtAuthGuard, RolesGuard)`; `Roles(UserRole.ADMIN)`.

Request parameters: .

Response implementation: [AdminService.listPlatformSettings](../../christinacormie-backend/src/modules/admin/admin.service.ts#L554).

Response surface / delegation: `this.adminRepository.listPlatformSettings()`.

Repository references: [AdminRepository.listPlatformSettings](../../christinacormie-backend/src/modules/admin/admin.repository.ts#L1136).

Success HTTP status: 200 (Nest default unless overridden). Service path exceptions: none explicitly extracted; common failures still apply.

<a id="endpoint-patch-admin-platform-settings-by-key"></a>

### PATCH /api/v1/admin/platform-settings/:key

UI groups: D12. Source status: IMPLEMENTED.

Controller: [AdminController.upsertPlatformSetting](../../christinacormie-backend/src/modules/admin/admin.controller.ts#L446).

Auth: Bearer access JWT required; roles ADMIN. Current decorators: `UseGuards(JwtAuthGuard, RolesGuard)`; `Roles(UserRole.ADMIN)`.

Request parameters: `@CurrentUser() user: AuthenticatedUser`; `@Param('key') key: string`; `@Body() dto: UpsertPlatformSettingDto`.

Inventory field index: `pathParams.key required: string - URL path parameter key`; `body.value required: Record&lt;string, unknown&gt;`; `body.description optional: string`; `body.isPublic optional: boolean`.

Response implementation: [AdminService.upsertPlatformSetting](../../christinacormie-backend/src/modules/admin/admin.service.ts#L558).

Response surface / delegation: `setting`.

Repository references: [AdminRepository.upsertPlatformSetting](../../christinacormie-backend/src/modules/admin/admin.repository.ts#L1142); [AdminRepository.createAuditLog](../../christinacormie-backend/src/modules/admin/admin.repository.ts#L3708).

Success HTTP status: 200 (Nest default unless overridden). Service path exceptions: none explicitly extracted; common failures still apply.

<a id="endpoint-get-admin-rewards-management"></a>

### GET /api/v1/admin/rewards-management

UI groups: D11. Source status: IMPLEMENTED.

Controller: [AdminController.getRewardsManagement](../../christinacormie-backend/src/modules/admin/admin.controller.ts#L487).

Auth: Bearer access JWT required; roles ADMIN. Current decorators: `UseGuards(JwtAuthGuard, RolesGuard)`; `Roles(UserRole.ADMIN)`.

Request parameters: `@Query() query: AdminListQueryDto`.

Inventory field index: `queryParams.search optional: string`; `queryParams.status optional: string`; `queryParams.category optional: string`; `queryParams.sortBy optional: string`; `queryParams.sortOrder optional: 'asc' &#124; 'desc'`; `queryParams.limit optional: number`; `queryParams.offset optional: number`.

Response implementation: [AdminService.getRewardsManagement](../../christinacormie-backend/src/modules/admin/admin.service.ts#L617).

Response surface / delegation: `this.adminRepository.getRewardsManagement(query)`.

Repository references: [AdminRepository.getRewardsManagement](../../christinacormie-backend/src/modules/admin/admin.repository.ts#L1205); [AdminRepository.startOfDay](../../christinacormie-backend/src/modules/admin/admin.repository.ts#L1927); [AdminRepository.addDays](../../christinacormie-backend/src/modules/admin/admin.repository.ts#L1933); [AdminRepository.limit](../../christinacormie-backend/src/modules/admin/admin.repository.ts#L1651); [AdminRepository.rewardsPaymentSummary](../../christinacormie-backend/src/modules/admin/admin.repository.ts#L2616); [AdminRepository.startOfMonth](../../christinacormie-backend/src/modules/admin/admin.repository.ts#L1907).

Success HTTP status: 200 (Nest default unless overridden). Service path exceptions: none explicitly extracted; common failures still apply.

<a id="endpoint-get-admin-dashboard"></a>

### GET /api/v1/admin/dashboard

UI groups: D01. Source status: IMPLEMENTED.

Controller: [AdminController.getDashboard](../../christinacormie-backend/src/modules/admin/admin.controller.ts#L493).

Auth: Bearer access JWT required; roles ADMIN. Current decorators: `UseGuards(JwtAuthGuard, RolesGuard)`; `Roles(UserRole.ADMIN)`.

Request parameters: .

Response implementation: [AdminService.getDashboard](../../christinacormie-backend/src/modules/admin/admin.service.ts#L621).

Response surface / delegation: `this.adminRepository.getDashboard()`.

Repository references: [AdminRepository.getDashboard](../../christinacormie-backend/src/modules/admin/admin.repository.ts#L1478); [AdminRepository.startOfMonth](../../christinacormie-backend/src/modules/admin/admin.repository.ts#L1907); [AdminRepository.addMonths](../../christinacormie-backend/src/modules/admin/admin.repository.ts#L1911); [AdminRepository.monthLabel](../../christinacormie-backend/src/modules/admin/admin.repository.ts#L1915); [AdminRepository.getRecentDashboardActivity](../../christinacormie-backend/src/modules/admin/admin.repository.ts#L1794); [AdminRepository.userDisplayName](../../christinacormie-backend/src/modules/admin/admin.repository.ts#L1943).

Success HTTP status: 200 (Nest default unless overridden). Service path exceptions: none explicitly extracted; common failures still apply.

<a id="endpoint-post-auth-register-customer"></a>

### POST /api/v1/auth/register/customer

UI groups: A02. Source status: IMPLEMENTED.

Controller: [AuthController.registerCustomer](../../christinacormie-backend/src/modules/auth/auth.controller.ts#L120).

Auth: No mandatory JWT in inventory; check current decorators; roles no explicit role restriction; ownership/state rules still apply. Current decorators: none.

Request parameters: `@Body() dto: RegisterCustomerDto`.

Inventory field index: `body.name required: string`; `body.email required: string`; `body.password required: string`; `body.dateOfBirth required: Date`; `body.referralCode optional: string - Optional referral code entered during signup.`.

Response implementation: [AuthService.registerCustomer](../../christinacormie-backend/src/modules/auth/auth.service.ts#L48).

Response surface / delegation: `this.toPendingVerificationResponse(user.email)`.

Success HTTP status: 201 (Nest default unless overridden). Service path exceptions: `new ConflictException( options?.emailConflictMessage ?? 'An account already exists with this email address', )`; `new ConflictException( 'An account already exists with this phone number', )`; `new NotFoundException('Referral code not found')`; `new BadRequestException('You cannot use your own referral code')`; `new BadRequestException('Referral code has expired')`; `new BadRequestException('Referral code usage limit reached')`.

<a id="endpoint-post-auth-register-vendor"></a>

### POST /api/v1/auth/register/vendor

UI groups: A02. Source status: IMPLEMENTED.

Controller: [AuthController.registerVendor](../../christinacormie-backend/src/modules/auth/auth.controller.ts#L168).

Auth: No mandatory JWT in inventory; check current decorators; roles no explicit role restriction; ownership/state rules still apply. Current decorators: none.

Request parameters: `@Body() dto: RegisterVendorDto`.

Inventory field index: `body.email required: string`; `body.phone required: string`; `body.password required: string`; `body.dateOfBirth optional: Date`; `body.businessName optional: string`; `body.businessEmail optional: string`; `body.businessPhone optional: string`; `body.description optional: string`; `body.websiteUrl optional: string`; `body.firstName optional: string`; `body.lastName optional: string`; `body.displayName optional: string`; `body.timezone optional: string`; `body.referralCode optional: string - Optional referral code entered during vendor signup.`.

Response implementation: [AuthService.registerVendor](../../christinacormie-backend/src/modules/auth/auth.service.ts#L93).

Response surface / delegation: `this.toPendingVerificationResponse(user.email)`.

Success HTTP status: 201 (Nest default unless overridden). Service path exceptions: `new ConflictException( options?.emailConflictMessage ?? 'An account already exists with this email address', )`; `new ConflictException( 'An account already exists with this phone number', )`; `new NotFoundException('Referral code not found')`; `new BadRequestException('You cannot use your own referral code')`; `new BadRequestException('Referral code has expired')`; `new BadRequestException('Referral code usage limit reached')`.

<a id="endpoint-post-auth-verify-email"></a>

### POST /api/v1/auth/verify-email

UI groups: A02. Source status: IMPLEMENTED.

Controller: [AuthController.verifyEmail](../../christinacormie-backend/src/modules/auth/auth.controller.ts#L249).

Auth: No mandatory JWT in inventory; check current decorators; roles no explicit role restriction; ownership/state rules still apply. Current decorators: none.

Request parameters: `@Body() dto: VerifyEmailCodeDto`.

Inventory field index: `body.email required: string`; `body.code required: string`.

Response implementation: [AuthService.verifyEmailCode](../../christinacormie-backend/src/modules/auth/auth.service.ts#L190).

Response surface / delegation: `this.createAuthResponse(activatedUser)`.

Success HTTP status: 201 (Nest default unless overridden). Service path exceptions: `new NotFoundException('No account found for this email address')`; `new BadRequestException('Email is already verified. Please login.')`; `new BadRequestException( 'No active verification code found. Please request a new code.', )`; `new BadRequestException( 'Verification code has expired. Please request a new code.', )`; `new BadRequestException( 'Incorrect verification code. Please check the 6-digit code and try again.', )`.

<a id="endpoint-post-auth-resend-verification-code"></a>

### POST /api/v1/auth/resend-verification-code

UI groups: A02. Source status: IMPLEMENTED.

Controller: [AuthController.resendVerificationCode](../../christinacormie-backend/src/modules/auth/auth.controller.ts#L288).

Auth: No mandatory JWT in inventory; check current decorators; roles no explicit role restriction; ownership/state rules still apply. Current decorators: none.

Request parameters: `@Body() dto: ResendEmailCodeDto`.

Inventory field index: `body.email required: string`.

Response implementation: [AuthService.resendVerificationCode](../../christinacormie-backend/src/modules/auth/auth.service.ts#L262).

Response surface / delegation: `this.toPendingVerificationResponse(user.email)`.

Success HTTP status: 201 (Nest default unless overridden). Service path exceptions: `new NotFoundException('No account found for this email address')`; `new BadRequestException('Email is already verified. Please login.')`; `new BadRequestException( 'Email verification requires an email address', )`; `new InternalServerErrorException( 'Registration was saved, but the verification email could not be sent. Please try resending the code.', )`.

<a id="endpoint-post-auth-login"></a>

### POST /api/v1/auth/login

UI groups: A01. Source status: IMPLEMENTED.

Controller: [AuthController.login](../../christinacormie-backend/src/modules/auth/auth.controller.ts#L338).

Auth: No mandatory JWT in inventory; check current decorators; roles no explicit role restriction; ownership/state rules still apply. Current decorators: none.

Request parameters: `@Body() dto: LoginDto`.

Inventory field index: `body.email required: string`; `body.password required: string`.

Response implementation: [AuthService.login](../../christinacormie-backend/src/modules/auth/auth.service.ts#L283).

Response surface / delegation: `this.createAuthResponse(user)`.

Success HTTP status: 201 (Nest default unless overridden). Service path exceptions: `new UnauthorizedException('Invalid email or password')`; ``new ForbiddenException( `This account is ${status.toLowerCase()}. Please contact support.`, )``; `new BadRequestException( 'Email verification is required before login. Please submit the 6-digit code sent to your email.', )`.

<a id="endpoint-post-auth-refresh"></a>

### POST /api/v1/auth/refresh

UI groups: A03. Source status: IMPLEMENTED.

Controller: [AuthController.refresh](../../christinacormie-backend/src/modules/auth/auth.controller.ts#L658).

Auth: No mandatory JWT in inventory; check current decorators; roles no explicit role restriction; ownership/state rules still apply. Current decorators: none.

Request parameters: `@Body() dto: RefreshTokenDto`.

Inventory field index: `body.refreshToken required: string`.

Response implementation: [AuthService.refresh](../../christinacormie-backend/src/modules/auth/auth.service.ts#L648).

Response surface / delegation: `this.createAuthResponse(tokenRecord.user)`.

Success HTTP status: 201 (Nest default unless overridden). Service path exceptions: `new UnauthorizedException('Invalid or expired refresh token')`; ``new ForbiddenException( `This account is ${status.toLowerCase()}. Please contact support.`, )``; `new BadRequestException( 'Email verification is required before login. Please submit the 6-digit code sent to your email.', )`.

<a id="endpoint-post-auth-logout"></a>

### POST /api/v1/auth/logout

UI groups: A05. Source status: IMPLEMENTED.

Controller: [AuthController.logout](../../christinacormie-backend/src/modules/auth/auth.controller.ts#L684).

Auth: Bearer access JWT required; roles no explicit role restriction; ownership/state rules still apply. Current decorators: `UseGuards(JwtAuthGuard)`.

Request parameters: `@CurrentUser() user: AuthenticatedUser`; `@Body() dto: RefreshTokenDto`.

Inventory field index: `body.refreshToken required: string`.

Response implementation: [AuthService.logout](../../christinacormie-backend/src/modules/auth/auth.service.ts#L696).

Response surface / delegation: `{ success }`.

Success HTTP status: 201 (Nest default unless overridden). Service path exceptions: `new ForbiddenException( 'Refresh token does not belong to this user', )`.

<a id="endpoint-post-auth-change-password"></a>

### POST /api/v1/auth/change-password

UI groups: C27, V22. Source status: IMPLEMENTED.

Controller: [AuthController.changePassword](../../christinacormie-backend/src/modules/auth/auth.controller.ts#L719).

Auth: Bearer access JWT required; roles no explicit role restriction; ownership/state rules still apply. Current decorators: `UseGuards(JwtAuthGuard)`.

Request parameters: `@CurrentUser() user: AuthenticatedUser`; `@Body() dto: ChangePasswordDto`.

Inventory field index: `body.currentPassword required: string`; `body.newPassword required: string`; `body.confirmNewPassword optional: string`.

Response implementation: [AuthService.changePassword](../../christinacormie-backend/src/modules/auth/auth.service.ts#L423).

Response surface / delegation: `{ success, message }`.

Success HTTP status: 201 (Nest default unless overridden). Service path exceptions: `new BadRequestException( 'New password and confirm password do not match', )`; `new NotFoundException('User not found')`; `new BadRequestException( 'Account was created via social login and has no password set', )`; `new UnauthorizedException('Current password is incorrect')`; `new BadRequestException( 'New password must be different from current password', )`.

<a id="endpoint-get-bookings-mine"></a>

### GET /api/v1/bookings/mine

UI groups: C34. Source status: IMPLEMENTED.

Controller: [BookingsController.listMyBookings](../../christinacormie-backend/src/modules/bookings/bookings.controller.ts#L178).

Auth: Bearer access JWT required; roles no explicit role restriction; ownership/state rules still apply. Current decorators: `UseGuards(JwtAuthGuard)`.

Request parameters: `@CurrentUser() user: AuthenticatedUser`.

Response implementation: [BookingsService.listMyBookings](../../christinacormie-backend/src/modules/bookings/bookings.service.ts#L98).

Response surface / delegation: `this.bookingsRepository.listCustomerBookings(userId)`.

Repository references: [BookingsRepository.listCustomerBookings](../../christinacormie-backend/src/modules/bookings/bookings.repository.ts#L142); [BookingsRepository.bookingInclude](../../christinacormie-backend/src/modules/bookings/bookings.repository.ts#L1045).

Success HTTP status: 200 (Nest default unless overridden). Service path exceptions: none explicitly extracted; common failures still apply.

<a id="endpoint-get-bookings-vendor-mine"></a>

### GET /api/v1/bookings/vendor/mine

UI groups: V01, V10, S01. Source status: IMPLEMENTED.

Controller: [BookingsController.listVendorBookings](../../christinacormie-backend/src/modules/bookings/bookings.controller.ts#L197).

Auth: Bearer access JWT required; roles VENDOR, VENDOR_STAFF. Current decorators: `UseGuards(JwtAuthGuard, RolesGuard)`; `Roles(UserRole.VENDOR, UserRole.VENDOR_STAFF)`.

Request parameters: `@CurrentUser() user: AuthenticatedUser`; `@Query() query: VendorBookingsQueryDto`.

Inventory field index: `queryParams.tab optional: VendorBookingTabDto - Filter bookings by screen tab. REQUESTS returns PENDING and QUOTED bookings. ORDERS returns active, confirmed, and completed orders.`; `queryParams.source optional: VendorBookingSourceDto - Filter by origin: DIRECT (direct profile booking request) or COMMUNITY (community-originated booking). Defaults to ALL.`; `queryParams.status optional: string - Filter by specific booking status or comma-separated statuses (e.g. PENDING,QUOTED).`; `queryParams.foodTruckId optional: string - Filter bookings by food truck ID.`.

Response implementation: [BookingsService.listVendorBookings](../../christinacormie-backend/src/modules/bookings/bookings.service.ts#L102).

Response surface / delegation: `this.bookingsRepository.listVendorBookingsByVendorId( vendor.id, query, )`.

Repository references: [BookingsRepository.findVendorForActor](../../christinacormie-backend/src/modules/bookings/bookings.repository.ts#L27); [BookingsRepository.findVendorByUserId](../../christinacormie-backend/src/modules/bookings/bookings.repository.ts#L20); [BookingsRepository.listVendorBookingsByVendorId](../../christinacormie-backend/src/modules/bookings/bookings.repository.ts#L162); [BookingsRepository.bookingInclude](../../christinacormie-backend/src/modules/bookings/bookings.repository.ts#L1045).

Success HTTP status: 200 (Nest default unless overridden). Service path exceptions: `new ForbiddenException('Vendor profile is required')`; `new ForbiddenException(this.vendorApprovalMessage)`.

<a id="endpoint-get-bookings-vendor-requests-counts"></a>

### GET /api/v1/bookings/vendor/requests/counts

UI groups: V01, V10. Source status: IMPLEMENTED.

Controller: [BookingsController.getVendorRequestsCounts](../../christinacormie-backend/src/modules/bookings/bookings.controller.ts#L226).

Auth: Bearer access JWT required; roles VENDOR, VENDOR_STAFF. Current decorators: `UseGuards(JwtAuthGuard, RolesGuard)`; `Roles(UserRole.VENDOR, UserRole.VENDOR_STAFF)`.

Request parameters: `@CurrentUser() user: AuthenticatedUser`.

Response implementation: [BookingsService.getVendorRequestsCounts](../../christinacormie-backend/src/modules/bookings/bookings.service.ts#L110).

Response surface / delegation: `this.bookingsRepository.countVendorRequests(vendor.id, userId)`.

Repository references: [BookingsRepository.findVendorForActor](../../christinacormie-backend/src/modules/bookings/bookings.repository.ts#L27); [BookingsRepository.findVendorByUserId](../../christinacormie-backend/src/modules/bookings/bookings.repository.ts#L20); [BookingsRepository.countVendorRequests](../../christinacormie-backend/src/modules/bookings/bookings.repository.ts#L206).

Success HTTP status: 200 (Nest default unless overridden). Service path exceptions: `new ForbiddenException('Vendor profile is required')`; `new ForbiddenException(this.vendorApprovalMessage)`.

<a id="endpoint-get-bookings-by-bookingId"></a>

### GET /api/v1/bookings/:bookingId

UI groups: V10. Source status: IMPLEMENTED.

Controller: [BookingsController.getBookingDetails](../../christinacormie-backend/src/modules/bookings/bookings.controller.ts#L260).

Auth: Bearer access JWT required; roles no explicit role restriction; ownership/state rules still apply. Current decorators: `UseGuards(JwtAuthGuard)`.

Request parameters: `@CurrentUser() user: AuthenticatedUser`; `@Param('bookingId') bookingId: string`.

Inventory field index: `pathParams.bookingId required: string - URL path parameter bookingId`.

Response implementation: [BookingsService.getBookingDetails](../../christinacormie-backend/src/modules/bookings/bookings.service.ts#L115).

Response surface / delegation: `this.withVendorPhone(booking)`.

Repository references: [BookingsRepository.findBookingById](../../christinacormie-backend/src/modules/bookings/bookings.repository.ts#L83); [BookingsRepository.bookingInclude](../../christinacormie-backend/src/modules/bookings/bookings.repository.ts#L1045); [BookingsRepository.findVendorForActor](../../christinacormie-backend/src/modules/bookings/bookings.repository.ts#L27); [BookingsRepository.findVendorByUserId](../../christinacormie-backend/src/modules/bookings/bookings.repository.ts#L20).

Success HTTP status: 200 (Nest default unless overridden). Service path exceptions: `new NotFoundException('Booking not found')`; `new ForbiddenException('Booking is not visible to this user')`; `new ForbiddenException('Vendor profile is required')`; `new ForbiddenException(this.vendorApprovalMessage)`.

<a id="endpoint-get-bookings-by-bookingId-tracking"></a>

### GET /api/v1/bookings/:bookingId/tracking

UI groups: C20, V10. Source status: IMPLEMENTED.

Controller: [BookingsController.getBookingTracking](../../christinacormie-backend/src/modules/bookings/bookings.controller.ts#L300).

Auth: Bearer access JWT required; roles no explicit role restriction; ownership/state rules still apply. Current decorators: `UseGuards(JwtAuthGuard)`.

Request parameters: `@CurrentUser() user: AuthenticatedUser`; `@Param('bookingId') bookingId: string`.

Inventory field index: `pathParams.bookingId required: string - URL path parameter bookingId`.

Response implementation: [BookingsService.getBookingTracking](../../christinacormie-backend/src/modules/bookings/bookings.service.ts#L135).

Response surface / delegation: `this.presentTracking(booking, roleView)`.

Repository references: [BookingsRepository.findBookingForTracking](../../christinacormie-backend/src/modules/bookings/bookings.repository.ts#L90); [BookingsRepository.findVendorForActor](../../christinacormie-backend/src/modules/bookings/bookings.repository.ts#L27); [BookingsRepository.findVendorByUserId](../../christinacormie-backend/src/modules/bookings/bookings.repository.ts#L20).

Success HTTP status: 200 (Nest default unless overridden). Service path exceptions: `new NotFoundException('Booking not found')`; `new ForbiddenException('Booking is not visible to this user')`; `new ForbiddenException('Vendor profile is required')`; `new ForbiddenException(this.vendorApprovalMessage)`.

<a id="endpoint-post-bookings"></a>

### POST /api/v1/bookings

UI groups: C06. Source status: IMPLEMENTED.

Controller: [BookingsController.createBookingRequest](../../christinacormie-backend/src/modules/bookings/bookings.controller.ts#L348).

Auth: Bearer access JWT required; roles no explicit role restriction; ownership/state rules still apply. Current decorators: `UseGuards(JwtAuthGuard)`.

Request parameters: `@CurrentUser() user: AuthenticatedUser`; `@Body() dto: CreateBookingDto`.

Inventory field index: `body.foodTruckId required: string`; `body.bookingType optional: BookingTypeDto - High-level booking category. Defaults to EVENT when omitted.`; `body.eventType required: BookingEventTypeDto - User-facing event subtype from the booking form such as birthday party, corporate event, wedding, or private party.`; `body.communityRequestId optional: string`; `body.vendorOfferId optional: string`; `body.eventName optional: string`; `body.eventDescription optional: string`; `body.eventDate optional: string - UI-friendly event date. Required with eventTime when startsAt/endsAt are not provided.`; `body.eventTime optional: string - UI-friendly event start time in 24-hour HH:mm format. Required with eventDate when startsAt/endsAt are not provided.`; `body.endTime optional: string - Optional UI-friendly event end time in 24-hour HH:mm format. If omitted, backend reserves a 3-hour window.`; `body.eventTimezone optional: string - IANA time zone used to convert eventDate/eventTime into UTC. Defaults to UTC when omitted.`; `body.startsAt optional: string - Legacy ISO start datetime. If provided, endsAt must also be provided.`; `body.endsAt optional: string - Legacy ISO end datetime. If provided, startsAt must also be provided.`; `body.guestCount required: number`; `body.address required: string`; `body.contactPhone required: string`; `body.latitude required: number`; `body.longitude required: number`; `body.budgetAmount optional: number - Optional customer budget for the event`; `body.subtotal optional: number`; `body.preferredMenuItemIds optional: string[] - Preferred menu item IDs selected by the customer`; `body.customMenuItems optional: string[] - Custom menu requests typed by the customer when the item is not available in the truck menu.`; `body.referenceImageUrls optional: string[] - Optional reference image URLs uploaded before the booking request`; `body.paymentPreference optional: BookingPaymentPreferenceDto`; `body.specialInstructions optional: string`; `body.isAdultConfirmed required: boolean - Customer must confirm they are 18 years or older before submitting a booking request.`; `body.termsAccepted required: boolean - Customer must accept BiteDrop Terms and Conditions before submitting a booking request.`.

Response implementation: [BookingsService.createBookingRequest](../../christinacormie-backend/src/modules/bookings/bookings.service.ts#L44).

Response surface / delegation: `{ message, booking }`.

Repository references: [BookingsRepository.findFoodTruckById](../../christinacormie-backend/src/modules/bookings/bookings.repository.ts#L50); [BookingsRepository.countMenuItemsForFoodTruck](../../christinacormie-backend/src/modules/bookings/bookings.repository.ts#L70); [BookingsRepository.checkServiceArea](../../christinacormie-backend/src/modules/bookings/bookings.repository.ts#L272); [BookingsRepository.hasOverlap](../../christinacormie-backend/src/modules/bookings/bookings.repository.ts#L299); [BookingsRepository.createBooking](../../christinacormie-backend/src/modules/bookings/bookings.repository.ts#L324); [BookingsRepository.createBookingNumber](../../christinacormie-backend/src/modules/bookings/bookings.repository.ts#L1038).

Success HTTP status: 201 (Nest default unless overridden). Service path exceptions: `new BadRequestException('Food truck is not active')`; `new BadRequestException('Guest count exceeds truck capacity')`; `new BadRequestException( 'You must confirm that you are 18 years or older', )`; `new BadRequestException( 'You must agree to the BiteDrop Terms and Conditions', )`; `new BadRequestException('Custom menu items cannot be empty')`; `new BadRequestException('Booking startsAt must be in the future')`.

<a id="endpoint-patch-bookings-by-bookingId-accept"></a>

### PATCH /api/v1/bookings/:bookingId/accept

UI groups: V11. Source status: IMPLEMENTED.

Controller: [BookingsController.vendorAcceptBooking](../../christinacormie-backend/src/modules/bookings/bookings.controller.ts#L449).

Auth: Bearer access JWT required; roles VENDOR. Current decorators: `UseGuards(JwtAuthGuard, RolesGuard)`; `Roles(UserRole.VENDOR)`.

Request parameters: `@CurrentUser() user: AuthenticatedUser`; `@Param('bookingId') bookingId: string`; `@Body() dto: VendorBookingDecisionDto`.

Inventory field index: `pathParams.bookingId required: string - URL path parameter bookingId`; `body.reason optional: string`.

Response implementation: [BookingsService.vendorAcceptBooking](../../christinacormie-backend/src/modules/bookings/bookings.service.ts#L595).

Response surface / delegation: `updatedBooking`.

Repository references: [BookingsRepository.findVendorForActor](../../christinacormie-backend/src/modules/bookings/bookings.repository.ts#L27); [BookingsRepository.findVendorByUserId](../../christinacormie-backend/src/modules/bookings/bookings.repository.ts#L20); [BookingsRepository.findBookingById](../../christinacormie-backend/src/modules/bookings/bookings.repository.ts#L83); [BookingsRepository.bookingInclude](../../christinacormie-backend/src/modules/bookings/bookings.repository.ts#L1045); [BookingsRepository.hasOverlap](../../christinacormie-backend/src/modules/bookings/bookings.repository.ts#L299); [BookingsRepository.updateBookingStatus](../../christinacormie-backend/src/modules/bookings/bookings.repository.ts#L419).

Success HTTP status: 200 (Nest default unless overridden). Service path exceptions: `new BadRequestException('Only pending bookings can be accepted')`; `new NotFoundException('Booking not found')`; `new ForbiddenException('Booking does not belong to this vendor')`; `new BadRequestException('Booking end time is required')`; `new ForbiddenException('Vendor profile is required')`; `new ForbiddenException(this.vendorApprovalMessage)`.

<a id="endpoint-patch-bookings-by-bookingId-reject"></a>

### PATCH /api/v1/bookings/:bookingId/reject

UI groups: V11. Source status: IMPLEMENTED.

Controller: [BookingsController.vendorRejectBooking](../../christinacormie-backend/src/modules/bookings/bookings.controller.ts#L517).

Auth: Bearer access JWT required; roles VENDOR. Current decorators: `UseGuards(JwtAuthGuard, RolesGuard)`; `Roles(UserRole.VENDOR)`.

Request parameters: `@CurrentUser() user: AuthenticatedUser`; `@Param('bookingId') bookingId: string`; `@Body() dto: VendorBookingDecisionDto`.

Inventory field index: `pathParams.bookingId required: string - URL path parameter bookingId`; `body.reason optional: string`.

Response implementation: [BookingsService.vendorRejectBooking](../../christinacormie-backend/src/modules/bookings/bookings.service.ts#L641).

Response surface / delegation: `updatedBooking`.

Repository references: [BookingsRepository.findVendorForActor](../../christinacormie-backend/src/modules/bookings/bookings.repository.ts#L27); [BookingsRepository.findVendorByUserId](../../christinacormie-backend/src/modules/bookings/bookings.repository.ts#L20); [BookingsRepository.findBookingById](../../christinacormie-backend/src/modules/bookings/bookings.repository.ts#L83); [BookingsRepository.bookingInclude](../../christinacormie-backend/src/modules/bookings/bookings.repository.ts#L1045); [BookingsRepository.updateBookingStatus](../../christinacormie-backend/src/modules/bookings/bookings.repository.ts#L419); [NotificationsRepository.findRecentForUser](../../christinacormie-backend/src/modules/notifications/notifications.repository.ts#L84).

Success HTTP status: 200 (Nest default unless overridden). Service path exceptions: `new BadRequestException( 'Booking cannot be rejected in this status', )`; `new NotFoundException('Booking not found')`; `new ForbiddenException('Booking does not belong to this vendor')`; `new BadRequestException('Booking end time is required')`; `new ForbiddenException('Vendor profile is required')`; `new ForbiddenException(this.vendorApprovalMessage)`.

<a id="endpoint-post-bookings-by-bookingId-quotes"></a>

### POST /api/v1/bookings/:bookingId/quotes

UI groups: V11. Source status: IMPLEMENTED.

Controller: [BookingsController.createVendorQuote](../../christinacormie-backend/src/modules/bookings/bookings.controller.ts#L574).

Auth: Bearer access JWT required; roles VENDOR. Current decorators: `UseGuards(JwtAuthGuard, RolesGuard)`; `Roles(UserRole.VENDOR)`.

Request parameters: `@CurrentUser() user: AuthenticatedUser`; `@Param('bookingId') bookingId: string`; `@Body() dto: CreateBookingQuoteDto`.

Inventory field index: `pathParams.bookingId required: string - URL path parameter bookingId`; `body.pricePerPerson optional: number - Required for PER_PERSON; backend multiplies by booking guest count.`; `body.pricingModel optional: OfferPricingModelDto`; `body.selectedMenuItems optional: string[]`; `body.baseServiceFee optional: number`; `body.transportFee optional: number`; `body.extraCharges optional: OfferExtraChargeDto[] - Additional charge lines shown in the quote breakdown.`; `body.subtotal optional: number`; `body.outsideRadiusFee optional: number`; `body.serviceFee optional: number`; `body.taxAmount optional: number`; `body.discountAmount optional: number`; `body.paymentPreference optional: BookingPaymentPreferenceDto`; `body.depositAmount optional: number`; `body.depositPercent optional: number`; `body.totalAmount optional: number`; `body.balanceDueAtEvent optional: number`; `body.message optional: string`; `body.noteToClient optional: string`; `body.terms optional: string`; `body.expiresAt optional: string`.

Response implementation: [BookingsService.createVendorQuote](../../christinacormie-backend/src/modules/bookings/bookings.service.ts#L673).

Response surface / delegation: `{ ...quoteResult, message, breakdown }`.

Repository references: [BookingsRepository.findVendorForActor](../../christinacormie-backend/src/modules/bookings/bookings.repository.ts#L27); [BookingsRepository.findVendorByUserId](../../christinacormie-backend/src/modules/bookings/bookings.repository.ts#L20); [BookingsRepository.findBookingById](../../christinacormie-backend/src/modules/bookings/bookings.repository.ts#L83); [BookingsRepository.bookingInclude](../../christinacormie-backend/src/modules/bookings/bookings.repository.ts#L1045); [BookingsRepository.hasOverlap](../../christinacormie-backend/src/modules/bookings/bookings.repository.ts#L299); [BookingsRepository.createQuote](../../christinacormie-backend/src/modules/bookings/bookings.repository.ts#L813).

Success HTTP status: 201 (Nest default unless overridden). Service path exceptions: `new BadRequestException('Booking is not ready for a quote')`; `new BadRequestException('Quote expiresAt must be in the future')`; `new BadRequestException('subtotal and baseServiceFee must match')`; `new BadRequestException( 'transportFee and outsideRadiusFee must match', )`; `new NotFoundException('Booking not found')`; `new ForbiddenException('Booking does not belong to this vendor')`.

<a id="endpoint-patch-bookings-quotes-by-quoteId-accept"></a>

### PATCH /api/v1/bookings/quotes/:quoteId/accept

UI groups: C19. Source status: IMPLEMENTED.

Controller: [BookingsController.customerAcceptQuote](../../christinacormie-backend/src/modules/bookings/bookings.controller.ts#L637).

Auth: Bearer access JWT required; roles no explicit role restriction; ownership/state rules still apply. Current decorators: `UseGuards(JwtAuthGuard)`.

Request parameters: `@CurrentUser() user: AuthenticatedUser`; `@Param('quoteId') quoteId: string`; `@Body() dto: AcceptBookingQuoteDto`.

Inventory field index: `pathParams.quoteId required: string - URL path parameter quoteId`; `body.paymentWindowMinutes optional: number`.

Response implementation: [BookingsService.customerAcceptQuote](../../christinacormie-backend/src/modules/bookings/bookings.service.ts#L758).

Response surface / delegation: `booking`.

Repository references: [BookingsRepository.findQuoteById](../../christinacormie-backend/src/modules/bookings/bookings.repository.ts#L263); [BookingsRepository.hasOverlap](../../christinacormie-backend/src/modules/bookings/bookings.repository.ts#L299); [BookingsRepository.acceptQuote](../../christinacormie-backend/src/modules/bookings/bookings.repository.ts#L912); [BookingsRepository.bookingInclude](../../christinacormie-backend/src/modules/bookings/bookings.repository.ts#L1045); [RewardsRepository.findActivePointRule](../../christinacormie-backend/src/modules/rewards/rewards.repository.ts#L105); [RewardsRepository.awardPoints](../../christinacormie-backend/src/modules/rewards/rewards.repository.ts#L260).

Success HTTP status: 200 (Nest default unless overridden). Service path exceptions: `new NotFoundException('Booking quote not found')`; `new ForbiddenException('Quote does not belong to this customer')`; `new BadRequestException('Quote is not pending')`; `new BadRequestException('Quote has expired')`; `new BadRequestException( 'Booking is not ready for quote acceptance', )`; `new ConflictException( 'Food truck already has a booking or hold in this window', )`.

<a id="endpoint-patch-bookings-by-bookingId-request-completion"></a>

### PATCH /api/v1/bookings/:bookingId/request-completion

UI groups: V14. Source status: IMPLEMENTED.

Controller: [BookingsController.requestCompletion](../../christinacormie-backend/src/modules/bookings/bookings.controller.ts#L706).

Auth: Bearer access JWT required; roles VENDOR. Current decorators: `UseGuards(JwtAuthGuard, RolesGuard)`; `Roles(UserRole.VENDOR)`.

Request parameters: `@CurrentUser() user: AuthenticatedUser`; `@Param('bookingId') bookingId: string`.

Inventory field index: `pathParams.bookingId required: string - URL path parameter bookingId`.

Response implementation: [BookingsService.requestCompletion](../../christinacormie-backend/src/modules/bookings/bookings.service.ts#L144).

Response surface / delegation: `{ message, booking }`.

Repository references: [BookingsRepository.findVendorForActor](../../christinacormie-backend/src/modules/bookings/bookings.repository.ts#L27); [BookingsRepository.findVendorByUserId](../../christinacormie-backend/src/modules/bookings/bookings.repository.ts#L20); [BookingsRepository.findBookingById](../../christinacormie-backend/src/modules/bookings/bookings.repository.ts#L83); [BookingsRepository.bookingInclude](../../christinacormie-backend/src/modules/bookings/bookings.repository.ts#L1045); [BookingsRepository.requestCompletion](../../christinacormie-backend/src/modules/bookings/bookings.repository.ts#L451); [NotificationsRepository.findRecentForUser](../../christinacormie-backend/src/modules/notifications/notifications.repository.ts#L84).

Success HTTP status: 200 (Nest default unless overridden). Service path exceptions: `new BadRequestException( 'Completion can be requested only after the booking is confirmed', )`; `new BadRequestException('Completion request already sent')`; `new BadRequestException('Booking is already completed')`; `new BadRequestException( 'Completion can be requested on or after the event day', )`; `new NotFoundException('Booking not found')`; `new ForbiddenException('Booking does not belong to this vendor')`.

<a id="endpoint-patch-bookings-by-bookingId-approve-completion"></a>

### PATCH /api/v1/bookings/:bookingId/approve-completion

UI groups: C20. Source status: IMPLEMENTED.

Controller: [BookingsController.approveCompletion](../../christinacormie-backend/src/modules/bookings/bookings.controller.ts#L738).

Auth: Bearer access JWT required; roles no explicit role restriction; ownership/state rules still apply. Current decorators: `UseGuards(JwtAuthGuard)`.

Request parameters: `@CurrentUser() user: AuthenticatedUser`; `@Param('bookingId') bookingId: string`.

Inventory field index: `pathParams.bookingId required: string - URL path parameter bookingId`.

Response implementation: [BookingsService.approveCompletion](../../christinacormie-backend/src/modules/bookings/bookings.service.ts#L200).

Response surface / delegation: `{ message, booking }`.

Repository references: [BookingsRepository.findBookingForTracking](../../christinacormie-backend/src/modules/bookings/bookings.repository.ts#L90); [PaymentsRepository.findSucceededPaymentForBooking](../../christinacormie-backend/src/modules/payments/payments.repository.ts#L401); [PaymentsRepository.createPendingPayoutForPayment](../../christinacormie-backend/src/modules/payments/payments.repository.ts#L564); [PaymentsRepository.markPayoutProcessing](../../christinacormie-backend/src/modules/payments/payments.repository.ts#L583); [PaymentsRepository.markPayoutPaid](../../christinacormie-backend/src/modules/payments/payments.repository.ts#L593); [PaymentsRepository.markPayoutFailed](../../christinacormie-backend/src/modules/payments/payments.repository.ts#L605).

Success HTTP status: 200 (Nest default unless overridden). Service path exceptions: `new NotFoundException('Booking not found')`; `new ForbiddenException('Booking does not belong to this customer')`; `new BadRequestException('Completion request has not been sent yet')`; `new BadRequestException('Booking is already completed')`; `new ConflictException( 'This booking has an open issue and cannot be completed yet', )`; `new BadRequestException('Booking deposit payment is not completed')`.

<a id="endpoint-post-bookings-by-bookingId-issues"></a>

### POST /api/v1/bookings/:bookingId/issues

UI groups: C21. Source status: IMPLEMENTED.

Controller: [BookingsController.reportIssue](../../christinacormie-backend/src/modules/bookings/bookings.controller.ts#L769).

Auth: Bearer access JWT required; roles no explicit role restriction; ownership/state rules still apply. Current decorators: `UseGuards(JwtAuthGuard)`.

Request parameters: `@CurrentUser() user: AuthenticatedUser`; `@Param('bookingId') bookingId: string`; `@Body() dto: BookingIssueDto`.

Inventory field index: `pathParams.bookingId required: string - URL path parameter bookingId`; `body.message required: string`.

Response implementation: [BookingsService.reportIssue](../../christinacormie-backend/src/modules/bookings/bookings.service.ts#L246).

Response surface / delegation: `{ message, issue }`.

Repository references: [BookingsRepository.findBookingForTracking](../../christinacormie-backend/src/modules/bookings/bookings.repository.ts#L90); [BookingsRepository.createIssue](../../christinacormie-backend/src/modules/bookings/bookings.repository.ts#L545); [NotificationsRepository.findRecentForUser](../../christinacormie-backend/src/modules/notifications/notifications.repository.ts#L84); [NotificationsRepository.create](../../christinacormie-backend/src/modules/notifications/notifications.repository.ts#L206); [NotificationsRepository.getPreferences](../../christinacormie-backend/src/modules/notifications/notifications.repository.ts#L155); [NotificationsRepository.findActiveDeviceTokens](../../christinacormie-backend/src/modules/notifications/notifications.repository.ts#L163).

Success HTTP status: 201 (Nest default unless overridden). Service path exceptions: `new NotFoundException('Booking not found')`; `new ForbiddenException('Booking does not belong to this customer')`; `new BadRequestException('Completion request has not been sent yet')`; `new BadRequestException('Completed bookings cannot be disputed')`; `new ConflictException( 'An open issue already exists for this booking', )`.

<a id="endpoint-get-bookings-by-bookingId-issues-by-issueId-messages"></a>

### GET /api/v1/bookings/:bookingId/issues/:issueId/messages

UI groups: C21, D05. Source status: IMPLEMENTED.

Controller: [BookingsController.listIssueMessages](../../christinacormie-backend/src/modules/bookings/bookings.controller.ts#L798).

Auth: Bearer access JWT required; roles no explicit role restriction; ownership/state rules still apply. Current decorators: `UseGuards(JwtAuthGuard)`.

Request parameters: `@CurrentUser() user: AuthenticatedUser`; `@Param('bookingId') bookingId: string`; `@Param('issueId') issueId: string`.

Inventory field index: `pathParams.bookingId required: string - URL path parameter bookingId`; `pathParams.issueId required: string - URL path parameter issueId`.

Response implementation: [BookingsService.listIssueMessages](../../christinacormie-backend/src/modules/bookings/bookings.service.ts#L352).

Response surface / delegation: `{ issue, messages }`.

Repository references: [BookingsRepository.findIssueForBooking](../../christinacormie-backend/src/modules/bookings/bookings.repository.ts#L580); [BookingsRepository.findVendorForActor](../../christinacormie-backend/src/modules/bookings/bookings.repository.ts#L27); [BookingsRepository.findVendorByUserId](../../christinacormie-backend/src/modules/bookings/bookings.repository.ts#L20).

Success HTTP status: 200 (Nest default unless overridden). Service path exceptions: `new NotFoundException('Booking issue not found')`; `new ForbiddenException('Booking issue is not visible to this user')`; `new ForbiddenException('Vendor profile is required')`; `new ForbiddenException(this.vendorApprovalMessage)`.

<a id="endpoint-get-bookings-by-bookingId-issues"></a>

### GET /api/v1/bookings/:bookingId/issues

UI groups: C21, D05. Source status: IMPLEMENTED.

Controller: [BookingsController.listIssues](../../christinacormie-backend/src/modules/bookings/bookings.controller.ts#L844).

Auth: Bearer access JWT required; roles no explicit role restriction; ownership/state rules still apply. Current decorators: `UseGuards(JwtAuthGuard)`.

Request parameters: `@CurrentUser() user: AuthenticatedUser`; `@Param('bookingId') bookingId: string`.

Inventory field index: `pathParams.bookingId required: string - URL path parameter bookingId`.

Response implementation: [BookingsService.listIssues](../../christinacormie-backend/src/modules/bookings/bookings.service.ts#L332).

Response surface / delegation: `{ items }`.

Repository references: [BookingsRepository.findBookingForTracking](../../christinacormie-backend/src/modules/bookings/bookings.repository.ts#L90); [BookingsRepository.findVendorForActor](../../christinacormie-backend/src/modules/bookings/bookings.repository.ts#L27); [BookingsRepository.findVendorByUserId](../../christinacormie-backend/src/modules/bookings/bookings.repository.ts#L20); [BookingsRepository.findIssuesForBooking](../../christinacormie-backend/src/modules/bookings/bookings.repository.ts#L631).

Success HTTP status: 200 (Nest default unless overridden). Service path exceptions: `new NotFoundException('Booking not found')`; `new ForbiddenException('Booking is not visible to this user')`; `new ForbiddenException('Vendor profile is required')`; `new ForbiddenException(this.vendorApprovalMessage)`.

<a id="endpoint-post-bookings-by-bookingId-issues-by-issueId-messages"></a>

### POST /api/v1/bookings/:bookingId/issues/:issueId/messages

UI groups: C21, D05. Source status: IMPLEMENTED.

Controller: [BookingsController.sendIssueMessage](../../christinacormie-backend/src/modules/bookings/bookings.controller.ts#L895).

Auth: Bearer access JWT required; roles no explicit role restriction; ownership/state rules still apply. Current decorators: `UseGuards(JwtAuthGuard)`.

Request parameters: `@CurrentUser() user: AuthenticatedUser`; `@Param('bookingId') bookingId: string`; `@Param('issueId') issueId: string`; `@Body() dto: BookingIssueMessageDto`.

Inventory field index: `pathParams.bookingId required: string - URL path parameter bookingId`; `pathParams.issueId required: string - URL path parameter issueId`; `body.message required: string`.

Response implementation: [BookingsService.sendIssueMessage](../../christinacormie-backend/src/modules/bookings/bookings.service.ts#L367).

Response surface / delegation: `{ message, item }`.

Repository references: [BookingsRepository.findIssueForBooking](../../christinacormie-backend/src/modules/bookings/bookings.repository.ts#L580); [BookingsRepository.findVendorForActor](../../christinacormie-backend/src/modules/bookings/bookings.repository.ts#L27); [BookingsRepository.findVendorByUserId](../../christinacormie-backend/src/modules/bookings/bookings.repository.ts#L20); [BookingsRepository.addIssueMessage](../../christinacormie-backend/src/modules/bookings/bookings.repository.ts#L661); [NotificationsRepository.findAdminUserIds](../../christinacormie-backend/src/modules/notifications/notifications.repository.ts#L193); [NotificationsRepository.findRecentForUser](../../christinacormie-backend/src/modules/notifications/notifications.repository.ts#L84).

Success HTTP status: 201 (Nest default unless overridden). Service path exceptions: `new BadRequestException('Booking issue is already resolved')`; `new NotFoundException('Booking issue not found')`; `new ForbiddenException('Booking issue is not visible to this user')`; `new ForbiddenException('Vendor profile is required')`; `new ForbiddenException(this.vendorApprovalMessage)`.

<a id="endpoint-post-community-posts"></a>

### POST /api/v1/community/posts

UI groups: C15, V09, V13. Source status: IMPLEMENTED.

Controller: [CommunityPostsController.create](../../christinacormie-backend/src/modules/community/community-posts.controller.ts#L133).

Auth: Bearer access JWT required; roles no explicit role restriction; ownership/state rules still apply. Current decorators: `UseGuards(JwtAuthGuard)`.

Request parameters: `@CurrentUser() user: AuthenticatedUser`; `@Body() dto: CreateCommunityRequestDto`.

Inventory field index: `body.category optional: CommunityPostCategory`; `body.spotsOpen optional: number - Optional structured Vendor Callout field.`; `body.attendanceMin optional: number`; `body.attendanceMax optional: number`; `body.requestType optional: RequestTypeDto - High-level request category. Defaults to EVENT for the need-a-truck flow.`; `body.eventType optional: CommunityEventTypeDto - Event type selected from the customer request form.`; `body.title optional: string - Optional title. If omitted, the backend generates one from event type and location.`; `body.description optional: string`; `body.eventDate optional: string`; `body.startTime optional: string`; `body.endTime optional: string - Optional event end time. If omitted, quote acceptance reserves three hours after startTime.`; `body.eventTimezone optional: string`; `body.guestCount optional: number`; `body.budgetMin optional: number`; `body.budgetMax optional: number`; `body.address optional: string`; `body.contactPhone optional: string`; `body.latitude optional: number`; `body.longitude optional: number`; `body.preferredCuisines optional: string[]`; `body.preferredMenuItems optional: string[] - Preferred menu item tags selected by the customer.`; `body.allowPublicComments optional: boolean`; `body.expiresAt optional: string`; `body.media optional: RequestMediaDto[]`.

Response implementation: [CommunityPostsService.create](../../christinacormie-backend/src/modules/community/community-posts.service.ts#L35).

Response surface / delegation: `{ message, post, rewardStatus, ...('rewardMessage' in post ? { rewardMessage: post.rewardMessage } : {}) }`.

Repository references: [CommunityRepository.ensurePublisher](../../christinacormie-backend/src/modules/community/community.repository.ts#L22); [CommunityRepository.createRequest](../../christinacormie-backend/src/modules/community/community.repository.ts#L155); [CommunityRepository.buildRequestTitle](../../christinacormie-backend/src/modules/community/community.repository.ts#L768); [CommunityRepository.toDateOnly](../../christinacormie-backend/src/modules/community/community.repository.ts#L780); [CommunityRepository.toTimeDate](../../christinacormie-backend/src/modules/community/community.repository.ts#L784); [CommunityRepository.requestInclude](../../christinacormie-backend/src/modules/community/community.repository.ts#L685).

Success HTTP status: 201 (Nest default unless overridden). Service path exceptions: `new BadRequestException('Community post could not be created')`; `new ForbiddenException( 'An active account is required to publish or manage Community posts', )`; `new ForbiddenException( 'Only customers and vendors can publish Community posts', )`; `new ForbiddenException( 'Vendor onboarding must be completed before publishing Community posts', )`; `new NotFoundException('Community post not found')`; `new NotFoundException('Community post is not available')`.

<a id="endpoint-get-community-posts"></a>

### GET /api/v1/community/posts

UI groups: C14, V12. Source status: IMPLEMENTED.

Controller: [CommunityPostsController.list](../../christinacormie-backend/src/modules/community/community-posts.controller.ts#L216).

Auth: Bearer access JWT required; roles no explicit role restriction; ownership/state rules still apply. Current decorators: `UseGuards(JwtAuthGuard)`.

Request parameters: `@CurrentUser() user: AuthenticatedUser`; `@Query() query: CommunityPostQueryDto`.

Inventory field index: `queryParams.category optional: CommunityPostCategory`; `queryParams.tab optional: 'ALL' &#124; 'MINE' &#124; 'REQUESTS' - REQUESTS lists open public Need-a-Truck and Callout opportunities from other users.`; `queryParams.latitude optional: number`; `queryParams.longitude optional: number`; `queryParams.radiusKm optional: number`; `queryParams.limit optional: number`; `queryParams.offset optional: number`; `queryParams.message required: string`.

Response implementation: [CommunityPostsService.list](../../christinacormie-backend/src/modules/community/community-posts.service.ts#L142).

Response surface / delegation: `{ message, items, pagination }`.

Success HTTP status: 200 (Nest default unless overridden). Service path exceptions: `new BadRequestException( 'latitude and longitude must be provided together', )`; `new BadRequestException( 'latitude and longitude are required when radiusKm is provided', )`; `new BadRequestException( 'The Requests tab supports only NEED_TRUCK and VENDOR_CALLOUT', )`.

<a id="endpoint-get-community-posts-mine"></a>

### GET /api/v1/community/posts/mine

UI groups: C14, V13. Source status: IMPLEMENTED.

Controller: [CommunityPostsController.mine](../../christinacormie-backend/src/modules/community/community-posts.controller.ts#L238).

Auth: Bearer access JWT required; roles no explicit role restriction; ownership/state rules still apply. Current decorators: `UseGuards(JwtAuthGuard)`.

Request parameters: `@CurrentUser() user: AuthenticatedUser`; `@Query() query: CommunityPostQueryDto`.

Inventory field index: `queryParams.category optional: CommunityPostCategory`; `queryParams.tab optional: 'ALL' &#124; 'MINE' &#124; 'REQUESTS' - REQUESTS lists open public Need-a-Truck and Callout opportunities from other users.`; `queryParams.latitude optional: number`; `queryParams.longitude optional: number`; `queryParams.radiusKm optional: number`; `queryParams.limit optional: number`; `queryParams.offset optional: number`; `queryParams.message required: string`.

Response implementation: [CommunityPostsService.list](../../christinacormie-backend/src/modules/community/community-posts.service.ts#L142).

Response surface / delegation: `{ message, items, pagination }`.

Success HTTP status: 200 (Nest default unless overridden). Service path exceptions: `new BadRequestException( 'latitude and longitude must be provided together', )`; `new BadRequestException( 'latitude and longitude are required when radiusKm is provided', )`; `new BadRequestException( 'The Requests tab supports only NEED_TRUCK and VENDOR_CALLOUT', )`.

<a id="endpoint-patch-community-posts-by-postId"></a>

### PATCH /api/v1/community/posts/:postId

UI groups: C15, V13. Source status: IMPLEMENTED.

Controller: [CommunityPostsController.update](../../christinacormie-backend/src/modules/community/community-posts.controller.ts#L278).

Auth: Bearer access JWT required; roles no explicit role restriction; ownership/state rules still apply. Current decorators: `UseGuards(JwtAuthGuard)`.

Request parameters: `@CurrentUser() user: AuthenticatedUser`; `@Param('postId', ParseUUIDPipe) id: string`; `@Body() dto: UpdateCommunityPostDto`.

Inventory field index: `pathParams.postId required: string - URL path parameter postId`; `body.category optional: CommunityPostCategory`; `body.tab optional: 'ALL' &#124; 'MINE' &#124; 'REQUESTS' - REQUESTS lists open public Need-a-Truck and Callout opportunities from other users.`; `body.latitude optional: number`; `body.longitude optional: number`; `body.radiusKm optional: number`; `body.limit optional: number`; `body.offset optional: number`; `body.message required: string`.

Response implementation: [CommunityPostsService.update](../../christinacormie-backend/src/modules/community/community-posts.service.ts#L249).

Response surface / delegation: `{ message, post }`.

Repository references: [CommunityRepository.ensurePublisher](../../christinacormie-backend/src/modules/community/community.repository.ts#L22); [CommunityRepository.findRequestById](../../christinacormie-backend/src/modules/community/community.repository.ts#L76); [CommunityRepository.findVendorByUserId](../../christinacormie-backend/src/modules/community/community.repository.ts#L50).

Success HTTP status: 200 (Nest default unless overridden). Service path exceptions: `new BadRequestException('Provide at least one field to update')`; ``new BadRequestException(`${key} cannot be null`)``; `new BadRequestException( 'Post category cannot be changed; create a new post for a different category', )`; `new ForbiddenException( 'An active account is required to publish or manage Community posts', )`; `new ForbiddenException( 'Only customers and vendors can publish Community posts', )`; `new ForbiddenException( 'Vendor onboarding must be completed before publishing Community posts', )`.

<a id="endpoint-delete-community-posts-by-postId"></a>

### DELETE /api/v1/community/posts/:postId

UI groups: C15, V13. Source status: IMPLEMENTED.

Controller: [CommunityPostsController.remove](../../christinacormie-backend/src/modules/community/community-posts.controller.ts#L299).

Auth: Bearer access JWT required; roles no explicit role restriction; ownership/state rules still apply. Current decorators: `UseGuards(JwtAuthGuard)`.

Request parameters: `@CurrentUser() user: AuthenticatedUser`; `@Param('postId', ParseUUIDPipe) id: string`.

Inventory field index: `pathParams.postId required: string - URL path parameter postId`.

Response implementation: [CommunityPostsService.remove](../../christinacormie-backend/src/modules/community/community-posts.service.ts#L360).

Response surface / delegation: `{ message, deleted }`.

Repository references: [CommunityRepository.ensurePublisher](../../christinacormie-backend/src/modules/community/community.repository.ts#L22).

Success HTTP status: 200 (Nest default unless overridden). Service path exceptions: `new ForbiddenException( 'An active account is required to publish or manage Community posts', )`; `new ForbiddenException( 'Only customers and vendors can publish Community posts', )`; `new ForbiddenException( 'Vendor onboarding must be completed before publishing Community posts', )`; `new NotFoundException('Community post not found')`; `new ForbiddenException( 'Only the post owner can edit or delete this post', )`; `new ConflictException( 'Only open, unexpired posts can be edited or deleted', )`.

<a id="endpoint-post-community-media-upload"></a>

### POST /api/v1/community/media/upload

UI groups: C15, V09. Source status: IMPLEMENTED.

Controller: [CommunityPostsController.upload](../../christinacormie-backend/src/modules/community/community-posts.controller.ts#L317).

Auth: Bearer access JWT required; roles no explicit role restriction; ownership/state rules still apply. Current decorators: `UseGuards(JwtAuthGuard)`.

Request parameters: `@CurrentUser() user: AuthenticatedUser`; `@UploadedFiles() files: Express.Multer.File[]`.

Inventory field index: `body.file required: binary - Multipart file upload`.

Response implementation: [CommunityPostsService.upload](../../christinacormie-backend/src/modules/community/community-posts.service.ts#L591).

Response surface / delegation: `{ message, media }`.

Repository references: [CommunityRepository.ensurePublisher](../../christinacormie-backend/src/modules/community/community.repository.ts#L22).

Success HTTP status: 201 (Nest default unless overridden). Service path exceptions: `new BadRequestException( 'Select at least one JPG, PNG, or PDF file to upload', )`; `new BadRequestException('You can upload at most 5 files')`; `new BadRequestException( 'Only valid JPG, PNG, or PDF files are accepted', )`; `new BadRequestException( 'Each attachment must be 10 MB or smaller', )`; `new ServiceUnavailableException( 'Community uploads are not configured. Please contact support', )`; `new ServiceUnavailableException( 'Community attachment upload failed. Please try again', )`.

<a id="endpoint-post-community-posts-by-postId-interests"></a>

### POST /api/v1/community/posts/:postId/interests

UI groups: V12. Source status: IMPLEMENTED.

Controller: [CommunityPostsController.interest](../../christinacormie-backend/src/modules/community/community-posts.controller.ts#L378).

Auth: Bearer access JWT required; roles VENDOR. Current decorators: `UseGuards(JwtAuthGuard)`; `UseGuards(RolesGuard)`; `Roles(UserRole.VENDOR)`.

Request parameters: `@CurrentUser() user: AuthenticatedUser`; `@Param('postId', ParseUUIDPipe) id: string`; `@Body() dto: CommunityInterestDto`.

Inventory field index: `pathParams.postId required: string - URL path parameter postId`; `body.category optional: CommunityPostCategory`; `body.tab optional: 'ALL' &#124; 'MINE' &#124; 'REQUESTS' - REQUESTS lists open public Need-a-Truck and Callout opportunities from other users.`; `body.latitude optional: number`; `body.longitude optional: number`; `body.radiusKm optional: number`; `body.limit optional: number`; `body.offset optional: number`; `body.message required: string`.

Response implementation: [CommunityPostsService.action](../../christinacormie-backend/src/modules/community/community-posts.service.ts#L372).

Response surface / delegation: `{ message }`.

Repository references: [CommunityRepository.ensurePublisher](../../christinacormie-backend/src/modules/community/community.repository.ts#L22); [CommunityRepository.findRequestById](../../christinacormie-backend/src/modules/community/community.repository.ts#L76); [CommunityRepository.findVendorByUserId](../../christinacormie-backend/src/modules/community/community.repository.ts#L50).

Success HTTP status: 201 (Nest default unless overridden). Service path exceptions: `new ForbiddenException( 'Vendor onboarding must be completed before sending interest', )`; `new NotFoundException('Community post not found')`; `new ForbiddenException( 'You cannot respond to or ignore your own post', )`; `new BadRequestException( 'Interest can only be sent to Vendor Callout posts', )`; `new ConflictException('This callout is closed or expired')`; `new ConflictException( 'You have already sent interest to this callout', )`.

<a id="endpoint-get-community-posts-by-postId-interests"></a>

### GET /api/v1/community/posts/:postId/interests

UI groups: C18. Source status: IMPLEMENTED.

Controller: [CommunityPostsController.interests](../../christinacormie-backend/src/modules/community/community-posts.controller.ts#L397).

Auth: Bearer access JWT required; roles no explicit role restriction; ownership/state rules still apply. Current decorators: `UseGuards(JwtAuthGuard)`.

Request parameters: `@CurrentUser() user: AuthenticatedUser`; `@Param('postId', ParseUUIDPipe) id: string`; `@Query() query: CommunityPostQueryDto`.

Inventory field index: `pathParams.postId required: string - URL path parameter postId`; `queryParams.category optional: CommunityPostCategory`; `queryParams.tab optional: 'ALL' &#124; 'MINE' &#124; 'REQUESTS' - REQUESTS lists open public Need-a-Truck and Callout opportunities from other users.`; `queryParams.latitude optional: number`; `queryParams.longitude optional: number`; `queryParams.radiusKm optional: number`; `queryParams.limit optional: number`; `queryParams.offset optional: number`; `queryParams.message required: string`.

Response implementation: [CommunityPostsService.interests](../../christinacormie-backend/src/modules/community/community-posts.service.ts#L508).

Response surface / delegation: `{ message, items, total }`.

Repository references: [CommunityRepository.findRequestById](../../christinacormie-backend/src/modules/community/community.repository.ts#L76); [CommunityRepository.findVendorByUserId](../../christinacormie-backend/src/modules/community/community.repository.ts#L50).

Success HTTP status: 200 (Nest default unless overridden). Service path exceptions: `new ForbiddenException( 'Only the organizer can view interest messages', )`; `new BadRequestException('This post is not a Vendor Callout')`; `new NotFoundException('Community post is not available')`; `new NotFoundException('Community request not found')`; `new ForbiddenException('Community request is private')`.

<a id="endpoint-delete-community-posts-by-postId-interests-me"></a>

### DELETE /api/v1/community/posts/:postId/interests/me

UI groups: V12. Source status: IMPLEMENTED.

Controller: [CommunityPostsController.withdraw](../../christinacormie-backend/src/modules/community/community-posts.controller.ts#L419).

Auth: Bearer access JWT required; roles no explicit role restriction; ownership/state rules still apply. Current decorators: `UseGuards(JwtAuthGuard)`.

Request parameters: `@CurrentUser() user: AuthenticatedUser`; `@Param('postId', ParseUUIDPipe) id: string`.

Inventory field index: `pathParams.postId required: string - URL path parameter postId`.

Response implementation: [CommunityPostsService.undoAction](../../christinacormie-backend/src/modules/community/community-posts.service.ts#L428).

Response surface / delegation: `{ message }`.

Repository references: [CommunityRepository.findRequestById](../../christinacormie-backend/src/modules/community/community.repository.ts#L76); [CommunityRepository.findVendorByUserId](../../christinacormie-backend/src/modules/community/community.repository.ts#L50).

Success HTTP status: 200 (Nest default unless overridden). Service path exceptions: `new NotFoundException('Community post is not available')`; `new NotFoundException('Community request not found')`; `new ForbiddenException('Community request is private')`.

<a id="endpoint-post-community-posts-by-postId-ignore"></a>

### POST /api/v1/community/posts/:postId/ignore

UI groups: C17, V12. Source status: IMPLEMENTED.

Controller: [CommunityPostsController.ignore](../../christinacormie-backend/src/modules/community/community-posts.controller.ts#L432).

Auth: Bearer access JWT required; roles no explicit role restriction; ownership/state rules still apply. Current decorators: `UseGuards(JwtAuthGuard)`.

Request parameters: `@CurrentUser() user: AuthenticatedUser`; `@Param('postId', ParseUUIDPipe) id: string`.

Inventory field index: `pathParams.postId required: string - URL path parameter postId`.

Response implementation: [CommunityPostsService.action](../../christinacormie-backend/src/modules/community/community-posts.service.ts#L372).

Response surface / delegation: `{ message }`.

Repository references: [CommunityRepository.ensurePublisher](../../christinacormie-backend/src/modules/community/community.repository.ts#L22); [CommunityRepository.findRequestById](../../christinacormie-backend/src/modules/community/community.repository.ts#L76); [CommunityRepository.findVendorByUserId](../../christinacormie-backend/src/modules/community/community.repository.ts#L50).

Success HTTP status: 201 (Nest default unless overridden). Service path exceptions: `new ForbiddenException( 'Vendor onboarding must be completed before sending interest', )`; `new NotFoundException('Community post not found')`; `new ForbiddenException( 'You cannot respond to or ignore your own post', )`; `new BadRequestException( 'Interest can only be sent to Vendor Callout posts', )`; `new ConflictException('This callout is closed or expired')`; `new ConflictException( 'You have already sent interest to this callout', )`.

<a id="endpoint-delete-community-posts-by-postId-ignore"></a>

### DELETE /api/v1/community/posts/:postId/ignore

UI groups: C17, V12. Source status: IMPLEMENTED.

Controller: [CommunityPostsController.restore](../../christinacormie-backend/src/modules/community/community-posts.controller.ts#L445).

Auth: Bearer access JWT required; roles no explicit role restriction; ownership/state rules still apply. Current decorators: `UseGuards(JwtAuthGuard)`.

Request parameters: `@CurrentUser() user: AuthenticatedUser`; `@Param('postId', ParseUUIDPipe) id: string`.

Inventory field index: `pathParams.postId required: string - URL path parameter postId`.

Response implementation: [CommunityPostsService.undoAction](../../christinacormie-backend/src/modules/community/community-posts.service.ts#L428).

Response surface / delegation: `{ message }`.

Repository references: [CommunityRepository.findRequestById](../../christinacormie-backend/src/modules/community/community.repository.ts#L76); [CommunityRepository.findVendorByUserId](../../christinacormie-backend/src/modules/community/community.repository.ts#L50).

Success HTTP status: 200 (Nest default unless overridden). Service path exceptions: `new NotFoundException('Community post is not available')`; `new NotFoundException('Community request not found')`; `new ForbiddenException('Community request is private')`.

<a id="endpoint-post-community-posts-by-postId-reports"></a>

### POST /api/v1/community/posts/:postId/reports

UI groups: C17. Source status: IMPLEMENTED.

Controller: [CommunityPostsController.report](../../christinacormie-backend/src/modules/community/community-posts.controller.ts#L458).

Auth: Bearer access JWT required; roles no explicit role restriction; ownership/state rules still apply. Current decorators: `UseGuards(JwtAuthGuard)`.

Request parameters: `@CurrentUser() user: AuthenticatedUser`; `@Param('postId', ParseUUIDPipe) id: string`; `@Body() dto: ReportCommunityPostDto`.

Inventory field index: `pathParams.postId required: string - URL path parameter postId`; `body.reason required: CommunityPostReportReason`.

Response implementation: [CommunityPostsService.report](../../christinacormie-backend/src/modules/community/community-posts.service.ts#L445).

Response surface / delegation: `{ message, report }`.

Repository references: [CommunityRepository.ensurePublisher](../../christinacormie-backend/src/modules/community/community.repository.ts#L22); [CommunityRepository.findRequestById](../../christinacormie-backend/src/modules/community/community.repository.ts#L76); [CommunityRepository.findVendorByUserId](../../christinacormie-backend/src/modules/community/community.repository.ts#L50); [NotificationsRepository.findAdminUserIds](../../christinacormie-backend/src/modules/notifications/notifications.repository.ts#L193); [NotificationsRepository.findRecentForUser](../../christinacormie-backend/src/modules/notifications/notifications.repository.ts#L84); [NotificationsRepository.create](../../christinacormie-backend/src/modules/notifications/notifications.repository.ts#L206).

Success HTTP status: 201 (Nest default unless overridden). Service path exceptions: `new ForbiddenException('You cannot report your own post')`; `new ConflictException('You have already reported this post')`; `new ForbiddenException( 'An active account is required to publish or manage Community posts', )`; `new ForbiddenException( 'Only customers and vendors can publish Community posts', )`; `new ForbiddenException( 'Vendor onboarding must be completed before publishing Community posts', )`; `new NotFoundException('Community post is not available')`.

<a id="endpoint-post-community-posts-by-postId-comments"></a>

### POST /api/v1/community/posts/:postId/comments

UI groups: C16, V13. Source status: IMPLEMENTED.

Controller: [CommunityPostsController.comment](../../christinacormie-backend/src/modules/community/community-posts.controller.ts#L521).

Auth: Bearer access JWT required; roles no explicit role restriction; ownership/state rules still apply. Current decorators: `UseGuards(JwtAuthGuard)`.

Request parameters: `@CurrentUser() user: AuthenticatedUser`; `@Param('postId', ParseUUIDPipe) id: string`; `@Body() dto: CommentRequestDto`.

Inventory field index: `pathParams.postId required: string - URL path parameter postId`; `body.content required: string`; `body.parentCommentId optional: string`.

Response implementation: [CommunityService.commentOnRequest](../../christinacormie-backend/src/modules/community/community.service.ts#L173).

Response surface / delegation: `this.communityRepository.createComment(requestId, userId, dto)`.

Repository references: [CommunityRepository.findRequestById](../../christinacormie-backend/src/modules/community/community.repository.ts#L76); [CommunityRepository.findVendorByUserId](../../christinacormie-backend/src/modules/community/community.repository.ts#L50); [CommunityRepository.findCommentById](../../christinacormie-backend/src/modules/community/community.repository.ts#L334); [CommunityRepository.createComment](../../christinacormie-backend/src/modules/community/community.repository.ts#L347).

Success HTTP status: 201 (Nest default unless overridden). Service path exceptions: `new NotFoundException('Parent comment not found')`; `new NotFoundException('Community post is not available')`; `new NotFoundException('Community request not found')`; `new ForbiddenException('Community request is private')`.

<a id="endpoint-get-community-posts-by-postId-comments"></a>

### GET /api/v1/community/posts/:postId/comments

UI groups: C16, V13. Source status: IMPLEMENTED.

Controller: [CommunityPostsController.comments](../../christinacormie-backend/src/modules/community/community-posts.controller.ts#L543).

Auth: Bearer access JWT required; roles no explicit role restriction; ownership/state rules still apply. Current decorators: `UseGuards(JwtAuthGuard)`.

Request parameters: `@CurrentUser() user: AuthenticatedUser`; `@Param('postId', ParseUUIDPipe) id: string`; `@Query() query: CommunityPostQueryDto`.

Inventory field index: `pathParams.postId required: string - URL path parameter postId`; `queryParams.category optional: CommunityPostCategory`; `queryParams.tab optional: 'ALL' &#124; 'MINE' &#124; 'REQUESTS' - REQUESTS lists open public Need-a-Truck and Callout opportunities from other users.`; `queryParams.latitude optional: number`; `queryParams.longitude optional: number`; `queryParams.radiusKm optional: number`; `queryParams.limit optional: number`; `queryParams.offset optional: number`; `queryParams.message required: string`.

Response implementation: [CommunityPostsService.comments](../../christinacormie-backend/src/modules/community/community-posts.service.ts#L552).

Response surface / delegation: `{ message, items, pagination }`.

Repository references: [CommunityRepository.findRequestById](../../christinacormie-backend/src/modules/community/community.repository.ts#L76); [CommunityRepository.findVendorByUserId](../../christinacormie-backend/src/modules/community/community.repository.ts#L50).

Success HTTP status: 200 (Nest default unless overridden). Service path exceptions: `new NotFoundException('Community post is not available')`; `new NotFoundException('Community request not found')`; `new ForbiddenException('Community request is private')`.

<a id="endpoint-post-community-posts-by-postId-reactions"></a>

### POST /api/v1/community/posts/:postId/reactions

UI groups: C16, V13. Source status: IMPLEMENTED.

Controller: [CommunityPostsController.react](../../christinacormie-backend/src/modules/community/community-posts.controller.ts#L565).

Auth: Bearer access JWT required; roles no explicit role restriction; ownership/state rules still apply. Current decorators: `UseGuards(JwtAuthGuard)`.

Request parameters: `@CurrentUser() user: AuthenticatedUser`; `@Param('postId', ParseUUIDPipe) id: string`; `@Body() dto: ReactRequestDto`.

Inventory field index: `pathParams.postId required: string - URL path parameter postId`; `body.reaction optional: string`.

Response implementation: [CommunityService.reactToRequest](../../christinacormie-backend/src/modules/community/community.service.ts#L197).

Response surface / delegation: `this.communityRepository.reactToRequest(requestId, userId, dto)`.

Repository references: [CommunityRepository.findRequestById](../../christinacormie-backend/src/modules/community/community.repository.ts#L76); [CommunityRepository.findVendorByUserId](../../christinacormie-backend/src/modules/community/community.repository.ts#L50); [CommunityRepository.reactToRequest](../../christinacormie-backend/src/modules/community/community.repository.ts#L371).

Success HTTP status: 201 (Nest default unless overridden). Service path exceptions: `new NotFoundException('Community post is not available')`; `new NotFoundException('Community request not found')`; `new ForbiddenException('Community request is private')`.

<a id="endpoint-post-community-posts-by-postId-offers"></a>

### POST /api/v1/community/posts/:postId/offers

UI groups: V12. Source status: IMPLEMENTED.

Controller: [CommunityPostsController.quote](../../christinacormie-backend/src/modules/community/community-posts.controller.ts#L587).

Auth: Bearer access JWT required; roles VENDOR. Current decorators: `UseGuards(JwtAuthGuard)`; `UseGuards(RolesGuard)`; `Roles(UserRole.VENDOR)`.

Request parameters: `@CurrentUser() user: AuthenticatedUser`; `@Param('postId', ParseUUIDPipe) id: string`; `@Body() dto: CreateVendorOfferDto`.

Inventory field index: `pathParams.postId required: string - URL path parameter postId`; `body.label required: string`; `body.amount required: number`; `body.pricePerPerson optional: number - Required for PER_PERSON; backend multiplies by the request guest count.`; `body.foodTruckId required: string`; `body.message optional: string`; `body.noteToClient optional: string`; `body.pricingModel optional: OfferPricingModelDto`; `body.selectedMenuItems optional: string[]`; `body.baseServiceFee optional: number`; `body.transportFee optional: number`; `body.extraCharges optional: OfferExtraChargeDto[] - Additional charge lines shown in the quote breakdown.`; `body.taxAmount optional: number`; `body.discountAmount optional: number`; `body.paymentPreference optional: BookingPaymentPreferenceDto`; `body.depositAmount optional: number`; `body.depositPercent optional: number`; `body.quotedAmount optional: number - Total contract amount for the quote. If omitted, the backend derives it from the quote breakdown.`; `body.serviceFee optional: number`; `body.balanceDueAtEvent optional: number`; `body.expiresAt optional: string`.

Response implementation: [CommunityService.createVendorOffer](../../christinacormie-backend/src/modules/community/community.service.ts#L206).

Response surface / delegation: `this.communityRepository.createVendorOffer( vendor.id, requestId, dto, )`.

Repository references: [CommunityRepository.ensurePublisher](../../christinacormie-backend/src/modules/community/community.repository.ts#L22); [CommunityRepository.findVendorByUserId](../../christinacormie-backend/src/modules/community/community.repository.ts#L50); [CommunityRepository.findRequestById](../../christinacormie-backend/src/modules/community/community.repository.ts#L76); [CommunityRepository.findFoodTruckById](../../christinacormie-backend/src/modules/community/community.repository.ts#L57); [CommunityRepository.createVendorOffer](../../christinacormie-backend/src/modules/community/community.repository.ts#L390); [CommunityRepository.offerInclude](../../christinacormie-backend/src/modules/community/community.repository.ts#L727).

Success HTTP status: 201 (Nest default unless overridden). Service path exceptions: `new BadRequestException( 'Quotes can only be sent to Need-a-Truck requests', )`; `new ForbiddenException( 'You cannot send a quote to your own request', )`; `new ForbiddenException('Food truck does not belong to this vendor')`; `new BadRequestException('Request is not open for offers')`; `new BadRequestException('Request has expired')`; `new ForbiddenException( 'This private request targets another truck', )`.

<a id="endpoint-get-community-posts-by-postId-offers"></a>

### GET /api/v1/community/posts/:postId/offers

UI groups: C19. Source status: IMPLEMENTED.

Controller: [CommunityPostsController.offers](../../christinacormie-backend/src/modules/community/community-posts.controller.ts#L619).

Auth: Bearer access JWT required; roles no explicit role restriction; ownership/state rules still apply. Current decorators: `UseGuards(JwtAuthGuard)`.

Request parameters: `@CurrentUser() user: AuthenticatedUser`; `@Param('postId', ParseUUIDPipe) id: string`.

Inventory field index: `pathParams.postId required: string - URL path parameter postId`.

Response implementation: [CommunityService.listRequestOffers](../../christinacormie-backend/src/modules/community/community.service.ts#L115).

Response surface / delegation: `this.communityRepository.listOffersForRequest( requestId, sort, vendor?.id, )`.

Repository references: [CommunityRepository.findRequestById](../../christinacormie-backend/src/modules/community/community.repository.ts#L76); [CommunityRepository.findVendorByUserId](../../christinacormie-backend/src/modules/community/community.repository.ts#L50); [CommunityRepository.listOffersForRequest](../../christinacormie-backend/src/modules/community/community.repository.ts#L130); [CommunityRepository.offerInclude](../../christinacormie-backend/src/modules/community/community.repository.ts#L727).

Success HTTP status: 200 (Nest default unless overridden). Service path exceptions: `new BadRequestException( 'sort must be LOW_PRICE, HIGH_RATED, or RECENT', )`; `new NotFoundException('Community post is not available')`; `new NotFoundException('Community request not found')`; `new ForbiddenException('Community request is private')`; `new ForbiddenException('Vendor profile is required')`; `new ForbiddenException(this.vendorApprovalMessage)`.

<a id="endpoint-patch-community-offers-by-offerId-accept"></a>

### PATCH /api/v1/community/offers/:offerId/accept

UI groups: C19. Source status: IMPLEMENTED.

Controller: [CommunityController.acceptOffer](../../christinacormie-backend/src/modules/community/community.controller.ts#L107).

Auth: Bearer access JWT required; roles no explicit role restriction; ownership/state rules still apply. Current decorators: `UseGuards(JwtAuthGuard)`.

Request parameters: `@CurrentUser() user: AuthenticatedUser`; `@Param('offerId', ParseUUIDPipe) offerId: string`.

Inventory field index: `pathParams.offerId required: string - URL path parameter offerId`.

Response implementation: [CommunityService.acceptOffer](../../christinacormie-backend/src/modules/community/community.service.ts#L257).

Response surface / delegation: `this.communityRepository.acceptOffer( offerId, offer.communityRequestId, )`.

Repository references: [CommunityRepository.findOfferById](../../christinacormie-backend/src/modules/community/community.repository.ts#L456); [CommunityRepository.acceptOffer](../../christinacormie-backend/src/modules/community/community.repository.ts#L478); [CommunityRepository.offerInclude](../../christinacormie-backend/src/modules/community/community.repository.ts#L727); [CommunityRepository.createBookingNumber](../../christinacormie-backend/src/modules/community/community.repository.ts#L788).

Success HTTP status: 200 (Nest default unless overridden). Service path exceptions: `new ForbiddenException('Only the request owner can accept offers')`; `new BadRequestException('Offer is not pending')`; `new BadRequestException('Offer has expired')`; `new NotFoundException('Offer not found')`; `new ConflictException( 'This quote or request is no longer available for acceptance', )`; `new ConflictException('This quote or request has expired')`.

<a id="endpoint-patch-community-offers-by-offerId-reject"></a>

### PATCH /api/v1/community/offers/:offerId/reject

UI groups: C19. Source status: IMPLEMENTED.

Controller: [CommunityController.rejectOffer](../../christinacormie-backend/src/modules/community/community.controller.ts#L118).

Auth: Bearer access JWT required; roles no explicit role restriction; ownership/state rules still apply. Current decorators: `UseGuards(JwtAuthGuard)`.

Request parameters: `@CurrentUser() user: AuthenticatedUser`; `@Param('offerId', ParseUUIDPipe) offerId: string`.

Inventory field index: `pathParams.offerId required: string - URL path parameter offerId`.

Response implementation: [CommunityService.rejectOffer](../../christinacormie-backend/src/modules/community/community.service.ts#L278).

Response surface / delegation: `this.communityRepository.rejectOffer(offerId)`.

Repository references: [CommunityRepository.findOfferById](../../christinacormie-backend/src/modules/community/community.repository.ts#L456); [CommunityRepository.rejectOffer](../../christinacormie-backend/src/modules/community/community.repository.ts#L638); [CommunityRepository.changePendingOffer](../../christinacormie-backend/src/modules/community/community.repository.ts#L646); [CommunityRepository.offerInclude](../../christinacormie-backend/src/modules/community/community.repository.ts#L727).

Success HTTP status: 200 (Nest default unless overridden). Service path exceptions: `new ForbiddenException('Only the request owner can reject offers')`; `new BadRequestException('Offer is not pending')`; `new NotFoundException('Offer not found')`; `new ConflictException('Quote is no longer available')`; `new ConflictException( 'Only pending quotes can be rejected or withdrawn', )`.

<a id="endpoint-patch-community-offers-by-offerId-withdraw"></a>

### PATCH /api/v1/community/offers/:offerId/withdraw

UI groups: V12. Source status: IMPLEMENTED.

Controller: [CommunityController.withdrawOffer](../../christinacormie-backend/src/modules/community/community.controller.ts#L129).

Auth: Bearer access JWT required; roles VENDOR. Current decorators: `UseGuards(JwtAuthGuard, RolesGuard)`; `Roles(UserRole.VENDOR)`.

Request parameters: `@CurrentUser() user: AuthenticatedUser`; `@Param('offerId', ParseUUIDPipe) offerId: string`.

Inventory field index: `pathParams.offerId required: string - URL path parameter offerId`.

Response implementation: [CommunityService.withdrawOffer](../../christinacormie-backend/src/modules/community/community.service.ts#L292).

Response surface / delegation: `this.communityRepository.withdrawOffer(offerId)`.

Repository references: [CommunityRepository.findOfferById](../../christinacormie-backend/src/modules/community/community.repository.ts#L456); [CommunityRepository.findVendorByUserId](../../christinacormie-backend/src/modules/community/community.repository.ts#L50); [CommunityRepository.withdrawOffer](../../christinacormie-backend/src/modules/community/community.repository.ts#L642); [CommunityRepository.changePendingOffer](../../christinacormie-backend/src/modules/community/community.repository.ts#L646); [CommunityRepository.offerInclude](../../christinacormie-backend/src/modules/community/community.repository.ts#L727).

Success HTTP status: 200 (Nest default unless overridden). Service path exceptions: `new ForbiddenException('Offer does not belong to this vendor')`; `new BadRequestException('Only pending offers can be withdrawn')`; `new NotFoundException('Offer not found')`; `new ForbiddenException('Vendor profile is required')`; `new ForbiddenException(this.vendorApprovalMessage)`; `new ConflictException('Quote is no longer available')`.

<a id="endpoint-post-community-new-food-truck-leads"></a>

### POST /api/v1/community/new-food-truck-leads

UI groups: C31. Source status: IMPLEMENTED.

Controller: [CommunityController.createNewFoodTruckLead](../../christinacormie-backend/src/modules/community/community.controller.ts#L141).

Auth: No mandatory JWT in inventory; check current decorators; roles no explicit role restriction; ownership/state rules still apply. Current decorators: none.

Request parameters: `@Body() dto: NewFoodTruckLeadDto`.

Inventory field index: `body.truckName required: string`; `body.ownerName optional: string`; `body.ownerEmail optional: string`; `body.ownerPhone optional: string`; `body.socialUrl optional: string`; `body.city optional: string`; `body.state optional: string`; `body.notes optional: string`.

Response implementation: [CommunityService.createNewFoodTruckLead](../../christinacormie-backend/src/modules/community/community.service.ts#L307).

Response surface / delegation: `this.communityRepository.createNewFoodTruckLead(dto)`.

Repository references: [CommunityRepository.createNewFoodTruckLead](../../christinacormie-backend/src/modules/community/community.repository.ts#L669).

Success HTTP status: 201 (Nest default unless overridden). Service path exceptions: none explicitly extracted; common failures still apply.

<a id="endpoint-get-discovery-nearby"></a>

### GET /api/v1/discovery/nearby

UI groups: C01, C08. Source status: IMPLEMENTED.

Controller: [DiscoveryController.getNearbyFoodTrucks](../../christinacormie-backend/src/modules/discovery/discovery.controller.ts#L75).

Auth: No mandatory JWT in inventory; check current decorators; roles no explicit role restriction; ownership/state rules still apply. Current decorators: none.

Request parameters: `@Query() query: NearbyFoodTrucksQueryDto`.

Inventory field index: `queryParams.latitude required: number`; `queryParams.longitude required: number`; `queryParams.radiusKm optional: number`; `queryParams.openOnly optional: boolean`; `queryParams.operatingStatus optional: OperatingStatusFilter - Filter by exact operating status`; `queryParams.cuisineId optional: string`; `queryParams.cuisineSlug optional: string`; `queryParams.cuisine optional: string`; `queryParams.search optional: string`; `queryParams.area optional: string`; `queryParams.city optional: string`; `queryParams.minRating optional: number - Minimum average rating (e.g. 3.0, 3.5, 4.0, 4.5)`; `queryParams.limit optional: number`; `queryParams.offset optional: number`.

Response implementation: [DiscoveryService.getNearbyFoodTrucks](../../christinacormie-backend/src/modules/discovery/discovery.service.ts#L18).

Response surface / delegation: `this.toFoodTruckListResponse(rows, { latitude: dto.latitude, longitude: dto.longitude, radiusKm: dto.radiusKm ?? 10, })`.

Repository references: [DiscoveryRepository.findNearbyFoodTrucks](../../christinacormie-backend/src/modules/discovery/discovery.repository.ts#L14); [DiscoveryRepository.addParam](../../christinacormie-backend/src/modules/discovery/discovery.repository.ts#L219); [DiscoveryRepository.baseWhere](../../christinacormie-backend/src/modules/discovery/discovery.repository.ts#L130); [DiscoveryRepository.filterWhere](../../christinacormie-backend/src/modules/discovery/discovery.repository.ts#L139); [DiscoveryRepository.selectFoodTruckFields](../../christinacormie-backend/src/modules/discovery/discovery.repository.ts#L75).

Success HTTP status: 200 (Nest default unless overridden). Service path exceptions: `new InternalServerErrorException( 'Unable to load nearby food trucks. Please check your location filters and try again.', )`.

<a id="endpoint-get-discovery-trending"></a>

### GET /api/v1/discovery/trending

UI groups: C02. Source status: IMPLEMENTED.

Controller: [DiscoveryController.getTrendingFoodTrucks](../../christinacormie-backend/src/modules/discovery/discovery.controller.ts#L116).

Auth: No mandatory JWT in inventory; check current decorators; roles no explicit role restriction; ownership/state rules still apply. Current decorators: none.

Request parameters: `@Query() query: TrendingFoodTrucksQueryDto`.

Inventory field index: `queryParams.latitude required: number`; `queryParams.longitude required: number`; `queryParams.radiusKm optional: number`; `queryParams.openOnly optional: boolean`; `queryParams.operatingStatus optional: OperatingStatusFilter - Filter by exact operating status`; `queryParams.cuisineId optional: string`; `queryParams.cuisineSlug optional: string`; `queryParams.cuisine optional: string`; `queryParams.search optional: string`; `queryParams.area optional: string`; `queryParams.city optional: string`; `queryParams.minRating optional: number - Minimum average rating (e.g. 3.0, 3.5, 4.0, 4.5)`; `queryParams.limit optional: number`; `queryParams.offset optional: number`.

Response implementation: [DiscoveryService.getTrendingFoodTrucks](../../christinacormie-backend/src/modules/discovery/discovery.service.ts#L37).

Response surface / delegation: `this.toFoodTruckListResponse(rows)`.

Repository references: [DiscoveryRepository.findTrendingFoodTrucks](../../christinacormie-backend/src/modules/discovery/discovery.repository.ts#L43); [DiscoveryRepository.addParam](../../christinacormie-backend/src/modules/discovery/discovery.repository.ts#L219); [DiscoveryRepository.baseWhere](../../christinacormie-backend/src/modules/discovery/discovery.repository.ts#L130); [DiscoveryRepository.filterWhere](../../christinacormie-backend/src/modules/discovery/discovery.repository.ts#L139); [DiscoveryRepository.selectFoodTruckFields](../../christinacormie-backend/src/modules/discovery/discovery.repository.ts#L75).

Success HTTP status: 200 (Nest default unless overridden). Service path exceptions: `new InternalServerErrorException( 'Unable to load trending food trucks. Please check your filters and try again.', )`.

<a id="endpoint-get-food-trucks-cuisines"></a>

### GET /api/v1/food-trucks/cuisines

UI groups: C01, V18. Source status: IMPLEMENTED.

Controller: [FoodTrucksController.listCuisineCategories](../../christinacormie-backend/src/modules/food-trucks/food-trucks.controller.ts#L276).

Auth: No mandatory JWT in inventory; check current decorators; roles no explicit role restriction; ownership/state rules still apply. Current decorators: none.

Request parameters: .

Response implementation: [FoodTrucksService.listCuisineCategories](../../christinacormie-backend/src/modules/food-trucks/food-trucks.service.ts#L89).

Response surface / delegation: `this.foodTrucksRepository.listCuisines()`.

Repository references: [FoodTrucksRepository.listCuisines](../../christinacormie-backend/src/modules/food-trucks/food-trucks.repository.ts#L144).

Success HTTP status: 200 (Nest default unless overridden). Service path exceptions: none explicitly extracted; common failures still apply.

<a id="endpoint-get-food-trucks-profile-by-slug-reviews"></a>

### GET /api/v1/food-trucks/profile/:slug/reviews

UI groups: C04, V21. Source status: IMPLEMENTED.

Controller: [FoodTrucksController.getPublicReviews](../../christinacormie-backend/src/modules/food-trucks/food-trucks.controller.ts#L334).

Auth: No mandatory JWT in inventory; check current decorators; roles no explicit role restriction; ownership/state rules still apply. Current decorators: none.

Request parameters: `@Param('slug') slug: string`; `@Query() query: PublicReviewsQueryDto`.

Inventory field index: `pathParams.slug required: string - URL path parameter slug`; `queryParams.limit optional: number`; `queryParams.cursor optional: string - Last review id from the previous response`.

Response implementation: [FoodTrucksService.getPublicReviews](../../christinacormie-backend/src/modules/food-trucks/food-trucks.service.ts#L49).

Response surface / delegation: `{ items, nextCursor, summary }`.

Repository references: [FoodTrucksRepository.findPublicReviewSummaryBySlug](../../christinacormie-backend/src/modules/food-trucks/food-trucks.repository.ts#L95); [FoodTrucksRepository.publicFoodTruckWhere](../../christinacormie-backend/src/modules/food-trucks/food-trucks.repository.ts#L1016); [FoodTrucksRepository.findPublicReviewsBySlug](../../christinacormie-backend/src/modules/food-trucks/food-trucks.repository.ts#L106).

Success HTTP status: 200 (Nest default unless overridden). Service path exceptions: `new NotFoundException('Food truck not found')`.

<a id="endpoint-get-food-trucks-profile-by-slug"></a>

### GET /api/v1/food-trucks/profile/:slug

UI groups: C04, C08. Source status: IMPLEMENTED.

Controller: [FoodTrucksController.getPublicProfile](../../christinacormie-backend/src/modules/food-trucks/food-trucks.controller.ts#L391).

Auth: No mandatory JWT in inventory; check current decorators; roles no explicit role restriction; ownership/state rules still apply. Current decorators: none.

Request parameters: `@Param('slug') slug: string`.

Inventory field index: `pathParams.slug required: string - URL path parameter slug`.

Response implementation: [FoodTrucksService.getPublicProfile](../../christinacormie-backend/src/modules/food-trucks/food-trucks.service.ts#L39).

Response surface / delegation: `foodTruck`.

Repository references: [FoodTrucksRepository.findPublicBySlug](../../christinacormie-backend/src/modules/food-trucks/food-trucks.repository.ts#L80); [FoodTrucksRepository.publicFoodTruckInclude](../../christinacormie-backend/src/modules/food-trucks/food-trucks.repository.ts#L971).

Success HTTP status: 200 (Nest default unless overridden). Service path exceptions: `new NotFoundException('Food truck not found')`.

<a id="endpoint-get-food-trucks-mine"></a>

### GET /api/v1/food-trucks/mine

UI groups: V02, V18, S01. Source status: IMPLEMENTED.

Controller: [FoodTrucksController.getMyFoodTrucks](../../christinacormie-backend/src/modules/food-trucks/food-trucks.controller.ts#L409).

Auth: Bearer access JWT required; roles VENDOR, VENDOR_STAFF. Current decorators: `UseGuards(JwtAuthGuard, RolesGuard)`; `Roles(UserRole.VENDOR, UserRole.VENDOR_STAFF)`.

Request parameters: `@CurrentUser() user: AuthenticatedUser`.

Response implementation: [FoodTrucksService.getMyFoodTrucks](../../christinacormie-backend/src/modules/food-trucks/food-trucks.service.ts#L121).

Response surface / delegation: `this.foodTrucksRepository.findMine(vendor.id)`.

Repository references: [FoodTrucksRepository.findVendorForActor](../../christinacormie-backend/src/modules/food-trucks/food-trucks.repository.ts#L40); [FoodTrucksRepository.findVendorByUserId](../../christinacormie-backend/src/modules/food-trucks/food-trucks.repository.ts#L29); [FoodTrucksRepository.findMine](../../christinacormie-backend/src/modules/food-trucks/food-trucks.repository.ts#L151); [FoodTrucksRepository.foodTruckInclude](../../christinacormie-backend/src/modules/food-trucks/food-trucks.repository.ts#L944).

Success HTTP status: 200 (Nest default unless overridden). Service path exceptions: `new ForbiddenException('Vendor profile is required')`.

<a id="endpoint-patch-food-trucks-by-id-profile-settings"></a>

### PATCH /api/v1/food-trucks/:id/profile-settings

UI groups: V18. Source status: IMPLEMENTED.

Controller: [FoodTrucksController.updateProfileSettings](../../christinacormie-backend/src/modules/food-trucks/food-trucks.controller.ts#L525).

Auth: Bearer access JWT required; roles VENDOR. Current decorators: `UseGuards(JwtAuthGuard, RolesGuard)`; `Roles(UserRole.VENDOR)`.

Request parameters: `@CurrentUser() user: AuthenticatedUser`; `@Param('id') foodTruckId: string`; `@Body() dto: UpdateFoodTruckProfileSettingsDto`.

Inventory field index: `pathParams.id required: string - URL path parameter id`; `body.name optional: string`; `body.centerAddress optional: string`; `body.latitude required: number`; `body.longitude required: number`; `body.radiusKm required: number`; `body.outsideRadiusAllowed optional: boolean`; `body.outsideRadiusFee optional: number`; `body.handle optional: string - Public @handle without @. Lowercase letters, numbers, dots, underscores, and hyphens are allowed.`; `body.description optional: string`; `body.profileImageUrl optional: string`; `body.coverImageUrl optional: string`; `body.maximumGuestCapacity optional: number`; `body.minimumBookingAmount optional: number`; `body.operatingHours optional: OperatingHourDto[]`; `body.cuisines optional: CuisineSelectionDto[]`; `body.serviceArea optional: ProfileServiceAreaDto`.

Response implementation: [FoodTrucksService.updateProfileSettings](../../christinacormie-backend/src/modules/food-trucks/food-trucks.service.ts#L154).

Response surface / delegation: `this.foodTrucksRepository.updateProfileSettings(foodTruckId, { ...dto, ...(normalizedHandle !== undefined ? { handle: normalizedHandle } : {}), })`.

Repository references: [FoodTrucksRepository.findVendorForActor](../../christinacormie-backend/src/modules/food-trucks/food-trucks.repository.ts#L40); [FoodTrucksRepository.findVendorByUserId](../../christinacormie-backend/src/modules/food-trucks/food-trucks.repository.ts#L29); [FoodTrucksRepository.findById](../../christinacormie-backend/src/modules/food-trucks/food-trucks.repository.ts#L63); [FoodTrucksRepository.foodTruckInclude](../../christinacormie-backend/src/modules/food-trucks/food-trucks.repository.ts#L944); [FoodTrucksRepository.findByHandle](../../christinacormie-backend/src/modules/food-trucks/food-trucks.repository.ts#L70); [FoodTrucksRepository.updateProfileSettings](../../christinacormie-backend/src/modules/food-trucks/food-trucks.repository.ts#L199).

Success HTTP status: 200 (Nest default unless overridden). Service path exceptions: `new BadRequestException( 'This food truck handle is already taken', )`; `new BadRequestException('At least one cuisine is required')`; `new BadRequestException( 'Each cuisine needs either cuisineId or name', )`; `new NotFoundException('Food truck not found')`; `new ForbiddenException('Food truck does not belong to this vendor')`; `new ForbiddenException('Vendor profile is required')`.

<a id="endpoint-post-food-trucks-by-id-menus-basic"></a>

### POST /api/v1/food-trucks/:id/menus/basic

UI groups: V20. Source status: IMPLEMENTED.

Controller: [FoodTrucksController.setupBasicMenu](../../christinacormie-backend/src/modules/food-trucks/food-trucks.controller.ts#L673).

Auth: Bearer access JWT required; roles VENDOR. Current decorators: `UseGuards(JwtAuthGuard, RolesGuard)`; `Roles(UserRole.VENDOR)`.

Request parameters: `@CurrentUser() user: AuthenticatedUser`; `@Param('id') foodTruckId: string`; `@Body() dto: SetupBasicMenuDto`.

Inventory field index: `pathParams.id required: string - URL path parameter id`; `body.name required: string`; `body.description optional: string`; `body.imageUrl optional: string`; `body.price required: number`; `body.isVegetarian optional: boolean`; `body.isVegan optional: boolean`; `body.isGlutenFree optional: boolean`; `body.sortOrder optional: number`; `body.items required: BasicMenuItemDto[]`; `body.isActive optional: boolean`; `body.categories required: BasicMenuCategoryDto[]`.

Response implementation: [FoodTrucksService.setupBasicMenu](../../christinacormie-backend/src/modules/food-trucks/food-trucks.service.ts#L219).

Response surface / delegation: `this.foodTrucksRepository.setupBasicMenu(foodTruckId, dto)`.

Repository references: [FoodTrucksRepository.findVendorForActor](../../christinacormie-backend/src/modules/food-trucks/food-trucks.repository.ts#L40); [FoodTrucksRepository.findVendorByUserId](../../christinacormie-backend/src/modules/food-trucks/food-trucks.repository.ts#L29); [FoodTrucksRepository.findById](../../christinacormie-backend/src/modules/food-trucks/food-trucks.repository.ts#L63); [FoodTrucksRepository.foodTruckInclude](../../christinacormie-backend/src/modules/food-trucks/food-trucks.repository.ts#L944); [FoodTrucksRepository.setupBasicMenu](../../christinacormie-backend/src/modules/food-trucks/food-trucks.repository.ts#L378).

Success HTTP status: 201 (Nest default unless overridden). Service path exceptions: `new BadRequestException('At least one menu category is required')`; `new BadRequestException( 'Each menu category needs at least one item', )`; `new NotFoundException('Food truck not found')`; `new ForbiddenException('Food truck does not belong to this vendor')`; `new ForbiddenException('Vendor profile is required')`.

<a id="endpoint-post-food-trucks-by-id-menus-by-menuId-categories"></a>

### POST /api/v1/food-trucks/:id/menus/:menuId/categories

UI groups: V20. Source status: IMPLEMENTED.

Controller: [FoodTrucksController.createMenuCategory](../../christinacormie-backend/src/modules/food-trucks/food-trucks.controller.ts#L724).

Auth: Bearer access JWT required; roles VENDOR. Current decorators: `UseGuards(JwtAuthGuard, RolesGuard)`; `Roles(UserRole.VENDOR)`.

Request parameters: `@CurrentUser() user: AuthenticatedUser`; `@Param('id') foodTruckId: string`; `@Param('menuId') menuId: string`; `@Body() dto: CreateMenuCategoryDto`.

Inventory field index: `pathParams.id required: string - URL path parameter id`; `pathParams.menuId required: string - URL path parameter menuId`; `body.name required: string`; `body.description optional: string`; `body.sortOrder optional: number`.

Response implementation: [FoodTrucksService.createMenuCategory](../../christinacormie-backend/src/modules/food-trucks/food-trucks.service.ts#L329).

Response surface / delegation: `this.foodTrucksRepository.createMenuCategory(menuId, dto)`.

Repository references: [FoodTrucksRepository.findVendorForActor](../../christinacormie-backend/src/modules/food-trucks/food-trucks.repository.ts#L40); [FoodTrucksRepository.findVendorByUserId](../../christinacormie-backend/src/modules/food-trucks/food-trucks.repository.ts#L29); [FoodTrucksRepository.findById](../../christinacormie-backend/src/modules/food-trucks/food-trucks.repository.ts#L63); [FoodTrucksRepository.foodTruckInclude](../../christinacormie-backend/src/modules/food-trucks/food-trucks.repository.ts#L944); [FoodTrucksRepository.findMenuById](../../christinacormie-backend/src/modules/food-trucks/food-trucks.repository.ts#L517); [FoodTrucksRepository.createMenuCategory](../../christinacormie-backend/src/modules/food-trucks/food-trucks.repository.ts#L523).

Success HTTP status: 201 (Nest default unless overridden). Service path exceptions: `new NotFoundException('Menu not found')`; `new ForbiddenException('Menu does not belong to this food truck')`; `new NotFoundException('Food truck not found')`; `new ForbiddenException('Food truck does not belong to this vendor')`; `new ForbiddenException('Vendor profile is required')`.

<a id="endpoint-post-food-trucks-by-id-menu-categories-by-categoryId-items"></a>

### POST /api/v1/food-trucks/:id/menu-categories/:categoryId/items

UI groups: V20. Source status: IMPLEMENTED.

Controller: [FoodTrucksController.createMenuItem](../../christinacormie-backend/src/modules/food-trucks/food-trucks.controller.ts#L838).

Auth: Bearer access JWT required; roles VENDOR. Current decorators: `UseGuards(JwtAuthGuard, RolesGuard)`; `Roles(UserRole.VENDOR)`.

Request parameters: `@CurrentUser() user: AuthenticatedUser`; `@Param('id') foodTruckId: string`; `@Param('categoryId') categoryId: string`; `@Body() dto: CreateMenuItemDto`.

Inventory field index: `pathParams.id required: string - URL path parameter id`; `pathParams.categoryId required: string - URL path parameter categoryId`; `body.name required: string`; `body.description optional: string`; `body.imageUrl optional: string`; `body.price required: number`; `body.isVegetarian optional: boolean`; `body.isVegan optional: boolean`; `body.isGlutenFree optional: boolean`; `body.sortOrder optional: number`.

Response implementation: [FoodTrucksService.createMenuItem](../../christinacormie-backend/src/modules/food-trucks/food-trucks.service.ts#L349).

Response surface / delegation: `this.foodTrucksRepository.createMenuItem(categoryId, dto)`.

Repository references: [FoodTrucksRepository.findVendorForActor](../../christinacormie-backend/src/modules/food-trucks/food-trucks.repository.ts#L40); [FoodTrucksRepository.findVendorByUserId](../../christinacormie-backend/src/modules/food-trucks/food-trucks.repository.ts#L29); [FoodTrucksRepository.findById](../../christinacormie-backend/src/modules/food-trucks/food-trucks.repository.ts#L63); [FoodTrucksRepository.foodTruckInclude](../../christinacormie-backend/src/modules/food-trucks/food-trucks.repository.ts#L944); [FoodTrucksRepository.findMenuCategoryById](../../christinacormie-backend/src/modules/food-trucks/food-trucks.repository.ts#L537); [FoodTrucksRepository.createMenuItem](../../christinacormie-backend/src/modules/food-trucks/food-trucks.repository.ts#L556).

Success HTTP status: 201 (Nest default unless overridden). Service path exceptions: `new NotFoundException('Menu category not found')`; `new ForbiddenException( 'Menu category does not belong to this food truck', )`; `new NotFoundException('Food truck not found')`; `new ForbiddenException('Food truck does not belong to this vendor')`; `new ForbiddenException('Vendor profile is required')`.

<a id="endpoint-patch-food-trucks-by-id-menu-items-by-itemId"></a>

### PATCH /api/v1/food-trucks/:id/menu-items/:itemId

UI groups: V20. Source status: IMPLEMENTED.

Controller: [FoodTrucksController.updateMenuItem](../../christinacormie-backend/src/modules/food-trucks/food-trucks.controller.ts#L896).

Auth: Bearer access JWT required; roles VENDOR. Current decorators: `UseGuards(JwtAuthGuard, RolesGuard)`; `Roles(UserRole.VENDOR)`.

Request parameters: `@CurrentUser() user: AuthenticatedUser`; `@Param('id') foodTruckId: string`; `@Param('itemId') itemId: string`; `@Body() dto: UpdateMenuItemDto`.

Inventory field index: `pathParams.id required: string - URL path parameter id`; `pathParams.itemId required: string - URL path parameter itemId`; `body.status optional: MenuItemStatusDto`.

Response implementation: [FoodTrucksService.updateMenuItem](../../christinacormie-backend/src/modules/food-trucks/food-trucks.service.ts#L359).

Response surface / delegation: `this.foodTrucksRepository.updateMenuItem(itemId, dto)`.

Repository references: [FoodTrucksRepository.findVendorForActor](../../christinacormie-backend/src/modules/food-trucks/food-trucks.repository.ts#L40); [FoodTrucksRepository.findVendorByUserId](../../christinacormie-backend/src/modules/food-trucks/food-trucks.repository.ts#L29); [FoodTrucksRepository.findById](../../christinacormie-backend/src/modules/food-trucks/food-trucks.repository.ts#L63); [FoodTrucksRepository.foodTruckInclude](../../christinacormie-backend/src/modules/food-trucks/food-trucks.repository.ts#L944); [FoodTrucksRepository.findMenuItemById](../../christinacormie-backend/src/modules/food-trucks/food-trucks.repository.ts#L572); [FoodTrucksRepository.updateMenuItem](../../christinacormie-backend/src/modules/food-trucks/food-trucks.repository.ts#L585).

Success HTTP status: 200 (Nest default unless overridden). Service path exceptions: `new NotFoundException('Menu item not found')`; `new ForbiddenException( 'Menu item does not belong to this food truck', )`; `new NotFoundException('Food truck not found')`; `new ForbiddenException('Food truck does not belong to this vendor')`; `new ForbiddenException('Vendor profile is required')`.

<a id="endpoint-patch-food-trucks-by-id-operating-status"></a>

### PATCH /api/v1/food-trucks/:id/operating-status

UI groups: V06. Source status: IMPLEMENTED.

Controller: [FoodTrucksController.updateOperatingStatus](../../christinacormie-backend/src/modules/food-trucks/food-trucks.controller.ts#L1074).

Auth: Bearer access JWT required; roles VENDOR. Current decorators: `UseGuards(JwtAuthGuard, RolesGuard)`; `Roles(UserRole.VENDOR)`.

Request parameters: `@CurrentUser() user: AuthenticatedUser`; `@Param('id') foodTruckId: string`; `@Body() dto: UpdateOperatingStatusDto`.

Inventory field index: `pathParams.id required: string - URL path parameter id`; `body.operatingStatus required: OperatingStatusDto`.

Response implementation: [FoodTrucksService.updateOperatingStatus](../../christinacormie-backend/src/modules/food-trucks/food-trucks.service.ts#L259).

Response surface / delegation: `this.foodTrucksRepository.updateOperatingStatus(foodTruckId, dto)`.

Repository references: [FoodTrucksRepository.findVendorForActor](../../christinacormie-backend/src/modules/food-trucks/food-trucks.repository.ts#L40); [FoodTrucksRepository.findVendorByUserId](../../christinacormie-backend/src/modules/food-trucks/food-trucks.repository.ts#L29); [FoodTrucksRepository.findById](../../christinacormie-backend/src/modules/food-trucks/food-trucks.repository.ts#L63); [FoodTrucksRepository.foodTruckInclude](../../christinacormie-backend/src/modules/food-trucks/food-trucks.repository.ts#L944); [FoodTrucksRepository.updateOperatingStatus](../../christinacormie-backend/src/modules/food-trucks/food-trucks.repository.ts#L476).

Success HTTP status: 200 (Nest default unless overridden). Service path exceptions: `new NotFoundException('Food truck not found')`; `new ForbiddenException('Food truck does not belong to this vendor')`; `new ForbiddenException('Vendor profile is required')`; `new ForbiddenException(this.vendorApprovalMessage)`.

<a id="endpoint-patch-food-trucks-by-id-location"></a>

### PATCH /api/v1/food-trucks/:id/location

UI groups: V06. Source status: IMPLEMENTED.

Controller: [FoodTrucksController.updateLocation](../../christinacormie-backend/src/modules/food-trucks/food-trucks.controller.ts#L1125).

Auth: Bearer access JWT required; roles VENDOR. Current decorators: `UseGuards(JwtAuthGuard, RolesGuard)`; `Roles(UserRole.VENDOR)`.

Request parameters: `@CurrentUser() user: AuthenticatedUser`; `@Param('id') foodTruckId: string`; `@Body() dto: UpdateTruckLocationDto`.

Inventory field index: `pathParams.id required: string - URL path parameter id`; `body.latitude required: number`; `body.longitude required: number`; `body.address optional: string`; `body.validForMinutes optional: number - Duration in minutes location is valid for (e.g. 240 = 4 hours)`.

Response implementation: [FoodTrucksService.updateLocation](../../christinacormie-backend/src/modules/food-trucks/food-trucks.service.ts#L269).

Response surface / delegation: `this.foodTrucksRepository.updateLocation(foodTruckId, dto)`.

Repository references: [FoodTrucksRepository.findVendorForActor](../../christinacormie-backend/src/modules/food-trucks/food-trucks.repository.ts#L40); [FoodTrucksRepository.findVendorByUserId](../../christinacormie-backend/src/modules/food-trucks/food-trucks.repository.ts#L29); [FoodTrucksRepository.findById](../../christinacormie-backend/src/modules/food-trucks/food-trucks.repository.ts#L63); [FoodTrucksRepository.foodTruckInclude](../../christinacormie-backend/src/modules/food-trucks/food-trucks.repository.ts#L944); [FoodTrucksRepository.updateLocation](../../christinacormie-backend/src/modules/food-trucks/food-trucks.repository.ts#L680).

Success HTTP status: 200 (Nest default unless overridden). Service path exceptions: `new NotFoundException('Food truck not found')`; `new ForbiddenException('Food truck does not belong to this vendor')`; `new ForbiddenException('Vendor profile is required')`; `new ForbiddenException(this.vendorApprovalMessage)`.

<a id="endpoint-post-food-trucks-by-id-drops"></a>

### POST /api/v1/food-trucks/:id/drops

UI groups: V07. Source status: IMPLEMENTED.

Controller: [FoodTrucksController.createActiveDrop](../../christinacormie-backend/src/modules/food-trucks/food-trucks.controller.ts#L1176).

Auth: Bearer access JWT required; roles VENDOR. Current decorators: `UseGuards(JwtAuthGuard, RolesGuard)`; `Roles(UserRole.VENDOR)`.

Request parameters: `@CurrentUser() user: AuthenticatedUser`; `@Param('id') foodTruckId: string`; `@Body() dto: CreateFoodTruckDropDto`.

Inventory field index: `pathParams.id required: string - URL path parameter id`; `body.latitude required: number`; `body.longitude required: number`; `body.title optional: string`; `body.message optional: string`; `body.address optional: string`; `body.durationMinutes optional: number`.

Response implementation: [FoodTrucksService.createActiveDrop](../../christinacormie-backend/src/modules/food-trucks/food-trucks.service.ts#L279).

Response surface / delegation: `this.foodTrucksRepository.createActiveDrop(foodTruckId, dto)`.

Repository references: [FoodTrucksRepository.findVendorForActor](../../christinacormie-backend/src/modules/food-trucks/food-trucks.repository.ts#L40); [FoodTrucksRepository.findVendorByUserId](../../christinacormie-backend/src/modules/food-trucks/food-trucks.repository.ts#L29); [FoodTrucksRepository.findById](../../christinacormie-backend/src/modules/food-trucks/food-trucks.repository.ts#L63); [FoodTrucksRepository.foodTruckInclude](../../christinacormie-backend/src/modules/food-trucks/food-trucks.repository.ts#L944); [FoodTrucksRepository.createActiveDrop](../../christinacormie-backend/src/modules/food-trucks/food-trucks.repository.ts#L708).

Success HTTP status: 201 (Nest default unless overridden). Service path exceptions: `new NotFoundException('Food truck not found')`; `new ForbiddenException('Food truck does not belong to this vendor')`; `new ForbiddenException('Vendor profile is required')`; `new ForbiddenException(this.vendorApprovalMessage)`.

<a id="endpoint-post-food-trucks-by-id-images"></a>

### POST /api/v1/food-trucks/:id/images

UI groups: V19. Source status: IMPLEMENTED.

Controller: [FoodTrucksController.addImage](../../christinacormie-backend/src/modules/food-trucks/food-trucks.controller.ts#L1221).

Auth: Bearer access JWT required; roles VENDOR. Current decorators: `UseGuards(JwtAuthGuard, RolesGuard)`; `Roles(UserRole.VENDOR)`.

Request parameters: `@CurrentUser() user: AuthenticatedUser`; `@Param('id') foodTruckId: string`; `@Body() dto: AddTruckImageDto`.

Inventory field index: `pathParams.id required: string - URL path parameter id`; `body.imageUrl required: string`; `body.altText optional: string`; `body.sortOrder optional: number`.

Response implementation: [FoodTrucksService.addImage](../../christinacormie-backend/src/modules/food-trucks/food-trucks.service.ts#L289).

Response surface / delegation: `this.foodTrucksRepository.addImage(foodTruckId, dto)`.

Repository references: [FoodTrucksRepository.findVendorForActor](../../christinacormie-backend/src/modules/food-trucks/food-trucks.repository.ts#L40); [FoodTrucksRepository.findVendorByUserId](../../christinacormie-backend/src/modules/food-trucks/food-trucks.repository.ts#L29); [FoodTrucksRepository.findById](../../christinacormie-backend/src/modules/food-trucks/food-trucks.repository.ts#L63); [FoodTrucksRepository.foodTruckInclude](../../christinacormie-backend/src/modules/food-trucks/food-trucks.repository.ts#L944); [FoodTrucksRepository.addImage](../../christinacormie-backend/src/modules/food-trucks/food-trucks.repository.ts#L487).

Success HTTP status: 201 (Nest default unless overridden). Service path exceptions: `new NotFoundException('Food truck not found')`; `new ForbiddenException('Food truck does not belong to this vendor')`; `new ForbiddenException('Vendor profile is required')`.

<a id="endpoint-patch-food-trucks-by-id-images-by-imageId"></a>

### PATCH /api/v1/food-trucks/:id/images/:imageId

UI groups: V19. Source status: IMPLEMENTED.

Controller: [FoodTrucksController.updateImage](../../christinacormie-backend/src/modules/food-trucks/food-trucks.controller.ts#L1271).

Auth: Bearer access JWT required; roles VENDOR. Current decorators: `UseGuards(JwtAuthGuard, RolesGuard)`; `Roles(UserRole.VENDOR)`.

Request parameters: `@CurrentUser() user: AuthenticatedUser`; `@Param('id') foodTruckId: string`; `@Param('imageId') imageId: string`; `@Body() dto: UpdateTruckImageDto`.

Inventory field index: `pathParams.id required: string - URL path parameter id`; `pathParams.imageId required: string - URL path parameter imageId`.

Response implementation: [FoodTrucksService.updateImage](../../christinacormie-backend/src/modules/food-trucks/food-trucks.service.ts#L294).

Response surface / delegation: `this.foodTrucksRepository.updateImage(imageId, dto)`.

Repository references: [FoodTrucksRepository.findVendorForActor](../../christinacormie-backend/src/modules/food-trucks/food-trucks.repository.ts#L40); [FoodTrucksRepository.findVendorByUserId](../../christinacormie-backend/src/modules/food-trucks/food-trucks.repository.ts#L29); [FoodTrucksRepository.findById](../../christinacormie-backend/src/modules/food-trucks/food-trucks.repository.ts#L63); [FoodTrucksRepository.foodTruckInclude](../../christinacormie-backend/src/modules/food-trucks/food-trucks.repository.ts#L944); [FoodTrucksRepository.findImageById](../../christinacormie-backend/src/modules/food-trucks/food-trucks.repository.ts#L498); [FoodTrucksRepository.updateImage](../../christinacormie-backend/src/modules/food-trucks/food-trucks.repository.ts#L504).

Success HTTP status: 200 (Nest default unless overridden). Service path exceptions: `new NotFoundException('Food truck image not found')`; `new ForbiddenException('Image does not belong to this food truck')`; `new NotFoundException('Food truck not found')`; `new ForbiddenException('Food truck does not belong to this vendor')`; `new ForbiddenException('Vendor profile is required')`.

<a id="endpoint-delete-food-trucks-by-id-images-by-imageId"></a>

### DELETE /api/v1/food-trucks/:id/images/:imageId

UI groups: V19. Source status: IMPLEMENTED.

Controller: [FoodTrucksController.removeImage](../../christinacormie-backend/src/modules/food-trucks/food-trucks.controller.ts#L1329).

Auth: Bearer access JWT required; roles VENDOR. Current decorators: `UseGuards(JwtAuthGuard, RolesGuard)`; `Roles(UserRole.VENDOR)`.

Request parameters: `@CurrentUser() user: AuthenticatedUser`; `@Param('id') foodTruckId: string`; `@Param('imageId') imageId: string`.

Inventory field index: `pathParams.id required: string - URL path parameter id`; `pathParams.imageId required: string - URL path parameter imageId`.

Response implementation: [FoodTrucksService.removeImage](../../christinacormie-backend/src/modules/food-trucks/food-trucks.service.ts#L314).

Response surface / delegation: `this.foodTrucksRepository.removeImage(imageId)`.

Repository references: [FoodTrucksRepository.findVendorForActor](../../christinacormie-backend/src/modules/food-trucks/food-trucks.repository.ts#L40); [FoodTrucksRepository.findVendorByUserId](../../christinacormie-backend/src/modules/food-trucks/food-trucks.repository.ts#L29); [FoodTrucksRepository.findById](../../christinacormie-backend/src/modules/food-trucks/food-trucks.repository.ts#L63); [FoodTrucksRepository.foodTruckInclude](../../christinacormie-backend/src/modules/food-trucks/food-trucks.repository.ts#L944); [FoodTrucksRepository.findImageById](../../christinacormie-backend/src/modules/food-trucks/food-trucks.repository.ts#L498); [FoodTrucksRepository.removeImage](../../christinacormie-backend/src/modules/food-trucks/food-trucks.repository.ts#L511).

Success HTTP status: 200 (Nest default unless overridden). Service path exceptions: `new NotFoundException('Food truck image not found')`; `new ForbiddenException('Image does not belong to this food truck')`; `new NotFoundException('Food truck not found')`; `new ForbiddenException('Food truck does not belong to this vendor')`; `new ForbiddenException('Vendor profile is required')`.

<a id="endpoint-get-leaderboards-top-rated"></a>

### GET /api/v1/leaderboards/top-rated

UI groups: C22, V26. Source status: IMPLEMENTED.

Controller: [LeaderboardsController.getTopRated](../../christinacormie-backend/src/modules/leaderboards/leaderboards.controller.ts#L126).

Auth: No mandatory JWT in inventory; check current decorators; roles no explicit role restriction; ownership/state rules still apply. Current decorators: none.

Request parameters: `@Query() query: LeaderboardQueryDto`.

Inventory field index: `queryParams.marketId optional: string`; `queryParams.period optional: LeaderboardPeriodDto`; `queryParams.limit optional: number`; `queryParams.offset optional: number`.

Response implementation: [LeaderboardsService.getLeaderboardByType](../../christinacormie-backend/src/modules/leaderboards/leaderboards.service.ts#L70).

Response surface / delegation: `this.prioritizeCreditAcceptedEntries(leaderboard, query)`.

Repository references: [LeaderboardsRepository.findLeaderboardByType](../../christinacormie-backend/src/modules/leaderboards/leaderboards.repository.ts#L118); [LeaderboardsRepository.marketSelect](../../christinacormie-backend/src/modules/leaderboards/leaderboards.repository.ts#L261); [LeaderboardsRepository.foodTruckBasicSelect](../../christinacormie-backend/src/modules/leaderboards/leaderboards.repository.ts#L274).

Success HTTP status: 200 (Nest default unless overridden). Service path exceptions: ``new NotFoundException(`Leaderboard for type '${type}' not found`)``.

<a id="endpoint-get-leaderboards-most-booked"></a>

### GET /api/v1/leaderboards/most-booked

UI groups: C22, V26. Source status: IMPLEMENTED.

Controller: [LeaderboardsController.getMostBooked](../../christinacormie-backend/src/modules/leaderboards/leaderboards.controller.ts#L159).

Auth: No mandatory JWT in inventory; check current decorators; roles no explicit role restriction; ownership/state rules still apply. Current decorators: none.

Request parameters: `@Query() query: LeaderboardQueryDto`.

Inventory field index: `queryParams.marketId optional: string`; `queryParams.period optional: LeaderboardPeriodDto`; `queryParams.limit optional: number`; `queryParams.offset optional: number`.

Response implementation: [LeaderboardsService.getLeaderboardByType](../../christinacormie-backend/src/modules/leaderboards/leaderboards.service.ts#L70).

Response surface / delegation: `this.prioritizeCreditAcceptedEntries(leaderboard, query)`.

Repository references: [LeaderboardsRepository.findLeaderboardByType](../../christinacormie-backend/src/modules/leaderboards/leaderboards.repository.ts#L118); [LeaderboardsRepository.marketSelect](../../christinacormie-backend/src/modules/leaderboards/leaderboards.repository.ts#L261); [LeaderboardsRepository.foodTruckBasicSelect](../../christinacormie-backend/src/modules/leaderboards/leaderboards.repository.ts#L274).

Success HTTP status: 200 (Nest default unless overridden). Service path exceptions: ``new NotFoundException(`Leaderboard for type '${type}' not found`)``.

<a id="endpoint-get-leaderboards-foodie-points"></a>

### GET /api/v1/leaderboards/foodie-points

UI groups: C22, V26. Source status: IMPLEMENTED.

Controller: [LeaderboardsController.getFoodiePoints](../../christinacormie-backend/src/modules/leaderboards/leaderboards.controller.ts#L195).

Auth: No mandatory JWT in inventory; check current decorators; roles no explicit role restriction; ownership/state rules still apply. Current decorators: none.

Request parameters: `@Query() query: FoodiePointsQueryDto`.

Inventory field index: `queryParams.limit required: number`; `queryParams.offset required: number`; `queryParams.rank required: number`; `queryParams.userId required: string`; `queryParams.displayName required: string`; `queryParams.avatarUrl required: string &#124; null`; `queryParams.points required: number - Lifetime loyalty points earned by the Foodie.`; `queryParams.items required: FoodiePointsEntryDto[]`; `queryParams.total required: number`; `queryParams.nextOffset required: number &#124; null`.

Response implementation: [LeaderboardsService.getFoodiePoints](../../christinacormie-backend/src/modules/leaderboards/leaderboards.service.ts#L12).

Response surface / delegation: `{ items, total, limit, offset, nextOffset }`.

Repository references: [LeaderboardsRepository.findFoodiePoints](../../christinacormie-backend/src/modules/leaderboards/leaderboards.repository.ts#L9).

Success HTTP status: 200 (Nest default unless overridden). Service path exceptions: none explicitly extracted; common failures still apply.

<a id="endpoint-get-messaging-conversations"></a>

### GET /api/v1/messaging/conversations

UI groups: M01. Source status: IMPLEMENTED.

Controller: [MessagingController.listConversations](../../christinacormie-backend/src/modules/messaging/messaging.controller.ts#L94).

Auth: Bearer access JWT required; roles no explicit role restriction; ownership/state rules still apply. Current decorators: `UseGuards(JwtAuthGuard)`.

Request parameters: `@CurrentUser() user: AuthenticatedUser`; `@Query() query: MessagingPaginationDto`.

Inventory field index: `queryParams.limit optional: number`; `queryParams.offset optional: number`.

Response implementation: [MessagingService.listConversations](../../christinacormie-backend/src/modules/messaging/messaging.service.ts#L33).

Response surface / delegation: `{ message, items, total, nextOffset }`.

Success HTTP status: 200 (Nest default unless overridden). Service path exceptions: none explicitly extracted; common failures still apply.

<a id="endpoint-get-messaging-recipients"></a>

### GET /api/v1/messaging/recipients

UI groups: M01. Source status: IMPLEMENTED.

Controller: [MessagingController.searchRecipients](../../christinacormie-backend/src/modules/messaging/messaging.controller.ts#L126).

Auth: Bearer access JWT required; roles no explicit role restriction; ownership/state rules still apply. Current decorators: `UseGuards(JwtAuthGuard)`.

Request parameters: `@CurrentUser() user: AuthenticatedUser`; `@Query() query: RecipientSearchDto`.

Inventory field index: `queryParams.search optional: string`; `queryParams.type optional: RecipientAccountType`; `queryParams.limit optional: number`; `queryParams.offset optional: number`.

Response implementation: [MessagingService.searchRecipients](../../christinacormie-backend/src/modules/messaging/messaging.service.ts#L76).

Response surface / delegation: `{ items, total, nextOffset }`.

Success HTTP status: 200 (Nest default unless overridden). Service path exceptions: none explicitly extracted; common failures still apply.

<a id="endpoint-get-messaging-requests"></a>

### GET /api/v1/messaging/requests

UI groups: M01. Source status: IMPLEMENTED.

Controller: [MessagingController.listMessageRequests](../../christinacormie-backend/src/modules/messaging/messaging.controller.ts#L134).

Auth: Bearer access JWT required; roles no explicit role restriction; ownership/state rules still apply. Current decorators: `UseGuards(JwtAuthGuard)`.

Request parameters: `@CurrentUser() user: AuthenticatedUser`; `@Query() query: MessagingPaginationDto`.

Inventory field index: `queryParams.limit optional: number`; `queryParams.offset optional: number`.

Response implementation: [MessagingService.listMessageRequests](../../christinacormie-backend/src/modules/messaging/messaging.service.ts#L147).

Response surface / delegation: `{ items, total, nextOffset }`.

Success HTTP status: 200 (Nest default unless overridden). Service path exceptions: none explicitly extracted; common failures still apply.

<a id="endpoint-post-messaging-conversations-direct"></a>

### POST /api/v1/messaging/conversations/direct

UI groups: C07, M01, V14. Source status: IMPLEMENTED.

Controller: [MessagingController.createDirectConversation](../../christinacormie-backend/src/modules/messaging/messaging.controller.ts#L142).

Auth: Bearer access JWT required; roles no explicit role restriction; ownership/state rules still apply. Current decorators: `UseGuards(JwtAuthGuard)`.

Request parameters: `@CurrentUser() user: AuthenticatedUser`; `@Body() dto: CreateDirectConversationDto`.

Inventory field index: `body.participantUserId optional: string - User ID to start a direct chat with. Use this when the frontend already knows the recipient user.`; `body.vendorId optional: string - Vendor ID. Backend will resolve the vendor owner user as the chat recipient.`; `body.foodTruckId optional: string - Food truck ID. Backend will resolve the truck vendor owner user as the chat recipient.`; `body.title optional: string`.

Response implementation: [MessagingService.createDirectConversation](../../christinacormie-backend/src/modules/messaging/messaging.service.ts#L193).

Response surface / delegation: `{ message, conversation }`.

Success HTTP status: 201 (Nest default unless overridden). Service path exceptions: `new BadRequestException( 'You cannot start a conversation with yourself', )`; `new BadRequestException( 'Provide exactly one of participantUserId, vendorId, or foodTruckId', )`; `new NotFoundException('Vendor not found')`; `new NotFoundException('Food truck not found')`; `new NotFoundException(notFoundMessage)`; `new ForbiddenException('User account cannot use messaging')`.

<a id="endpoint-patch-messaging-conversations-by-conversationId-accept"></a>

### PATCH /api/v1/messaging/conversations/:conversationId/accept

UI groups: M01. Source status: IMPLEMENTED.

Controller: [MessagingController.acceptConversation](../../christinacormie-backend/src/modules/messaging/messaging.controller.ts#L199).

Auth: Bearer access JWT required; roles no explicit role restriction; ownership/state rules still apply. Current decorators: `UseGuards(JwtAuthGuard)`.

Request parameters: `@CurrentUser() user: AuthenticatedUser`; `@Param('conversationId', ParseUUIDPipe) conversationId: string`.

Inventory field index: `pathParams.conversationId required: string - URL path parameter conversationId`.

Response implementation: [MessagingService.resolveMessageRequest](../../christinacormie-backend/src/modules/messaging/messaging.service.ts#L252).

Response surface / delegation: `{ conversationId, status }`.

Success HTTP status: 200 (Nest default unless overridden). Service path exceptions: `new NotFoundException('Message request not found')`.

<a id="endpoint-patch-messaging-conversations-by-conversationId-decline"></a>

### PATCH /api/v1/messaging/conversations/:conversationId/decline

UI groups: M01. Source status: IMPLEMENTED.

Controller: [MessagingController.declineConversation](../../christinacormie-backend/src/modules/messaging/messaging.controller.ts#L211).

Auth: Bearer access JWT required; roles no explicit role restriction; ownership/state rules still apply. Current decorators: `UseGuards(JwtAuthGuard)`.

Request parameters: `@CurrentUser() user: AuthenticatedUser`; `@Param('conversationId', ParseUUIDPipe) conversationId: string`.

Inventory field index: `pathParams.conversationId required: string - URL path parameter conversationId`.

Response implementation: [MessagingService.resolveMessageRequest](../../christinacormie-backend/src/modules/messaging/messaging.service.ts#L252).

Response surface / delegation: `{ conversationId, status }`.

Success HTTP status: 200 (Nest default unless overridden). Service path exceptions: `new NotFoundException('Message request not found')`.

<a id="endpoint-get-messaging-conversations-by-conversationId"></a>

### GET /api/v1/messaging/conversations/:conversationId

UI groups: M02. Source status: IMPLEMENTED.

Controller: [MessagingController.getConversation](../../christinacormie-backend/src/modules/messaging/messaging.controller.ts#L223).

Auth: Bearer access JWT required; roles no explicit role restriction; ownership/state rules still apply. Current decorators: `UseGuards(JwtAuthGuard)`.

Request parameters: `@CurrentUser() user: AuthenticatedUser`; `@Param('conversationId', ParseUUIDPipe) conversationId: string`.

Inventory field index: `pathParams.conversationId required: string - URL path parameter conversationId`.

Response implementation: [MessagingService.getConversation](../../christinacormie-backend/src/modules/messaging/messaging.service.ts#L175).

Response surface / delegation: `{ message, conversation }`.

Success HTTP status: 200 (Nest default unless overridden). Service path exceptions: `new NotFoundException('Conversation not found')`; `new ForbiddenException('Conversation is not visible to this user')`.

<a id="endpoint-get-messaging-conversations-by-conversationId-messages"></a>

### GET /api/v1/messaging/conversations/:conversationId/messages

UI groups: M02. Source status: IMPLEMENTED.

Controller: [MessagingController.listMessages](../../christinacormie-backend/src/modules/messaging/messaging.controller.ts#L253).

Auth: Bearer access JWT required; roles no explicit role restriction; ownership/state rules still apply. Current decorators: `UseGuards(JwtAuthGuard)`.

Request parameters: `@CurrentUser() user: AuthenticatedUser`; `@Param('conversationId', ParseUUIDPipe) conversationId: string`; `@Query() query: MessagingPaginationDto`.

Inventory field index: `pathParams.conversationId required: string - URL path parameter conversationId`; `queryParams.limit optional: number`; `queryParams.offset optional: number`.

Response implementation: [MessagingService.listMessages](../../christinacormie-backend/src/modules/messaging/messaging.service.ts#L278).

Response surface / delegation: `{ message, items, total, nextOffset }`.

Success HTTP status: 200 (Nest default unless overridden). Service path exceptions: `new ForbiddenException('Conversation is not visible to this user')`.

<a id="endpoint-post-messaging-conversations-by-conversationId-messages"></a>

### POST /api/v1/messaging/conversations/:conversationId/messages

UI groups: M02, M03. Source status: IMPLEMENTED.

Controller: [MessagingController.sendMessage](../../christinacormie-backend/src/modules/messaging/messaging.controller.ts#L275).

Auth: Bearer access JWT required; roles no explicit role restriction; ownership/state rules still apply. Current decorators: `UseGuards(JwtAuthGuard)`.

Request parameters: `@CurrentUser() user: AuthenticatedUser`; `@Param('conversationId', ParseUUIDPipe) conversationId: string`; `@Body() dto: SendMessageDto`.

Inventory field index: `pathParams.conversationId required: string - URL path parameter conversationId`; `body.messageType optional: MessagingMessageTypeDto - Defaults to TEXT when omitted. SYSTEM messages are backend-only.`; `body.content optional: string - Message text. Required for TEXT messages and optional when an attachment URL is sent.`; `body.attachmentUrl optional: string`.

Response implementation: [MessagingService.sendMessage](../../christinacormie-backend/src/modules/messaging/messaging.service.ts#L309).

Response surface / delegation: `{ message, item }`.

Repository references: [NotificationsRepository.findRecentForUser](../../christinacormie-backend/src/modules/notifications/notifications.repository.ts#L84); [NotificationsRepository.create](../../christinacormie-backend/src/modules/notifications/notifications.repository.ts#L206); [NotificationsRepository.getPreferences](../../christinacormie-backend/src/modules/notifications/notifications.repository.ts#L155); [NotificationsRepository.findActiveDeviceTokens](../../christinacormie-backend/src/modules/notifications/notifications.repository.ts#L163); [NotificationsRepository.deactivateDeviceTokensByValue](../../christinacormie-backend/src/modules/notifications/notifications.repository.ts#L178).

Success HTTP status: 201 (Nest default unless overridden). Service path exceptions: `new BadRequestException('This conversation is closed')`; `new ForbiddenException('This message request was declined')`; `new ForbiddenException( 'Wait for the recipient to accept your request', )`; `new ForbiddenException( 'Attachments require an accepted conversation', )`; `new BadRequestException( 'Message content or attachmentUrl is required', )`; `new BadRequestException('Text message content is required')`.

<a id="endpoint-patch-messaging-conversations-by-conversationId-read"></a>

### PATCH /api/v1/messaging/conversations/:conversationId/read

UI groups: M02. Source status: IMPLEMENTED.

Controller: [MessagingController.markRead](../../christinacormie-backend/src/modules/messaging/messaging.controller.ts#L326).

Auth: Bearer access JWT required; roles no explicit role restriction; ownership/state rules still apply. Current decorators: `UseGuards(JwtAuthGuard)`.

Request parameters: `@CurrentUser() user: AuthenticatedUser`; `@Param('conversationId', ParseUUIDPipe) conversationId: string`.

Inventory field index: `pathParams.conversationId required: string - URL path parameter conversationId`.

Response implementation: [MessagingService.markRead](../../christinacormie-backend/src/modules/messaging/messaging.service.ts#L418).

Response surface / delegation: `{ message }`.

Success HTTP status: 200 (Nest default unless overridden). Service path exceptions: `new ForbiddenException('Conversation is not visible to this user')`.

<a id="endpoint-get-notifications"></a>

### GET /api/v1/notifications

UI groups: N01. Source status: IMPLEMENTED.

Controller: [NotificationsController.getMyNotifications](../../christinacormie-backend/src/modules/notifications/notifications.controller.ts#L28).

Auth: Bearer access JWT required; roles no explicit role restriction; ownership/state rules still apply. Current decorators: `UseGuards(JwtAuthGuard)`.

Request parameters: `@CurrentUser() user: AuthenticatedUser`; `@Query() query: NotificationQueryDto`.

Inventory field index: `queryParams.unreadOnly optional: boolean`; `queryParams.limit optional: number`; `queryParams.offset optional: number`.

Response implementation: [NotificationsService.getMyNotifications](../../christinacormie-backend/src/modules/notifications/notifications.service.ts#L38).

Response surface / delegation: `this.notificationsRepository.findForUser(userId, { unreadOnly: query.unreadOnly, limit: Math.min(query.limit ?? 20, 50), offset: query.offset ?? 0, })`.

Repository references: [NotificationsRepository.findForUser](../../christinacormie-backend/src/modules/notifications/notifications.repository.ts#L23).

Success HTTP status: 200 (Nest default unless overridden). Service path exceptions: none explicitly extracted; common failures still apply.

<a id="endpoint-get-notifications-unread-count"></a>

### GET /api/v1/notifications/unread-count

UI groups: N01. Source status: IMPLEMENTED.

Controller: [NotificationsController.getUnreadCount](../../christinacormie-backend/src/modules/notifications/notifications.controller.ts#L81).

Auth: Bearer access JWT required; roles no explicit role restriction; ownership/state rules still apply. Current decorators: `UseGuards(JwtAuthGuard)`.

Request parameters: `@CurrentUser() user: AuthenticatedUser`.

Response implementation: [NotificationsService.getUnreadCount](../../christinacormie-backend/src/modules/notifications/notifications.service.ts#L46).

Response surface / delegation: `{ unreadCount }`.

Repository references: [NotificationsRepository.countUnread](../../christinacormie-backend/src/modules/notifications/notifications.repository.ts#L72).

Success HTTP status: 200 (Nest default unless overridden). Service path exceptions: none explicitly extracted; common failures still apply.

<a id="endpoint-patch-notifications-by-notificationId-read"></a>

### PATCH /api/v1/notifications/:notificationId/read

UI groups: N01. Source status: IMPLEMENTED.

Controller: [NotificationsController.markRead](../../christinacormie-backend/src/modules/notifications/notifications.controller.ts#L87).

Auth: Bearer access JWT required; roles no explicit role restriction; ownership/state rules still apply. Current decorators: `UseGuards(JwtAuthGuard)`.

Request parameters: `@CurrentUser() user: AuthenticatedUser`; `@Param('notificationId') notificationId: string`.

Inventory field index: `pathParams.notificationId required: string - URL path parameter notificationId`.

Response implementation: [NotificationsService.markRead](../../christinacormie-backend/src/modules/notifications/notifications.service.ts#L52).

Response surface / delegation: `notification OR this.notificationsRepository.markRead(notificationId)`.

Repository references: [NotificationsRepository.findUserNotification](../../christinacormie-backend/src/modules/notifications/notifications.repository.ts#L78); [NotificationsRepository.markRead](../../christinacormie-backend/src/modules/notifications/notifications.repository.ts#L135).

Success HTTP status: 200 (Nest default unless overridden). Service path exceptions: `new NotFoundException('Notification not found')`.

<a id="endpoint-patch-notifications-read-all"></a>

### PATCH /api/v1/notifications/read-all

UI groups: N01. Source status: IMPLEMENTED.

Controller: [NotificationsController.markAllRead](../../christinacormie-backend/src/modules/notifications/notifications.controller.ts#L96).

Auth: Bearer access JWT required; roles no explicit role restriction; ownership/state rules still apply. Current decorators: `UseGuards(JwtAuthGuard)`.

Request parameters: `@CurrentUser() user: AuthenticatedUser`.

Response implementation: [NotificationsService.markAllRead](../../christinacormie-backend/src/modules/notifications/notifications.service.ts#L70).

Response surface / delegation: `{ updatedCount }`.

Repository references: [NotificationsRepository.markAllRead](../../christinacormie-backend/src/modules/notifications/notifications.repository.ts#L145).

Success HTTP status: 200 (Nest default unless overridden). Service path exceptions: none explicitly extracted; common failures still apply.

<a id="endpoint-post-payments-connect-accounts"></a>

### POST /api/v1/payments/connect/accounts

UI groups: V17. Source status: IMPLEMENTED.

Controller: [PaymentsController.createConnectAccount](../../christinacormie-backend/src/modules/payments/payments.controller.ts#L123).

Auth: Bearer access JWT required; roles VENDOR. Current decorators: `UseGuards(JwtAuthGuard, RolesGuard)`; `Roles(UserRole.VENDOR)`.

Request parameters: `@CurrentUser() user: AuthenticatedUser`; `@Body() dto: CreateConnectAccountDto`.

Inventory field index: `body.refreshUrl optional: string - Deprecated for mobile app flow. Backend uses STRIPE_CONNECT_REFRESH_URL for Stripe Connect security.`; `body.returnUrl optional: string - Deprecated for mobile app flow. Backend uses STRIPE_CONNECT_RETURN_URL for Stripe Connect security.`; `body.country optional: string`.

Response implementation: [PaymentsService.createConnectAccount](../../christinacormie-backend/src/modules/payments/payments.service.ts#L27).

Response surface / delegation: `{ paymentAccount, onboardingUrl }`.

Repository references: [PaymentsRepository.findVendorByUserId](../../christinacormie-backend/src/modules/payments/payments.repository.ts#L8); [PaymentsRepository.upsertVendorPaymentAccount](../../christinacormie-backend/src/modules/payments/payments.repository.ts#L280); [PaymentsRepository.updateVendorPaymentAccountByStripeId](../../christinacormie-backend/src/modules/payments/payments.repository.ts#L308).

Success HTTP status: 201 (Nest default unless overridden). Service path exceptions: `new BadRequestException( 'Stripe Connect refresh/return URLs are not configured', )`; `new ForbiddenException('Vendor profile is required')`; `new ForbiddenException(this.vendorApprovalMessage)`; `new BadRequestException( 'Vendor email is required before Stripe Connect onboarding can start.', )`; ``new BadRequestException( `Stripe Connect Express account could not be created. Please make sure this Stripe platform account supports Express connected accounts for ${country} vendors. Stripe message: ${message}`, )``; `new BadRequestException(this.getStripeErrorMessage(error))`.

<a id="endpoint-get-payments-connect-account"></a>

### GET /api/v1/payments/connect/account

UI groups: V17. Source status: IMPLEMENTED.

Controller: [PaymentsController.getVendorPaymentAccount](../../christinacormie-backend/src/modules/payments/payments.controller.ts#L169).

Auth: Bearer access JWT required; roles VENDOR. Current decorators: `UseGuards(JwtAuthGuard, RolesGuard)`; `Roles(UserRole.VENDOR)`.

Request parameters: `@CurrentUser() user: AuthenticatedUser`.

Response implementation: [PaymentsService.getVendorPaymentAccount](../../christinacormie-backend/src/modules/payments/payments.service.ts#L118).

Response surface / delegation: `null OR this.refreshPaymentAccountStatus(vendor.paymentAccount)`.

Repository references: [PaymentsRepository.findVendorByUserId](../../christinacormie-backend/src/modules/payments/payments.repository.ts#L8); [PaymentsRepository.updateVendorPaymentAccountByStripeId](../../christinacormie-backend/src/modules/payments/payments.repository.ts#L308).

Success HTTP status: 200 (Nest default unless overridden). Service path exceptions: `new ForbiddenException('Vendor profile is required')`; `new ForbiddenException(this.vendorApprovalMessage)`; `new BadRequestException(this.getStripeErrorMessage(error))`.

<a id="endpoint-post-payments-connect-dashboard-link"></a>

### POST /api/v1/payments/connect/dashboard-link

UI groups: V17. Source status: IMPLEMENTED.

Controller: [PaymentsController.createVendorStripeDashboardLink](../../christinacormie-backend/src/modules/payments/payments.controller.ts#L187).

Auth: Bearer access JWT required; roles VENDOR. Current decorators: `UseGuards(JwtAuthGuard, RolesGuard)`; `Roles(UserRole.VENDOR)`.

Request parameters: `@CurrentUser() user: AuthenticatedUser`.

Response implementation: [PaymentsService.createVendorStripeDashboardLink](../../christinacormie-backend/src/modules/payments/payments.service.ts#L132).

Response surface / delegation: `this.stripeClient.createLoginLink( vendor.paymentAccount.stripeAccountId, )`.

Repository references: [PaymentsRepository.findVendorByUserId](../../christinacormie-backend/src/modules/payments/payments.repository.ts#L8).

Success HTTP status: 201 (Nest default unless overridden). Service path exceptions: `new BadRequestException( 'Vendor Stripe account is not connected yet.', )`; `new ForbiddenException('Vendor profile is required')`; `new ForbiddenException(this.vendorApprovalMessage)`; `new BadRequestException(this.getStripeErrorMessage(error))`.

<a id="endpoint-get-payments-payouts-mine"></a>

### GET /api/v1/payments/payouts/mine

UI groups: V15. Source status: IMPLEMENTED.

Controller: [PaymentsController.getVendorPayouts](../../christinacormie-backend/src/modules/payments/payments.controller.ts#L206).

Auth: Bearer access JWT required; roles VENDOR. Current decorators: `UseGuards(JwtAuthGuard, RolesGuard)`; `Roles(UserRole.VENDOR)`.

Request parameters: `@CurrentUser() user: AuthenticatedUser`.

Response implementation: [PaymentsService.getVendorPayouts](../../christinacormie-backend/src/modules/payments/payments.service.ts#L127).

Response surface / delegation: `this.paymentsRepository.findVendorPayouts(vendor.id)`.

Repository references: [PaymentsRepository.findVendorByUserId](../../christinacormie-backend/src/modules/payments/payments.repository.ts#L8); [PaymentsRepository.findVendorPayouts](../../christinacormie-backend/src/modules/payments/payments.repository.ts#L28).

Success HTTP status: 200 (Nest default unless overridden). Service path exceptions: `new ForbiddenException('Vendor profile is required')`; `new ForbiddenException(this.vendorApprovalMessage)`.

<a id="endpoint-get-payments-vendor-summary"></a>

### GET /api/v1/payments/vendor/summary

UI groups: V15. Source status: IMPLEMENTED.

Controller: [PaymentsController.getVendorPaymentSummary](../../christinacormie-backend/src/modules/payments/payments.controller.ts#L219).

Auth: Bearer access JWT required; roles VENDOR. Current decorators: `UseGuards(JwtAuthGuard, RolesGuard)`; `Roles(UserRole.VENDOR)`.

Request parameters: `@CurrentUser() user: AuthenticatedUser`.

Response implementation: [PaymentsService.getVendorPaymentSummary](../../christinacormie-backend/src/modules/payments/payments.service.ts#L146).

Response surface / delegation: `this.formatMoneyObject(summary)`.

Repository references: [PaymentsRepository.findVendorByUserId](../../christinacormie-backend/src/modules/payments/payments.repository.ts#L8); [PaymentsRepository.findVendorPaymentsForSummary](../../christinacormie-backend/src/modules/payments/payments.repository.ts#L250).

Success HTTP status: 200 (Nest default unless overridden). Service path exceptions: `new ForbiddenException('Vendor profile is required')`; `new ForbiddenException(this.vendorApprovalMessage)`.

<a id="endpoint-get-payments-vendor-transactions"></a>

### GET /api/v1/payments/vendor/transactions

UI groups: V15. Source status: IMPLEMENTED.

Controller: [PaymentsController.getVendorTransactions](../../christinacormie-backend/src/modules/payments/payments.controller.ts#L231).

Auth: Bearer access JWT required; roles VENDOR. Current decorators: `UseGuards(JwtAuthGuard, RolesGuard)`; `Roles(UserRole.VENDOR)`.

Request parameters: `@CurrentUser() user: AuthenticatedUser`; `@Query() query: any`.

Response implementation: [PaymentsService.getVendorTransactions](../../christinacormie-backend/src/modules/payments/payments.service.ts#L236).

Response surface / delegation: `{ items, meta }`.

Repository references: [PaymentsRepository.findVendorByUserId](../../christinacormie-backend/src/modules/payments/payments.repository.ts#L8); [PaymentsRepository.findVendorPayments](../../christinacormie-backend/src/modules/payments/payments.repository.ts#L54); [PaymentsRepository.countVendorPayments](../../christinacormie-backend/src/modules/payments/payments.repository.ts#L120).

Success HTTP status: 200 (Nest default unless overridden). Service path exceptions: `new ForbiddenException('Vendor profile is required')`; `new ForbiddenException(this.vendorApprovalMessage)`.

<a id="endpoint-get-payments-vendor-transactions-by-paymentId"></a>

### GET /api/v1/payments/vendor/transactions/:paymentId

UI groups: V15. Source status: IMPLEMENTED.

Controller: [PaymentsController.getVendorTransaction](../../christinacormie-backend/src/modules/payments/payments.controller.ts#L246).

Auth: Bearer access JWT required; roles VENDOR. Current decorators: `UseGuards(JwtAuthGuard, RolesGuard)`; `Roles(UserRole.VENDOR)`.

Request parameters: `@CurrentUser() user: AuthenticatedUser`; `@Param('paymentId') paymentId: string`.

Inventory field index: `pathParams.paymentId required: string - URL path parameter paymentId`.

Response implementation: [PaymentsService.getVendorTransaction](../../christinacormie-backend/src/modules/payments/payments.service.ts#L274).

Response surface / delegation: `this.toVendorTransaction(payment)`.

Repository references: [PaymentsRepository.findVendorByUserId](../../christinacormie-backend/src/modules/payments/payments.repository.ts#L8); [PaymentsRepository.findVendorPaymentById](../../christinacormie-backend/src/modules/payments/payments.repository.ts#L144).

Success HTTP status: 200 (Nest default unless overridden). Service path exceptions: `new NotFoundException('Vendor transaction not found')`; `new ForbiddenException('Vendor profile is required')`; `new ForbiddenException(this.vendorApprovalMessage)`.

<a id="endpoint-get-payments-vendor-refunds"></a>

### GET /api/v1/payments/vendor/refunds

UI groups: V15. Source status: IMPLEMENTED.

Controller: [PaymentsController.getVendorRefunds](../../christinacormie-backend/src/modules/payments/payments.controller.ts#L261).

Auth: Bearer access JWT required; roles VENDOR. Current decorators: `UseGuards(JwtAuthGuard, RolesGuard)`; `Roles(UserRole.VENDOR)`.

Request parameters: `@CurrentUser() user: AuthenticatedUser`; `@Query() query: any`.

Response implementation: [PaymentsService.getVendorRefunds](../../christinacormie-backend/src/modules/payments/payments.service.ts#L288).

Response surface / delegation: `{ items, meta }`.

Repository references: [PaymentsRepository.findVendorByUserId](../../christinacormie-backend/src/modules/payments/payments.repository.ts#L8); [PaymentsRepository.findVendorRefunds](../../christinacormie-backend/src/modules/payments/payments.repository.ts#L180); [PaymentsRepository.countVendorRefunds](../../christinacormie-backend/src/modules/payments/payments.repository.ts#L224).

Success HTTP status: 200 (Nest default unless overridden). Service path exceptions: `new ForbiddenException('Vendor profile is required')`; `new ForbiddenException(this.vendorApprovalMessage)`.

<a id="endpoint-post-payments-bookings-by-bookingId-payment-intent"></a>

### POST /api/v1/payments/bookings/:bookingId/payment-intent

UI groups: C19. Source status: IMPLEMENTED.

Controller: [PaymentsController.createBookingPaymentIntent](../../christinacormie-backend/src/modules/payments/payments.controller.ts#L276).

Auth: Bearer access JWT required; roles no explicit role restriction; ownership/state rules still apply. Current decorators: `UseGuards(JwtAuthGuard)`.

Request parameters: `@CurrentUser() user: AuthenticatedUser`; `@Param('bookingId') bookingId: string`; `@Body() dto: CreateBookingPaymentDto`.

Inventory field index: `pathParams.bookingId required: string - URL path parameter bookingId`; `body.idempotencyKey required: string`; `body.currency optional: string`.

Response implementation: [PaymentsService.createBookingPaymentIntent](../../christinacormie-backend/src/modules/payments/payments.service.ts#L339).

Response surface / delegation: `{ payment, clientSecret } OR paymentResponse`.

Repository references: [PaymentsRepository.findPaymentByIdempotencyKey](../../christinacormie-backend/src/modules/payments/payments.repository.ts#L367); [PaymentsRepository.findBookingForPayment](../../christinacormie-backend/src/modules/payments/payments.repository.ts#L326); [PaymentsRepository.createPaymentRecord](../../christinacormie-backend/src/modules/payments/payments.repository.ts#L422); [PaymentsRepository.updatePaymentIntent](../../christinacormie-backend/src/modules/payments/payments.repository.ts#L446); [PaymentsRepository.markPaymentStatusById](../../christinacormie-backend/src/modules/payments/payments.repository.ts#L557); [NotificationsRepository.create](../../christinacormie-backend/src/modules/notifications/notifications.repository.ts#L206).

Success HTTP status: 201 (Nest default unless overridden). Service path exceptions: `new NotFoundException('Booking not found')`; `new ForbiddenException('Booking does not belong to this customer')`; `new BadRequestException('Booking is not ready for payment')`; `new BadRequestException('Booking is already paid')`; `new BadRequestException( 'Booking already has a payment in progress', )`; `new BadRequestException('Booking amount must be greater than zero')`.

<a id="endpoint-get-payments-by-paymentId"></a>

### GET /api/v1/payments/:paymentId

UI groups: C19. Source status: IMPLEMENTED.

Controller: [PaymentsController.getPayment](../../christinacormie-backend/src/modules/payments/payments.controller.ts#L341).

Auth: Bearer access JWT required; roles no explicit role restriction; ownership/state rules still apply. Current decorators: `UseGuards(JwtAuthGuard)`.

Request parameters: `@CurrentUser() user: AuthenticatedUser`; `@Param('paymentId') paymentId: string`.

Inventory field index: `pathParams.paymentId required: string - URL path parameter paymentId`.

Response implementation: [PaymentsService.getPayment](../../christinacormie-backend/src/modules/payments/payments.service.ts#L459).

Response surface / delegation: `payment`.

Repository references: [PaymentsRepository.findPaymentById](../../christinacormie-backend/src/modules/payments/payments.repository.ts#L349); [PaymentsRepository.findVendorByUserId](../../christinacormie-backend/src/modules/payments/payments.repository.ts#L8).

Success HTTP status: 200 (Nest default unless overridden). Service path exceptions: `new NotFoundException('Payment not found')`; `new ForbiddenException('Payment is not visible to this user')`; `new ForbiddenException(this.vendorApprovalMessage)`.

<a id="endpoint-post-promotions"></a>

### POST /api/v1/promotions

UI groups: V08. Source status: IMPLEMENTED.

Controller: [PromotionsController.createPromotion](../../christinacormie-backend/src/modules/promotions/promotions.controller.ts#L148).

Auth: Bearer access JWT required; roles VENDOR. Current decorators: `UseGuards(JwtAuthGuard, RolesGuard)`; `Roles(UserRole.VENDOR)`.

Request parameters: `@CurrentUser() user: AuthenticatedUser`; `@Body() dto: CreatePromotionDto`.

Inventory field index: `body.foodTruckId required: string`; `body.title required: string`; `body.description optional: string`; `body.type required: PromotionTypeDto`; `body.value optional: number`; `body.couponCode optional: string`; `body.minimumSpend optional: number`; `body.maximumDiscount optional: number`; `body.isFollowerOnly optional: boolean`; `body.usageLimit optional: number`; `body.startsAt required: string`; `body.endsAt required: string`; `body.isActive optional: boolean`.

Response implementation: [PromotionsService.createPromotion](../../christinacormie-backend/src/modules/promotions/promotions.service.ts#L21).

Response surface / delegation: `this.promotionsRepository.createPromotion(dto)`.

Repository references: [PromotionsRepository.findVendorByUserId](../../christinacormie-backend/src/modules/promotions/promotions.repository.ts#L12); [PromotionsRepository.findFoodTruckById](../../christinacormie-backend/src/modules/promotions/promotions.repository.ts#L19); [PromotionsRepository.createPromotion](../../christinacormie-backend/src/modules/promotions/promotions.repository.ts#L37); [PromotionsRepository.promotionInclude](../../christinacormie-backend/src/modules/promotions/promotions.repository.ts#L251).

Success HTTP status: 201 (Nest default unless overridden). Service path exceptions: `new BadRequestException( 'Percentage promotion value cannot exceed 100', )`; `new ForbiddenException('Vendor profile is required')`; `new ForbiddenException(this.vendorApprovalMessage)`; `new ForbiddenException('Food truck does not belong to this vendor')`; `new NotFoundException('Food truck not found')`; `new ForbiddenException('Food truck promotions are not available')`.

<a id="endpoint-get-promotions-food-trucks-by-foodTruckId"></a>

### GET /api/v1/promotions/food-trucks/:foodTruckId

UI groups: C04, V08. Source status: IMPLEMENTED.

Controller: [PromotionsController.listFoodTruckPromotions](../../christinacormie-backend/src/modules/promotions/promotions.controller.ts#L195).

Auth: No mandatory JWT in inventory; check current decorators; roles no explicit role restriction; ownership/state rules still apply. Current decorators: none.

Request parameters: `@Param('foodTruckId') foodTruckId: string`; `@Query() query: PromotionQueryDto`.

Inventory field index: `pathParams.foodTruckId required: string - URL path parameter foodTruckId`; `queryParams.activeOnly optional: boolean`; `queryParams.limit optional: number`.

Response implementation: [PromotionsService.listFoodTruckPromotions](../../christinacormie-backend/src/modules/promotions/promotions.service.ts#L38).

Response surface / delegation: `this.promotionsRepository.listFoodTruckPromotions(foodTruckId, dto)`.

Repository references: [PromotionsRepository.findFoodTruckById](../../christinacormie-backend/src/modules/promotions/promotions.repository.ts#L19); [PromotionsRepository.listFoodTruckPromotions](../../christinacormie-backend/src/modules/promotions/promotions.repository.ts#L116); [PromotionsRepository.promotionInclude](../../christinacormie-backend/src/modules/promotions/promotions.repository.ts#L251).

Success HTTP status: 200 (Nest default unless overridden). Service path exceptions: `new NotFoundException('Food truck not found')`; `new ForbiddenException('Food truck promotions are not available')`.

<a id="endpoint-patch-promotions-by-promotionId"></a>

### PATCH /api/v1/promotions/:promotionId

UI groups: V08. Source status: IMPLEMENTED.

Controller: [PromotionsController.updatePromotion](../../christinacormie-backend/src/modules/promotions/promotions.controller.ts#L236).

Auth: Bearer access JWT required; roles VENDOR. Current decorators: `UseGuards(JwtAuthGuard, RolesGuard)`; `Roles(UserRole.VENDOR)`.

Request parameters: `@CurrentUser() user: AuthenticatedUser`; `@Param('promotionId', ParseUUIDPipe) promotionId: string`; `@Body() dto: UpdatePromotionDto`.

Inventory field index: `pathParams.promotionId required: string - URL path parameter promotionId`.

Response implementation: [PromotionsService.updatePromotion](../../christinacormie-backend/src/modules/promotions/promotions.service.ts#L43).

Response surface / delegation: `this.promotionsRepository.updatePromotion(promotionId, dto)`.

Repository references: [PromotionsRepository.findVendorByUserId](../../christinacormie-backend/src/modules/promotions/promotions.repository.ts#L12); [PromotionsRepository.findPromotionById](../../christinacormie-backend/src/modules/promotions/promotions.repository.ts#L92); [PromotionsRepository.findFoodTruckById](../../christinacormie-backend/src/modules/promotions/promotions.repository.ts#L19); [PromotionsRepository.updatePromotion](../../christinacormie-backend/src/modules/promotions/promotions.repository.ts#L58); [PromotionsRepository.promotionInclude](../../christinacormie-backend/src/modules/promotions/promotions.repository.ts#L251).

Success HTTP status: 200 (Nest default unless overridden). Service path exceptions: `new BadRequestException( 'Percentage promotion value cannot exceed 100', )`; `new ForbiddenException('Vendor profile is required')`; `new ForbiddenException(this.vendorApprovalMessage)`; `new NotFoundException('Promotion not found')`; `new ForbiddenException('Promotion does not belong to this vendor')`; `new ForbiddenException('Food truck does not belong to this vendor')`.

<a id="endpoint-post-referrals-codes"></a>

### POST /api/v1/referrals/codes

UI groups: C30. Source status: IMPLEMENTED.

Controller: [ReferralsController.createMyCode](../../christinacormie-backend/src/modules/referrals/referrals.controller.ts#L99).

Auth: Bearer access JWT required; roles no explicit role restriction; ownership/state rules still apply. Current decorators: `UseGuards(JwtAuthGuard)`.

Request parameters: `@CurrentUser() user: AuthenticatedUser`; `@Body() dto: CreateReferralCodeDto`.

Inventory field index: `body.programType required: string`; `body.code optional: string`; `body.maximumUses optional: number`; `body.expiresAt optional: string`.

Response implementation: [ReferralsService.createMyCode](../../christinacormie-backend/src/modules/referrals/referrals.service.ts#L21).

Response surface / delegation: `await this.referralsRepository.createCode(userId, dto)`.

Repository references: [ReferralsRepository.findUserById](../../christinacormie-backend/src/modules/referrals/referrals.repository.ts#L10); [ReferralsRepository.createCode](../../christinacormie-backend/src/modules/referrals/referrals.repository.ts#L53); [ReferralsRepository.createCodeValue](../../christinacormie-backend/src/modules/referrals/referrals.repository.ts#L149).

Success HTTP status: 201 (Nest default unless overridden). Service path exceptions: `new BadRequestException('expiresAt must be in the future')`; `new ConflictException('Referral code already exists')`; `new NotFoundException('User not found')`.

<a id="endpoint-get-referrals-codes"></a>

### GET /api/v1/referrals/codes

UI groups: C30. Source status: IMPLEMENTED.

Controller: [ReferralsController.listMyCodes](../../christinacormie-backend/src/modules/referrals/referrals.controller.ts#L143).

Auth: Bearer access JWT required; roles no explicit role restriction; ownership/state rules still apply. Current decorators: `UseGuards(JwtAuthGuard)`.

Request parameters: `@CurrentUser() user: AuthenticatedUser`.

Response implementation: [ReferralsService.listMyCodes](../../christinacormie-backend/src/modules/referrals/referrals.service.ts#L39).

Response surface / delegation: `this.referralsRepository.listMyCodes(userId)`.

Repository references: [ReferralsRepository.listMyCodes](../../christinacormie-backend/src/modules/referrals/referrals.repository.ts#L39).

Success HTTP status: 200 (Nest default unless overridden). Service path exceptions: none explicitly extracted; common failures still apply.

<a id="endpoint-get-rewards-me-profile-summary"></a>

### GET /api/v1/rewards/me/profile-summary

UI groups: C25. Source status: IMPLEMENTED.

Controller: [RewardsController.getMyProfileSummary](../../christinacormie-backend/src/modules/rewards/rewards.controller.ts#L283).

Auth: Bearer access JWT required; roles no explicit role restriction; ownership/state rules still apply. Current decorators: `UseGuards(JwtAuthGuard)`.

Request parameters: `@CurrentUser() user: AuthenticatedUser`.

Response implementation: [RewardsService.getMyProfileSummary](../../christinacormie-backend/src/modules/rewards/rewards.service.ts#L95).

Response surface / delegation: `{ profile, loyalty, tiers, pointsPerAction, recentActivity, actions }`.

Repository references: [RewardsRepository.refundExpiredPendingRedemptions](../../christinacormie-backend/src/modules/rewards/rewards.repository.ts#L451); [RewardsRepository.ensureLoyaltyAccount](../../christinacormie-backend/src/modules/rewards/rewards.repository.ts#L96); [RewardsRepository.accountInclude](../../christinacormie-backend/src/modules/rewards/rewards.repository.ts#L818); [RewardsRepository.listActivePointRules](../../christinacormie-backend/src/modules/rewards/rewards.repository.ts#L142); [RewardsRepository.findCheckInsByIds](../../christinacormie-backend/src/modules/rewards/rewards.repository.ts#L524); [RewardsRepository.findReviewsByIds](../../christinacormie-backend/src/modules/rewards/rewards.repository.ts#L543).

Success HTTP status: 200 (Nest default unless overridden). Service path exceptions: none explicitly extracted; common failures still apply.

<a id="endpoint-get-rewards-rules"></a>

### GET /api/v1/rewards/rules

UI groups: C25. Source status: IMPLEMENTED.

Controller: [RewardsController.listRewardRules](../../christinacormie-backend/src/modules/rewards/rewards.controller.ts#L327).

Auth: Bearer access JWT required; roles no explicit role restriction; ownership/state rules still apply. Current decorators: `UseGuards(JwtAuthGuard)`.

Request parameters: .

Response implementation: [RewardsService.listRewardRules](../../christinacormie-backend/src/modules/rewards/rewards.service.ts#L136).

Response surface / delegation: `rewardRules.map((rule) =&gt; ({ id: rule.id, name: rule.name, description: rule.description, triggerType: rule.triggerType, rewardType: rule.rewardType, pointsRequired: rule.pointsRequired, rewardAmount: rule.rewardValue ? Number(rule.rewardValue) : null, rewardValue: rule.rewardValue ? Number(rule.rewardValue) : null, minimumPurchaseAmount: rule.mini [full expression in linked source]`.

Repository references: [RewardsRepository.listActiveRewardRules](../../christinacormie-backend/src/modules/rewards/rewards.repository.ts#L129).

Success HTTP status: 200 (Nest default unless overridden). Service path exceptions: none explicitly extracted; common failures still apply.

<a id="endpoint-get-social-places"></a>

### GET /api/v1/social/places

UI groups: C13. Source status: IMPLEMENTED.

Controller: [SocialController.listPlaces](../../christinacormie-backend/src/modules/social/social.controller.ts#L220).

Auth: No mandatory JWT in inventory; check current decorators; roles no explicit role restriction; ownership/state rules still apply. Current decorators: none.

Request parameters: `@Query() query: PlaceQueryDto`.

Inventory field index: `queryParams.search optional: string`; `queryParams.marketId optional: string`; `queryParams.limit optional: number`; `queryParams.offset optional: number`.

Response implementation: [SocialService.listPlaces](../../christinacormie-backend/src/modules/social/social.service.ts#L441).

Response surface / delegation: `this.socialRepository.listPlaces(query, includeInactive)`.

Repository references: [SocialRepository.listPlaces](../../christinacormie-backend/src/modules/social/social.repository.ts#L1156).

Success HTTP status: 200 (Nest default unless overridden). Service path exceptions: none explicitly extracted; common failures still apply.

<a id="endpoint-post-social-media-upload"></a>

### POST /api/v1/social/media/upload

UI groups: C13. Source status: IMPLEMENTED.

Controller: [SocialController.uploadPostMedia](../../christinacormie-backend/src/modules/social/social.controller.ts#L225).

Auth: Bearer access JWT required; roles no explicit role restriction; ownership/state rules still apply. Current decorators: `UseGuards(JwtAuthGuard)`.

Request parameters: `@CurrentUser() user: AuthenticatedUser`; `@UploadedFiles() files: Express.Multer.File[]`.

Inventory field index: `body.file required: binary - Multipart file upload`.

Response implementation: [SocialService.uploadPostMedia](../../christinacormie-backend/src/modules/social/social.service.ts#L126).

Response surface / delegation: `{ media }`.

Success HTTP status: 201 (Nest default unless overridden). Service path exceptions: `new BadRequestException('Select at least one image')`; `new BadRequestException('You can upload at most 10 images')`; `new BadRequestException( 'Only valid JPG and PNG images are accepted', )`; `new BadRequestException('Each image must be 10 MB or smaller')`; `new ServiceUnavailableException( 'Social uploads are not configured', )`.

<a id="endpoint-get-social-profiles-by-userId"></a>

### GET /api/v1/social/profiles/:userId

UI groups: C23. Source status: IMPLEMENTED.

Controller: [SocialController.getPublicProfile](../../christinacormie-backend/src/modules/social/social.controller.ts#L260).

Auth: Bearer access JWT required; roles no explicit role restriction; ownership/state rules still apply. Current decorators: `UseGuards(JwtAuthGuard)`.

Request parameters: `@CurrentUser() user: AuthenticatedUser`; `@Param('userId') userId: string`.

Inventory field index: `pathParams.userId required: string - URL path parameter userId`.

Response implementation: [SocialService.getPublicProfile](../../christinacormie-backend/src/modules/social/social.service.ts#L343).

Response surface / delegation: `this.presentPublicProfile(profile)`.

Repository references: [SocialRepository.findPublicProfile](../../christinacormie-backend/src/modules/social/social.repository.ts#L176); [SocialRepository.publicPostEligibilityWhere](../../christinacormie-backend/src/modules/social/social.repository.ts#L1278).

Success HTTP status: 200 (Nest default unless overridden). Service path exceptions: `new NotFoundException('Profile not found')`.

<a id="endpoint-post-social-profiles-by-userId-follow"></a>

### POST /api/v1/social/profiles/:userId/follow

UI groups: C24. Source status: IMPLEMENTED.

Controller: [SocialController.followUser](../../christinacormie-backend/src/modules/social/social.controller.ts#L269).

Auth: Bearer access JWT required; roles no explicit role restriction; ownership/state rules still apply. Current decorators: `UseGuards(JwtAuthGuard)`.

Request parameters: `@CurrentUser() user: AuthenticatedUser`; `@Param('userId') userId: string`.

Inventory field index: `pathParams.userId required: string - URL path parameter userId`.

Response implementation: [SocialService.followUser](../../christinacormie-backend/src/modules/social/social.service.ts#L352).

Response surface / delegation: `this.socialRepository.followUser(userId, targetUserId)`.

Repository references: [SocialRepository.findPublicProfile](../../christinacormie-backend/src/modules/social/social.repository.ts#L176); [SocialRepository.publicPostEligibilityWhere](../../christinacormie-backend/src/modules/social/social.repository.ts#L1278); [SocialRepository.hasBlockBetween](../../christinacormie-backend/src/modules/social/social.repository.ts#L77); [SocialRepository.followUser](../../christinacormie-backend/src/modules/social/social.repository.ts#L89).

Success HTTP status: 201 (Nest default unless overridden). Service path exceptions: `new ForbiddenException('This account cannot be followed')`; `new BadRequestException( 'You cannot perform this action on yourself', )`; `new NotFoundException('Profile not found')`.

<a id="endpoint-delete-social-profiles-by-userId-follow"></a>

### DELETE /api/v1/social/profiles/:userId/follow

UI groups: C24. Source status: IMPLEMENTED.

Controller: [SocialController.unfollowUser](../../christinacormie-backend/src/modules/social/social.controller.ts#L278).

Auth: Bearer access JWT required; roles no explicit role restriction; ownership/state rules still apply. Current decorators: `UseGuards(JwtAuthGuard)`.

Request parameters: `@CurrentUser() user: AuthenticatedUser`; `@Param('userId') userId: string`.

Inventory field index: `pathParams.userId required: string - URL path parameter userId`.

Response implementation: [SocialService.unfollowUser](../../christinacormie-backend/src/modules/social/social.service.ts#L360).

Response surface / delegation: `{ unfollowed }`.

Repository references: [SocialRepository.unfollowUser](../../christinacormie-backend/src/modules/social/social.repository.ts#L125).

Success HTTP status: 200 (Nest default unless overridden). Service path exceptions: none explicitly extracted; common failures still apply.

<a id="endpoint-post-social-profiles-by-userId-block"></a>

### POST /api/v1/social/profiles/:userId/block

UI groups: C17. Source status: IMPLEMENTED.

Controller: [SocialController.blockUser](../../christinacormie-backend/src/modules/social/social.controller.ts#L287).

Auth: Bearer access JWT required; roles no explicit role restriction; ownership/state rules still apply. Current decorators: `UseGuards(JwtAuthGuard)`.

Request parameters: `@CurrentUser() user: AuthenticatedUser`; `@Param('userId') userId: string`.

Inventory field index: `pathParams.userId required: string - URL path parameter userId`.

Response implementation: [SocialService.blockUser](../../christinacormie-backend/src/modules/social/social.service.ts#L368).

Response surface / delegation: `block`.

Repository references: [SocialRepository.findPublicProfile](../../christinacormie-backend/src/modules/social/social.repository.ts#L176); [SocialRepository.publicPostEligibilityWhere](../../christinacormie-backend/src/modules/social/social.repository.ts#L1278); [SocialRepository.blockUser](../../christinacormie-backend/src/modules/social/social.repository.ts#L149); [SocialRepository.unfollowUser](../../christinacormie-backend/src/modules/social/social.repository.ts#L125).

Success HTTP status: 201 (Nest default unless overridden). Service path exceptions: `new BadRequestException( 'You cannot perform this action on yourself', )`; `new NotFoundException('Profile not found')`.

<a id="endpoint-delete-social-profiles-by-userId-block"></a>

### DELETE /api/v1/social/profiles/:userId/block

UI groups: C17. Source status: IMPLEMENTED.

Controller: [SocialController.unblockUser](../../christinacormie-backend/src/modules/social/social.controller.ts#L296).

Auth: Bearer access JWT required; roles no explicit role restriction; ownership/state rules still apply. Current decorators: `UseGuards(JwtAuthGuard)`.

Request parameters: `@CurrentUser() user: AuthenticatedUser`; `@Param('userId') userId: string`.

Inventory field index: `pathParams.userId required: string - URL path parameter userId`.

Response implementation: [SocialService.unblockUser](../../christinacormie-backend/src/modules/social/social.service.ts#L376).

Response surface / delegation: `{ unblocked }`.

Repository references: [SocialRepository.unblockUser](../../christinacormie-backend/src/modules/social/social.repository.ts#L170).

Success HTTP status: 200 (Nest default unless overridden). Service path exceptions: none explicitly extracted; common failures still apply.

<a id="endpoint-get-social-profiles-by-userId-following"></a>

### GET /api/v1/social/profiles/:userId/following

UI groups: C13. Source status: IMPLEMENTED.

Controller: [SocialController.listFollowing](../../christinacormie-backend/src/modules/social/social.controller.ts#L320).

Auth: Bearer access JWT required; roles no explicit role restriction; ownership/state rules still apply. Current decorators: `UseGuards(JwtAuthGuard)`.

Request parameters: `@CurrentUser() user: AuthenticatedUser`; `@Param('userId') userId: string`; `@Query() query: ProfileSocialQueryDto`.

Inventory field index: `pathParams.userId required: string - URL path parameter userId`; `queryParams.type optional: SocialAccountType`; `queryParams.search optional: string`; `queryParams.limit optional: number`; `queryParams.offset optional: number`.

Response implementation: [SocialService.listFollowers](../../christinacormie-backend/src/modules/social/social.service.ts#L384).

Response surface / delegation: `{ ...result, items, nextOffset }`.

Repository references: [SocialRepository.findPublicProfile](../../christinacormie-backend/src/modules/social/social.repository.ts#L176); [SocialRepository.publicPostEligibilityWhere](../../christinacormie-backend/src/modules/social/social.repository.ts#L1278); [SocialRepository.listFollowers](../../christinacormie-backend/src/modules/social/social.repository.ts#L225); [SocialRepository.accountTypeFilter](../../christinacormie-backend/src/modules/social/social.repository.ts#L1296); [SocialRepository.publicUserSelect](../../christinacormie-backend/src/modules/social/social.repository.ts#L1302).

Success HTTP status: 200 (Nest default unless overridden). Service path exceptions: `new NotFoundException('Profile not found')`.

<a id="endpoint-get-social-profiles-by-userId-posts"></a>

### GET /api/v1/social/profiles/:userId/posts

UI groups: C23, V21. Source status: IMPLEMENTED.

Controller: [SocialController.getProfilePosts](../../christinacormie-backend/src/modules/social/social.controller.ts#L335).

Auth: Bearer access JWT required; roles no explicit role restriction; ownership/state rules still apply. Current decorators: `UseGuards(JwtAuthGuard)`.

Request parameters: `@CurrentUser() user: AuthenticatedUser`; `@Param('userId') userId: string`; `@Query() query: FeedQueryDto`.

Inventory field index: `pathParams.userId required: string - URL path parameter userId`; `queryParams.limit optional: number`; `queryParams.cursor optional: string`.

Response implementation: [SocialService.getProfilePosts](../../christinacormie-backend/src/modules/social/social.service.ts#L413).

Response surface / delegation: `this.paginatePosts( tab === 'tagged' ? this.socialRepository.findTaggedPosts( profileUserId, viewerUserId, query, ) : this.socialRepository.findAuthoredPosts( profileUserId, viewerUserId, query, ), query, )`.

Repository references: [SocialRepository.findTaggedPosts](../../christinacormie-backend/src/modules/social/social.repository.ts#L1104); [SocialRepository.findProfilePosts](../../christinacormie-backend/src/modules/social/social.repository.ts#L1189); [SocialRepository.publicPostEligibilityWhere](../../christinacormie-backend/src/modules/social/social.repository.ts#L1278); [SocialRepository.postInclude](../../christinacormie-backend/src/modules/social/social.repository.ts#L1226); [SocialRepository.publicUserSelect](../../christinacormie-backend/src/modules/social/social.repository.ts#L1302); [SocialRepository.findAuthoredPosts](../../christinacormie-backend/src/modules/social/social.repository.ts#L1092).

Success HTTP status: 200 (Nest default unless overridden). Service path exceptions: none explicitly extracted; common failures still apply.

<a id="endpoint-get-social-profiles-by-userId-tagged-posts"></a>

### GET /api/v1/social/profiles/:userId/tagged-posts

UI groups: C23, V21. Source status: IMPLEMENTED.

Controller: [SocialController.getProfileTaggedPosts](../../christinacormie-backend/src/modules/social/social.controller.ts#L345).

Auth: Bearer access JWT required; roles no explicit role restriction; ownership/state rules still apply. Current decorators: `UseGuards(JwtAuthGuard)`.

Request parameters: `@CurrentUser() user: AuthenticatedUser`; `@Param('userId') userId: string`; `@Query() query: FeedQueryDto`.

Inventory field index: `pathParams.userId required: string - URL path parameter userId`; `queryParams.limit optional: number`; `queryParams.cursor optional: string`.

Response implementation: [SocialService.getProfilePosts](../../christinacormie-backend/src/modules/social/social.service.ts#L413).

Response surface / delegation: `this.paginatePosts( tab === 'tagged' ? this.socialRepository.findTaggedPosts( profileUserId, viewerUserId, query, ) : this.socialRepository.findAuthoredPosts( profileUserId, viewerUserId, query, ), query, )`.

Repository references: [SocialRepository.findTaggedPosts](../../christinacormie-backend/src/modules/social/social.repository.ts#L1104); [SocialRepository.findProfilePosts](../../christinacormie-backend/src/modules/social/social.repository.ts#L1189); [SocialRepository.publicPostEligibilityWhere](../../christinacormie-backend/src/modules/social/social.repository.ts#L1278); [SocialRepository.postInclude](../../christinacormie-backend/src/modules/social/social.repository.ts#L1226); [SocialRepository.publicUserSelect](../../christinacormie-backend/src/modules/social/social.repository.ts#L1302); [SocialRepository.findAuthoredPosts](../../christinacormie-backend/src/modules/social/social.repository.ts#L1092).

Success HTTP status: 200 (Nest default unless overridden). Service path exceptions: none explicitly extracted; common failures still apply.

<a id="endpoint-post-social-food-trucks-by-foodTruckId-follow"></a>

### POST /api/v1/social/food-trucks/:foodTruckId/follow

UI groups: C05. Source status: IMPLEMENTED.

Controller: [SocialController.followFoodTruck](../../christinacormie-backend/src/modules/social/social.controller.ts#L360).

Auth: Bearer access JWT required; roles no explicit role restriction; ownership/state rules still apply. Current decorators: `UseGuards(JwtAuthGuard)`.

Request parameters: `@CurrentUser() user: AuthenticatedUser`; `@Param('foodTruckId') foodTruckId: string`.

Inventory field index: `pathParams.foodTruckId required: string - URL path parameter foodTruckId`.

Response implementation: [SocialService.followFoodTruck](../../christinacormie-backend/src/modules/social/social.service.ts#L39).

Response surface / delegation: `existing OR follow`.

Repository references: [SocialRepository.findFoodTruckById](../../christinacormie-backend/src/modules/social/social.repository.ts#L318); [SocialRepository.hasBlockBetween](../../christinacormie-backend/src/modules/social/social.repository.ts#L77); [SocialRepository.findFollow](../../christinacormie-backend/src/modules/social/social.repository.ts#L338); [SocialRepository.followFoodTruck](../../christinacormie-backend/src/modules/social/social.repository.ts#L349); [SocialRepository.followUser](../../christinacormie-backend/src/modules/social/social.repository.ts#L89); [RewardsRepository.findActivePointRule](../../christinacormie-backend/src/modules/rewards/rewards.repository.ts#L105).

Success HTTP status: 201 (Nest default unless overridden). Service path exceptions: `new ForbiddenException('This account cannot be followed')`; `new NotFoundException('Food truck not found')`; `new ForbiddenException('Food truck is not available')`.

<a id="endpoint-delete-social-food-trucks-by-foodTruckId-follow"></a>

### DELETE /api/v1/social/food-trucks/:foodTruckId/follow

UI groups: C05. Source status: IMPLEMENTED.

Controller: [SocialController.unfollowFoodTruck](../../christinacormie-backend/src/modules/social/social.controller.ts#L391).

Auth: Bearer access JWT required; roles no explicit role restriction; ownership/state rules still apply. Current decorators: `UseGuards(JwtAuthGuard)`.

Request parameters: `@CurrentUser() user: AuthenticatedUser`; `@Param('foodTruckId') foodTruckId: string`.

Inventory field index: `pathParams.foodTruckId required: string - URL path parameter foodTruckId`.

Response implementation: [SocialService.unfollowFoodTruck](../../christinacormie-backend/src/modules/social/social.service.ts#L74).

Response surface / delegation: `{ unfollowed }`.

Repository references: [SocialRepository.findFoodTruckById](../../christinacormie-backend/src/modules/social/social.repository.ts#L318); [SocialRepository.unfollowFoodTruck](../../christinacormie-backend/src/modules/social/social.repository.ts#L382); [SocialRepository.unfollowUser](../../christinacormie-backend/src/modules/social/social.repository.ts#L125).

Success HTTP status: 200 (Nest default unless overridden). Service path exceptions: `new NotFoundException('Food truck not found')`; `new ForbiddenException('Food truck is not available')`.

<a id="endpoint-post-social-food-trucks-by-foodTruckId-favorite"></a>

### POST /api/v1/social/food-trucks/:foodTruckId/favorite

UI groups: C03. Source status: IMPLEMENTED.

Controller: [SocialController.favoriteFoodTruck](../../christinacormie-backend/src/modules/social/social.controller.ts#L472).

Auth: Bearer access JWT required; roles no explicit role restriction; ownership/state rules still apply. Current decorators: `UseGuards(JwtAuthGuard)`.

Request parameters: `@CurrentUser() user: AuthenticatedUser`; `@Param('foodTruckId') foodTruckId: string`.

Inventory field index: `pathParams.foodTruckId required: string - URL path parameter foodTruckId`.

Response implementation: [SocialService.favoriteFoodTruck](../../christinacormie-backend/src/modules/social/social.service.ts#L105).

Response surface / delegation: `this.socialRepository.favoriteFoodTruck(userId, foodTruckId)`.

Repository references: [SocialRepository.findFoodTruckById](../../christinacormie-backend/src/modules/social/social.repository.ts#L318); [SocialRepository.favoriteFoodTruck](../../christinacormie-backend/src/modules/social/social.repository.ts#L429).

Success HTTP status: 201 (Nest default unless overridden). Service path exceptions: `new NotFoundException('Food truck not found')`; `new ForbiddenException('Food truck is not available')`.

<a id="endpoint-delete-social-food-trucks-by-foodTruckId-favorite"></a>

### DELETE /api/v1/social/food-trucks/:foodTruckId/favorite

UI groups: C03. Source status: IMPLEMENTED.

Controller: [SocialController.unfavoriteFoodTruck](../../christinacormie-backend/src/modules/social/social.controller.ts#L503).

Auth: Bearer access JWT required; roles no explicit role restriction; ownership/state rules still apply. Current decorators: `UseGuards(JwtAuthGuard)`.

Request parameters: `@CurrentUser() user: AuthenticatedUser`; `@Param('foodTruckId') foodTruckId: string`.

Inventory field index: `pathParams.foodTruckId required: string - URL path parameter foodTruckId`.

Response implementation: [SocialService.unfavoriteFoodTruck](../../christinacormie-backend/src/modules/social/social.service.ts#L110).

Response surface / delegation: `{ unfavorited }`.

Repository references: [SocialRepository.findFoodTruckById](../../christinacormie-backend/src/modules/social/social.repository.ts#L318); [SocialRepository.unfavoriteFoodTruck](../../christinacormie-backend/src/modules/social/social.repository.ts#L445).

Success HTTP status: 200 (Nest default unless overridden). Service path exceptions: `new NotFoundException('Food truck not found')`; `new ForbiddenException('Food truck is not available')`.

<a id="endpoint-get-social-favorites"></a>

### GET /api/v1/social/favorites

UI groups: C03. Source status: IMPLEMENTED.

Controller: [SocialController.getFavorites](../../christinacormie-backend/src/modules/social/social.controller.ts#L534).

Auth: Bearer access JWT required; roles no explicit role restriction; ownership/state rules still apply. Current decorators: `UseGuards(JwtAuthGuard)`.

Request parameters: `@CurrentUser() user: AuthenticatedUser`; `@Query() query: GetFavoritesQueryDto`.

Inventory field index: `queryParams.tab optional: FavoriteTab - Filter by tab: ALL, OPEN, or CLOSED`; `queryParams.search optional: string - Search favorite trucks by name or cuisine`; `queryParams.latitude optional: number - User latitude for distance calculation`; `queryParams.longitude optional: number - User longitude for distance calculation`.

Response implementation: [SocialService.getFavorites](../../christinacormie-backend/src/modules/social/social.service.ts#L122).

Response surface / delegation: `this.socialRepository.getFavorites(userId, query)`.

Repository references: [SocialRepository.getFavorites](../../christinacormie-backend/src/modules/social/social.repository.ts#L1341); [SocialRepository.formatClosingTime](../../christinacormie-backend/src/modules/social/social.repository.ts#L1511); [SocialRepository.formatFollowingSince](../../christinacormie-backend/src/modules/social/social.repository.ts#L1531).

Success HTTP status: 200 (Nest default unless overridden). Service path exceptions: none explicitly extracted; common failures still apply.

<a id="endpoint-post-social-posts"></a>

### POST /api/v1/social/posts

UI groups: C13, V03, V05. Source status: IMPLEMENTED.

Controller: [SocialController.createPost](../../christinacormie-backend/src/modules/social/social.controller.ts#L568).

Auth: Bearer access JWT required; roles no explicit role restriction; ownership/state rules still apply. Current decorators: `UseGuards(JwtAuthGuard)`.

Request parameters: `@CurrentUser() user: AuthenticatedUser`; `@Body() dto: CreatePostDto`.

Inventory field index: `body.foodTruckId optional: string`; `body.content optional: string`; `body.locationId optional: string`; `body.taggedUserIds optional: string[]`; `body.status optional: PostStatusDto`; `body.isPromotion optional: boolean`; `body.isFollowerOnly optional: boolean`; `body.media optional: PostMediaDto[]`.

Response implementation: [SocialService.createPost](../../christinacormie-backend/src/modules/social/social.service.ts#L173).

Response surface / delegation: `post`.

Repository references: [SocialRepository.findAuthorIdentity](../../christinacormie-backend/src/modules/social/social.repository.ts#L36); [SocialRepository.findFoodTruckById](../../christinacormie-backend/src/modules/social/social.repository.ts#L318); [SocialRepository.findActivePlace](../../christinacormie-backend/src/modules/social/social.repository.ts#L60); [SocialRepository.countValidTagTargets](../../christinacormie-backend/src/modules/social/social.repository.ts#L67); [SocialRepository.hasBlockBetween](../../christinacormie-backend/src/modules/social/social.repository.ts#L77); [SocialRepository.createPost](../../christinacormie-backend/src/modules/social/social.repository.ts#L464).

Success HTTP status: 201 (Nest default unless overridden). Service path exceptions: `new BadRequestException( 'Post content or at least one image is required', )`; `new ForbiddenException('Active account is required')`; `new ForbiddenException('Customers cannot post as a food truck')`; `new ForbiddenException(this.vendorApprovalMessage)`; `new ConflictException('Vendor must have exactly one food truck')`; `new ForbiddenException('Food truck does not belong to this vendor')`.

<a id="endpoint-post-social-posts-by-postId-like"></a>

### POST /api/v1/social/posts/:postId/like

UI groups: C10, V05. Source status: IMPLEMENTED.

Controller: [SocialController.likePost](../../christinacormie-backend/src/modules/social/social.controller.ts#L758).

Auth: Bearer access JWT required; roles no explicit role restriction; ownership/state rules still apply. Current decorators: `UseGuards(JwtAuthGuard)`.

Request parameters: `@CurrentUser() user: AuthenticatedUser`; `@Param('postId') postId: string`.

Inventory field index: `pathParams.postId required: string - URL path parameter postId`.

Response implementation: [SocialService.likePost](../../christinacormie-backend/src/modules/social/social.service.ts#L240).

Response surface / delegation: `this.socialRepository.likePost(postId, userId)`.

Repository references: [SocialRepository.findVisiblePost](../../christinacormie-backend/src/modules/social/social.repository.ts#L517); [SocialRepository.publicPostEligibilityWhere](../../christinacormie-backend/src/modules/social/social.repository.ts#L1278); [SocialRepository.likePost](../../christinacormie-backend/src/modules/social/social.repository.ts#L623).

Success HTTP status: 201 (Nest default unless overridden). Service path exceptions: `new NotFoundException('Post not found')`.

<a id="endpoint-get-social-posts-by-postId-comments"></a>

### GET /api/v1/social/posts/:postId/comments

UI groups: C11, V05. Source status: IMPLEMENTED.

Controller: [SocialController.getCommentsForPost](../../christinacormie-backend/src/modules/social/social.controller.ts#L767).

Auth: Bearer access JWT required; roles no explicit role restriction; ownership/state rules still apply. Current decorators: `UseGuards(JwtAuthGuard)`.

Request parameters: `@CurrentUser() user: AuthenticatedUser`; `@Param('postId') postId: string`; `@Query() query: GetCommentsQueryDto`.

Inventory field index: `pathParams.postId required: string - URL path parameter postId`; `queryParams.limit optional: number`; `queryParams.offset optional: number`.

Response implementation: [SocialService.getCommentsForPost](../../christinacormie-backend/src/modules/social/social.service.ts#L261).

Response surface / delegation: `this.socialRepository.findCommentsForPost(postId, userId, query)`.

Repository references: [SocialRepository.findVisiblePost](../../christinacormie-backend/src/modules/social/social.repository.ts#L517); [SocialRepository.publicPostEligibilityWhere](../../christinacormie-backend/src/modules/social/social.repository.ts#L1278); [SocialRepository.findCommentsForPost](../../christinacormie-backend/src/modules/social/social.repository.ts#L675).

Success HTTP status: 200 (Nest default unless overridden). Service path exceptions: `new NotFoundException('Post not found')`.

<a id="endpoint-post-social-posts-by-postId-comments"></a>

### POST /api/v1/social/posts/:postId/comments

UI groups: C11, V05. Source status: IMPLEMENTED.

Controller: [SocialController.commentOnPost](../../christinacormie-backend/src/modules/social/social.controller.ts#L805).

Auth: Bearer access JWT required; roles no explicit role restriction; ownership/state rules still apply. Current decorators: `UseGuards(JwtAuthGuard)`.

Request parameters: `@CurrentUser() user: AuthenticatedUser`; `@Param('postId') postId: string`; `@Body() dto: CommentPostDto`.

Inventory field index: `pathParams.postId required: string - URL path parameter postId`; `body.content required: string`; `body.parentCommentId optional: string`.

Response implementation: [SocialService.commentOnPost](../../christinacormie-backend/src/modules/social/social.service.ts#L245).

Response surface / delegation: `this.socialRepository.commentOnPost(postId, userId, dto)`.

Repository references: [SocialRepository.findVisiblePost](../../christinacormie-backend/src/modules/social/social.repository.ts#L517); [SocialRepository.publicPostEligibilityWhere](../../christinacormie-backend/src/modules/social/social.repository.ts#L1278); [SocialRepository.findCommentById](../../christinacormie-backend/src/modules/social/social.repository.ts#L661); [SocialRepository.commentOnPost](../../christinacormie-backend/src/modules/social/social.repository.ts#L802).

Success HTTP status: 201 (Nest default unless overridden). Service path exceptions: `new NotFoundException('Parent comment not found')`; `new NotFoundException('Post not found')`.

<a id="endpoint-post-social-comments-by-commentId-like"></a>

### POST /api/v1/social/comments/:commentId/like

UI groups: C11, V05. Source status: IMPLEMENTED.

Controller: [SocialController.likeComment](../../christinacormie-backend/src/modules/social/social.controller.ts#L844).

Auth: Bearer access JWT required; roles no explicit role restriction; ownership/state rules still apply. Current decorators: `UseGuards(JwtAuthGuard)`.

Request parameters: `@CurrentUser() user: AuthenticatedUser`; `@Param('commentId') commentId: string`.

Inventory field index: `pathParams.commentId required: string - URL path parameter commentId`.

Response implementation: [SocialService.likeComment](../../christinacormie-backend/src/modules/social/social.service.ts#L272).

Response surface / delegation: `this.socialRepository.likeComment(commentId, userId)`.

Repository references: [SocialRepository.findCommentById](../../christinacormie-backend/src/modules/social/social.repository.ts#L661); [SocialRepository.findVisiblePost](../../christinacormie-backend/src/modules/social/social.repository.ts#L517); [SocialRepository.publicPostEligibilityWhere](../../christinacormie-backend/src/modules/social/social.repository.ts#L1278); [SocialRepository.likeComment](../../christinacormie-backend/src/modules/social/social.repository.ts#L867).

Success HTTP status: 201 (Nest default unless overridden). Service path exceptions: `new NotFoundException('Comment not found')`; `new NotFoundException('Post not found')`.

<a id="endpoint-post-social-posts-by-postId-share"></a>

### POST /api/v1/social/posts/:postId/share

UI groups: C12. Source status: IMPLEMENTED.

Controller: [SocialController.sharePost](../../christinacormie-backend/src/modules/social/social.controller.ts#L870).

Auth: Bearer access JWT required; roles no explicit role restriction; ownership/state rules still apply. Current decorators: `UseGuards(JwtAuthGuard)`.

Request parameters: `@CurrentUser() user: AuthenticatedUser`; `@Param('postId') postId: string`.

Inventory field index: `pathParams.postId required: string - URL path parameter postId`.

Response implementation: [SocialService.sharePost](../../christinacormie-backend/src/modules/social/social.service.ts#L283).

Response surface / delegation: `{ success, postId, shareCount, shareUrl, shareText }`.

Repository references: [SocialRepository.findVisiblePost](../../christinacormie-backend/src/modules/social/social.repository.ts#L517); [SocialRepository.publicPostEligibilityWhere](../../christinacormie-backend/src/modules/social/social.repository.ts#L1278); [SocialRepository.sharePost](../../christinacormie-backend/src/modules/social/social.repository.ts#L919).

Success HTTP status: 201 (Nest default unless overridden). Service path exceptions: `new NotFoundException('Post not found')`.

<a id="endpoint-get-social-feed-following"></a>

### GET /api/v1/social/feed/following

UI groups: C09, V05. Source status: IMPLEMENTED.

Controller: [SocialController.getFollowedFeed](../../christinacormie-backend/src/modules/social/social.controller.ts#L924).

Auth: Bearer access JWT required; roles no explicit role restriction; ownership/state rules still apply. Current decorators: `UseGuards(JwtAuthGuard)`.

Request parameters: `@CurrentUser() user: AuthenticatedUser`; `@Query() query: FeedQueryDto`.

Inventory field index: `queryParams.limit optional: number`; `queryParams.cursor optional: string`.

Response implementation: [SocialService.getFollowedFeed](../../christinacormie-backend/src/modules/social/social.service.ts#L307).

Response surface / delegation: `{ items, nextCursor }`.

Repository references: [SocialRepository.findFollowedFeed](../../christinacormie-backend/src/modules/social/social.repository.ts#L984); [SocialRepository.publicPostEligibilityWhere](../../christinacormie-backend/src/modules/social/social.repository.ts#L1278); [SocialRepository.postInclude](../../christinacormie-backend/src/modules/social/social.repository.ts#L1226); [SocialRepository.publicUserSelect](../../christinacormie-backend/src/modules/social/social.repository.ts#L1302).

Success HTTP status: 200 (Nest default unless overridden). Service path exceptions: none explicitly extracted; common failures still apply.

<a id="endpoint-get-social-feed-explore"></a>

### GET /api/v1/social/feed/explore

UI groups: C09, V05. Source status: IMPLEMENTED.

Controller: [SocialController.getExploreFeed](../../christinacormie-backend/src/modules/social/social.controller.ts#L958).

Auth: Bearer access JWT required; roles no explicit role restriction; ownership/state rules still apply. Current decorators: `UseGuards(JwtAuthGuard)`.

Request parameters: `@CurrentUser() user: AuthenticatedUser`; `@Query() query: ExploreFeedQueryDto`.

Inventory field index: `queryParams.limit optional: number`; `queryParams.cursor optional: string`; `queryParams.sortBy optional: ExploreSortBy`.

Response implementation: [SocialService.getExploreFeed](../../christinacormie-backend/src/modules/social/social.service.ts#L319).

Response surface / delegation: `{ items, nextCursor }`.

Repository references: [SocialRepository.findExploreFeed](../../christinacormie-backend/src/modules/social/social.repository.ts#L1019); [SocialRepository.publicPostEligibilityWhere](../../christinacormie-backend/src/modules/social/social.repository.ts#L1278); [SocialRepository.postInclude](../../christinacormie-backend/src/modules/social/social.repository.ts#L1226); [SocialRepository.publicUserSelect](../../christinacormie-backend/src/modules/social/social.repository.ts#L1302).

Success HTTP status: 200 (Nest default unless overridden). Service path exceptions: none explicitly extracted; common failures still apply.

<a id="endpoint-get-subscriptions-plans"></a>

### GET /api/v1/subscriptions/plans

UI groups: V24. Source status: IMPLEMENTED.

Controller: [SubscriptionsController.listPlans](../../christinacormie-backend/src/modules/subscriptions/subscriptions.controller.ts#L66).

Auth: No mandatory JWT in inventory; check current decorators; roles no explicit role restriction; ownership/state rules still apply. Current decorators: none.

Request parameters: .

Response implementation: [SubscriptionsService.listPublicPlans](../../christinacormie-backend/src/modules/subscriptions/subscriptions.service.ts#L83).

Response surface / delegation: `{ foundingOffer, items }`.

Success HTTP status: 200 (Nest default unless overridden). Service path exceptions: none explicitly extracted; common failures still apply.

<a id="endpoint-get-subscriptions-me"></a>

### GET /api/v1/subscriptions/me

UI groups: V24. Source status: IMPLEMENTED.

Controller: [SubscriptionsController.getMySubscription](../../christinacormie-backend/src/modules/subscriptions/subscriptions.controller.ts#L76).

Auth: Bearer access JWT required; roles VENDOR. Current decorators: `UseGuards(JwtAuthGuard, RolesGuard)`; `Roles(UserRole.VENDOR)`.

Request parameters: `@CurrentUser() user: AuthenticatedUser`.

Response implementation: [SubscriptionsService.getMySubscription](../../christinacormie-backend/src/modules/subscriptions/subscriptions.service.ts#L99).

Response surface / delegation: `this.getVendorSubscriptionResponse(vendor.id)`.

Success HTTP status: 200 (Nest default unless overridden). Service path exceptions: `new NotFoundException('Vendor profile not found for this account')`; `new NotFoundException('Vendor profile not found')`; `new InternalServerErrorException( 'Default Free subscription plan is not configured', )`.

<a id="endpoint-get-users-me"></a>

### GET /api/v1/users/me

UI groups: A04. Source status: IMPLEMENTED.

Controller: [UsersController.getMe](../../christinacormie-backend/src/modules/users/users.controller.ts#L197).

Auth: Bearer access JWT required; roles no explicit role restriction; ownership/state rules still apply. Current decorators: `UseGuards(JwtAuthGuard, RolesGuard)`.

Request parameters: `@CurrentUser() user: AuthenticatedUser`.

Response implementation: [UsersService.getMe](../../christinacormie-backend/src/modules/users/users.service.ts#L26).

Response surface / delegation: `this.toUserResponse(user)`.

Success HTTP status: 200 (Nest default unless overridden). Service path exceptions: `new NotFoundException('User not found')`.

<a id="endpoint-patch-users-me-profile"></a>

### PATCH /api/v1/users/me/profile

UI groups: C26. Source status: IMPLEMENTED.

Controller: [UsersController.updateProfile](../../christinacormie-backend/src/modules/users/users.controller.ts#L355).

Auth: Bearer access JWT required; roles no explicit role restriction; ownership/state rules still apply. Current decorators: `UseGuards(JwtAuthGuard, RolesGuard)`.

Request parameters: `@CurrentUser() user: AuthenticatedUser`; `@Body() dto: UpdateProfileDto`.

Inventory field index: `body.displayName optional: string`; `body.email optional: string`; `body.phone optional: string`.

Response implementation: [UsersService.updateProfile](../../christinacormie-backend/src/modules/users/users.service.ts#L53).

Response surface / delegation: `updatedProfile`.

Repository references: [RewardsRepository.findActivePointRule](../../christinacormie-backend/src/modules/rewards/rewards.repository.ts#L105); [RewardsRepository.awardPoints](../../christinacormie-backend/src/modules/rewards/rewards.repository.ts#L260); [NotificationsRepository.findRecentForUser](../../christinacormie-backend/src/modules/notifications/notifications.repository.ts#L84); [NotificationsRepository.create](../../christinacormie-backend/src/modules/notifications/notifications.repository.ts#L206); [NotificationsRepository.getPreferences](../../christinacormie-backend/src/modules/notifications/notifications.repository.ts#L155); [NotificationsRepository.findActiveDeviceTokens](../../christinacormie-backend/src/modules/notifications/notifications.repository.ts#L163).

Success HTTP status: 200 (Nest default unless overridden). Service path exceptions: `new NotFoundException('User not found')`; `new ConflictException( 'Email address or phone number is already in use by another account', )`; `new ConflictException( 'Email address is already in use by another account', )`; `new ConflictException( 'Phone number is already in use by another account', )`.

<a id="endpoint-post-users-me-profile-avatar-upload"></a>

### POST /api/v1/users/me/profile/avatar/upload

UI groups: C26. Source status: IMPLEMENTED.

Controller: [UsersController.uploadProfileAvatar](../../christinacormie-backend/src/modules/users/users.controller.ts#L416).

Auth: Bearer access JWT required; roles no explicit role restriction; ownership/state rules still apply. Current decorators: `UseGuards(JwtAuthGuard, RolesGuard)`.

Request parameters: `@CurrentUser() user: AuthenticatedUser`; `@UploadedFile() file: Express.Multer.File`.

Inventory field index: `body.file required: binary - Multipart file upload`.

Response implementation: [UsersService.uploadProfileAvatar](../../christinacormie-backend/src/modules/users/users.service.ts#L166).

Response surface / delegation: `{ message, avatarUrl }`.

Success HTTP status: 201 (Nest default unless overridden). Service path exceptions: `new NotFoundException('User not found')`; `new BadRequestException('Profile photo file is required')`; `new BadRequestException( 'Only image files are allowed for profile photo', )`; `new BadRequestException('Profile photo must be 5MB or smaller')`.

<a id="endpoint-delete-users-me"></a>

### DELETE /api/v1/users/me

UI groups: C33. Source status: IMPLEMENTED.

Controller: [UsersController.deleteMyAccount](../../christinacormie-backend/src/modules/users/users.controller.ts#L568).

Auth: Bearer access JWT required; roles no explicit role restriction; ownership/state rules still apply. Current decorators: `UseGuards(JwtAuthGuard, RolesGuard)`.

Request parameters: `@CurrentUser() user: AuthenticatedUser`.

Response implementation: [UsersService.deleteAccountPermanently](../../christinacormie-backend/src/modules/users/users.service.ts#L344).

Response surface / delegation: `{ deleted, message }`.

Success HTTP status: 200 (Nest default unless overridden). Service path exceptions: `new NotFoundException('User not found')`; `new BadRequestException( 'Vendor account deletion is not available from customer settings. Please contact support.', )`.

<a id="endpoint-get-vendors-me"></a>

### GET /api/v1/vendors/me

UI groups: V02, S01. Source status: IMPLEMENTED.

Controller: [VendorsController.getMyVendorProfile](../../christinacormie-backend/src/modules/vendors/vendors.controller.ts#L328).

Auth: Bearer access JWT required; roles VENDOR, VENDOR_STAFF. Current decorators: `UseGuards(JwtAuthGuard, RolesGuard)`; `Roles(UserRole.VENDOR, UserRole.VENDOR_STAFF)`.

Request parameters: `@CurrentUser() user: AuthenticatedUser`.

Response implementation: [VendorsService.getMyVendorProfile](../../christinacormie-backend/src/modules/vendors/vendors.service.ts#L59).

Response surface / delegation: `{ ...vendor, dashboardAccess, verificationBadge, verificationRequirements }`.

Repository references: [VendorsRepository.findByUserId](../../christinacormie-backend/src/modules/vendors/vendors.repository.ts#L14); [VendorsRepository.vendorInclude](../../christinacormie-backend/src/modules/vendors/vendors.repository.ts#L867).

Success HTTP status: 200 (Nest default unless overridden). Service path exceptions: `new NotFoundException('Vendor profile not found')`.

<a id="endpoint-get-vendors-me-qr-code"></a>

### GET /api/v1/vendors/me/qr-code

UI groups: V04. Source status: IMPLEMENTED.

Controller: [VendorsController.getMyVendorQrCode](../../christinacormie-backend/src/modules/vendors/vendors.controller.ts#L358).

Auth: Bearer access JWT required; roles VENDOR, VENDOR_STAFF. Current decorators: `UseGuards(JwtAuthGuard, RolesGuard)`; `Roles(UserRole.VENDOR, UserRole.VENDOR_STAFF)`.

Request parameters: `@CurrentUser() user: AuthenticatedUser`.

Response implementation: [VendorsService.getMyVendorQrCode](../../christinacormie-backend/src/modules/vendors/vendors.service.ts#L74).

Response surface / delegation: `{ vendorId, businessName, foodTruckId, qrCode, qrCodeUrl, downloadUrl, shareMessage }`.

Repository references: [VendorsRepository.findByUserId](../../christinacormie-backend/src/modules/vendors/vendors.repository.ts#L14); [VendorsRepository.vendorInclude](../../christinacormie-backend/src/modules/vendors/vendors.repository.ts#L867); [CheckInsRepository.ensureQrCodesForVendor](../../christinacormie-backend/src/modules/check-ins/check-ins.repository.ts#L87); [CheckInsRepository.ensureTruckQrCode](../../christinacormie-backend/src/modules/check-ins/check-ins.repository.ts#L72); [CheckInsRepository.findQrByFoodTruck](../../christinacormie-backend/src/modules/check-ins/check-ins.repository.ts#L63); [CheckInsRepository.createQrCode](../../christinacormie-backend/src/modules/check-ins/check-ins.repository.ts#L344).

Success HTTP status: 200 (Nest default unless overridden). Service path exceptions: `new NotFoundException('Vendor profile not found')`; `new ForbiddenException(this.vendorApprovalMessage)`.

<a id="endpoint-get-vendors-me-staff"></a>

### GET /api/v1/vendors/me/staff

UI groups: V23. Source status: IMPLEMENTED.

Controller: [VendorsController.listStaff](../../christinacormie-backend/src/modules/vendors/vendors.controller.ts#L389).

Auth: Bearer access JWT required; roles VENDOR. Current decorators: `UseGuards(JwtAuthGuard, RolesGuard)`; `Roles(UserRole.VENDOR)`.

Request parameters: `@CurrentUser() user: AuthenticatedUser`.

Response implementation: [VendorsService.listStaff](../../christinacormie-backend/src/modules/vendors/vendors.service.ts#L94).

Response surface / delegation: `{ items }`.

Repository references: [VendorsRepository.findByUserId](../../christinacormie-backend/src/modules/vendors/vendors.repository.ts#L14); [VendorsRepository.vendorInclude](../../christinacormie-backend/src/modules/vendors/vendors.repository.ts#L867).

Success HTTP status: 200 (Nest default unless overridden). Service path exceptions: `new NotFoundException('Vendor profile not found')`; `new ForbiddenException(this.vendorApprovalMessage)`.

<a id="endpoint-post-vendors-me-staff"></a>

### POST /api/v1/vendors/me/staff

UI groups: V23. Source status: IMPLEMENTED.

Controller: [VendorsController.addStaff](../../christinacormie-backend/src/modules/vendors/vendors.controller.ts#L423).

Auth: Bearer access JWT required; roles VENDOR. Current decorators: `UseGuards(JwtAuthGuard, RolesGuard)`; `Roles(UserRole.VENDOR)`.

Request parameters: `@CurrentUser() user: AuthenticatedUser`; `@Body() dto: CreateVendorStaffDto`.

Inventory field index: `body.email required: string`; `body.pin required: string - 4-digit staff login PIN`.

Response implementation: [VendorsService.addStaff](../../christinacormie-backend/src/modules/vendors/vendors.service.ts#L111).

Response surface / delegation: `{ ...this.toStaffResponse(staff), message }`.

Repository references: [VendorsRepository.findByUserId](../../christinacormie-backend/src/modules/vendors/vendors.repository.ts#L14); [VendorsRepository.vendorInclude](../../christinacormie-backend/src/modules/vendors/vendors.repository.ts#L867).

Success HTTP status: 201 (Nest default unless overridden). Service path exceptions: `new ConflictException( 'Staff member already exists for this vendor', )`; `new BadRequestException( 'This email belongs to a deleted account and cannot be used for staff', )`; `new BadRequestException( 'This email belongs to an account that cannot be used for staff', )`; `new ConflictException( 'This email is already assigned as staff for another vendor', )`; `new NotFoundException('Vendor profile not found')`; `new ForbiddenException(this.vendorApprovalMessage)`.

<a id="endpoint-post-vendors-me-staff-by-staffId-reset-pin"></a>

### POST /api/v1/vendors/me/staff/:staffId/reset-pin

UI groups: V23. Source status: IMPLEMENTED.

Controller: [VendorsController.resetStaffPin](../../christinacormie-backend/src/modules/vendors/vendors.controller.ts#L469).

Auth: Bearer access JWT required; roles VENDOR. Current decorators: `UseGuards(JwtAuthGuard, RolesGuard)`; `Roles(UserRole.VENDOR)`.

Request parameters: `@CurrentUser() user: AuthenticatedUser`; `@Param('staffId') staffId: string`; `@Body() dto: ResetVendorStaffPinDto`.

Inventory field index: `pathParams.staffId required: string - URL path parameter staffId`; `body.pin required: string - New 4-digit staff login PIN`.

Response implementation: [VendorsService.resetStaffPin](../../christinacormie-backend/src/modules/vendors/vendors.service.ts#L259).

Response surface / delegation: `{ ...this.toStaffResponse(updated), message }`.

Repository references: [VendorsRepository.findByUserId](../../christinacormie-backend/src/modules/vendors/vendors.repository.ts#L14); [VendorsRepository.vendorInclude](../../christinacormie-backend/src/modules/vendors/vendors.repository.ts#L867).

Success HTTP status: 201 (Nest default unless overridden). Service path exceptions: `new NotFoundException('Staff member not found')`; `new NotFoundException('Vendor profile not found')`; `new ForbiddenException(this.vendorApprovalMessage)`.

<a id="endpoint-delete-vendors-me-staff-by-staffId"></a>

### DELETE /api/v1/vendors/me/staff/:staffId

UI groups: V23. Source status: IMPLEMENTED.

Controller: [VendorsController.deleteStaff](../../christinacormie-backend/src/modules/vendors/vendors.controller.ts#L501).

Auth: Bearer access JWT required; roles VENDOR. Current decorators: `UseGuards(JwtAuthGuard, RolesGuard)`; `Roles(UserRole.VENDOR)`.

Request parameters: `@CurrentUser() user: AuthenticatedUser`; `@Param('staffId') staffId: string`.

Inventory field index: `pathParams.staffId required: string - URL path parameter staffId`.

Response implementation: [VendorsService.deleteStaff](../../christinacormie-backend/src/modules/vendors/vendors.service.ts#L297).

Response surface / delegation: `{ deleted, message }`.

Repository references: [VendorsRepository.findByUserId](../../christinacormie-backend/src/modules/vendors/vendors.repository.ts#L14); [VendorsRepository.vendorInclude](../../christinacormie-backend/src/modules/vendors/vendors.repository.ts#L867).

Success HTTP status: 200 (Nest default unless overridden). Service path exceptions: `new NotFoundException('Staff member not found')`; `new NotFoundException('Vendor profile not found')`; `new ForbiddenException(this.vendorApprovalMessage)`.

<a id="endpoint-get-vendors-me-analytics"></a>

### GET /api/v1/vendors/me/analytics

UI groups: V01, V16. Source status: IMPLEMENTED.

Controller: [VendorsController.getMyVendorAnalytics](../../christinacormie-backend/src/modules/vendors/vendors.controller.ts#L528).

Auth: Bearer access JWT required; roles VENDOR. Current decorators: `UseGuards(JwtAuthGuard, RolesGuard)`; `Roles(UserRole.VENDOR)`.

Request parameters: `@CurrentUser() user: AuthenticatedUser`.

Response implementation: [VendorsService.getMyVendorAnalytics](../../christinacormie-backend/src/modules/vendors/vendors.service.ts#L554).

Response surface / delegation: `this.vendorsRepository.getVendorAnalytics(vendor.id)`.

Repository references: [VendorsRepository.findByUserId](../../christinacormie-backend/src/modules/vendors/vendors.repository.ts#L14); [VendorsRepository.vendorInclude](../../christinacormie-backend/src/modules/vendors/vendors.repository.ts#L867); [VendorsRepository.getVendorAnalytics](../../christinacormie-backend/src/modules/vendors/vendors.repository.ts#L589).

Success HTTP status: 200 (Nest default unless overridden). Service path exceptions: `new NotFoundException('Vendor profile not found')`; `new ForbiddenException(this.vendorApprovalMessage)`.

<a id="endpoint-get-vendors-me-credits-analytics"></a>

### GET /api/v1/vendors/me/credits/analytics

UI groups: V16. Source status: IMPLEMENTED.

Controller: [VendorsController.getMyCreditAnalytics](../../christinacormie-backend/src/modules/vendors/vendors.controller.ts#L550).

Auth: Bearer access JWT required; roles VENDOR. Current decorators: `UseGuards(JwtAuthGuard, RolesGuard)`; `Roles(UserRole.VENDOR)`.

Request parameters: `@CurrentUser() user: AuthenticatedUser`; `@Query() query: VendorCreditAnalyticsQueryDto`.

Inventory field index: `queryParams.foodTruckId optional: string - Optional food truck filter. If omitted, analytics aggregate all active vendor food trucks.`; `queryParams.range optional: 'week' &#124; 'month'`; `queryParams.timezone optional: string - IANA timezone used by the frontend. Current backend aggregation is UTC-safe and accepts this for API compatibility.`.

Response implementation: [VendorsService.getMyCreditAnalytics](../../christinacormie-backend/src/modules/vendors/vendors.service.ts#L561).

Response surface / delegation: `{ creditAcceptance, qrScans, followers, topDropLocations, creditRedemptions }`.

Repository references: [VendorsRepository.findByUserId](../../christinacormie-backend/src/modules/vendors/vendors.repository.ts#L14); [VendorsRepository.vendorInclude](../../christinacormie-backend/src/modules/vendors/vendors.repository.ts#L867); [VendorsRepository.findActiveFoodTruckIds](../../christinacormie-backend/src/modules/vendors/vendors.repository.ts#L710); [VendorsRepository.getQrScanDailyChart](../../christinacormie-backend/src/modules/vendors/vendors.repository.ts#L762); [VendorsRepository.countFollowers](../../christinacormie-backend/src/modules/vendors/vendors.repository.ts#L725); [VendorsRepository.countFollowersSince](../../christinacormie-backend/src/modules/vendors/vendors.repository.ts#L733).

Success HTTP status: 200 (Nest default unless overridden). Service path exceptions: `new ForbiddenException('Food truck does not belong to this vendor')`; `new NotFoundException('Vendor profile not found')`; `new ForbiddenException(this.vendorApprovalMessage)`.

<a id="endpoint-patch-vendors-me-credits-settings"></a>

### PATCH /api/v1/vendors/me/credits/settings

UI groups: V16. Source status: IMPLEMENTED.

Controller: [VendorsController.updateMyCreditSettings](../../christinacormie-backend/src/modules/vendors/vendors.controller.ts#L593).

Auth: Bearer access JWT required; roles VENDOR. Current decorators: `UseGuards(JwtAuthGuard, RolesGuard)`; `Roles(UserRole.VENDOR)`.

Request parameters: `@CurrentUser() user: AuthenticatedUser`; `@Body() dto: UpdateCreditSettingsDto`.

Inventory field index: `body.creditAcceptanceEnabled required: boolean - Whether this vendor currently accepts BiteDrop Credits.`.

Response implementation: [VendorsService.updateMyCreditSettings](../../christinacormie-backend/src/modules/vendors/vendors.service.ts#L668).

Response surface / delegation: `{ message, creditAcceptance }`.

Repository references: [VendorsRepository.findByUserId](../../christinacormie-backend/src/modules/vendors/vendors.repository.ts#L14); [VendorsRepository.vendorInclude](../../christinacormie-backend/src/modules/vendors/vendors.repository.ts#L867); [VendorsRepository.updateCreditSettings](../../christinacormie-backend/src/modules/vendors/vendors.repository.ts#L694).

Success HTTP status: 200 (Nest default unless overridden). Service path exceptions: `new NotFoundException('Vendor profile not found')`; `new ForbiddenException(this.vendorApprovalMessage)`.

<a id="endpoint-post-vendors-me-onboarding-upload"></a>

### POST /api/v1/vendors/me/onboarding/upload

UI groups: V19. Source status: IMPLEMENTED.

Controller: [VendorsController.uploadOnboardingAsset](../../christinacormie-backend/src/modules/vendors/vendors.controller.ts#L729).

Auth: Bearer access JWT required; roles VENDOR. Current decorators: `UseGuards(JwtAuthGuard, RolesGuard)`; `Roles(UserRole.VENDOR)`.

Request parameters: `@CurrentUser() user: AuthenticatedUser`; `@UploadedFile() file: Express.Multer.File`.

Inventory field index: `body.file required: binary - Multipart file upload`.

Response implementation: [VendorsService.uploadOnboardingAsset](../../christinacormie-backend/src/modules/vendors/vendors.service.ts#L686).

Response surface / delegation: `{ url, publicId, width, height, format, resourceType, originalFilename }`.

Repository references: [VendorsRepository.findByUserId](../../christinacormie-backend/src/modules/vendors/vendors.repository.ts#L14); [VendorsRepository.vendorInclude](../../christinacormie-backend/src/modules/vendors/vendors.repository.ts#L867).

Success HTTP status: 201 (Nest default unless overridden). Service path exceptions: `new NotFoundException('Vendor profile not found')`; `new BadRequestException( 'Cloudinary is not configured. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET.', )`; `new BadRequestException('File upload is required')`; `new BadRequestException( 'Only image files are allowed for onboarding assets', )`.

<a id="endpoint-post-vendors-me-verification-requests"></a>

### POST /api/v1/vendors/me/verification-requests

UI groups: V24. Source status: IMPLEMENTED.

Controller: [VendorsController.submitVerificationRequest](../../christinacormie-backend/src/modules/vendors/vendors.controller.ts#L791).

Auth: Bearer access JWT required; roles VENDOR. Current decorators: `UseGuards(JwtAuthGuard, RolesGuard)`; `Roles(UserRole.VENDOR)`.

Request parameters: `@CurrentUser() user: AuthenticatedUser`; `@Body() dto: SubmitVerificationRequestDto`.

Inventory field index: `body.type required: VendorVerificationDocumentType`; `body.url required: string - Cloudinary file URL returned by POST /api/v1/vendors/me/verification-requests/upload`; `body.documents required: VerificationDocumentDto[]`; `body.notes optional: string`.

Response implementation: [VendorsService.submitVerificationRequest](../../christinacormie-backend/src/modules/vendors/vendors.service.ts#L396).

Response surface / delegation: `{ ...result, message, verificationRequirements }`.

Repository references: [VendorsRepository.findByUserId](../../christinacormie-backend/src/modules/vendors/vendors.repository.ts#L14); [VendorsRepository.vendorInclude](../../christinacormie-backend/src/modules/vendors/vendors.repository.ts#L867); [VendorsRepository.submitVerificationRequest](../../christinacormie-backend/src/modules/vendors/vendors.repository.ts#L476); [NotificationsRepository.findAdminUserIds](../../christinacormie-backend/src/modules/notifications/notifications.repository.ts#L193); [NotificationsRepository.findRecentForUser](../../christinacormie-backend/src/modules/notifications/notifications.repository.ts#L84); [NotificationsRepository.create](../../christinacormie-backend/src/modules/notifications/notifications.repository.ts#L206).

Success HTTP status: 201 (Nest default unless overridden). Service path exceptions: `new ForbiddenException('Vendor already has the Bite Drop Verified badge')`; `new BadRequestException( 'Vendor state is required before submitting verification documents', )`; `new NotFoundException('Vendor profile not found')`; `new BadRequestException( 'Duplicate verification document types are not allowed', )`; ``new BadRequestException( `Missing required verification documents: ${missingDocumentTypes.join(', ')}`, )``.

<a id="endpoint-post-vendors-me-verification-requests-upload"></a>

### POST /api/v1/vendors/me/verification-requests/upload

UI groups: V24. Source status: IMPLEMENTED.

Controller: [VendorsController.uploadVerificationDocument](../../christinacormie-backend/src/modules/vendors/vendors.controller.ts#L898).

Auth: Bearer access JWT required; roles VENDOR. Current decorators: `UseGuards(JwtAuthGuard, RolesGuard)`; `Roles(UserRole.VENDOR)`.

Request parameters: `@CurrentUser() user: AuthenticatedUser`; `@UploadedFile() file: Express.Multer.File`.

Inventory field index: `body.file required: binary - Multipart file upload`.

Response implementation: [VendorsService.uploadVerificationDocument](../../christinacormie-backend/src/modules/vendors/vendors.service.ts#L708).

Response surface / delegation: `{ url, publicId, format, bytes, resourceType, originalFilename }`.

Repository references: [VendorsRepository.findByUserId](../../christinacormie-backend/src/modules/vendors/vendors.repository.ts#L14); [VendorsRepository.vendorInclude](../../christinacormie-backend/src/modules/vendors/vendors.repository.ts#L867).

Success HTTP status: 201 (Nest default unless overridden). Service path exceptions: `new NotFoundException('Vendor profile not found')`; `new BadRequestException( 'Cloudinary is not configured. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET.', )`; `new BadRequestException('File upload is required')`.

## Backend operations outside selected UI mappings

These current routes were also verified against controllers. They have no selected complete UI flow or are alternative lower-level contracts. Do not implement them without a corresponding approved requirement.

| Method | Path                                                                  | Role / authentication                    | Implementation source                                                                                                                          |
| ------ | --------------------------------------------------------------------- | ---------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| GET    | /                                                                     | public/optional JWT; service constraints | [AppController.getHome](../../christinacormie-backend/src/app.controller.ts#L5)                                                                |
| GET    | /api/v1/admin/users                                                   | JWT; ADMIN                               | [AdminController.listUsers](../../christinacormie-backend/src/modules/admin/admin.controller.ts#L51)                                           |
| PATCH  | /api/v1/admin/users/:userId/account-status                            | JWT; ADMIN                               | [AdminController.updateUserStatus](../../christinacormie-backend/src/modules/admin/admin.controller.ts#L69)                                    |
| GET    | /api/v1/admin/vendors/pending-approval                                | JWT; ADMIN                               | [AdminController.getPendingApprovalVendors](../../christinacormie-backend/src/modules/admin/admin.controller.ts#L97)                           |
| GET    | /api/v1/admin/vendors                                                 | JWT; ADMIN                               | [AdminController.listVendors](../../christinacormie-backend/src/modules/admin/admin.controller.ts#L103)                                        |
| PATCH  | /api/v1/admin/vendors/:vendorId/suspend                               | JWT; ADMIN                               | [AdminController.suspendVendor](../../christinacormie-backend/src/modules/admin/admin.controller.ts#L141)                                      |
| PATCH  | /api/v1/admin/vendors/:vendorId/retrieve                              | JWT; ADMIN                               | [AdminController.retrieveVendor](../../christinacormie-backend/src/modules/admin/admin.controller.ts#L150)                                     |
| DELETE | /api/v1/admin/vendors/:vendorId/badges/:badgeId                       | JWT; ADMIN                               | [AdminController.removeVendorBadge](../../christinacormie-backend/src/modules/admin/admin.controller.ts#L159)                                  |
| GET    | /api/v1/admin/verification-requests                                   | JWT; ADMIN                               | [AdminController.listVerificationRequests](../../christinacormie-backend/src/modules/admin/admin.controller.ts#L169)                           |
| PATCH  | /api/v1/admin/verification-requests/:requestId/documents/:documentKey | JWT; ADMIN                               | [AdminController.updateVerificationDocument](../../christinacormie-backend/src/modules/admin/admin.controller.ts#L181)                         |
| GET    | /api/v1/admin/food-trucks                                             | JWT; ADMIN                               | [AdminController.listFoodTrucks](../../christinacormie-backend/src/modules/admin/admin.controller.ts#L197)                                     |
| GET    | /api/v1/admin/food-trucks/:foodTruckId                                | JWT; ADMIN                               | [AdminController.getFoodTruck](../../christinacormie-backend/src/modules/admin/admin.controller.ts#L203)                                       |
| PATCH  | /api/v1/admin/food-trucks/:foodTruckId                                | JWT; ADMIN                               | [AdminController.updateFoodTruck](../../christinacormie-backend/src/modules/admin/admin.controller.ts#L209)                                    |
| GET    | /api/v1/admin/bookings                                                | JWT; ADMIN                               | [AdminController.listBookings](../../christinacormie-backend/src/modules/admin/admin.controller.ts#L219)                                       |
| GET    | /api/v1/admin/payments                                                | JWT; ADMIN                               | [AdminController.listPayments](../../christinacormie-backend/src/modules/admin/admin.controller.ts#L256)                                       |
| PATCH  | /api/v1/admin/payouts/:payoutId/approve                               | JWT; ADMIN                               | [AdminController.approvePayout](../../christinacormie-backend/src/modules/admin/admin.controller.ts#L268)                                      |
| POST   | /api/v1/admin/payouts/:payoutId/retry                                 | JWT; ADMIN                               | [AdminController.retryPayout](../../christinacormie-backend/src/modules/admin/admin.controller.ts#L279)                                        |
| PATCH  | /api/v1/admin/payouts/:payoutId/reject                                | JWT; ADMIN                               | [AdminController.rejectPayout](../../christinacormie-backend/src/modules/admin/admin.controller.ts#L288)                                       |
| PATCH  | /api/v1/admin/payouts/:payoutId/hold                                  | JWT; ADMIN                               | [AdminController.holdPayout](../../christinacormie-backend/src/modules/admin/admin.controller.ts#L301)                                         |
| GET    | /api/v1/admin/commissions                                             | JWT; ADMIN                               | [AdminController.listCommissions](../../christinacormie-backend/src/modules/admin/admin.controller.ts#L314)                                    |
| GET    | /api/v1/admin/refunds                                                 | JWT; ADMIN                               | [AdminController.listRefunds](../../christinacormie-backend/src/modules/admin/admin.controller.ts#L320)                                        |
| GET    | /api/v1/admin/reviews                                                 | JWT; ADMIN                               | [AdminController.listReviews](../../christinacormie-backend/src/modules/admin/admin.controller.ts#L326)                                        |
| PATCH  | /api/v1/admin/reviews/:reviewId/moderation                            | JWT; ADMIN                               | [AdminController.moderateReview](../../christinacormie-backend/src/modules/admin/admin.controller.ts#L338)                                     |
| DELETE | /api/v1/admin/reviews/:reviewId                                       | JWT; ADMIN                               | [AdminController.removeReviewCompletely](../../christinacormie-backend/src/modules/admin/admin.controller.ts#L348)                             |
| PATCH  | /api/v1/admin/reviews/:reviewId/hide-text                             | JWT; ADMIN                               | [AdminController.hideReviewTextOnly](../../christinacormie-backend/src/modules/admin/admin.controller.ts#L357)                                 |
| PATCH  | /api/v1/admin/reviews/:reviewId/keep                                  | JWT; ADMIN                               | [AdminController.keepReview](../../christinacormie-backend/src/modules/admin/admin.controller.ts#L366)                                         |
| GET    | /api/v1/admin/community/requests                                      | JWT; ADMIN                               | [AdminController.listCommunityRequests](../../christinacormie-backend/src/modules/admin/admin.controller.ts#L375)                              |
| PATCH  | /api/v1/admin/community/requests/:requestId                           | JWT; ADMIN                               | [AdminController.moderateCommunityRequest](../../christinacormie-backend/src/modules/admin/admin.controller.ts#L387)                           |
| DELETE | /api/v1/admin/community/requests/:requestId                           | JWT; ADMIN                               | [AdminController.removeCommunityRequest](../../christinacormie-backend/src/modules/admin/admin.controller.ts#L397)                             |
| DELETE | /api/v1/admin/community/comments/:commentId                           | JWT; ADMIN                               | [AdminController.deleteCommunityComment](../../christinacormie-backend/src/modules/admin/admin.controller.ts#L406)                             |
| GET    | /api/v1/admin/markets                                                 | JWT; ADMIN                               | [AdminController.listMarkets](../../christinacormie-backend/src/modules/admin/admin.controller.ts#L415)                                        |
| POST   | /api/v1/admin/markets                                                 | JWT; ADMIN                               | [AdminController.createMarket](../../christinacormie-backend/src/modules/admin/admin.controller.ts#L421)                                       |
| PATCH  | /api/v1/admin/markets/:marketId                                       | JWT; ADMIN                               | [AdminController.updateMarket](../../christinacormie-backend/src/modules/admin/admin.controller.ts#L430)                                       |
| GET    | /api/v1/admin/leaderboard-rules                                       | JWT; ADMIN                               | [AdminController.listLeaderboardRules](../../christinacormie-backend/src/modules/admin/admin.controller.ts#L456)                               |
| POST   | /api/v1/admin/leaderboard-rules                                       | JWT; ADMIN                               | [AdminController.createLeaderboardRule](../../christinacormie-backend/src/modules/admin/admin.controller.ts#L462)                              |
| PATCH  | /api/v1/admin/leaderboard-rules/:ruleId                               | JWT; ADMIN                               | [AdminController.updateLeaderboardRule](../../christinacormie-backend/src/modules/admin/admin.controller.ts#L471)                              |
| GET    | /api/v1/admin/leaderboards                                            | JWT; ADMIN                               | [AdminController.listLeaderboards](../../christinacormie-backend/src/modules/admin/admin.controller.ts#L481)                                   |
| GET    | /api/v1/admin/analytics/overview                                      | JWT; ADMIN                               | [AdminController.getOverviewAnalytics](../../christinacormie-backend/src/modules/admin/admin.controller.ts#L499)                               |
| GET    | /api/v1/admin/analytics/bookings                                      | JWT; ADMIN                               | [AdminController.getBookingsAnalytics](../../christinacormie-backend/src/modules/admin/admin.controller.ts#L505)                               |
| GET    | /api/v1/admin/analytics/payments                                      | JWT; ADMIN                               | [AdminController.getPaymentsAnalytics](../../christinacormie-backend/src/modules/admin/admin.controller.ts#L511)                               |
| GET    | /api/v1/admin/analytics/vendors                                       | JWT; ADMIN                               | [AdminController.getVendorsAnalytics](../../christinacormie-backend/src/modules/admin/admin.controller.ts#L517)                                |
| POST   | /api/v1/auth/staff/login                                              | public/optional JWT; service constraints | [AuthController.staffLogin](../../christinacormie-backend/src/modules/auth/auth.controller.ts#L381)                                            |
| POST   | /api/v1/auth/forgot-password                                          | public/optional JWT; service constraints | [AuthController.forgotPassword](../../christinacormie-backend/src/modules/auth/auth.controller.ts#L416)                                        |
| POST   | /api/v1/auth/verify-reset-code                                        | public/optional JWT; service constraints | [AuthController.verifyResetCode](../../christinacormie-backend/src/modules/auth/auth.controller.ts#L477)                                       |
| POST   | /api/v1/auth/reset-password                                           | public/optional JWT; service constraints | [AuthController.resetPassword](../../christinacormie-backend/src/modules/auth/auth.controller.ts#L516)                                         |
| POST   | /api/v1/auth/firebase                                                 | public/optional JWT; service constraints | [AuthController.loginWithFirebase](../../christinacormie-backend/src/modules/auth/auth.controller.ts#L556)                                     |
| POST   | /api/v1/auth/me/become-vendor                                         | JWT; service constraints                 | [AuthController.becomeVendor](../../christinacormie-backend/src/modules/auth/auth.controller.ts#L609)                                          |
| GET    | /api/v1/qr/:code/profile                                              | public/optional JWT; service constraints | [CheckInsController.getQrProfile](../../christinacormie-backend/src/modules/check-ins/check-ins.controller.ts#L144)                            |
| POST   | /api/v1/qr/:code/scans                                                | public/optional JWT; service constraints | [CheckInsController.recordAnonymousQrScan](../../christinacormie-backend/src/modules/check-ins/check-ins.controller.ts#L167)                   |
| POST   | /api/v1/qr/:code/scans/authenticated                                  | JWT; service constraints                 | [CheckInsController.recordAuthenticatedQrScan](../../christinacormie-backend/src/modules/check-ins/check-ins.controller.ts#L206)               |
| POST   | /api/v1/qr/:code/check-ins                                            | JWT; service constraints                 | [CheckInsController.createCheckIn](../../christinacormie-backend/src/modules/check-ins/check-ins.controller.ts#L250)                           |
| GET    | /api/v1/check-ins/food-trucks/:foodTruckId/qr-analytics               | JWT; VENDOR                              | [CheckInAnalyticsController.getQrAnalytics](../../christinacormie-backend/src/modules/check-ins/check-ins.controller.ts#L316)                  |
| GET    | /api/v1/community/posts/:postId                                       | JWT; service constraints                 | [CommunityPostsController.details](../../christinacormie-backend/src/modules/community/community-posts.controller.ts#L257)                     |
| POST   | /api/v1/community/food-trucks/:foodTruckId/requests                   | JWT; service constraints                 | [CommunityController.createPrivateTruckRequest](../../christinacormie-backend/src/modules/community/community.controller.ts#L89)               |
| GET    | /api/v1/food-trucks/drops/nearby                                      | public/optional JWT; service constraints | [FoodTrucksController.getNearbyActiveDrops](../../christinacormie-backend/src/modules/food-trucks/food-trucks.controller.ts#L287)              |
| GET    | /api/v1/food-trucks/drops/today                                       | public/optional JWT; service constraints | [FoodTrucksController.getTodaysDrops](../../christinacormie-backend/src/modules/food-trucks/food-trucks.controller.ts#L310)                    |
| POST   | /api/v1/food-trucks/draft                                             | JWT; VENDOR                              | [FoodTrucksController.createDraft](../../christinacormie-backend/src/modules/food-trucks/food-trucks.controller.ts#L435)                       |
| PATCH  | /api/v1/food-trucks/:id/draft                                         | JWT; VENDOR                              | [FoodTrucksController.updateDraft](../../christinacormie-backend/src/modules/food-trucks/food-trucks.controller.ts#L475)                       |
| PUT    | /api/v1/food-trucks/:id/cuisines                                      | JWT; VENDOR                              | [FoodTrucksController.setCuisines](../../christinacormie-backend/src/modules/food-trucks/food-trucks.controller.ts#L614)                       |
| PATCH  | /api/v1/food-trucks/:id/menu-categories/:categoryId                   | JWT; VENDOR                              | [FoodTrucksController.updateMenuCategory](../../christinacormie-backend/src/modules/food-trucks/food-trucks.controller.ts#L780)                |
| PATCH  | /api/v1/food-trucks/:id/service-area                                  | JWT; VENDOR                              | [FoodTrucksController.setupServiceArea](../../christinacormie-backend/src/modules/food-trucks/food-trucks.controller.ts#L954)                  |
| PATCH  | /api/v1/food-trucks/:id/guest-capacity                                | JWT; VENDOR                              | [FoodTrucksController.updateGuestCapacity](../../christinacormie-backend/src/modules/food-trucks/food-trucks.controller.ts#L1013)              |
| PUT    | /api/v1/food-trucks/:id/operating-hours                               | JWT; VENDOR                              | [FoodTrucksController.setOperatingHours](../../christinacormie-backend/src/modules/food-trucks/food-trucks.controller.ts#L1370)                |
| POST   | /api/v1/food-trucks/:id/availability-exceptions                       | JWT; VENDOR                              | [FoodTrucksController.createAvailabilityException](../../christinacormie-backend/src/modules/food-trucks/food-trucks.controller.ts#L1421)      |
| PATCH  | /api/v1/food-trucks/:id/availability-exceptions/:exceptionId          | JWT; VENDOR                              | [FoodTrucksController.updateAvailabilityException](../../christinacormie-backend/src/modules/food-trucks/food-trucks.controller.ts#L1475)      |
| GET    | /api/v1/leaderboards                                                  | public/optional JWT; service constraints | [LeaderboardsController.getLeaderboards](../../christinacormie-backend/src/modules/leaderboards/leaderboards.controller.ts#L104)               |
| GET    | /api/v1/leaderboards/:leaderboardId                                   | public/optional JWT; service constraints | [LeaderboardsController.getLeaderboardById](../../christinacormie-backend/src/modules/leaderboards/leaderboards.controller.ts#L219)            |
| GET    | /api/v1/payments/connect/return                                       | public/optional JWT; service constraints | [PaymentsController.getConnectReturnPage](../../christinacormie-backend/src/modules/payments/payments.controller.ts#L93)                       |
| GET    | /api/v1/payments/connect/refresh                                      | public/optional JWT; service constraints | [PaymentsController.getConnectRefreshPage](../../christinacormie-backend/src/modules/payments/payments.controller.ts#L108)                     |
| POST   | /api/v1/payments/:paymentId/refunds                                   | JWT; VENDOR                              | [PaymentsController.createRefund](../../christinacormie-backend/src/modules/payments/payments.controller.ts#L391)                              |
| POST   | /api/v1/payments/webhooks/stripe                                      | public/optional JWT; service constraints | [StripeWebhookController.handleStripeWebhook](../../christinacormie-backend/src/modules/payments/stripe-webhook.controller.ts#L18)             |
| POST   | /api/v1/promotions/:promotionId/redeem                                | JWT; service constraints                 | [PromotionsController.redeemPromotion](../../christinacormie-backend/src/modules/promotions/promotions.controller.ts#L290)                     |
| GET    | /api/v1/promotions/:promotionId/analytics                             | JWT; VENDOR                              | [PromotionsController.getPromotionAnalytics](../../christinacormie-backend/src/modules/promotions/promotions.controller.ts#L346)               |
| POST   | /api/v1/referrals/apply                                               | JWT; service constraints                 | [ReferralsController.applyCode](../../christinacormie-backend/src/modules/referrals/referrals.controller.ts#L160)                              |
| PATCH  | /api/v1/admin/referrals/:referralId/qualify                           | JWT; ADMIN                               | [ReferralsController.qualifyReferral](../../christinacormie-backend/src/modules/referrals/referrals.controller.ts#L207)                        |
| POST   | /api/v1/reviews                                                       | JWT; service constraints                 | [ReviewsController.createReview](../../christinacormie-backend/src/modules/reviews/reviews.controller.ts#L136)                                 |
| PATCH  | /api/v1/reviews/reports/:reportId                                     | JWT; ADMIN                               | [ReviewsController.resolveReport](../../christinacormie-backend/src/modules/reviews/reviews.controller.ts#L194)                                |
| PATCH  | /api/v1/reviews/:reviewId/vendor-response                             | JWT; VENDOR                              | [ReviewsController.respondToReview](../../christinacormie-backend/src/modules/reviews/reviews.controller.ts#L241)                              |
| POST   | /api/v1/reviews/:reviewId/reports                                     | JWT; service constraints                 | [ReviewsController.reportReview](../../christinacormie-backend/src/modules/reviews/reviews.controller.ts#L292)                                 |
| PATCH  | /api/v1/reviews/:reviewId/moderation                                  | JWT; ADMIN                               | [ReviewsController.moderateReview](../../christinacormie-backend/src/modules/reviews/reviews.controller.ts#L329)                               |
| GET    | /api/v1/rewards/me/loyalty                                            | JWT; service constraints                 | [RewardsController.getMyLoyaltyAccount](../../christinacormie-backend/src/modules/rewards/rewards.controller.ts#L266)                          |
| GET    | /api/v1/rewards/me/redemptions                                        | JWT; service constraints                 | [RewardsController.listMyConfirmedRedemptionsForReview](../../christinacormie-backend/src/modules/rewards/rewards.controller.ts#L304)          |
| POST   | /api/v1/rewards/redeem                                                | JWT; service constraints                 | [RewardsController.redeemReward](../../christinacormie-backend/src/modules/rewards/rewards.controller.ts#L344)                                 |
| POST   | /api/v1/rewards/me/daily-streak                                       | JWT; service constraints                 | [RewardsController.claimDailyStreak](../../christinacormie-backend/src/modules/rewards/rewards.controller.ts#L380)                             |
| POST   | /api/v1/rewards/me/birthday-bonus                                     | JWT; service constraints                 | [RewardsController.claimBirthdayBonus](../../christinacormie-backend/src/modules/rewards/rewards.controller.ts#L410)                           |
| POST   | /api/v1/rewards/me/redemption-codes                                   | JWT; service constraints                 | [RewardsController.createRedemptionCode](../../christinacormie-backend/src/modules/rewards/rewards.controller.ts#L447)                         |
| POST   | /api/v1/vendors/me/redemptions/confirm                                | JWT; VENDOR, VENDOR_STAFF                | [RewardsController.confirmVendorRedemption](../../christinacormie-backend/src/modules/rewards/rewards.controller.ts#L500)                      |
| GET    | /api/v1/badges                                                        | JWT; service constraints                 | [RewardsController.listBadges](../../christinacormie-backend/src/modules/rewards/rewards.controller.ts#L569)                                   |
| GET    | /api/v1/rewards/me/badges                                             | JWT; service constraints                 | [RewardsController.listMyCustomerBadges](../../christinacormie-backend/src/modules/rewards/rewards.controller.ts#L586)                         |
| GET    | /api/v1/rewards/me/vendor-badges                                      | JWT; VENDOR                              | [RewardsController.listMyVendorBadges](../../christinacormie-backend/src/modules/rewards/rewards.controller.ts#L603)                           |
| POST   | /api/v1/admin/rewards/rules                                           | JWT; ADMIN                               | [RewardsController.createRewardRule](../../christinacormie-backend/src/modules/rewards/rewards.controller.ts#L641)                             |
| PATCH  | /api/v1/admin/rewards/rules/:rewardRuleId                             | JWT; ADMIN                               | [RewardsController.updateRewardRule](../../christinacormie-backend/src/modules/rewards/rewards.controller.ts#L678)                             |
| POST   | /api/v1/admin/rewards/points                                          | JWT; ADMIN                               | [RewardsController.awardPoints](../../christinacormie-backend/src/modules/rewards/rewards.controller.ts#L722)                                  |
| POST   | /api/v1/admin/badges                                                  | JWT; ADMIN                               | [RewardsController.createBadge](../../christinacormie-backend/src/modules/rewards/rewards.controller.ts#L761)                                  |
| POST   | /api/v1/admin/users/:userId/badges                                    | JWT; ADMIN                               | [RewardsController.awardCustomerBadge](../../christinacormie-backend/src/modules/rewards/rewards.controller.ts#L797)                           |
| POST   | /api/v1/admin/vendors/:vendorId/badges                                | JWT; ADMIN                               | [RewardsController.awardVendorBadge](../../christinacormie-backend/src/modules/rewards/rewards.controller.ts#L839)                             |
| GET    | /api/v1/social/admin/places                                           | JWT; ADMIN                               | [SocialController.listAdminPlaces](../../christinacormie-backend/src/modules/social/social.controller.ts#L239)                                 |
| POST   | /api/v1/social/admin/places                                           | JWT; ADMIN                               | [SocialController.createPlace](../../christinacormie-backend/src/modules/social/social.controller.ts#L246)                                     |
| PATCH  | /api/v1/social/admin/places/:placeId                                  | JWT; ADMIN                               | [SocialController.updatePlace](../../christinacormie-backend/src/modules/social/social.controller.ts#L253)                                     |
| GET    | /api/v1/social/profiles/:userId/followers                             | JWT; service constraints                 | [SocialController.listFollowers](../../christinacormie-backend/src/modules/social/social.controller.ts#L305)                                   |
| PATCH  | /api/v1/social/food-trucks/:foodTruckId/follow/notifications          | JWT; service constraints                 | [SocialController.updateFollowNotifications](../../christinacormie-backend/src/modules/social/social.controller.ts#L422)                       |
| GET    | /api/v1/social/posts/mine                                             | JWT; service constraints                 | [SocialController.getMyPosts](../../christinacormie-backend/src/modules/social/social.controller.ts#L607)                                      |
| PATCH  | /api/v1/social/posts/:postId                                          | JWT; service constraints                 | [SocialController.updatePost](../../christinacormie-backend/src/modules/social/social.controller.ts#L633)                                      |
| DELETE | /api/v1/social/posts/:postId                                          | JWT; service constraints                 | [SocialController.deletePost](../../christinacormie-backend/src/modules/social/social.controller.ts#L687)                                      |
| GET    | /api/v1/social/posts/:postId                                          | JWT; service constraints                 | [SocialController.getPostDetail](../../christinacormie-backend/src/modules/social/social.controller.ts#L724)                                   |
| POST   | /api/v1/social/posts/:postId/save                                     | JWT; service constraints                 | [SocialController.savePost](../../christinacormie-backend/src/modules/social/social.controller.ts#L898)                                        |
| POST   | /api/v1/subscriptions/revenuecat/sync                                 | JWT; VENDOR                              | [SubscriptionsController.syncRevenueCat](../../christinacormie-backend/src/modules/subscriptions/subscriptions.controller.ts#L86)              |
| POST   | /api/v1/subscriptions/webhooks/revenuecat                             | public/optional JWT; service constraints | [SubscriptionsController.handleRevenueCatWebhook](../../christinacormie-backend/src/modules/subscriptions/subscriptions.controller.ts#L101)    |
| GET    | /api/v1/admin/subscriptions/plans                                     | JWT; ADMIN                               | [AdminSubscriptionsController.listPlans](../../christinacormie-backend/src/modules/subscriptions/subscriptions.controller.ts#L143)             |
| PATCH  | /api/v1/admin/subscriptions/plans/:planId                             | JWT; ADMIN                               | [AdminSubscriptionsController.updatePlan](../../christinacormie-backend/src/modules/subscriptions/subscriptions.controller.ts#L149)            |
| POST   | /api/v1/admin/subscriptions/plans/:planId/provider-products           | JWT; ADMIN                               | [AdminSubscriptionsController.upsertProviderProduct](../../christinacormie-backend/src/modules/subscriptions/subscriptions.controller.ts#L158) |
| GET    | /api/v1/admin/subscriptions/founding-offer                            | JWT; ADMIN                               | [AdminSubscriptionsController.getFoundingOffer](../../christinacormie-backend/src/modules/subscriptions/subscriptions.controller.ts#L167)      |
| PATCH  | /api/v1/admin/subscriptions/founding-offer                            | JWT; ADMIN                               | [AdminSubscriptionsController.updateFoundingOffer](../../christinacormie-backend/src/modules/subscriptions/subscriptions.controller.ts#L173)   |
| GET    | /api/v1/users/interest-cuisines                                       | public/optional JWT; service constraints | [UsersController.listInterestCuisines](../../christinacormie-backend/src/modules/users/users.controller.ts#L174)                               |
| PATCH  | /api/v1/users/me/interests                                            | JWT; service constraints                 | [UsersController.setInterestCuisines](../../christinacormie-backend/src/modules/users/users.controller.ts#L226)                                |
| POST   | /api/v1/users/me/device-tokens                                        | JWT; service constraints                 | [UsersController.registerDeviceToken](../../christinacormie-backend/src/modules/users/users.controller.ts#L273)                                |
| DELETE | /api/v1/users/me/device-tokens/:id                                    | JWT; service constraints                 | [UsersController.removeDeviceToken](../../christinacormie-backend/src/modules/users/users.controller.ts#L319)                                  |
| PATCH  | /api/v1/users/me/settings                                             | JWT; service constraints                 | [UsersController.updateSettings](../../christinacormie-backend/src/modules/users/users.controller.ts#L478)                                     |
| PATCH  | /api/v1/users/me/notification-preferences                             | JWT; service constraints                 | [UsersController.updateNotificationPreferences](../../christinacormie-backend/src/modules/users/users.controller.ts#L523)                      |
| PATCH  | /api/v1/users/:id/account-status                                      | JWT; ADMIN                               | [UsersController.updateAccountStatus](../../christinacormie-backend/src/modules/users/users.controller.ts#L615)                                |
| PATCH  | /api/v1/vendors/me                                                    | JWT; VENDOR                              | [VendorsController.updateMyVendorProfile](../../christinacormie-backend/src/modules/vendors/vendors.controller.ts#L629)                        |
| POST   | /api/v1/vendors/me/onboarding                                         | JWT; VENDOR                              | [VendorsController.completeOnboarding](../../christinacormie-backend/src/modules/vendors/vendors.controller.ts#L672)                           |
| GET    | /api/v1/admin/photo-shoot-requests                                    | JWT; ADMIN                               | [VendorsController.getPhotoShootRequests](../../christinacormie-backend/src/modules/vendors/vendors.controller.ts#L955)                        |
| PATCH  | /api/v1/admin/photo-shoot-requests/:id                                | JWT; ADMIN                               | [VendorsController.updatePhotoShootRequest](../../christinacormie-backend/src/modules/vendors/vendors.controller.ts#L977)                      |
| PATCH  | /api/v1/admin/vendors/:id/approve                                     | JWT; ADMIN                               | [VendorsController.approveVendor](../../christinacormie-backend/src/modules/vendors/vendors.controller.ts#L1015)                               |
| PATCH  | /api/v1/admin/vendors/:id/reject                                      | JWT; ADMIN                               | [VendorsController.rejectVendor](../../christinacormie-backend/src/modules/vendors/vendors.controller.ts#L1046)                                |

## Exact request validation catalogue

Current DTO declarations with documentation-only decorators removed. Retained transformations, validation arguments, TypeScript optionality and inheritance are source evidence. Inline controller bodies/queries appear in endpoint cards. Service conditions still apply (booking windows, financial calculations, community categories). Referenced request enums follow.

### AcceptBookingQuoteDto

[src/modules/bookings/dto/accept-booking-quote.dto.ts](../../christinacormie-backend/src/modules/bookings/dto/accept-booking-quote.dto.ts#L5)

```text
@IsOptional() @Type(() => Number) @IsInt() @Min(5) @Max(120) paymentWindowMinutes?: number;
```

### AddTruckImageDto

[src/modules/food-trucks/dto/add-truck-image.dto.ts](../../christinacormie-backend/src/modules/food-trucks/dto/add-truck-image.dto.ts#L10)

```text
@IsUrl() imageUrl: string;
@IsOptional() @IsString() @MaxLength(255) altText?: string;
@IsOptional() @IsInt() @Min(0) sortOrder?: number;
```

### AdminListQueryDto

[src/modules/admin/dto/admin-list-query.dto.ts](../../christinacormie-backend/src/modules/admin/dto/admin-list-query.dto.ts#L5)

```text
@IsOptional() @IsString() search?: string;
@IsOptional() @IsString() status?: string;
@IsOptional() @IsString() category?: string;
@IsOptional() @IsIn(['createdAt', 'updatedAt', 'name', 'status']) sortBy?: string;
@IsOptional() @IsIn(['asc', 'desc']) sortOrder?: 'asc' | 'desc';
@IsOptional() @Type(() => Number) @IsInt() @Min(1) limit?: number;
@IsOptional() @Type(() => Number) @IsInt() @Min(0) offset?: number;
```

### BasicMenuCategoryDto

[src/modules/food-trucks/dto/setup-basic-menu.dto.ts](../../christinacormie-backend/src/modules/food-trucks/dto/setup-basic-menu.dto.ts#L63)

```text
@IsString() @MaxLength(150) name: string;
@IsOptional() @IsString() description?: string;
@IsOptional() @IsInt() @Min(0) sortOrder?: number;
@IsArray() @ValidateNested({ each: true }) @Type(() => BasicMenuItemDto) items: BasicMenuItemDto[];
```

### BasicMenuItemDto

[src/modules/food-trucks/dto/setup-basic-menu.dto.ts](../../christinacormie-backend/src/modules/food-trucks/dto/setup-basic-menu.dto.ts#L16)

```text
@IsString() @MaxLength(255) name: string;
@IsOptional() @IsString() description?: string;
@IsOptional() @IsUrl() imageUrl?: string;
@IsNumber() @Min(0) price: number;
@IsOptional() @IsBoolean() isVegetarian?: boolean;
@IsOptional() @IsBoolean() isVegan?: boolean;
@IsOptional() @IsBoolean() isGlutenFree?: boolean;
@IsOptional() @IsInt() @Min(0) sortOrder?: number;
```

### BookingIssueDto

[src/modules/bookings/dto/booking-issue.dto.ts](../../christinacormie-backend/src/modules/bookings/dto/booking-issue.dto.ts#L5)

```text
@Transform(({ value }) => (typeof value === 'string' ? value.trim() : value)) @IsString() @IsNotEmpty({ message: 'Please describe the issue' }) @MaxLength(2000, { message: 'Issue message must be 2000 characters or less', }) message: string;
```

### BookingIssueMessageDto

[src/modules/bookings/dto/booking-issue.dto.ts](../../christinacormie-backend/src/modules/bookings/dto/booking-issue.dto.ts#L18)

```text
@Transform(({ value }) => (typeof value === 'string' ? value.trim() : value)) @IsString() @IsNotEmpty({ message: 'Please enter a message' }) @MaxLength(2000, { message: 'Message must be 2000 characters or less', }) message: string;
```

### ChangePasswordDto

[src/modules/auth/dto/change-password.dto.ts](../../christinacormie-backend/src/modules/auth/dto/change-password.dto.ts#L10)

```text
@IsString() @IsNotEmpty() currentPassword: string;
@IsString() @MinLength(8, { message: 'New password must be at least 8 characters long' }) @Matches(/((?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/, { message: 'New password is too weak. It must contain uppercase, lowercase, and a number or special character', }) newPassword: string;
@IsOptional() @IsString() confirmNewPassword?: string;
```

### CommentPostDto

[src/modules/social/dto/comment-post.dto.ts](../../christinacormie-backend/src/modules/social/dto/comment-post.dto.ts#L4)

```text
@IsString() content: string;
@IsOptional() @IsUUID() parentCommentId?: string;
```

### CommentRequestDto

[src/modules/community/dto/comment-request.dto.ts](../../christinacormie-backend/src/modules/community/dto/comment-request.dto.ts#L11)

```text
@IsString() @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value)) @IsNotEmpty({ message: 'Comment cannot be empty' }) @MaxLength(2000) content: string;
@IsOptional() @IsUUID() parentCommentId?: string;
```

### CommunityInterestDto

[src/modules/community/dto/community-post-query.dto.ts](../../christinacormie-backend/src/modules/community/dto/community-post-query.dto.ts#L75)

```text
@Transform(({ value }) => (typeof value === 'string' ? value.trim() : value)) @IsString() @IsNotEmpty({ message: 'Please enter an introduction before sending interest', }) @MaxLength(2000) message: string;
```

### CommunityPostQueryDto

[src/modules/community/dto/community-post-query.dto.ts](../../christinacormie-backend/src/modules/community/dto/community-post-query.dto.ts#L22)

```text
@IsOptional() @IsEnum(CommunityPostCategory) category?: CommunityPostCategory;
@IsOptional() @IsEnum({ ALL: 'ALL', MINE: 'MINE', REQUESTS: 'REQUESTS' }) tab?: 'ALL' | 'MINE' | 'REQUESTS';
@IsOptional() @Type(() => Number) @IsLatitude() latitude?: number;
@IsOptional() @Type(() => Number) @IsLongitude() longitude?: number;
@IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(500) radiusKm?: number;
@IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(100) limit?: number;
@IsOptional() @Type(() => Number) @IsInt() @Min(0) @Max(100000) offset?: number;
```

### CreateBookingDto

[src/modules/bookings/dto/create-booking.dto.ts](../../christinacormie-backend/src/modules/bookings/dto/create-booking.dto.ts#L49)

```text
@IsUUID() foodTruckId: string;
@IsOptional() @IsEnum(BookingTypeDto) bookingType?: BookingTypeDto;
@IsEnum(BookingEventTypeDto) eventType: BookingEventTypeDto;
@IsOptional() @IsUUID() communityRequestId?: string;
@IsOptional() @IsUUID() vendorOfferId?: string;
@IsOptional() @IsString() @MaxLength(255) eventName?: string;
@IsOptional() @IsString() eventDescription?: string;
@IsOptional() @IsString() @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'eventDate must use YYYY-MM-DD format', }) eventDate?: string;
@IsOptional() @IsString() @Matches(/^([01]\d|2[0-3]):[0-5]\d$/, { message: 'eventTime must use HH:mm 24-hour format', }) eventTime?: string;
@IsOptional() @IsString() @Matches(/^([01]\d|2[0-3]):[0-5]\d$/, { message: 'endTime must use HH:mm 24-hour format', }) endTime?: string;
@IsOptional() @IsString() @MaxLength(80) eventTimezone?: string;
@IsOptional() @IsISO8601({ strict: true }) startsAt?: string;
@IsOptional() @IsISO8601({ strict: true }) endsAt?: string;
@Type(() => Number) @IsInt() @Min(1) guestCount: number;
@IsString() address: string;
@IsPhoneNumber(undefined) contactPhone: string;
@Type(() => Number) @IsLatitude() latitude: number;
@Type(() => Number) @IsLongitude() longitude: number;
@IsOptional() @Type(() => Number) @IsNumber() @Min(0) budgetAmount?: number;
@IsOptional() @Type(() => Number) @IsNumber() @Min(0) subtotal?: number;
@IsOptional() @IsArray() @IsUUID('4', { each: true }) preferredMenuItemIds?: string[];
@IsOptional() @IsArray() @ArrayMaxSize(20, { message: 'customMenuItems cannot contain more than 20 items', }) @IsString({ each: true, message: 'Each custom menu item must be text' }) @MaxLength(150, { each: true, message: 'Each custom menu item cannot be longer than 150 characters', }) customMenuItems?: string[];
@IsOptional() @IsArray() @ArrayMaxSize(5) @IsUrl({}, { each: true }) referenceImageUrls?: string[];
@IsOptional() @IsEnum(BookingPaymentPreferenceDto) paymentPreference?: BookingPaymentPreferenceDto;
@IsOptional() @IsString() specialInstructions?: string;
@Equals(true, { message: 'You must confirm that you are 18 years or older', }) isAdultConfirmed: boolean;
@Equals(true, { message: 'You must agree to the BiteDrop Terms and Conditions', }) termsAccepted: boolean;
```

### CreateBookingPaymentDto

[src/modules/payments/dto/create-booking-payment.dto.ts](../../christinacormie-backend/src/modules/payments/dto/create-booking-payment.dto.ts#L4)

```text
@IsString() @MaxLength(255) idempotencyKey: string;
@IsOptional() @IsString() currency?: string;
```

### CreateBookingQuoteDto

[src/modules/bookings/dto/create-booking-quote.dto.ts](../../christinacormie-backend/src/modules/bookings/dto/create-booking-quote.dto.ts#L19)

```text
@IsOptional() @Type(() => Number) @IsNumber({ maxDecimalPlaces: 2 }) @Min(0.01) pricePerPerson?: number;
@IsOptional() @IsEnum(OfferPricingModelDto) pricingModel?: OfferPricingModelDto;
@IsOptional() @IsArray() @IsString({ each: true }) selectedMenuItems?: string[];
@IsOptional() @Type(() => Number) @IsNumber() @Min(0) baseServiceFee?: number;
@IsOptional() @Type(() => Number) @IsNumber() @Min(0) transportFee?: number;
@IsOptional() @IsArray() @ValidateNested({ each: true }) @Type(() => OfferExtraChargeDto) extraCharges?: OfferExtraChargeDto[];
@IsOptional() @Type(() => Number) @IsNumber() @Min(0) subtotal?: number;
@IsOptional() @Type(() => Number) @IsNumber() @Min(0) outsideRadiusFee?: number;
@IsOptional() @Type(() => Number) @IsNumber() @Min(0) serviceFee?: number;
@IsOptional() @Type(() => Number) @IsNumber() @Min(0) taxAmount?: number;
@IsOptional() @Type(() => Number) @IsNumber() @Min(0) discountAmount?: number;
@IsOptional() @IsEnum(BookingPaymentPreferenceDto) paymentPreference?: BookingPaymentPreferenceDto;
@IsOptional() @Type(() => Number) @IsNumber() @Min(0) depositAmount?: number;
@IsOptional() @Type(() => Number) @IsNumber() @Min(0) depositPercent?: number;
@IsOptional() @Type(() => Number) @IsNumber() @Min(0) totalAmount?: number;
@IsOptional() @Type(() => Number) @IsNumber() @Min(0) balanceDueAtEvent?: number;
@IsOptional() @IsString() message?: string;
@IsOptional() @IsString() noteToClient?: string;
@IsOptional() @IsString() terms?: string;
@IsOptional() @IsISO8601({ strict: true }) expiresAt?: string;
```

### CreateCommunityRequestDto

[src/modules/community/dto/create-community-request.dto.ts](../../christinacormie-backend/src/modules/community/dto/create-community-request.dto.ts#L47)

```text
@IsOptional() @IsEnum(CommunityPostCategory, { message: 'category must be NEED_TRUCK, VENDOR_CALLOUT, FOR_SALE, HIRING_JOBS, COMMUNITY_HELP, or COMMUNITY', }) category?: CommunityPostCategory;
@IsOptional() @IsInt() @Min(1) spotsOpen?: number;
@IsOptional() @IsInt() @Min(1) attendanceMin?: number;
@IsOptional() @IsInt() @Min(1) attendanceMax?: number;
@IsOptional() @IsEnum(RequestTypeDto) requestType?: RequestTypeDto;
@IsOptional() @IsEnum(CommunityEventTypeDto) eventType?: CommunityEventTypeDto;
@IsOptional() @IsString() @MaxLength(255) title?: string;
@IsOptional() @IsString() @MaxLength(5000) description?: string;
@IsOptional() @IsISO8601({ strict: true }) eventDate?: string;
@IsOptional() @IsString() @MaxLength(5) @Matches(TIME_PATTERN) startTime?: string;
@IsOptional() @IsString() @MaxLength(5) @Matches(TIME_PATTERN) endTime?: string;
@IsOptional() @IsString() @MaxLength(100) eventTimezone?: string;
@IsOptional() @Type(() => Number) @IsInt() @Min(1) guestCount?: number;
@IsOptional() @Type(() => Number) @IsNumber() @Min(0) budgetMin?: number;
@IsOptional() @Type(() => Number) @IsNumber() @Min(0) budgetMax?: number;
@IsOptional() @IsString() address?: string;
@IsOptional() @IsPhoneNumber(undefined) contactPhone?: string;
@IsOptional() @Type(() => Number) @IsLatitude() latitude?: number;
@IsOptional() @Type(() => Number) @IsLongitude() longitude?: number;
@IsOptional() @IsArray() @IsString({ each: true }) preferredCuisines?: string[];
@IsOptional() @IsArray() @IsString({ each: true }) @ArrayMaxSize(30, { message: 'You can select up to 30 preferred menu items' }) @MaxLength(150, { each: true }) preferredMenuItems?: string[];
@IsOptional() @IsBoolean() allowPublicComments?: boolean;
@IsOptional() @IsISO8601({ strict: true }) expiresAt?: string;
@IsOptional() @IsArray() @ValidateNested({ each: true }) @Type(() => RequestMediaDto) @ArrayMaxSize(5, { message: 'A Community post can contain at most 5 attachments', }) media?: RequestMediaDto[];
```

### CreateConnectAccountDto

[src/modules/payments/dto/create-connect-account.dto.ts](../../christinacormie-backend/src/modules/payments/dto/create-connect-account.dto.ts#L4)

```text
@IsOptional() @IsUrl() refreshUrl?: string;
@IsOptional() @IsUrl() returnUrl?: string;
@IsOptional() @IsString() country?: string;
```

### CreateDirectConversationDto

[src/modules/messaging/dto/create-direct-conversation.dto.ts](../../christinacormie-backend/src/modules/messaging/dto/create-direct-conversation.dto.ts#L4)

```text
@IsOptional() @IsUUID() participantUserId?: string;
@IsOptional() @IsUUID() vendorId?: string;
@IsOptional() @IsUUID() foodTruckId?: string;
@IsOptional() @IsString() @MaxLength(255) title?: string;
```

### CreateFoodTruckDropDto

[src/modules/food-trucks/dto/create-food-truck-drop.dto.ts](../../christinacormie-backend/src/modules/food-trucks/dto/create-food-truck-drop.dto.ts#L14)

```text
@Type(() => Number) @IsLatitude() latitude: number;
@Type(() => Number) @IsLongitude() longitude: number;
@IsOptional() @IsString() @MaxLength(255) title?: string;
@IsOptional() @IsString() message?: string;
@IsOptional() @IsString() address?: string;
@IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(1440) durationMinutes?: number;
```

### CreateMenuCategoryDto

[src/modules/food-trucks/dto/create-menu-category.dto.ts](../../christinacormie-backend/src/modules/food-trucks/dto/create-menu-category.dto.ts#L4)

```text
@IsString() @MaxLength(150) name: string;
@IsOptional() @IsString() description?: string;
@IsOptional() @IsInt() @Min(0) sortOrder?: number;
```

### CreateMenuItemDto

[src/modules/food-trucks/dto/create-menu-item.dto.ts](../../christinacormie-backend/src/modules/food-trucks/dto/create-menu-item.dto.ts#L12)

```text
@IsString() @MaxLength(255) name: string;
@IsOptional() @IsString() description?: string;
@IsOptional() @IsUrl() imageUrl?: string;
@IsNumber() @Min(0) price: number;
@IsOptional() @IsBoolean() isVegetarian?: boolean;
@IsOptional() @IsBoolean() isVegan?: boolean;
@IsOptional() @IsBoolean() isGlutenFree?: boolean;
@IsOptional() @IsNumber() @Min(0) sortOrder?: number;
```

### CreatePostDto

[src/modules/social/dto/create-post.dto.ts](../../christinacormie-backend/src/modules/social/dto/create-post.dto.ts#L21)

```text
@IsOptional() @IsUUID() foodTruckId?: string;
@IsOptional() @IsString() @MaxLength(2200) content?: string;
@IsOptional() @IsUUID() locationId?: string;
@IsOptional() @IsArray() @ArrayMaxSize(20) @IsUUID('4', { each: true }) taggedUserIds?: string[];
@IsOptional() @IsEnum(PostStatusDto) status?: PostStatusDto;
@IsOptional() @IsBoolean() isPromotion?: boolean;
@IsOptional() @IsBoolean() isFollowerOnly?: boolean;
@IsOptional() @IsArray() @ArrayMaxSize(10) @ValidateNested({ each: true }) @Type(() => PostMediaDto) media?: PostMediaDto[];
```

### CreatePromotionDto

[src/modules/promotions/dto/create-promotion.dto.ts](../../christinacormie-backend/src/modules/promotions/dto/create-promotion.dto.ts#L23)

```text
@IsUUID() foodTruckId: string;
@IsString() @MaxLength(255) title: string;
@IsOptional() @IsString() description?: string;
@IsEnum(PromotionTypeDto) type: PromotionTypeDto;
@IsOptional() @Type(() => Number) @IsNumber() @Min(0) value?: number;
@IsOptional() @IsString() @MaxLength(100) couponCode?: string;
@IsOptional() @Type(() => Number) @IsNumber() @Min(0) minimumSpend?: number;
@IsOptional() @Type(() => Number) @IsNumber() @Min(0) maximumDiscount?: number;
@IsOptional() @IsBoolean() isFollowerOnly?: boolean;
@IsOptional() @Type(() => Number) @IsInt() @Min(1) usageLimit?: number;
@IsISO8601({ strict: true }) startsAt: string;
@IsISO8601({ strict: true }) endsAt: string;
@IsOptional() @IsBoolean() isActive?: boolean;
```

### CreateReferralCodeDto

[src/modules/referrals/dto/create-referral-code.dto.ts](../../christinacormie-backend/src/modules/referrals/dto/create-referral-code.dto.ts#L13)

```text
@IsIn(['CUSTOMER', 'VENDOR']) programType: string;
@IsOptional() @IsString() @MaxLength(50) code?: string;
@IsOptional() @Type(() => Number) @IsInt() @Min(1) maximumUses?: number;
@IsOptional() @IsDateString() expiresAt?: string;
```

### CreateVendorOfferDto

[src/modules/community/dto/create-vendor-offer.dto.ts](../../christinacormie-backend/src/modules/community/dto/create-vendor-offer.dto.ts#L33)

```text
@IsOptional() @Type(() => Number) @IsNumber({ maxDecimalPlaces: 2 }) @Min(0.01) pricePerPerson?: number;
@IsUUID() foodTruckId: string;
@IsOptional() @IsString() message?: string;
@IsOptional() @IsString() noteToClient?: string;
@IsOptional() @IsEnum(OfferPricingModelDto) pricingModel?: OfferPricingModelDto;
@IsOptional() @IsArray() @IsString({ each: true }) selectedMenuItems?: string[];
@IsOptional() @Type(() => Number) @IsNumber() @Min(0) baseServiceFee?: number;
@IsOptional() @Type(() => Number) @IsNumber() @Min(0) transportFee?: number;
@IsOptional() @IsArray() @ValidateNested({ each: true }) @Type(() => OfferExtraChargeDto) extraCharges?: OfferExtraChargeDto[];
@IsOptional() @Type(() => Number) @IsNumber() @Min(0) taxAmount?: number;
@IsOptional() @Type(() => Number) @IsNumber() @Min(0) discountAmount?: number;
@IsOptional() @IsEnum(BookingPaymentPreferenceDto) paymentPreference?: BookingPaymentPreferenceDto;
@IsOptional() @Type(() => Number) @IsNumber() @Min(0) depositAmount?: number;
@IsOptional() @Type(() => Number) @IsNumber() @Min(0) depositPercent?: number;
@IsOptional() @Type(() => Number) @IsNumber() @Min(0) quotedAmount?: number;
@IsOptional() @Type(() => Number) @IsNumber() @Min(0) serviceFee?: number;
@IsOptional() @Type(() => Number) @IsNumber() @Min(0) balanceDueAtEvent?: number;
@IsOptional() @IsISO8601({ strict: true }) expiresAt?: string;
```

### CreateVendorStaffDto

[src/modules/vendors/dto/create-vendor-staff.dto.ts](../../christinacormie-backend/src/modules/vendors/dto/create-vendor-staff.dto.ts#L4)

```text
@IsEmail({}, { message: 'Staff email must be a valid email address' }) email: string;
@IsString() @Matches(/^\d{4}$/, { message: 'Staff PIN must be exactly 4 digits' }) pin: string;
```

### CuisineSelectionDto

[src/modules/food-trucks/dto/set-cuisines.dto.ts](../../christinacormie-backend/src/modules/food-trucks/dto/set-cuisines.dto.ts#L12)

```text
@IsOptional() @IsUUID() cuisineId?: string;
@IsOptional() @IsString() @MaxLength(100) name?: string;
@IsOptional() @IsString() @MaxLength(20) pinColor?: string;
@IsOptional() @IsBoolean() isPrimary?: boolean;
```

### ExploreFeedQueryDto

[src/modules/social/dto/explore-feed-query.dto.ts](../../christinacormie-backend/src/modules/social/dto/explore-feed-query.dto.ts#L10)

```text
@IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(50) limit?: number;
@IsOptional() @IsString() cursor?: string;
@IsOptional() @IsEnum(ExploreSortBy) sortBy?: ExploreSortBy;
```

### FeedQueryDto

[src/modules/social/dto/feed-query.dto.ts](../../christinacormie-backend/src/modules/social/dto/feed-query.dto.ts#L5)

```text
@IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(100) limit?: number;
@IsOptional() @IsUUID() cursor?: string;
```

### FoodiePointsQueryDto

[src/modules/leaderboards/dto/foodie-points-query.dto.ts](../../christinacormie-backend/src/modules/leaderboards/dto/foodie-points-query.dto.ts#L5)

```text
@IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(100) limit?: number;
@IsOptional() @Type(() => Number) @IsInt() @Min(0) offset?: number;
```

### GetCommentsQueryDto

[src/modules/social/dto/get-comments-query.dto.ts](../../christinacormie-backend/src/modules/social/dto/get-comments-query.dto.ts#L5)

```text
@IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(50) limit?: number;
@IsOptional() @Type(() => Number) @IsInt() @Min(0) offset?: number;
```

### GetFavoritesQueryDto

[src/modules/social/dto/get-favorites-query.dto.ts](../../christinacormie-backend/src/modules/social/dto/get-favorites-query.dto.ts#L11)

```text
@IsOptional() @IsEnum(FavoriteTab) tab?: FavoriteTab;
@IsOptional() @IsString() search?: string;
@IsOptional() @Type(() => Number) @IsNumber() latitude?: number;
@IsOptional() @Type(() => Number) @IsNumber() longitude?: number;
```

### LeaderboardQueryDto

[src/modules/leaderboards/dto/leaderboard-query.dto.ts](../../christinacormie-backend/src/modules/leaderboards/dto/leaderboard-query.dto.ts#L6)

```text
@IsOptional() @IsUUID() marketId?: string;
@IsOptional() @IsEnum(LeaderboardPeriodDto) period?: LeaderboardPeriodDto;
@IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(100) limit?: number;
@IsOptional() @Type(() => Number) @IsInt() @Min(0) offset?: number;
```

### LoginDto

[src/modules/auth/dto/login.dto.ts](../../christinacormie-backend/src/modules/auth/dto/login.dto.ts#L4)

```text
@IsEmail() email: string;
@IsString() @MinLength(8) password: string;
```

### MessagingPaginationDto

[src/modules/messaging/dto/messaging-query.dto.ts](../../christinacormie-backend/src/modules/messaging/dto/messaging-query.dto.ts#L5)

```text
@IsOptional() @Type(() => Number) @IsInt() @Min(1) limit?: number;
@IsOptional() @Type(() => Number) @IsInt() @Min(0) offset?: number;
```

### NearbyFoodTrucksQueryDto

[src/modules/discovery/dto/discovery-query.dto.ts](../../christinacormie-backend/src/modules/discovery/dto/discovery-query.dto.ts#L41)

```text
@Type(() => Number) @IsLatitude({ message: 'latitude is required and must be a valid number between -90 and 90', }) latitude: number;
@Type(() => Number) @IsLongitude({ message: 'longitude is required and must be a valid number between -180 and 180', }) longitude: number;
@IsOptional() @Type(() => Number) @IsNumber({}, { message: 'radiusKm must be a number' }) @Min(0.1, { message: 'radiusKm must be at least 0.1 km' }) @Max(100, { message: 'radiusKm cannot be greater than 100 km' }) radiusKm?: number;
@IsOptional() @Transform(toBoolean) @IsBoolean({ message: 'openOnly must be true or false' }) openOnly?: boolean;
@IsOptional() @IsEnum(OperatingStatusFilter, { message: 'operatingStatus must be one of: OPEN, CLOSED, BUSY, UNAVAILABLE', }) operatingStatus?: OperatingStatusFilter;
@IsOptional() @IsUUID(undefined, { message: 'cuisineId must be a valid UUID' }) cuisineId?: string;
@IsOptional() @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value)) @IsString({ message: 'cuisineSlug must be a string' }) @MaxLength(100, { message: 'cuisineSlug cannot be longer than 100 characters', }) cuisineSlug?: string;
@IsOptional() @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value)) @IsString({ message: 'cuisine must be a string' }) @MaxLength(100, { message: 'cuisine cannot be longer than 100 characters' }) cuisine?: string;
@IsOptional() @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value)) @IsString({ message: 'search must be a string' }) @MaxLength(100, { message: 'search cannot be longer than 100 characters' }) search?: string;
@IsOptional() @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value)) @IsString({ message: 'area must be a string' }) @MaxLength(100, { message: 'area cannot be longer than 100 characters' }) area?: string;
@IsOptional() @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value)) @IsString({ message: 'city must be a string' }) @MaxLength(100, { message: 'city cannot be longer than 100 characters' }) city?: string;
@IsOptional() @Type(() => Number) @IsNumber({}, { message: 'minRating must be a number' }) @Min(1, { message: 'minRating must be at least 1' }) @Max(5, { message: 'minRating cannot be greater than 5' }) minRating?: number;
@IsOptional() @Type(() => Number) @IsInt({ message: 'limit must be an integer' }) @Min(1, { message: 'limit must be at least 1' }) @Max(100, { message: 'limit cannot be greater than 100' }) limit?: number;
```

### NewFoodTruckLeadDto

[src/modules/community/dto/new-food-truck-lead.dto.ts](../../christinacormie-backend/src/modules/community/dto/new-food-truck-lead.dto.ts#L10)

```text
@IsString() @MaxLength(255) truckName: string;
@IsOptional() @IsString() @MaxLength(255) ownerName?: string;
@IsOptional() @IsEmail() ownerEmail?: string;
@IsOptional() @IsString() @MaxLength(30) ownerPhone?: string;
@IsOptional() @IsUrl() socialUrl?: string;
@IsOptional() @IsString() @MaxLength(150) city?: string;
@IsOptional() @IsString() @MaxLength(150) state?: string;
@IsOptional() @IsString() notes?: string;
```

### NotificationQueryDto

[src/modules/notifications/dto/notification-query.dto.ts](../../christinacormie-backend/src/modules/notifications/dto/notification-query.dto.ts#L5)

```text
@IsOptional() @Transform(({ value }) => value === true || value === 'true') @IsBoolean() unreadOnly?: boolean;
@IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(100) limit?: number;
@IsOptional() @Type(() => Number) @IsInt() @Min(0) offset?: number;
```

### OfferExtraChargeDto

[src/modules/community/dto/create-vendor-offer.dto.ts](../../christinacormie-backend/src/modules/community/dto/create-vendor-offer.dto.ts#L21)

```text
@IsString() label: string;
@Type(() => Number) @IsNumber() @Min(0) amount: number;
```

### OperatingHourDto

[src/modules/food-trucks/dto/set-operating-hours.dto.ts](../../christinacormie-backend/src/modules/food-trucks/dto/set-operating-hours.dto.ts#L15)

```text
@IsInt() @Min(0) @Max(6) dayOfWeek: number;
@IsOptional() @Matches(TIME_PATTERN) openingTime?: string;
@IsOptional() @Matches(TIME_PATTERN) closingTime?: string;
@IsBoolean() isClosed: boolean;
```

### PlaceQueryDto

[src/modules/social/dto/place-query.dto.ts](../../christinacormie-backend/src/modules/social/dto/place-query.dto.ts#L5)

```text
@IsOptional() @IsString() search?: string;
@IsOptional() @IsUUID() marketId?: string;
@IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(100) limit?: number;
@IsOptional() @Type(() => Number) @IsInt() @Min(0) offset?: number;
```

### PostMediaDto

[src/modules/social/dto/post-media.dto.ts](../../christinacormie-backend/src/modules/social/dto/post-media.dto.ts#L11)

```text
@IsString() @MaxLength(20) mediaType: string;
@IsUrl() mediaUrl: string;
@IsOptional() @IsInt() @Min(0) sortOrder?: number;
```

### ProfileServiceAreaDto

[src/modules/food-trucks/dto/update-profile-settings.dto.ts](../../christinacormie-backend/src/modules/food-trucks/dto/update-profile-settings.dto.ts#L22)

```text
@IsOptional() @IsString() @MaxLength(150) name?: string;
@IsOptional() @IsString() centerAddress?: string;
@IsLatitude() latitude: number;
@IsLongitude() longitude: number;
@IsNumber() @Min(0.1) radiusKm: number;
@IsOptional() @IsBoolean() outsideRadiusAllowed?: boolean;
@IsOptional() @IsNumber() @Min(0) outsideRadiusFee?: number;
```

### ProfileSocialQueryDto

[src/modules/social/dto/profile-social-query.dto.ts](../../christinacormie-backend/src/modules/social/dto/profile-social-query.dto.ts#L11)

```text
@IsOptional() @IsEnum(SocialAccountType) type?: SocialAccountType;
@IsOptional() @IsString() search?: string;
@IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(100) limit?: number;
@IsOptional() @Type(() => Number) @IsInt() @Min(0) offset?: number;
```

### PromotionQueryDto

[src/modules/promotions/dto/promotion-query.dto.ts](../../christinacormie-backend/src/modules/promotions/dto/promotion-query.dto.ts#L21)

```text
@IsOptional() @Transform(toBoolean) @IsBoolean() activeOnly?: boolean;
@IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(100) limit?: number;
```

### PublicReviewsQueryDto

[src/modules/food-trucks/dto/public-reviews-query.dto.ts](../../christinacormie-backend/src/modules/food-trucks/dto/public-reviews-query.dto.ts#L5)

```text
@IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(50) limit?: number;
@IsOptional() @IsUUID() cursor?: string;
```

### ReactRequestDto

[src/modules/community/dto/react-request.dto.ts](../../christinacormie-backend/src/modules/community/dto/react-request.dto.ts#L4)

```text
@IsOptional() @IsString() @MaxLength(30) reaction?: string;
```

### RecipientSearchDto

[src/modules/messaging/dto/recipient-search.dto.ts](../../christinacormie-backend/src/modules/messaging/dto/recipient-search.dto.ts#L11)

```text
@IsOptional() @IsString() search?: string;
@IsOptional() @IsEnum(RecipientAccountType) type?: RecipientAccountType;
@IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(50) limit?: number;
@IsOptional() @Type(() => Number) @IsInt() @Min(0) offset?: number;
```

### RefreshTokenDto

[src/modules/auth/dto/refresh-token.dto.ts](../../christinacormie-backend/src/modules/auth/dto/refresh-token.dto.ts#L4)

```text
@IsString() refreshToken: string;
```

### RegisterCustomerDto

[src/modules/auth/dto/register-customer.dto.ts](../../christinacormie-backend/src/modules/auth/dto/register-customer.dto.ts#L12)

```text
@Transform(({ value }) => (typeof value === 'string' ? value.trim() : value)) @IsString() @MinLength(2) @MaxLength(150) name: string;
@IsEmail() email: string;
@IsString() @MinLength(8) @MaxLength(128) password: string;
@Type(() => Date) @IsDate() dateOfBirth: Date;
@IsOptional() @Transform(({ value }) => typeof value === 'string' ? value.trim().toUpperCase() : value, ) @IsString() @MaxLength(50) referralCode?: string;
```

### RegisterVendorDto

[src/modules/auth/dto/register-vendor.dto.ts](../../christinacormie-backend/src/modules/auth/dto/register-vendor.dto.ts#L14)

```text
@IsEmail() email: string;
@IsPhoneNumber() phone: string;
@IsString() @MinLength(8) @MaxLength(128) password: string;
@IsOptional() @Type(() => Date) @IsDate() dateOfBirth?: Date;
@IsOptional() @IsString() @MaxLength(255) businessName?: string;
@IsOptional() @IsEmail() businessEmail?: string;
@IsOptional() @IsPhoneNumber() businessPhone?: string;
@IsOptional() @IsString() description?: string;
@IsOptional() @IsUrl() websiteUrl?: string;
@IsOptional() @IsString() @MaxLength(100) firstName?: string;
@IsOptional() @IsString() @MaxLength(100) lastName?: string;
@IsOptional() @IsString() @MaxLength(150) displayName?: string;
@IsOptional() @IsString() @MaxLength(100) timezone?: string;
@IsOptional() @Transform(({ value }) => typeof value === 'string' ? value.trim().toUpperCase() : value, ) @IsString() @MaxLength(50) referralCode?: string;
```

### ReportCommunityPostDto

[src/modules/community/dto/report-community-post.dto.ts](../../christinacormie-backend/src/modules/community/dto/report-community-post.dto.ts#L5)

```text
@IsEnum(CommunityPostReportReason, { message: 'reason must be one of: SPAM_OR_IRRELEVANT, INAPPROPRIATE_CONTENT, HARASSMENT, SCAM_OR_FRAUD, NOT_FOOD_TRUCK_RELATED', }) reason: CommunityPostReportReason;
```

### RequestMediaDto

[src/modules/community/dto/request-media.dto.ts](../../christinacormie-backend/src/modules/community/dto/request-media.dto.ts#L4)

```text
@IsUrl() mediaUrl: string;
@IsIn(['IMAGE', 'PDF'], { message: 'mediaType must be IMAGE or PDF' }) @IsString() @MaxLength(20) mediaType: string;
```

### ResendEmailCodeDto

[src/modules/auth/dto/resend-email-code.dto.ts](../../christinacormie-backend/src/modules/auth/dto/resend-email-code.dto.ts#L4)

```text
@IsEmail() email: string;
```

### ResetVendorStaffPinDto

[src/modules/vendors/dto/reset-vendor-staff-pin.dto.ts](../../christinacormie-backend/src/modules/vendors/dto/reset-vendor-staff-pin.dto.ts#L4)

```text
@IsString() @Matches(/^\d{4}$/, { message: 'Staff PIN must be exactly 4 digits' }) pin: string;
```

### ResolveBookingIssueDto

[src/modules/bookings/dto/resolve-booking-issue.dto.ts](../../christinacormie-backend/src/modules/bookings/dto/resolve-booking-issue.dto.ts#L9)

```text
@IsEnum(BookingIssueResolutionDecisionDto) decision: BookingIssueResolutionDecisionDto;
@IsOptional() @IsString() @MaxLength(1000) resolutionNote?: string;
```

### SendMessageDto

[src/modules/messaging/dto/send-message.dto.ts](../../christinacormie-backend/src/modules/messaging/dto/send-message.dto.ts#L16)

```text
@IsOptional() @IsEnum(MessagingMessageTypeDto) messageType?: MessagingMessageTypeDto;
@IsOptional() @IsString() @MaxLength(5000) content?: string;
@IsOptional() @IsUrl() attachmentUrl?: string;
```

### SetupBasicMenuDto

[src/modules/food-trucks/dto/setup-basic-menu.dto.ts](../../christinacormie-backend/src/modules/food-trucks/dto/setup-basic-menu.dto.ts#L87)

```text
@IsString() @MaxLength(150) name: string;
@IsOptional() @IsString() description?: string;
@IsOptional() @IsBoolean() isActive?: boolean;
@IsArray() @ValidateNested({ each: true }) @Type(() => BasicMenuCategoryDto) categories: BasicMenuCategoryDto[];
```

### SubmitVerificationRequestDto

[src/modules/vendors/dto/submit-verification-request.dto.ts](../../christinacormie-backend/src/modules/vendors/dto/submit-verification-request.dto.ts#L31)

```text
@IsArray() @ValidateNested({ each: true }) @Type(() => VerificationDocumentDto) documents: VerificationDocumentDto[];
@IsOptional() @IsString() @MaxLength(1000) notes?: string;
```

### TrendingFoodTrucksQueryDto

[src/modules/discovery/dto/discovery-query.dto.ts](../../christinacormie-backend/src/modules/discovery/dto/discovery-query.dto.ts#L145)

```text
@IsOptional() @Transform(toBoolean) @IsBoolean({ message: 'openOnly must be true or false' }) openOnly?: boolean;
@IsOptional() @IsEnum(OperatingStatusFilter, { message: 'operatingStatus must be one of: OPEN, CLOSED, BUSY, UNAVAILABLE', }) operatingStatus?: OperatingStatusFilter;
@IsOptional() @IsUUID(undefined, { message: 'cuisineId must be a valid UUID' }) cuisineId?: string;
@IsOptional() @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value)) @IsString({ message: 'cuisineSlug must be a string' }) @MaxLength(100, { message: 'cuisineSlug cannot be longer than 100 characters', }) cuisineSlug?: string;
@IsOptional() @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value)) @IsString({ message: 'cuisine must be a string' }) @MaxLength(100, { message: 'cuisine cannot be longer than 100 characters' }) cuisine?: string;
@IsOptional() @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value)) @IsString({ message: 'search must be a string' }) @MaxLength(100, { message: 'search cannot be longer than 100 characters' }) search?: string;
@IsOptional() @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value)) @IsString({ message: 'area must be a string' }) @MaxLength(100, { message: 'area cannot be longer than 100 characters' }) area?: string;
@IsOptional() @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value)) @IsString({ message: 'city must be a string' }) @MaxLength(100, { message: 'city cannot be longer than 100 characters' }) city?: string;
@IsOptional() @Type(() => Number) @IsNumber({}, { message: 'minRating must be a number' }) @Min(1, { message: 'minRating must be at least 1' }) @Max(5, { message: 'minRating cannot be greater than 5' }) minRating?: number;
@IsOptional() @Type(() => Number) @IsInt({ message: 'limit must be an integer' }) @Min(1, { message: 'limit must be at least 1' }) @Max(100, { message: 'limit cannot be greater than 100' }) limit?: number;
@IsOptional() @Type(() => Number) @IsInt({ message: 'offset must be an integer' }) @Min(0, { message: 'offset cannot be negative' }) offset?: number;
```

### UpdateCommunityPostDto

[src/modules/community/dto/community-post-query.dto.ts](../../christinacormie-backend/src/modules/community/dto/community-post-query.dto.ts#L18)

```text
class UpdateCommunityPostDto extends PartialType(
  CreateCommunityRequestDto,
)
```

### UpdateCreditSettingsDto

[src/modules/vendors/dto/update-credit-settings.dto.ts](../../christinacormie-backend/src/modules/vendors/dto/update-credit-settings.dto.ts#L4)

```text
@IsBoolean() creditAcceptanceEnabled: boolean;
```

### UpdateFoodTruckProfileSettingsDto

[src/modules/food-trucks/dto/update-profile-settings.dto.ts](../../christinacormie-backend/src/modules/food-trucks/dto/update-profile-settings.dto.ts#L59)

```text
@IsOptional() @IsString() @MaxLength(255) name?: string;
@IsOptional() @IsString() @MaxLength(80) @Matches(/^[a-zA-Z0-9._-]+$/, { message: 'handle can only contain letters, numbers, dots, underscores, and hyphens', }) handle?: string;
@IsOptional() @IsString() description?: string;
@IsOptional() @IsUrl() profileImageUrl?: string;
@IsOptional() @IsUrl() coverImageUrl?: string;
@IsOptional() @IsInt() @Min(1) maximumGuestCapacity?: number;
@IsOptional() @IsNumber() @Min(0) minimumBookingAmount?: number;
@IsOptional() @IsArray() @ValidateNested({ each: true }) @Type(() => OperatingHourDto) operatingHours?: OperatingHourDto[];
@IsOptional() @IsArray() @ValidateNested({ each: true }) @Type(() => CuisineSelectionDto) cuisines?: CuisineSelectionDto[];
@IsOptional() @ValidateNested() @Type(() => ProfileServiceAreaDto) serviceArea?: ProfileServiceAreaDto;
```

### UpdateMenuItemDto

[src/modules/food-trucks/dto/update-menu-item.dto.ts](../../christinacormie-backend/src/modules/food-trucks/dto/update-menu-item.dto.ts#L11)

```text
class UpdateMenuItemDto extends PartialType(CreateMenuItemDto)
@IsOptional() @IsEnum(MenuItemStatusDto) status?: MenuItemStatusDto;
```

### UpdateNewFoodTruckRequestDto

[src/modules/admin/dto/update-new-food-truck-request.dto.ts](../../christinacormie-backend/src/modules/admin/dto/update-new-food-truck-request.dto.ts#L4)

```text
@IsOptional() @IsIn(['PENDING', 'COMMUNICATED', 'DISMISSED']) status?: string;
@IsOptional() @IsString() @MaxLength(1000) notes?: string;
```

### UpdateOperatingStatusDto

[src/modules/food-trucks/dto/update-operating-status.dto.ts](../../christinacormie-backend/src/modules/food-trucks/dto/update-operating-status.dto.ts#L11)

```text
@IsEnum(OperatingStatusDto) operatingStatus: OperatingStatusDto;
```

### UpdateProfileDto

[src/modules/users/dto/update-profile.dto.ts](../../christinacormie-backend/src/modules/users/dto/update-profile.dto.ts#L4)

```text
@IsOptional() @IsString() @MaxLength(150) displayName?: string;
@IsOptional() @IsEmail() email?: string;
@IsOptional() @IsString() @MaxLength(30) phone?: string;
```

### UpdatePromotionDto

[src/modules/promotions/dto/update-promotion.dto.ts](../../christinacormie-backend/src/modules/promotions/dto/update-promotion.dto.ts#L4)

```text
class UpdatePromotionDto extends PartialType(CreatePromotionDto)
```

### UpdateTruckImageDto

[src/modules/food-trucks/dto/update-truck-image.dto.ts](../../christinacormie-backend/src/modules/food-trucks/dto/update-truck-image.dto.ts#L4)

```text
class UpdateTruckImageDto extends PartialType(AddTruckImageDto)
```

### UpdateTruckLocationDto

[src/modules/food-trucks/dto/update-truck-location.dto.ts](../../christinacormie-backend/src/modules/food-trucks/dto/update-truck-location.dto.ts#L13)

```text
@Type(() => Number) @IsLatitude() latitude: number;
@Type(() => Number) @IsLongitude() longitude: number;
@IsOptional() @IsString() address?: string;
@IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(1440) validForMinutes?: number;
```

### UpsertPlatformSettingDto

[src/modules/admin/dto/upsert-platform-setting.dto.ts](../../christinacormie-backend/src/modules/admin/dto/upsert-platform-setting.dto.ts#L4)

```text
@IsObject() value: Record<string, unknown>;
@IsOptional() @IsString() description?: string;
@IsOptional() @IsBoolean() isPublic?: boolean;
```

### VendorBookingDecisionDto

[src/modules/bookings/dto/vendor-booking-decision.dto.ts](../../christinacormie-backend/src/modules/bookings/dto/vendor-booking-decision.dto.ts#L4)

```text
@IsOptional() @IsString() reason?: string;
```

### VendorBookingsQueryDto

[src/modules/bookings/dto/vendor-bookings-query.dto.ts](../../christinacormie-backend/src/modules/bookings/dto/vendor-bookings-query.dto.ts#L16)

```text
@IsOptional() @IsEnum(VendorBookingTabDto) tab?: VendorBookingTabDto;
@IsOptional() @IsEnum(VendorBookingSourceDto) source?: VendorBookingSourceDto;
@IsOptional() @IsString() status?: string;
@IsOptional() @IsUUID() foodTruckId?: string;
```

### VendorCreditAnalyticsQueryDto

[src/modules/vendors/dto/vendor-credit-analytics-query.dto.ts](../../christinacormie-backend/src/modules/vendors/dto/vendor-credit-analytics-query.dto.ts#L4)

```text
@IsOptional() @IsUUID() foodTruckId?: string;
@IsOptional() @IsIn(['week', 'month']) range?: 'week' | 'month';
@IsOptional() @IsString() @MaxLength(100) timezone?: string;
```

### VerificationDocumentDto

[src/modules/vendors/dto/submit-verification-request.dto.ts](../../christinacormie-backend/src/modules/vendors/dto/submit-verification-request.dto.ts#L13)

```text
@IsEnum(VendorVerificationDocumentType) type: VendorVerificationDocumentType;
@IsString() url: string;
```

### VerifyEmailCodeDto

[src/modules/auth/dto/verify-email-code.dto.ts](../../christinacormie-backend/src/modules/auth/dto/verify-email-code.dto.ts#L4)

```text
@IsEmail() email: string;
@IsString() @Length(6, 6) code: string;
```

### Referenced request enums

[LeaderboardPeriodDto](../../christinacormie-backend/src/modules/admin/dto/upsert-leaderboard-rule.dto.ts#L26)

```text
export enum LeaderboardPeriodDto {
  DAILY = 'DAILY',
  WEEKLY = 'WEEKLY',
  MONTHLY = 'MONTHLY',
  ALL_TIME = 'ALL_TIME',
}
```

[BookingTypeDto](../../christinacormie-backend/src/modules/bookings/dto/create-booking.dto.ts#L23)

```text
export enum BookingTypeDto {
  QUICK_BOOKING = 'QUICK_BOOKING',
  EVENT = 'EVENT',
  CATERING = 'CATERING',
  PRIVATE_REQUEST = 'PRIVATE_REQUEST',
  COMMUNITY_REQUEST = 'COMMUNITY_REQUEST',
}
```

[BookingEventTypeDto](../../christinacormie-backend/src/modules/bookings/dto/create-booking.dto.ts#L31)

```text
export enum BookingEventTypeDto {
  BIRTHDAY_PARTY = 'BIRTHDAY_PARTY',
  CORPORATE_EVENT = 'CORPORATE_EVENT',
  WEDDING = 'WEDDING',
  WEDDING_RECEPTION = 'WEDDING_RECEPTION',
  GRADUATION_PARTY = 'GRADUATION_PARTY',
  COMMUNITY_EVENT = 'COMMUNITY_EVENT',
  FUNDRAISER = 'FUNDRAISER',
  PRIVATE_PARTY = 'PRIVATE_PARTY',
  OTHER = 'OTHER',
}
```

[BookingPaymentPreferenceDto](../../christinacormie-backend/src/modules/bookings/dto/create-booking.dto.ts#L43)

```text
export enum BookingPaymentPreferenceDto {
  DEPOSIT_ONLY = 'DEPOSIT_ONLY',
  PREPAID_IN_FULL = 'PREPAID_IN_FULL',
  NO_PREFERENCE = 'NO_PREFERENCE',
}
```

[BookingIssueResolutionDecisionDto](../../christinacormie-backend/src/modules/bookings/dto/resolve-booking-issue.dto.ts#L4)

```text
export enum BookingIssueResolutionDecisionDto {
  RELEASE_PAYOUT = 'RELEASE_PAYOUT',
  FULL_REFUND = 'FULL_REFUND',
}
```

[VendorBookingTabDto](../../christinacormie-backend/src/modules/bookings/dto/vendor-bookings-query.dto.ts#L4)

```text
export enum VendorBookingTabDto {
  REQUESTS = 'REQUESTS',
  ORDERS = 'ORDERS',
  ALL = 'ALL',
}
```

[VendorBookingSourceDto](../../christinacormie-backend/src/modules/bookings/dto/vendor-bookings-query.dto.ts#L10)

```text
export enum VendorBookingSourceDto {
  DIRECT = 'DIRECT',
  COMMUNITY = 'COMMUNITY',
  ALL = 'ALL',
}
```

[RequestTypeDto](../../christinacormie-backend/src/modules/community/dto/create-community-request.dto.ts#L26)

```text
export enum RequestTypeDto {
  EVENT = 'EVENT',
  CATERING = 'CATERING',
  CORPORATE = 'CORPORATE',
  SCHOOL = 'SCHOOL',
  HOA = 'HOA',
  NEIGHBORHOOD = 'NEIGHBORHOOD',
  FOOD_TRUCK_NEAR_ME = 'FOOD_TRUCK_NEAR_ME',
  OTHER = 'OTHER',
}
```

[CommunityEventTypeDto](../../christinacormie-backend/src/modules/community/dto/create-community-request.dto.ts#L37)

```text
export enum CommunityEventTypeDto {
  CORPORATE_EVENT = 'CORPORATE_EVENT',
  BIRTHDAY_PARTY = 'BIRTHDAY_PARTY',
  WEDDING_RECEPTION = 'WEDDING_RECEPTION',
  GRADUATION_PARTY = 'GRADUATION_PARTY',
  COMMUNITY_EVENT = 'COMMUNITY_EVENT',
  FUNDRAISER = 'FUNDRAISER',
  OTHER = 'OTHER',
}
```

[OfferPricingModelDto](../../christinacormie-backend/src/modules/community/dto/create-vendor-offer.dto.ts#L16)

```text
export enum OfferPricingModelDto {
  FLAT_FEE = 'FLAT_FEE',
  PER_PERSON = 'PER_PERSON',
}
```

[OperatingStatusFilter](../../christinacormie-backend/src/modules/discovery/dto/discovery-query.dto.ts#L18)

```text
export enum OperatingStatusFilter {
  OPEN = 'OPEN',
  CLOSED = 'CLOSED',
  BUSY = 'BUSY',
  UNAVAILABLE = 'UNAVAILABLE',
}
```

[MenuItemStatusDto](../../christinacormie-backend/src/modules/food-trucks/dto/update-menu-item.dto.ts#L5)

```text
export enum MenuItemStatusDto {
  AVAILABLE = 'AVAILABLE',
  UNAVAILABLE = 'UNAVAILABLE',
  SOLD_OUT = 'SOLD_OUT',
}
```

[OperatingStatusDto](../../christinacormie-backend/src/modules/food-trucks/dto/update-operating-status.dto.ts#L4)

```text
export enum OperatingStatusDto {
  OPEN = 'OPEN',
  CLOSED = 'CLOSED',
  BUSY = 'BUSY',
  UNAVAILABLE = 'UNAVAILABLE',
}
```

[RecipientAccountType](../../christinacormie-backend/src/modules/messaging/dto/recipient-search.dto.ts#L5)

```text
export enum RecipientAccountType {
  ALL = 'ALL',
  CUSTOMER = 'CUSTOMER',
  VENDOR = 'VENDOR',
}
```

[MessagingMessageTypeDto](../../christinacormie-backend/src/modules/messaging/dto/send-message.dto.ts#L10)

```text
export enum MessagingMessageTypeDto {
  TEXT = 'TEXT',
  IMAGE = 'IMAGE',
  FILE = 'FILE',
}
```

[PromotionTypeDto](../../christinacormie-backend/src/modules/promotions/dto/create-promotion.dto.ts#L16)

```text
export enum PromotionTypeDto {
  PERCENTAGE = 'PERCENTAGE',
  FIXED_AMOUNT = 'FIXED_AMOUNT',
  FREE_ITEM = 'FREE_ITEM',
  CUSTOM = 'CUSTOM',
}
```

[PostStatusDto](../../christinacormie-backend/src/modules/social/dto/create-post.dto.ts#L16)

```text
export enum PostStatusDto {
  DRAFT = 'DRAFT',
  PUBLISHED = 'PUBLISHED',
}
```

[ExploreSortBy](../../christinacormie-backend/src/modules/social/dto/explore-feed-query.dto.ts#L5)

```text
export enum ExploreSortBy {
  NEWEST = 'newest',
  TRENDING = 'trending',
}
```

[FavoriteTab](../../christinacormie-backend/src/modules/social/dto/get-favorites-query.dto.ts#L5)

```text
export enum FavoriteTab {
  ALL = 'ALL',
  OPEN = 'OPEN',
  CLOSED = 'CLOSED',
}
```

[SocialAccountType](../../christinacormie-backend/src/modules/social/dto/profile-social-query.dto.ts#L5)

```text
export enum SocialAccountType {
  ALL = 'ALL',
  CUSTOMER = 'CUSTOMER',
  VENDOR = 'VENDOR',
}
```

[VendorVerificationDocumentType](../../christinacormie-backend/src/modules/vendors/enums/vendor-verification-document-type.enum.ts#L1)

```text
export enum VendorVerificationDocumentType {
  DSHS_MOBILE_FOOD_VENDOR_LICENSE = 'DSHS_MOBILE_FOOD_VENDOR_LICENSE',
  STATE_OR_LOCAL_FOOD_VENDOR_PERMIT = 'STATE_OR_LOCAL_FOOD_VENDOR_PERMIT',
  FOOD_MANAGER_CERTIFICATION = 'FOOD_MANAGER_CERTIFICATION',
  CERTIFICATE_OF_INSURANCE = 'CERTIFICATE_OF_INSURANCE',
}
```

## Response presenter and selection catalogue

Actual source return expressions retain nested objects, numeric conversions, spread sources and null fallback. Non-object delegations link to selected models/repositories; they are not invented response DTOs. Dates serialize as ISO strings; raw Prisma Decimal values need explicit response adaptation. These are inspected source contracts, not live response samples.

### AdminRepository.bookingManagementSelect

[AdminRepository.bookingManagementSelect](../../christinacormie-backend/src/modules/admin/admin.repository.ts#L3283)

```ts
return {
  ...this.bookingSelect(),
  paymentPreference: true,
  quotes: {
    orderBy: { createdAt: "desc" as const },
    take: 1,
    select: {
      id: true,
      pricingModel: true,
      paymentPreference: true,
      depositAmount: true,
      depositPercent: true,
      balanceDueAtEvent: true,
      totalAmount: true,
      status: true,
      createdAt: true,
    },
  },
  payments: {
    orderBy: { createdAt: "desc" as const },
    take: 1,
    select: {
      id: true,
      amount: true,
      currency: true,
      status: true,
      paidAt: true,
      createdAt: true,
      commission: true,
      refunds: true,
    },
  },
  review: {
    select: {
      id: true,
      status: true,
      reports: {
        where: {
          status: { in: [ReportStatus.PENDING, ReportStatus.REVIEWING] },
        },
        select: {
          id: true,
          reason: true,
          status: true,
          createdAt: true,
        },
      },
    },
  },
};
```

### AdminRepository.bookingSelect

[AdminRepository.bookingSelect](../../christinacormie-backend/src/modules/admin/admin.repository.ts#L3242)

```ts
return {
  id: true,
  bookingNumber: true,
  customerId: true,
  vendorId: true,
  foodTruckId: true,
  bookingType: true,
  eventType: true,
  status: true,
  eventName: true,
  startsAt: true,
  endsAt: true,
  guestCount: true,
  address: true,
  subtotal: true,
  serviceFee: true,
  taxAmount: true,
  discountAmount: true,
  totalAmount: true,
  createdAt: true,
  customer: {
    select: { id: true, email: true, phone: true, profile: true },
  },
  vendor: {
    select: {
      id: true,
      businessName: true,
      businessEmail: true,
      businessPhone: true,
    },
  },
  foodTruck: { select: { id: true, name: true, slug: true } },
  _count: {
    select: {
      issues: { where: { status: "OPEN" as const } },
    },
  },
};
```

### AdminRepository.bookingWhere

[AdminRepository.bookingWhere](../../christinacormie-backend/src/modules/admin/admin.repository.ts#L1714)

```ts
return {
  ...(query.status ? { status: query.status as any } : {}),
  ...(query.search
    ? {
        OR: [
          {
            bookingNumber: {
              contains: query.search,
              mode: "insensitive" as const,
            },
          },
          {
            eventName: {
              contains: query.search,
              mode: "insensitive" as const,
            },
          },
          {
            address: {
              contains: query.search,
              mode: "insensitive" as const,
            },
          },
          {
            customer: {
              email: {
                contains: query.search,
                mode: "insensitive" as const,
              },
            },
          },
          {
            customer: {
              phone: {
                contains: query.search,
                mode: "insensitive" as const,
              },
            },
          },
          {
            customer: {
              profile: {
                displayName: {
                  contains: query.search,
                  mode: "insensitive" as const,
                },
              },
            },
          },
          {
            vendor: {
              businessName: {
                contains: query.search,
                mode: "insensitive" as const,
              },
            },
          },
          {
            vendor: {
              businessEmail: {
                contains: query.search,
                mode: "insensitive" as const,
              },
            },
          },
          {
            foodTruck: {
              name: {
                contains: query.search,
                mode: "insensitive" as const,
              },
            },
          },
        ],
      }
    : {}),
};
```

### AdminRepository.communityRequestSelect

[AdminRepository.communityRequestSelect](../../christinacormie-backend/src/modules/admin/admin.repository.ts#L3413)

```ts
return {
  id: true,
  createdById: true,
  targetFoodTruckId: true,
  category: true,
  visibility: true,
  requestType: true,
  status: true,
  title: true,
  description: true,
  eventDate: true,
  guestCount: true,
  budgetMin: true,
  budgetMax: true,
  address: true,
  allowPublicComments: true,
  expiresAt: true,
  createdAt: true,
  deletedAt: true,
  createdBy: {
    select: { id: true, email: true, phone: true, profile: true },
  },
  targetFoodTruck: { select: { id: true, name: true, slug: true } },
  media: true,
  reactions: true,
  reports: {
    orderBy: { createdAt: "desc" as const },
    include: {
      reportedBy: { select: { id: true, email: true, profile: true } },
      reviewedBy: { select: { id: true, email: true, profile: true } },
    },
  },
  comments: {
    where: { deletedAt: null },
    take: 20,
    orderBy: { createdAt: "desc" as const },
    include: {
      user: { select: { id: true, email: true, profile: true } },
    },
  },
  vendorOffers: true,
};
```

### AdminRepository.communityWhere

[AdminRepository.communityWhere](../../christinacormie-backend/src/modules/admin/admin.repository.ts#L2129)

```ts
return {
  ...(query.status ? { status: query.status as any } : {}),
  ...(category ? { category } : {}),
  ...(query.search
    ? {
        OR: [
          {
            title: {
              contains: query.search,
              mode: "insensitive" as const,
            },
          },
          {
            description: {
              contains: query.search,
              mode: "insensitive" as const,
            },
          },
          {
            createdBy: {
              email: {
                contains: query.search,
                mode: "insensitive" as const,
              },
            },
          },
          {
            createdBy: {
              profile: {
                displayName: {
                  contains: query.search,
                  mode: "insensitive" as const,
                },
              },
            },
          },
        ],
      }
    : {}),
};
```

### AdminRepository.getBookingsManagement

[AdminRepository.getBookingsManagement](../../christinacormie-backend/src/modules/admin/admin.repository.ts#L557)

```ts
return {
  generatedAt: now,
  summary: {
    totalBookings,
    thisMonth,
    totalRevenue: Number(totalRevenue._sum.amount ?? 0),
    disputed,
    disputedSource: "review_reports",
  },
  bookings: bookings.map((booking) => this.toBookingManagementRow(booking)),
};
```

### AdminRepository.getCommunityManagement

[AdminRepository.getCommunityManagement](../../christinacormie-backend/src/modules/admin/admin.repository.ts#L978)

```ts
return {
  generatedAt: now,
  summary: {
    totalPosts,
    today,
    reported,
    removedToday,
  },
  tabs: {
    allPosts: totalPosts,
    ...Object.fromEntries(
      postsByCategory.map((item) => [
        this.communityCategoryKey(item.category),
        item._count.id,
      ]),
    ),
  },
  posts: posts.map((post) => this.toCommunityManagementRow(post)),
};
```

### AdminRepository.getDashboard

[AdminRepository.getDashboard](../../christinacormie-backend/src/modules/admin/admin.repository.ts#L1478)

```ts
return {
  generatedAt: now,
  cards: {
    totalUsers: this.metric(totalUsers, previousTotalUsers),
    activeVendors: this.metric(activeVendors, previousActiveVendors),
    liveDrops: this.metric(liveDrops, previousLiveDrops),
    monthlyBookings: this.metric(monthlyBookings, previousMonthlyBookings),
    revenueThisMonth: this.metric(monthlyRevenue, previousMonthlyRevenue),
    commissionEarned: this.metric(monthlyCommission, previousMonthlyCommission),
    pendingPayouts: this.metric(pendingPayouts, previousPendingPayouts),
    activeDisputes: {
      ...this.metric(activeReviewReports, previousActiveReviewReports),
      source: "review_reports",
    },
  },
  charts: {
    revenueTrend,
    monthlyBookings: bookingsTrend,
  },
  recentActivity,
};
```

### AdminRepository.getPaymentsManagement

[AdminRepository.getPaymentsManagement](../../christinacormie-backend/src/modules/admin/admin.repository.ts#L673)

```ts
return {
  generatedAt: now,
  summary: {
    pendingPayouts,
    totalAmount: Number(totalPayments._sum.amount ?? 0),
    revenueThisMonth: Number(monthlyRevenue._sum.amount ?? 0),
    commissionEarned: Number(commissionEarned._sum.commissionAmount ?? 0),
  },
  tabs: {
    payoutRequests: payoutRequests.length,
    revenueOverview: true,
    transactionHistory: transactions.length,
    paymentMethods: paymentAccounts.length,
  },
  payoutRequests: payoutRequests.map((payout) => this.toPayoutRequestRow(payout)),
  revenueOverview,
  transactions,
  paymentMethods: {
    summary: {
      bankTransfers: 0,
      paypalAccounts: 0,
      stripeConnected: paymentAccounts.filter((account) => account.stripeAccountId)
        .length,
    },
    methods: paymentAccounts.map((account) => this.toPaymentMethodRow(account)),
  },
  schemaGaps: {
    bankAccounts:
      "Vendor bank transfer account details are not stored separately; only Stripe Connect account metadata exists.",
    paypalAccounts:
      "PayPal payout account details are not present in the current schema.",
    taxInfo:
      "W-9, tax ID type, YTD tax threshold, and 1099-K flags are not present in the current schema.",
  },
};
```

### AdminRepository.getReviewsManagement

[AdminRepository.getReviewsManagement](../../christinacormie-backend/src/modules/admin/admin.repository.ts#L897)

```ts
return {
  generatedAt: now,
  summary: {
    totalReviews,
    averageRating: Math.round(Number(averageRating._avg.rating ?? 0) * 10) / 10,
    reported,
    removedThisWeek,
  },
  tabs: {
    allReviews: totalReviews,
    reportedOnly: reported,
    bookings: totalReviews,
    checkIn: 0,
  },
  reviews: reviews.map((review) => this.toReviewManagementRow(review)),
};
```

### AdminRepository.getRewardsManagement

[AdminRepository.getRewardsManagement](../../christinacormie-backend/src/modules/admin/admin.repository.ts#L1205)

```ts
return {
  generatedAt: now,
  summary: {
    pointsRedeemed: Math.abs(redeemedPoints._sum.points ?? 0),
    creditsIssued: Number(redeemedCredits._sum.rewardValue ?? 0),
    activeUsers,
    qrScansToday,
  },
  paymentSummary,
  tabs: {
    leaderboard: activeLeaderboard?.entries.length ?? fallbackVendors.length,
    redeemTransactions: redemptions.length,
    topUsers: topUsers.length,
  },
  tierCounts: this.rewardTierCounts(
    loyaltyAccounts.map((account) => account.lifetimePoints),
  ),
  leaderboard: this.toRewardLeaderboardRows(
    activeLeaderboard?.entries ?? [],
    fallbackVendors,
  ),
  redeemTransactions: redemptions.map((redemption) =>
    this.toRewardRedemptionRow(redemption, foodTruckById, vendorById),
  ),
  topUsers,
  schemaGaps: {
    rewardCredits: "Stored on reward_redemptions.reward_value.",
    userTier:
      "Derived from loyalty_accounts.lifetime_points using rewards tier thresholds.",
    qrScansToday: "Stored on qr_scans.scanned_at.",
  },
};
```

### AdminRepository.getUsersManagement

[AdminRepository.getUsersManagement](../../christinacormie-backend/src/modules/admin/admin.repository.ts#L122)

```ts
return {
  generatedAt: now,
  summary: {
    totalUsers,
    activeThisMonth,
    newThisWeek,
    suspended,
  },
  users: users.map((user) => this.toUserManagementRow(user)),
};
```

### AdminRepository.getVendorsManagement

[AdminRepository.getVendorsManagement](../../christinacormie-backend/src/modules/admin/admin.repository.ts#L218)

```ts
return {
  summary: {
    totalVendors,
    active: activeVendors,
    pendingApproval,
    suspended,
  },
  tabs: {
    allVendors: totalVendors,
    truckRequests: truckRequestsCount,
    communicated: communicatedCount,
    photoShootRequests: photoShootRequestCount,
  },
  vendors: vendors.map((vendor) => this.toVendorManagementRow(vendor)),
};
```

### AdminRepository.loyaltyTier

[AdminRepository.loyaltyTier](../../christinacormie-backend/src/modules/admin/admin.repository.ts#L2829)

```ts
return {
  slug: "bitedrop_legend",
  name: "BiteDrop Legend",
  level: 4,
  requiredPoints: 10000,
  nextTierPoints: null,
};
```

```ts
return {
  slug: "drop_hunter",
  name: "Drop Hunter",
  level: 3,
  requiredPoints: 2000,
  nextTierPoints: 10000,
};
```

```ts
return {
  slug: "explorer",
  name: "Explorer",
  level: 2,
  requiredPoints: 500,
  nextTierPoints: 2000,
};
```

```ts
return {
  slug: "foodie",
  name: "Foodie",
  level: 1,
  requiredPoints: 0,
  nextTierPoints: 500,
};
```

### AdminRepository.marketSelect

[AdminRepository.marketSelect](../../christinacormie-backend/src/modules/admin/admin.repository.ts#L3458)

```ts
return {
  id: true,
  name: true,
  city: true,
  state: true,
  country: true,
  timezone: true,
  operatingRadiusKm: true,
  status: true,
  createdAt: true,
};
```

### AdminRepository.metric

[AdminRepository.metric](../../christinacormie-backend/src/modules/admin/admin.repository.ts#L1891)

```ts
return {
  value,
  previousValue,
  changePercent: this.changePercent(value, previousValue),
};
```

### AdminRepository.paymentTransactionInclude

[AdminRepository.paymentTransactionInclude](../../christinacormie-backend/src/modules/admin/admin.repository.ts#L2485)

```ts
return {
  vendor: { select: { id: true, businessName: true } },
  booking: { select: { id: true, bookingNumber: true, status: true } },
  commission: true,
};
```

### AdminRepository.payoutInclude

[AdminRepository.payoutInclude](../../christinacormie-backend/src/modules/admin/admin.repository.ts#L2461)

```ts
return {
  vendor: {
    select: {
      id: true,
      businessName: true,
      businessEmail: true,
      businessPhone: true,
      user: {
        select: { id: true, email: true, phone: true, profile: true },
      },
      paymentAccount: true,
      bookings: {
        where: { status: "COMPLETED" as any },
        select: { id: true },
      },
      commissions: {
        select: { vendorNetAmount: true, commissionAmount: true },
      },
    },
  },
};
```

### AdminRepository.payoutMethod

[AdminRepository.payoutMethod](../../christinacormie-backend/src/modules/admin/admin.repository.ts#L2537)

```ts
return {
  type: "STRIPE_CONNECT",
  label: "Stripe Connected",
  accountId: paymentAccount.stripeAccountId,
  onboardingCompleted: paymentAccount.onboardingCompleted,
  chargesEnabled: paymentAccount.chargesEnabled,
  payoutsEnabled: paymentAccount.payoutsEnabled,
  disabledReason: paymentAccount.disabledReason,
};
```

```ts
return {
  type: "UNKNOWN",
  label: "Not configured",
};
```

### AdminRepository.payoutTransactionInclude

[AdminRepository.payoutTransactionInclude](../../christinacormie-backend/src/modules/admin/admin.repository.ts#L2493)

```ts
return {
  vendor: { select: { id: true, businessName: true } },
};
```

### AdminRepository.reviewManagementSelect

[AdminRepository.reviewManagementSelect](../../christinacormie-backend/src/modules/admin/admin.repository.ts#L2368)

```ts
return {
  id: true,
  bookingId: true,
  customerId: true,
  vendorId: true,
  foodTruckId: true,
  rating: true,
  title: true,
  content: true,
  isVerified: true,
  status: true,
  contentHidden: true,
  ratingVisible: true,
  moderatedAt: true,
  moderationReason: true,
  createdAt: true,
  booking: {
    select: {
      id: true,
      bookingNumber: true,
      bookingType: true,
      status: true,
      completedAt: true,
    },
  },
  customer: {
    select: { id: true, email: true, phone: true, profile: true },
  },
  vendor: {
    select: { id: true, businessName: true, businessEmail: true },
  },
  foodTruck: {
    select: { id: true, name: true, slug: true },
  },
  reports: {
    orderBy: { createdAt: "desc" as const },
    include: {
      reportedBy: { select: { id: true, email: true, profile: true } },
      reviewedBy: { select: { id: true, email: true, profile: true } },
    },
  },
};
```

### AdminRepository.reviewWhere

[AdminRepository.reviewWhere](../../christinacormie-backend/src/modules/admin/admin.repository.ts#L2270)

```ts
return {
  ...(status ? { status } : {}),
  ...(reportedOnly
    ? {
        reports: {
          some: {
            status: { in: [ReportStatus.PENDING, ReportStatus.REVIEWING] },
          },
        },
      }
    : {}),
  ...(source === "CHECK_IN" ? { id: "__no_check_in_review_source__" } : {}),
  ...(query.search
    ? {
        OR: [
          {
            title: {
              contains: query.search,
              mode: "insensitive" as const,
            },
          },
          {
            content: {
              contains: query.search,
              mode: "insensitive" as const,
            },
          },
          {
            customer: {
              email: {
                contains: query.search,
                mode: "insensitive" as const,
              },
            },
          },
          {
            customer: {
              profile: {
                displayName: {
                  contains: query.search,
                  mode: "insensitive" as const,
                },
              },
            },
          },
          {
            vendor: {
              businessName: {
                contains: query.search,
                mode: "insensitive" as const,
              },
            },
          },
          {
            foodTruck: {
              name: {
                contains: query.search,
                mode: "insensitive" as const,
              },
            },
          },
          {
            booking: {
              bookingNumber: {
                contains: query.search,
                mode: "insensitive" as const,
              },
            },
          },
        ],
      }
    : {}),
};
```

### AdminRepository.rewardsPaymentSummary

[AdminRepository.rewardsPaymentSummary](../../christinacormie-backend/src/modules/admin/admin.repository.ts#L2616)

```ts
return {
  pendingPayouts,
  totalAmount: Number(totalPayments._sum.amount ?? 0),
  revenueThisMonth: Number(monthlyRevenue._sum.amount ?? 0),
  commissionEarned: Number(commissionEarned._sum.commissionAmount ?? 0),
};
```

### AdminRepository.toBookingManagementRow

[AdminRepository.toBookingManagementRow](../../christinacormie-backend/src/modules/admin/admin.repository.ts#L3336)

```ts
return {
  id: booking.id,
  bookingNumber: booking.bookingNumber,
  customer: {
    id: booking.customerId,
    name: this.userDisplayName(booking.customer),
    email: booking.customer?.email ?? null,
    phone: booking.customer?.phone ?? null,
  },
  vendor: {
    id: booking.vendorId,
    businessName: booking.vendor?.businessName ?? null,
    email: booking.vendor?.businessEmail ?? null,
    phone: booking.vendor?.businessPhone ?? null,
  },
  foodTruck: booking.foodTruck,
  event: {
    name: booking.eventName,
    type: booking.eventType,
    bookingType: booking.bookingType,
    startsAt: booking.startsAt,
    endsAt: booking.endsAt,
    guestCount: booking.guestCount,
    address: booking.address,
  },
  amount: Number(booking.totalAmount ?? 0),
  fees: {
    subtotal: Number(booking.subtotal ?? 0),
    serviceFee: Number(booking.serviceFee ?? 0),
    taxAmount: Number(booking.taxAmount ?? 0),
    discountAmount: Number(booking.discountAmount ?? 0),
  },
  paymentModel: quote?.paymentPreference ?? booking.paymentPreference,
  pricingModel: quote?.pricingModel ?? null,
  status: booking.status,
  payment: payment
    ? {
        id: payment.id,
        amount: Number(payment.amount ?? 0),
        currency: payment.currency,
        status: payment.status,
        paidAt: payment.paidAt,
        createdAt: payment.createdAt,
        commission: payment.commission
          ? {
              ...payment.commission,
              grossAmount: Number(payment.commission.grossAmount ?? 0),
              commissionRate: Number(payment.commission.commissionRate ?? 0),
              commissionAmount: Number(payment.commission.commissionAmount ?? 0),
              vendorNetAmount: Number(payment.commission.vendorNetAmount ?? 0),
            }
          : null,
        refunds: (payment.refunds ?? []).map((refund) => ({
          ...refund,
          amount: Number(refund.amount ?? 0),
        })),
      }
    : null,
  dispute: {
    isDisputed: Boolean(booking.review?.reports?.length),
    reports: booking.review?.reports ?? [],
    source: "review_reports",
  },
  createdAt: booking.createdAt,
};
```

### AdminRepository.toCommunityManagementRow

[AdminRepository.toCommunityManagementRow](../../christinacormie-backend/src/modules/admin/admin.repository.ts#L2200)

```ts
return {
  id: post.id,
  postId: this.shortDisplayId("P", post.id),
  title: post.title,
  content: post.description ?? post.title,
  category: post.category,
  type: post.requestType,
  status: post.status,
  visibility: post.visibility,
  author: {
    id: author.id,
    userId: this.shortDisplayId("U", author.id),
    name: authorName,
    initials: this.initials(authorName),
    email: author.email,
    phone: author.phone ?? null,
    avatarUrl: author.profile?.avatarUrl ?? null,
  },
  postedAt: post.createdAt,
  createdAt: post.createdAt,
  deletedAt: post.deletedAt,
  likes: reactions.length,
  commentsCount: comments.length,
  media: post.media ?? [],
  imageUrls: (post.media ?? [])
    .filter((media) => media.mediaType?.toLowerCase().startsWith("image"))
    .map((media) => media.mediaUrl),
  isReported: activeReports.length > 0,
  reportReason: primaryReport?.reason ?? null,
  reportStatus: primaryReport?.status ?? null,
  reports: post.reports ?? [],
  comments: comments.map((comment) => {
    const commenter = comment.user as CommunityAuthor;
    const commenterName = this.userDisplayName(commenter);

    return {
      id: comment.id,
      content: comment.content,
      createdAt: comment.createdAt,
      deletedAt: comment.deletedAt,
      author: {
        id: commenter.id,
        name: commenterName,
        initials: this.initials(commenterName),
        email: commenter.email,
        avatarUrl: commenter.profile?.avatarUrl ?? null,
      },
      likes: 0,
    };
  }),
  moderation: {
    canRemove: !post.deletedAt,
    canContactAuthor: Boolean(author.email || author.phone),
  },
};
```

### AdminRepository.toPaymentMethodRow

[AdminRepository.toPaymentMethodRow](../../christinacormie-backend/src/modules/admin/admin.repository.ts#L2881)

```ts
return {
  id: account.id,
  vendorId: account.vendorId,
  vendorName: account.vendor?.businessName ?? null,
  type: "STRIPE_CONNECT",
  label: `Stripe · Connected account ${account.stripeAccountId}`,
  isPrimary: true,
  isVerified: account.onboardingCompleted && account.payoutsEnabled,
  onboardingCompleted: account.onboardingCompleted,
  chargesEnabled: account.chargesEnabled,
  payoutsEnabled: account.payoutsEnabled,
  disabledReason: account.disabledReason,
  updatedAt: account.updatedAt,
};
```

### AdminRepository.toPaymentTransaction

[AdminRepository.toPaymentTransaction](../../christinacormie-backend/src/modules/admin/admin.repository.ts#L2568)

```ts
return {
  id: payment.id,
  transactionId: this.shortDisplayId("TXN", payment.id),
  type: "BOOKING",
  vendorId: payment.vendorId,
  vendorName: payment.vendor?.businessName ?? null,
  amount: Number(payment.amount ?? 0),
  commission: Number(payment.commission?.commissionAmount ?? 0),
  method: payment.stripePaymentIntentId ? "Stripe" : "Unknown",
  date: payment.paidAt ?? payment.createdAt,
  status: payment.status,
  booking: payment.booking,
};
```

### AdminRepository.toPayoutRequestRow

[AdminRepository.toPayoutRequestRow](../../christinacormie-backend/src/modules/admin/admin.repository.ts#L2499)

```ts
return {
  id: payout.id,
  payoutId: this.shortDisplayId("PO", payout.id),
  vendorId: payout.vendorId,
  vendorName: payout.vendor?.businessName ?? null,
  ownerName: this.userDisplayName(payout.vendor?.user),
  ownerEmail: payout.vendor?.businessEmail ?? payout.vendor?.user?.email ?? null,
  amount: Number(payout.amount ?? 0),
  currency: payout.currency,
  completedBookings: payout.vendor?.bookings?.length ?? 0,
  payoutMethod: this.payoutMethod(paymentAccount),
  requestedAt: payout.createdAt,
  status: this.payoutDisplayStatus(payout.status),
  failureReason: payout.failureReason,
  paidAt: payout.paidAt,
  taxInfo: {
    w9Submitted: null,
    taxIdType: null,
    ytdEarnings,
    threshold1099K: 600,
    requires1099K: ytdEarnings >= 600,
  },
  actions: {
    canApprove: payout.status === PayoutStatus.PENDING,
    canReject: payout.status === PayoutStatus.PENDING,
    canHold: payout.status === PayoutStatus.PENDING,
  },
};
```

### AdminRepository.toPayoutTransaction

[AdminRepository.toPayoutTransaction](../../christinacormie-backend/src/modules/admin/admin.repository.ts#L2584)

```ts
return {
  id: payout.id,
  transactionId: this.shortDisplayId("TXN", payout.id),
  type: "PAYOUT",
  vendorId: payout.vendorId,
  vendorName: payout.vendor?.businessName ?? null,
  amount: Number(payout.amount ?? 0),
  commission: 0,
  method: payout.stripeTransferId ? "Stripe Transfer" : "Stripe Connect",
  date: payout.paidAt ?? payout.createdAt,
  status: this.payoutDisplayStatus(payout.status),
  booking: null,
};
```

### AdminRepository.toRefundTransaction

[AdminRepository.toRefundTransaction](../../christinacormie-backend/src/modules/admin/admin.repository.ts#L2600)

```ts
return {
  id: refund.id,
  transactionId: this.shortDisplayId("TXN", refund.id),
  type: "REFUND",
  vendorId: refund.payment?.vendorId ?? null,
  vendorName: refund.payment?.vendor?.businessName ?? null,
  amount: -Number(refund.amount ?? 0),
  commission: -Number(refund.payment?.commission?.commissionAmount ?? 0),
  method: refund.stripeRefundId ? "Stripe" : "Unknown",
  date: refund.processedAt ?? new Date(0),
  status: refund.status,
  booking: null,
};
```

### AdminRepository.toRevenueOverview

[AdminRepository.toRevenueOverview](../../christinacormie-backend/src/modules/admin/admin.repository.ts#L2898)

```ts
return {
  summary: {
    totalRevenueYtd,
    platformCommissionYtd,
    vendorPayoutsYtd,
  },
  monthlyRevenueBreakdown: months,
  commissionVsPayouts: months.map((item) => ({
    month: item.month,
    commission: item.commission,
    payouts: item.payouts,
  })),
};
```

### AdminRepository.toReviewManagementRow

[AdminRepository.toReviewManagementRow](../../christinacormie-backend/src/modules/admin/admin.repository.ts#L2413)

```ts
return {
  id: review.id,
  reviewId: this.shortDisplayId("R", review.id),
  rating: review.rating,
  title: review.title,
  content: review.content,
  visibleContent: review.contentHidden ? null : review.content,
  isVerified: review.isVerified,
  status: review.status,
  contentHidden: review.contentHidden,
  ratingVisible: review.ratingVisible,
  source: "BOOKING",
  sourceLabel: "Booking",
  customer: {
    id: customer.id,
    name: customerName,
    initials: this.initials(customerName),
    email: customer.email,
    phone: customer.phone ?? null,
    avatarUrl: customer.profile?.avatarUrl ?? null,
  },
  vendor: review.vendor,
  foodTruck: review.foodTruck,
  booking: review.booking,
  isReported: activeReports.length > 0,
  reportReason: primaryReport?.reason ?? null,
  reportDescription: primaryReport?.description ?? null,
  reportStatus: primaryReport?.status ?? null,
  reports: review.reports ?? [],
  moderationReason: review.moderationReason,
  createdAt: review.createdAt,
  moderatedAt: review.moderatedAt,
  actions: {
    canRemoveCompletely: review.status !== ReviewStatus.REMOVED,
    canHideTextOnly: !review.contentHidden,
    canKeepReview: activeReports.length > 0,
  },
};
```

### AdminRepository.toRewardLeaderboardRows

[AdminRepository.toRewardLeaderboardRows](../../christinacormie-backend/src/modules/admin/admin.repository.ts#L2646)

Delegation: `entries.map((entry) =&gt; { const revenue = this.sumAmounts(entry.vendor?.payments ?? []); return { rank: entry.rank, vendorId: entry.vendorId, foodTruckId: entry.foodTruckId, truckName: entry.foodTruck?.name ?? entry.vendor?.businessName ?? null, ownerName: this.userDisplayName(entry.vendor?.user), location: entry.foodTruck?.primaryCity ?? null, poin [full expression in linked source] OR fallbackVendors .map((vendor) =&gt; { const primaryTruck = vendor.foodTrucks[0] ?? null; const bookings = vendor.foodTrucks.reduce( (sum, truck) =&gt; sum + (truck.totalBookings ?? 0), 0, ); const reviews = vendor.foodTrucks.reduce( (sum, truck) =&gt; sum + (truck.totalReviews ?? 0), 0, ); const checkIns = vendor.foodTrucks.reduce( (sum, truck) =&gt; sum + (tr [full expression in linked source]`.

### AdminRepository.toRewardRedemptionRow

[AdminRepository.toRewardRedemptionRow](../../christinacormie-backend/src/modules/admin/admin.repository.ts#L2731)

```ts
return {
  id: redemption.id,
  transactionId: this.shortDisplayId("RDM", redemption.id),
  user: {
    id: redemption.userId,
    name: this.userDisplayName(redemption.user),
    email: redemption.user?.email ?? null,
    tier,
  },
  truck: truck
    ? { id: truck.id, name: truck.name }
    : redemption.foodTruckId
      ? { id: redemption.foodTruckId, name: null }
      : null,
  truckOwner: vendor
    ? {
        id: vendor.id,
        name: this.userDisplayName(vendor.user),
        businessName: vendor.businessName,
      }
    : null,
  points: -Math.abs(redemption.pointsSpent),
  credit,
  minimumPurchaseAmount: redemption.minimumPurchaseAmount
    ? Number(redemption.minimumPurchaseAmount)
    : null,
  fundingType:
    redemption.fundingType ?? redemption.rewardRule?.fundingType ?? "VENDOR_FUNDED",
  date: redemption.usedAt ?? redemption.redeemedAt,
  status: this.rewardRedemptionStatus(redemption),
  rewardRule: redemption.rewardRule
    ? {
        id: redemption.rewardRule.id,
        name: redemption.rewardRule.name,
        rewardType: redemption.rewardRule.rewardType,
        fundingType: redemption.rewardRule.fundingType,
        totalRedemptionLimit: redemption.rewardRule.totalRedemptionLimit,
        eligibleVendorScope: redemption.rewardRule.eligibleVendorScope,
      }
    : null,
  code: redemption.backupCode ?? null,
};
```

### AdminRepository.toRewardTopUser

[AdminRepository.toRewardTopUser](../../christinacormie-backend/src/modules/admin/admin.repository.ts#L2794)

```ts
return {
  rank,
  userId: account.userId,
  name: this.userDisplayName(account.user),
  email: account.user?.email ?? null,
  tier,
  points: account.lifetimePoints ?? 0,
  availablePoints: account.availablePoints ?? 0,
  redeemedPoints: account.redeemedPoints ?? 0,
  transactions: account._count?.transactions ?? 0,
  progressToLegendPercent: Math.min(
    100,
    Math.round(((account.lifetimePoints ?? 0) / 10000) * 100),
  ),
};
```

### AdminRepository.toUserManagementRow

[AdminRepository.toUserManagementRow](../../christinacormie-backend/src/modules/admin/admin.repository.ts#L2066)

```ts
return {
  id: user.id,
  userId: this.shortDisplayId("U", user.id),
  name,
  initials: this.initials(name),
  email: user.email,
  phone: user.phone,
  location: this.userLocation(user.profile),
  joinDate: user.createdAt,
  memberSince: user.createdAt,
  lastLoginAt: user.lastLoginAt,
  activity: {
    totalBookings,
    referrals,
  },
  totalBookings,
  referrals,
  loyaltyPoints,
  lifetimePoints: user.loyaltyAccount?.lifetimePoints ?? 0,
  redeemedPoints: user.loyaltyAccount?.redeemedPoints ?? 0,
  status: user.status,
  roles: (user.userRoles ?? []).map((userRole) => userRole.role),
  profile: user.profile,
  canSuspend: user.status !== AccountStatus.SUSPENDED,
  canRetrieve: user.status === AccountStatus.SUSPENDED,
  contact: {
    name,
    email: user.email,
    phone: user.phone,
    location: this.userLocation(user.profile),
  },
};
```

### AdminRepository.toVendorManagementRow

[AdminRepository.toVendorManagementRow](../../christinacormie-backend/src/modules/admin/admin.repository.ts#L3135)

```ts
return {
  id: vendor.id,
  businessName: vendor.businessName,
  status: vendor.status,
  isVerified: vendor.isVerified,
  ownerName: this.userDisplayName(vendor.user),
  email: vendor.businessEmail ?? vendor.user?.email ?? null,
  phone: vendor.businessPhone ?? vendor.user?.phone ?? null,
  cuisine: cuisines[0] ?? null,
  cuisines,
  rating: Number(primaryTruck?.averageRating ?? 0),
  reviews: totalReviews,
  followers: totalFollowers,
  totalBookings,
  revenueGenerated: totalRevenue,
  description: vendor.description ?? primaryTruck?.description ?? null,
  serviceArea:
    primaryTruck?.serviceAreas?.map((area) => area.name).join(", ") ??
    primaryTruck?.currentAddress ??
    null,
  menuItems: menuItems.slice(0, 12).map((item) => item.name),
  priceRange: this.priceRange(prices),
  memberSince: vendor.createdAt,
  primaryTruck,
  foodTrucks: trucks,
  verificationRequests: vendor.verificationRequests ?? [],
  documents: vendor.verificationRequests?.[0]?.documents ?? [],
  badges: vendor.vendorBadges ?? [],
  photoShootRequests: vendor.photoShootRequests ?? [],
};
```

### AdminRepository.userManagementSelect

[AdminRepository.userManagementSelect](../../christinacormie-backend/src/modules/admin/admin.repository.ts#L2037)

```ts
return {
  id: true,
  email: true,
  phone: true,
  status: true,
  lastLoginAt: true,
  createdAt: true,
  updatedAt: true,
  profile: true,
  loyaltyAccount: {
    select: {
      availablePoints: true,
      lifetimePoints: true,
      redeemedPoints: true,
    },
  },
  userRoles: {
    select: { role: true },
  },
  _count: {
    select: {
      customerBookings: true,
      referralsMade: true,
    },
  },
};
```

### AdminRepository.userOrderBy

[AdminRepository.userOrderBy](../../christinacormie-backend/src/modules/admin/admin.repository.ts#L2025)

```ts
return { updatedAt: query.sortOrder ?? "desc" };
```

```ts
return { status: query.sortOrder ?? "asc" };
```

```ts
return { createdAt: query.sortOrder ?? "desc" };
```

### AdminRepository.userWhere

[AdminRepository.userWhere](../../christinacormie-backend/src/modules/admin/admin.repository.ts#L1960)

```ts
return {
  deletedAt: null,
  ...(query.status ? { status: query.status as AccountStatus } : {}),
  ...(query.search
    ? {
        OR: [
          {
            email: {
              contains: query.search,
              mode: "insensitive" as const,
            },
          },
          {
            phone: {
              contains: query.search,
              mode: "insensitive" as const,
            },
          },
          {
            profile: {
              displayName: {
                contains: query.search,
                mode: "insensitive" as const,
              },
            },
          },
          {
            profile: {
              firstName: {
                contains: query.search,
                mode: "insensitive" as const,
              },
            },
          },
          {
            profile: {
              lastName: {
                contains: query.search,
                mode: "insensitive" as const,
              },
            },
          },
          {
            profile: {
              city: {
                contains: query.search,
                mode: "insensitive" as const,
              },
            },
          },
          {
            profile: {
              state: {
                contains: query.search,
                mode: "insensitive" as const,
              },
            },
          },
        ],
      }
    : {}),
};
```

### AdminRepository.vendorManagementSelect

[AdminRepository.vendorManagementSelect](../../christinacormie-backend/src/modules/admin/admin.repository.ts#L3025)

```ts
return {
  id: true,
  userId: true,
  marketId: true,
  businessName: true,
  businessEmail: true,
  businessPhone: true,
  description: true,
  logoUrl: true,
  websiteUrl: true,
  selectedPlan: true,
  status: true,
  isVerified: true,
  verifiedAt: true,
  reliabilityScore: true,
  approvedAt: true,
  rejectionReason: true,
  createdAt: true,
  updatedAt: true,
  user: {
    select: {
      id: true,
      email: true,
      phone: true,
      status: true,
      profile: true,
    },
  },
  market: {
    select: this.marketSelect(),
  },
  verificationRequests: {
    orderBy: { createdAt: "desc" as const },
    select: {
      id: true,
      status: true,
      documents: true,
      notes: true,
      reviewedAt: true,
      rejectionReason: true,
      createdAt: true,
      reviewedBy: {
        select: { id: true, email: true, profile: true },
      },
    },
  },
  foodTrucks: {
    where: { deletedAt: null },
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      status: true,
      truckType: true,
      currentAddress: true,
      primaryCity: true,
      averageRating: true,
      totalReviews: true,
      totalBookings: true,
      followerCount: true,
      createdAt: true,
      cuisines: { include: { cuisine: true } },
      serviceAreas: {
        select: {
          id: true,
          name: true,
          centerAddress: true,
          radiusKm: true,
        },
      },
      menus: {
        where: { isActive: true },
        select: {
          id: true,
          name: true,
          categories: {
            select: {
              id: true,
              name: true,
              items: {
                where: { status: MenuItemStatus.AVAILABLE },
                select: {
                  id: true,
                  name: true,
                  price: true,
                },
              },
            },
          },
        },
      },
    },
  },
  payments: {
    where: { status: PaymentStatus.SUCCEEDED },
    select: { amount: true },
  },
  vendorBadges: {
    where: { revokedAt: null },
    include: { badge: true },
  },
  photoShootRequests: {
    orderBy: { createdAt: "desc" as const },
    take: 3,
  },
};
```

### AdminRepository.vendorWhere

[AdminRepository.vendorWhere](../../christinacormie-backend/src/modules/admin/admin.repository.ts#L1655)

```ts
return {
  deletedAt: null,
  ...(query.status ? { status: query.status as any } : {}),
  ...(query.search
    ? {
        OR: [
          {
            businessName: {
              contains: query.search,
              mode: "insensitive" as const,
            },
          },
          {
            businessEmail: {
              contains: query.search,
              mode: "insensitive" as const,
            },
          },
          {
            businessPhone: {
              contains: query.search,
              mode: "insensitive" as const,
            },
          },
          {
            user: {
              email: {
                contains: query.search,
                mode: "insensitive" as const,
              },
            },
          },
          {
            user: {
              profile: {
                displayName: {
                  contains: query.search,
                  mode: "insensitive" as const,
                },
              },
            },
          },
          {
            foodTrucks: {
              some: {
                name: {
                  contains: query.search,
                  mode: "insensitive" as const,
                },
              },
            },
          },
        ],
      }
    : {}),
};
```

### AuthService.authUserInclude

[AuthService.authUserInclude](../../christinacormie-backend/src/modules/auth/auth.service.ts#L1285)

```ts
return {
  userRoles: true,
  profile: true,
  vendor: true,
  vendorStaff: {
    include: {
      vendor: true,
    },
  },
};
```

### AuthService.changePassword

[AuthService.changePassword](../../christinacormie-backend/src/modules/auth/auth.service.ts#L423)

```ts
return {
  success: true,
  message: "Password changed successfully",
};
```

### AuthService.createAuthResponse

[AuthService.createAuthResponse](../../christinacormie-backend/src/modules/auth/auth.service.ts#L898)

```ts
return {
  accessToken,
  refreshToken,
  user: this.toAuthUser(user),
  ...(authContext
    ? {
        authFlow: authContext.authFlow,
        isNewUser: authContext.isNewUser,
        onboarding: this.toOnboardingState(user),
      }
    : {}),
};
```

### AuthService.logout

[AuthService.logout](../../christinacormie-backend/src/modules/auth/auth.service.ts#L696)

```ts
return { success: true };
```

```ts
return { success: true };
```

### AuthService.parseProfileName

[AuthService.parseProfileName](../../christinacormie-backend/src/modules/auth/auth.service.ts#L1147)

```ts
return {
  firstName,
  lastName: lastNameParts.join(" ") || undefined,
};
```

### AuthService.toAuthUser

[AuthService.toAuthUser](../../christinacormie-backend/src/modules/auth/auth.service.ts#L1207)

```ts
return {
  id: user.id,
  email: user.email,
  displayName,
  roles,
  ...(isVendor && user.vendor
    ? {
        vendor: {
          id: user.vendor.id,
          businessName: user.vendor.businessName,
        },
      }
    : {}),
  ...(isStaff && user.vendorStaff
    ? {
        staff: {
          id: user.vendorStaff.id,
          vendorId: user.vendorStaff.vendorId,
          businessName: user.vendorStaff.vendor?.businessName,
        },
      }
    : {}),
};
```

### AuthService.toOnboardingState

[AuthService.toOnboardingState](../../christinacormie-backend/src/modules/auth/auth.service.ts#L1243)

```ts
return {
  requiresProfileSetup,
  requiresVendorOnboarding,
  nextStep: requiresProfileSetup
    ? "PROFILE_SETUP"
    : requiresVendorOnboarding
      ? "VENDOR_ONBOARDING"
      : "HOME",
  missingFields,
};
```

### AuthService.toPendingVerificationResponse

[AuthService.toPendingVerificationResponse](../../christinacormie-backend/src/modules/auth/auth.service.ts#L1157)

```ts
return {
  success: true,
  status: AccountStatus.PENDING,
  message: "Registration successful. Verify the 6-digit code sent to your email.",
  email,
};
```

### BookingsRepository.bookingInclude

[BookingsRepository.bookingInclude](../../christinacormie-backend/src/modules/bookings/bookings.repository.ts#L1045)

```ts
return {
  customer: {
    select: {
      id: true,
      email: true,
      phone: true,
      profile: {
        select: {
          displayName: true,
          firstName: true,
          lastName: true,
          avatarUrl: true,
        },
      },
    },
  },
  foodTruck: {
    select: {
      id: true,
      name: true,
      slug: true,
      vendorId: true,
      profileImageUrl: true,
    },
  },
  vendor: {
    select: {
      id: true,
      userId: true,
      businessName: true,
      businessPhone: true,
      logoUrl: true,
    },
  },
  communityRequest: {
    select: {
      id: true,
      title: true,
      eventType: true,
      guestCount: true,
      address: true,
      budgetMin: true,
      budgetMax: true,
      contactPhone: true,
      preferredMenuItems: true,
      media: true,
    },
  },
  vendorOffer: true,
  quotes: {
    orderBy: { createdAt: "desc" as const },
  },
  statusHistory: {
    orderBy: { createdAt: "asc" as const },
  },
};
```

### BookingsRepository.countVendorRequests

[BookingsRepository.countVendorRequests](../../christinacormie-backend/src/modules/bookings/bookings.repository.ts#L206)

```ts
return {
  bookings: bookingsCount,
  community: communityCount,
  messages: messagesCount,
};
```

### BookingsService.approveCompletion

[BookingsService.approveCompletion](../../christinacormie-backend/src/modules/bookings/bookings.service.ts#L200)

```ts
return {
  message: "Booking completed and payment released successfully",
  booking: updated,
};
```

### BookingsService.createBookingRequest

[BookingsService.createBookingRequest](../../christinacormie-backend/src/modules/bookings/bookings.service.ts#L44)

```ts
return {
  message:
    "Booking request sent! Your booking request has been sent to the vendor. You'll receive a quote within 24 hours.",
  booking,
};
```

### BookingsService.createVendorQuote

[BookingsService.createVendorQuote](../../christinacormie-backend/src/modules/bookings/bookings.service.ts#L673)

```ts
return {
  ...quoteResult,
  message: "Quote sent successfully",
  breakdown: calculated,
};
```

### BookingsService.ensureBookingVisible

[BookingsService.ensureBookingVisible](../../christinacormie-backend/src/modules/bookings/bookings.service.ts#L812)

```ts
return { booking, roleView: "CUSTOMER" as const };
```

```ts
return { booking, roleView: "ADMIN" as const };
```

```ts
return { booking, roleView: "VENDOR" as const };
```

### BookingsService.ensureIssueVisible

[BookingsService.ensureIssueVisible](../../christinacormie-backend/src/modules/bookings/bookings.service.ts#L840)

```ts
return { issue, senderRole: "ADMIN" as const };
```

```ts
return { issue, senderRole: "CUSTOMER" as const };
```

```ts
return { issue, senderRole: "VENDOR" as const };
```

### BookingsService.listIssueMessages

[BookingsService.listIssueMessages](../../christinacormie-backend/src/modules/bookings/bookings.service.ts#L352)

```ts
return {
  issue: this.presentIssue(issue),
  messages: issue.messages.map((message) => this.presentIssueMessage(message)),
};
```

### BookingsService.listIssues

[BookingsService.listIssues](../../christinacormie-backend/src/modules/bookings/bookings.service.ts#L332)

```ts
return {
  items: issues.map((issue) => {
    const messages = issue.messages.map((message) => this.presentIssueMessage(message));

    return {
      ...this.presentIssue(issue),
      messagesCount: messages.length,
      lastMessage: messages.at(-1) ?? null,
      messages,
    };
  }),
};
```

### BookingsService.presentIssue

[BookingsService.presentIssue](../../christinacormie-backend/src/modules/bookings/bookings.service.ts#L983)

```ts
return {
  id: issue.id,
  bookingId: issue.bookingId,
  status: issue.status,
  message: issue.message,
  resolutionDecision: issue.resolutionDecision ?? null,
  resolutionNote: issue.resolutionNote ?? null,
  resolvedById: issue.resolvedById ?? null,
  createdAt: issue.createdAt,
  resolvedAt: issue.resolvedAt ?? null,
};
```

### BookingsService.presentIssueMessage

[BookingsService.presentIssueMessage](../../christinacormie-backend/src/modules/bookings/bookings.service.ts#L997)

```ts
return {
  id: message.id,
  senderUserId: message.senderId ?? message.sender?.id ?? null,
  senderRole: message.senderRole,
  sender: message.sender
    ? {
        id: message.sender.id,
        email: message.sender.email,
        displayName,
      }
    : null,
  senderName: displayName || message.senderRole,
  message: message.message,
  createdAt: message.createdAt,
};
```

### BookingsService.presentTracking

[BookingsService.presentTracking](../../christinacormie-backend/src/modules/bookings/bookings.service.ts#L871)

```ts
return {
  bookingId: booking!.id,
  bookingNumber: booking!.bookingNumber,
  roleView,
  currentStep:
    steps.find((item) => item.status === "CURRENT")?.key ??
    [...steps].reverse().find((item) => item.status === "DONE")?.key ??
    steps[0].key,
  completion: {
    requestedAt: booking!.completionRequestedAt?.toISOString() ?? null,
    approvedAt: booking!.completionApprovedAt?.toISOString() ?? null,
    paymentReleasedAt: booking!.paymentReleasedAt?.toISOString() ?? null,
    hasOpenIssue: Boolean(booking!.issues.length),
  },
  steps,
};
```

### BookingsService.reportIssue

[BookingsService.reportIssue](../../christinacormie-backend/src/modules/bookings/bookings.service.ts#L246)

```ts
return {
  message: "Issue submitted successfully",
  issue: this.presentIssue(issue),
};
```

### BookingsService.requestCompletion

[BookingsService.requestCompletion](../../christinacormie-backend/src/modules/bookings/bookings.service.ts#L144)

```ts
return {
  message: "Completion request sent successfully",
  booking: updated,
};
```

### BookingsService.resolveIssue

[BookingsService.resolveIssue](../../christinacormie-backend/src/modules/bookings/bookings.service.ts#L463)

```ts
return {
  message: "Issue resolved, booking completed, and payout released",
  decision: dto.decision,
  issue: this.presentIssue(resolved),
  booking,
  payment: { payout },
};
```

```ts
return {
  message: "Issue resolved and full refund started",
  decision: dto.decision,
  issue: this.presentIssue(resolved),
  booking,
  payment: refundResult,
};
```

### BookingsService.sendIssueMessage

[BookingsService.sendIssueMessage](../../christinacormie-backend/src/modules/bookings/bookings.service.ts#L367)

```ts
return {
  message: "Message sent successfully",
  item: this.presentIssueMessage(message),
};
```

### BookingsService.validateServiceArea

[BookingsService.validateServiceArea](../../christinacormie-backend/src/modules/bookings/bookings.service.ts#L1070)

```ts
return {
  distanceKm,
  outsideServiceRadius,
  outsideRadiusFee: outsideServiceRadius ? outsideRadiusFee : 0,
};
```

### BookingsService.withVendorPhone

[BookingsService.withVendorPhone](../../christinacormie-backend/src/modules/bookings/bookings.service.ts#L1047)

```ts
return {
  ...booking,
  vendorPhone: booking.vendor?.businessPhone ?? null,
};
```

### CommunityPostsService.action

[CommunityPostsService.action](../../christinacormie-backend/src/modules/community/community-posts.service.ts#L372)

```ts
return {
  message:
    type === "INTEREST"
      ? "Your interest was sent to the organizer"
      : "Post hidden from your Community feed",
};
```

### CommunityPostsService.comments

[CommunityPostsService.comments](../../christinacormie-backend/src/modules/community/community-posts.service.ts#L552)

```ts
return {
  message: "Comments retrieved successfully",
  items,
  pagination: {
    total,
    limit,
    offset,
    nextOffset: offset + items.length < total ? offset + items.length : null,
  },
};
```

### CommunityPostsService.create

[CommunityPostsService.create](../../christinacormie-backend/src/modules/community/community-posts.service.ts#L35)

```ts
return {
  message: "Community post created successfully",
  post: await this.details(userId, post.id),
  rewardStatus: post.rewardStatus,
  ...("rewardMessage" in post ? { rewardMessage: post.rewardMessage } : {}),
};
```

### CommunityPostsService.interests

[CommunityPostsService.interests](../../christinacormie-backend/src/modules/community/community-posts.service.ts#L508)

```ts
return { message: "Vendor interests retrieved successfully", items, total };
```

### CommunityPostsService.list

[CommunityPostsService.list](../../christinacormie-backend/src/modules/community/community-posts.service.ts#L142)

```ts
return {
  message: "Community posts retrieved successfully",
  items: posts.map((p) => ({
    ...this.present(p, userId, canRespond),
    ...(distances ? { distanceKm: distances.get(p.id) } : {}),
  })),
  pagination: {
    total,
    limit,
    offset,
    nextOffset: offset + posts.length < total ? offset + posts.length : null,
  },
};
```

### CommunityPostsService.present

[CommunityPostsService.present](../../christinacormie-backend/src/modules/community/community-posts.service.ts#L87)

```ts
return {
  ...data,
  author: {
    id: createdBy.id,
    displayName:
      createdBy.profile?.displayName ?? createdBy.vendor?.businessName ?? "Member",
    avatarUrl: createdBy.profile?.avatarUrl ?? createdBy.vendor?.logoUrl ?? null,
    roles: createdBy.userRoles.map((r) => r.role),
    vendor: createdBy.vendor,
  },
  counts: {
    comments: _count.comments,
    reactions: _count.reactions,
    offers: _count.vendorOffers,
    interestedVendors: _count.actions,
  },
  viewer: {
    isOwner,
    isIgnored: actions.some((a) => a.type === "IGNORE"),
    isInterested: actions.some((a) => a.type === "INTEREST"),
  },
  allowedActions: {
    canEdit: isOwner && open && !_count.vendorOffers,
    canDelete: isOwner && open && !_count.vendorOffers,
    canQuote:
      !isOwner &&
      canRespond &&
      open &&
      post.category === "NEED_TRUCK" &&
      !vendorOffers.length,
    canSendInterest:
      !isOwner &&
      canRespond &&
      open &&
      post.category === "VENDOR_CALLOUT" &&
      !actions.some((a) => a.type === "INTEREST"),
  },
};
```

### CommunityPostsService.remove

[CommunityPostsService.remove](../../christinacormie-backend/src/modules/community/community-posts.service.ts#L360)

```ts
return { message: "Community post deleted successfully", deleted: true };
```

### CommunityPostsService.report

[CommunityPostsService.report](../../christinacormie-backend/src/modules/community/community-posts.service.ts#L445)

```ts
return {
  message: "Report submitted successfully",
  report: {
    id: report.id,
    postId: report.postId,
    reason: report.reason,
    status: report.status,
    createdAt: report.createdAt,
  },
};
```

### CommunityPostsService.undoAction

[CommunityPostsService.undoAction](../../christinacormie-backend/src/modules/community/community-posts.service.ts#L428)

```ts
return {
  message:
    type === "INTEREST"
      ? "Interest withdrawn successfully"
      : "Post restored to your Community feed",
};
```

### CommunityPostsService.update

[CommunityPostsService.update](../../christinacormie-backend/src/modules/community/community-posts.service.ts#L249)

```ts
return {
  message: "Community post updated successfully",
  post: await this.details(userId, postId),
};
```

### CommunityPostsService.upload

[CommunityPostsService.upload](../../christinacormie-backend/src/modules/community/community-posts.service.ts#L591)

```ts
return { message: "Attachments uploaded successfully", media };
```

### CommunityRepository.offerInclude

[CommunityRepository.offerInclude](../../christinacormie-backend/src/modules/community/community.repository.ts#L727)

```ts
return {
  vendor: {
    select: {
      id: true,
      businessName: true,
      logoUrl: true,
      isVerified: true,
    },
  },
  foodTruck: {
    select: {
      id: true,
      name: true,
      slug: true,
      profileImageUrl: true,
      averageRating: true,
    },
  },
  communityRequest: {
    select: {
      id: true,
      title: true,
      status: true,
      createdById: true,
      eventType: true,
      description: true,
      eventDate: true,
      startTime: true,
      endTime: true,
      eventTimezone: true,
      guestCount: true,
      address: true,
      contactPhone: true,
      budgetMin: true,
      budgetMax: true,
    },
  },
};
```

### CommunityRepository.requestInclude

[CommunityRepository.requestInclude](../../christinacormie-backend/src/modules/community/community.repository.ts#L685)

```ts
return {
  media: true,
  targetFoodTruck: {
    select: {
      id: true,
      name: true,
      slug: true,
      profileImageUrl: true,
    },
  },
  createdBy: {
    select: {
      id: true,
      profile: {
        select: {
          displayName: true,
          avatarUrl: true,
        },
      },
    },
  },
  vendorOffers: {
    select: {
      id: true,
      status: true,
      quotedAmount: true,
      foodTruckId: true,
      vendorId: true,
      createdAt: true,
    },
  },
  _count: {
    select: {
      comments: true,
      reactions: true,
      vendorOffers: true,
    },
  },
};
```

### CommunityService.createPublicRequest

[CommunityService.createPublicRequest](../../christinacormie-backend/src/modules/community/community.service.ts#L34)

```ts
return {
  ...request,
  rewardStatus: reward.awarded ? "AWARDED" : "NOT_AWARDED",
};
```

```ts
return {
  ...request,
  rewardStatus: "UNCONFIRMED",
  rewardMessage:
    "Post created, but reward processing could not be confirmed. Please contact support; do not repost.",
};
```

### DiscoveryService.toFoodTruckListResponse

[DiscoveryService.toFoodTruckListResponse](../../christinacormie-backend/src/modules/discovery/discovery.service.ts#L52)

```ts
return {
  meta: {
    count: foodTrucks.length,
    ...(center
      ? {
          center: {
            latitude: center.latitude,
            longitude: center.longitude,
          },
          radiusKm: center.radiusKm,
        }
      : {}),
  },
  foodTrucks,
};
```

### FoodTrucksRepository.foodTruckInclude

[FoodTrucksRepository.foodTruckInclude](../../christinacormie-backend/src/modules/food-trucks/food-trucks.repository.ts#L944)

```ts
return {
  images: true,
  cuisines: {
    include: {
      cuisine: true,
    },
  },
  menus: {
    include: {
      categories: {
        include: {
          items: true,
        },
      },
    },
  },
  serviceAreas: true,
  operatingHours: {
    orderBy: { dayOfWeek: "asc" as const },
  },
  availabilityExceptions: {
    orderBy: { exceptionDate: "asc" as const },
  },
};
```

### FoodTrucksRepository.publicFoodTruckInclude

[FoodTrucksRepository.publicFoodTruckInclude](../../christinacormie-backend/src/modules/food-trucks/food-trucks.repository.ts#L971)

```ts
return {
  vendor: {
    select: {
      id: true,
      businessName: true,
      logoUrl: true,
      isVerified: true,
      reliabilityScore: true,
    },
  },
  market: true,
  images: {
    orderBy: { sortOrder: "asc" as const },
  },
  cuisines: {
    include: {
      cuisine: true,
    },
  },
  menus: {
    where: { isActive: true },
    include: {
      categories: {
        orderBy: { sortOrder: "asc" as const },
        include: {
          items: {
            orderBy: { sortOrder: "asc" as const },
          },
        },
      },
    },
  },
  serviceAreas: {
    where: { isActive: true },
  },
  operatingHours: {
    orderBy: { dayOfWeek: "asc" as const },
  },
  availabilityExceptions: {
    orderBy: { exceptionDate: "asc" as const },
  },
};
```

### FoodTrucksRepository.publicFoodTruckWhere

[FoodTrucksRepository.publicFoodTruckWhere](../../christinacormie-backend/src/modules/food-trucks/food-trucks.repository.ts#L1016)

```ts
return {
  slug,
  status: "ACTIVE" as const,
  deletedAt: null,
  vendor: {
    status: { in: ["APPROVED" as const, "PENDING_APPROVAL" as const] },
    deletedAt: null,
  },
};
```

### FoodTrucksService.getPublicReviews

[FoodTrucksService.getPublicReviews](../../christinacormie-backend/src/modules/food-trucks/food-trucks.service.ts#L49)

```ts
return {
  items,
  nextCursor: hasNextPage ? items[items.length - 1]?.id : null,
  summary: {
    averageRating: Number(summary.averageRating),
    totalReviews: summary.totalReviews,
  },
};
```

### LeaderboardsRepository.findFoodiePoints

[LeaderboardsRepository.findFoodiePoints](../../christinacormie-backend/src/modules/leaderboards/leaderboards.repository.ts#L9)

```ts
return { items, total };
```

### LeaderboardsRepository.foodTruckBasicSelect

[LeaderboardsRepository.foodTruckBasicSelect](../../christinacormie-backend/src/modules/leaderboards/leaderboards.repository.ts#L274)

```ts
return {
  id: true,
  name: true,
  slug: true,
  description: true,
  profileImageUrl: true,
  coverImageUrl: true,
  averageRating: true,
  totalReviews: true,
  totalBookings: true,
  totalCheckIns: true,
  followerCount: true,
};
```

### LeaderboardsRepository.marketSelect

[LeaderboardsRepository.marketSelect](../../christinacormie-backend/src/modules/leaderboards/leaderboards.repository.ts#L261)

```ts
return {
  id: true,
  name: true,
  city: true,
  state: true,
  country: true,
  timezone: true,
  operatingRadiusKm: true,
  status: true,
};
```

### LeaderboardsService.getFoodiePoints

[LeaderboardsService.getFoodiePoints](../../christinacormie-backend/src/modules/leaderboards/leaderboards.service.ts#L12)

```ts
return {
  items: items.map((item, index) => {
    const profile = item.user.profile;
    const displayName =
      profile?.displayName?.trim() ||
      [profile?.firstName, profile?.lastName].filter(Boolean).join(" ") ||
      "Foodie";

    return {
      rank: offset + index + 1,
      userId: item.userId,
      displayName,
      avatarUrl: profile?.avatarUrl ?? null,
      points: item.lifetimePoints,
    };
  }),
  total,
  limit,
  offset,
  nextOffset: offset + items.length < total ? offset + limit : null,
};
```

### LeaderboardsService.prioritizeCreditAcceptedEntries

[LeaderboardsService.prioritizeCreditAcceptedEntries](../../christinacormie-backend/src/modules/leaderboards/leaderboards.service.ts#L184)

```ts
return {
  ...leaderboard,
  entries: paginatedEntries,
};
```

### MessagingService.conversationInclude

[MessagingService.conversationInclude](../../christinacormie-backend/src/modules/messaging/messaging.service.ts#L609)

```ts
return {
  participants: {
    include: {
      user: {
        select: {
          id: true,
          email: true,
          profile: {
            select: {
              displayName: true,
              firstName: true,
              lastName: true,
              avatarUrl: true,
            },
          },
          vendor: {
            select: {
              id: true,
              businessName: true,
              logoUrl: true,
              foodTrucks: {
                where: { deletedAt: null },
                take: 1,
                select: {
                  id: true,
                  name: true,
                  slug: true,
                  profileImageUrl: true,
                },
              },
            },
          },
        },
      },
    },
  },
  messages: {
    where: { deletedAt: null },
    orderBy: { createdAt: "desc" as const },
    take: 1,
    include: this.messageInclude(),
  },
  _count: {
    select: {
      messages: { where: { deletedAt: null } },
    },
  },
};
```

### MessagingService.createDirectConversation

[MessagingService.createDirectConversation](../../christinacormie-backend/src/modules/messaging/messaging.service.ts#L193)

```ts
return {
  message: "Conversation already exists",
  conversation: await this.presentConversation(existing, userId),
};
```

```ts
return {
  message: "Conversation created successfully",
  conversation: await this.presentConversation(conversation, userId),
};
```

### MessagingService.getConversation

[MessagingService.getConversation](../../christinacormie-backend/src/modules/messaging/messaging.service.ts#L175)

```ts
return {
  message: "Conversation retrieved successfully",
  conversation: await this.presentConversation(conversation, userId),
};
```

### MessagingService.listConversations

[MessagingService.listConversations](../../christinacormie-backend/src/modules/messaging/messaging.service.ts#L33)

```ts
return {
  message: "Conversations retrieved successfully",
  items: conversations,
  total,
  nextOffset: offset + conversations.length < total ? offset + limit : null,
};
```

### MessagingService.listMessageRequests

[MessagingService.listMessageRequests](../../christinacormie-backend/src/modules/messaging/messaging.service.ts#L147)

```ts
return {
  items: await Promise.all(items.map((item) => this.presentConversation(item, userId))),
  total,
  nextOffset: offset + items.length < total ? offset + limit : null,
};
```

### MessagingService.listMessages

[MessagingService.listMessages](../../christinacormie-backend/src/modules/messaging/messaging.service.ts#L278)

```ts
return {
  message: "Messages retrieved successfully",
  items: items.map((item) => this.presentMessage(item)),
  total,
  nextOffset: offset + items.length < total ? offset + limit : null,
};
```

### MessagingService.markRead

[MessagingService.markRead](../../christinacormie-backend/src/modules/messaging/messaging.service.ts#L418)

```ts
return { message: "Conversation marked as read" };
```

### MessagingService.messageInclude

[MessagingService.messageInclude](../../christinacormie-backend/src/modules/messaging/messaging.service.ts#L660)

```ts
return {
  sender: {
    select: {
      id: true,
      email: true,
      profile: {
        select: {
          displayName: true,
          firstName: true,
          lastName: true,
          avatarUrl: true,
        },
      },
      vendor: {
        select: {
          id: true,
          businessName: true,
          logoUrl: true,
          foodTrucks: {
            where: { deletedAt: null },
            take: 1,
            select: {
              id: true,
              name: true,
              slug: true,
              profileImageUrl: true,
            },
          },
        },
      },
    },
  },
};
```

### MessagingService.presentConversation

[MessagingService.presentConversation](../../christinacormie-backend/src/modules/messaging/messaging.service.ts#L696)

```ts
return {
  id: conversation.id,
  type: conversation.type,
  title: conversation.title,
  isClosed: conversation.isClosed,
  directStatus: conversation.directStatus,
  requestedRecipientId: conversation.requestedRecipientId,
  acceptedAt: conversation.acceptedAt,
  createdAt: conversation.createdAt,
  lastMessageAt: conversation.lastMessageAt,
  unreadCount,
  messageCount: conversation._count?.messages ?? 0,
  otherParticipant,
  participants,
  lastMessage: conversation.messages?.[0]
    ? this.presentMessage(conversation.messages[0])
    : null,
};
```

### MessagingService.presentMessage

[MessagingService.presentMessage](../../christinacormie-backend/src/modules/messaging/messaging.service.ts#L742)

```ts
return {
  id: message.id,
  conversationId: message.conversationId,
  senderId: message.senderId,
  messageType: message.messageType,
  content: message.content,
  attachmentUrl: message.attachmentUrl,
  createdAt: message.createdAt,
  editedAt: message.editedAt,
  sender: this.presentUser(message.sender),
};
```

### MessagingService.presentUser

[MessagingService.presentUser](../../christinacormie-backend/src/modules/messaging/messaging.service.ts#L756)

```ts
return {
  id: user.id,
  email: user.email,
  accountType: user.vendor ? "VENDOR" : "CUSTOMER",
  displayName:
    truck?.name ??
    user.vendor?.businessName ??
    user.profile?.displayName ??
    [user.profile?.firstName, user.profile?.lastName].filter(Boolean).join(" ") ??
    null,
  avatarUrl:
    truck?.profileImageUrl ?? user.vendor?.logoUrl ?? user.profile?.avatarUrl ?? null,
  vendor: user.vendor
    ? {
        id: user.vendor.id,
        businessName: user.vendor.businessName,
        logoUrl: user.vendor.logoUrl,
        foodTruck: truck ?? null,
      }
    : null,
};
```

### MessagingService.recipientSelect

[MessagingService.recipientSelect](../../christinacormie-backend/src/modules/messaging/messaging.service.ts#L790)

```ts
return {
  id: true,
  email: true,
  profile: {
    select: {
      displayName: true,
      firstName: true,
      lastName: true,
      avatarUrl: true,
    },
  },
  vendor: {
    select: {
      id: true,
      businessName: true,
      logoUrl: true,
      foodTrucks: {
        where: { deletedAt: null },
        take: 1,
        select: { id: true, name: true, slug: true, profileImageUrl: true },
      },
    },
  },
};
```

### MessagingService.resolveMessageRequest

[MessagingService.resolveMessageRequest](../../christinacormie-backend/src/modules/messaging/messaging.service.ts#L252)

```ts
return { conversationId, status };
```

### MessagingService.searchRecipients

[MessagingService.searchRecipients](../../christinacormie-backend/src/modules/messaging/messaging.service.ts#L76)

```ts
return {
  items: users.map((user) => {
    const presented = this.presentUser(user);
    if (!presented) return null;
    const { email: _email, ...publicRecipient } = presented;
    return publicRecipient;
  }),
  total,
  nextOffset: offset + users.length < total ? offset + limit : null,
};
```

### MessagingService.sendMessage

[MessagingService.sendMessage](../../christinacormie-backend/src/modules/messaging/messaging.service.ts#L309)

```ts
return {
  message: "Message sent successfully",
  item: presentedMessage,
};
```

### NotificationsService.getUnreadCount

[NotificationsService.getUnreadCount](../../christinacormie-backend/src/modules/notifications/notifications.service.ts#L46)

```ts
return {
  unreadCount: await this.notificationsRepository.countUnread(userId),
};
```

### NotificationsService.markAllRead

[NotificationsService.markAllRead](../../christinacormie-backend/src/modules/notifications/notifications.service.ts#L70)

```ts
return {
  updatedCount: result.count,
};
```

### NotificationsService.notifyAdmins

[NotificationsService.notifyAdmins](../../christinacormie-backend/src/modules/notifications/notifications.service.ts#L143)

```ts
return { sentCount };
```

### NotificationsService.notifyFoodTruckUpdate

[NotificationsService.notifyFoodTruckUpdate](../../christinacormie-backend/src/modules/notifications/notifications.service.ts#L166)

```ts
return { sentCount: 0 };
```

```ts
return { sentCount };
```

### PaymentsService.createBookingPaymentIntent

[PaymentsService.createBookingPaymentIntent](../../christinacormie-backend/src/modules/payments/payments.service.ts#L339)

```ts
return { payment: existingPayment, clientSecret: null };
```

```ts
return { payment: duplicate, clientSecret: null };
```

### PaymentsService.createConnectAccount

[PaymentsService.createConnectAccount](../../christinacormie-backend/src/modules/payments/payments.service.ts#L27)

```ts
return {
  paymentAccount,
  onboardingUrl: accountLink.url,
};
```

### PaymentsService.getVendorRefunds

[PaymentsService.getVendorRefunds](../../christinacormie-backend/src/modules/payments/payments.service.ts#L288)

```ts
return {
  items: items.map((refund) => ({
    id: refund.id,
    paymentId: refund.paymentId,
    bookingId: refund.payment.bookingId,
    bookingNumber: refund.payment.booking.bookingNumber,
    eventName: refund.payment.booking.eventName,
    stripeRefundId: refund.stripeRefundId,
    amount: this.formatAmount(refund.amount),
    currency: refund.payment.currency,
    reason: refund.reason,
    status: refund.status,
    processedAt: refund.processedAt,
    paymentStatus: refund.payment.status,
  })),
  meta: {
    page: pagination.page,
    limit: pagination.limit,
    total,
    totalPages: Math.ceil(total / pagination.limit),
  },
};
```

### PaymentsService.getVendorTransactions

[PaymentsService.getVendorTransactions](../../christinacormie-backend/src/modules/payments/payments.service.ts#L236)

```ts
return {
  items: items.map((payment) => this.toVendorTransaction(payment)),
  meta: {
    page: pagination.page,
    limit: pagination.limit,
    total,
    totalPages: Math.ceil(total / pagination.limit),
  },
};
```

### PaymentsService.refreshPaymentAccountStatus

[PaymentsService.refreshPaymentAccountStatus](../../christinacormie-backend/src/modules/payments/payments.service.ts#L862)

```ts
return {
  ...updated,
  stripe: {
    accountType: stripeAccount.type ?? stripeAccount.dashboard ?? "express",
    country: stripeAccount.country ?? null,
    detailsSubmitted: Boolean(stripeAccount.details_submitted),
    chargesEnabled: Boolean(stripeAccount.charges_enabled),
    payoutsEnabled: Boolean(stripeAccount.payouts_enabled),
    requirements: {
      currentlyDue: stripeAccount.requirements?.currently_due ?? [],
      eventuallyDue: stripeAccount.requirements?.eventually_due ?? [],
      pastDue: stripeAccount.requirements?.past_due ?? [],
      pendingVerification: stripeAccount.requirements?.pending_verification ?? [],
      disabledReason: stripeAccount.requirements?.disabled_reason ?? null,
    },
  },
};
```

### PaymentsService.refundBookingPaymentForIssue

[PaymentsService.refundBookingPaymentForIssue](../../christinacormie-backend/src/modules/payments/payments.service.ts#L606)

```ts
return {
  payment,
  refund,
  payout: cancelledPayout ?? payment.payout,
};
```

### PaymentsService.resolveBookingFinancials

[PaymentsService.resolveBookingFinancials](../../christinacormie-backend/src/modules/payments/payments.service.ts#L734)

```ts
return {
  paymentPreference,
  totalContractAmount,
  chargeAmount,
  commissionRate: rate,
  totalCommissionAmount: applicationFeeAmount,
  applicationFeeAmount,
  vendorNetAmount,
};
```

### PaymentsService.resolveDateRange

[PaymentsService.resolveDateRange](../../christinacormie-backend/src/modules/payments/payments.service.ts#L1094)

```ts
return {
  from: from ? new Date(from) : undefined,
  to: to ? new Date(to) : undefined,
};
```

### PaymentsService.resolvePagination

[PaymentsService.resolvePagination](../../christinacormie-backend/src/modules/payments/payments.service.ts#L1083)

```ts
return {
  page: resolvedPage,
  limit: resolvedLimit,
  skip: (resolvedPage - 1) * resolvedLimit,
};
```

### PaymentsService.toVendorTransaction

[PaymentsService.toVendorTransaction](../../christinacormie-backend/src/modules/payments/payments.service.ts#L1101)

```ts
return {
  paymentId: payment.id,
  bookingId: payment.bookingId,
  bookingNumber: payment.booking?.bookingNumber ?? null,
  eventName: payment.booking?.eventName ?? null,
  eventStartsAt: payment.booking?.startsAt ?? null,
  foodTruck: payment.booking?.foodTruck
    ? {
        id: payment.booking.foodTruck.id,
        name: payment.booking.foodTruck.name,
      }
    : null,
  customer: payment.booking?.customer
    ? {
        id: payment.booking.customer.id,
        name: customerName,
        email: payment.booking.customer.email,
      }
    : null,
  stripePaymentIntentId: payment.stripePaymentIntentId,
  grossAmount: this.formatAmount(payment.amount),
  commissionAmount: this.formatAmount(payment.commission?.commissionAmount ?? 0),
  vendorNetAmount: this.formatAmount(
    payment.commission?.vendorNetAmount ?? payment.amount,
  ),
  currency: payment.currency,
  paymentStatus: payment.status,
  payout: payment.payout
    ? {
        id: payment.payout.id,
        stripeTransferId: payment.payout.stripeTransferId,
        amount: this.formatAmount(payment.payout.amount),
        status: payment.payout.status,
        failureReason: payment.payout.failureReason,
        paidAt: payment.payout.paidAt,
        createdAt: payment.payout.createdAt,
      }
    : null,
  refunds: (payment.refunds ?? []).map((refund: any) => ({
    id: refund.id,
    stripeRefundId: refund.stripeRefundId,
    amount: this.formatAmount(refund.amount),
    reason: refund.reason,
    status: refund.status,
    processedAt: refund.processedAt,
  })),
  paidAt: payment.paidAt,
  createdAt: payment.createdAt,
};
```

### PromotionsRepository.promotionInclude

[PromotionsRepository.promotionInclude](../../christinacormie-backend/src/modules/promotions/promotions.repository.ts#L251)

```ts
return {
  foodTruck: {
    select: {
      id: true,
      name: true,
      slug: true,
      profileImageUrl: true,
      operatingStatus: true,
    },
  },
  _count: {
    select: {
      redemptions: true,
    },
  },
};
```

### RewardsRepository.accountInclude

[RewardsRepository.accountInclude](../../christinacormie-backend/src/modules/rewards/rewards.repository.ts#L818)

```ts
return {
  transactions: {
    orderBy: { createdAt: "desc" as const },
    take: 20,
  },
  user: {
    select: {
      id: true,
      email: true,
      profile: {
        select: {
          firstName: true,
          lastName: true,
          displayName: true,
          dateOfBirth: true,
          avatarUrl: true,
        },
      },
      userBadges: {
        where: { revokedAt: null },
        include: { badge: true },
        orderBy: { awardedAt: "desc" as const },
      },
      rewardRedemptions: {
        orderBy: { redeemedAt: "desc" as const },
        take: 20,
        include: { rewardRule: true },
      },
    },
  },
};
```

### RewardsRepository.refundExpiredPendingRedemptions

[RewardsRepository.refundExpiredPendingRedemptions](../../christinacormie-backend/src/modules/rewards/rewards.repository.ts#L451)

```ts
return { refundedCount: 0 };
```

```ts
return { refundedCount };
```

### RewardsService.awardPoints

[RewardsService.awardPoints](../../christinacormie-backend/src/modules/rewards/rewards.service.ts#L185)

```ts
return {
  awarded: false,
  transaction: null,
  reason: "No active point rule",
};
```

```ts
return {
  awarded: !result.alreadyAwarded,
  transaction: result.transaction,
  reason: result.alreadyAwarded ? "Points already awarded" : undefined,
};
```

### RewardsService.getActivityContext

[RewardsService.getActivityContext](../../christinacormie-backend/src/modules/rewards/rewards.service.ts#L915)

```ts
return {
  title: truck?.name ?? this.activityTitle(transaction.sourceType),
  subtitle:
    transaction.sourceType === "EXPIRED_CREDIT_REDEMPTION_REFUND"
      ? "Expired credit was refunded"
      : `Credit redemption for $${Number(redemption?.rewardValue ?? 0).toFixed(2)}`,
};
```

### RewardsService.getLoyaltyProgressForPoints

[RewardsService.getLoyaltyProgressForPoints](../../christinacormie-backend/src/modules/rewards/rewards.service.ts#L676)

```ts
return {
  availablePoints,
  lifetimePoints,
  redeemedPoints,
  availableCreditAmount,
  maxRedeemPerVisit: MAX_REDEEM_PER_VISIT,
  currentTier,
  nextTier: nextTier
    ? {
        ...nextTier,
        pointsRemaining: Math.max(nextTier.requiredPoints - lifetimePoints, 0),
      }
    : null,
  progress: {
    current: lifetimePoints,
    target,
    percentage:
      target === 0
        ? 100
        : Number(Math.min((lifetimePoints / target) * 100, 100).toFixed(2)),
  },
};
```

### RewardsService.getMyProfileSummary

[RewardsService.getMyProfileSummary](../../christinacormie-backend/src/modules/rewards/rewards.service.ts#L95)

```ts
return {
  profile: {
    id: account.userId,
    name: displayName,
    email: account.user?.email ?? null,
    avatarUrl: profile?.avatarUrl ?? null,
    level: loyalty.currentTier.level,
  },
  loyalty,
  tiers: LOYALTY_TIERS.map((tier) => ({
    ...tier,
    isCurrent: tier.slug === loyalty.currentTier.slug,
  })),
  pointsPerAction,
  recentActivity: await this.getRecentActivity(account.transactions ?? []),
  actions: {
    canRedeem: loyalty.availableCreditAmount >= 1,
    canInviteFriends: true,
    canRequestTruck: true,
    canManageSettings: true,
    canOpenSupport: false,
  },
};
```

### RewardsService.toRecentActivity

[RewardsService.toRecentActivity](../../christinacormie-backend/src/modules/rewards/rewards.service.ts#L1009)

```ts
return {
  id: transaction.id,
  type: sourceType,
  title: context?.title ?? this.activityTitle(sourceType),
  subtitle:
    context?.subtitle ??
    transaction.description ??
    (isEarn ? "Points earned" : "Credit redeemed"),
  points,
  createdAt: transaction.createdAt,
  balanceAfter: transaction.balanceAfter,
};
```

### SocialRepository.accountTypeFilter

[SocialRepository.accountTypeFilter](../../christinacormie-backend/src/modules/social/social.repository.ts#L1296)

```ts
return { vendor: { isNot: null } };
```

```ts
return { vendor: { is: null } };
```

```ts
return {};
```

### SocialRepository.findCommentsForPost

[SocialRepository.findCommentsForPost](../../christinacormie-backend/src/modules/social/social.repository.ts#L675)

```ts
return {
  totalCount,
  comments: formattedComments,
};
```

### SocialRepository.getFavorites

[SocialRepository.getFavorites](../../christinacormie-backend/src/modules/social/social.repository.ts#L1341)

```ts
return {
  totalCount,
  openCount,
  closedCount,
  items: filteredItems,
};
```

### SocialRepository.listFollowers

[SocialRepository.listFollowers](../../christinacormie-backend/src/modules/social/social.repository.ts#L225)

```ts
return { items, total, customerCount, vendorCount, offset, limit };
```

### SocialRepository.postInclude

[SocialRepository.postInclude](../../christinacormie-backend/src/modules/social/social.repository.ts#L1226)

Delegation: `include`.

### SocialRepository.publicPostEligibilityWhere

[SocialRepository.publicPostEligibilityWhere](../../christinacormie-backend/src/modules/social/social.repository.ts#L1278)

```ts
return {
  OR: [
    { foodTruckId: null },
    {
      foodTruck: {
        status: "ACTIVE",
        deletedAt: null,
        vendor: {
          status: { in: ["APPROVED", "PENDING_APPROVAL"] },
          deletedAt: null,
        },
      },
    },
  ],
};
```

### SocialRepository.publicUserSelect

[SocialRepository.publicUserSelect](../../christinacormie-backend/src/modules/social/social.repository.ts#L1302)

```ts
return {
  id: true,
  profile: {
    select: {
      displayName: true,
      firstName: true,
      lastName: true,
      avatarUrl: true,
      bio: true,
      city: true,
      state: true,
    },
  },
  vendor: {
    select: {
      id: true,
      businessName: true,
      logoUrl: true,
      isVerified: true,
      foodTrucks: {
        where: { deletedAt: null },
        take: 1,
        select: { id: true, name: true, slug: true, profileImageUrl: true },
      },
    },
  },
  ...(viewerUserId
    ? {
        followers: {
          where: { followerUserId: viewerUserId },
          select: { id: true },
          take: 1,
        },
      }
    : {}),
};
```

### SocialService.getExploreFeed

[SocialService.getExploreFeed](../../christinacormie-backend/src/modules/social/social.service.ts#L319)

```ts
return {
  items: items.map((post: any) => this.presentPost(post)),
  nextCursor: hasMore ? items[items.length - 1]?.id : null,
};
```

### SocialService.getFollowedFeed

[SocialService.getFollowedFeed](../../christinacormie-backend/src/modules/social/social.service.ts#L307)

```ts
return {
  items: items.map((post: any) => this.presentPost(post)),
  nextCursor: hasMore ? items[items.length - 1]?.id : null,
};
```

### SocialService.listFollowers

[SocialService.listFollowers](../../christinacormie-backend/src/modules/social/social.service.ts#L384)

```ts
return {
  ...result,
  items: result.items.map((item: any) => ({
    followedAt: item.createdAt,
    ...this.presentUser(item.follower ?? item.followed),
    isFollowing: Boolean((item.follower ?? item.followed)?.followers?.length),
  })),
  nextOffset:
    result.offset + result.items.length < result.total
      ? result.offset + result.limit
      : null,
};
```

### SocialService.paginatePosts

[SocialService.paginatePosts](../../christinacormie-backend/src/modules/social/social.service.ts#L643)

```ts
return {
  items,
  nextCursor: hasMore ? items[items.length - 1]?.id : null,
};
```

### SocialService.presentPost

[SocialService.presentPost](../../christinacormie-backend/src/modules/social/social.service.ts#L659)

```ts
return {
  ...post,
  author: this.presentUser(post.author),
  taggedAccounts: (post.tags ?? []).map((tag: any) => this.presentUser(tag.taggedUser)),
  tags: undefined,
  isLiked: Boolean(post.likes?.length),
  isSaved: Boolean(post.savedBy?.length),
  likes: undefined,
  savedBy: undefined,
};
```

### SocialService.presentPublicProfile

[SocialService.presentPublicProfile](../../christinacormie-backend/src/modules/social/social.service.ts#L674)

```ts
return {
  ...this.presentUser(profile),
  bio: profile.profile?.bio ?? null,
  city: profile.profile?.city ?? null,
  state: profile.profile?.state ?? null,
  postCount: profile._count?.authoredPosts ?? 0,
  followerCount: profile._count?.followers ?? 0,
  followingCount: profile._count?.following ?? 0,
  isFollowing: Boolean(profile.followers?.length),
};
```

### SocialService.presentUser

[SocialService.presentUser](../../christinacormie-backend/src/modules/social/social.service.ts#L687)

```ts
return {
  userId: user.id,
  accountType: isVendor ? "VENDOR" : "CUSTOMER",
  displayName: isVendor ? (truck?.name ?? user.vendor.businessName) : foodieName,
  avatarUrl: isVendor
    ? (truck?.profileImageUrl ?? user.vendor.logoUrl)
    : (user.profile?.avatarUrl ?? null),
  vendorId: user.vendor?.id ?? null,
  foodTruckId: truck?.id ?? null,
  foodTruckSlug: truck?.slug ?? null,
  isVerified: user.vendor?.isVerified ?? false,
};
```

### SocialService.resolvePostIdentity

[SocialService.resolvePostIdentity](../../christinacormie-backend/src/modules/social/social.service.ts#L549)

```ts
return {};
```

```ts
return { vendorId: user.vendor.id, foodTruckId: foodTruck.id };
```

### SocialService.sharePost

[SocialService.sharePost](../../christinacormie-backend/src/modules/social/social.service.ts#L283)

```ts
return {
  success: true,
  postId: post.id,
  shareCount: post.shareCount,
  shareUrl: `/api/v1/social/posts/${post.id}`,
  shareText:
    post.content.length > 80 ? `${post.content.slice(0, 77)}...` : post.content,
};
```

### SocialService.unblockUser

[SocialService.unblockUser](../../christinacormie-backend/src/modules/social/social.service.ts#L376)

```ts
return { unblocked: result.count > 0 };
```

### SocialService.unfavoriteFoodTruck

[SocialService.unfavoriteFoodTruck](../../christinacormie-backend/src/modules/social/social.service.ts#L110)

```ts
return {
  unfavorited: Boolean(favorite),
};
```

### SocialService.unfollowFoodTruck

[SocialService.unfollowFoodTruck](../../christinacormie-backend/src/modules/social/social.service.ts#L74)

```ts
return {
  unfollowed: Boolean(follow),
};
```

### SocialService.unfollowUser

[SocialService.unfollowUser](../../christinacormie-backend/src/modules/social/social.service.ts#L360)

```ts
return { unfollowed: result.count > 0 };
```

### SocialService.uploadPostMedia

[SocialService.uploadPostMedia](../../christinacormie-backend/src/modules/social/social.service.ts#L126)

```ts
return { media };
```

### StripeClientService.createAccountLink

[StripeClientService.createAccountLink](../../christinacormie-backend/src/modules/payments/stripe-client.service.ts#L87)

```ts
return {
  url: "https://connect.stripe.com/setup/s/mock_onboarding_url",
};
```

### StripeClientService.createConnectAccount

[StripeClientService.createConnectAccount](../../christinacormie-backend/src/modules/payments/stripe-client.service.ts#L12)

```ts
return {
  id: `acct_mock_${Date.now()}`,
  type: "express",
  details_submitted: false,
  charges_enabled: false,
  payouts_enabled: false,
};
```

### StripeClientService.createLoginLink

[StripeClientService.createLoginLink](../../christinacormie-backend/src/modules/payments/stripe-client.service.ts#L110)

```ts
return {
  url: "https://connect.stripe.com/express/mock_dashboard_url",
};
```

### StripeClientService.createPaymentIntent

[StripeClientService.createPaymentIntent](../../christinacormie-backend/src/modules/payments/stripe-client.service.ts#L124)

```ts
return {
  id: `pi_mock_${Date.now()}`,
  client_secret: `pi_mock_secret_${Date.now()}`,
  status: "requires_payment_method",
  amount: params.amount,
};
```

### StripeClientService.createRefund

[StripeClientService.createRefund](../../christinacormie-backend/src/modules/payments/stripe-client.service.ts#L199)

```ts
return {
  id: `re_mock_${Date.now()}`,
  status: "succeeded",
  amount: params.amount,
};
```

### StripeClientService.createTransfer

[StripeClientService.createTransfer](../../christinacormie-backend/src/modules/payments/stripe-client.service.ts#L162)

```ts
return {
  id: `tr_mock_${Date.now()}`,
  destination: params.connectedAccountId,
  amount: params.amount,
  currency: params.currency,
};
```

### StripeClientService.retrieveConnectAccount

[StripeClientService.retrieveConnectAccount](../../christinacormie-backend/src/modules/payments/stripe-client.service.ts#L62)

```ts
return {
  id: accountId,
  type: "express",
  details_submitted: true,
  charges_enabled: true,
  payouts_enabled: true,
  requirements: {
    currently_due: [],
    eventually_due: [],
    past_due: [],
    pending_verification: [],
    disabled_reason: null,
  },
};
```

### SubscriptionsService.getVendorSubscriptionResponse

[SubscriptionsService.getVendorSubscriptionResponse](../../christinacormie-backend/src/modules/subscriptions/subscriptions.service.ts#L651)

```ts
return {
  vendorId: vendor.id,
  plan: this.toPlanResponse(plan),
  subscription: subscription
    ? {
        id: subscription.id,
        provider: subscription.provider,
        platform: subscription.platform,
        status: subscription.status,
        accessActive,
        isFoundingVendor,
        startedAt: subscription.startedAt,
        trialEndsAt: subscription.trialEndsAt,
        currentPeriodStartsAt: subscription.currentPeriodStartsAt,
        currentPeriodEndsAt: subscription.currentPeriodEndsAt,
        willRenew: subscription.willRenew,
        revenueCatAppUserId: subscription.revenueCatAppUserId,
        productId: subscription.productId,
        entitlementId: subscription.entitlementId,
      }
    : {
        id: null,
        provider: null,
        platform: null,
        status: VendorSubscriptionStatus.ACTIVE,
        accessActive,
        isFoundingVendor,
        startedAt: null,
        trialEndsAt: null,
        currentPeriodStartsAt: null,
        currentPeriodEndsAt: null,
        willRenew: null,
        revenueCatAppUserId: null,
        productId: null,
        entitlementId: null,
      },
  commissionRate,
  features: plan.features,
  limits: plan.limits,
  foundingOffer: this.toFoundingOfferResponse(foundingOffer),
};
```

### SubscriptionsService.listPublicPlans

[SubscriptionsService.listPublicPlans](../../christinacormie-backend/src/modules/subscriptions/subscriptions.service.ts#L83)

```ts
return {
  foundingOffer: this.toFoundingOfferResponse(foundingOffer),
  items: plans.map((plan) => this.toPlanResponse(plan)),
};
```

### SubscriptionsService.toFoundingOfferResponse

[SubscriptionsService.toFoundingOfferResponse](../../christinacormie-backend/src/modules/subscriptions/subscriptions.service.ts#L911)

```ts
return {
  active: offer.active,
  availableNow: offer.active && now >= offer.startsAt && now <= offer.endsAt,
  startsAt: offer.startsAt,
  endsAt: offer.endsAt,
  discountPercent: Number(offer.discountPercent),
  discountStartMonth: offer.discountStartMonth,
  discountEndMonth: offer.discountEndMonth,
  trialDays: offer.trialDays,
};
```

### SubscriptionsService.toPlanResponse

[SubscriptionsService.toPlanResponse](../../christinacormie-backend/src/modules/subscriptions/subscriptions.service.ts#L933)

```ts
return {
  id: plan.id,
  code: plan.code,
  name: plan.name,
  description: plan.description,
  monthlyPrice: Number(plan.monthlyPrice),
  standardCommissionRate: Number(plan.standardCommissionRate),
  foundingCommissionRate: Number(plan.foundingCommissionRate),
  trialDays: plan.trialDays,
  features: plan.features,
  limits: plan.limits,
  active: plan.active,
  sortOrder: plan.sortOrder,
  providerProducts:
    plan.providerProducts?.map((item) => ({
      id: item.id,
      provider: item.provider,
      platform: item.platform,
      productId: item.productId,
      entitlementId: item.entitlementId,
      revenueCatOfferingId: item.revenueCatOfferingId,
      revenueCatPackageId: item.revenueCatPackageId,
      stripeProductId: item.stripeProductId,
      stripePriceId: item.stripePriceId,
      active: item.active,
    })) ?? undefined,
};
```

### UsersService.deleteAccountPermanently

[UsersService.deleteAccountPermanently](../../christinacormie-backend/src/modules/users/users.service.ts#L344)

```ts
return {
  deleted: true,
  message: "Account permanently deleted successfully",
};
```

### UsersService.toUserResponse

[UsersService.toUserResponse](../../christinacormie-backend/src/modules/users/users.service.ts#L642)

```ts
return {
  id: user.id,
  email: user.email,
  phone: user.phone,
  status: user.status,
  emailVerifiedAt: user.emailVerifiedAt,
  phoneVerifiedAt: user.phoneVerifiedAt,
  lastLoginAt: user.lastLoginAt,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
  roles: (user.userRoles ?? []).map((userRole) => userRole.role),
  profile: user.profile,
  settings: user.settings,
  notificationPreference: user.notificationPreference,
  interestCuisines: (user.cuisineInterests ?? []).map((interest) => interest.cuisine),
  vendor: user.vendor,
};
```

### UsersService.uploadProfileAvatar

[UsersService.uploadProfileAvatar](../../christinacormie-backend/src/modules/users/users.service.ts#L166)

```ts
return {
  message: "Profile photo uploaded successfully",
  avatarUrl: upload.secure_url,
};
```

### UsersService.userInclude

[UsersService.userInclude](../../christinacormie-backend/src/modules/users/users.service.ts#L664)

```ts
return {
  userRoles: true,
  profile: true,
  settings: true,
  notificationPreference: true,
  cuisineInterests: {
    include: {
      cuisine: true,
    },
  },
  vendor: true,
};
```

### VendorsRepository.getCreditRedemptionSummary

[VendorsRepository.getCreditRedemptionSummary](../../christinacormie-backend/src/modules/vendors/vendors.repository.ts#L807)

```ts
return {
  currentCount: current._count.id,
  currentCredit: Number(current._sum.rewardValue ?? 0),
  previousCount: previous,
};
```

### VendorsRepository.getVendorAnalytics

[VendorsRepository.getVendorAnalytics](../../christinacormie-backend/src/modules/vendors/vendors.repository.ts#L589)

```ts
return {
  totalFoodTrucks,
  totalBookings,
  totalRevenue,
  totalReviews,
  averageRating,
  totalFollowers,
  totalCheckIns,
  recentBookings,
  paymentSummary,
  topTrucks,
};
```

### VendorsRepository.vendorInclude

[VendorsRepository.vendorInclude](../../christinacormie-backend/src/modules/vendors/vendors.repository.ts#L867)

```ts
return {
  user: {
    include: {
      profile: true,
      userRoles: true,
    },
  },
  market: true,
  verificationRequests: {
    orderBy: { createdAt: "desc" as const },
  },
  foodTrucks: true,
};
```

### VendorsService.addStaff

[VendorsService.addStaff](../../christinacormie-backend/src/modules/vendors/vendors.service.ts#L111)

```ts
return {
  ...this.toStaffResponse(staff),
  message: "Staff account created and PIN sent to email",
};
```

### VendorsService.creditAnalyticsRange

[VendorsService.creditAnalyticsRange](../../christinacormie-backend/src/modules/vendors/vendors.service.ts#L981)

```ts
return { start, end, previousStart, previousEnd, days };
```

### VendorsService.deleteStaff

[VendorsService.deleteStaff](../../christinacormie-backend/src/modules/vendors/vendors.service.ts#L297)

```ts
return {
  deleted: true,
  message: "Staff member deleted successfully",
};
```

### VendorsService.getDashboardAccess

[VendorsService.getDashboardAccess](../../christinacormie-backend/src/modules/vendors/vendors.service.ts#L921)

```ts
return {
  allowed,
  status: allowed ? "AVAILABLE" : "ONBOARDING_REQUIRED",
  reason: allowed ? null : "Complete vendor onboarding to access the vendor dashboard.",
};
```

### VendorsService.getMyCreditAnalytics

[VendorsService.getMyCreditAnalytics](../../christinacormie-backend/src/modules/vendors/vendors.service.ts#L561)

```ts
return {
  creditAcceptance: this.presentCreditAcceptance(vendor),
  qrScans: {
    totalThisWeek: qrChart.reduce((sum, item) => sum + item.count, 0),
    chart: qrChart,
  },
  followers: {
    total: totalFollowers,
    changeThisMonth: followersThisMonth,
    chart: followerChart,
  },
  topDropLocations: topLocationRows.map((row) => {
    const latitude = row.latitude === null ? null : Number(row.latitude);
    const longitude = row.longitude === null ? null : Number(row.longitude);

    return {
      label:
        latitude === null || longitude === null
          ? "Unknown location"
          : `Lat ${latitude.toFixed(2)}, Lng ${longitude.toFixed(2)}`,
      scanCount: Number(row.scanCount),
      latitude,
      longitude,
    };
  }),
  creditRedemptions: {
    totalRedeemedCount: redemptionSummary.currentCount,
    totalCreditApplied: redemptionSummary.currentCredit,
    averagePerDay:
      days === 0 ? 0 : Number((redemptionSummary.currentCount / days).toFixed(1)),
    changeVsLastWeekPercent,
    recent: recentRedemptions.map((redemption) => ({
      id: redemption.id,
      customerName: this.userDisplayName(redemption.user),
      method: redemption.redemptionMethod ?? "UNKNOWN",
      amount: Number(redemption.rewardValue ?? 0),
      createdAt: redemption.usedAt ?? redemption.redeemedAt,
    })),
  },
};
```

### VendorsService.getMyVendorProfile

[VendorsService.getMyVendorProfile](../../christinacormie-backend/src/modules/vendors/vendors.service.ts#L59)

```ts
return {
  ...vendor,
  dashboardAccess: this.getDashboardAccess(vendor),
  verificationBadge: this.getVerificationBadge(vendor),
  verificationRequirements: this.getVerificationRequirements(vendor),
};
```

### VendorsService.getMyVendorQrCode

[VendorsService.getMyVendorQrCode](../../christinacormie-backend/src/modules/vendors/vendors.service.ts#L74)

```ts
return {
  vendorId: vendor.id,
  businessName: vendor.businessName,
  foodTruckId: primaryQr?.foodTruckId ?? null,
  qrCode: primaryQr?.code ?? null,
  qrCodeUrl: primaryQr ? `/api/v1/qr/${primaryQr.code}/profile` : null,
  downloadUrl: primaryQr?.qrImageUrl ?? null,
  shareMessage: `Scan our BiteDrop QR code at ${vendor.businessName} to check in and earn rewards!`,
};
```

### VendorsService.getVerificationBadge

[VendorsService.getVerificationBadge](../../christinacormie-backend/src/modules/vendors/vendors.service.ts#L937)

```ts
return {
  isVerified: Boolean(vendor.isVerified),
  status,
  optional: true,
  message:
    status === "VERIFIED"
      ? "Bite Drop Verified badge is active."
      : status === "PENDING"
        ? "Verification documents are under review. Dashboard access remains available."
        : status === "REJECTED"
          ? "Verification documents need attention. Dashboard access remains available."
          : "Vendor can use the dashboard as an Unverified Vendor.",
  rejectionReason: latestRequest?.rejectionReason ?? vendor.rejectionReason ?? null,
};
```

### VendorsService.getVerificationRequirements

[VendorsService.getVerificationRequirements](../../christinacormie-backend/src/modules/vendors/vendors.service.ts#L760)

```ts
return {
  state: rawState,
  normalizedState,
  requirementSet: isTexasVendor ? "TEXAS" : "NON_TEXAS",
  requiredDocumentTypes: requirements.map((item) => item.type),
  requiredDocuments: requirements,
  confirmationMessage: VENDOR_DOCUMENT_SUBMISSION_CONFIRMATION,
  optional: true,
  purpose: "Bite Drop Verified badge only",
  pendingUntilApproved: false,
};
```

### VendorsService.listStaff

[VendorsService.listStaff](../../christinacormie-backend/src/modules/vendors/vendors.service.ts#L94)

```ts
return {
  items: staff.map((item) => this.toStaffResponse(item)),
};
```

### VendorsService.presentCreditAcceptance

[VendorsService.presentCreditAcceptance](../../christinacormie-backend/src/modules/vendors/vendors.service.ts#L968)

```ts
return {
  enabled,
  statusLabel: enabled ? "Currently Accepting" : "Not Accepting",
  updatedAt: vendor.creditAcceptanceUpdatedAt ?? null,
};
```

### VendorsService.resetStaffPin

[VendorsService.resetStaffPin](../../christinacormie-backend/src/modules/vendors/vendors.service.ts#L259)

```ts
return {
  ...this.toStaffResponse(updated),
  message: "Staff PIN reset successfully and sent to email",
};
```

### VendorsService.submitVerificationRequest

[VendorsService.submitVerificationRequest](../../christinacormie-backend/src/modules/vendors/vendors.service.ts#L396)

```ts
return {
  ...result,
  message: VENDOR_DOCUMENT_SUBMISSION_CONFIRMATION,
  verificationRequirements: requirements,
};
```

### VendorsService.toStaffResponse

[VendorsService.toStaffResponse](../../christinacormie-backend/src/modules/vendors/vendors.service.ts#L825)

```ts
return {
  id: staff.id,
  email: staff.email,
  pin: this.decryptStaffPin(staff.pinEncrypted),
  status: staff.status,
  addedAt: staff.createdAt,
};
```

### VendorsService.updateMyCreditSettings

[VendorsService.updateMyCreditSettings](../../christinacormie-backend/src/modules/vendors/vendors.service.ts#L668)

```ts
return {
  message: "Credit acceptance updated successfully",
  creditAcceptance: this.presentCreditAcceptance(updated),
};
```

### VendorsService.uploadOnboardingAsset

[VendorsService.uploadOnboardingAsset](../../christinacormie-backend/src/modules/vendors/vendors.service.ts#L686)

```ts
return {
  url: upload.secure_url,
  publicId: upload.public_id,
  width: upload.width,
  height: upload.height,
  format: upload.format,
  resourceType: upload.resource_type,
  originalFilename: file.originalname,
};
```

### VendorsService.uploadVerificationDocument

[VendorsService.uploadVerificationDocument](../../christinacormie-backend/src/modules/vendors/vendors.service.ts#L708)

```ts
return {
  url: upload.secure_url,
  publicId: upload.public_id,
  format: upload.format,
  bytes: upload.bytes,
  resourceType: upload.resource_type,
  originalFilename: file.originalname,
};
```

## Persistence model index

Stored model fields do not authorize input absent from DTOs. These definitions supply enum values, nullable fields, relation IDs and monetary storage together with repository select/include.

- [10-markets.prisma](../../christinacormie-backend/prisma/schema/10-markets.prisma): MarketStatus, Market.
- [11-users.prisma](../../christinacormie-backend/prisma/schema/11-users.prisma): UserRole, AccountStatus, User, UserRoleAssignment, RefreshToken, UserProfile, EmailVerificationCode, PasswordResetCode, UserSetting, DeviceToken, UserCuisineInterest.
- [12-vendors.prisma](../../christinacormie-backend/prisma/schema/12-vendors.prisma): VendorStatus, VerificationStatus, VendorPlan, PhotoShootRequestStatus, StaffStatus, Vendor, VendorStaff, VendorVerificationRequest, VendorPaymentAccount, VendorPhotoShootRequest.
- [13-food-trucks.prisma](../../christinacormie-backend/prisma/schema/13-food-trucks.prisma): TruckStatus, OperatingStatus, DropStatus, TruckType, FoodTruck, FoodTruckImage, Cuisine, FoodTruckCuisine, ServiceArea, TruckOperatingHour, TruckAvailabilityException, FoodTruckDrop.
- [14-menus.prisma](../../christinacormie-backend/prisma/schema/14-menus.prisma): MenuItemStatus, Menu, MenuCategory, MenuItem.
- [15-social.prisma](../../christinacormie-backend/prisma/schema/15-social.prisma): PostStatus, UserFollow, UserBlock, Place, FoodTruckFollow, FavoriteTruck, Post, PostTag, PostMedia, PostLike, PostComment, PostCommentLike, SavedPost.
- [16-promotions.prisma](../../christinacormie-backend/prisma/schema/16-promotions.prisma): PromotionType, Promotion, PromotionRedemption.
- [17-community.prisma](../../christinacormie-backend/prisma/schema/17-community.prisma): CommunityPostCategory, CommunityActionType, CommunityPostReportReason, CommunityPostReportStatus, RequestVisibility, RequestType, RequestStatus, CommunityEventType, OfferPricingModel, OfferStatus, CommunityRequest, CommunityPostAction, CommunityPostReport, CommunityRequestMedia, CommunityRequestComment, CommunityRequestReaction, VendorOffer, NewFoodTruckRequest.
- [18-bookings.prisma](../../christinacormie-backend/prisma/schema/18-bookings.prisma): BookingType, BookingEventType, BookingPaymentPreference, BookingStatus, BookingIssueStatus, BookingIssueResolutionDecision, BookingIssueMessageSenderRole, Booking, BookingIssue, BookingIssueMessage, BookingQuote, BookingHold, BookingStatusHistory.
- [19-payments.prisma](../../christinacormie-backend/prisma/schema/19-payments.prisma): PaymentStatus, PayoutStatus, Payment, Commission, Refund, Payout, StripeWebhookEvent.
- [20-reviews.prisma](../../christinacormie-backend/prisma/schema/20-reviews.prisma): ReviewStatus, ReportStatus, Review, ReviewReport.
- [21-messaging.prisma](../../christinacormie-backend/prisma/schema/21-messaging.prisma): ConversationType, MessageType, DirectConversationStatus, Conversation, ConversationParticipant, Message.
- [22-notifications.prisma](../../christinacormie-backend/prisma/schema/22-notifications.prisma): NotificationType, NotificationPreference, Notification.
- [23-loyalty.prisma](../../christinacormie-backend/prisma/schema/23-loyalty.prisma): LoyaltyTransactionType, RewardType, BadgeOwnerType, RewardRedemptionMethod, RewardFundingType, RewardEligibleVendorScope, LoyaltyAccount, LoyaltyTransaction, RewardRule, RewardRuleVendor, RewardRedemption, Badge, UserBadge, VendorBadge.
- [24-referrals.prisma](../../christinacormie-backend/prisma/schema/24-referrals.prisma): ReferralProgramType, ReferralStatus, ReferralCode, Referral, ReferralReward.
- [25-qr-checkins.prisma](../../christinacormie-backend/prisma/schema/25-qr-checkins.prisma): QrStatus, QrKitStatus, CheckInStatus, TruckQrCode, QrScan, CheckIn, QrKitShipment.
- [26-leaderboards.prisma](../../christinacormie-backend/prisma/schema/26-leaderboards.prisma): LeaderboardType, LeaderboardPeriod, LeaderboardRule, Leaderboard, LeaderboardEntry.
- [27-campaigns.prisma](../../christinacormie-backend/prisma/schema/27-campaigns.prisma): CampaignStatus, PlacementType, Campaign, CampaignTruck, FeaturedPlacement, PlatformSetting.
- [28-admin-audit-logs.prisma](../../christinacormie-backend/prisma/schema/28-admin-audit-logs.prisma): AdminAuditLog.
- [29-vendor-subscriptions.prisma](../../christinacormie-backend/prisma/schema/29-vendor-subscriptions.prisma): VendorSubscriptionProvider, VendorSubscriptionPlatform, VendorSubscriptionStatus, SubscriptionWebhookProcessingStatus, VendorSubscriptionPlan, VendorSubscriptionProviderProduct, VendorFoundingOfferConfig, VendorSubscription, SubscriptionWebhookEvent.
