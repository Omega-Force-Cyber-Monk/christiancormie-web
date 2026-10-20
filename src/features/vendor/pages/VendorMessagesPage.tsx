import { useReducer, useRef, useState } from "react";
import { ConfirmationDialog } from "@/components/overlays/ConfirmationDialog/ConfirmationDialog";
import { useConfirmation } from "@/components/overlays/ConfirmationDialog/useConfirmation";
import { VendorHomeDialog } from "@/features/vendor/components/home/VendorHomeDialog";
import { VendorConversationList } from "@/features/vendor/components/messages/VendorConversationList";
import { VendorMessageThread } from "@/features/vendor/components/messages/VendorMessageThread";
import { VendorMessageComposer } from "@/features/vendor/components/messages/VendorMessageComposer";
import {
  filterVendorConversations,
  initialVendorMessagesState,
  vendorMessagesReducer,
} from "@/features/vendor/utils/messagesState";
import "@/features/vendor/components/messages/messages.css";
export default function VendorMessagesPage() {
  const [state, dispatch] = useReducer(
    vendorMessagesReducer,
    undefined,
    initialVendorMessagesState,
  );
  const [query, setQuery] = useState("");
  const [details, setDetails] = useState(false);
  const listRegion = useRef<HTMLDivElement>(null);
  const { confirm, confirmationProps } = useConfirmation();
  const conversation =
    state.conversations.find((c) => c.id === state.selectedId) ??
    state.conversations[0];
  return (
    <section className="vendor-messages-page" aria-label="Vendor messaging preview">
      <div
        className={`vendor-messages-panel${state.mobileOpen ? " vendor-messages-panel--thread" : ""}`}
      >
        <div
          ref={listRegion}
          tabIndex={-1}
          className="vendor-messages-list-region outline-none"
        >
          <VendorConversationList
            conversations={filterVendorConversations(state.conversations, query)}
            selectedId={state.selectedId}
            query={query}
            onQuery={setQuery}
            onSelect={(id) => dispatch({ type: "select", id })}
          />
        </div>
        <div className="vendor-messages-thread-region">
          <VendorMessageThread
            conversation={conversation}
            mobileOpen={state.mobileOpen}
            onBack={() => {
              dispatch({ type: "back" });
              requestAnimationFrame(() => listRegion.current?.focus());
            }}
            onDetails={() => setDetails(true)}
            onUnread={() => dispatch({ type: "unread", id: conversation.id })}
            onClear={() =>
              confirm({
                title: "Clear local conversation history?",
                description: `This clears the sample messages with ${conversation.contact} in this preview only. Your draft is kept. Nothing is deleted remotely.`,
                confirmText: "Clear local history",
                variant: "danger",
                onConfirm: () => dispatch({ type: "clear", id: conversation.id }),
              })
            }
          />
          <VendorMessageComposer
            key={conversation.id}
            draft={state.drafts[conversation.id] ?? { text: "", files: [] }}
            onText={(text) => dispatch({ type: "draft", id: conversation.id, text })}
            onFiles={(files) => dispatch({ type: "files", id: conversation.id, files })}
            onSend={(messageId, text, files) =>
              dispatch({
                type: "send",
                id: conversation.id,
                messageId,
                text,
                files,
                time: new Date().toLocaleTimeString("en-US", {
                  hour: "2-digit",
                  minute: "2-digit",
                }),
              })
            }
          />
        </div>
      </div>
      <p className="mt-3 text-xs leading-5 text-[#B8C1D1]">
        Local preview only: no messages are delivered. Sample PDFs download as labeled
        placeholders because the original files were not supplied.
      </p>
      <p role="status" className="mt-2 text-sm text-[#2ED3D1]">
        {state.status}
      </p>
      {details && (
        <VendorHomeDialog
          title="Conversation details"
          onClose={() => setDetails(false)}
        >
          <dl className="space-y-4 text-sm">
            <div>
              <dt className="mb-1 text-[#B8C1D1]">Business</dt>
              <dd>{conversation.name}</dd>
            </div>
            <div>
              <dt className="mb-1 text-[#B8C1D1]">Contact</dt>
              <dd>{conversation.contact}</dd>
            </div>
            <div>
              <dt className="mb-1 text-[#B8C1D1]">Sample presence</dt>
              <dd>{conversation.active ? "Active now" : "Offline"}</dd>
            </div>
            <div>
              <dt className="mb-1 text-[#B8C1D1]">Messages in this preview</dt>
              <dd>{conversation.messages.length}</dd>
            </div>
          </dl>
          <p className="mt-5 text-xs leading-5 text-[#B8C1D1]">
            This is a sample Vendor conversation. No verified phone number or contact
            endpoint is supplied.
          </p>
        </VendorHomeDialog>
      )}
      {confirmationProps && <ConfirmationDialog {...confirmationProps} />}
    </section>
  );
}
