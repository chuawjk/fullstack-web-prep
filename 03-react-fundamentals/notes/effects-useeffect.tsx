/*
  useEffect is the escape hatch from React's loop. The loop (mental-model.ts) is:
  state → render → commit to the DOM. An effect runs AFTER the commit, for things
  that aren't "compute JSX from state": fetching data, timers, websockets,
  localStorage, subscriptions — anything reaching the world outside React.

  Python analogy: a callback that fires after a change — a Django post_save signal
  or an observer callback.

  THE DEPENDENCY ARRAY controls WHEN the effect re-runs:
    • no array      → after EVERY render
    • []            → once, after the first render (like componentDidMount)
    • [a, b]        → after any render where a or b changed
  Its cleanup function (if returned) runs before the next run and on unmount.

  READING GUIDE: `function Thing() {}` is a DEFINITION; `<Thing .../>` elsewhere
  is a CALL SITE. Read-first reference; live versions in playground/.
*/

import React, { useState, useEffect } from "react";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

// === Definition: effect with no dependency array ==============================
// Runs after EVERY render. Rarely what you want — mainly for things that should
// stay in sync on every update, like the document title.

function TitleUpdater({ title }: { title: string }) {
  useEffect(() => {
    // document.title is a browser API — a side effect, so it can't live in the
    // render itself (the render must stay a pure description).
    document.title = `${title} — Chat`;
  }); // no array → runs after every render
  return <span>{title}</span>;
}

// === Definition: fetch on mount (empty dependency array) ======================
// The most common pattern: load data once when the component first appears.

function MessageHistory({ userId }: { userId: string }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // The async function is defined INSIDE the effect — the effect callback
    // itself can't be async (React doesn't accept a returned promise).

    // AbortController cancels the in-flight request if the component unmounts or
    // userId changes before the response lands — otherwise setState would fire on
    // a gone component. Python analogy: cancelling a thread before it finishes.
    const controller = new AbortController();

    async function fetchMessages() {
      try {
        const res = await fetch(`/api/messages?userId=${userId}`, {
          signal: controller.signal,
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data: Message[] = await res.json();
        setMessages(data);
      } catch (err) {
        // AbortError just means we cleaned up before the fetch finished — ignore it.
        if (err instanceof Error && err.name === "AbortError") return;
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setIsLoading(false);
      }
    }

    fetchMessages();

    // Cleanup: cancel the request when the effect re-runs or the component unmounts.
    return () => controller.abort();
  }, [userId]);
  // [userId]: re-run when userId changes (a different user → re-fetch their messages).

  // Three phases, matched to what the user sees (the pattern from
  // lists-and-conditional.tsx, here driven by a real async fetch):
  if (isLoading) return <p>Loading…</p>;
  if (error) return <p>Error: {error}</p>;

  return (
    <ul>
      {messages.map(msg => (
        <li key={msg.id}>{msg.content}</li>
      ))}
    </ul>
  );
}

// === Definition: cleanup (returning a function from the effect) ===============
// If the effect sets up something ongoing (timer, subscription), return a cleanup
// function. React runs it before the next effect AND on unmount. Without it, the
// timer/subscription leaks past the component's life.
// Python analogy: a context manager's __exit__, or a try/finally.

function TypingIndicator({ conversationId }: { conversationId: string }) {
  const [isTyping, setIsTyping] = useState(false);

  useEffect(() => {
    // Pretend a websocket pushes "user is typing" events (simulated with a timer).
    const timer = setInterval(() => {
      setIsTyping(prev => !prev); // functional updater — see state-usestate.tsx
    }, 2000);

    // Runs when conversationId changes (before re-running) or on unmount.
    return () => clearInterval(timer); // Python: timer.cancel()
  }, [conversationId]);

  // Returning null renders nothing — a valid thing for a component to return.
  return isTyping ? <p>Someone is typing…</p> : null;
}

export { TitleUpdater, MessageHistory, TypingIndicator };
