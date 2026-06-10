/*
  COMPONENT TESTS with React Testing Library.

  RTL renders components into a virtual DOM (jsdom) and lets you interact with
  them the way a user would: by finding text on screen, clicking buttons, typing.

  Philosophy: "The more your tests resemble the way your software is used,
  the more confidence they give you." — Kent C. Dodds

  This means: prefer queries that find elements the way the user sees them
  (by role, label, text) over queries that rely on internal implementation
  (CSS class names, component state).

  Python analogy: closer to Playwright's "user-visible" approach than to
  unittest's "test the internals" approach.

  Run: npm run 08:test
*/

import React, { useState } from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";  // adds matchers: toBeInTheDocument, toBeDisabled, etc.

// === COMPONENTS UNDER TEST ===================================================
// In a real project these would be imported from src/components/...

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

function MessageBubble({ message }: { message: Message }) {
  return (
    <div
      data-testid={`message-${message.id}`}  // data-testid: a way to target elements in tests
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

// === TESTS ===================================================================

describe("MessageBubble", () => {
  it("renders the message content", () => {
    // ARRANGE: create the data
    const msg: Message = { id: "1", role: "user", content: "Hello there!" };

    // ACT: render the component into the virtual DOM
    render(<MessageBubble message={msg} />);

    // ASSERT: check what's on screen
    // getByText: find an element containing this text (throws if not found).
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

    // getByRole: find by ARIA role — the recommended way.
    // "button" matches <button>. {name: /send/i} matches the accessible name (text).
    // /send/i is a regex — case-insensitive match.
    const button = screen.getByRole("button", { name: /send/i });
    expect(button).toBeDisabled();  // toBeDisabled comes from @testing-library/jest-dom
  });

  it("Send button is enabled when input has text", () => {
    render(<ChatInput onSend={() => {}} />);

    const input = screen.getByLabelText("message input");  // finds by aria-label
    fireEvent.change(input, { target: { value: "Hello" } });
    // fireEvent: simulates a DOM event. For typing, also see userEvent.type() for
    // more realistic simulation (triggers keydown, keypress, keyup, etc.)

    expect(screen.getByRole("button", { name: /send/i })).not.toBeDisabled();
  });

  it("calls onSend with the typed text when Send is clicked", () => {
    // ARRANGE: create a mock function to capture what onSend is called with
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

    expect(screen.queryByText("No messages yet.")).not.toBeInTheDocument();
    // queryByText (vs getByText): returns null instead of throwing when not found.
    // Use queryBy when asserting something is NOT present.
  });
});

