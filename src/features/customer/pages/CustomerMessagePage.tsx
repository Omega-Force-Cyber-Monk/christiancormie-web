import {
  useMessagingIdentity,
  useMessagingWorkspace,
} from "@/features/messaging/hooks/useMessagingWorkspace";
import type { MessagingScope } from "@/features/messaging/types/messaging.types";
import { ConversationListControls } from "@/features/messaging/components/ConversationListControls";
import { ConversationActions } from "@/features/messaging/components/MessageControls";
import { conversationRow } from "@/features/messaging/utils/messagingAdapters";
import { ErrorState } from "@/components/states/ErrorState";
import { MessageConversationList } from "../components/message/MessageConversationList";
import { MessageThread } from "../components/message/MessageThread";
import "../components/message/message.css";
function CustomerWorkspace({
  scope,
  viewer,
}: {
  scope: MessagingScope;
  viewer: string;
}) {
  const w = useMessagingWorkspace(scope, viewer);
  return (
    <div className="customer-message-page">
      <h1 className="sr-only">Messages</h1>
      <div className="message-workspace">
        <div className="flex min-h-0 min-w-0 flex-col">
          <ConversationListControls workspace={w} scope={scope} />
          <MessageConversationList
            conversations={w.rows}
            selectedId={w.selectedId}
            search={w.search}
            onSearch={w.setSearch}
            onSelect={(c) => w.select(c.id)}
          />
        </div>
        <div
          ref={(node) => w.attachThread(node)}
          className="flex min-h-0 min-w-0 flex-col"
        >
          <ConversationActions workspace={w} />
          {w.detail.isFetching && <p role="status">Loading conversation…</p>}
          {(w.detail.isError || w.history.isError) && (
            <ErrorState
              onRetry={() => {
                if (!w.detail.isUninitialized) void w.detail.refetch();
                if (!w.history.isUninitialized) void w.history.refetch();
              }}
            />
          )}
          {w.history.isFetching && <p role="status">Loading messages…</p>}
          {w.conversation ? (
            <MessageThread
              key={w.selectedId}
              conversation={conversationRow(w.conversation)}
              entries={w.messages}
              composer={{
                text: w.draft.text,
                onText: w.onText,
                onSend: w.send,
                pending: w.sending,
                disabled: !w.canSend || !w.history.currentData || w.history.isError,
              }}
            />
          ) : (
            <p className="p-6">
              {w.rawId
                ? "Conversation unavailable."
                : "Choose a conversation or start a new message."}
            </p>
          )}
          {w.error && (
            <p role="alert" className="p-3">
              {w.error}
            </p>
          )}
        </div>
      </div>
      <p className="message-preview-note">
        Text sending uses HTTP; selected conversations receive realtime updates when
        connected. Attachment uploads and presence are unavailable. Use Refresh for
        updates when realtime is unavailable.
      </p>
    </div>
  );
}
export default function CustomerMessagePage() {
  const identity = useMessagingIdentity();
  return identity.allowed ? (
    <CustomerWorkspace
      key={identity.key}
      scope={identity.scope}
      viewer={identity.viewer}
    />
  ) : (
    <p>Verified Customer or Vendor identity is required.</p>
  );
}
