# 08 — Testing

**Objective:** read a test file and explain what it tests, what's mocked, and how the arrange/act/assert structure maps to production code.

Testing in TypeScript follows the same logic as pytest: arrange the conditions, trigger the action, assert the result. The tooling differs; the thinking is identical.

## The problem this section solves

You're adding tests to a TypeScript/React/Express codebase. For a utility function, you'd just call it and assert — but for a component that calls `fetch`, or an Express endpoint that queries a database, you don't know where to draw the line. Do you mock `fetch`? Do you mock the DB? Do you start a real server? And why does RTL tell you to use `getByRole` instead of `getByClassName`?

**Key insight:** a test is a choice of where to cut. Mock only what lives on the far side of your chosen boundary — the network, the DB, the parent's callback. Never mock the thing under test. The API test in this section mocks nothing at all: the whole in-process app is fast and deterministic enough to run real.

The Express endpoint in `api.test.ts` is the same shape as §06's routes. The React component in `component.test.tsx` uses the same hooks from §03 and §04. And the auth middleware from §07 is the kind of thing the API test's `beforeAll` setup would need to stub — the section exercises make that explicit.

---

## The machine: every test pins behaviour at one boundary

The thing that organises all of testing is a single question: **where do you cut?** A test exercises one side of a boundary and checks what crosses it. The three test types are just three different boundaries:

```
   UNIT                    COMPONENT                  API / E2E
   ────                    ─────────                  ─────────
   input ─► fn ─► output   props/events ─► DOM        HTTP req ─► response
   "given these args,      "given these props and     "given this request,
    this return value"      this click, this screen"   this status + body"

   boundary: a function    boundary: a component's     boundary: an HTTP
   signature               public surface (props +     endpoint
                           what the user does)
```

Two ideas fall out of this, and they're the whole section:

1. **Mocking is how you draw the boundary.** A mock (`vi.fn()`) replaces whatever lives *across* the cut — a network call, a callback a parent owns, a DB query — with a fake you control. You mock so the test exercises *only this side*: fast, deterministic, isolated. The decision "what do I mock?" is really "where is my boundary?" Mock the thing on the far side; never mock the thing under test.

2. **Test the boundary's *contract*, not its insides.** Assert on what crosses the cut (return value, rendered text, HTTP status), never on how the code got there (internal variables, CSS classes, call order you don't care about). A test bound to internals breaks on every refactor; a test bound to the contract only breaks when behaviour actually changes. This is the one rule RTL is built around.

```
   speed / isolation, by boundary (why you pick one):
   unit       ──  microseconds, zero I/O            → most of your tests
   component  ──  milliseconds, jsdom (fake DOM)    → interaction logic
   API        ──  in-process server, no real net    → the request lifecycle
```

Python anchors throughout: `describe`→a test class/module, `it`→`def test_…`, `expect(a).toBe(b)`→`assert a == b`, `vi.fn()`→`unittest.mock.MagicMock`, the in-process API test→Flask `test_client()` / FastAPI `TestClient`.

---

## The three test layers

```
              Boundary tested            Tool          Python equivalent
─────────────────────────────────────────────────────────────────────────
Unit          A function's input        Vitest         pytest
              → output, in isolation

Component     Props + user events       React Testing  Playwright/Selenium
              → rendered output         Library (RTL)  philosophy, unit-level

API           HTTP request → response,  Vitest +       pytest +
              full middleware path      in-process app TestClient
```

---

## Files, in reading order

| Order | File | Boundary it tests |
|---|---|---|
| 1 | `unit.test.ts` | A pure function's I/O; plus `vi.fn()` mocking basics |
| 2 | `component.test.tsx` | A component's props + user interaction → DOM |
| 3 | `api.test.ts` | An Express endpoint's request → status + body |

`vitest.setup.ts` runs before every test file (it registers the jsdom matchers like `toBeInTheDocument`) — the Vitest analog of a `conftest.py` that installs plugins.

---

## How to run

```bash
npm run 08:test          # run all tests once (CI mode)
npx vitest --watch       # re-run on file change (dev mode)
npx vitest 08-testing    # only this section's tests
```

The VS Code Vitest Explorer (in the devcontainer) lists tests in the sidebar — click to run or debug one.

---

## RTL's query hierarchy — and why the order is a priority list

RTL gives you several ways to find an element. The order is **not** alphabetical — it's "most like how a user (or assistive tech) perceives the element" first. Reach down the list only when the one above genuinely doesn't apply:

```
   getByRole(…, { name })   ← BEST: how screen readers see it (button, heading, textbox)
   getByLabelText(…)        ← form fields with a <label> or aria-label
   getByText(…)             ← visible, non-interactive text
   getByTestId(…)           ← LAST RESORT: a data-testid hook with no user meaning
```

```tsx
// GOOD — queries what the user perceives; survives refactors
const button = screen.getByRole("button", { name: /send/i });

// BAD — queries an implementation detail; breaks on a rename
const button = container.querySelector(".composer__send");
```

`getByTestId` is the escape hatch, not the default — every time you use it, you've stepped outside the user's perception. Sometimes necessary; never the first choice.

**One more distinction you'll use constantly:** `getBy*` *throws* if the element isn't found (assert it's present); `queryBy*` returns `null` (assert it's **absent**). Use `queryBy` only for "should NOT be in the document."

---

## When to mock — and when not to

| Mock it | Don't mock it |
|---|---|
| Network / `fetch`, DB, the clock, randomness — slow or nondeterministic | The function/component **under test** — that's what you're checking |
| A callback owned by a parent (`onSend`) — assert it was called correctly | Pure logic with no I/O — just call it and assert the output |
| Anything across your chosen boundary | Things cheap and deterministic enough to use for real (the in-process app) |

Note the API test mocks *nothing* — it runs the real Express app in-process because the boundary is the HTTP contract, and the app is fast and deterministic enough to use as-is. The boundary dictates the mock, not habit.

---

## Read-and-modify exercises

1. **`unit.test.ts`** — `formatMessage` returns `[role] content`. The "empty content" case is already tested; now decide the contract for an empty *role* and write a test pinning it. (What's the contract — your choice — and does the code honour it?)
2. **`component.test.tsx`** — there's a test that Send is disabled when empty. The "enabled after typing" test exists too; add one asserting the input is **cleared** after a successful send, and say which query you'd use to read the input's value.
3. **`api.test.ts`** — add tests for a DELETE endpoint: the 204 success case and the 404 case. What do you mock? (Answer: nothing — explain why.)

---

## What we're deliberately skipping

- **E2E (Playwright/Cypress)** — a real browser, real boundary-spanning; great for a few critical flows, too slow for the bulk. Know it exists.
- **Snapshot testing** — stores rendered HTML and fails on any change. Fragile and contract-blind; prefer explicit assertions.
- **Coverage** — `vitest --coverage` shows covered lines. A signal, not a target; don't chase 100%.

---

## Stop condition

You're done when you can:

- Look at any of the three test types and name **which boundary it cuts at**, then walk its arrange/act/assert.
- Explain what `vi.fn()` does and state the rule for what to mock (the far side of your boundary) vs what never to mock (the thing under test).
- Recite the query hierarchy `getByRole > getByLabelText > getByText > getByTestId` and explain why the order is a priority list, plus when to use `queryBy` instead of `getBy`.

As you build §10, these three test types map directly onto the layers you ship: unit tests for utility functions (token counting, message formatting), component tests for the chat UI, and API tests for `/api/chat` and `/api/conversations`. §09 is a good next step before building — reading a production codebase with tests in place gives you a reference point for what "well-tested" looks like at scale.
