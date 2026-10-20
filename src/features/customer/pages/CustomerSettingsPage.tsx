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
  pointsGuide,
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

export default function CustomerSettingsPage() {
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
    confirm({
      title: "Delete account",
      description:
        "Account deletion requires backend integration. This preview cannot delete your account or remove any data.",
      confirmText: "Close preview",
      cancelText: "Keep account",
      variant: "danger",
      onConfirm: () =>
        setStatus(
          "Account deletion is unavailable in this local preview. Your account and sample data remain unchanged.",
        ),
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
          {overlay.kind === "points" && (
            <>
              <table className="settings-points-table">
                <caption className="sr-only">
                  Points per action from the supplied design
                </caption>
                <thead>
                  <tr>
                    <th colSpan={2}>POINTS PER ACTION</th>
                  </tr>
                </thead>
                <tbody>
                  {pointsGuide.map((item) => (
                    <tr key={item.action}>
                      <th scope="row">{item.action}</th>
                      <td
                        className={
                          item.action === "Refer a friend"
                            ? "text-[#2ED3D1]"
                            : "text-[#FFB800]"
                        }
                      >
                        +{item.points}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="mt-3 px-4 text-xs leading-5 text-[#B8C1D1]">
                Sample reward values. Points are not awarded in this preview.
              </p>
            </>
          )}
          {overlay.kind === "profile" && (
            <SettingsProfilePanel
              profile={state.profile}
              photo={state.photo}
              onPhoto={(file) => {
                dispatch({ type: "photo", file });
                setStatus("Sample profile photo updated locally.");
              }}
              onEdit={() => open({ kind: "edit" })}
              onDelete={deletePreview}
            />
          )}
          {overlay.kind === "profile" && status && (
            <p role="status" className="mt-3 text-sm text-[#2ED3D1]">
              {status}
            </p>
          )}
          {overlay.kind === "edit" && (
            <SettingsProfileEditor
              profile={state.profile}
              onSave={(values) => {
                dispatch({ type: "profile", values });
                setStatus(
                  "Sample profile saved locally. Your account was not updated.",
                );
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
