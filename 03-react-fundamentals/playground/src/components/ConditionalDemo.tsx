/*
  DEMO: Conditional Rendering

  Demonstrates:
  - && short-circuit (render something or nothing)
  - Ternary ? : (render one thing or another)
  - Loading / Error / Success pattern — the three-phase async state machine
*/

import React, { useState } from "react";

type LoadState = "idle" | "loading" | "success" | "error";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

const MOCK_MESSAGES: Message[] = [
  { id: "1", role: "assistant", content: "Hello! How can I help?" },
  { id: "2", role: "user", content: "Tell me about React." },
  { id: "3", role: "assistant", content: "React is a UI library by Meta." },
];

export function ConditionalDemo() {
  const [loadState, setLoadState] = useState<LoadState>("idle");
  const [messages, setMessages] = useState<Message[]>([]);
  const [showTimestamps, setShowTimestamps] = useState(false);

  function simulateLoad(willSucceed: boolean) {
    setLoadState("loading");
    setMessages([]);

    setTimeout(() => {
      if (willSucceed) {
        setMessages(MOCK_MESSAGES);
        setLoadState("success");
      } else {
        setLoadState("error");
      }
    }, 1500);
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="p-4 border-b border-gray-100">
        <h2 className="font-semibold text-gray-800">Conditional Rendering</h2>
        <p className="text-xs text-gray-500 mt-1">
          Simulate loading + error states. Toggle timestamps to see && in action.
        </p>
      </div>

      <div className="p-4 space-y-4">
        {/* Controls */}
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => simulateLoad(true)}
            className="bg-blue-600 text-white px-3 py-1.5 rounded-lg text-sm hover:bg-blue-700"
          >
            Load (success)
          </button>
          <button
            onClick={() => simulateLoad(false)}
            className="bg-red-500 text-white px-3 py-1.5 rounded-lg text-sm hover:bg-red-600"
          >
            Load (error)
          </button>
          {/* && pattern: only show toggle button when we have messages */}
          {loadState === "success" && (
            <button
              onClick={() => setShowTimestamps(v => !v)}
              className="bg-gray-100 text-gray-700 px-3 py-1.5 rounded-lg text-sm hover:bg-gray-200"
            >
              {showTimestamps ? "Hide" : "Show"} timestamps
            </button>
          )}
        </div>

        {/* Three-phase render: loading → error → success */}
        {loadState === "idle" && (
          <p className="text-sm text-gray-500">Click a button to load messages.</p>
        )}

        {/* Ternary: loading spinner or nothing */}
        {loadState === "loading" && (
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            Loading…
          </div>
        )}

        {loadState === "error" && (
          <div className="bg-red-50 text-red-700 rounded-lg p-3 text-sm">
            ⚠ Failed to load messages. Try again.
          </div>
        )}

        {loadState === "success" && (
          <ul className="space-y-2">
            {messages.map(msg => (
              <li key={msg.id} className={`text-sm p-2 rounded-lg ${msg.role === "user" ? "bg-blue-50" : "bg-gray-50"}`}>
                <span className="font-medium capitalize">{msg.role}:</span> {msg.content}
                {/* && pattern: only show timestamp if toggle is on */}
                {showTimestamps && (
                  <span className="text-xs text-gray-400 ml-2">(just now)</span>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
