/*
  useReducer — one pure function that owns all state transitions.

  PROBLEM
  -------
  Sending a chat message requires three state changes at once: append the user's
  message, flip `isLoading` on, and clear any previous error. With three separate
  useState calls, you'd dispatch three setters in a row — but they're scattered
  across event handlers, and any refactor that changes one risks missing another.
  More concretely: if you add an "optimistic update" feature later, you now need
  to find and update three separate setter calls in sync.

  CONCEPT
  -------
  useReducer collapses all state transitions into one pure function:
  (currentState, action) → nextState. You dispatch an action describing what
  happened; React calls the reducer with the current state and stores the return
  value. Every state machine edge lives in one switch, readable top-to-bottom,
  with no state logic scattered across handlers. You never call the reducer yourself
  — same inversion of control as components in §03.

  KEY INSIGHT
  -----------
  When one event must change multiple fields atomically, a reducer makes each
  transition explicit and readable in one place. useState is still right for a
  single independent value — a reducer there is just ceremony.

  IN THIS FILE
  ------------
  • ChatState + ChatAction — the state shape and discriminated union of events
  • chatReducer            — the pure transition function (four cases + exhaustiveness check)
  • ChatWithReducer        — the component: dispatches actions, reducer does the state work

  WHEN TO REACH FOR IT
  --------------------
  Several fields that must change together, or non-trivial transitions → useReducer.
  One independent value → useState.

  PYTHON ANALOGY
  --------------
  The functional reducer pattern: (state, action) -> new_state. Same shape as
  Redux — useReducer is the built-in, dependency-free version. In Python: a pure
  function taking a frozen dataclass and returning a new one.
*/

import React, { useReducer } from "react";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

// ── State shape ───────────────────────────────────────────────────────────────
// PURPOSE: everything that belongs together, in one slot. The reducer's job is to
// move this object from one valid configuration to the next.

interface ChatState {
  messages: Message[];
  isLoading: boolean;
  error: string | null;
}

const INITIAL_STATE: ChatState = {
  messages: [{ id: "0", role: "assistant", content: "Hi! How can I help?" }],
  isLoading: false,
  error: null,
};

// ── Actions ───────────────────────────────────────────────────────────────────
// PURPOSE: a discriminated union of everything that can happen. `type` is the
// discriminant TypeScript narrows on inside the reducer. An action is plain data,
// not a function — it says WHAT happened; the reducer decides what that DOES.
// Python: a sum type of events, like a tagged Enum of dataclasses.

type ChatAction =
  | { type: "send_message"; payload: string }   // user sent a message
  | { type: "receive_reply"; payload: string }  // API responded
  | { type: "set_error"; payload: string }      // API failed
  | { type: "clear_error" };                    // dismiss the error

// ── Reducer (DEFINITION) ──────────────────────────────────────────────────────
// PURPOSE: a PURE function — (currentState, action) → nextState. React supplies
// both. Pure means no fetches, no timers, no mutation. It only RETURNS the next
// state. Side effects live in the event handler, never in here.
//
// Read the four cases as the four edges of the chat's state machine.

function chatReducer(state: ChatState, action: ChatAction): ChatState {
  switch (action.type) {
    case "send_message":
      // Spread copies all existing fields; the lines below override some.
      // Never mutate `state` in place — return a NEW object (React compares by
      // reference to decide whether to re-render). Python: {**state, ...}.
      return {
        ...state,
        messages: [
          ...state.messages,
          { id: String(Date.now()), role: "user", content: action.payload },
        ],
        isLoading: true,  // all three changes happen in ONE atomic transition…
        error: null,      // …which is exactly why this is a reducer, not 3 setStates
      };

    case "receive_reply":
      return {
        ...state,
        messages: [
          ...state.messages,
          { id: String(Date.now()), role: "assistant", content: action.payload },
        ],
        isLoading: false,
      };

    case "set_error":
      return { ...state, isLoading: false, error: action.payload };

    case "clear_error":
      return { ...state, error: null };

    default: {
      // EXHAUSTIVENESS CHECK: every case above narrows `action`; here nothing is
      // left, so TS infers `action: never`. Add a new variant to ChatAction
      // without a case and this line fails to compile — the compile error IS the
      // reminder to handle the new action. Python: no built-in equivalent; use
      // mypy + assert_never.
      const _exhaustive: never = action;
      return _exhaustive;
    }
  }
}

// ── ChatWithReducer — the component (CALL SITES) ──────────────────────────────
// PURPOSE: renders the chat UI. Every visual element is driven off the single
// `state` object — JSX is a projection of the current state. Dispatches describe
// what happened; the reducer does the state work.

export function ChatWithReducer() {
  // useReducer(reducer, initial) returns [currentState, dispatch].
  // dispatch(action) → React runs chatReducer(state, action) → stores the result
  // → re-renders. You read state; you never write it directly.
  const [state, dispatch] = useReducer(chatReducer, INITIAL_STATE);
  const [draft, setDraft] = React.useState("");

  async function handleSend() {
    if (!draft.trim()) return;
    const text = draft;
    setDraft("");

    // CALL SITE: describe what happened. The reducer does the state work — this
    // single dispatch flips the UI into its "message sent + loading" look.
    dispatch({ type: "send_message", payload: text });

    // The async side effect lives HERE, not in the reducer (reducers stay pure).
    // When it resolves, a second dispatch moves the machine to the next phase.
    try {
      await new Promise((r) => setTimeout(r, 1000));
      dispatch({ type: "receive_reply", payload: `Echo: "${text}"` });
    } catch {
      dispatch({ type: "set_error", payload: "Failed to reach the server." });
    }
  }

  return (
    <div>
      {state.messages.map((msg) => (
        <div key={msg.id}>[{msg.role}] {msg.content}</div>
      ))}

      {/* `&&` short-circuit: isLoading is a real boolean — safe from the 0-renders
          footgun (covered in controlled-inputs.tsx). */}
      {state.isLoading && <p>Thinking…</p>}

      {state.error && (
        <div>
          Error: {state.error}
          <button onClick={() => dispatch({ type: "clear_error" })}>Dismiss</button>
        </div>
      )}

      <div>
        <input value={draft} onChange={(e) => setDraft(e.target.value)} />
        <button onClick={handleSend} disabled={state.isLoading}>Send</button>
      </div>
    </div>
  );
}
