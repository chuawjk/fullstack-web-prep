/*
  TypeScript is a "superset" of JavaScript: every valid JS file is valid TS,
  but TS adds a static type system on top.

  Python parallel: like adding type hints to Python (def foo(x: int) -> str:)
  but the annotations are enforced at COMPILE TIME before the code runs.

  Key difference: TypeScript types are ERASED at runtime. At runtime you're
  running plain JavaScript — types only exist while you're writing code.
  Python type hints stay in the bytecode; TS types vanish after compilation.
*/

// Run this file: tsx 02-typescript/01-types.ts

// === PRIMITIVES ===============================================================
// TypeScript has three primitive types: string, number, boolean.
// Python equivalents:  str,  float/int (one numeric type — no int vs float),  bool

let username: string = "alice";   // the ": string" after the name is the annotation
let messageCount: number = 42;
let isTyping: boolean = false;

// TYPE INFERENCE: TypeScript can INFER the type from the assigned value.
// You don't always have to write the annotation. Python's mypy does this too.
let inferredString = "hello";   // TypeScript knows this is a string
// inferredString = 42;         // ← would be a compile error: Type 'number' is not assignable to type 'string'

// === ARRAYS ===================================================================
// Python: List[str]        TypeScript: string[]   (or equivalently Array<string>)
let recentMessages: string[] = ["Hello!", "How are you?"];
let messageLengths: number[] = [6, 12];

// TUPLE: a fixed-length array where each POSITION has a known type.
// Python equivalent: Tuple[str, number] — same concept, same name.
let authorAndText: [string, string] = ["alice", "Hello, world!"];

// === FUNCTION TYPES ===========================================================
// You annotate both parameter types AND the return type.
// Python: def greet(name: str) -> str:

function greet(name: string): string {
  return `Hello, ${name}!`;  // backtick template literals = Python f-strings
}

// Arrow function syntax (concise). More than a lambda — can be multi-line.
// Python: format_message = lambda role, text: f"[{role}] {text}"
const formatMessage = (role: string, text: string): string => {
  return `[${role}] ${text}`;
};

// void means "returns nothing". Python equivalent: -> None
function logMessage(text: string): void {
  console.log(text);  // console.log = Python's print()
}

// === UNION TYPES ==============================================================
// A value that can be one of several types. The | is "or".
// Python equivalent: Union[str, int]  or the newer  str | int  (Python 3.10+)
let messageId: string | number = "msg-001";
messageId = 42;  // also valid — both sides of the union are allowed

// The most common union: T | null (a value that might not exist yet).
// Python equivalent: Optional[str]  or  str | None
let currentUser: string | null = null;

// === LITERAL TYPES ============================================================
// A type that is a SPECIFIC value — not just "any string", but this exact string.
// Python has no direct equivalent; the closest is Literal from typing.
type Direction = "left" | "right";  // only these two strings are valid
let swipe: Direction = "left";
// swipe = "up";  // ← error: Type '"up"' is not assignable to type 'Direction'

// Demo output — run with: tsx 02-typescript/01-types.ts
console.log(greet("world"));                  // Hello, world!
console.log(formatMessage("user", "hello"));  // [user] hello
console.log(`messageId is now: ${messageId}`);
console.log(`currentUser: ${currentUser}`);
logMessage("Types are working!");
