import { ArrowLeft, MoreVertical } from "lucide-react";
import { useEffect, useRef } from "react";
import { useMessageScroll } from "@/features/messaging/hooks/useMessageScroll";
import type {
  ConversationRow,
  MessageRow,
} from "@/features/messaging/types/messaging.types";
import { MessageBody } from "@/features/messaging/components/MessageControls";
export function VendorMessageThread({
  conversation,
  messages,
  mobileOpen,
  onBack,
  onDetails,
  onUnavailable,
}: {
  conversation: ConversationRow;
  messages: MessageRow[];
  mobileOpen: boolean;
  onBack: () => void;
  onDetails: () => void;
  onUnavailable: () => void;
}) {
  const title = useRef<HTMLHeadingElement>(null);
  const transcript = useMessageScroll(messages);
  const menu = useRef<HTMLDetailsElement>(null);
  useEffect(() => {
    if (mobileOpen) title.current?.focus();
  }, [conversation.id, mobileOpen]);
  const closeMenu = () => {
    if (menu.current) {
      menu.current.open = false;
      menu.current.querySelector("summary")?.focus();
    }
  };
  return (
    <>
      <header className="vendor-message-thread-header">
        <button
          className="vendor-message-mobile-back"
          type="button"
          aria-label="Back to conversations"
          onClick={onBack}
        >
          <ArrowLeft size={20} />
        </button>
        <span className="vendor-message-contact-avatar" aria-hidden="true">
          {conversation.avatarUrl ? (
            <img
              src={conversation.avatarUrl}
              alt=""
              className="size-full rounded-full object-cover"
            />
          ) : (
            conversation.name.slice(0, 2)
          )}
        </span>
        <div className="min-w-0 flex-1">
          <h2 ref={title} tabIndex={-1} className="truncate text-lg outline-none">
            {conversation.name}
          </h2>
          <p className="text-xs">{conversation.status}</p>
        </div>
        <details
          ref={menu}
          className="vendor-message-menu"
          onKeyDown={(e) => {
            if (e.key === "Escape") {
              e.stopPropagation();
              closeMenu();
            }
          }}
          onBlur={(e) => {
            if (!e.currentTarget.contains(e.relatedTarget) && menu.current)
              menu.current.open = false;
          }}
        >
          <summary aria-label="Conversation options">
            <MoreVertical size={20} />
          </summary>
          <div>
            {[
              ["Conversation details", onDetails],
              ["Mark as unread (unavailable)", onUnavailable],
              ["Clear history (unavailable)", onUnavailable],
            ].map(([label, handler]) => (
              <button
                type="button"
                key={String(label)}
                onClick={() => {
                  closeMenu();
                  if (typeof handler === "function") handler();
                }}
              >
                {String(label)}
              </button>
            ))}
          </div>
        </details>
      </header>
      <div
        ref={transcript}
        className="vendor-message-transcript"
        aria-label={`Conversation with ${conversation.name}`}
        tabIndex={0}
      >
        {!messages.length && (
          <p>No messages yet. Write a message below when sending is available.</p>
        )}
        <ol className="space-y-4">
          {messages.map((m) => (
            <li
              key={m.id}
              className={`vendor-message-row vendor-message-row--${m.direction === "outgoing" ? "out" : "in"}`}
            >
              <div className="vendor-message-bubble">
                <MessageBody message={m} />
              </div>
              <p className="vendor-message-time">{m.time}</p>
            </li>
          ))}
        </ol>
      </div>
    </>
  );
}
