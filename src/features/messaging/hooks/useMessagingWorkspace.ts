import { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router";
import { useStore } from "react-redux";
import { skipToken } from "@reduxjs/toolkit/query";
import { z } from "zod";
import { toast } from "sonner";
import type { RootState } from "@/app/store";
import { useAppSelector } from "@/app/hooks";
import { selectCurrentRole } from "@/features/auth/store/auth.selectors";
import {
  messagingAllowed,
  useGetConversationsInfiniteQuery,
  useGetConversationQuery,
  useGetMessagesInfiniteQuery,
  useResolveConversationRequestMutation,
  useSendTextMessageMutation,
  useMarkConversationReadMutation,
} from "../api/messaging.api";
import {
  canCompose,
  canMarkRead,
  confirmedDraft,
  conversationRow,
  editDraft,
  orderedMessages,
  submitMessageDraft,
  type Draft,
} from "../utils/messagingAdapters";
import { normalizeApiError } from "@/utils/errors/normalizeApiError";
import type { MessagingScope } from "../types/messaging.types";

export function useMessagingIdentity() {
  const allowed = useAppSelector(messagingAllowed);
  const sessionId = useAppSelector((s) => s.auth.sessionId) ?? "";
  const role = useAppSelector(selectCurrentRole) ?? "";
  const viewer = useAppSelector((s) => s.auth.user?.id) ?? "";
  return {
    allowed,
    scope: { sessionId, role },
    viewer,
    key: `${sessionId}:${role}:${viewer}`,
  };
}
export const chatFailure = (error: unknown) => normalizeApiError(error).message;
export function useMessagingWorkspace(scope: MessagingScope, viewer: string) {
  const store = useStore<RootState>();
  const [params, setParams] = useSearchParams();
  const rawId = params.get("conversation") ?? "";
  const selectedId = z.uuid().safeParse(rawId).success ? rawId : "";
  const [kind, setKind] = useState<"conversations" | "requests">("conversations");
  const [search, setSearch] = useState("");
  const [drafts, setDrafts] = useState<Record<string, Draft>>({});
  const draftsRef = useRef(drafts);
  const list = useGetConversationsInfiniteQuery({ ...scope, kind });
  const arg = selectedId ? { ...scope, conversationId: selectedId } : skipToken;
  const detail = useGetConversationQuery(arg);
  const forbidden =
    detail.isError &&
    "status" in detail.error &&
    [401, 403, 404].includes(Number(detail.error.status));
  const conversation = !forbidden ? detail.currentData : undefined;
  const history = useGetMessagesInfiniteQuery(conversation ? arg : skipToken);
  const [sendMutation, sendState] = useSendTextMessageMutation();
  const [resolveMutation, resolveState] = useResolveConversationRequestMutation();
  const [readMutation, readState] = useMarkConversationReadMutation();
  const pendingSend = useRef(new Set<string>());
  const pendingResolve = useRef(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [visible, setVisible] = useState(
    () => typeof document !== "undefined" && document.visibilityState === "visible",
  );
  const threadElement = useRef<HTMLDivElement>(null);
  const attachThread = useCallback((node: HTMLDivElement | null) => {
    threadElement.current = node;
  }, []);
  const [readAttempt, setReadAttempt] = useState(0);
  const readKey = useRef("");
  const current = useCallback(() => {
    const s = store.getState();
    return (
      messagingAllowed(s) &&
      s.auth.sessionId === scope.sessionId &&
      selectCurrentRole(s) === scope.role &&
      s.auth.user?.id === viewer
    );
  }, [store, scope.sessionId, scope.role, viewer]);
  useEffect(() => {
    const update = () => setVisible(document.visibilityState === "visible");
    document.addEventListener("visibilitychange", update);
    return () => document.removeEventListener("visibilitychange", update);
  }, []);
  const latest = history.currentData?.pages[0]?.items[0]?.id ?? "empty";
  useEffect(() => {
    const node = threadElement.current;
    const latestLoaded =
      Boolean(history.currentData) &&
      (!conversation?.lastMessage ||
        history.currentData!.pages[0]?.items.some(
          (m) => m.id === conversation.lastMessage?.id,
        ));
    if (
      !current() ||
      !node ||
      node.getClientRects().length === 0 ||
      !canMarkRead(visible, conversation, viewer, latestLoaded && !history.isError)
    )
      return;
    const key = `${selectedId}:${latest}:${conversation?.unreadCount}:${readAttempt}`;
    if (readKey.current === key) return;
    readKey.current = key;
    void readMutation({ ...scope, conversationId: selectedId });
  }, [
    conversation,
    selectedId,
    latest,
    history.currentData,
    history.isError,
    visible,
    readAttempt,
    readMutation,
    scope,
    viewer,
    current,
  ]);
  function writeDraft(id: string, value: Draft) {
    draftsRef.current = { ...draftsRef.current, [id]: value };
    setDrafts(draftsRef.current);
  }
  function onText(text: string) {
    writeDraft(selectedId, editDraft(draftsRef.current[selectedId], text));
  }
  async function send() {
    const submitted = draftsRef.current[selectedId];
    if (
      !conversation ||
      !submitted ||
      !canCompose(conversation, viewer) ||
      pendingSend.current.has(selectedId)
    )
      return;
    const id = selectedId;
    pendingSend.current.add(id);
    setErrors((e) => ({ ...e, [id]: "" }));
    try {
      await submitMessageDraft({
        send: () =>
          sendMutation({
            ...scope,
            conversationId: id,
            body: { messageType: "TEXT", content: submitted.text },
          }).unwrap(),
        isCurrent: current,
        onConfirmed: () => {
          const next = confirmedDraft(draftsRef.current[id], submitted);
          if (next) writeDraft(id, next);
        },
        onFailure: (e) => {
          const message = `${chatFailure(e)} Sending is unconfirmed. Refresh this conversation before explicitly retrying; your draft is kept.`;
          setErrors((e) => ({ ...e, [id]: message }));
          toast.error(message);
        },
      });
    } finally {
      pendingSend.current.delete(id);
    }
  }
  async function resolve(action: "accept" | "decline") {
    if (
      !conversation ||
      conversation.type !== "DIRECT" ||
      conversation.directStatus !== "REQUESTED" ||
      conversation.requestedRecipientId !== viewer ||
      pendingResolve.current
    )
      return;
    pendingResolve.current = true;
    try {
      await resolveMutation({ ...scope, conversationId: selectedId, action }).unwrap();
    } catch (e) {
      if (current()) toast.error(chatFailure(e));
    } finally {
      pendingResolve.current = false;
    }
  }
  const listDenied =
    list.isError &&
    "status" in list.error &&
    [401, 403].includes(Number(list.error.status));
  const rows = [
    ...new Map(
      (listDenied ? [] : (list.currentData?.pages.flatMap((p) => p.items) ?? [])).map(
        (c) => [c.id, c],
      ),
    ).values(),
  ]
    .map(conversationRow)
    .filter((c) =>
      `${c.name} ${c.preview}`.toLowerCase().includes(search.trim().toLowerCase()),
    );
  const messageDenied =
    history.isError &&
    "status" in history.error &&
    [401, 403, 404].includes(Number(history.error.status));
  return {
    rows,
    list,
    kind,
    setKind,
    search,
    setSearch,
    selectedId,
    rawId,
    select: (id: string) => {
      setParams(
        (p) => {
          const next = new URLSearchParams(p);
          next.set("conversation", id);
          return next;
        },
        { preventScrollReset: true },
      );
    },
    clearSelection: () =>
      setParams(
        (p) => {
          const next = new URLSearchParams(p);
          next.delete("conversation");
          return next;
        },
        { preventScrollReset: true },
      ),
    detail,
    conversation: messageDenied ? undefined : conversation,
    history,
    messages: messageDenied
      ? []
      : orderedMessages(
          history.currentData?.pages.flatMap((p) => p.items) ?? [],
          viewer,
        ),
    draft: drafts[selectedId] ?? { text: "", revision: 0 },
    onText,
    send,
    sending: sendState.isLoading,
    resolve,
    resolving: resolveState.isLoading,
    incomingRequest:
      conversation?.type === "DIRECT" &&
      conversation.directStatus === "REQUESTED" &&
      conversation.requestedRecipientId === viewer,
    canSend: Boolean(
      conversation &&
      !messageDenied &&
      !detail.isFetching &&
      canCompose(conversation, viewer),
    ),
    error: errors[selectedId] ?? "",
    readState: {
      ...readState,
      isError:
        readState.isError && readState.originalArgs?.conversationId === selectedId,
    },
    retryRead: () => setReadAttempt((v) => v + 1),
    attachThread,
  };
}
export type MessagingWorkspace = ReturnType<typeof useMessagingWorkspace>;
