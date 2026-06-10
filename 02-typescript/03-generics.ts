/*
  GENERICS let you write code that works for MULTIPLE types while keeping
  type safety. You write a function or interface once, then TypeScript fills
  in the actual type at each call site.

  Python equivalent: TypeVar + Generic[T]
    T = TypeVar("T")
    def identity(x: T) -> T: return x

  TypeScript:
    function identity<T>(x: T): T { return x; }

  The <T> is a TYPE PARAMETER — a placeholder the compiler resolves when
  you call the function. It's inferred from the argument, so you rarely
  need to write the type explicitly at the call site.
*/

// Run this file: tsx 02-typescript/03-generics.ts

// === GENERIC FUNCTION =========================================================
// <T> declares a type parameter. T is the conventional name (like Python's T).
function identity<T>(value: T): T {
  return value;
}

const str = identity("hello");  // T is inferred as string — no need to write identity<string>
const num = identity(42);       // T is inferred as number

// === GENERIC INTERFACE =========================================================
// Foreshadowing the project: a typed API response envelope.
// The payload type (T) varies per endpoint, but the wrapper shape is always the same.
// Python equivalent: @dataclass + Generic[T]

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

// The same generic interface, specialised for two different payload types:
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

// === GENERIC WITH CONSTRAINT ==================================================
// The `extends` keyword constrains what T can be.
// Python equivalent: TypeVar("T", bound=SomeBase)

interface HasId {
  id: string;
}

// T can be any type that has at least an `id: string` property.
function findById<T extends HasId>(items: T[], id: string): T | undefined {
  // Array.find is like Python's next((x for x in items if x.id == id), None)
  return items.find(item => item.id === id);
}

const messages: Message[] = [
  { id: "1", role: "user", content: "Hello" },
  { id: "2", role: "assistant", content: "Nice to meet you!" },
];

const found = findById(messages, "2");

// Optional chaining (?.) — only access .content if found is not null/undefined.
// Python equivalent:  found.content if found else None
console.log(found?.content);  // "Nice to meet you!"

// === GENERIC ARRAY UTILITY ====================================================
// A generic function that wraps a value in an array.
// Demonstrates T being inferred from context rather than from arguments.
function wrapInArray<T>(value: T): T[] {
  return [value];
}

const wrappedMsg = wrapInArray(singleMessage.data!);
// The ! is "non-null assertion" — we're telling TS "trust me, this isn't null".
// Use it sparingly; prefer a proper null check in real code.

console.log(`Found: "${found?.content}"`);
console.log(`Single message status: ${singleMessage.status}`);
console.log(`Message list length: ${messageList.data?.length}`);
console.log(`Wrapped: ${JSON.stringify(wrappedMsg)}`);
console.log(str, num);
