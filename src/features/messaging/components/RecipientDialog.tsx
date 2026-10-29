import { useState } from "react";
import { Modal } from "@/components/overlays/Modal/Modal";
import { Button } from "@/components/ui/Button";
import { ErrorState } from "@/components/states/ErrorState";
import { useDebounce } from "@/hooks/useDebounce";
import { useGetMessageRecipientsQuery } from "../api/messaging.api";
import type { MessagingScope } from "../types/messaging.types";
import { StartConversationButton } from "./StartConversationButton";
export function RecipientDialog({
  scope,
  onClose,
  onCreated,
}: {
  scope: MessagingScope;
  onClose: () => void;
  onCreated: (id: string) => void;
}) {
  const [search, setSearch] = useState("");
  const [type, setType] = useState<"ALL" | "CUSTOMER" | "VENDOR">("ALL");
  const [offset, setOffset] = useState(0);
  const debounced = useDebounce(search);
  const q = useGetMessageRecipientsQuery({ ...scope, search: debounced, type, offset });
  return (
    <Modal isOpen onClose={onClose} titleId="recipient-dialog-title">
      <div className="space-y-4 overflow-y-auto p-6 pt-12">
        <h2 id="recipient-dialog-title" className="text-xl font-semibold">
          New conversation
        </h2>
        <input
          aria-label="Search recipients"
          type="search"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setOffset(0);
          }}
          className="w-full rounded-xl border p-3"
          placeholder="Search recipients…"
        />
        <select
          aria-label="Recipient account type"
          value={type}
          onChange={(e) => {
            setType(e.target.value as typeof type);
            setOffset(0);
          }}
        >
          <option value="ALL">All accounts</option>
          <option value="CUSTOMER">Customers</option>
          <option value="VENDOR">Vendors</option>
        </select>
        {q.isFetching && <p role="status">Loading recipients…</p>}
        {q.isError ? (
          <ErrorState onRetry={() => void q.refetch()} />
        ) : (
          search === debounced && (
            <ul>
              {q.currentData?.items.map(
                (u) =>
                  u && (
                    <li
                      key={u.id}
                      className="flex items-center justify-between gap-3 py-2"
                    >
                      <span>
                        {u.displayName || "Member"} · {u.accountType}
                      </span>
                      <StartConversationButton
                        target={{ participantUserId: u.id }}
                        onCreated={onCreated}
                      />
                    </li>
                  ),
              )}
            </ul>
          )
        )}
        {!q.isFetching && !q.isError && !q.currentData?.items.length && (
          <p>No recipients found.</p>
        )}
        <Button
          disabled={offset === 0 || q.isFetching}
          onClick={() => setOffset((v) => Math.max(0, v - 20))}
        >
          Previous recipients
        </Button>
        <Button
          disabled={
            q.isFetching ||
            q.isError ||
            q.currentData?.nextOffset == null ||
            search !== debounced
          }
          onClick={() => {
            if (q.currentData?.nextOffset != null) setOffset(q.currentData.nextOffset);
          }}
        >
          Next recipients
        </Button>
      </div>
    </Modal>
  );
}
