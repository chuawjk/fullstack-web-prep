/*
  In TypeScript you describe the SHAPE of an object with either:
    interface  — the traditional way; can be extended (merged) with other interfaces
    type       — more flexible; can describe unions, intersections, and computed types

  Python equivalents:
    interface → TypedDict, or a Pydantic BaseModel
    type      → a type alias: MyType = Union[str, int]

  Rule of thumb: use `interface` for objects, `type` for everything else.
*/

// Run this file: tsx 02-typescript/02-interfaces-and-types.ts

// === INTERFACE ================================================================
// Describes the required properties (and types) that an object must have.
// TypeScript checks that every usage provides all non-optional fields.

interface Message {
  id: string;
  role: "user" | "assistant";  // a LITERAL UNION — only these exact strings are valid
  content: string;
  createdAt: string;
}

interface User {
  id: string;
  email: string;
  displayName?: string;  // ? means OPTIONAL. Python: Optional[str]  or  str | None
}

// Using the interface — TypeScript validates the shape at compile time:
const msg: Message = {
  id: "msg-1",
  role: "user",
  content: "What is TypeScript?",
  createdAt: new Date().toISOString(),
  // adding an unknown field here would be a compile error ("excess property check")
};

// === EXTENDING AN INTERFACE ===================================================
// One interface can inherit from another using `extends`.
// Python equivalent: class AssistantMessage(Message): ...  (inheriting a TypedDict)

interface AssistantMessage extends Message {
  model: string;       // new required field
  tokenCount?: number; // new optional field
}

const reply: AssistantMessage = {
  id: "msg-2",
  role: "assistant",
  content: "TypeScript is a typed superset of JavaScript.",
  createdAt: new Date().toISOString(),
  model: "gpt-4o",
};

// === TYPE ALIAS ===============================================================
// `type` can name any type expression — not just object shapes.

// A named union (like an enum but lighter):
type Role = "user" | "assistant" | "system";

// A function signature type:
type MessageHandler = (message: Message) => void;

// An intersection (&) combines two types. The result must satisfy BOTH.
// Python: there's no direct equivalent. Closest is multiple inheritance.
type TimestampedUser = User & { createdAt: string; lastSeen: string };

// === STRUCTURAL TYPING ========================================================
// TypeScript uses STRUCTURAL typing: if an object has the required SHAPE,
// it's accepted — the declared type name doesn't matter.
// Python's mypy is also structural (duck typing at the type level).
// Java/C# are NOMINAL: a type must explicitly declare what it implements.

function printMessage(m: Message): void {
  console.log(`[${m.role}] ${m.content}`);
}

// This object was never declared `: Message`, but its shape matches —
// TypeScript accepts it. The "extra" fields (model, tokenCount) are fine too.
printMessage(reply);  // valid due to structural typing

// === readonly ================================================================
// Mark properties as immutable. Python equivalent: frozen=True in @dataclass,
// or a Final annotation.
interface ChatSession {
  readonly id: string;   // cannot be changed after creation
  userId: string;
  messages: Message[];
}

const session: ChatSession = { id: "s-1", userId: "u-1", messages: [msg] };
// session.id = "s-2";  // ← error: Cannot assign to 'id' because it is a read-only property

console.log(`Message: ${msg.content}`);
console.log(`Reply from ${reply.model}: ${reply.content}`);
console.log(`Session has ${session.messages.length} message(s)`);
