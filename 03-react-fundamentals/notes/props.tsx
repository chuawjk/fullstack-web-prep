/*
  PROPS are a component's inputs — data passed from a parent down to a child.
  They flow ONE WAY: down. A child can't change a parent's data; it can only
  call a function the parent handed it (that's how events travel back up).

  Python analogy: function arguments. Writing  <Button label="Send" onClick={fn}/>
  is like calling  button(label="Send", on_click=fn)  — except React makes the
  call, not you.

  READING GUIDE (same as components.tsx):
    • `function Thing({...}) {}`   = DEFINITION (what props it accepts).
    • `<Thing prop={...} />`        = CALL SITE (passing those props in).
  Each definition below is followed by a "Used like this" call site so you can
  see both halves together.

  Read-first reference; the live versions are in playground/.
*/

import React from "react";

// === Definition: basic props ==================================================
// Declare the props as a TypeScript interface — each field is one attribute at
// the call site.

interface MessageBubbleProps {
  role: "user" | "assistant";
  content: string;
  timestamp?: string; // ? = optional. Python: Optional[str]
}

function MessageBubble({ role, content, timestamp }: MessageBubbleProps) {
  // The { } in the parameter is destructuring: pull role/content/timestamp out
  // of the single props object. Python: def f(*, role, content, timestamp=None).
  const isUser = role === "user";

  return (
    <div className={`message ${isUser ? "message--user" : "message--bot"}`}>
      <span>{content}</span>
      {/* timestamp && <…> renders the <small> only when timestamp is truthy;
          when it's undefined, nothing renders. Python: x if x else "" */}
      {timestamp && <small className="timestamp">{timestamp}</small>}
    </div>
  );
}
// Used like this (inside some parent's JSX):
//   <MessageBubble role="user" content="Hello" timestamp="09:14" />

// === Definition: callback props (events flow up) ==============================
// A child can't reach up to its parent. Instead the parent passes a function
// down as a prop; the child calls it. Python: passing a callback as an argument.

interface ChatInputProps {
  onSend: (text: string) => void; // a function type: takes a string, returns nothing
  disabled?: boolean;
}

function ChatInput({ onSend, disabled = false }: ChatInputProps) {
  // disabled = false is a default value. Python: def f(disabled=False).
  const [draft, setDraft] = React.useState("");

  const handleClick = () => {
    if (draft.trim()) {     // trim() strips whitespace; "" is falsy → skip empties
      onSend(draft);        // call the PARENT's function — this is "events up"
      setDraft("");         // clear our own local state
    }
  };

  return (
    <div>
      {/* value={draft} makes this a "controlled input": React owns the value.
          onChange fires per keystroke; e is the browser change event, and
          e.target.value is the input's current text. More in §04. */}
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
// Used like this — the PARENT decides what "send" does:
//   <ChatInput onSend={(text) => addMessage(text)} disabled={isLoading} />

// === Definition: the children prop ============================================
// `children` is a built-in prop: whatever JSX you nest BETWEEN a component's
// opening and closing tags arrives as `children`. It's the composition primitive
// for wrappers (cards, modals, layouts). No Python equivalent.

interface CardProps {
  title: string;
  children: React.ReactNode; // ReactNode = anything renderable: JSX, string, array…
}

function Card({ title, children }: CardProps) {
  return (
    <div className="card">
      <h3>{title}</h3>
      <div className="card-body">{children}</div>
    </div>
  );
}
// Used like this — note where each prop comes from:
//
//   <Card title="Chat">                 ← title is a normal attribute prop
//     <MessageBubble role="user" .../>  ← everything nested here becomes
//   </Card>                               Card's `children` prop, rendered
//                                         where {children} appears above.
//
// So `title` and `children` are both just props; one is written as an attribute,
// the other as nested content.

// === Prop drilling (the problem Context solves) ==============================
// To get data to a deeply nested child, you pass it as props through every
// component in between. That's "prop drilling" — fine for 2–3 levels, tedious
// deeper. Context (§04) is the escape hatch.

export { MessageBubble, ChatInput, Card };
