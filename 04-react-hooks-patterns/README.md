# 04 — React Hooks & Patterns

**Objective:** given any component, name the hooks it uses and explain why each one is there.

Section 03 covered the two hooks you'll see most (useState, useEffect). This section covers the next tier — hooks you'll encounter in every real codebase — plus two patterns (controlled inputs and the async state machine) that appear in nearly every form and data-fetching scenario.

---

## Hook taxonomy

```
Hooks
├── State
│   ├── useState       ← §03: simple values, arrays, objects
│   └── useReducer     ← §04: multiple related state values; state machine
│
├── Shared state
│   └── useContext     ← §04: read a value that was provided higher in the tree
│
├── Side effects
│   └── useEffect      ← §03: fetch, timers, subscriptions
│
└── Custom hooks       ← §04: extract reusable logic into a named function
```

---

## Files, in reading order

| Order | File | What it teaches |
|---|---|---|
| 1 | `usecontext.tsx` | Sharing data without prop drilling |
| 2 | `usereducer.tsx` | Managing complex, related state |
| 3 | `custom-hook.tsx` | Extracting logic into a `useX` function |
| 4 | `controlled-inputs.tsx` | Forms: input values tied to state |
| 5 | `loading-error-states.tsx` | The async data-fetching state machine |

These files are annotated reference examples — read them with comments as the guide. They're not standalone runnable files; patterns are demonstrated within the component code.

---

## How to read these files

Focus on *why* each hook is used, not just *what* it does. For every `useX` call you see in a file, ask:
1. What problem is this hook solving?
2. What would break if you removed it?
3. What's the Python analogy?

---

## Read-and-modify exercises

1. **`usecontext.tsx`** — the `ThemeContext` provides `"light"` or `"dark"`. Add a third theme `"system"` to the union. Update `ThemeToggle` to cycle through all three.
2. **`usereducer.tsx`** — add a `"clear"` action that resets messages to an empty array. Add a "Clear chat" button that dispatches it.
3. **`custom-hook.tsx`** — the `useChat` hook always replies with a fixed echo. Change it so the reply is `"You said: [original message] (reply #N)"` where N increments.
4. **`controlled-inputs.tsx`** — add basic validation: show a red border on the email input when the value doesn't contain `@`. Hint: derive the error from the value, not from a separate `isError` state.
5. **`loading-error-states.tsx`** — add a "retry" button that appears in the error state and re-triggers the fetch.

---

## What we're deliberately skipping

- **useMemo / useCallback** — performance optimisation hooks. Important once you have a performance problem; premature otherwise. You'll recognise them when you see them.
- **useRef** — accessing DOM nodes and storing mutable values without triggering re-renders. Common in animation, focus management, and video players. Covered briefly in the wild.
- **useLayoutEffect** — like `useEffect` but fires synchronously after DOM mutations. Rarely needed outside UI library code.

---

## Stop condition

You're done with this section when you can:

- Read a component and — without running it — list every hook it uses and give a one-sentence justification for each.
- Explain the difference between `useState` and `useReducer` and name a scenario where you'd choose each.
- Look at a `useContext` call and trace where the value comes from.

If you can do that, move on to `05-ecosystem-map/`.
