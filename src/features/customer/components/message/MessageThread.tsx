import { MoreVertical } from "lucide-react";
import { useState } from "react";
import { useMessageScroll } from "@/features/messaging/hooks/useMessageScroll";
import { MessageComposer } from "./MessageComposer";
import type {
  ConversationRow,
  MessageRow,
} from "@/features/messaging/types/messaging.types";
import {
  MessageBody,
  UnsupportedMessaging,
} from "@/features/messaging/components/MessageControls";
import type { TextComposerProps } from "@/features/messaging/components/TextComposer";
export function MessageThread({
  conversation,
  entries,
  composer,
}: {
  conversation: ConversationRow;
  entries: MessageRow[];
  composer: TextComposerProps;
}) {
  const [options, setOptions] = useState(false);
  const history = useMessageScroll(entries);
  return (
    <section
      aria-label={`Conversation with ${conversation.name}`}
      className="message-thread"
    >
      <header className="message-thread-header">
        <span aria-hidden="true" className="message-empty-avatar">
          {conversation.avatarUrl && (
            <img
              src={conversation.avatarUrl}
              alt=""
              className="size-full rounded-full object-cover"
            />
          )}
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="truncate text-lg leading-6 font-medium">
            {conversation.name}
          </h2>
          <p className="text-xs leading-4">{conversation.status}</p>
        </div>
        <button
          aria-label="Conversation options"
          className="message-icon-button"
          onClick={() => setOptions(true)}
          type="button"
        >
          <MoreVertical size={20} />
        </button>
      </header>
      <div
        ref={history}
        aria-label={`Message history with ${conversation.name}`}
        className="message-history"
        tabIndex={0}
      >
        {!entries.length && <p>No messages yet.</p>}
        <ol className="message-entries">
          {entries.map((entry) => (
            <li
              className={`message-entry message-entry--${entry.direction}`}
              key={entry.id}
            >
              <div className="message-bubble">
                <MessageBody message={entry} />
              </div>
              <p className="message-time">{entry.time}</p>
            </li>
          ))}
        </ol>
      </div>
      <MessageComposer {...composer} />
      {options && <UnsupportedMessaging onClose={() => setOptions(false)} />}
    </section>
  );
}
