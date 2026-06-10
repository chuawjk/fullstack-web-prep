/*
  THE ASYNC STATE MACHINE — the pattern you'll use every time you fetch data.

  Any async operation in a UI has three possible phases:
    loading  → waiting for the response
    error    → the request failed
    success  → the data arrived

  Plus an optional fourth:
    idle     → hasn't started yet (before first fetch, or after a reset)

  Model these phases explicitly as state. Then render based on the current phase.
  If you don't model phases explicitly, you end up with impossible combinations
  like isLoading=true + error="something" at the same time — those lead to bugs.

  Python analogy: a state machine. Think of it like a Pydantic-discriminated union
  of result types: Loading | Error | Success.
*/

import { useState, useEffect } from "react";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

// === PATTERN 1: Multiple boolean flags (fragile — don't do this) ==============
// Common in older code. The flags can get out of sync.
//
//   const [isLoading, setIsLoading] = useState(false);
//   const [hasError, setHasError] = useState(false);
//   const [data, setData] = useState(null);
//
// What does  isLoading=true + hasError=true  mean? It's ambiguous.
// Avoid this pattern.

// === PATTERN 2: Discriminated union state (correct) ==========================
// Model the phases as a single `status` value. Use a discriminated union type
// so TypeScript can narrow the state and prevent impossible combinations.

type FetchState<T> =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "error"; error: string }
  | { status: "success"; data: T };

// A generic custom hook — works for any data type T.
// Python analogy: a generic repository pattern or a typed async executor.
function useAsyncData<T>(fetchFn: () => Promise<T>, deps: unknown[]) {
  const [state, setState] = useState<FetchState<T>>({ status: "idle" });

  useEffect(() => {
    setState({ status: "loading" });

    fetchFn()
      .then(data => setState({ status: "success", data }))
      .catch(err => setState({ status: "error", error: String(err) }));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
  // deps: the caller controls when the effect re-runs (e.g. when a userId changes).

  return state;
}

// === COMPONENT using the hook =================================================
// The component destructures the state and renders based on status.
// TypeScript narrows each branch — in the "success" branch, `state.data` exists.

function MessageHistory({ userId }: { userId: string }) {
  const state = useAsyncData<Message[]>(
    () =>
      // Simulate an API call — in §10 this hits a real Express endpoint.
      new Promise((resolve, reject) => {
        setTimeout(() => {
          if (Math.random() > 0.3) {
            resolve([
              { id: "1", role: "user", content: "Hello!" },
              { id: "2", role: "assistant", content: "Hi there!" },
            ]);
          } else {
            reject(new Error("Network error"));
          }
        }, 1000);
      }),
    [userId]  // re-fetch when userId changes
  );

  // Render the correct UI for each phase.
  if (state.status === "idle") return <p>Waiting to load…</p>;
  if (state.status === "loading") return <p>Loading messages…</p>;
  if (state.status === "error") return <p>Error: {state.error}</p>;

  // status === "success" — TypeScript knows state.data exists here.
  return (
    <ul>
      {state.data.map(msg => (
        <li key={msg.id}>[{msg.role}] {msg.content}</li>
      ))}
    </ul>
  );
}

export { useAsyncData, MessageHistory };
export type { FetchState };
