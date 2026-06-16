/*
  Narrowing — letting runtime checks shrink TypeScript's view of a type.

  PROBLEM
  -------
  A function receives a value typed as `string | number`. You want to call
  `.toUpperCase()` on it — but TypeScript won't let you, because `.toUpperCase()`
  doesn't exist on numbers. You know at this point in the code it's a string, but
  TypeScript doesn't. You need a way to prove it to the compiler so it stops
  complaining and you can use string-only methods.

  CONCEPT
  -------
  Narrowing is a runtime check that TypeScript understands at compile time. After
  `if (typeof x === "string")`, TypeScript knows x is a string inside that block
  and treats it accordingly. The same mechanism powers discriminated unions: check
  a `type` (or `status`) field once, and TypeScript knows the full shape in each
  branch. This is also why the async state machine in §04 works — `status === "success"`
  narrows the type to the one variant that has `data`.

  KEY INSIGHT
  -----------
  TypeScript's narrowing is its killer feature: a runtime check (typeof,
  instanceof, === on a discriminant) becomes a compile-time type proof inside
  each branch. You write one check; the type system does the rest.

  IN THIS FILE
  ------------
  • typeof narrowing — string | number, narrowed per branch
  • Discriminated unions — the `type` field as discriminant (the §04 pattern)
  • Type guard functions — `msg is TextMessage` as a return type predicate
  • null/undefined narrowing — ?? (nullish coalescing) vs Python's `or`

  PYTHON ANALOGY
  --------------
  isinstance() checks — mypy narrows inside the if block exactly the same way:
    if isinstance(x, str):  # mypy knows x is str inside this block
        x.upper()
  TypeScript does the same with typeof, === on a discriminant, or a type guard.
*/

// Run this file: tsx 02-typescript/04-narrowing.ts

// ── typeof narrowing ──────────────────────────────────────────────────────────
// PURPOSE: shows the most basic form — TypeScript reads `typeof x === "string"`
// and narrows x in each branch. No special syntax; it's just an if statement.

function formatId(id: string | number): string {
  if (typeof id === "string") {
    // Inside here TypeScript KNOWS id is string — .toUpperCase() is valid.
    return id.toUpperCase();
  }
  // Here id must be number (the only remaining case) — .toFixed() is valid.
  return id.toFixed(0);
}

// ── Discriminated union ────────────────────────────────────────────────────────
// PURPOSE: the most common narrowing pattern in React/TS code. Each variant has
// a `type` field with a unique literal value; TypeScript uses that field to narrow
// the full union in a switch or if-chain. This is the same mechanism as FetchState
// in §04 — check `status`, TypeScript gives you the right variant's fields.

interface TextMessage {
  type: "text";   // the "discriminant" field — a unique literal per variant
  content: string;
}

interface ImageMessage {
  type: "image";
  url: string;
  altText?: string;
}

type ChatMessage = TextMessage | ImageMessage;

function renderMessage(msg: ChatMessage): string {
  if (msg.type === "text") {
    return msg.content;            // TS knows msg is TextMessage here
  }
  // TS knows msg is ImageMessage here — .url is valid, .content is not
  return `<img src="${msg.url}" alt="${msg.altText ?? ""}" />`;
}

// ── Type guard function ────────────────────────────────────────────────────────
// PURPOSE: a function with a return type predicate (`msg is TextMessage`) — the
// manual version for cases where typeof isn't enough. After calling it in an if,
// TypeScript narrows inside the branch exactly as with typeof.
// Python: def is_text(m: ChatMessage) -> TypeGuard[TextMessage]:

function isTextMessage(msg: ChatMessage): msg is TextMessage {
  return msg.type === "text";
}

function processMessage(msg: ChatMessage): void {
  if (isTextMessage(msg)) {
    console.log("Text:", msg.content);  // narrowed to TextMessage
  } else {
    console.log("Image URL:", msg.url); // narrowed to ImageMessage
  }
}

// ── null / undefined narrowing ─────────────────────────────────────────────────
// PURPOSE: the most common real-world narrowing — checking that something exists
// before using it. ?? (nullish coalescing) is the clean way to provide a default.

interface User {
  name: string;
  bio: string | null;
}

function getUserBio(user: User): string {
  // ?? returns the right side only if the left is null or undefined.
  // Different from Python's `or`: ?? doesn't match all falsy values — it skips
  // "" and 0, treating them as legitimate values. Python's `or` would fall through.
  return user.bio ?? "No bio yet.";
}

// Demo:
console.log(formatId("msg-001"));   // "MSG-001"
console.log(formatId(42));          // "42"

const textMsg: ChatMessage = { type: "text", content: "Hello!" };
const imgMsg: ChatMessage = { type: "image", url: "avatar.png", altText: "avatar" };

console.log(renderMessage(textMsg));
console.log(renderMessage(imgMsg));
processMessage(textMsg);
processMessage(imgMsg);
console.log(isTextMessage(imgMsg));  // false

console.log(getUserBio({ name: "Alice", bio: null }));         // "No bio yet."
console.log(getUserBio({ name: "Bob", bio: "ML researcher" })); // "ML researcher"
