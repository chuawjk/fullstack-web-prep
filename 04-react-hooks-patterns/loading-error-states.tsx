/*
  Async state machines — modeling loading/error/success as one typed value

  PROBLEM
  -------
  Say you're loading a user's message history from an API. While the request is
  in flight you need to show a spinner; if it fails you show an error; if it
  succeeds you render the list. The instinct is three separate flags: `isLoading`,
  `hasError`, `data`. But three independent booleans give you 2³ = 8 possible
  combinations, and only 4 of them mean anything. What does isLoading=true AND
  hasError=true mean? Nothing — yet nothing prevents that combination from
  occurring, and you'll write defensive checks for it everywhere. That's where
  the bugs hide.

  CONCEPT
  -------
  Collapse the three flags into one `status` field on a discriminated union.
  Each variant carries exactly the data that phase needs — `error` only on the
  error variant, `data` only on success — and nothing it doesn't. TypeScript
  narrows each branch automatically, so touching `state.data` outside the
  success branch is a compile error, not a runtime surprise.

  KEY INSIGHT
  -----------
  If two state values can both be true simultaneously but shouldn't be, your
  state representation is wrong. One `status` field makes the impossible states
  unrepresentable.

  IN THIS FILE
  ------------
  • FetchState<T>       — the discriminated union type (four variants)
  • useAsyncData<T>     — a generic hook that drives any fetch through the phases
  • MessageHistory      — a component that calls the hook to load chat messages,
                          with a simulated API that randomly fails ~30% of the
                          time so you can see every phase in action

  WHEN TO USE IT
  --------------
  Reach for this pattern whenever a state change must synchronise with something
  outside React — a network request, a file read, a WebSocket handshake. If the
  work is pure computation from props, derive it during render; you need none of
  this.

  PYTHON ANALOGY
  --------------
  A Pydantic discriminated union / tagged union — `status` is the discriminator
  field, each variant is a separate model, and the union is the return type of
  your async function. Same idea: make illegal states unrepresentable at the
  type level.
*/

import { useState, useEffect } from "react";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

// ── Anti-pattern: separate boolean flags (don't do this) ──────────────────────
// PURPOSE: shows why three independent flags are the wrong model.
//
// With isLoading, hasError, and data as separate slots, there's nothing
// stopping you from setting isLoading=true and hasError=true at the same
// time. That state has no meaning, and you'll write defensive checks for it
// everywhere. The fix is below.
//
//   const [isLoading, setIsLoading] = useState(false);
//   const [hasError,  setHasError]  = useState(false);
//   const [data,      setData]      = useState(null);

// ── FetchState<T> — the discriminated union ───────────────────────────────────
// PURPOSE: a single type that covers all four phases, with each variant
// carrying exactly the fields that phase has — no more, no less.
//
// `status` is the discriminator: TypeScript uses it to narrow the type in each
// branch of an if/switch, so `state.data` is only accessible (and only typed)
// inside the `status === "success"` branch.

type FetchState<T> =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "error"; error: string }
  | { status: "success"; data: T };

// ── useAsyncData — generic fetch hook ────────────────────────────────────────
// PURPOSE: runs any async function and exposes the current phase as one
// FetchState value — callers never manage loading/error flags manually.
//
// Generic over T so the same hook serves any data shape. `fetchFn` is supplied
// by the caller; the hook only knows how to drive the state machine around it:
// idle → loading → success | error. `deps` is forwarded to useEffect so the
// caller controls when a re-fetch fires (e.g. when userId changes).

function useAsyncData<T>(fetchFn: () => Promise<T>, deps: unknown[]) {
  const [state, setState] = useState<FetchState<T>>({ status: "idle" });

  useEffect(() => {
    setState({ status: "loading" });

    fetchFn()
      .then((data) => setState({ status: "success", data }))
      .catch((err) => setState({ status: "error", error: String(err) }));
    // deps is forwarded deliberately — the caller controls re-fetch timing,
    // not this hook. The disable below acknowledges that intentional pattern.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return state;
}

// ── MessageHistory — component using the hook ─────────────────────────────────
// PURPOSE: demonstrates how a component collapses to one branch-per-phase
// when state is a discriminated union rather than scattered flags.
//
// Each early return narrows `state` to its variant, so the final return can
// access `state.data` without a null check — TypeScript already knows by then
// that status === "success". The simulated API rejects ~30% of the time so
// you can see both the error and success branches without breaking anything.

function MessageHistory({ userId }: { userId: string }) {
  const state = useAsyncData<Message[]>(
    () =>
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
    [userId] // re-fetch whenever userId changes
  );

  if (state.status === "idle") return <p>Waiting to load…</p>;
  if (state.status === "loading") return <p>Loading messages…</p>;
  if (state.status === "error") return <p>Error: {state.error}</p>;

  // Only reachable when status === "success" — TS knows state.data exists here.
  return (
    <ul>
      {state.data.map((msg) => (
        <li key={msg.id}>[{msg.role}] {msg.content}</li>
      ))}
    </ul>
  );
}

export { useAsyncData, MessageHistory };
export type { FetchState };
