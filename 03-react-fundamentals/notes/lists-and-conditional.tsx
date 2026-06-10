/*
  Two patterns you'll see in almost every React component:
    1. Rendering LISTS — mapping over an array to produce JSX
    2. CONDITIONAL rendering — showing or hiding parts of the UI based on state

  These are just JavaScript inside JSX — no special React syntax.
  Python analogy:
    Lists: [<Item key=x> for x in items]  — it's a list comprehension that returns JSX
    Conditional: if ... else ... inside the render output
*/

import React from "react";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  isError?: boolean;
}

// === RENDERING LISTS ==========================================================
// Use .map() to turn an array of data into an array of JSX elements.
// Each element MUST have a unique `key` prop.

// WHY keys? React uses them to track which item is which across re-renders.
// If you add/remove/reorder items, keys tell React which DOM nodes to reuse vs
// recreate. Without keys React might update the wrong elements.
// Python analogy: dictionary keys — they identify items so React doesn't scan the whole list.

function MessageList({ messages }: { messages: Message[] }) {
  if (messages.length === 0) {
    // Guard clause: render nothing (or a placeholder) for the empty case.
    return <p className="empty-state">No messages yet. Start the conversation!</p>;
  }

  return (
    <div className="messages">
      {messages.map(msg => (
        // key must be unique among SIBLINGS, not globally unique.
        // Use a stable ID from your data — never the array index if the list reorders.
        <MessageBubble key={msg.id} message={msg} />
      ))}
    </div>
  );
}

// === CONDITIONAL RENDERING ====================================================
// Several patterns — pick the one that reads most clearly.

interface MessageBubbleProps {
  message: Message;
}

function MessageBubble({ message }: MessageBubbleProps) {
  const { role, content, isError } = message;  // destructure for cleaner code

  return (
    <div className={`message message--${role}`}>

      {/* Pattern 1: && (short-circuit) — render something or nothing.
          If isError is true, render the error badge. If false, render nothing.
          Python: "<error-badge>" if isError else ""  */}
      {isError && <span className="error-badge">⚠ Error</span>}

      <p>{content}</p>

      {/* Pattern 2: ternary — render one thing or another.
          Python: "You" if role == "user" else "Assistant"  */}
      <small>{role === "user" ? "You" : "Assistant"}</small>
    </div>
  );
}

// === LOADING / ERROR / EMPTY STATES ===========================================
// A common UI pattern: the component has three "phases" based on async state.
// Match each phase to what the user should see.

interface ConversationViewProps {
  messages: Message[];
  isLoading: boolean;
  error: string | null;
}

function ConversationView({ messages, isLoading, error }: ConversationViewProps) {
  // Early returns for non-happy-path states — keeps the main render clean.
  if (isLoading) {
    return <div className="loading">Loading conversation…</div>;
  }

  if (error) {
    return <div className="error">Something went wrong: {error}</div>;
  }

  // Happy path: we have data.
  return <MessageList messages={messages} />;
}

// === AVOID INDEX AS KEY =======================================================
// This is a common mistake. Index as key causes subtle bugs when items reorder.
//
// BAD: messages.map((msg, index) => <MessageBubble key={index} ... />)
// GOOD: messages.map(msg => <MessageBubble key={msg.id} ... />)
//
// Use the array index as key ONLY when the list is truly static (never reorders,
// never filtered, never has items deleted).

export { MessageList, MessageBubble, ConversationView };
