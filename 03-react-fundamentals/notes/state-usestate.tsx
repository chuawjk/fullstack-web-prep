/*
  useState is React's hook for LOCAL MUTABLE STATE — data owned by a component
  that can change over time. When state changes, React re-renders that component
  (and any children that receive the state as props).

  "Hook" — a function whose name starts with `use` that ties into React's
  rendering system. You can only call hooks at the TOP LEVEL of a component,
  never inside loops or conditions.

  Python analogy: instance variables on a class, but mutation always goes through
  a setter function that also triggers a "redraw". Like:
    self.count = 0
    def set_count(v): self.count = v; self.redraw()
*/

import React, { useState } from "react";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

// === BASIC useState ============================================================
// useState(initialValue) returns a PAIR: [currentValue, setterFunction]
// The destructuring [count, setCount] names them.
// Python equivalent: (value, setter) = use_state(0)  — but this doesn't exist in Python.

function Counter() {
  const [count, setCount] = useState(0);
  // count   — the current value (read-only; never mutate directly)
  // setCount — the function that updates the value AND triggers a re-render

  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={() => setCount(count + 1)}>+1</button>
      {/* setCount(count + 1) — creates a NEW value; never do setCount.count++ */}
    </div>
  );
}

// === STATE WITH OBJECTS =======================================================
// When state is an object, ALWAYS replace the whole object — don't mutate it.
// React compares by reference; mutating in-place won't trigger a re-render.
// Python analogy: treat state like an immutable value (frozen dataclass).

function ChatApp() {
  // useState with a type parameter for TypeScript safety.
  // Initial value: an array of Message objects.
  const [messages, setMessages] = useState<Message[]>([
    { id: "1", role: "assistant", content: "Hi! Ask me anything." },
  ]);

  const [draft, setDraft] = useState("");  // the text currently in the input box

  function sendMessage() {
    if (!draft.trim()) return;  // don't send empty messages

    const newMessage: Message = {
      id: String(Date.now()),  // a quick unique-enough ID for a demo
      role: "user",
      content: draft,
    };

    // SPREAD to create a NEW array — never push() into the existing one.
    // Python equivalent: messages = [*messages, new_message]  (creating a new list)
    setMessages([...messages, newMessage]);
    setDraft("");  // clear the input
  }

  return (
    <div>
      {messages.map(msg => (
        <div key={msg.id} className={`message message--${msg.role}`}>
          {msg.content}
        </div>
      ))}
      <div className="composer">
        <input
          value={draft}
          onChange={e => setDraft(e.target.value)}  // controlled input — see §04
          placeholder="Type a message…"
        />
        <button onClick={sendMessage}>Send</button>
      </div>
    </div>
  );
}

// === WHEN DOES RE-RENDER HAPPEN? ==============================================
// React re-renders a component when:
//   1. Its OWN state changes (via a setter)
//   2. Its PARENT re-renders (and possibly passes new props)
//   3. Its CONTEXT value changes (§04)
//
// React does NOT re-render when:
//   - You mutate state in-place (it didn't "see" the change)
//   - An unrelated component changes its state

// === FUNCTIONAL UPDATER FORM ==================================================
// When new state depends on old state, use the function form of the setter.
// This avoids stale-closure bugs (see: closures capture the value at render time).
// Python: there's no equivalent; this is specific to React's rendering model.

function SafeCounter() {
  const [count, setCount] = useState(0);

  function increment() {
    // Instead of setCount(count + 1) — which reads `count` from the closure —
    // pass a function: React calls it with the CURRENT value.
    setCount(prev => prev + 1);  // `prev` is guaranteed to be the latest value
  }

  return <button onClick={increment}>Count: {count}</button>;
}

export { Counter, ChatApp, SafeCounter };
