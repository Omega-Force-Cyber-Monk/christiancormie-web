import { ArrowLeft, MoreVertical } from "lucide-react";
import { useEffect, useRef } from "react";
import { EmptyState } from "@/components/states/EmptyState";
import { VendorMessageAttachment } from "@/features/vendor/components/messages/VendorMessageAttachment";
import type { VendorConversation } from "@/features/vendor/types/messages.types";
export function VendorMessageThread({
  conversation,
  mobileOpen,
  onBack,
  onDetails,
  onUnread,
  onClear,
}: {
  conversation: VendorConversation;
  mobileOpen: boolean;
  onBack: () => void;
  onDetails: () => void;
  onUnread: () => void;
  onClear: () => void;
}) {
  const transcript = useRef<HTMLDivElement>(null);
  const title = useRef<HTMLHeadingElement>(null);
  const menu = useRef<HTMLDetailsElement>(null);
  useEffect(() => {
    if (transcript.current)
      transcript.current.scrollTop = transcript.current.scrollHeight;
  }, [conversation.id, conversation.messages.length]);
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
          {conversation.initials}
        </span>
        <div className="min-w-0 flex-1">
          <h2 ref={title} tabIndex={-1} className="truncate text-lg outline-none">
            {conversation.contact}
          </h2>
          <p className="text-xs">
            {conversation.active ? "Active now" : "Offline"}
            <span className="sr-only">, sample status</span>
          </p>
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
              ["Mark as unread", onUnread],
              ["Clear local history", onClear],
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
        aria-label={`Conversation with ${conversation.contact}`}
        tabIndex={0}
      >
        {conversation.messages.length ? (
          <ol className="space-y-4">
            {conversation.messages.map((message) => (
              <li
                key={message.id}
                className={`vendor-message-row vendor-message-row--${message.direction}`}
              >
                <div className="vendor-message-bubble">
                  {message.text && (
                    <p className="whitespace-pre-wrap">{message.text}</p>
                  )}
                  {message.attachments.length > 0 && (
                    <ul className="mt-4 space-y-2" aria-label="Message attachments">
                      {message.attachments.map((attachment) => (
                        <VendorMessageAttachment
                          key={attachment.id}
                          attachment={attachment}
                        />
                      ))}
                    </ul>
                  )}
                </div>
                <p className="vendor-message-time">
                  {message.time}
                  {message.local && <span> &middot; Local preview, not delivered</span>}
                </p>
              </li>
            ))}
          </ol>
        ) : (
          <EmptyState
            title="No messages"
            description="Write a message below to add it to this local preview."
          />
        )}
      </div>
    </>
  );
}
