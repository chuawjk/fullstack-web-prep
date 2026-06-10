/*
  A CUSTOM HOOK is a function whose name starts with `use` that calls other
  hooks internally. It's how you EXTRACT and REUSE stateful logic across
  multiple components — without duplicating the useState + useEffect boilerplate.

  Rule: if two components have the same useEffect + useState setup, extract it
  into a custom hook.

  Python analogy: extracting repeated logic into a helper function, or a mixin.
  But because hooks have rules (call order must be consistent), the extraction
  must go into a hook, not just a plain function.

  RULE OF HOOKS (enforced by ESLint + React runtime):
  - Only call hooks at the TOP LEVEL of a component or custom hook.
  - Never inside loops, conditions, or nested functions.
  - Always call the same hooks in the same order on every render.
*/

import { useState, useEffect } from "react";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

// === useLocalStorage — storing state in localStorage =========================
// Before writing a component, this logic would live inside a component.
// As a hook, any component can use it for any key.
// Python analogy: a descriptor or property that reads/writes from a file.

function useLocalStorage<T>(key: string, initialValue: T) {
  const [value, setValue] = useState<T>(() => {
    // Lazy initialiser: function form of useState. Runs only on the first render.
    // Reads from localStorage, falls back to initialValue if nothing is stored.
    try {
      const item = window.localStorage.getItem(key);
      return item ? (JSON.parse(item) as T) : initialValue;
    } catch {
      return initialValue;
    }
  });

  // Whenever value changes, persist it to localStorage as a side effect.
  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // Ignore write errors (private browsing, storage full, etc.)
    }
  }, [key, value]);

  return [value, setValue] as const;
  // `as const` makes the return type a readonly tuple [T, Dispatch<SetStateAction<T>>]
  // so destructuring gives correct types: const [val, setVal] = useLocalStorage(...)
}

// === useChat — the main chat logic ============================================
// Encapsulates messages array + draft + send handler so any component that
// needs a chat UI can just call useChat() instead of duplicating all this.

interface UseChatReturn {
  messages: Message[];
  draft: string;
  setDraft: (text: string) => void;
  sendMessage: () => Promise<void>;
  isLoading: boolean;
}

function useChat(conversationId: string): UseChatReturn {
  // Use useLocalStorage so messages persist across page refreshes.
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
    setMessages(prev => [...prev, userMsg]);
    setIsLoading(true);

    // Simulate API call — in §10 this becomes a real OpenAI streaming call.
    // try/finally ensures setIsLoading(false) always runs, even if the call throws.
    // Without this, a failed request leaves the component stuck in the loading state.
    try {
      await new Promise(r => setTimeout(r, 800));
      const botMsg: Message = {
        id: String(Date.now() + 1),
        role: "assistant",
        content: `Got it: "${text}" — real LLM wired in §10.`,
      };
      setMessages(prev => [...prev, botMsg]);
    } finally {
      setIsLoading(false);
    }
  }

  return { messages, draft, setDraft, sendMessage, isLoading };
}

// === COMPONENT using the custom hook =========================================
// The component itself is now tiny — all the logic is in the hook.
// This is the value of custom hooks: clean, readable components.

function ChatUI({ conversationId }: { conversationId: string }) {
  const { messages, draft, setDraft, sendMessage, isLoading } = useChat(conversationId);

  return (
    <div>
      {messages.map(msg => (
        <div key={msg.id}>[{msg.role}] {msg.content}</div>
      ))}
      {isLoading && <p>…</p>}
      <input
        value={draft}
        onChange={e => setDraft(e.target.value)}
        onKeyDown={e => e.key === "Enter" && sendMessage()}
      />
      <button onClick={sendMessage} disabled={isLoading}>Send</button>
    </div>
  );
}

export { useLocalStorage, useChat, ChatUI };
