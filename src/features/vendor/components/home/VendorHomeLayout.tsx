import {
  Activity,
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
  UserRound,
  Zap,
} from "lucide-react";
import { useState } from "react";
import { Link, useMatch, useNavigate, useSearchParams } from "react-router";
import { useAppDispatch, useAppSelector } from "@/app/hooks";
import { ROUTES } from "@/constants/routes";
import { clearSession } from "@/features/auth/store/auth.slice";
import { selectIsAuthenticated } from "@/features/auth/store/auth.selectors";
import { DashboardLayout } from "@/layouts/DashboardLayout/DashboardLayout";
import logo from "@/features/vendor/assets/home/Home-logo.svg";
import { useVendorContext } from "@/features/vendor/utils/useVendorContext";
import { useGetVendorRequestCountsQuery } from "@/features/vendor/api/vendor.api";
import { vendorNumber } from "@/features/vendor/utils/vendorAdapters";
import { VendorHomeDialog } from "@/features/vendor/components/home/VendorHomeDialog";

import "@/features/vendor/components/home/home.css";
import { getVendorPostCategory } from "@/features/vendor/data/create-posts.data";

const navigation = [
  { label: "Feed", Icon: Rss, to: ROUTES.VENDOR_FEED },
  { label: "Drops", Icon: Zap, to: ROUTES.VENDOR_DROPS },
  { label: "Requests", Icon: MessageCircle, to: ROUTES.VENDOR_ORDERS },
  { label: "Create post", Icon: Plus, to: ROUTES.VENDOR_CREATE_POST },
  { label: "Message", Icon: MessageSquare, to: ROUTES.VENDOR_MESSAGE },
  { label: "Earnings & Analytics", Icon: Activity, to: ROUTES.VENDOR_EARNINGS },
  { label: "Profile", Icon: UserRound, to: ROUTES.VENDOR_PROFILE },
  { label: "Leaderboard", Icon: Trophy, to: ROUTES.VENDOR_LEADERBOARD },
];
export default function VendorHomeLayout() {
  const isFeed = useMatch(ROUTES.VENDOR_FEED) !== null;
  const isDrops = useMatch(ROUTES.VENDOR_DROPS) !== null;
  const isRequests = useMatch(ROUTES.VENDOR_ORDERS) !== null;
  const isCreatePost = useMatch(ROUTES.VENDOR_CREATE_POST) !== null;
  const isMessage = useMatch(ROUTES.VENDOR_MESSAGE) !== null;
  const isEarnings = useMatch(ROUTES.VENDOR_EARNINGS) !== null;
  const isSettings = useMatch(ROUTES.VENDOR_SETTINGS) !== null;
  const isLeaderboard = useMatch(ROUTES.VENDOR_LEADERBOARD) !== null;
  const isProfile = useMatch(ROUTES.VENDOR_PROFILE) !== null;
  const [searchParams] = useSearchParams();
  const postCategory = isCreatePost
    ? getVendorPostCategory(searchParams.get("category"))
    : undefined;
  const activePath = isFeed
    ? ROUTES.VENDOR_FEED
    : isDrops
      ? ROUTES.VENDOR_DROPS
      : isRequests
        ? ROUTES.VENDOR_ORDERS
        : isCreatePost
          ? ROUTES.VENDOR_CREATE_POST
          : isMessage
            ? ROUTES.VENDOR_MESSAGE
            : isEarnings
              ? ROUTES.VENDOR_EARNINGS
              : isProfile
                ? ROUTES.VENDOR_PROFILE
                : isLeaderboard
                  ? ROUTES.VENDOR_LEADERBOARD
                  : isSettings
                    ? ROUTES.VENDOR_SETTINGS
                    : ROUTES.VENDOR_DASHBOARD;
  const [preview, setPreview] = useState<string | null>(null);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const authenticated = useAppSelector(selectIsAuthenticated);
  const context = useVendorContext();
  const counts = useGetVendorRequestCountsQuery(undefined, { skip: !context.allowed });
  const identity = context.identity;
  return (
    <>
      <DashboardLayout
        className={`vendor-home-shell${isFeed ? " vendor-feed-shell" : ""}${isDrops ? " vendor-drops-shell" : ""}${isRequests ? " vendor-requests-shell" : ""}${isCreatePost ? " vendor-create-post-shell" : ""}${postCategory && postCategory.id !== "truck" ? " vendor-create-post-form-shell" : ""}${isMessage ? " vendor-messages-shell" : ""}${isEarnings ? " vendor-earnings-shell" : ""}${isProfile ? " vendor-profile-shell" : ""}${isLeaderboard ? " vendor-leaderboard-shell" : ""}${isSettings ? " vendor-settings-shell" : ""}`}
        sidebarContent={(onNavigate) => (
          <>
            <div className="mx-6 border-b border-[#242D42] pt-8 pb-3">
              <Link
                to={ROUTES.VENDOR_DASHBOARD}
                onClick={onNavigate}
                aria-label="BiteDrop Vendor Home"
              >
                <img
                  src={logo}
                  className="h-[60px] w-16"
                  alt="BiteDrop — Discover. Book. Eat."
                />
              </Link>
            </div>
            <nav
              className="flex min-h-0 flex-1 flex-col px-6 pt-4 pb-7"
              aria-label="Vendor navigation"
            >
              <div className="min-h-0 flex-1 space-y-1 overflow-y-auto">
                <Link
                  className={`vendor-home-nav${activePath === ROUTES.VENDOR_DASHBOARD ? " vendor-home-nav--active" : ""}`}
                  to={ROUTES.VENDOR_DASHBOARD}
                  onClick={onNavigate}
                  aria-current={
                    activePath === ROUTES.VENDOR_DASHBOARD ? "page" : undefined
                  }
                >
                  <House size={19} aria-hidden="true" />
                  Home
                </Link>
                {navigation.map(({ label, Icon, ...item }) =>
                  "to" in item && item.to ? (
                    <Link
                      className={`vendor-home-nav${item.to === activePath ? " vendor-home-nav--active" : ""}`}
                      aria-current={item.to === activePath ? "page" : undefined}
                      key={label}
                      to={item.to}
                      onClick={onNavigate}
                    >
                      <Icon size={19} aria-hidden="true" />
                      {label}
                      {label === "Requests" &&
                      context.allowed &&
                      counts.currentData?.bookings !== null &&
                      counts.currentData?.bookings !== undefined &&
                      !counts.isError ? (
                        <span
                          className="ml-auto text-xs"
                          aria-label={`${counts.currentData.bookings} booking requests`}
                        >
                          {vendorNumber(counts.currentData.bookings)}
                        </span>
                      ) : null}
                    </Link>
                  ) : (
                    <button
                      className="vendor-home-nav w-full"
                      key={label}
                      type="button"
                      onClick={() => {
                        onNavigate?.();
                        setPreview(label);
                      }}
                    >
                      <Icon size={19} aria-hidden="true" />
                      {label}
                      {label === "Requests" &&
                      context.allowed &&
                      counts.currentData?.bookings !== null &&
                      counts.currentData?.bookings !== undefined &&
                      !counts.isError ? (
                        <span
                          className="ml-auto text-xs"
                          aria-label={`${counts.currentData.bookings} booking requests`}
                        >
                          {vendorNumber(counts.currentData.bookings)}
                        </span>
                      ) : null}
                    </button>
                  ),
                )}
              </div>
              <div className="mt-auto space-y-1 pt-4">
                <Link
                  className={`vendor-home-nav w-full${isSettings ? " vendor-home-nav--active" : ""}`}
                  to={ROUTES.VENDOR_SETTINGS}
                  aria-current={isSettings ? "page" : undefined}
                  onClick={onNavigate}
                >
                  <Settings size={19} aria-hidden="true" />
                  Settings
                </Link>
                <button
                  className="vendor-home-nav w-full text-[#FF5733]"
                  type="button"
                  disabled={!authenticated}
                  onClick={() => {
                    onNavigate?.();
                    dispatch(clearSession());
                    void navigate(ROUTES.LOGIN, { replace: true });
                  }}
                >
                  <LogOut size={19} aria-hidden="true" />
                  Sign out
                </button>
              </div>
            </nav>
          </>
        )}
        navbarContent={
          <div className="flex min-w-0 flex-1 items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-2">
              {isFeed ||
              isDrops ||
              isRequests ||
              isCreatePost ||
              isMessage ||
              isEarnings ||
              isProfile ||
              isLeaderboard ||
              isSettings ? (
                <p className="truncate text-2xl leading-8 font-bold">
                  {isSettings
                    ? "Settings"
                    : isProfile || isLeaderboard
                      ? "Profile"
                      : isEarnings
                        ? "Earnings & Analytics"
                        : isCreatePost
                          ? postCategory && postCategory.id !== "truck"
                            ? postCategory.heading
                            : "Requests"
                          : isRequests || isMessage
                            ? "Requests"
                            : isDrops
                              ? "Drops"
                              : "Feed"}
                </p>
              ) : (
                <>
                  {identity?.imageUrl ? (
                    <img
                      src={identity.imageUrl}
                      alt=""
                      className="hidden size-[50px] rounded-full border border-[#FF5733] object-cover sm:block"
                    />
                  ) : (
                    <span
                      className="hidden size-[50px] items-center justify-center rounded-full border border-[#FF5733] sm:flex"
                      aria-hidden="true"
                    >
                      {identity?.initials ?? "?"}
                    </span>
                  )}
                  <div className="min-w-0">
                    <p className="truncate text-xl leading-8 font-bold sm:text-2xl">
                      {identity
                        ? identity.name
                        : context.profile.isFetching
                          ? "Loading vendor..."
                          : "Vendor"}
                    </p>
                    <p className="mt-1 flex items-center gap-1 text-xs text-[#B8C1D1] sm:text-sm">
                      <MapPin
                        size={16}
                        className="shrink-0 text-[#00D3DF]"
                        aria-hidden="true"
                      />
                      {identity?.location ?? "Location unavailable"}
                    </p>
                  </div>
                </>
              )}
            </div>
            <div className="flex shrink-0 items-center gap-4">
              <button
                type="button"
                className="relative grid size-9 place-items-center rounded-full border border-[#CDD5DF] bg-white text-[#414651]"
                aria-label="Notifications, not connected"
                onClick={() => setPreview("Notifications")}
              >
                <Bell size={16} />
              </button>
              <button
                type="button"
                className="grid size-9 place-items-center rounded-full bg-[#FF5733] text-xs text-white"
                aria-label="Vendor account"
                onClick={() => {
                  void navigate(ROUTES.VENDOR_PROFILE);
                }}
              >
                {identity?.initials ?? "?"}
              </button>
            </div>
          </div>
        }
      />
      {preview && (
        <div className="vendor-home-theme">
          <VendorHomeDialog
            title={`${preview} preview`}
            onClose={() => setPreview(null)}
          >
            <p className="text-sm leading-6 text-[#B8C1D1]">
              {preview === "Notifications"
                ? "Notifications are not connected yet. No notification count is available."
                : "This feature is not connected from the vendor dashboard."}
            </p>
            {preview === "Profile" && (
              <Link
                className="mt-5 inline-flex min-h-11 items-center text-[#2ED3D1] underline"
                to={ROUTES.VENDOR_PRODUCTS}
              >
                Open existing Vendor products
              </Link>
            )}
          </VendorHomeDialog>
        </div>
      )}
    </>
  );
}
