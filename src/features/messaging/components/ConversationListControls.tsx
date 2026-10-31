import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { ErrorState } from "@/components/states/ErrorState";
import type { MessagingWorkspace } from "../hooks/useMessagingWorkspace";
import type { MessagingScope } from "../types/messaging.types";
import { RecipientDialog } from "./RecipientDialog";
import { RealtimeStatus } from "./RealtimeStatus";
export function ConversationListControls({
  workspace: w,
  scope,
}: {
  workspace: MessagingWorkspace;
  scope: MessagingScope;
}) {
  const [creating, setCreating] = useState(false);
  return (
    <div className="space-y-2 p-3 text-sm">
      <RealtimeStatus realtime={w.realtime} />
      <div className="flex flex-wrap gap-2">
        <Button
          aria-pressed={w.kind === "conversations"}
          onClick={() => w.setKind("conversations")}
        >
          Conversations
        </Button>
        <Button
          aria-pressed={w.kind === "requests"}
          onClick={() => w.setKind("requests")}
        >
          Requests
        </Button>
        <Button onClick={() => setCreating(true)}>New message</Button>
      </div>
      <p>Search filters loaded rows only. Find recipients in New message.</p>
      {w.list.isFetching && (
        <p role="status">
          {w.list.currentData ? "Refreshing conversations…" : "Loading conversations…"}
        </p>
      )}
      {w.list.isError && <ErrorState onRetry={() => void w.list.refetch()} />}
      <Button disabled={w.list.isFetching} onClick={() => void w.list.refetch()}>
        Refresh list
      </Button>
      {w.list.hasNextPage && (
        <Button
          disabled={w.list.isFetching}
          onClick={() => void w.list.fetchNextPage()}
        >
          Load more conversations
        </Button>
      )}
      {creating && (
        <RecipientDialog
          scope={scope}
          onClose={() => setCreating(false)}
          onCreated={(id) => {
            w.select(id);
            setCreating(false);
          }}
        />
      )}
    </div>
  );
}
