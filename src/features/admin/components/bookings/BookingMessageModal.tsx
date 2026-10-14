import { Clock, Send, Shield, User, X } from "lucide-react";
import type { KeyboardEvent } from "react";
import { useState } from "react";

import { Modal } from "@/components/overlays/Modal/Modal";
import type { MessageRecipient } from "@/features/admin/components/bookings/bookings.types";

type ChatMessage = {
  id: string;
  sender: string;
  role: "user" | "admin";
  text: string;
  timestamp: string;
};

type BookingMessageModalProps = {
  isOpen: boolean;
  onClose: () => void;
  recipient: MessageRecipient;
};

export function BookingMessageModal({
  isOpen,
  onClose,
  recipient,
}: BookingMessageModalProps) {
  const [inputMessage, setInputMessage] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  const handleSendMessage = () => {
    if (!inputMessage.trim()) return;

    setMessages((current) => [
      ...current,
      {
        id: Date.now().toString(),
        sender: "Admin",
        role: "admin",
        text: inputMessage.trim(),
        timestamp: new Date().toLocaleString("en-US", {
          month: "2-digit",
          day: "2-digit",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
        }),
      },
    ]);
    setInputMessage("");
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <Modal
      backdropClassName="bg-black/75 backdrop-blur-sm"
      isOpen={isOpen}
      onClose={onClose}
      panelClassName="relative flex max-h-[85vh] w-full max-w-xl flex-col overflow-hidden rounded-2xl border border-[#1e2638] bg-[#141a27] text-slate-200 shadow-2xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ff6542]"
      showCloseButton={false}
      titleId="booking-message-title"
    >
      <div className="flex items-start justify-between border-b border-[#1e2638] bg-[#111726]/80 p-6">
        <div>
          <div className="flex items-center gap-2">
            <User className="size-5 text-[#2dd4bf]" />
            <h2 className="text-lg font-semibold text-white" id="booking-message-title">
              Message with {recipient.name}
            </h2>
            <span className="rounded-full border border-[#2b374e] bg-[#1e2638] px-2.5 py-0.5 text-xs font-medium text-slate-300 capitalize">
              {recipient.type}
            </span>
          </div>
          <p className="mt-1 text-xs text-[#64748b]">
            Conversation ID: {recipient.conversationId}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <span className="rounded-full bg-[#ff6542] px-3 py-1 text-xs font-semibold text-white shadow-sm">
            Issue resolved
          </span>
          <button
            className="rounded-lg p-1.5 text-[#64748b] transition-colors hover:bg-[#1e2638] hover:text-white"
            onClick={onClose}
            type="button"
          >
            <X className="size-5" />
          </button>
        </div>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto bg-[#0f1420]/50 p-6">
        {messages.map((message) => (
          <div
            className={`flex flex-col ${
              message.role === "admin" ? "items-end" : "items-start"
            }`}
            key={message.id}
          >
            <div
              className={`max-w-[85%] space-y-2 rounded-2xl p-4 shadow-md sm:max-w-[75%] ${
                message.role === "admin"
                  ? "rounded-tr-xs bg-[#ff6542] text-white"
                  : "rounded-tl-xs border border-[#2b374e] bg-[#1c2436] text-slate-200"
              }`}
            >
              <div
                className={`flex items-center gap-1.5 text-xs ${
                  message.role === "admin"
                    ? "font-semibold text-orange-100"
                    : "font-medium text-slate-400"
                }`}
              >
                {message.role === "admin" ? (
                  <Shield className="size-3.5" />
                ) : (
                  <User className="size-3.5 text-slate-400" />
                )}
                <span>{message.sender}</span>
              </div>
              <p className="text-sm leading-relaxed whitespace-pre-wrap">
                {message.text}
              </p>
              <div
                className={`flex items-center gap-1 pt-1 text-[11px] ${
                  message.role === "admin" ? "text-orange-200" : "text-[#64748b]"
                }`}
              >
                <Clock className="size-3" />
                <span>{message.timestamp}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="space-y-2 border-t border-[#1e2638] bg-[#141a27] p-6">
        <div className="flex items-end gap-3">
          <textarea
            className="flex-1 resize-none rounded-xl border border-[#232d42] bg-[#182030] p-3.5 text-sm text-slate-100 placeholder-[#64748b] transition-colors focus:border-[#ff6542]/60 focus:outline-none"
            onChange={(event) => setInputMessage(event.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your message... (Press Enter to send)"
            rows={3}
            value={inputMessage}
          />
          <button
            className="flex h-[52px] cursor-pointer items-center gap-2 rounded-xl bg-[#ff6542] px-5 py-3.5 text-sm font-medium text-white shadow-md transition active:scale-95 hover:bg-[#ff5530]"
            onClick={handleSendMessage}
            type="button"
          >
            <Send className="size-4" />
            <span>Send</span>
          </button>
        </div>
        <p className="text-[11px] text-[#64748b]">
          Press Enter to send, Shift+Enter for new line
        </p>
      </div>
    </Modal>
  );
}
