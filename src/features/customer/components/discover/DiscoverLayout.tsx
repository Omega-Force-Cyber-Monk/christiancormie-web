import { isMemberIdentifier } from "@/features/social/utils/profileIdentity";
import {
  House,
  LogOut,
  MapPin,
  MessageCircle,
  MessageSquare,
  Plus,
  Rss,
  Settings,
  Trophy,
  Users,
} from "lucide-react";
import { Link, useMatch, useNavigate, useSearchParams } from "react-router";

import { useAppDispatch, useAppSelector } from "@/app/hooks";
import { NotificationBell } from "@/features/notifications/NotificationBell";
import { ROUTES } from "@/constants/routes";
import logo from "@/features/customer/assets/discover/discover-logo.svg";
import { selectIsAuthenticated } from "@/features/auth/store/auth.selectors";
import { clearSession } from "@/features/auth/store/auth.slice";
import { DashboardLayout } from "@/layouts/DashboardLayout/DashboardLayout";
import {
  parseSettingsSection,
  settingsTitles,
} from "@/features/customer/data/settings.data";
import "@/features/customer/components/discover/discover.css";

export default function DiscoverLayout() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const authenticated = useAppSelector(selectIsAuthenticated);
  const isDiscoverPage = useMatch(ROUTES.CUSTOMER_DISCOVER) !== null;
  const isFeedPage = useMatch(ROUTES.CUSTOMER_FEED) !== null;
  const isCommunityPage = useMatch(ROUTES.CUSTOMER_COMMUNITY) !== null;
  const isMessagePage = useMatch(ROUTES.CUSTOMER_MESSAGE) !== null;
  const isCreatePostPage = useMatch(ROUTES.CUSTOMER_CREATE_POST) !== null;
  const isLeaderboardPage = useMatch(ROUTES.CUSTOMER_LEADERBOARD) !== null;
  const isSettingsPage = useMatch(ROUTES.CUSTOMER_SETTINGS) !== null;
  const [searchParams] = useSearchParams();
  const profileMatch = useMatch(ROUTES.CUSTOMER_PROFILE);
  const isMemberProfilePage = isMemberIdentifier(profileMatch?.params.id);

  return (
    <>
      <DashboardLayout
        className={`discover-shell${isFeedPage ? " feed-shell" : ""}${isCommunityPage ? " community-shell" : ""}${isMessagePage ? " message-shell" : ""}${isMemberProfilePage ? " member-profile-shell" : ""}${isCreatePostPage ? " create-post-shell" : ""}${isLeaderboardPage ? " leaderboard-shell" : ""}${isSettingsPage ? " settings-shell" : ""}`}
        sidebarContent={(onNavigate) => (
          <>
            <div className="mx-6 shrink-0 border-b border-[#242D42] pt-9 pb-3">
              <Link
                aria-label="Bite Drop Discover"
                className="flex w-fit focus-visible:outline focus-visible:outline-2"
                onClick={onNavigate}
                to={ROUTES.CUSTOMER_DISCOVER}
              >
                <img
                  alt="Bite Drop — Discover. Book. Eat."
                  className="h-14 w-[62px]"
                  src={logo}
                />
              </Link>
            </div>
            <nav
              aria-label="Discover navigation"
              className="flex min-h-0 flex-1 flex-col px-6 pt-4 pb-7"
            >
              <div className="flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto">
                <Link
                  aria-current={isDiscoverPage ? "page" : undefined}
                  className={`discover-nav-item mb-1 ${isFeedPage || isCommunityPage || isMessagePage || isMemberProfilePage || isCreatePostPage || isLeaderboardPage || isSettingsPage ? "text-[#B6B7BC] hover:bg-white/5" : "bg-[#FF5733]/[0.08] text-[#FF5733]"}`}
                  onClick={onNavigate}
                  to={ROUTES.CUSTOMER_DISCOVER}
                >
                  <House aria-hidden="true" size={19} />
                  Discover
                </Link>
                <Link
                  aria-current={isFeedPage ? "page" : undefined}
                  className={`discover-nav-item ${isFeedPage ? "bg-[#FF5733]/[0.08] text-[#FF5733]" : "text-[#B6B7BC] hover:bg-white/5"}`}
                  onClick={onNavigate}
                  to={ROUTES.CUSTOMER_FEED}
                >
                  <Rss aria-hidden="true" size={19} />
                  Feed
                </Link>
                <Link
                  aria-current={isCommunityPage ? "page" : undefined}
                  className={`discover-nav-item ${isCommunityPage ? "bg-[#FF5733]/[0.08] text-[#FF5733]" : "text-[#B6B7BC] hover:bg-white/5"}`}
                  onClick={onNavigate}
                  to={ROUTES.CUSTOMER_COMMUNITY}
                >
                  <MessageCircle aria-hidden="true" size={19} />
                  Community
                </Link>
                <Link
                  aria-current={isMessagePage ? "page" : undefined}
                  className={`discover-nav-item ${isMessagePage ? "bg-[#FF5733]/[0.08] text-[#FF5733]" : "text-[#B6B7BC] hover:bg-white/5"}`}
                  onClick={onNavigate}
                  to={ROUTES.CUSTOMER_MESSAGE}
                >
                  <MessageSquare aria-hidden="true" size={19} />
                  Message
                </Link>
                <Link
                  aria-current={isMemberProfilePage ? "page" : undefined}
                  className={`discover-nav-item ${isMemberProfilePage ? "bg-[#FF5733]/[0.08] text-[#FF5733]" : "text-[#B6B7BC] hover:bg-white/5"}`}
                  to={ROUTES.CUSTOMER_OWN_PROFILE}
                  onClick={onNavigate}
                >
                  <Users aria-hidden="true" size={19} />
                  Profile
                </Link>
                <Link
                  aria-current={isCreatePostPage ? "page" : undefined}
                  className={`discover-nav-item ${isCreatePostPage ? "bg-[#FF5733]/[0.08] text-[#FF5733]" : "text-[#B6B7BC] hover:bg-white/5"}`}
                  to={ROUTES.CUSTOMER_CREATE_POST}
                  onClick={onNavigate}
                >
                  <Plus aria-hidden="true" size={19} />
                  Create post
                </Link>
                <Link
                  aria-current={isLeaderboardPage ? "page" : undefined}
                  className={`discover-nav-item ${isLeaderboardPage ? "bg-[#FF5733]/[0.08] text-[#FF5733]" : "text-[#B6B7BC] hover:bg-white/5"}`}
                  to={ROUTES.CUSTOMER_LEADERBOARD}
                  onClick={onNavigate}
                >
                  <Trophy aria-hidden="true" size={19} />
                  Leaderboard
                </Link>
              </div>
              <div className="mt-auto shrink-0 space-y-1 pt-4">
                <Link
                  aria-current={isSettingsPage ? "page" : undefined}
                  className={`discover-nav-item w-full ${isSettingsPage ? "bg-[#FF5733]/[0.08] text-[#FF5733]" : "text-[#B6B7BC] hover:bg-white/5"}`}
                  onClick={onNavigate}
                  to={ROUTES.CUSTOMER_SETTINGS}
                >
                  <Settings aria-hidden="true" size={19} />
                  Settings
                </Link>
                <button
                  className="discover-nav-item w-full text-[#FF5733] hover:bg-[#FF5733]/[0.08] disabled:cursor-not-allowed disabled:opacity-60"
                  disabled={!authenticated}
                  onClick={() => {
                    onNavigate?.();
                    dispatch(clearSession());
                    void navigate(ROUTES.LOGIN, { replace: true });
                  }}
                  title={authenticated ? "Sign out" : "No active session to sign out"}
                  type="button"
                >
                  <LogOut aria-hidden="true" size={19} />
                  Sign out
                </button>
              </div>
            </nav>
          </>
        )}
        navbarContent={
          <div className="flex min-w-0 flex-1 items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate text-lg leading-8 font-semibold sm:text-2xl">
                {isSettingsPage
                  ? settingsTitles[parseSettingsSection(searchParams.get("section"))]
                  : isLeaderboardPage
                    ? "Leaderboard"
                    : isCreatePostPage
                      ? "Create Post"
                      : isMemberProfilePage
                        ? "Profile"
                        : isMessagePage
                          ? "Message"
                          : isCommunityPage
                            ? "Community"
                            : "Good morning Alex"}
              </p>
              {!isFeedPage &&
                !isCommunityPage &&
                !isMessagePage &&
                !isCreatePostPage &&
                !isLeaderboardPage &&
                !isSettingsPage &&
                !isMemberProfilePage && (
                  <p className="mt-2 flex items-center gap-2 text-sm text-[var(--text-muted)]">
                    <MapPin aria-hidden="true" className="text-[#2ED3D1]" size={16} />
                    {isLeaderboardPage
                      ? "Latest available rankings"
                      : "San Francisco, CA"}
                  </p>
                )}
            </div>
            <div className="flex shrink-0 items-center gap-4">
              <NotificationBell />
              <button
                aria-label="Sample profile: Alex"
                className="grid size-9 place-items-center rounded-full bg-[#FF5733] text-xs font-medium text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
                onClick={() => {
                  void navigate(ROUTES.CUSTOMER_OWN_PROFILE);
                }}
                type="button"
              >
                A
              </button>
            </div>
          </div>
        }
      />
    </>
  );
}
