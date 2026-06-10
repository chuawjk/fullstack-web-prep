/*
  useReducer is an alternative to useState for COMPLEX STATE with multiple
  related values that change together, or when the next state depends on
  the previous state in non-trivial ways.

  Python analogy: the reducer pattern from functional programming —
  a pure function (state, action) -> newState. Familiar if you've seen Redux,
  but useReducer is the lightweight built-in version.

  Rule of thumb:
    useState  → one simple value or a few independent values
    useReducer → multiple values that change TOGETHER, or complex transitions

  The chat state machine is a classic useReducer case: adding a message,
  setting the loading state, and clearing the error all need to happen
  atomically when a new message is sent.
*/

import React, { useReducer } from "react";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

// === STATE SHAPE ==============================================================
// All the values that belong together — defined as one interface.
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

// === ACTIONS ==================================================================
// A discriminated union of every thing that can happen.
// Each action type maps to a different state transition.
// Python: like a command pattern or a sum type of events.

type ChatAction =
  | { type: "send_message"; payload: string }   // user sent a message
  | { type: "receive_reply"; payload: string }  // API responded
  | { type: "set_error"; payload: string }      // API failed
  | { type: "clear_error" };                    // dismiss the error

// === REDUCER ==================================================================
// A PURE function: (currentState, action) → nextState.
// PURE = no side effects, no API calls, no mutations. Just returns the next state.
// Python equivalent: def reducer(state: ChatState, action: ChatAction) -> ChatState:

function chatReducer(state: ChatState, action: ChatAction): ChatState {
  switch (action.type) {
    case "send_message":
      return {
        ...state,  // spread: copy all existing fields, then override the ones below
        messages: [
          ...state.messages,
          { id: String(Date.now()), role: "user", content: action.payload },
        ],
        isLoading: true,  // start loading as soon as user sends
        error: null,      // clear any previous error
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
      // EXHAUSTIVENESS CHECK: after handling all four cases above, TypeScript
      // narrows `action` to the `never` type here — nothing is left to match.
      // If you add a new variant to ChatAction without adding a case for it,
      // TypeScript will error on the line below:
      //   "Type '{ type: "new_action" }' is not assignable to type 'never'."
      // That compile error is the signal to add the missing case.
      // Python: there's no built-in equivalent — you'd use mypy + exhaustive checks.
      const _exhaustive: never = action;
      return _exhaustive;
    }
  }
}

// === THE COMPONENT ============================================================
export function ChatWithReducer() {
  // useReducer returns [currentState, dispatchFn]
  // dispatch(action) → calls the reducer → React re-renders with the new state
  const [state, dispatch] = useReducer(chatReducer, INITIAL_STATE);
  const [draft, setDraft] = React.useState("");

  async function handleSend() {
    if (!draft.trim()) return;
    const text = draft;
    setDraft("");

    // Dispatch the user's message — reducer handles the state transition.
    dispatch({ type: "send_message", payload: text });

    // Simulate an async API call.
    try {
      await new Promise(r => setTimeout(r, 1000));
      dispatch({ type: "receive_reply", payload: `Echo: "${text}"` });
    } catch {
      dispatch({ type: "set_error", payload: "Failed to reach the server." });
    }
  }

  return (
    <div>
      {state.messages.map(msg => (
        <div key={msg.id}>[{msg.role}] {msg.content}</div>
      ))}

      {state.isLoading && <p>Thinking…</p>}

      {state.error && (
        <div>
          Error: {state.error}
          <button onClick={() => dispatch({ type: "clear_error" })}>Dismiss</button>
        </div>
      )}

      <div>
        <input value={draft} onChange={e => setDraft(e.target.value)} />
        <button onClick={handleSend} disabled={state.isLoading}>Send</button>
      </div>
    </div>
  );
}
