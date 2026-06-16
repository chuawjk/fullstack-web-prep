/*
  Generics — writing code that works for multiple types without losing type safety.

  PROBLEM
  -------
  You're writing a function to find an item by ID — first for users, then for
  messages, then for conversations. Three near-identical functions differing only
  in their type. The instinct is to use `any`, but `any` defeats the type checker:
  you lose autocomplete, catch no errors, and the type information disappears
  downstream. You need one function that stays typed for each concrete use.

  CONCEPT
  -------
  Generics let you parameterize a function or interface over a type. The type
  parameter <T> is a placeholder the compiler fills in from context at each call
  site. You write the function once; TypeScript infers the concrete type when you
  call it, so the return value is fully typed without you writing anything extra.

  KEY INSIGHT
  -----------
  <T> is to TypeScript what TypeVar is to Python — a placeholder that resolves per
  call site without losing type information. The key difference: TypeScript infers
  T from the arguments, so you rarely need to write `findById<Message>(...)`.

  IN THIS FILE
  ------------
  • Generic functions — <T> in action; inference from arguments
  • Generic interfaces — ApiResponse<T>, one envelope for any payload type
  • Constrained generics — T extends HasId limits what T can be
  • Optional chaining (?.) — safe property access on possibly-null values

  PYTHON ANALOGY
  --------------
  TypeVar + Generic[T] — same concept, slightly different syntax:
    Python: T = TypeVar("T");  def identity(x: T) -> T: return x
    TS:                        function identity<T>(x: T): T { return x; }
*/

// Run this file: tsx 02-typescript/03-generics.ts

// ── Generic function ──────────────────────────────────────────────────────────
// PURPOSE: shows the basic <T> syntax — a placeholder type that TypeScript
// infers from what you pass in, so you never need to write identity<string>(...).

function identity<T>(value: T): T {
  return value;
}

const str = identity("hello");  // T inferred as string
const num = identity(42);       // T inferred as number

// ── Generic interface ─────────────────────────────────────────────────────────
// PURPOSE: one wrapper shape that works for any payload type — the classic
// API response envelope. T changes per endpoint; the wrapper never changes.
// Python: @dataclass + Generic[T]

interface ApiResponse<T> {
  data: T | null;
  error: string | null;
  status: number;
}

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

// The same interface specialised for two different payload types:
const singleMessage: ApiResponse<Message> = {
  data: { id: "1", role: "user", content: "Hello" },
  error: null,
  status: 200,
};

const messageList: ApiResponse<Message[]> = {
  data: [
    { id: "1", role: "user", content: "Hello" },
    { id: "2", role: "assistant", content: "Hi there!" },
  ],
  error: null,
  status: 200,
};

// ── Constrained generics ──────────────────────────────────────────────────────
// PURPOSE: `T extends HasId` limits what T can be — any type that has at least
// an `id: string` field. The function can then use `.id` safely, because T is
// guaranteed to have it regardless of what else it carries.
// Python: TypeVar("T", bound=SomeBase)

interface HasId {
  id: string;
}

function findById<T extends HasId>(items: T[], id: string): T | undefined {
  // Array.find ≈ Python's next((x for x in items if x.id == id), None)
  return items.find(item => item.id === id);
}

const messages: Message[] = [
  { id: "1", role: "user", content: "Hello" },
  { id: "2", role: "assistant", content: "Nice to meet you!" },
];

const found = findById(messages, "2");

// Optional chaining (?.) — only access .content if found is not null/undefined.
// Python: found.content if found else None
console.log(found?.content);  // "Nice to meet you!"

// ── Generic array utility ─────────────────────────────────────────────────────
// PURPOSE: T inferred from the argument, not explicitly provided — shows that
// you almost never need to write the type parameter at the call site.

function wrapInArray<T>(value: T): T[] {
  return [value];
}

const wrappedMsg = wrapInArray(singleMessage.data!);
// The ! is "non-null assertion" — telling TS "trust me, this isn't null".
// Use sparingly; prefer a real null check in production code.

console.log(`Found: "${found?.content}"`);
console.log(`Single message status: ${singleMessage.status}`);
console.log(`Message list length: ${messageList.data?.length}`);
console.log(`Wrapped: ${JSON.stringify(wrappedMsg)}`);
console.log(str, num);
