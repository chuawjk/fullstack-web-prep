/*
  useState — giving a component local state that survives re-renders.

  PROBLEM
  -------
  You want to track how many messages are in a chat. A plain variable doesn't
  work: JavaScript lets you declare `let count = 0` and increment it, but that
  variable lives inside the function body — it resets to 0 every time React calls
  the function again. You need a value that persists across calls AND, when
  changed, tells React to call the function again so the UI shows the new value.

  CONCEPT
  -------
  useState gives a component a "slot" — a value stored outside the function that
  survives between calls. When you call the setter, React schedules another call
  to your component. On that next call, useState hands back the new value. The
  slot isn't a variable you mutate; it's a value you replace by calling the setter.
  From mental-model.ts: the slot list lives outside the function; the function
  reads from it on each call and fills in its `const`.

  KEY INSIGHT
  -----------
  setX(newValue) does not update a variable — it schedules another call to your
  component with newValue stored in the slot. count is a const; it never changes
  within one render. It's different on the next render because the slot changed.

  IN THIS FILE
  ------------
  • Basic useState — the [value, setter] pair
  • State holding arrays/objects — always replace, never mutate in place
  • When re-renders happen (and when they don't)
  • The functional updater form — prev => prev + 1 (safe against stale closures)

  PYTHON ANALOGY
  --------------
  An instance attribute whose setter also calls self.redraw():
    self.count = 0
    def set_count(v): self.count = v; self.redraw()
  Except the "attribute" is an external slot and the "instance" is the slot list.

  Read-first reference; live versions in playground/.
*/

import React, { useState } from "react";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

// ── Basic useState (DEFINITION) ───────────────────────────────────────────────
// PURPOSE: shows the [value, setter] pair and the two things to know about each:
// `count` is a const for this render; `setCount` schedules a fresh call with a
// new value in the slot.

function Counter() {
  const [count, setCount] = useState(0);
  // count    — the current value for THIS render (a const; never mutate it)
  // setCount — schedules a re-render with a new value in the slot

  return (
    <div>
      <p>Count: {count}</p>
      {/* setCount(count + 1) computes a new value and asks React to re-run
          Counter. On that next call, useState hands back the new count.
          Never write count++ — that mutates in place, and React won't notice. */}
      <button onClick={() => setCount(count + 1)}>+1</button>
    </div>
  );
}

// ── State holding an object/array (DEFINITION) ────────────────────────────────
// PURPOSE: shows the "always replace, never mutate" rule. React compares old and
// new value by reference; an in-place mutation looks identical, so no re-render.
// Python analogy: treat state like a frozen dataclass — build a new one.

function ChatApp() {
  const [messages, setMessages] = useState<Message[]>([
    { id: "1", role: "assistant", content: "Hi! Ask me anything." },
  ]);
  const [draft, setDraft] = useState("");

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
      {/* CALL SITE x N: one <div> description per message. React diffs the new
          list against the old and adds only the new node (see mental-model.ts). */}
      {messages.map(msg => (
        <div key={msg.id} className={`message message--${msg.role}`}>
          {msg.content}
        </div>
      ))}
      <div className="composer">
        <input
          value={draft}
          onChange={e => setDraft(e.target.value)}
          placeholder="Type a message…"
        />
        <button onClick={sendMessage}>Send</button>
      </div>
    </div>
  );
}

// ── When re-renders happen ────────────────────────────────────────────────────
// React re-calls a component when:
//   1. its OWN state changes (a setter ran)
//   2. its PARENT re-rendered (and may pass new props)
//   3. its CONTEXT value changed (§04)
// It does NOT re-call when:
//   • you mutate state in place (React never saw a new reference)
//   • an unrelated component updates its own state

// ── Functional updater form (DEFINITION) ──────────────────────────────────────
// PURPOSE: each render is a separate function call with frozen locals. A handler
// that reads `count` gets the value from THAT render's call. If two updates queue
// up before React re-renders, the second one reads stale data. Passing a function
// instead tells React: "call this with the true current value, whatever it is."

function SafeCounter() {
  const [count, setCount] = useState(0);

  function increment() {
    // Not setCount(count + 1) — `count` is frozen at this render's value.
    setCount(prev => prev + 1); // `prev` is guaranteed to be the latest slot value
  }

  return <button onClick={increment}>Count: {count}</button>;
}

export { Counter, ChatApp, SafeCounter };
