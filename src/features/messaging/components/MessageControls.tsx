import { useState } from "react";
import { Modal } from "@/components/overlays/Modal/Modal";
import { Button } from "@/components/ui/Button";
import type { MessagingWorkspace } from "../hooks/useMessagingWorkspace";
import type { MessageRow } from "../types/messaging.types";
export function MessageBody({ message }: { message: MessageRow }) {
  return (
    <>
      <span className="sr-only">{message.sender}: </span>
      <p className="whitespace-pre-wrap">{message.body}</p>
      {message.attachmentUrl ? (
        <a
          className="message-attachment mt-3 underline"
          href={message.attachmentUrl}
          target="_blank"
          rel="noopener noreferrer"
        >
          Open {message.messageType.toLowerCase()} attachment
        </a>
      ) : ["IMAGE", "FILE"].includes(message.messageType) ? (
        <p>Attachment unavailable</p>
      ) : null}
    </>
  );
}
export function UnsupportedMessaging({ onClose }: { onClose: () => void }) {
  return (
    <Modal isOpen onClose={onClose} titleId="messaging-support-title">
      <div className="space-y-4 p-6 pt-12">
        <h2 id="messaging-support-title" className="text-xl font-semibold">
          Messaging availability
        </h2>
        <p>
          Text messages are supported. Attachment uploads, clearing server history,
          marking unread and online presence are unavailable. Realtime updates apply to
          the selected conversation when connected; Refresh remains available.
        </p>
      </div>
    </Modal>
  );
}
export function ConversationActions({
  workspace: w,
}: {
  workspace: MessagingWorkspace;
}) {
  const [unsupported, setUnsupported] = useState(false);
  return (
    <div className="flex flex-wrap items-center gap-2 p-3 text-sm">
      {w.incomingRequest && (
        <>
          <Button disabled={w.resolving} onClick={() => void w.resolve("accept")}>
            Accept request
          </Button>
          <Button disabled={w.resolving} onClick={() => void w.resolve("decline")}>
            Decline request
          </Button>
        </>
      )}
      {w.conversation && (
        <span>
          {w.conversation.isClosed ? "Closed" : w.conversation.directStatus}
          {w.conversation.directStatus === "REQUESTED" && !w.incomingRequest
            ? " — one initial message until accepted"
            : ""}
        </span>
      )}
      <Button
        disabled={w.detail.isFetching || w.history.isFetching}
        onClick={() => {
          if (!w.detail.isUninitialized) void w.detail.refetch();
          if (!w.history.isUninitialized) void w.history.refetch();
        }}
      >
        Refresh thread
      </Button>
      <Button onClick={() => setUnsupported(true)}>Conversation options</Button>
      {w.history.hasNextPage && (
        <Button
          disabled={w.history.isFetching}
          onClick={() => void w.history.fetchNextPage()}
        >
          Load earlier messages
        </Button>
      )}
      {w.readState.isError && (
        <Button disabled={w.readState.isLoading} onClick={w.retryRead}>
          Retry marking read
        </Button>
      )}
      {unsupported && <UnsupportedMessaging onClose={() => setUnsupported(false)} />}
    </div>
  );
}
