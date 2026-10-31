import { useRef, useState } from "react";
import {
  useMessagingIdentity,
  useMessagingWorkspace,
} from "@/features/messaging/hooks/useMessagingWorkspace";
import type { MessagingScope } from "@/features/messaging/types/messaging.types";
import { ConversationListControls } from "@/features/messaging/components/ConversationListControls";
import {
  ConversationActions,
  UnsupportedMessaging,
} from "@/features/messaging/components/MessageControls";
import { conversationRow } from "@/features/messaging/utils/messagingAdapters";
import { ErrorState } from "@/components/states/ErrorState";
import { VendorHomeDialog } from "../components/home/VendorHomeDialog";
import { VendorConversationList } from "../components/messages/VendorConversationList";
import { VendorMessageThread } from "../components/messages/VendorMessageThread";
import { VendorMessageComposer } from "../components/messages/VendorMessageComposer";
import "../components/messages/messages.css";
function VendorWorkspace({ scope, viewer }: { scope: MessagingScope; viewer: string }) {
  const w = useMessagingWorkspace(scope, viewer);
  const [details, setDetails] = useState(false);
  const [unsupported, setUnsupported] = useState(false);
  const listRegion = useRef<HTMLDivElement>(null);
  return (
    <section className="vendor-messages-page" aria-label="Vendor messaging">
      <div
        className={`vendor-messages-panel${w.selectedId ? " vendor-messages-panel--thread" : ""}`}
      >
        <div
          ref={listRegion}
          tabIndex={-1}
          className="vendor-messages-list-region outline-none"
        >
          <ConversationListControls workspace={w} scope={scope} />
          <VendorConversationList
            conversations={w.rows}
            selectedId={w.selectedId}
            query={w.search}
            onQuery={w.setSearch}
            onSelect={w.select}
          />
        </div>
        <div
          className="vendor-messages-thread-region"
          ref={(node) => w.attachThread(node)}
        >
          <ConversationActions workspace={w} />
          {w.selectedId && !w.conversation && (
            <button
              className="vendor-message-mobile-back"
              onClick={w.clearSelection}
              type="button"
            >
              Back
            </button>
          )}
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
            <>
              <VendorMessageThread
                key={w.selectedId}
                conversation={conversationRow(w.conversation)}
                messages={w.messages}
                mobileOpen={Boolean(w.selectedId)}
                onBack={() => {
                  w.clearSelection();
                  requestAnimationFrame(() => listRegion.current?.focus());
                }}
                onDetails={() => setDetails(true)}
                onUnavailable={() => setUnsupported(true)}
              />
              <VendorMessageComposer
                key={w.selectedId}
                text={w.draft.text}
                onText={w.onText}
                onSend={w.send}
                pending={w.sending}
                disabled={!w.canSend || !w.history.currentData || w.history.isError}
              />
            </>
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
      <p className="mt-3 text-xs leading-5 text-[#B8C1D1]">
        Text sending uses HTTP; selected conversations receive realtime updates when
        connected. Attachment uploads and presence are unavailable. Use Refresh for
        updates when realtime is unavailable.
      </p>
      {details && w.conversation && (
        <VendorHomeDialog
          title="Conversation details"
          onClose={() => setDetails(false)}
        >
          <p>{conversationRow(w.conversation).name}</p>
          <p>
            {w.conversation.type} · {w.conversation.directStatus}
          </p>
          <p>
            {w.conversation.messageCount} messages · {w.conversation.unreadCount} unread
          </p>
        </VendorHomeDialog>
      )}
      {unsupported && <UnsupportedMessaging onClose={() => setUnsupported(false)} />}
    </section>
  );
}
export default function VendorMessagesPage() {
  const identity = useMessagingIdentity();
  return identity.allowed ? (
    <VendorWorkspace
      key={identity.key}
      scope={identity.scope}
      viewer={identity.viewer}
    />
  ) : (
    <p>Verified Customer or Vendor identity is required.</p>
  );
}
