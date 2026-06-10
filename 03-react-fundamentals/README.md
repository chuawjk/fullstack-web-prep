# 03 — React Fundamentals

**Objective:** read a React component cold and explain what it renders, what it fetches, and what triggers a re-render.

React is a JavaScript library for building UIs. Its core idea: **the UI is a function of state**. You describe *what* the screen should look like for a given piece of data, and React figures out *how* to update the DOM when that data changes. You never manually touch the DOM (no `appendChild` like in §01) — you describe the output, and React handles the rest.

Python parallel: think of a React component like a function that takes some data (props) and returns a description of a UI fragment. React calls that function whenever the data changes and updates the screen.

---

## The component tree

React UIs are built from **components** nested inside other components. Every React app has one root, and the full UI is a tree of these components.

```
App
├── Header
├── MessageList
│   ├── Message (id="1")
│   ├── Message (id="2")
│   └── Message (id="3")
└── ChatInput
    ├── <input>
    └── <button>Send</button>
```

Data flows **down** the tree as props. Events flow **up** via callback functions passed as props. State lives in the component that owns it (and can be shared downward).

---

## Files, in reading order

### Read first (`notes/`)

These files are annotated reference material — read them with the comments as your guide. They use React but aren't standalone runnables; they exist to explain one concept each.

| Order | File | What it teaches |
|---|---|---|
| 1 | `notes/components.tsx` | What a component is; JSX; rendering |
| 2 | `notes/props.tsx` | Passing data down the tree |
| 3 | `notes/state-usestate.tsx` | `useState` — mutable local state |
| 4 | `notes/effects-useeffect.tsx` | `useEffect` — side effects + cleanup |
| 5 | `notes/lists-and-conditional.tsx` | Rendering lists with keys; conditional rendering |

### Then run (`playground/`)

One small Vite + Tailwind app where each concept above is a live, toggleable demo. Modify the code and watch the browser update instantly (Vite's hot module reload, like a live Python notebook).

---

## How to run the playground

From the **repo root** (installs deps on first run only):

```bash
cd 03-react-fundamentals/playground && npm install && npm run dev
```

Or via the root shortcut (runs dev server only, assumes deps already installed):

```bash
npm run 03:playground
```

Then open `http://localhost:5173` in your browser.

**Vite** is the dev server + bundler — it serves your React app, watches files for changes, and pushes updates to the browser without a full reload. Think of it as the equivalent of `uvicorn --reload` for a Python web app, but for the frontend.

---

## Key concepts to watch for

**JSX** — the HTML-like syntax inside `.tsx` files. It looks like HTML but it's actually JavaScript function calls. `<Message text="hi" />` compiles to `React.createElement(Message, { text: "hi" })`. There's no Python equivalent.

**Props** — the inputs to a component, passed as HTML-like attributes. Python analogy: function arguments.

**State (`useState`)** — local mutable data owned by a component. When state changes, React re-renders that component (and its children). Python analogy: instance variables on a class, but mutation always goes through a setter.

**Effect (`useEffect`)** — code that runs *after* the component renders, for side effects: fetching data, subscribing to a websocket, setting up a timer. Python analogy: a callback that fires after a state change.

**Keys** — when rendering a list, each item needs a unique `key` prop so React can track which item changed. Python analogy: dictionary keys — they let you look up a specific item without scanning the whole list.

---

## Read-and-modify exercises

Make small changes in the playground and watch the browser update.

1. In `src/App.tsx`, find the initial messages array and add a fourth message. Watch the list re-render.
2. In `src/components/ChatInput.tsx`, change the placeholder text. Notice Vite updates the browser instantly.
3. In `src/components/MessageList.tsx`, remove the `key` prop from the list item. Open the browser console — you'll see React's warning about missing keys. Add it back.
4. In `src/components/ChatInput.tsx`, make the Send button disabled when the input is empty (hint: use the `disabled` prop on `<button>`).
5. Add a "Clear chat" button to `App.tsx` that resets the messages array to empty.

---

## What we're deliberately skipping

- **Class components** — the old API. You'll see them in older codebases but won't write new ones. The pattern is the same; just know they exist.
- **React.memo / useMemo / useCallback** — performance optimisations. Important later; not needed to understand the fundamentals.
- **Suspense** — an advanced pattern for async rendering. §05 recognition-targets covers it briefly.
- **Context and useReducer** — covered in §04.

---

## Stop condition

You're done with this section when you can:

- Open the playground, add a message by typing in the input, and explain exactly what caused the screen to update (which state changed, which component re-rendered, and why).
- Read `notes/effects-useeffect.tsx` and explain the dependency array without looking at the comments.

If you can do that, move on to `04-react-hooks-patterns/`.
