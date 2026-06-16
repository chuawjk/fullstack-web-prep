/*
  Lists and conditional rendering — .map() and branches inside JSX.

  PROBLEM
  -------
  You have an array of chat messages and need to render one bubble per message.
  You also need to show a loading spinner while the data is fetching and an error
  if it failed. Both of these are "just JavaScript" inside JSX, but there are two
  gotchas that aren't obvious: `key` must be a stable ID (not the array index), and
  the `&&` short-circuit can silently render the number 0 onto the screen.

  CONCEPT
  -------
  Lists use .map() to turn an array of data into an array of JSX descriptions.
  Each item needs a `key` so React can match old elements to new ones across
  re-renders. Conditionals use `&&`, ternary, or early returns — no special React
  syntax, just JavaScript. The key must be stable (a row ID, not array position)
  because React uses it to decide what to reuse vs. replace when the list changes.

  KEY INSIGHT
  -----------
  `key` is not a prop — it's identity metadata for React's diff algorithm. Use a
  stable ID; an array index causes wrong-element updates when the list reorders,
  inserts, or deletes.

  IN THIS FILE
  ------------
  • MessageList — .map() to JSX, guard clause for the empty case
  • MessageBubble — && short-circuit and ternary conditional
  • ConversationView — loading/error/success phases as early returns
  • Why not the array index as key

  PYTHON ANALOGY
  --------------
  Lists: [Item(x) for x in items] — a comprehension returning JSX instead of
  a value. Conditional: A if cond else B (ternary), or a guard-clause early return.

  Read-first reference; live versions in playground/.
*/

import React from "react";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  isError?: boolean;
}

// ── Rendering a list (DEFINITION) ─────────────────────────────────────────────
// PURPOSE: shows the standard .map() → JSX pattern plus the guard clause for
// the empty case. `key` is required — see the bottom of this file for why.

function MessageList({ messages }: { messages: Message[] }) {
  if (messages.length === 0) {
    // Guard clause for the empty case — return early before the list logic.
    return <p className="empty-state">No messages yet. Start the conversation!</p>;
  }

  return (
    <div className="messages">
      {/* CALL SITE x N: one <MessageBubble/> description per message.
          key is identity metadata for React's diff, NOT a prop MessageBubble gets. */}
      {messages.map(msg => (
        <MessageBubble key={msg.id} message={msg} />
      ))}
    </div>
  );
}

// ── Conditional rendering (DEFINITION) ────────────────────────────────────────
// PURPOSE: shows the three conditional patterns in one component. Pick whichever
// reads most clearly at the point you need it.

interface MessageBubbleProps {
  message: Message;
}

function MessageBubble({ message }: MessageBubbleProps) {
  const { role, content, isError } = message;

  return (
    <div className={`message message--${role}`}>
      {/* Pattern 1 — && (short-circuit): render the badge only if isError.
          Python: "<badge>" if isError else ""
          FOOTGUN: works cleanly only when the left side is a real BOOLEAN.
          If the left side could be a number (e.g. count && <p/>), a value of 0
          renders the number 0 on screen — not nothing. Coerce to bool first:
          count > 0 && <p/>, or use a ternary. isError is a boolean, so safe here. */}
      {isError && <span className="error-badge">⚠ Error</span>}

      <p>{content}</p>

      {/* Pattern 2 — ternary: one of two things. Python: "You" if ... else "Assistant" */}
      <small>{role === "user" ? "You" : "Assistant"}</small>
    </div>
  );
}

// ── Loading / error / success phases (DEFINITION) ────────────────────────────
// PURPOSE: shows early returns for each async data phase. This is the simple
// version with separate boolean flags — §04/loading-error-states.tsx upgrades it
// to a proper discriminated-union state machine that makes illegal states impossible.

interface ConversationViewProps {
  messages: Message[];
  isLoading: boolean;
  error: string | null;
}

function ConversationView({ messages, isLoading, error }: ConversationViewProps) {
  if (isLoading) {
    return <div className="loading">Loading conversation…</div>;
  }
  if (error) {
    return <div className="error">Something went wrong: {error}</div>;
  }
  // Happy path: we have data. CALL SITE for MessageList.
  return <MessageList messages={messages} />;
}

// ── Why not the array index as key ────────────────────────────────────────────
// React matches list items by key to decide what to reuse. The index isn't a
// stable identity — when items reorder, insert, or delete, the same index points
// at a different item, and React updates the wrong DOM node (wrong content, wrong
// input focus, wrong animation state).
//
//   BAD:  messages.map((msg, i) => <MessageBubble key={i} ... />)
//   GOOD: messages.map(msg      => <MessageBubble key={msg.id} ... />)
//
// Index-as-key is only safe for a truly static list that never reorders.

export { MessageList, MessageBubble, ConversationView };
