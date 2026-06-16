/*
  Components — functions that return descriptions React turns into DOM.

  PROBLEM
  -------
  If you've only written Python functions and classes, JSX is visually surprising.
  `<Greeting />` looks like an HTML tag but it's calling a function — sort of. And
  `<div className="card">` looks like HTML but it's not. Before you can read React
  code fluently you need straight answers to three questions: what IS a component,
  what does `<Thing />` actually do, and why does the same syntax describe both a
  plain HTML element and a component function?

  CONCEPT
  -------
  A component is a plain function that returns JSX. JSX compiles to
  React.createElement() calls that produce plain objects describing the UI — not
  DOM nodes, not rendered output. React calls your function; you never call it
  directly. When state or props change, React calls it again. The distinction to
  internalize: `<Thing />` is not you calling Thing — it's a description telling
  React to call Thing.

  KEY INSIGHT
  -----------
  DEFINITION vs. CALL SITE: `function Thing() {}` is where you describe the
  component. `<Thing />` inside another component's JSX is a description telling
  React to call Thing — not you calling it. These two are labelled throughout this
  file because that's where the confusion lives.

  IN THIS FILE
  ------------
  • The simplest component and JSX syntax
  • Dynamic data with {} inside JSX
  • Composing components — nesting call sites
  • Fragments — grouping siblings without a real DOM wrapper

  PYTHON ANALOGY
  --------------
  A function that takes data and returns a description of output — except React
  decides when to run it and re-runs it automatically on state/props changes.

  Read-first reference; live versions are in playground/.
*/

import React from "react";

// ── The simplest component (DEFINITION) ──────────────────────────────────────
// PURPOSE: shows that a component is literally a function returning JSX. The
// capital letter on the name is required — React uses it to distinguish a
// component (<Greeting/>) from a plain HTML tag (<div/>).

function Greeting() {
  // JSX looks like HTML but compiles to function calls:
  //   <h1>Hello!</h1>  →  React.createElement("h1", null, "Hello!")
  // There's no Python equivalent — it's syntax sugar for createElement calls.
  return <h1>Hello!</h1>;
}

// ── Component with dynamic data (DEFINITION) ──────────────────────────────────
// PURPOSE: shows how {} inside JSX switches to "JavaScript mode" to evaluate
// an expression and insert the result — the slot for dynamic values.

interface WelcomeProps {
  username: string;
}

function Welcome({ username }: WelcomeProps) {
  const greeting = `Welcome back, ${username}!`;
  return (
    // Parentheses around multi-line JSX are formatting only — no meaning.
    <div className="welcome-banner">
      {/* This is a JSX comment. */}
      <h2>{greeting}</h2>
      <p>You have new messages.</p>
    </div>
    // className, not class — "class" is a reserved word in JS, so React renames it.
  );
}

// ── Composing components (DEFINITION + CALL SITES) ────────────────────────────
// PURPOSE: shows that components nest to form the component tree, and that
// `<MessageBubble ... />` inside ChatView is NOT you calling MessageBubble —
// it's a description that tells React to call MessageBubble when it processes
// ChatView's returned JSX.

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

function MessageBubble({ role, content }: { role: string; content: string }) {
  // Ternary: role === "user" ? A : B. Python: A if role == "user" else B
  // (note the different word order).
  const bgColor = role === "user" ? "#2563eb" : "#e5e7eb";
  const textColor = role === "user" ? "white" : "black";

  // style takes a JS object; the double braces are {(JS mode)} + {(the object)}.
  // CSS property names become camelCase: background-color → backgroundColor.
  return (
    <div style={{ background: bgColor, color: textColor, padding: "10px 14px", borderRadius: "12px" }}>
      {content}
    </div>
  );
}

function ChatView() {
  const messages: Message[] = [
    { id: "1", role: "user", content: "Hello!" },
    { id: "2", role: "assistant", content: "Hi there!" },
  ];

  return (
    <div>
      {/* CALL SITE: a description telling React to call Welcome (defined above)
          with username="alice". You are not calling Welcome here. */}
      <Welcome username="alice" />

      {/* CALL SITE x N: .map turns each Message into a <MessageBubble/>
          description — React calls MessageBubble once per message.
          Python: [MessageBubble(...) for msg in messages].
          `key` is identity metadata for React's diff, not a prop MessageBubble receives. */}
      {messages.map(msg => (
        <MessageBubble key={msg.id} role={msg.role} content={msg.content} />
      ))}
    </div>
  );
}

// ── Fragments (DEFINITION) ────────────────────────────────────────────────────
// PURPOSE: a component must return ONE root element. When you don't want a real
// wrapping <div> in the DOM (it can break flexbox/grid or invalid table nesting),
// wrap siblings in a Fragment — it groups them but renders nothing itself.

function TwoThings() {
  return (
    <>  {/* shorthand for <React.Fragment> */}
      <p>First thing</p>
      <p>Second thing</p>
    </>
  );
}

export { Greeting, Welcome, MessageBubble, ChatView, TwoThings };
