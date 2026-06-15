/*
  useState gives a component LOCAL state — a value it owns that survives between
  renders and, when changed, triggers a new render. From notes/mental-model.ts:
  a "render" is React calling your function again. So the loop is:
      setX(newValue)  →  React calls the component again  →  it reads the new X.
  setX does NOT mutate a variable in place. It schedules the re-call.

  "Hook" = a function whose name starts with `use` that plugs into React's render
  system. Call hooks only at the TOP LEVEL of a component — never in a loop or if.

  Python analogy: an instance attribute whose setter also triggers a redraw —
      self.count = 0
      def set_count(v): self.count = v; self.redraw()

  Read-first reference; live versions in playground/.
*/

import React, { useState } from "react";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

// === Definition: basic useState ===============================================
// useState(initial) returns a PAIR: [currentValue, setter]. The array
// destructuring [count, setCount] just names the two slots.

function Counter() {
  const [count, setCount] = useState(0);
  // count    — the current value for THIS render (a const; never mutate it)
  // setCount — schedules a re-render with a new value

  return (
    <div>
      <p>Count: {count}</p>
      {/* setCount(count + 1) computes a NEW value and asks React to re-run
          Counter. On that next call, useState hands back the new count.
          Never write count++ — that mutates in place, and React won't notice. */}
      <button onClick={() => setCount(count + 1)}>+1</button>
    </div>
  );
}

// === Definition: state that holds an object/array =============================
// Always REPLACE the whole value, never mutate it. React compares the old and
// new value by reference; an in-place mutation looks identical, so no re-render.
// Python analogy: treat state like a frozen dataclass — build a new one.

function ChatApp() {
  const [messages, setMessages] = useState<Message[]>([
    { id: "1", role: "assistant", content: "Hi! Ask me anything." },
  ]);
  const [draft, setDraft] = useState(""); // text currently in the input

  function sendMessage() {
    if (!draft.trim()) return;

    const newMessage: Message = {
      id: String(Date.now()),
      role: "user",
      content: draft,
    };

    // Spread into a NEW array — never messages.push(...).
    // Python: messages = [*messages, new_message]
    setMessages([...messages, newMessage]);
    setDraft("");
  }

  return (
    <div>
      {/* CALL SITE x N: one <div> description per message; React diffs the new
          list against the old and adds only the new node (see mental-model.ts). */}
      {messages.map(msg => (
        <div key={msg.id} className={`message message--${msg.role}`}>
          {msg.content}
        </div>
      ))}
      <div className="composer">
        <input
          value={draft}
          onChange={e => setDraft(e.target.value)} // controlled input — see §04
          placeholder="Type a message…"
        />
        <button onClick={sendMessage}>Send</button>
      </div>
    </div>
  );
}

// === When does a re-render happen? ============================================
// React re-calls a component when:
//   1. its OWN state changes (a setter ran)
//   2. its PARENT re-rendered (and may pass new props)
//   3. its CONTEXT value changed (§04)
// It does NOT re-call when:
//   • you mutate state in place (React never saw a change)
//   • an unrelated component updates its own state

// === Definition: the functional updater form =================================
// Because each render is a separate call, the `count` inside a handler is frozen
// at the value from THAT render (a closure over that frame). If you update based
// on the previous value, pass a function — React calls it with the latest value,
// avoiding a stale read. (This is a direct consequence of "render = another call".)

function SafeCounter() {
  const [count, setCount] = useState(0);

  function increment() {
    // Not setCount(count + 1) — `count` is this render's frozen value.
    setCount(prev => prev + 1); // `prev` is guaranteed to be the latest value
  }

  return <button onClick={increment}>Count: {count}</button>;
}

export { Counter, ChatApp, SafeCounter };
