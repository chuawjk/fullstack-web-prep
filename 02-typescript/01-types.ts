/*
  TypeScript basics — primitives, arrays, function types, and the two main "or" types.

  PROBLEM
  -------
  Coming from Python, type hints feel optional — you can add them, ignore mypy,
  and the code still runs. In TypeScript, type errors block compilation. Before
  writing any TypeScript, you need to know the annotation syntax, what TypeScript
  can infer without annotations (most of the time), and what happens to types at
  runtime: they're erased entirely. There is no TypeScript runtime — the compiler
  is the whole type system.

  CONCEPT
  -------
  TypeScript is a superset of JavaScript. Every valid JS file is valid TS, but TS
  adds a static type layer: you annotate values, the compiler checks them, then the
  annotations are stripped before the code runs. Because the output is plain JS,
  there are no runtime costs for using types — they exist only while you're writing.

  KEY INSIGHT
  -----------
  TypeScript types vanish at runtime. Python type hints stay in the bytecode;
  TypeScript types don't. At runtime you're running plain JavaScript.

  IN THIS FILE
  ------------
  • Primitives (string / number / boolean) and type inference
  • Arrays and tuples
  • Function types — parameter and return annotations, arrow functions
  • Union types (string | number) and optional values (T | null)
  • Literal types ("left" | "right") — a value that is also its own type

  PYTHON ANALOGY
  --------------
  def foo(x: int) -> str: — same annotation syntax idea. The difference: Python's
  mypy is a voluntary check; TypeScript's compiler is mandatory and blocks the build.
*/

// Run this file: tsx 02-typescript/01-types.ts

// ── Primitives ────────────────────────────────────────────────────────────────
// PURPOSE: shows the three primitive types and how type inference works — most
// of the time TypeScript infers the type from the assigned value and you don't
// need to write the annotation at all.
// Python equivalents: str, float/int (one numeric type), bool

let username: string = "alice";   // ": string" is the annotation
let messageCount: number = 42;
let isTyping: boolean = false;

// Type inference: TypeScript knows inferredString is a string from the assignment.
// Python's mypy does the same. You only need explicit annotations where TS can't infer.
let inferredString = "hello";
// inferredString = 42;  // ← compile error: Type 'number' is not assignable to type 'string'

// ── Arrays ────────────────────────────────────────────────────────────────────
// PURPOSE: variable-length typed arrays and fixed-length tuples.
// Python: List[str] → string[];  Tuple[str, str] → [string, string]

let recentMessages: string[] = ["Hello!", "How are you?"];
let messageLengths: number[] = [6, 12];

// Tuple: fixed-length array where each POSITION has a known type.
// Python: Tuple[str, str] — same concept, same name.
let authorAndText: [string, string] = ["alice", "Hello, world!"];

// ── Function types ─────────────────────────────────────────────────────────────
// PURPOSE: annotating parameters and return types. Arrow functions are more than
// lambdas — they can be multi-line and are the standard for callbacks.
// Python: def greet(name: str) -> str:

function greet(name: string): string {
  return `Hello, ${name}!`;  // backtick template literals = Python f-strings
}

// Arrow function: concise, can be multi-line. Used constantly for callbacks.
// Python: format_message = lambda role, text: f"[{role}] {text}"  (but multi-line capable)
const formatMessage = (role: string, text: string): string => {
  return `[${role}] ${text}`;
};

// void = returns nothing. Python: -> None
function logMessage(text: string): void {
  console.log(text);  // console.log = Python's print()
}

// ── Union types ───────────────────────────────────────────────────────────────
// PURPOSE: a value that can be one of several types. The most common form is
// T | null for values that might not exist yet.
// Python: Union[str, int]  or  str | int (3.10+);  Optional[str]  or  str | None

let messageId: string | number = "msg-001";
messageId = 42;  // both sides of the union are valid

let currentUser: string | null = null;

// ── Literal types ─────────────────────────────────────────────────────────────
// PURPOSE: a type that is a specific value — not just "any string", but this
// exact string. This is the foundation for discriminated unions in §04.
// Python: Literal["left", "right"] from typing

type Direction = "left" | "right";  // only these two strings are valid
let swipe: Direction = "left";
// swipe = "up";  // ← error: Type '"up"' is not assignable to type 'Direction'

// Demo output — run with: tsx 02-typescript/01-types.ts
console.log(greet("world"));                  // Hello, world!
console.log(formatMessage("user", "hello"));  // [user] hello
console.log(`messageId is now: ${messageId}`);
console.log(`currentUser: ${currentUser}`);
logMessage("Types are working!");
