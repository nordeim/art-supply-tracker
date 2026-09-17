"use client";

/**
 * Studio Chat — the community message wall with 5-second polling.
 *
 * Mirrors the live app: the chat card (bg-[#120724], ast_blue/20 border)
 * carries the "STUDIO CHAT" header, the scrollable message list (plain
 * purple avatar circles — no initials, matching production), and the
 * composer. Sends go through a Server Action; polling pauses when the tab
 * is hidden so background tabs stay quiet. The send button is disabled
 * until input is non-empty (exactly like the original).
 */
import { useEffect, useRef, useState, useTransition } from "react";

import { listChatMessages, sendChatMessage } from "@/actions/studio";
import type { ChatMessageDto } from "@/lib/dto";

const POLL_INTERVAL_MS = 5_000;

function formatTimestamp(iso: string): string {
  const date = new Date(iso);
  return date.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function StudioChat({ initialMessages }: { initialMessages: ChatMessageDto[] }) {
  const [messages, setMessages] = useState<ChatMessageDto[]>(initialMessages);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const rootRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const stickToBottom = useRef(true);

  // Poll while the tab is visible; skip while hidden (no wasted action calls).
  // The shell renders this component twice (desktop column + mobile drawer,
  // mirroring the live DOM) — the offsetParent check skips the instance the
  // current viewport is not displaying (Tailwind's md: display rules), so
  // only one instance polls per viewport.
  useEffect(() => {
    const interval = setInterval(() => {
      if (document.visibilityState !== "visible") return;
      const root = rootRef.current;
      if (root && root.offsetParent === null) return; // hidden by breakpoint
      startTransition(async () => {
        const result = await listChatMessages();
        if (result.ok) {
          setMessages(result.data);
        }
        // Poll failures are non-fatal — the next tick retries; surfacing a
        // transient error banner every 5s would be noisier than the gap.
      });
    }, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, []);

  // Keep the view pinned to the newest message unless the reader scrolled up.
  useEffect(() => {
    const list = listRef.current;
    if (!list || !stickToBottom.current) return;
    list.scrollTop = list.scrollHeight;
  }, [messages]);

  function onScroll() {
    const list = listRef.current;
    if (!list) return;
    stickToBottom.current =
      list.scrollHeight - list.scrollTop - list.clientHeight < 40;
  }

  function onSend(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const text = draft.trim();
    if (!text || pending) return;
    setError(null);
    startTransition(async () => {
      const result = await sendChatMessage({ message: text });
      if (!result.ok) {
        setError(result.error.message);
        return;
      }
      setMessages((list) => [...list, result.data]);
      setDraft("");
      stickToBottom.current = true;
    });
  }

  return (
    <div
      ref={rootRef}
      className="flex h-full min-w-0 flex-col overflow-hidden rounded-xl border border-ast-blue/20 bg-[#120724] p-4"
    >
      <h2 className="mb-4 text-sm font-bold text-ast-lavender/70">STUDIO CHAT</h2>

      <div
        ref={listRef}
        onScroll={onScroll}
        role="log"
        aria-label="Studio chat messages"
        className="mb-4 flex-1 space-y-3 overflow-y-auto scrollbar-studio"
      >
        {messages.length === 0 && (
          <p className="text-xs text-ast-body/50">No messages yet.</p>
        )}
        {messages.map((message) => (
          <article key={message.id} className="flex gap-2">
            <div
              aria-hidden="true"
              className="h-6 w-6 shrink-0 rounded-full bg-ast-purple/30"
            />
            <div className="min-w-0">
              <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                <p className="text-xs font-bold text-ast-turquoise">{message.username}</p>
                <p className="truncate text-[10px] text-ast-body/45">{message.email}</p>
              </div>
              <p className="break-words text-xs text-ast-body/80">{message.message}</p>
              <p className="mt-0.5 text-[10px] text-ast-body/40">
                {formatTimestamp(message.createdAt)}
              </p>
            </div>
          </article>
        ))}
      </div>

      {error && (
        <p role="alert" className="mb-2 text-xs text-ast-coral">
          {error}
        </p>
      )}

      <form onSubmit={onSend} className="flex w-full min-w-0 gap-2">
        <input
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          maxLength={500}
          placeholder="Message..."
          className="min-w-0 flex-1 rounded-lg border border-ast-lavender/20 bg-ast-deep/70 px-3 py-2 text-xs text-white placeholder:text-white/40 focus:border-ast-turquoise focus:outline-none"
        />
        <button
          type="submit"
          disabled={draft.trim().length === 0 || pending}
          className="shrink-0 rounded-lg border border-ast-turquoise bg-ast-turquoise/20 px-3 py-2 text-xs font-medium text-ast-turquoise transition hover:bg-ast-turquoise/30 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Send
        </button>
      </form>
    </div>
  );
}
