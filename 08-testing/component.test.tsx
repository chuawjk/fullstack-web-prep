/*
  Component tests with React Testing Library — props + user events → DOM.

  PROBLEM
  -------
  A unit test tells you a function returns the right value, but a React component's
  contract is different: given certain props and user interactions, what appears on
  screen? You need a test that renders the component into a fake DOM, simulates user
  actions the way a real user would, and asserts on what's visible — without coupling
  to internal state, CSS class names, or implementation details that change on every
  refactor.

  CONCEPT
  -------
  React Testing Library renders components into jsdom (a fake browser environment)
  and provides queries that mirror how users and screen readers perceive the page:
  by role, label text, visible text — not by markup. The query priority list
  (getByRole → getByLabelText → getByText → getByTestId) is a confidence scale:
  queries higher on the list survive refactors better because they're closer to
  what the user actually perceives.

  KEY INSIGHT
  -----------
  Query by what the user sees, not by what the code does. `getByRole("button",
  { name: /send/i })` survives a markup refactor; `getByClassName("btn-primary")`
  doesn't. Use `queryBy` (not `getBy`) when asserting something is NOT present.

  IN THIS FILE
  ------------
  • MessageBubble tests — getByText, role labels
  • ChatInput tests     — getByRole, getByLabelText, fireEvent, vi.fn() mock
  • MessageList tests   — empty state, presence/absence with queryByText

  PYTHON ANALOGY
  --------------
  Playwright's user-visible approach to queries, applied at the component level —
  no real browser (jsdom fakes it), but the querying philosophy is the same.

  Run: npm run 08:test
*/

import React, { useState } from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";  // adds matchers: toBeInTheDocument, toBeDisabled, etc.

// ── Components under test ─────────────────────────────────────────────────────
// PURPOSE: defined inline to keep this file self-contained. In a real project
// these would be imported from src/components/...

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

function MessageBubble({ message }: { message: Message }) {
  return (
    <div
      data-testid={`message-${message.id}`}  // data-testid: the LAST-RESORT hook — no user meaning; the tests below prefer getByText/getByRole
      className={`message message--${message.role}`}
    >
      <span>{message.content}</span>
      <small>{message.role === "user" ? "You" : "Assistant"}</small>
    </div>
  );
}

function ChatInput({ onSend }: { onSend: (text: string) => void }) {
  const [draft, setDraft] = useState("");

  function handleSend() {
    if (draft.trim()) {
      onSend(draft);
      setDraft("");
    }
  }

  return (
    <div>
      <input
        value={draft}
        onChange={e => setDraft(e.target.value)}
        placeholder="Type a message…"
        aria-label="message input"  // aria-label enables getByLabelText query
      />
      <button onClick={handleSend} disabled={!draft.trim()}>
        Send
      </button>
    </div>
  );
}

function MessageList({ messages }: { messages: Message[] }) {
  return (
    <div>
      {messages.length === 0
        ? <p>No messages yet.</p>
        : messages.map(msg => <MessageBubble key={msg.id} message={msg} />)
      }
    </div>
  );
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("MessageBubble", () => {
  it("renders the message content", () => {
    // ARRANGE: create the data
    const msg: Message = { id: "1", role: "user", content: "Hello there!" };

    // ACT: render into the virtual DOM
    render(<MessageBubble message={msg} />);

    // ASSERT: getByText finds an element containing this text; throws if not found.
    expect(screen.getByText("Hello there!")).toBeInTheDocument();
  });

  it("shows 'You' label for user messages", () => {
    render(<MessageBubble message={{ id: "1", role: "user", content: "Hi" }} />);
    expect(screen.getByText("You")).toBeInTheDocument();
  });

  it("shows 'Assistant' label for assistant messages", () => {
    render(<MessageBubble message={{ id: "1", role: "assistant", content: "Hi" }} />);
    expect(screen.getByText("Assistant")).toBeInTheDocument();
  });
});

describe("ChatInput", () => {
  it("Send button is disabled when input is empty", () => {
    render(<ChatInput onSend={() => {}} />);

    // getByRole: find by ARIA role — the recommended first choice.
    // "button" matches <button>. {name: /send/i} matches accessible name (case-insensitive regex).
    const button = screen.getByRole("button", { name: /send/i });
    expect(button).toBeDisabled();  // toBeDisabled comes from @testing-library/jest-dom
  });

  it("Send button is enabled when input has text", () => {
    render(<ChatInput onSend={() => {}} />);

    const input = screen.getByLabelText("message input");  // finds by aria-label
    fireEvent.change(input, { target: { value: "Hello" } });
    // fireEvent: simulates a DOM event. For more realistic typing simulation
    // (keydown, keypress, keyup, etc.) use @testing-library/user-event instead.

    expect(screen.getByRole("button", { name: /send/i })).not.toBeDisabled();
  });

  it("calls onSend with the typed text when Send is clicked", () => {
    // ARRANGE: create a mock function to capture what onSend receives
    const mockOnSend = vi.fn();
    render(<ChatInput onSend={mockOnSend} />);

    // ACT: type a message and click Send
    const input = screen.getByLabelText("message input");
    fireEvent.change(input, { target: { value: "Test message" } });
    fireEvent.click(screen.getByRole("button", { name: /send/i }));

    // ASSERT: the callback was called with the right text
    expect(mockOnSend).toHaveBeenCalledOnce();
    expect(mockOnSend).toHaveBeenCalledWith("Test message");
  });

  it("clears the input after sending", () => {
    render(<ChatInput onSend={() => {}} />);

    const input = screen.getByLabelText("message input") as HTMLInputElement;
    fireEvent.change(input, { target: { value: "Hello" } });
    fireEvent.click(screen.getByRole("button", { name: /send/i }));

    expect(input.value).toBe("");
  });
});

describe("MessageList", () => {
  it("shows empty state when there are no messages", () => {
    render(<MessageList messages={[]} />);
    expect(screen.getByText("No messages yet.")).toBeInTheDocument();
  });

  it("renders all messages", () => {
    const messages: Message[] = [
      { id: "1", role: "user", content: "Hello" },
      { id: "2", role: "assistant", content: "Hi there!" },
    ];
    render(<MessageList messages={messages} />);

    expect(screen.getByText("Hello")).toBeInTheDocument();
    expect(screen.getByText("Hi there!")).toBeInTheDocument();
  });

  it("does not show empty state when messages exist", () => {
    const messages: Message[] = [{ id: "1", role: "user", content: "Hi" }];
    render(<MessageList messages={messages} />);

    // queryByText (vs getByText): returns null instead of throwing when not found.
    // Use queryBy when asserting something is NOT present.
    expect(screen.queryByText("No messages yet.")).not.toBeInTheDocument();
  });
});
