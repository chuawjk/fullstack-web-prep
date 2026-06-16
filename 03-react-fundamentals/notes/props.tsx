/*
  Props — data flowing from parent to child, callbacks flowing back up.

  PROBLEM
  -------
  You have a MessageBubble that needs the message content, role, and timestamp.
  The parent component has all of this. How do you get it to the child without
  making it a global? And when the user clicks Send in a child input component,
  how does the parent find out — the child can't reach up and change the parent's
  state directly?

  CONCEPT
  -------
  Props are a component's inputs — data flowing one way, from parent to child.
  They're function arguments: `<Button label="Send" onClick={fn}/>` is like calling
  `button(label="Send", on_click=fn)`, except React makes the call. Events travel
  back up via callback props: the parent passes a function down; the child calls
  it when something happens. A child never mutates parent state — it only invokes
  a function the parent gave it.

  KEY INSIGHT
  -----------
  Data flows down as props; events flow up as callbacks. One direction, always.
  A child that wants to change its parent's state calls a function the parent
  handed it — it cannot reach up directly.

  IN THIS FILE
  ------------
  • Basic typed props (MessageBubble — role, content, optional timestamp)
  • Callback props (ChatInput — onSend: the "events up" pattern)
  • The children prop (Card — whatever JSX is nested between tags)
  • Prop drilling — the problem Context solves in §04

  PYTHON ANALOGY
  --------------
  Function keyword arguments — writing <Button label="Send" onClick={fn}/> is
  like calling button(label="Send", on_click=fn). React makes the actual call.

  Read-first reference; live versions are in playground/.
*/

import React from "react";

// ── Basic props (DEFINITION) ──────────────────────────────────────────────────
// PURPOSE: shows the standard pattern — declare props as an interface, destructure
// in the parameter, use optional (?) for fields that aren't always provided.

interface MessageBubbleProps {
  role: "user" | "assistant";
  content: string;
  timestamp?: string; // ? = optional. Python: Optional[str]
}

function MessageBubble({ role, content, timestamp }: MessageBubbleProps) {
  // Destructuring pulls role/content/timestamp out of the single props object.
  // Python: def f(*, role, content, timestamp=None)
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
// Call site:  <MessageBubble role="user" content="Hello" timestamp="09:14" />

// ── Callback props — events flowing up (DEFINITION) ───────────────────────────
// PURPOSE: shows how a child triggers something in the parent. The parent passes
// a function down; the child calls it. The parent decides what "send" does;
// the child just knows a message was typed and Send was clicked.

interface ChatInputProps {
  onSend: (text: string) => void; // a function type: takes a string, returns nothing
  disabled?: boolean;
}

function ChatInput({ onSend, disabled = false }: ChatInputProps) {
  // disabled = false is a default value. Python: def f(disabled=False)
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
          onChange fires per keystroke; e.target.value is the current text.
          Covered in detail in §04/controlled-inputs.tsx. */}
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
// Call site — the PARENT decides what "send" does:
//   <ChatInput onSend={(text) => addMessage(text)} disabled={isLoading} />

// ── The children prop (DEFINITION) ────────────────────────────────────────────
// PURPOSE: `children` is a built-in prop — whatever JSX you nest BETWEEN a
// component's opening and closing tags arrives here. It's the composition
// primitive for wrappers (cards, modals, layouts).
// There's no Python equivalent.

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
// Call site — note where each prop comes from:
//
//   <Card title="Chat">                 ← title is a normal attribute prop
//     <MessageBubble role="user" .../>  ← everything nested here becomes
//   </Card>                               Card's `children` prop

// ── Prop drilling (the problem Context solves) ────────────────────────────────
// PURPOSE: names the anti-pattern so the §04 solution has a clear target.
// To get data to a deeply nested child you pass it as props through every
// intermediate component. Fine for 2–3 levels; Context (§04) is the escape hatch
// when it gets deeper.

export { MessageBubble, ChatInput, Card };
