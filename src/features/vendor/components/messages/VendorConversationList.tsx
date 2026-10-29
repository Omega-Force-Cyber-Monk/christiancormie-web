import { Search, X } from "lucide-react";
import { NoResultsState } from "@/components/states/NoResultsState";
import type { ConversationRow } from "@/features/messaging/types/messaging.types";
export function VendorConversationList({
  conversations,
  selectedId,
  query,
  onQuery,
  onSelect,
}: {
  conversations: ConversationRow[];
  selectedId: string;
  query: string;
  onQuery: (value: string) => void;
  onSelect: (id: string) => void;
}) {
  return (
    <aside className="vendor-conversation-list" aria-label="Conversations">
      <h1 className="sr-only">Vendor messages</h1>
      <div className="vendor-conversation-search">
        <Search size={18} aria-hidden="true" />
        <input
          aria-label="Filter loaded conversations"
          type="search"
          value={query}
          placeholder="Filter loaded conversations..."
          onChange={(e) => onQuery(e.target.value)}
        />
        {query && (
          <button
            type="button"
            aria-label="Clear conversation search"
            onClick={() => onQuery("")}
          >
            <X size={17} />
          </button>
        )}
      </div>
      {query && (
        <p className="mb-3 text-xs text-[#B8C1D1]" role="status">
          {conversations.length} matching conversations
        </p>
      )}
      <ul className="space-y-2">
        {conversations.map((conversation, index) => (
          <li key={conversation.id}>
            <button
              className={`vendor-conversation-card ${conversation.unread ? "vendor-conversation-card--unread" : ""}`}
              type="button"
              aria-current={selectedId === conversation.id ? "true" : undefined}
              aria-label={`${conversation.name}, ${conversation.status}, conversation ${index + 1}${conversation.unread ? `, ${conversation.unread} unread` : ""}`}
              onClick={() => onSelect(conversation.id)}
            >
              <span className="vendor-conversation-avatar" aria-hidden="true">
                {conversation.avatarUrl && (
                  <img
                    src={conversation.avatarUrl}
                    alt=""
                    className="size-full rounded-full object-cover"
                  />
                )}
              </span>
              <span className="min-w-0 flex-1">
                <span className="mb-1 flex items-center gap-2">
                  <strong className="min-w-0 flex-1 truncate text-left text-lg font-semibold">
                    {conversation.name}
                  </strong>
                  <span className="shrink-0 text-xs text-[#B8C1D1]">
                    {conversation.age}
                  </span>
                </span>
                <span className="flex items-center gap-2">
                  <span className="min-w-0 flex-1 truncate text-left text-sm">
                    {conversation.preview}
                  </span>
                  {conversation.unread > 0 && (
                    <span className="vendor-conversation-unread">
                      {conversation.unread}
                    </span>
                  )}
                </span>
              </span>
            </button>
          </li>
        ))}
      </ul>
      {!conversations.length && <NoResultsState />}
    </aside>
  );
}
