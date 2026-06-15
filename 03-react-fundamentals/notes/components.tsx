/*
  A component is a function that returns JSX — the description React turns into
  DOM. React calls your function for you (see notes/mental-model.ts); you never
  call it directly. It re-calls automatically whenever the component's state or
  props change.

  Python analogy: a function that takes data and returns a description of output —
  except React decides when to run it, and runs it again on every change.

  READING GUIDE for this whole folder:
    • `function Thing() { ... }`     is a DEFINITION — what the component is.
    • `<Thing />` inside another      is a CALL SITE — a description that tells
      component's returned JSX         React "call Thing here". It is NOT you
                                       calling Thing; React makes the call.
  Definitions and call sites are labelled below so the two never blur together.

  This file is a READ-FIRST reference, not a runnable — see playground/ for the
  live app.
*/

import React from "react";

// === Definition: the simplest component =======================================
// A component is just a function that returns JSX (the HTML-like syntax).
// Its name MUST start with a capital letter — React uses the capital to tell a
// component (<Greeting/>) apart from a plain HTML tag (<div/>).

function Greeting() {
  // JSX looks like HTML but compiles to function calls:
  //   <h1>Hello!</h1>  →  React.createElement("h1", null, "Hello!")
  // No Python equivalent — it's syntax sugar for those createElement calls.
  return <h1>Hello!</h1>;
}

// === Definition: a component with dynamic data ================================
// Curly braces {} inside JSX drop back into "JavaScript mode" to evaluate an
// expression and insert the result. (Python's nearest cousin is {x} inside an
// f-string — but JSX inserts the value, not necessarily a string.)

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
  );
  // className, not class — "class" is a reserved word in JS, so React renames it.
}

// === Definition: composing components =========================================
// Components nest inside each other to form the component tree. A parent uses a
// child by writing it like a tag — that tag is a CALL SITE for the child.

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

function MessageBubble({ role, content }: { role: string; content: string }) {
  // role === "user" ? A : B   is a ternary — JS's inline if/else.
  // Python: A if role == "user" else B   (note the different word order).
  const bgColor = role === "user" ? "#2563eb" : "#e5e7eb";
  const textColor = role === "user" ? "white" : "black";

  // style takes a JS object; the double braces are { (JS mode) + { (the object) }.
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
          description — React then calls MessageBubble once per message.
          Python: [MessageBubble(...) for msg in messages]. `key` is identity
          metadata for React's diffing, not a prop MessageBubble receives. */}
      {messages.map(msg => (
        <MessageBubble key={msg.id} role={msg.role} content={msg.content} />
      ))}
    </div>
  );
}

// === Definition: fragments ====================================================
// A component must return ONE root element. When you don't want a real wrapping
// <div> in the DOM (it can break flexbox/grid or invalid table/list nesting),
// wrap the siblings in a Fragment — it groups them but renders nothing itself.

function TwoThings() {
  return (
    <>  {/* shorthand for <React.Fragment> */}
      <p>First thing</p>
      <p>Second thing</p>
    </>
  );
}

export { Greeting, Welcome, MessageBubble, ChatView, TwoThings };
