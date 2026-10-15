import { Download, FileText, MoreVertical } from "lucide-react";
import { useEffect, useRef } from "react";

import { FilePreview } from "@/components/forms/FileUpload/FilePreview";
import { MessageComposer } from "@/features/customer/components/message/MessageComposer";
import type { MessageEntry } from "@/features/customer/data/message.data";
import { formatFileSize } from "@/utils/files/formatFileSize";

export function MessageThread({
  name,
  online,
  isReference,
  entries,
  onPreview,
  onOptions,
  onAttachment,
}: {
  name: string;
  online: boolean;
  isReference: boolean;
  entries: MessageEntry[];
  onPreview: (body: string, files: File[]) => void;
  onOptions: () => void;
  onAttachment: (name: string) => void;
}) {
  const historyRef = useRef<HTMLDivElement>(null);
  const lastId = entries.at(-1)?.id;
  const lastIsLocal = entries.at(-1)?.local === true;
  useEffect(() => {
    const history = historyRef.current;
    if (history) history.scrollTop = lastIsLocal ? history.scrollHeight : 0;
  }, [lastId, lastIsLocal]);
  return (
    <section aria-labelledby="message-thread-title" className="message-thread">
      <header className="message-thread-header">
        <span
          aria-hidden="true"
          className={isReference ? "message-emily-avatar" : "message-empty-avatar"}
        >
          {isReference ? "ER" : null}
        </span>
        <div className="min-w-0 flex-1">
          <h2
            className="truncate text-lg leading-6 font-medium"
            id="message-thread-title"
          >
            {name}
          </h2>
          <p className="text-xs leading-4">
            {online ? "Active now" : "Offline"}
            <span className="sr-only"> (sample status)</span>
          </p>
        </div>
        <button
          aria-label="Conversation preview options"
          className="message-icon-button"
          onClick={onOptions}
          type="button"
        >
          <MoreVertical aria-hidden="true" size={20} />
        </button>
      </header>
      <div
        aria-label={`Sample message history with ${name}`}
        className="message-history"
        ref={historyRef}
        tabIndex={0}
      >
        {isReference && (
          <div className="message-history-tail">
            <div aria-hidden="true" />
            <p className="message-time">
              10:23 AM
              <span className="sr-only">
                : Earlier message text is outside the supplied reference.
              </span>
            </p>
          </div>
        )}
        <ol className="message-entries">
          {entries.map((entry) => (
            <li
              className={`message-entry message-entry--${entry.direction}`}
              key={entry.id}
            >
              <div className="message-bubble">
                {entry.local && (
                  <span className="mb-1 block text-xs font-semibold">
                    Local preview - not sent
                  </span>
                )}
                <p className="whitespace-pre-wrap">{entry.body}</p>
                {entry.attachments && (
                  <ul className="message-attachments">
                    {entry.attachments.map((attachment) => (
                      <li key={attachment.name}>
                        <button
                          aria-label={`${attachment.name}, ${attachment.size}, download preview; file not supplied`}
                          className="message-attachment"
                          onClick={() => onAttachment(attachment.name)}
                          type="button"
                        >
                          <span aria-hidden="true" className="message-file-icon">
                            <FileText size={20} />
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block truncate">{attachment.name}</span>
                            <span className="block text-left text-xs text-white/70">
                              {attachment.size}
                            </span>
                          </span>
                          <Download aria-hidden="true" className="shrink-0" size={18} />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
                {entry.localFiles && (
                  <ul className="mt-3 space-y-2">
                    {entry.localFiles.map((file, index) => (
                      <li
                        className="flex items-center gap-3 rounded-xl bg-white/10 p-3"
                        key={index}
                      >
                        <FilePreview file={file} />
                        <span className="min-w-0 break-words">
                          <span className="block">{file.name}</span>
                          <span className="text-xs">
                            {formatFileSize(file.size)} - local file preview
                          </span>
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <p className="message-time">{entry.time}</p>
            </li>
          ))}
        </ol>
      </div>
      <MessageComposer onPreview={onPreview} />
    </section>
  );
}
