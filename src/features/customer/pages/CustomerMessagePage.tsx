import { useState } from "react";

import { Modal } from "@/components/overlays/Modal/Modal";
import { Button } from "@/components/ui/Button";
import { MessageConversationList } from "@/features/customer/components/message/MessageConversationList";
import { MessageThread } from "@/features/customer/components/message/MessageThread";
import {
  messageConversations,
  referenceConversation,
  referenceMessages,
  type MessageEntry,
} from "@/features/customer/data/message.data";
import "@/features/customer/components/message/message.css";

export default function CustomerMessagePage() {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<{
    id: string;
    name: string;
    online: boolean;
  }>(referenceConversation);
  const [readIds, setReadIds] = useState<string[]>([]);
  const [localEntries, setLocalEntries] = useState<Record<string, MessageEntry[]>>({});
  const [preview, setPreview] = useState<string | null>(null);
  const [status, setStatus] = useState("");
  const isReference = selected.id === referenceConversation.id;
  const conversation = messageConversations.find((item) => item.id === selected.id);
  const initialEntries: MessageEntry[] = isReference
    ? referenceMessages
    : conversation
      ? [
          {
            id: `${conversation.id}-sample`,
            direction: "incoming",
            body: conversation.preview,
            time: conversation.age,
          },
        ]
      : [];
  const entries = [...initialEntries, ...(localEntries[selected.id] ?? [])];

  return (
    <div className="customer-message-page">
      <h1 className="sr-only">Message - static customer preview</h1>
      <div className="message-workspace">
        <MessageConversationList
          conversations={messageConversations.filter((item) =>
            `${item.name} ${item.preview}`
              .toLowerCase()
              .includes(search.trim().toLowerCase()),
          )}
          onSearch={setSearch}
          onSelect={(item) => {
            setSelected(item);
            setReadIds((current) =>
              current.includes(item.id) ? current : [...current, item.id],
            );
            setStatus(
              `Opened ${item.name}'s sample conversation. Only the supplied list excerpt is available.`,
            );
          }}
          readIds={readIds}
          search={search}
          selectedId={selected.id}
        />
        <MessageThread
          entries={entries}
          isReference={isReference}
          key={selected.id}
          name={selected.name}
          onAttachment={setPreview}
          onOptions={() => setPreview("options")}
          onPreview={(body, files) => {
            setLocalEntries((current) => ({
              ...current,
              [selected.id]: [
                ...(current[selected.id] ?? []),
                {
                  id: crypto.randomUUID(),
                  direction: "outgoing",
                  body,
                  time: "Local preview",
                  local: true,
                  localFiles: files,
                },
              ],
            }));
            setStatus(
              "Message added to this tab's local preview. Nothing was sent or delivered.",
            );
          }}
          online={selected.online}
        />
      </div>
      <p className="message-preview-note" role="status">
        {status ||
          "Static preview: sample conversations and activity. Messages and files stay in this tab; nothing is sent."}
      </p>
      <Modal
        isOpen={preview !== null}
        onClose={() => setPreview(null)}
        titleId="message-preview-title"
      >
        <div className="space-y-4 overflow-y-auto p-6 pt-12">
          <h2 className="text-xl font-semibold" id="message-preview-title">
            {preview === "options" ? "Conversation preview" : "Attachment unavailable"}
          </h2>
          <p className="text-sm leading-6 text-[var(--text-muted)]">
            {preview === "options"
              ? "The design pairs food-truck conversation rows with an Emily Rodriguez sample chat. Selecting a row opens its supplied excerpt. Messaging, presence, and unread activity are local samples; no account is updated."
              : `${preview ?? "This file"} is shown in the supplied design, but the actual PDF was not provided. Downloading it requires the original asset or later backend integration.`}
          </p>
          {preview === "options" && (
            <Button
              onClick={() => {
                setSelected(referenceConversation);
                setPreview(null);
                setStatus(
                  "Reference conversation restored. Local message previews are retained until reload.",
                );
              }}
              variant="primary"
            >
              Open Emily reference conversation
            </Button>
          )}
          <Button onClick={() => setPreview(null)}>Close preview</Button>
        </div>
      </Modal>
    </div>
  );
}
