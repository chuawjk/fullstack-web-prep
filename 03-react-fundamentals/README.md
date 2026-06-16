# 03 — React Fundamentals

**Objective:** read a React component cold and explain what it renders, what re-runs it, and what React does with the result.

## The problem this section solves

You write a button that calls `setCount(count + 1)`, and the very next line reads `count` — still 0. You add a `console.log` at the top of a component and it fires three times for one click. You add a `useEffect` for a network call and it runs infinitely. None of it makes sense until you understand that React, not you, calls your component function — and re-calls it every time state changes.

**Key insight:** you never call your component and you never touch the DOM. React calls your function repeatedly, builds element-tree descriptions from what it returns, and patches only the diff. `setState` doesn't mutate the variable; it schedules another function call with new values. Every React mystery traces back to this.

§01 showed you the imperative version of this: find the DOM node, set `.textContent`, done. React replaces that entirely. §02's interface knowledge is what makes prop types readable — you'll hit `{ message: Message; onSend: (text: string) => void }` as a prop type in the first file.

Most of what makes React confusing isn't the API — it's the _machine underneath_: how your code actually executes. `useState`, props, JSX, keys all become easy once you can see that machine. So this section teaches the machine first, in plain terms, and only then names the parts.

> Coming from imperative Python, here's the one sentence that everything below unpacks: **you never run your UI code, and you never touch the screen.** You write functions that return descriptions, hand them to React, and React decides when to call them and what to change.

---

## How React runs

Read these in order — each step leans on the one before it. The companion file `notes/mental-model.ts` builds a tiny working React engine that makes steps 1–7 concrete; run it (`npm run 03:model`) and keep its output beside this list.

### 1. A piece of JSX is a value, not an action

JSX isn't HTML and isn't a draw command. The compiler rewrites every tag into a `createElement(...)` call that returns a plain object. That object is called an **element** — a description of what should be on screen, not the thing on screen.

```
   JSX (what you write)             element (what it compiles to)
   ─────────────────────           ─────────────────────────────────────
   <p>Count: {count}</p>    ──►     { type: "p",
                                      props: { children: ["Count: ", 0] } }
```

You can `console.log` an element. It's just data.

### 2. A component is a function that returns a description

A component takes `props` and **returns** an element tree. That's its whole job — it doesn't draw or change anything.

```
   props  ──►  Counter  ──►  element tree (a description)
   { count: 0 }              { type: "div", props: { … } }
```

Like a Jinja template function that returns a description instead of rendering once.

### 3. Data flows down; events flow up

Props pass **down** the tree. A child can't reach up and change a parent's data — the parent passes a **callback** down, and the child calls it. That's the entire communication model.

```
                 App   (owns the state)
                  │
          props ↓ │ ↑ callbacks
        ┌─────────┴─────────┐
     Display              Button
   value={count}    onClick={() => setCount(...)}
```

### 4. React calls your component — you don't

This is the one that answers "wait, when does this even run?" You write `<Counter />`, which is just data naming the function (`createElement(Counter, props)` → `{ type: Counter, props }`). You hand that to React; **React** makes the actual `Counter(props)` call, at a time of its choosing. You never call a component yourself, and you never touch the DOM like you did in §01.

```
   YOU                          REACT                    BROWSER
   ───                          ─────                    ───────
   root.render(<Counter/>)  ─►  calls Counter()      ─►  React builds &
   (hand over a                 (React is the            patches the DOM
    description, once)           caller, repeatedly)     — not you)
```

Why does React want to own the call? So it can make that call _again_ automatically whenever the inputs change — which is what re-rendering is. Hand the call to React and updates become free; keep it yourself and you're back to wiring every update by hand. (The term for "the framework calls you, not the other way around" is **inversion of control**.)

### 5. Rendering is cheap; only the changes touch the DOM

A render happens in two passes. First React calls your functions and assembles the element tree in memory — just objects, fast. React calls this in-memory tree the **virtual DOM**. Then it applies the result to the real, slow browser DOM — and only the parts that changed. The names for the two passes are **render** (build the description) and **commit** (apply it).

```
   render (in memory, cheap)              commit (touches real DOM)
   ─────────────────────────             ──────────────────────────
   call components → element tree   ──►   compare to previous   ──►   patch only the delta
```

### 6. Changing state re-runs the function

State is data that survives between renders and, when changed, triggers a new render. The governing idea: `UI = f(state)`. Change state → React re-calls `f` → compares → patches.

```
   setCount(1)  ──►  React re-runs Counter()  ──►  compare  ──►  patch one text node
```

`useState` is just how a function remembers a value between calls and gets a setter that also schedules the re-run. (CLAUDE.md's anchor: a class attribute whose setter also calls `self.redraw()`.)

### 7. A re-render is literally another function call

The part that fights imperative habits, so go slow. `setCount(1)` does **not** mutate `count` — `count` is a `const`, frozen for the life of that one call. `setCount` schedules React to **call the component again**, a brand-new call with a brand-new local `count`.

```
   call #0  (first render)           call #1  (after setCount)
   ────────────────────              ─────────────────────────
   count = 0   (a const)             count = 1   (a different const)
   returns <p>Count: 0</p>           returns <p>Count: 1</p>

   setCount didn't change count. It asked React to run the function again.
   The screen is a slideshow of frames, not a document you edit in place.
```

### 8. Lists need stable identity (keys)

When you render a list, React matches old elements to new ones to decide what to reuse. By default it matches by position, which breaks when items reorder or get inserted. A **key** gives each item a stable identity so React tracks it correctly — that's why it warns when keys are missing.

```
   old:  div > p > ["Count: ", 0]
   new:  div > p > ["Count: ", 1]
                               ▲
                  only this text node differs  →  React updates it,
                  reuses the <div>, <p>, <button>, and listeners
```

### 9. Effects reach the world outside the loop

Steps 1–8 are React's closed loop: state → render → commit. An **effect** is the escape hatch for anything that _isn't_ "compute UI from state" — network calls, timers, subscriptions. It runs _after_ commit, and its cleanup runs before the next effect or on unmount.

```
   state change ─► render ─► commit ─► [ effect runs ] ─► … later: [ cleanup ]
                                            │
                                   fetch / timers / subscriptions
```

`useEffect`'s dependency array just means "re-run this only when these values change."

---

## The whole thing in one sentence

> A piece of JSX is data → a component is a function React calls → changing state makes React call it again → React compares the new description to the old → and patches only the difference. Effects let you step outside that loop to touch the world.

Everything else in React — context, reducers, memoization, Suspense — only changes _where state lives_ or _when the function re-runs_. The loop never changes.

---

## Files, in reading order

| Order | File                              | Run it?            | What it grounds                                                |
| ----- | --------------------------------- | ------------------ | -------------------------------------------------------------- |
| 1     | `notes/mental-model.ts`           | `npm run 03:model` | The whole loop above, as a 70-line engine you can read and run |
| 2     | `notes/components.tsx`            | read               | Components, JSX, rendering (steps 1–2)                         |
| 3     | `notes/props.tsx`                 | read               | Data down, events up (step 3)                                  |
| 4     | `notes/state-usestate.tsx`        | read               | State and re-running (steps 6–7)                               |
| 5     | `notes/lists-and-conditional.tsx` | read               | Keys and matching (step 8)                                     |
| 6     | `notes/effects-useeffect.tsx`     | read               | Effects and cleanup (step 9)                                   |

The `notes/*.tsx` files are read-first references (not standalone runnables) — they show the real API in context. The playground is where it comes alive.

---

## The playground

A small Vite + Tailwind app where each concept is a live, toggleable demo. Change code, watch the browser hot-reload (like `uvicorn --reload`, but frontend). This is where steps 6 and 9 finally _feel_ real — you can't fully internalise "state triggers a re-render" until you click a button and watch it happen.

```bash
cd 03-react-fundamentals/playground && npm install && npm run dev
# or, once deps are installed, from the repo root:
npm run 03:playground          # http://localhost:5173
```

**Vite** is the dev server + bundler — it serves the app, watches files, and pushes updates without a full reload.

---

## Read-and-modify exercises

Predict the outcome _before_ you run each one.

1. Before opening the playground, read `ChatDemo.tsx` and predict: when you type a character, does the component's function body run again, or does a value change in place? Then add `console.log("render", draft)` at the top of `ChatDemo` and type a few characters. Were you right?
2. In `notes/mental-model.ts`, add a second `<p>` to `Counter` and re-run `npm run 03:model`. Find your new node in the printed object _before_ looking at the rendered string.
3. In `playground/src/components/ListDemo.tsx`, add a fourth item to `INITIAL_MESSAGES`. Only one new DOM node should appear; the rest are reused — why?
4. In the list demo, remove a `key` prop. Open the browser console, read React's warning, explain it in terms of "matching old elements to new," then restore it.
5. In `ChatDemo.tsx`, add a "Clear chat" button that resets `messages` to `[]`. Narrate the sequence: which setter fires, which function re-runs, what React compares.

---

## What we're deliberately skipping

- **Class components** — the old API. You'll recognise them in legacy code; the same loop applies. Don't write new ones.
- **`React.memo` / `useMemo` / `useCallback`** — performance tuning. They only change _when_ the function re-runs (step 7). Later.
- **Suspense** — advanced async rendering; §05 recognition-targets mentions it.
- **Context and `useReducer`** — §04. Both are just "where state lives" (step 6) variations.

---

## Stop condition

You're done when you can:

- Explain, without notes, **who calls your component** and **what `setState` actually does to the `count` variable** (nothing — it schedules a fresh call).
- Open the playground, type a message, and narrate the update as a sequence: _which setter fired → which component function re-ran → what React compared → what single thing changed in the DOM._
- Read `notes/effects-useeffect.tsx` and explain the dependency array without reading the comments.

If you can do that, move on to `04-react-hooks-patterns/`. That section answers the one question §03 deliberately left open: if the function rebuilds all its locals on every render, how does state survive between calls?
