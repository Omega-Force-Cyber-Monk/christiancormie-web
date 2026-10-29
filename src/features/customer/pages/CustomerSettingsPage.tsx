import { RewardsPanel } from "@/features/rewards/components/RewardsPanel";
import { ArrowLeft } from "lucide-react";
import { useReducer, useState } from "react";
import { useSearchParams } from "react-router";
import { ConfirmationDialog } from "@/components/overlays/ConfirmationDialog/ConfirmationDialog";
import { useConfirmation } from "@/components/overlays/ConfirmationDialog/useConfirmation";
import {
  SettingsMenu,
  type SettingsMenuAction,
} from "@/features/customer/components/settings/SettingsMenu";
import { SettingsDialog } from "@/features/customer/components/settings/SettingsDialog";
import { SettingsProfilePanel } from "@/features/customer/components/settings/SettingsProfilePanel";
import { SettingsProfileEditor } from "@/features/customer/components/settings/SettingsProfileEditor";
import { SettingsPasswordForm } from "@/features/customer/components/settings/SettingsPasswordForm";
import { SettingsRequestForm } from "@/features/customer/components/settings/SettingsRequestForm";
import { SettingsIssueForm } from "@/features/customer/components/settings/SettingsIssueForm";
import {
  SettingsSupportList,
  SettingsConversation,
} from "@/features/customer/components/settings/SettingsSupport";
import { SettingsInvite } from "@/features/customer/components/settings/SettingsInvite";
import {
  parseSettingsSection,
  settingsTitles,
  type SettingsSection,
} from "@/features/customer/data/settings.data";
import {
  initialSettingsState,
  settingsReducer,
  type SettingsOverlay,
} from "@/features/customer/utils/settingsState";
import type { SettingsMessageValues } from "@/features/customer/schemas/settings.schema";
import "@/features/customer/components/settings/settings.css";
import { useAccount } from "@/features/account/hooks/useAccount";
import { useDeleteCustomerAccountMutation } from "@/features/account/api/account.api";
import { accountFields } from "@/features/account/utils/accountAdapters";
import { ErrorState } from "@/components/states/ErrorState";

function CustomerSettingsContent() {
  const account = useAccount();
  const [deleteAccount] = useDeleteCustomerAccountMutation();
  const [params, setParams] = useSearchParams();
  const section = parseSettingsSection(params.get("section"));
  const [state, dispatch] = useReducer(
    settingsReducer,
    undefined,
    initialSettingsState,
  );
  const [status, setStatus] = useState("");
  const [conversationDrafts, setConversationDrafts] = useState<
    Record<string, SettingsMessageValues>
  >({});
  const { confirm, confirmationProps } = useConfirmation();
  const overlay = state.overlay;
  const ticket =
    overlay?.kind === "conversation"
      ? state.tickets.find((item) => item.id === overlay.ticketId)
      : undefined;
  const open = (next: SettingsOverlay) => dispatch({ type: "overlay", overlay: next });
  function navigateSection(next: SettingsSection) {
    open(null);
    setParams(
      (current) => {
        const updated = new URLSearchParams(current);
        if (next === "home") updated.delete("section");
        else updated.set("section", next);
        return updated;
      },
      { preventScrollReset: true },
    );
  }
  function select(action: SettingsMenuAction) {
    if (action === "request" || action === "support") navigateSection(action);
    else open({ kind: action });
  }
  function deletePreview() {
    if (!account.user || account.user.vendor !== null) return;
    confirm({
      title: "Delete account",
      description:
        "Permanently delete your account and related records? This cannot be undone. Your session will end only after the server confirms deletion.",
      confirmText: "Permanently delete account",
      cancelText: "Keep account",
      variant: "danger",
      onConfirm: async () => {
        await deleteAccount({ scope: account.scope, confirmed: true }).unwrap();
      },
    });
  }
  const dialogTitle =
    overlay?.kind === "points"
      ? "How to Earn Points"
      : overlay?.kind === "profile"
        ? "Profile Information"
        : overlay?.kind === "edit"
          ? "Edit Profile"
          : overlay?.kind === "password"
            ? "Change password"
            : overlay?.kind === "invite"
              ? "Invite Friends"
              : "Support Team";

  return (
    <div className="customer-settings-page">
      <h1 className="sr-only">{settingsTitles[section]}</h1>
      {section === "home" && <SettingsMenu onSelect={select} />}
      {section !== "home" && (
        <div className="settings-section-toolbar">
          <button
            type="button"
            className="settings-back"
            aria-label={section === "issue" ? "Back to support" : "Back to settings"}
            onClick={() => navigateSection(section === "issue" ? "support" : "home")}
          >
            <ArrowLeft size={20} />
          </button>
          {section === "support" && (
            <button
              type="button"
              className="settings-secondary"
              onClick={() => navigateSection("issue")}
            >
              Report an issue
            </button>
          )}
        </div>
      )}
      <div hidden={section !== "request"}>
        <SettingsRequestForm />
      </div>
      <div hidden={section !== "issue"}>
        <SettingsIssueForm
          onSubmit={(values) => {
            dispatch({
              type: "ticket",
              values,
              id: `LOCAL-${crypto.randomUUID()}`,
              date: "Local preview",
            });
            setStatus(
              "Ticket added to this local preview. Nothing was sent to support.",
            );
            navigateSection("support");
          }}
        />
      </div>
      {section === "support" && (
        <SettingsSupportList
          tickets={state.tickets}
          onSelect={(ticketId) => open({ kind: "conversation", ticketId })}
        />
      )}
      <p className="mt-4 max-w-[810px] text-sm text-[#2ED3D1]" role="status">
        {status}
      </p>
      {overlay && (
        <SettingsDialog
          title={dialogTitle}
          variant={overlay.kind === "edit" ? "profile" : overlay.kind}
          onClose={() => open(null)}
        >
          {overlay.kind === "points" && <RewardsPanel guide />}
          {overlay.kind === "profile" &&
            (account.user ? (
              <SettingsProfilePanel
                profile={accountFields(account.user)}
                onEdit={() => open({ kind: "edit" })}
                onDelete={deletePreview}
              />
            ) : account.query.isError ? (
              <ErrorState
                onRetry={() => {
                  void account.query.refetch();
                }}
              />
            ) : (
              <p role="status">Loading account…</p>
            ))}
          {overlay.kind === "profile" && status && (
            <p role="status" className="mt-3 text-sm text-[#2ED3D1]">
              {status}
            </p>
          )}
          {overlay.kind === "edit" && account.user && (
            <SettingsProfileEditor
              profile={accountFields(account.user)}
              onSave={() => {
                open({ kind: "profile" });
                setStatus("Profile saved. Unsupported fields were not changed.");
              }}
              onCancel={() => open({ kind: "profile" })}
            />
          )}
          {overlay.kind === "password" && (
            <SettingsPasswordForm onCancel={() => open(null)} />
          )}
          {overlay.kind === "invite" && <SettingsInvite />}
          {overlay.kind === "conversation" && ticket && (
            <SettingsConversation
              key={ticket.id}
              ticket={ticket}
              draft={conversationDrafts[ticket.id] ?? { text: "", attachment: null }}
              onDraft={(values) =>
                setConversationDrafts((current) => ({
                  ...current,
                  [ticket.id]: values,
                }))
              }
              onSend={(values) =>
                dispatch({
                  type: "message",
                  ticketId: ticket.id,
                  message: {
                    id: crypto.randomUUID(),
                    sender: "you",
                    text: values.text,
                    time: "Local preview · not sent",
                    attachment: values.attachment ?? undefined,
                  },
                })
              }
            />
          )}
        </SettingsDialog>
      )}
      {confirmationProps && <ConfirmationDialog {...confirmationProps} />}
    </div>
  );
}
export default function CustomerSettingsPage() {
  const account = useAccount();
  return account.allowed ? (
    <CustomerSettingsContent key={account.key} />
  ) : (
    <p>Verified account required.</p>
  );
}
