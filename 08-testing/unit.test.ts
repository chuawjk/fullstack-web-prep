/*
  UNIT TESTS with Vitest — testing pure functions in isolation.

  Vitest's API mirrors pytest closely:
    describe("name", () => { ... })  ≈  class TestName:  or  a module grouping
    it("should ...", () => { ... })  ≈  def test_should_..():
    expect(actual).toBe(expected)    ≈  assert actual == expected

  Run: npm run 08:test
  Or:  npx vitest 08-testing/unit.test.ts
*/

import { describe, it, expect, vi } from "vitest";

// === THE CODE UNDER TEST ======================================================
// In a real project these would be imported from src/lib/chat.ts or similar.
// They're defined inline here to keep the file self-contained.

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
}

function formatMessage(role: string, content: string): string {
  return `[${role}] ${content}`;
}

function truncate(text: string, maxLen: number): string {
  if (text.length <= maxLen) return text;
  return text.slice(0, maxLen - 3) + "...";
}

function countTokensEstimate(text: string): number {
  // Very rough estimate: one token ≈ 4 characters (common rule of thumb for English).
  return Math.ceil(text.length / 4);
}

function sortMessagesByDate(messages: Message[]): Message[] {
  // slice() first so we don't mutate the input (pure function principle).
  return messages.slice().sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );
}

function getLastAssistantMessage(messages: Message[]): Message | undefined {
  // findLast: find the last element matching a condition.
  // Python: next((m for m in reversed(messages) if m.role == "assistant"), None)
  return [...messages].reverse().find(m => m.role === "assistant");
}

// === UNIT TESTS ==============================================================

describe("formatMessage", () => {
  // ARRANGE + ACT + ASSERT in one line for simple cases.
  // Python equivalent: assert format_message("user", "hello") == "[user] hello"

  it("wraps role and content in brackets", () => {
    expect(formatMessage("user", "hello")).toBe("[user] hello");
  });

  it("works for assistant role", () => {
    expect(formatMessage("assistant", "How can I help?")).toBe("[assistant] How can I help?");
  });

  it("handles empty content", () => {
    expect(formatMessage("user", "")).toBe("[user] ");
  });
});

describe("truncate", () => {
  it("returns the full string when it fits", () => {
    expect(truncate("Hello", 10)).toBe("Hello");
  });

  it("truncates and adds ellipsis when too long", () => {
    expect(truncate("Hello, world!", 8)).toBe("Hello...");
  });

  it("returns the full string when exactly at max length", () => {
    expect(truncate("Hello", 5)).toBe("Hello");
  });

  it("handles maxLen of 3 (minimum meaningful length)", () => {
    expect(truncate("Hello", 3)).toBe("...");
  });
});

describe("countTokensEstimate", () => {
  it("returns 1 for a 4-character string", () => {
    expect(countTokensEstimate("abcd")).toBe(1);
  });

  it("rounds up for non-multiples of 4", () => {
    expect(countTokensEstimate("abc")).toBe(1);  // ceil(3/4) = 1
    expect(countTokensEstimate("abcde")).toBe(2); // ceil(5/4) = 2
  });
});

describe("sortMessagesByDate", () => {
  const messages: Message[] = [
    { id: "3", role: "assistant", content: "Last", createdAt: "2024-01-03T00:00:00Z" },
    { id: "1", role: "user", content: "First", createdAt: "2024-01-01T00:00:00Z" },
    { id: "2", role: "user", content: "Second", createdAt: "2024-01-02T00:00:00Z" },
  ];

  it("sorts messages from oldest to newest", () => {
    const sorted = sortMessagesByDate(messages);
    expect(sorted[0].content).toBe("First");
    expect(sorted[1].content).toBe("Second");
    expect(sorted[2].content).toBe("Last");
  });

  it("does not mutate the input array", () => {
    const original = [...messages];
    sortMessagesByDate(messages);
    expect(messages[0].id).toBe(original[0].id);  // first element unchanged
  });
});

describe("getLastAssistantMessage", () => {
  it("returns the last assistant message", () => {
    const msgs: Message[] = [
      { id: "1", role: "assistant", content: "First bot reply", createdAt: "..." },
      { id: "2", role: "user", content: "User response", createdAt: "..." },
      { id: "3", role: "assistant", content: "Second bot reply", createdAt: "..." },
    ];
    expect(getLastAssistantMessage(msgs)?.content).toBe("Second bot reply");
  });

  it("returns undefined for an empty array", () => {
    expect(getLastAssistantMessage([])).toBeUndefined();
  });

  it("returns undefined when there are no assistant messages", () => {
    const userOnly: Message[] = [{ id: "1", role: "user", content: "Hello", createdAt: "..." }];
    expect(getLastAssistantMessage(userOnly)).toBeUndefined();
  });
});

// === MOCKING =================================================================
// vi.fn() creates a "mock function" — a fake that records its calls.
// Use it to replace real dependencies (API calls, DB queries, timers) so
// tests are fast, deterministic, and isolated.
// Python equivalent: unittest.mock.MagicMock() or pytest's mocker.Mock()

describe("mocking with vi.fn()", () => {
  it("records how many times a function was called", () => {
    const mockCallback = vi.fn();  // a fake function that records calls

    [1, 2, 3].forEach(mockCallback);

    // .toHaveBeenCalledTimes: assert the mock was called exactly N times.
    expect(mockCallback).toHaveBeenCalledTimes(3);
  });

  it("records what arguments it was called with", () => {
    const mockSend = vi.fn<[string], Promise<void>>();
    mockSend("hello");

    expect(mockSend).toHaveBeenCalledWith("hello");
  });

  it("can be configured to return a specific value", () => {
    const mockFetch = vi.fn().mockResolvedValue({ status: 200, data: [] });
    // mockResolvedValue: makes the mock return a resolved Promise.
    // Python equivalent: mocker.patch("requests.get", return_value=Mock(status_code=200))

    // The test can now call mockFetch() and get a predictable response
    // without any real network request.
    expect(mockFetch).toBeDefined();
  });
});
