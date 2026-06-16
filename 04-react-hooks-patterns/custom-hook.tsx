/*
  Custom hooks — extracting shared stateful logic into a reusable function.

  PROBLEM
  -------
  Two separate chat screens both need message history, a text draft field, a
  loading flag, and a send handler. The useState + useEffect scaffolding for all
  of this is identical in each. Copy-pasting it into both components means two
  sources of truth: fix a bug in one and forget the other, or update the API and
  have to track down every copy.

  CONCEPT
  -------
  Extract the shared logic into a custom hook — a plain function whose name starts
  with `use` and that calls other hooks inside it. Each component calls the hook
  and gets back plain values and functions; the hook owns all the slots. Because
  hooks compose like ordinary functions, one hook can build on another — useChat
  builds on useLocalStorage, which itself uses useState and useEffect.

  KEY INSIGHT
  -----------
  A custom hook is just a function that owns state on behalf of its caller. The
  `use` prefix isn't decoration — it's what lets React and ESLint enforce the Rules
  of Hooks on it. When you see `use` at the start, you know: this function owns
  slots; call it at the top level only.

  IN THIS FILE
  ------------
  • useLocalStorage — generic state mirrored to localStorage, so values survive
                      page refresh; returns the same [value, setter] pair as useState
  • useChat         — bundles message history + draft + send handler; builds on
                      useLocalStorage so messages persist across refreshes
  • ChatUI          — the payoff: almost entirely JSX, one useChat() call, no inline
                      state wiring

  WHEN NOT TO
  -----------
  If the logic has no hooks in it (pure computation), make it a plain function —
  not a hook. The `use` prefix is a promise that there are slots inside.

  PYTHON ANALOGY
  --------------
  No clean equivalent. The closest is a mixin or repository that owns state on
  behalf of its consumers, but the hook model (per-component slot lifecycle,
  matched by call order) has no Python parallel.
*/

import { useState, useEffect } from "react";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

// ── useLocalStorage — generic persisted state (DEFINITION) ────────────────────
// PURPOSE: a drop-in replacement for useState that also mirrors the value to
// localStorage, so it survives a page refresh. Returns [value, setter] — same
// shape as useState so call sites don't have to change.
//
// Note the boundary: localStorage is OUTSIDE the React tree (a browser API),
// so writing to it is a side effect that belongs in useEffect, not render.

function useLocalStorage<T>(key: string, initialValue: T) {
  const [value, setValue] = useState<T>(() => {
    // Lazy initialiser: pass useState a FUNCTION and React calls it once, on the
    // first render only. Without the function form, JSON.parse + localStorage.getItem
    // would run on EVERY render and be thrown away (slot 0 ignores the argument
    // after the first call). Here React supplies no args — just calls your function.
    try {
      const item = window.localStorage.getItem(key);
      return item ? (JSON.parse(item) as T) : initialValue;
    } catch {
      return initialValue;
    }
  });

  // Sync the slot OUT to localStorage whenever it changes.
  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // Swallow write errors (private mode, quota exceeded) — non-fatal.
    }
  }, [key, value]);

  return [value, setValue] as const;
  // `as const` freezes the return as a readonly TUPLE [T, setter] rather than a
  // mutable array, so `const [v, setV] = useLocalStorage(...)` types each slot
  // correctly. Without it both positions widen to a union and lose their types.
}

// ── useChat — the chat logic, extracted (DEFINITION) ──────────────────────────
// PURPOSE: bundles messages + draft + send handler into one hook. Any component
// needing a chat UI calls useChat() instead of re-deriving all of this. The typed
// return makes the call site self-documenting. Builds ON TOP of useLocalStorage —
// hooks compose like regular functions, and useChat owns whatever slots its
// callees claim.

interface UseChatReturn {
  messages: Message[];
  draft: string;
  setDraft: (text: string) => void;
  sendMessage: () => Promise<void>;
  isLoading: boolean;
}

function useChat(conversationId: string): UseChatReturn {
  // Messages persist across refreshes because they live in localStorage, keyed
  // by conversation. draft and isLoading are ordinary in-memory slots.
  const [messages, setMessages] = useLocalStorage<Message[]>(
    `chat-${conversationId}`,
    [{ id: "0", role: "assistant", content: "Hi! How can I help?" }]
  );
  const [draft, setDraft] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function sendMessage() {
    if (!draft.trim() || isLoading) return;
    const text = draft;
    setDraft("");

    const userMsg: Message = { id: String(Date.now()), role: "user", content: text };
    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);

    // try/finally guarantees setIsLoading(false) runs even if the request throws.
    // Without finally, one failed request leaves the UI stuck showing "loading"
    // forever — the most common async-state bug there is.
    try {
      await new Promise((r) => setTimeout(r, 800));
      const botMsg: Message = {
        id: String(Date.now() + 1),
        role: "assistant",
        content: `Got it: "${text}" — real LLM wired in §10.`,
      };
      setMessages((prev) => [...prev, botMsg]);
    } finally {
      setIsLoading(false);
    }
  }

  return { messages, draft, setDraft, sendMessage, isLoading };
}

// ── ChatUI — component using the hook (CALL SITE) ─────────────────────────────
// PURPOSE: shows the payoff — almost entirely JSX, one useChat() call, no inline
// state wiring. Swap useChat's internals (real API, different store) and this
// component doesn't change a line. That's why custom hooks exist.

function ChatUI({ conversationId }: { conversationId: string }) {
  const { messages, draft, setDraft, sendMessage, isLoading } = useChat(conversationId);

  return (
    <div>
      {messages.map((msg) => (
        <div key={msg.id}>[{msg.role}] {msg.content}</div>
      ))}
      {isLoading && <p>…</p>}
      <input
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && sendMessage()}
      />
      <button onClick={sendMessage} disabled={isLoading}>Send</button>
    </div>
  );
}

export { useLocalStorage, useChat, ChatUI };
