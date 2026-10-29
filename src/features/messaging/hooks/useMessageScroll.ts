import { useLayoutEffect, useRef } from "react";
import type { MessageRow } from "../types/messaging.types";
export function useMessageScroll(messages: MessageRow[]) {
  const element = useRef<HTMLDivElement>(null);
  const previous = useRef<{ first?: string; last?: string; height: number }>({
    height: 0,
  });
  const first = messages[0]?.id;
  const last = messages.at(-1)?.id;
  useLayoutEffect(() => {
    const node = element.current;
    if (!node) return;
    if (
      previous.current.last === last &&
      previous.current.first !== first &&
      previous.current.first
    )
      node.scrollTop += node.scrollHeight - previous.current.height;
    else if (previous.current.last !== last) node.scrollTop = node.scrollHeight;
    previous.current = { first, last, height: node.scrollHeight };
  }, [first, last]);
  return element;
}
