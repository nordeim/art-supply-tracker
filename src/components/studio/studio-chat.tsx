"use client";

/**
 * Studio Chat — community message wall with 5-second polling.
 *
 * Mirrors the live app: message list (avatar initial, username, email,
 * timestamp) + composer. Sends go through a Server Action; polling pauses
 * when the tab is hidden so background tabs stay quiet. The send button is
 * disabled until input is non-empty (exactly like the original).
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

function avatarColor(username: string): string {
  // Stable per-username hue from the AST palette so repeat speakers stay
  // visually identifiable (the original assigns kimsart blue, kevbo33w green).
  const palette: Record<string, string> = {
    kimsart: "bg-blue-500/30 text-blue-300",
    kevbo33w: "bg-emerald-500/30 text-emerald-300",
    kevb033w: "bg-emerald-500/30 text-emerald-300",
  };
  return (
    palette[username] ?? "bg-ast-purple/40 text-ast-lavender"
  );
}

export function StudioChat({ initialMessages }: { initialMessages: ChatMessageDto[] }) {
  const [messages, setMessages] = useState<ChatMessageDto[]>(initialMessages);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const listRef = useRef<HTMLDivElement>(null);
  const stickToBottom = useRef(true);

  // Poll while the tab is visible; skip while hidden (no wasted action calls).
  useEffect(() => {
    const interval = setInterval(() => {
      if (document.visibilityState !== "visible") return;
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
    <div>
      <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-ast-lavender">
        Studio Chat
      </p>

      <div
        ref={listRef}
        onScroll={onScroll}
        role="log"
        aria-label="Studio chat messages"
        className="max-h-[420px] space-y-4 overflow-y-auto scrollbar-studio rounded-2xl border border-ast-purple/25 bg-[#0a0416]/60 p-3"
      >
        {messages.length === 0 && (
          <p className="py-6 text-center text-xs text-ast-faint">No messages yet.</p>
        )}
        {messages.map((message) => (
          <article key={message.id} className="flex gap-2.5">
            <span
              aria-hidden="true"
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold ${avatarColor(message.username)}`}
            >
              {message.username.charAt(0).toLowerCase()}
            </span>
            <div className="min-w-0 flex-1">
              <p className="flex flex-wrap items-baseline gap-x-2">
                <span className="text-xs font-semibold text-ast-cyan">
                  {message.username}
                </span>
                <span className="text-[10px] text-ast-faint">{message.email}</span>
              </p>
              <p className="mt-0.5 text-[13px] leading-relaxed break-words text-ast-body/90">
                {message.message}
              </p>
              <p className="mt-0.5 text-[10px] text-ast-faint/70">
                {formatTimestamp(message.createdAt)}
              </p>
            </div>
          </article>
        ))}
      </div>

      {error && (
        <p role="alert" className="mt-2 text-xs text-ast-coral">
          {error}
        </p>
      )}

      <form onSubmit={onSend} className="mt-3 flex gap-2">
        <input
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          maxLength={500}
          placeholder="Message..."
          aria-label="Chat message"
          className="min-w-0 flex-1 rounded-lg border border-ast-purple/30 bg-[#1a0f2e] px-3.5 py-2.5 text-sm text-white placeholder:text-ast-faint focus:border-ast-cyan/50 focus:outline-none focus:ring-2 focus:ring-ast-cyan/25"
        />
        <button
          type="submit"
          disabled={draft.trim().length === 0 || pending}
          className="rounded-lg border border-ast-blue/60 bg-ast-blue/20 px-4 py-2.5 text-sm font-medium text-ast-cyan transition hover:bg-ast-blue/30 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Send
        </button>
      </form>
    </div>
  );
}
