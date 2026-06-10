/*
  PROPS are the inputs to a component — data passed from a parent to a child.
  They flow ONE-WAY: from parent down to child. A child cannot directly modify
  the parent's data; it can only call a function the parent passed down.

  Python analogy: function arguments. `<Button label="Send" onClick={handleClick} />`
  is like calling  button(label="Send", on_click=handle_click).
*/

import React from "react";

// === BASIC PROPS ==============================================================
// Define props as a TypeScript interface — each field is one "attribute" in JSX.

interface MessageBubbleProps {
  role: "user" | "assistant";
  content: string;
  timestamp?: string;  // ? = optional prop. Python: Optional[str]
}

function MessageBubble({ role, content, timestamp }: MessageBubbleProps) {
  // Destructuring in the parameter: extracts role, content, timestamp from the props object.
  // Python equivalent: def f(self, role, content, timestamp=None): or **kwargs unpacking.
  const isUser = role === "user";

  return (
    <div className={`message ${isUser ? "message--user" : "message--bot"}`}>
      <span>{content}</span>
      {/* Conditional rendering: if timestamp exists, show it. If not, render nothing. */}
      {/* Python: f"{timestamp}" if timestamp else ""  */}
      {timestamp && <small className="timestamp">{timestamp}</small>}
    </div>
  );
}

// === CALLBACK PROPS ===========================================================
// Events flow UPWARD via callback functions passed as props.
// The parent defines what happens; the child just calls the function.
// Python analogy: passing a callback function as an argument.

interface ChatInputProps {
  onSend: (text: string) => void;  // a function type: takes a string, returns nothing
  disabled?: boolean;
}

function ChatInput({ onSend, disabled = false }: ChatInputProps) {
  // Default value for disabled: if not passed, it defaults to false.
  // Python equivalent: def f(disabled=False):
  const [draft, setDraft] = React.useState("");

  const handleClick = () => {
    if (draft.trim()) {
      onSend(draft);   // call the parent's function with the text
      setDraft("");    // clear the input (local state)
    }
  };

  return (
    <div>
      <input
        value={draft}
        onChange={e => setDraft(e.target.value)}
        placeholder="Type a message…"
      />
      <button onClick={handleClick} disabled={disabled}>
        Send
      </button>
    </div>
  );
}

// === CHILDREN PROP ============================================================
// `children` is a special built-in prop: the JSX content nested INSIDE a component.
// Python: no equivalent (HTML has this naturally; Python functions don't).

interface CardProps {
  title: string;
  children: React.ReactNode;  // ReactNode = anything React can render (JSX, string, array...)
}

function Card({ title, children }: CardProps) {
  return (
    <div className="card">
      <h3>{title}</h3>
      <div className="card-body">{children}</div>
    </div>
  );
}

// Usage: <Card title="Chat"><MessageBubble role="user" content="Hello" /></Card>
// The MessageBubble JSX becomes the `children` prop inside Card.

// === PROP DRILLING (THE PROBLEM CONTEXT solves) ==============================
// If a deeply nested component needs data, you must pass it as props through
// every intermediate component. This is called "prop drilling" — fine for 2-3
// levels, tedious for deeper trees. Context (§04) solves this.

export { MessageBubble, ChatInput, Card };
