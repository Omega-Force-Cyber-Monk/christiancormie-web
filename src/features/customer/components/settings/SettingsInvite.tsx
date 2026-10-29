import { useEffect, useRef, useState } from "react";
import { useStore } from "react-redux";
import { useAppSelector } from "@/app/hooks";
import type { RootState } from "@/app/store";
import {
  selectCurrentRole,
  selectIsAuthenticated,
} from "@/features/auth/store/auth.selectors";
import { FormField } from "@/components/forms/FormField";
import { Button } from "@/components/ui/Button";
import { AppLoader } from "@/components/ui/AppLoader";
import { ErrorState } from "@/components/states/ErrorState";
import { useGetReferralCodesQuery } from "@/features/referrals/api/referrals.api";
import {
  copyReferralCode,
  customerReferralCodes,
  referralAvailability,
} from "@/features/referrals/utils/referralAdapters";
import type { ReferralCode } from "@/features/referrals/schemas/referrals.schema";
import { scopeMatches, type SessionScope } from "@/services/api/sessionGuard";
import { normalizeApiError } from "@/utils/errors/normalizeApiError";
import { toast } from "sonner";

export function SettingsInvite() {
  const auth = useAppSelector((s) => s.auth);
  const authenticated = useAppSelector(selectIsAuthenticated);
  const role = useAppSelector(selectCurrentRole);
  const scope = {
    sessionId: auth.sessionId ?? "",
    userId: auth.user?.id ?? "",
    role: role ?? "",
  };
  return authenticated && role === "CUSTOMER" ? (
    <SettingsInviteContent
      key={`${scope.sessionId}:${scope.userId}:${scope.role}`}
      scope={scope}
    />
  ) : (
    <p role="status">
      A verified Customer session is required for referral invitations.
    </p>
  );
}
function SettingsInviteContent({ scope }: { scope: SessionScope }) {
  const query = useGetReferralCodesQuery(scope);
  const store = useStore<RootState>();
  const [status, setStatus] = useState("");
  const [copying, setCopying] = useState("");
  const [now, setNow] = useState(() => Date.now());
  const pending = useRef(false);
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);
  const normalized = query.error ? normalizeApiError(query.error) : null;
  const denied = normalized && [401, 403, 404].includes(normalized.status ?? 0);
  const codes = customerReferralCodes(denied ? [] : (query.currentData ?? []));
  const expires = codes.flatMap((code) =>
    code.expiresAt && Date.parse(code.expiresAt) > now
      ? [Date.parse(code.expiresAt)]
      : [],
  );
  const nextExpiry = expires.length ? Math.min(...expires) : undefined;
  useEffect(() => {
    if (nextExpiry === undefined) return;
    const timeout = setTimeout(
      () => setNow(Date.now()),
      Math.min(Math.max(0, nextExpiry - Date.now() + 1), 2147483647),
    );
    return () => clearTimeout(timeout);
  }, [nextExpiry, now]);
  const current = () => mounted.current && scopeMatches(store.getState(), scope);
  async function copy(code: ReferralCode) {
    if (pending.current) return;
    pending.current = true;
    setCopying(code.id);
    setStatus("");
    try {
      const copied = await copyReferralCode(
        code,
        navigator.clipboard ? (text) => navigator.clipboard.writeText(text) : undefined,
        current,
      );
      if (copied) {
        setStatus(
          "Referral code copied. No referral has been applied and no points were awarded.",
        );
        toast.success("Referral code copied.");
      }
    } catch (cause) {
      if (current()) {
        const message =
          cause instanceof Error
            ? cause.message
            : "Copy failed. Select the code and copy it manually.";
        setStatus(message);
        toast.error("Referral code could not be copied.");
      }
    } finally {
      pending.current = false;
      if (current()) {
        setCopying("");
        setNow(Date.now());
      }
    }
  }
  return (
    <div className="space-y-4">
      <p className="text-sm leading-6 text-[#B8C1D1]">
        Share an available Customer referral code with a friend. Copying does not apply
        a referral or confirm a reward. A shareable referral URL is not available.
      </p>
      <Button disabled={query.isFetching} onClick={() => void query.refetch()}>
        Refresh referral codes
      </Button>
      {query.isLoading && (
        <AppLoader variant="compact" label="Loading referral codes" />
      )}
      {query.isFetching && !query.isLoading && (
        <p role="status" className="text-sm text-[#B8C1D1]">
          Refreshing referral codes…
        </p>
      )}
      {normalized && (
        <ErrorState error={normalized} onRetry={() => void query.refetch()} />
      )}
      {!query.isLoading && !query.error && !codes.length && (
        <p role="status" className="text-sm text-[#B8C1D1]">
          No Customer referral codes are available. Code creation is not available here.
        </p>
      )}
      <ul className="space-y-4">
        {codes.map((code) => {
          const availability = referralAvailability(code, now);
          return (
            <li key={code.id} className="space-y-4">
              <FormField
                label="Referral code"
                readOnly
                value={code.code}
                onFocus={(event) => event.currentTarget.select()}
              />
              <dl className="space-y-1 text-sm text-[#B8C1D1]">
                <div>
                  <dt className="inline">Program: </dt>
                  <dd className="inline">{code.programType}</dd>
                </div>
                <div>
                  <dt className="inline">Status: </dt>
                  <dd className="inline">{availability}</dd>
                </div>
                <div>
                  <dt className="inline">Expires: </dt>
                  <dd className="inline">
                    {code.expiresAt
                      ? new Date(code.expiresAt).toLocaleString("en-US")
                      : "No expiration"}
                  </dd>
                </div>
                <div>
                  <dt className="inline">Uses: </dt>
                  <dd className="inline">
                    {code.usageCount} / {code.maximumUses ?? "Unlimited"}
                  </dd>
                </div>
              </dl>
              <button
                className="settings-primary"
                type="button"
                disabled={
                  !!copying ||
                  availability !== "Available" ||
                  !!denied ||
                  query.isFetching
                }
                onClick={() => void copy(code)}
              >
                {copying === code.id ? "Copying…" : "Copy referral code"}
              </button>
            </li>
          );
        })}
      </ul>
      {codes.length > 0 &&
        codes.every((code) => referralAvailability(code, now) !== "Available") && (
          <p role="status" className="text-sm text-[#B8C1D1]">
            None of these codes is currently available to share. Refresh to check for
            updated availability.
          </p>
        )}
      <p role="status" className="text-sm text-[#2ED3D1]">
        {status}
      </p>
    </div>
  );
}
