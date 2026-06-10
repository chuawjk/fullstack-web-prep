# 02 — TypeScript

**Objective:** read any TypeScript file and explain every type annotation — what it guarantees, and why it's there.

TypeScript is a **superset** of JavaScript: every valid JavaScript file is valid TypeScript, but TypeScript adds a static type system on top. The types are checked at **compile time** (before the code runs), then **erased** — the output is plain JavaScript. This is different from Python, where type hints are preserved at runtime and are optional even with mypy; in TypeScript the compiler actively enforces types and will refuse to compile incorrect code.

Python parallel: imagine Python's type hints (`def foo(x: int) -> str`) but enforced strictly by a dedicated compiler, not just checked optionally by mypy.

---

## The one idea that frames everything

TypeScript uses **structural typing**: if an object has the right *shape* (the right properties with the right types), it passes — the declared class or type name doesn't matter. This is like Python's duck typing, but checked at compile time.

Java and C# use **nominal typing**: a type must explicitly *declare* that it implements an interface. TypeScript does not work that way.

---

## Files, in reading order

| Order | File | What it teaches |
|---|---|---|
| 1 | `01-types.ts` | Primitives, arrays, tuples, functions, union types |
| 2 | `02-interfaces-and-types.ts` | Describing object shapes; `interface` vs `type`; structural typing |
| 3 | `03-generics.ts` | Generic functions and interfaces; Python `TypeVar` parallel |
| 4 | `04-narrowing.ts` | Union types + runtime checks that narrow the type in a branch |
| 5 | `05-utility-types.ts` | Built-in type transformers: `Partial`, `Pick`, `Omit`, `Record` |

Every file is heavily commented. **Read the comments — they are the lesson.** Run each file to see the output, then tweak and re-run.

---

## How to run

Each file runs with a single command from the **repo root**:

```bash
npm run 02:01   # 01-types.ts
npm run 02:02   # 02-interfaces-and-types.ts
npm run 02:03   # 03-generics.ts
npm run 02:04   # 04-narrowing.ts
npm run 02:05   # 05-utility-types.ts
```

Or directly: `tsx 02-typescript/01-types.ts`

`tsx` is the TypeScript executor — it compiles and runs a `.ts` file in one step, with no separate build stage. Python equivalent: `python my_script.py`.

---

## Read-and-modify exercises

These are not blank-page exercises. Make small changes and re-run to build intuition.

1. **`01-types.ts`** — add a `timestamp: Date` field to the `authorAndLength` tuple. What error does TypeScript report? Fix it.
2. **`02-interfaces-and-types.ts`** — add a `threadId: string` property to `Message`. Notice how TypeScript immediately flags `msg` as missing the field. Add the value.
3. **`03-generics.ts`** — write a generic `first<T>(arr: T[]): T | undefined` function that returns the first element of any array. Use it on both `messages` and a `number[]`.
4. **`04-narrowing.ts`** — add a third case to `ChatMessage` — an `ErrorMessage` with `type: "error"` and `code: number`. Update `renderMessage` to handle it. Notice how TypeScript complains until you do.
5. **`05-utility-types.ts`** — create a `RequiredUser` type using TypeScript's built-in `Required<T>` (the opposite of `Partial`). Try assigning a `UserUpdate` to it and read the error.

---

## What we're deliberately skipping

- **Decorators** — used in some backend frameworks (NestJS); not needed for reading React/Next codebases.
- **Declaration files (`.d.ts`)** — how type definitions are published in npm packages; relevant if you publish a library, not a consumer.
- **`tsconfig` deep-dive** — the root `tsconfig.json` is annotated; that's enough.
- **`enum`** — you'll see them in old code; prefer union string literals (`"user" | "assistant"`) in new code.

---

## Stop condition

You're done with this section when you can:

- Open a `.ts` file from a real project, read the `interface` and generic types, and explain in plain language what each annotation guarantees.
- Run `npm run 02:05` and, without looking at the file, describe what `Partial`, `Pick`, `Omit`, and `Record` each do.

If you can do that, move on to `03-react-fundamentals/`.
