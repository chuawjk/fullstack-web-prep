# 04 — React Hooks & Patterns

**Objective:** given any component, name the hooks it uses, explain why each one is there, and say what would break if it moved.

## The problem this section solves

You have a component managing a message input, a loading state, and an error state. You reach for three `useState` calls and a `useEffect`, then wonder why calling a hook inside an `if` statement throws a lint error — and why state somehow "survives" a function that rebuilds its locals on every call.

**Key insight:** hooks are indexed slots that live outside your function, matched strictly by call order across renders. State doesn't live in the function; it lives in a slot React assigns based on which hook call this is (first, second, third…). The Rule of Hooks — no hooks in conditionals or loops — is just the slot mechanism protecting its own index.

§03 left you with one hard fact: **a re-render is just another function call** — fresh locals every time. That immediately raises a question §03 didn't answer:

> If the function runs from scratch on every render, how does `count` survive from one call to the next? A plain local would reset to its initial value every time.

That question is the whole of this section. The answer is the machine underneath every hook — learn it once and `useState`, `useEffect`, `useReducer`, `useContext`, and custom hooks all stop being separate APIs and become one mechanism.

---

## The machine: hooks are slots, matched by call order

React keeps a **list of memory slots for each component instance**, sitting outside the function, surviving across calls. When your function runs, each hook call reads the **next slot in order**: the first hook call gets slot 0, the second gets slot 1, and so on. The function is stateless; the slots are where the state actually lives.

```
   Component function (re-created every render)      React's slot list (persists)
   ──────────────────────────────────────────       ────────────────────────────
   const [count, setCount] = useState(0)   ───────►  slot 0:  count = 3
   const [name, setName]   = useState("")  ───────►  slot 1:  name  = "Kenny"
   useEffect(() => …, [count])             ───────►  slot 2:  { deps: [3], cleanup }
                                                      ▲
                              matched purely by the ORDER of the calls,
                              not by variable name — React never sees "count"
```

This is the substrate. `useState` doesn't store the value *in* `count` — `count` is a fresh `const` each render that React fills in by **reading slot 0 and handing you back what's there**. "Persists across calls" = "lives in the slot, not the function." (CLAUDE.md's anchor still holds: a class attribute whose setter calls `self.redraw()` — except here the "attribute" is an external slot and the "instance" is the slot list.)

There's no direct Python analogy: a Python function has no hidden per-call-site memory that outlives the call. The closest mental image is a generator frozen between `yield`s — but React rebuilds the function instead of suspending it, so the memory has to live outside.

### Why this is the whole game: the Rule of Hooks falls out of it

If slots are matched by **call order**, the call order must be **identical on every render** — otherwise slot 1 on render 2 lines up against slot 0's data from render 1 and everything shifts. So:

```
   ✅ stable order                      ❌ conditional call — shifts every slot after it
   ───────────────                      ─────────────────────────────────────────────
   useState(0)   → slot 0               if (loggedIn) useState(0)  → slot 0 SOMETIMES
   useState("")  → slot 1               useState("")               → slot 0 or 1 ??!
   useEffect(…)  → slot 2               useEffect(…)               → slot 1 or 2 ??!
```

That's the entire reason for the Rule of Hooks: **call hooks at the top level only — never in a condition, loop, or nested function.** It's not a style rule; it's the slot mechanism protecting itself. ESLint's `react-hooks` plugin enforces it because the failure is silent and brutal otherwise.

---

## When to reach for each hook (and when not to)

Every hook in this section is the slot mechanism specialised for one job. The skill isn't memorising APIs — it's knowing the **trigger** for each, and just as importantly when *not* to reach for it.

| Hook | Reach for it when… | Don't, when… |
|---|---|---|
| `useState` | a value changes over time and the UI should reflect it | the value can be **computed from existing state/props** — derive it during render instead (see `controlled-inputs.tsx`) |
| `useReducer` | several state fields change **together**, or transitions are non-trivial | one independent value — `useState` is less ceremony |
| `useContext` | read-mostly data (theme, user, locale) needed **many levels deep** | 1–2 levels — just pass props; or the value changes every keystroke — every consumer re-renders |
| `useEffect` | a state change must **synchronise something outside the React tree** — network, timers, subscriptions, `document.title` | the work is "compute what to render" — the render already does that; an effect is the wrong tool (this is the §03 step-9 boundary, stated as a rule) |
| custom hook | the **same** `useState`+`useEffect` shape appears in two components | the logic is pure and stateless — a plain function is enough |

The "don't" column is the half people skip, and it's what produces over-engineering: a `useEffect` that just recomputes a derived value, an `isValid` state that should have been `value.includes("@")`, a Context for something one prop away.

---

## Files, in reading order

| Order | File | What it teaches | Slot mechanism angle |
|---|---|---|---|
| 1 | `usecontext.tsx` | Sharing data without prop drilling | a slot read from a Provider higher up, not from props |
| 2 | `usereducer.tsx` | Managing complex, related state | one slot holding a whole state object, updated by a pure function |
| 3 | `custom-hook.tsx` | Extracting logic into a `useX` function | your own function that owns a group of slots |
| 4 | `controlled-inputs.tsx` | Forms: input values tied to state | the DOM value *is* a slot; derive, don't duplicate |
| 5 | `loading-error-states.tsx` | The async data-fetching state machine | one slot holding a discriminated-union status |

These are annotated reference files — read them with the comments as the guide, not standalone runnables. Each uses the **definition-site / call-site** convention from §03: where a function is *defined* vs. where it's *called* is labelled, because that distinction is where the confusion lives.

---

## Read-and-modify exercises

Predict before you run.

1. **`usecontext.tsx`** — add a third theme `"system"` to the union; make `ThemeToggle` cycle through all three. Then answer: when the theme changes, which components re-render, and why?
2. **`usereducer.tsx`** — add a `"clear"` action that resets messages to `[]`, plus a "Clear chat" button that dispatches it. Note you touch the reducer and the JSX but never write `setState`.
3. **`custom-hook.tsx`** — change `useChat`'s reply to `"You said: [message] (reply #N)"` where N increments. Where does N have to live so it survives re-renders?
4. **`controlled-inputs.tsx`** — add a red border when the email lacks `@`. Do it by *deriving* the error from the value, not by adding an `isError` state. Why is the derived version impossible to get out of sync?
5. **`loading-error-states.tsx`** — add a "retry" button in the error branch that re-triggers the fetch. What has to change in the deps to make a retry actually re-run the effect?

---

## What we're deliberately skipping

- **`useMemo` / `useCallback`** — they cache a value or a function across renders (two more slot types) so a re-render can skip recomputing. Performance tuning; reach for them when you measure a problem, not before. They change *when* work re-runs (§03 step 7), never the loop.
- **`useRef`** — a slot whose value you can mutate *without* triggering a re-render; also how you grab a real DOM node. You'll see it in §10's scroll-to-bottom implementation and in the streaming reader loop.
- **`useLayoutEffect`** — like `useEffect` but runs synchronously before the browser paints. Rare outside UI-library internals.

---

## Where this leads

The async state machine in `loading-error-states.tsx` (idle → loading → error/success) is the exact pattern §10's streaming chat UI uses — except the `success` branch updates incrementally as tokens arrive rather than all at once. The `useReducer` pattern in `usereducer.tsx` is also what you'll reach for in §10 when a single message send requires updating multiple state fields atomically.

## Stop condition

You're done when you can:

- Explain, without notes, **how a re-called function remembers state** — the slot list, matched by call order — and why that makes the Rule of Hooks non-negotiable.
- Read a component cold and list every hook with a one-sentence justification for each, including which ones could be replaced by deriving a value during render.
- State the `useState` vs `useReducer` trigger, and trace a `useContext` value back to the Provider that supplied it.

If you can do that, move on to `05-ecosystem-map/`.
