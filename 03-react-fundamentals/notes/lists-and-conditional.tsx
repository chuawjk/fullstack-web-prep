/*
  Two patterns in almost every component:
    1. LISTS        — map an array of data to an array of JSX descriptions
    2. CONDITIONALS — show or hide parts of the UI based on state

  Both are just JavaScript inside JSX — no special React syntax.
  Python analogy:
    Lists:       [Item(x) for x in items]   (a comprehension that returns JSX)
    Conditional: the A if cond else B form, or a guard-clause early return

  READING GUIDE: `function Thing() {}` is a DEFINITION; `<Thing .../>` inside
  another component is a CALL SITE — a description telling React to call Thing.

  Read-first reference; live versions in playground/.
*/

import React from "react";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  isError?: boolean;
}

// === Definition: rendering a list =============================================
// .map() turns an array of data into an array of JSX. Each item needs a unique
// `key` so React can match old elements to new ones across re-renders (the
// "diff" from mental-model.ts). Match by stable ID, not array position — see the
// bottom of this file for why.

function MessageList({ messages }: { messages: Message[] }) {
  if (messages.length === 0) {
    // Guard clause for the empty case — render a placeholder instead of a list.
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

// === Definition: conditional rendering ========================================
// Three patterns — pick whichever reads clearest at the point you need it.

interface MessageBubbleProps {
  message: Message;
}

function MessageBubble({ message }: MessageBubbleProps) {
  const { role, content, isError } = message; // destructure for cleaner code

  return (
    <div className={`message message--${role}`}>
      {/* Pattern 1 — && (short-circuit): render the badge only if isError.
          Python: "<badge>" if isError else "" */}
      {isError && <span className="error-badge">⚠ Error</span>}

      <p>{content}</p>

      {/* Pattern 2 — ternary: render one thing or the other.
          Python: "You" if role == "user" else "Assistant" */}
      <small>{role === "user" ? "You" : "Assistant"}</small>
    </div>
  );
}

// === Definition: loading / error / empty as distinct phases ===================
// A component driven by async data usually has three phases. Match each to what
// the user should see. Early returns keep the happy path uncluttered. (§04 turns
// this into a proper idle/loading/error/success state machine.)

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

// === Why not the array index as key? =========================================
// React matches list items by key to decide what to reuse. The index isn't a
// stable identity — when items reorder, insert, or delete, the same index points
// at a different item, and React updates the wrong DOM node.
//
//   BAD:  messages.map((msg, i) => <MessageBubble key={i} ... />)
//   GOOD: messages.map(msg      => <MessageBubble key={msg.id} ... />)
//
// Index-as-key is fine only for a truly static list (never reordered/filtered/cut).

export { MessageList, MessageBubble, ConversationView };
