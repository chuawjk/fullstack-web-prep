/*
  NARROWING: TypeScript starts with a broad type (e.g. string | number)
  and lets you use runtime checks to "narrow" it to a specific type within
  a branch. Inside the branch TypeScript knows the narrower type.

  Python equivalent: isinstance() checks inside if-blocks.
    if isinstance(x, str):   # mypy knows x is str inside this block
        x.upper()

  TypeScript does the same: after  if (typeof x === "string")  TypeScript
  knows x is string for the rest of that block.
*/

// Run this file: tsx 02-typescript/04-narrowing.ts

// === typeof NARROWING =========================================================
// typeof returns a string at runtime: "string", "number", "boolean", etc.
// TypeScript reads these checks and narrows the type in each branch.

function formatId(id: string | number): string {
  if (typeof id === "string") {
    // Inside here TypeScript KNOWS id is string — .toUpperCase() is valid.
    return id.toUpperCase();
  }
  // Here id must be number (the only remaining case).
  return id.toFixed(0);  // .toFixed converts a number to a string with N decimal places
}

// === DISCRIMINATED UNION =====================================================
// The most common narrowing pattern in React/TS code.
// Each variant has a `type` field with a unique literal value —
// TypeScript uses that field to narrow the full union in a switch or if-chain.

interface TextMessage {
  type: "text";   // the "discriminant" field
  content: string;
}

interface ImageMessage {
  type: "image";
  url: string;
  altText?: string;
}

// The union: a ChatMessage can be either variant.
type ChatMessage = TextMessage | ImageMessage;

function renderMessage(msg: ChatMessage): string {
  if (msg.type === "text") {
    return msg.content;              // TS knows msg is TextMessage here
  }
  // TS knows msg is ImageMessage here — .url is valid, .content is not.
  return `<img src="${msg.url}" alt="${msg.altText ?? ""}" />`;
}

// === TYPE GUARD FUNCTION ======================================================
// A function with a RETURN TYPE PREDICATE: "value is SomeType".
// This is the manual version for cases where typeof isn't enough.
// Python equivalent: def is_text(m: ChatMessage) -> TypeGuard[TextMessage]:

function isTextMessage(msg: ChatMessage): msg is TextMessage {
  return msg.type === "text";
}

// After calling isTextMessage() in an if, TypeScript narrows inside:
function processMessage(msg: ChatMessage): void {
  if (isTextMessage(msg)) {
    console.log("Text:", msg.content);  // narrowed to TextMessage
  } else {
    console.log("Image URL:", msg.url); // narrowed to ImageMessage
  }
}

// === null / undefined NARROWING ===============================================
// The most common real-world narrowing: checking that something exists.

interface User {
  name: string;
  bio: string | null;  // bio might not be set yet
}

function getUserBio(user: User): string {
  // Nullish coalescing (??): return the right side if the left is null or undefined.
  // Different from Python's `or`: ?? only matches null/undefined, not all falsy values.
  // Python: user.bio or "No bio yet"  (but "0" or "" would also fall through in Python)
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
