/*
  DEMO: Lists + Keys

  Demonstrates:
  - .map() to render a list of components
  - `key` prop — why it matters (remove it and watch the console warning)
  - Adding and removing items while React tracks them by key
*/

import React, { useState } from "react";

interface ChatMessage {
  id: number;
  text: string;
  pinned: boolean;
}

const INITIAL_MESSAGES: ChatMessage[] = [
  { id: 1, text: "Welcome to the chat!", pinned: true },
  { id: 2, text: "How can I help you today?", pinned: false },
  { id: 3, text: "Feel free to ask anything.", pinned: false },
];

let nextId = 4; // simple counter for demo IDs

export function ListDemo() {
  const [messages, setMessages] = useState<ChatMessage[]>(INITIAL_MESSAGES);

  console.log("🔁 render ListDemo —", messages.length, "messages");

  function addMessage() {
    console.log("🖱️ event addMessage");
    setMessages((prev) => [
      ...prev,
      { id: nextId++, text: `Message #${nextId - 1}`, pinned: false },
    ]);
  }

  function removeMessage(id: number) {
    console.log("🖱️ event removeMessage — id", id);
    // Filter creates a NEW array without the removed item.
    // Python: [m for m in messages if m.id != id]
    setMessages((prev) => prev.filter((m) => m.id !== id));
  }

  function togglePin(id: number) {
    console.log("🖱️ event togglePin — id", id);
    setMessages(
      (prev) =>
        prev.map((m) => (m.id === id ? { ...m, pinned: !m.pinned } : m)),
      // map over all items; for the matched one, spread (...m) then override `pinned`.
      // Python: {**m, "pinned": not m["pinned"]} if m["id"] == id else m
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="p-4 border-b border-gray-100">
        <h2 className="font-semibold text-gray-800">Lists + Keys</h2>
        <p className="text-xs text-gray-500 mt-1">
          Try: remove a key prop in the code and watch the browser console for
          React's warning.
        </p>
      </div>

      <ul className="divide-y divide-gray-100">
        {messages.map((msg) => {
          // This logs for EVERY row on EVERY render — the whole list of <li>
          // DESCRIPTIONS is rebuilt each time. But React then diffs by key and
          // patches only the rows that actually changed in the DOM. Add a
          // message and watch: every row logs, yet only one new <li> appears.
          console.log("  ↳ building <li> description for id", msg.id);
          return (
            // key={msg.id} — a stable unique value, NOT the array index.
            // React uses this to track which DOM node belongs to which item.
            <li key={msg.id} className="flex items-center gap-3 px-4 py-3">
              <span className="flex-1 text-sm text-gray-800">
                {msg.pinned && <span className="text-blue-500 mr-1">📌</span>}
                {msg.text}
              </span>
              <button
                onClick={() => togglePin(msg.id)}
                className="text-xs text-blue-500 hover:underline"
              >
                {msg.pinned ? "Unpin" : "Pin"}
              </button>
              <button
                onClick={() => removeMessage(msg.id)}
                className="text-xs text-red-400 hover:underline"
              >
                Remove
              </button>
            </li>
          );
        })}
      </ul>

      <div className="p-4 border-t border-gray-100">
        <button
          onClick={addMessage}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700"
        >
          Add message
        </button>
      </div>
    </div>
  );
}
