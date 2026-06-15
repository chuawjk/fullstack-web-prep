/*
  DEMO: State + Props — the core React data-flow model.

  Demonstrates:
  - useState for a list of messages
  - Controlled input (input value tied to state)
  - Props flowing downward to child components
  - Callbacks flowing upward from child to parent
*/

import React, { useState } from "react";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

// ── Child component ─────────────────────────────────────────────────────────
// MessageBubble receives data as props — it never owns any state.
// It's a "pure" presentational component: same props → same output, always.
// Python analogy: a pure function. No side effects.

function MessageBubble({ message }: { message: Message }) {
  // Indented log: notice EVERY bubble logs again on every keystroke in the input
  // below. The parent re-renders, so React re-calls all its children. (That's
  // cheap — it only rebuilds descriptions. The DOM still only changes where it
  // must. §04's React.memo is how you'd skip these re-calls when they're wasted.)
  console.log("  🔁 render MessageBubble —", JSON.stringify(message.content));
  const isUser = message.role === "user";
  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"} mb-2`}>
      <div
        className={`max-w-xs px-4 py-2 rounded-2xl text-sm ${
          isUser ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-900"
        }`}
      >
        {message.content}
      </div>
    </div>
  );
}

// ── Parent component ─────────────────────────────────────────────────────────
// ChatDemo OWNS the state — messages live here. It passes data down as props
// and handles the onSend callback from ChatInput.

export function ChatDemo() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "assistant",
      content: "Hi! I'm a demo chatbot. Try typing something.",
    },
  ]);
  const [draft, setDraft] = useState("");

  // This fires on EVERY keystroke: each character calls setDraft, which
  // schedules a re-render, so ChatDemo's function runs again with the new draft.
  console.log(
    "🔁 render ChatDemo — messages:",
    messages.length,
    "| draft:",
    JSON.stringify(draft),
  );

  function handleSend() {
    if (!draft.trim()) return;
    console.log(
      "🖱️ event handleSend — two setState calls coming (messages + draft)",
    );

    const userMsg: Message = {
      id: String(Date.now()),
      role: "user",
      content: draft,
    };
    // Mirror: a fake assistant echo response
    const botMsg: Message = {
      id: String(Date.now() + 1),
      role: "assistant",
      content: `You said: "${draft}" — (real LLM wired up in §10!)`,
    };

    // Spread to create a NEW array — never mutate state in-place.
    setMessages((prev) => [...prev, userMsg, botMsg]);
    setDraft("");
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="p-4 border-b border-gray-100">
        <h2 className="font-semibold text-gray-800">Chat — useState + Props</h2>
        <p className="text-xs text-gray-500 mt-1">
          State lives in ChatDemo. MessageBubble is a pure child.
        </p>
      </div>

      {/* Message list — passes each message down as a prop */}
      <div className="p-4 h-64 overflow-y-auto">
        {messages.map((msg) => (
          <MessageBubble key={msg.id} message={msg} />
        ))}
      </div>

      {/* Composer — controlled input + send button */}
      <div className="p-4 border-t border-gray-100 flex gap-2">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)} // controlled: value tied to state
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          placeholder="Type a message…"
          className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          onClick={handleSend}
          disabled={!draft.trim()} // disable when empty
          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-40"
        >
          Send
        </button>
      </div>
    </div>
  );
}
