import { Bell } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import { useStore } from "react-redux";
import { useNavigate } from "react-router";
import { skipToken } from "@reduxjs/toolkit/query";
import { toast } from "sonner";
import type { RootState } from "@/app/store";
import { useAppSelector } from "@/app/hooks";
import { selectCurrentRole } from "@/features/auth/store/auth.selectors";
import type { SessionScope } from "@/services/api/sessionGuard";
import { Button } from "@/components/ui/Button";
import { normalizeApiError } from "@/utils/errors/normalizeApiError";
import {
  notificationsAllowed,
  useGetNotificationUnreadCountQuery,
  useGetNotificationsQuery,
  useReadNotificationMutation,
  useReadAllNotificationsMutation,
} from "./notifications.api";
import { notificationTarget } from "./notificationNavigation";
import type { Notification } from "./notifications.schema";

export function NotificationBell({ square = false }: { square?: boolean }) {
  const auth = useAppSelector((s) => s.auth);
  const role = useAppSelector(selectCurrentRole);
  const scope = {
    sessionId: auth.sessionId ?? "",
    userId: auth.user?.id ?? "",
    role: role ?? "",
  };
  const allowed = useAppSelector((s) => notificationsAllowed(s, scope));
  return allowed ? (
    <NotificationMenu
      key={`${scope.sessionId}:${scope.userId}:${scope.role}`}
      scope={scope}
      square={square}
    />
  ) : (
    <button
      type="button"
      disabled
      aria-label="Notifications require a verified Customer or Vendor session"
      className={bellClass(square)}
    >
      <Bell size={16} />
    </button>
  );
}
function bellClass(square: boolean) {
  return square
    ? "relative inline-flex size-10 items-center justify-center rounded-md border border-[var(--border)] bg-[var(--surface)] text-[var(--text-muted)] transition hover:bg-[var(--surface-muted)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
    : "relative grid size-9 place-items-center rounded-full border border-[#CDD5DF] bg-white text-[#414651] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2";
}
function NotificationMenu({ scope, square }: { scope: SessionScope; square: boolean }) {
  const store = useStore<RootState>();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [offset, setOffset] = useState(0);
  const [pending, setPending] = useState(false);
  const lock = useRef(false);
  const [failure, setFailure] = useState("");
  const root = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const id = useId();
  const count = useGetNotificationUnreadCountQuery(scope);
  const list = useGetNotificationsQuery(
    open ? { ...scope, filters: { unreadOnly, limit: 20, offset } } : skipToken,
    { refetchOnMountOrArgChange: true },
  );
  const [read] = useReadNotificationMutation();
  const [readAll] = useReadAllNotificationsMutation();
  useEffect(() => {
    if (!open) return;
    const pointer = (e: PointerEvent) => {
      if (e.target instanceof Node && !root.current?.contains(e.target)) setOpen(false);
    };
    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        trigger.current?.focus();
      }
    };
    document.addEventListener("pointerdown", pointer);
    document.addEventListener("keydown", key);
    return () => {
      document.removeEventListener("pointerdown", pointer);
      document.removeEventListener("keydown", key);
    };
  }, [open]);
  const current = () => notificationsAllowed(store.getState(), scope);
  async function mark(n?: Notification) {
    if (lock.current || !current() || n?.isRead) return;
    lock.current = true;
    setPending(true);
    setFailure("");
    try {
      if (n) await read({ ...scope, notificationId: n.id }).unwrap();
      else await readAll(scope).unwrap();
      if (current()) setOffset(0);
    } catch (e) {
      if (current()) {
        const message = normalizeApiError(e).message;
        setFailure(message);
        toast.error(message);
      }
    } finally {
      lock.current = false;
      if (current()) setPending(false);
    }
  }
  const unread = !count.error ? count.currentData?.unreadCount : undefined;
  const items = !list.error ? list.currentData : undefined;
  return (
    <div className="relative" ref={root}>
      <button
        type="button"
        className={bellClass(square)}
        aria-label={`Notifications${unread === undefined ? ", unread count unavailable" : `, ${unread} unread`}`}
        aria-expanded={open}
        aria-controls={open ? id : undefined}
        ref={trigger}
        onClick={() => {
          setOpen(!open);
          if (!open) void count.refetch();
        }}
      >
        <Bell aria-hidden="true" size={16} />
        {unread !== undefined && unread > 0 && (
          <span
            aria-hidden="true"
            className="absolute -top-1 -right-1 grid min-w-4 h-4 place-items-center rounded-full bg-[#FB2C36] px-1 text-[10px] text-white"
          >
            {unread > 99 ? "99+" : unread}
          </span>
        )}
      </button>
      {open && (
        <section
          id={id}
          aria-label="Notifications"
          className="absolute right-0 z-50 mt-2 max-h-[70dvh] w-[min(22rem,calc(100vw-2rem))] space-y-3 overflow-y-auto rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 text-sm text-[var(--text)] shadow-2xl"
        >
          <h2 className="font-semibold">Notifications</h2>
          <div className="flex flex-wrap items-center gap-2">
            <label>
              <input
                type="checkbox"
                checked={unreadOnly}
                onChange={(e) => {
                  setUnreadOnly(e.target.checked);
                  setOffset(0);
                }}
              />{" "}
              Unread only
            </label>
            <Button disabled={pending || unread === 0} onClick={() => void mark()}>
              Mark all as read
            </Button>
            <Button
              disabled={list.isFetching || count.isFetching}
              onClick={() => {
                void list.refetch();
                void count.refetch();
              }}
            >
              Refresh notifications
            </Button>
          </div>
          {count.error && (
            <p role="alert">
              Unread count unavailable.{" "}
              <button type="button" onClick={() => void count.refetch()}>
                Retry unread count
              </button>
            </p>
          )}
          {failure && <p role="alert">{failure}</p>}
          {list.isFetching && <p role="status">Loading notifications…</p>}
          {list.error && (
            <div role="alert">
              <p>{normalizeApiError(list.error).message}</p>
              <Button onClick={() => void list.refetch()}>Retry notifications</Button>
            </div>
          )}
          {items && (
            <NotificationItems
              items={items}
              role={scope.role}
              pending={pending}
              onRead={(n) => void mark(n)}
              onOpen={(to) => {
                if (current()) {
                  setOpen(false);
                  void navigate(to);
                }
              }}
            />
          )}
          <div className="flex items-center justify-between gap-2">
            <Button
              disabled={!offset || list.isFetching}
              onClick={() => setOffset(Math.max(0, offset - 20))}
            >
              Previous
            </Button>
            <span>Page {offset / 20 + 1}</span>
            <Button
              disabled={!items || items.length < 20 || list.isFetching}
              onClick={() => setOffset(offset + 20)}
            >
              Next
            </Button>
          </div>
        </section>
      )}
    </div>
  );
}
export function NotificationItems({
  items,
  role,
  pending,
  onRead,
  onOpen,
}: {
  items: Notification[];
  role: string;
  pending: boolean;
  onRead: (n: Notification) => void;
  onOpen: (to: string) => void;
}) {
  if (!items.length) return <p role="status">No notifications in this view.</p>;
  return (
    <ul className="space-y-3">
      {items.map((n) => {
        const target = notificationTarget(n, role);
        return (
          <li
            key={n.id}
            className={`rounded-lg border border-[var(--border)] p-3 ${n.isRead ? "opacity-80" : "bg-[var(--surface-muted)]"}`}
          >
            <p className="break-words font-semibold">{n.title}</p>
            <p className="break-words whitespace-pre-wrap">{n.message}</p>
            <time dateTime={n.createdAt} className="text-xs">
              {new Date(n.createdAt).toLocaleString(undefined, { timeZone: "UTC" })} UTC
            </time>
            <p className="text-xs">{n.isRead ? "Read" : "Unread"}</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {!n.isRead && (
                <Button disabled={pending} onClick={() => onRead(n)}>
                  Mark as read
                </Button>
              )}
              {target ? (
                <Button onClick={() => onOpen(target.to)}>{target.label}</Button>
              ) : (
                <p className="text-xs">
                  Details shown here; this target has no available link for your role.
                </p>
              )}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
