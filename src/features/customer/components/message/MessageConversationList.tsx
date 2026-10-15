import { Search } from "lucide-react";
import { useId } from "react";

import { NoResultsState } from "@/components/states/NoResultsState";
import type { MessageConversation } from "@/features/customer/data/message.data";

export function MessageConversationList({
  conversations,
  selectedId,
  readIds,
  search,
  onSearch,
  onSelect,
}: {
  conversations: MessageConversation[];
  selectedId: string;
  readIds: string[];
  search: string;
  onSearch: (value: string) => void;
  onSelect: (conversation: MessageConversation) => void;
}) {
  const searchId = useId();
  return (
    <section aria-label="Sample conversations" className="message-conversations">
      <div className="message-search">
        <label className="sr-only" htmlFor={searchId}>
          Search conversations
        </label>
        <Search aria-hidden="true" size={18} />
        <input
          autoComplete="off"
          id={searchId}
          onChange={(event) => onSearch(event.target.value)}
          placeholder="Search conversations..."
          type="search"
          value={search}
        />
      </div>
      {conversations.length ? (
        <ul className="message-conversation-list">
          {conversations.map((conversation) => {
            const unread = readIds.includes(conversation.id) ? 0 : conversation.unread;
            return (
              <li key={conversation.id}>
                <button
                  aria-current={selectedId === conversation.id ? "true" : undefined}
                  aria-label={`${conversation.name}, ${conversation.age}, ${unread} unread sample messages`}
                  className={`message-conversation ${unread ? "message-conversation--unread" : ""}`}
                  onClick={() => onSelect(conversation)}
                  type="button"
                >
                  <span aria-hidden="true" className="message-empty-avatar">
                    <span
                      className={
                        conversation.online ? "message-online" : "message-offline"
                      }
                    />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center justify-between gap-2">
                      <span className="truncate text-lg leading-[27px] font-semibold">
                        {conversation.name}
                      </span>
                      <span className="shrink-0 text-xs font-semibold text-[#B8C1D1]">
                        {conversation.age}
                      </span>
                    </span>
                    <span className="mt-1 flex min-w-0 items-center gap-2">
                      <span
                        className={`truncate text-sm leading-5 ${unread ? "font-semibold text-white" : "text-[#B8C1D1]"}`}
                      >
                        {conversation.preview}
                      </span>
                      {unread > 0 && (
                        <span aria-hidden="true" className="message-unread">
                          {unread}
                        </span>
                      )}
                    </span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      ) : (
        <div className="mt-6" role="status">
          <NoResultsState />
          <button
            className="mt-3 min-h-11 text-sm text-[#2ED3D1] underline focus-visible:outline"
            onClick={() => onSearch("")}
            type="button"
          >
            Clear search
          </button>
        </div>
      )}
    </section>
  );
}
