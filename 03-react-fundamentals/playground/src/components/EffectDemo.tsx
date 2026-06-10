/*
  DEMO: useEffect

  Demonstrates:
  - Effect with dependency array (runs when dep changes)
  - Cleanup function (returned from the effect)
  - The "fetch on mount" pattern (empty dep array [])
*/

import React, { useState, useEffect } from "react";

export function EffectDemo() {
  const [conversationId, setConversationId] = useState("conv-1");
  const [isTyping, setIsTyping] = useState(false);
  const [elapsed, setElapsed] = useState(0);

  // EFFECT 1: runs whenever conversationId changes.
  // Simulates "subscribe to typing indicator for this conversation".
  // The CLEANUP cancels the subscription when conversationId changes or component unmounts.
  useEffect(() => {
    setIsTyping(false);  // reset when switching conversations

    // Simulate a "bot is typing" notification after 1.5 seconds.
    const typingTimer = setTimeout(() => setIsTyping(true), 1500);

    // CLEANUP — returned function runs before the next effect execution,
    // and when the component unmounts. Prevents stale timers from firing.
    return () => {
      clearTimeout(typingTimer);
      setIsTyping(false);
    };
  }, [conversationId]);
  // [conversationId]: re-run whenever conversationId changes.

  // EFFECT 2: runs once on mount (empty dep array).
  // Simulates a "time since mounted" counter — like an uptime display.
  useEffect(() => {
    const interval = setInterval(() => {
      setElapsed(prev => prev + 1);
    }, 1000);

    // Cleanup: clear the interval when the component unmounts.
    // Without this, the interval would run forever after leaving this tab.
    return () => clearInterval(interval);
  }, []);
  // [] — empty dep array: run once on mount, cleanup on unmount.

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="p-4 border-b border-gray-100">
        <h2 className="font-semibold text-gray-800">useEffect — Dependency Array</h2>
        <p className="text-xs text-gray-500 mt-1">
          Switch conversations — watch the effect re-run. The timer shows the [] (mount-only) effect.
        </p>
      </div>

      <div className="p-4 space-y-4">
        {/* Conversation switcher */}
        <div>
          <p className="text-sm font-medium text-gray-700 mb-2">Active conversation:</p>
          <div className="flex gap-2">
            {["conv-1", "conv-2", "conv-3"].map(id => (
              <button
                key={id}
                onClick={() => setConversationId(id)}
                className={`px-3 py-1 rounded-lg text-sm ${
                  conversationId === id
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {id}
              </button>
            ))}
          </div>
        </div>

        {/* Effect 1 output */}
        <div className="bg-gray-50 rounded-lg p-3 text-sm">
          <span className="font-medium">Typing indicator for {conversationId}: </span>
          {isTyping
            ? <span className="text-green-600">● Someone is typing…</span>
            : <span className="text-gray-400">○ Quiet</span>
          }
          <p className="text-xs text-gray-400 mt-1">
            Effect re-runs when conversationId changes. Wait 1.5s after switching.
          </p>
        </div>

        {/* Effect 2 output */}
        <div className="bg-gray-50 rounded-lg p-3 text-sm">
          <span className="font-medium">Time on this tab: </span>
          <span className="font-mono">{elapsed}s</span>
          <p className="text-xs text-gray-400 mt-1">
            Effect ran once on mount ([] dep array). Interval cleans up on unmount.
          </p>
        </div>
      </div>
    </div>
  );
}
