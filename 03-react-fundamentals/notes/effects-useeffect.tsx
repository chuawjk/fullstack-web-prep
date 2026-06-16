/*
  useEffect — running side effects after React commits to the DOM.

  PROBLEM
  -------
  You need to load messages from an API when a user's conversation opens. This is
  a network request — it can't happen inside the component's render body because
  renders must be pure (a pure function computes output from input; it doesn't
  start network requests). You need a way to say: "after this render is committed
  to the DOM, go fetch data, and update state when it comes back."

  CONCEPT
  -------
  useEffect is the escape hatch from React's pure render loop. It runs AFTER the
  DOM is committed, for anything that reaches outside React: network requests,
  timers, WebSockets, localStorage, subscriptions. The dependency array controls
  when it re-runs. The optional cleanup function (if returned) runs before the
  next effect and on unmount — it tears down anything the effect set up.

  KEY INSIGHT
  -----------
  Render = pure description, no side effects. Effect = side effect that runs
  after commit. If something touches the world outside React (network, DOM APIs,
  timers), it belongs in an effect — never in the render body.

  IN THIS FILE
  ------------
  • No dependency array — runs after every render (the rarely-needed case)
  • Empty [] — runs once after mount (the most common case: data fetching)
  • [userId] — re-runs when a specific value changes
  • Cleanup function — prevents timer/subscription leaks; AbortController for
    in-flight fetch cancellation

  PYTHON ANALOGY
  --------------
  A Django post_save signal or @property setter that triggers a side effect —
  a callback that fires after a change. Or a try/finally for cleanup.

  Read-first reference; live versions in playground/.
*/

import React, { useState, useEffect } from "react";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

// ── Effect with no dependency array (DEFINITION) ──────────────────────────────
// PURPOSE: runs after EVERY render. Rarely what you want — mainly for things
// that must stay perfectly in sync on every update, like the document title.

function TitleUpdater({ title }: { title: string }) {
  useEffect(() => {
    // document.title is a browser API — a side effect, so it can't live in
    // the render itself (the render must stay a pure description).
    document.title = `${title} — Chat`;
  }); // no array → runs after every render
  return <span>{title}</span>;
}

// ── Fetch on mount — empty dependency array (DEFINITION) ──────────────────────
// PURPOSE: the most common pattern. Run once when the component first appears,
// fetch data, update state. The empty [] is the signal: "only on mount."

function MessageHistory({ userId }: { userId: string }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // The async function is defined INSIDE the effect — the effect callback
    // itself can't be async (React doesn't accept a returned Promise).

    // AbortController cancels the in-flight request if the component unmounts or
    // userId changes before the response arrives — otherwise setState would fire
    // on a gone component. Python analogy: cancelling a thread before it finishes.
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
        // AbortError means we cleaned up before the fetch finished — expected, not a bug.
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
  // [userId]: re-run the effect when userId changes (different user → re-fetch).

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

// ── Cleanup function (DEFINITION) ─────────────────────────────────────────────
// PURPOSE: if the effect sets up something ongoing (timer, subscription), return
// a cleanup function. React runs it before the next effect AND on unmount.
// Without it, the timer/subscription leaks past the component's lifetime.
// Python analogy: a context manager's __exit__, or a try/finally.

function TypingIndicator({ conversationId }: { conversationId: string }) {
  const [isTyping, setIsTyping] = useState(false);

  useEffect(() => {
    // Simulated WebSocket "user is typing" event (timer stands in here).
    const timer = setInterval(() => {
      setIsTyping(prev => !prev); // functional updater — see state-usestate.tsx
    }, 2000);

    // Runs when conversationId changes (before re-running) or on unmount.
    return () => clearInterval(timer); // Python: timer.cancel()
  }, [conversationId]);

  return isTyping ? <p>Someone is typing…</p> : null;
}

export { TitleUpdater, MessageHistory, TypingIndicator };
