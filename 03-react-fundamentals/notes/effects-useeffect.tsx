/*
  useEffect runs code AFTER a component renders, for side effects — things
  that reach outside the React world: fetching data, setting up a timer or
  websocket, writing to localStorage, subscribing to an external store.

  "Side effect" in React means: anything that isn't just computing JSX.

  Python analogy: a callback or lifecycle hook that fires after a state change.
  Like a post_save signal in Django, or an observer pattern callback.

  IMPORTANT RULE: the dependency array [dep1, dep2] controls WHEN the effect runs.
    - No array    → run after EVERY render
    - []          → run once, after the first render (like componentDidMount)
    - [dep1, dep2] → run after renders where dep1 or dep2 changed
*/

import React, { useState, useEffect } from "react";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

// === EFFECT WITH NO DEPENDENCIES =============================================
// Runs after EVERY render — usually not what you want for data fetching.
// Mainly useful for things that should sync on every update (e.g. document.title).

function TitleUpdater({ title }: { title: string }) {
  useEffect(() => {
    // document.title is a browser API — pure side effect, can't be in the render.
    document.title = `${title} — Chat`;
  });  // no dependency array: runs after every render
  return <span>{title}</span>;
}

// === FETCH ON MOUNT (empty dependency array) =================================
// The most common pattern: fetch data once when the component first appears.
// Empty [] means "run once after the first render, then never again."

function MessageHistory({ userId }: { userId: string }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Fetch messages for this user from the API.
    // The async function is defined INSIDE the effect (you can't make the
    // effect callback itself async — React doesn't accept a promise return).

    // AbortController: lets us cancel the in-flight request if the component
    // unmounts or userId changes before the response arrives.
    // Without this, the setState calls would fire on a dead component.
    // Python analogy: cancelling a threading.Thread before it finishes.
    const controller = new AbortController();

    async function fetchMessages() {
      try {
        const res = await fetch(`/api/messages?userId=${userId}`, {
          signal: controller.signal,  // pass the cancel signal to fetch
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data: Message[] = await res.json();
        setMessages(data);
      } catch (err) {
        // Ignore AbortError — it just means the effect cleaned up before fetching finished.
        if (err instanceof Error && err.name === "AbortError") return;
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setIsLoading(false);
      }
    }

    fetchMessages();

    // Cleanup: cancel the request if userId changes or component unmounts.
    return () => controller.abort();
  }, [userId]);
  // [userId] dependency: re-run the effect whenever userId changes.
  // If userId changes (different user logs in), we re-fetch their messages.

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

// === CLEANUP: returning a function from the effect ============================
// If the effect sets up a subscription or timer, return a cleanup function.
// React calls it before running the effect again AND when the component unmounts.
// Python analogy: a context manager's __exit__, or a try/finally block.

function TypingIndicator({ conversationId }: { conversationId: string }) {
  const [isTyping, setIsTyping] = useState(false);

  useEffect(() => {
    // Imagine a WebSocket connection that pushes "user is typing" events.
    // (Simulated here — a real app would use a WebSocket or Supabase Realtime.)
    const timer = setInterval(() => {
      setIsTyping(prev => !prev);  // toggle every 2 seconds for demo purposes
    }, 2000);

    // CLEANUP FUNCTION — returned from the effect.
    // Called when: conversationId changes (before re-running), or component unmounts.
    // Without this, the interval would keep running even after the component is gone.
    return () => {
      clearInterval(timer);  // Python equivalent: timer.cancel() on a threading.Timer
    };
  }, [conversationId]);

  return isTyping ? <p>Someone is typing…</p> : null;
}

export { TitleUpdater, MessageHistory, TypingIndicator };
