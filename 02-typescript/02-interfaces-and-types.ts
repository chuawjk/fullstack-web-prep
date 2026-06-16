/*
  Interfaces and type aliases — describing the shape of objects in TypeScript.

  PROBLEM
  -------
  In Python, passing a dict around gives you no guarantee at the call site that
  it has the right keys. If you build a message object and pass it to a function
  that expects an `id`, `role`, and `content`, nothing stops you from omitting
  one of them — until runtime. In TypeScript, you describe the required shape
  upfront, and the compiler catches mismatches before the code runs.

  CONCEPT
  -------
  Two tools for describing shapes: `interface` (for plain object shapes, can be
  extended) and `type` (for anything more complex: unions, intersections, function
  signatures, computed types). TypeScript checks by SHAPE, not by name — structural
  typing means any object with the right fields is accepted, regardless of how it
  was declared.

  KEY INSIGHT
  -----------
  TypeScript uses structural typing: if an object has the required shape, it's
  accepted — the declared type name doesn't matter. Java/C# are nominal (must
  explicitly declare what you implement); Python's mypy is also structural.

  IN THIS FILE
  ------------
  • interface — defining and using object shapes
  • Extending an interface (inheritance)
  • type aliases — named unions, function signatures, intersections (&)
  • Structural typing in action
  • readonly — immutable properties

  PYTHON ANALOGY
  --------------
  interface → TypedDict or a Pydantic BaseModel.
  type alias → Union[str, int] or a plain type alias.
  Rule of thumb: use `interface` for objects, `type` for everything else.
*/

// Run this file: tsx 02-typescript/02-interfaces-and-types.ts

// ── Interface ─────────────────────────────────────────────────────────────────
// PURPOSE: describes the required properties an object must have. TypeScript
// checks every usage provides all non-optional fields at compile time.

interface Message {
  id: string;
  role: "user" | "assistant";  // a LITERAL UNION — only these exact strings are valid
  content: string;
  createdAt: string;
}

interface User {
  id: string;
  email: string;
  displayName?: string;  // ? means OPTIONAL. Python: Optional[str]
}

const msg: Message = {
  id: "msg-1",
  role: "user",
  content: "What is TypeScript?",
  createdAt: new Date().toISOString(),
  // adding an unknown field here would be a compile error ("excess property check")
};

// ── Extending an interface ────────────────────────────────────────────────────
// PURPOSE: one interface can inherit from another using `extends` — same as
// class inheritance for TypedDicts in Python.

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

// ── Type alias ────────────────────────────────────────────────────────────────
// PURPOSE: `type` names any type expression — unions, function signatures,
// intersections. More flexible than interface, but can't be re-opened or merged.

type Role = "user" | "assistant" | "system";  // a named union (lighter than enum)

type MessageHandler = (message: Message) => void;  // a function signature type

// Intersection (&): the result must satisfy BOTH types simultaneously.
// Python: no direct equivalent; closest is multiple inheritance.
type TimestampedUser = User & { createdAt: string; lastSeen: string };

// ── Structural typing ─────────────────────────────────────────────────────────
// PURPOSE: shows that TypeScript accepts any object with the right shape,
// regardless of what it was declared as — including objects with extra fields.

function printMessage(m: Message): void {
  console.log(`[${m.role}] ${m.content}`);
}

// `reply` was never declared `: Message`, but its shape matches Message
// (it has all required fields, plus extras). TypeScript accepts it.
printMessage(reply);  // valid — structural typing in action

// ── readonly ──────────────────────────────────────────────────────────────────
// PURPOSE: marks properties as immutable after creation — the TypeScript
// equivalent of frozen=True in @dataclass or a Final annotation.

interface ChatSession {
  readonly id: string;   // cannot be reassigned after creation
  userId: string;
  messages: Message[];
}

const session: ChatSession = { id: "s-1", userId: "u-1", messages: [msg] };
// session.id = "s-2";  // ← error: Cannot assign to 'id' because it is a read-only property

console.log(`Message: ${msg.content}`);
console.log(`Reply from ${reply.model}: ${reply.content}`);
console.log(`Session has ${session.messages.length} message(s)`);
