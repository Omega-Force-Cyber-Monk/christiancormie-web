import {
  Bell,
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
import { useState } from "react";
import { Link, useMatch, useNavigate, useSearchParams } from "react-router";

import { useAppDispatch, useAppSelector } from "@/app/hooks";
import { Modal } from "@/components/overlays/Modal/Modal";
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
  const isMemberProfilePage =
    profileMatch?.pathname === ROUTES.CUSTOMER_OWN_PROFILE ||
    profileMatch?.pathname === ROUTES.CUSTOMER_PUBLIC_PROFILE;
  const [preview, setPreview] = useState<string | null>(null);

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
                    San Francisco, CA
                  </p>
                )}
            </div>
            <div className="flex shrink-0 items-center gap-4">
              <button
                aria-label="Notifications (sample count: 3)"
                className="relative grid size-9 place-items-center rounded-full border border-[#CDD5DF] bg-white text-[#414651] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
                onClick={() => setPreview("Notifications")}
                type="button"
              >
                <Bell aria-hidden="true" size={16} />
                <span
                  aria-hidden="true"
                  className="absolute -top-1 -right-1 grid size-4 place-items-center rounded-full bg-[#FB2C36] text-[10px] text-white"
                >
                  3
                </span>
              </button>
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
      <div className="discover-shell">
        <Modal
          isOpen={preview !== null}
          onClose={() => setPreview(null)}
          titleId="discover-shell-preview-title"
        >
          <div className="p-6 pt-12">
            <h2 className="text-xl font-semibold" id="discover-shell-preview-title">
              {preview} preview
            </h2>
            <p className="mt-3 text-sm text-[var(--text-muted)]">
              This screen is a static customer design preview.{" "}
              {preview === "Profile"
                ? "Alex and the San Francisco location are sample content from the design."
                : `${preview} functionality is not connected in this preview.`}
            </p>
            <Link
              className="mt-5 inline-flex min-h-11 items-center text-sm text-[#2ED3D1] underline focus-visible:outline"
              to={ROUTES.CUSTOMER_DISCOVER}
            >
              Go to Discover
            </Link>
          </div>
        </Modal>
      </div>
    </>
  );
}
