/*
  A COMPONENT is a function that returns JSX — a description of what to render.
  React calls your function, takes the returned JSX, and turns it into DOM nodes.

  Python analogy: a function that accepts data and returns a description of output.
  But unlike a Python print function, React re-calls it automatically whenever
  the component's state or props change.

  This file is a READ-FIRST reference. It's not a standalone runnable file —
  see playground/ for the live app.
*/

import React from "react";

// === THE SIMPLEST COMPONENT ===================================================
// A component is just a function that returns JSX (the HTML-like syntax).
// The function name MUST start with a capital letter — React uses this to
// distinguish components (capital) from plain HTML tags (lowercase).

function Greeting() {
  // JSX: this looks like HTML but it's actually JavaScript function calls.
  // <h1>Hello!</h1>  compiles to  React.createElement("h1", null, "Hello!")
  // There's no direct Python equivalent for JSX — it's syntax sugar for function calls.
  return <h1>Hello!</h1>;
}

// === COMPONENT WITH DYNAMIC DATA ==============================================
// Curly braces {} inside JSX switch back to "JavaScript mode".
// Python f-string equivalent: {variable}  inside an f"..." string.

interface WelcomeProps {
  username: string;
}

function Welcome({ username }: WelcomeProps) {
  const greeting = `Welcome back, ${username}!`;
  return (
    // Parentheses around multi-line JSX — purely for formatting; no semantic meaning.
    <div className="welcome-banner">
      {/* This is a JSX comment — curly braces + /* */}
      <h2>{greeting}</h2>
      <p>You have new messages.</p>
    </div>
  );
  // Note: className instead of class — "class" is a reserved word in JavaScript.
  // React maps className → the HTML class attribute.
}

// === COMPOSING COMPONENTS =====================================================
// Components nest inside each other, forming the component tree.
// The parent renders children by using them like HTML tags.

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

function MessageBubble({ role, content }: { role: string; content: string }) {
  // Inline style — a JavaScript object where CSS property names are camelCase.
  // Python: there's no equivalent; this is React-specific.
  const bgColor = role === "user" ? "#2563eb" : "#e5e7eb";
  const textColor = role === "user" ? "white" : "black";

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

  // Renders two MessageBubble components nested inside a div.
  // Each <MessageBubble ... /> is a call to the MessageBubble function.
  return (
    <div>
      <Welcome username="alice" />
      {messages.map(msg => (
        <MessageBubble key={msg.id} role={msg.role} content={msg.content} />
      ))}
    </div>
  );
}

// === FRAGMENTS ================================================================
// React components must return ONE root element. If you don't want an extra
// <div> wrapper, use a Fragment — it renders nothing in the DOM.
// Python: there's no equivalent; this is a React-specific constraint.

function TwoThings() {
  return (
    <>  {/* shorthand for <React.Fragment> */}
      <p>First thing</p>
      <p>Second thing</p>
    </>
  );
}

export { Greeting, Welcome, MessageBubble, ChatView, TwoThings };
