# 08 — Testing

**Objective:** read a test file and explain what it tests, what's mocked, and how the arrange/act/assert structure maps to production code.

Testing in JavaScript/TypeScript follows the same principles as pytest: arrange the conditions, trigger the action, assert the result. The tooling differs but the logic is identical.

---

## The three test layers

```
              What it tests              Tool          Python equivalent
─────────────────────────────────────────────────────────────────────────
Unit          A single function's        Vitest         pytest
              logic in isolation

Component     A React component's        React Testing  Playwright/Selenium
              rendered output and        Library (RTL)  (but for units, not
              user interaction                          E2E)

API / E2E     An HTTP endpoint —         Vitest +       pytest +
              the full request path      supertest or   requests/httpretty
              including middleware       inline fetch
```

---

## Files, in reading order

| Order | File | What it teaches |
|---|---|---|
| 1 | `unit.test.ts` | Vitest basics: describe/it/expect; mocking; pure function tests |
| 2 | `component.test.tsx` | React Testing Library: render, query, interact, assert |
| 3 | `api.test.ts` | Testing an Express endpoint; in-process server; no real DB |

---

## How to run

```bash
npm run 08:test          # run all tests once (CI mode)
npx vitest --watch       # re-run on file change (dev mode)
npx vitest 08-testing    # run only this section's tests
```

Vitest will print pass/fail per test, with diff output on failure.

The VS Code Vitest Explorer extension (installed in the devcontainer) shows tests in the sidebar — click to run or debug individual tests.

---

## Vitest vs Jest

Vitest is the Vite team's test runner. Its API is intentionally compatible with Jest (the older, more widely-used runner) so most Jest documentation applies. The main difference: Vitest uses native ESM and runs faster in Vite-based projects.

When you read open-source code: `jest.fn()` → `vi.fn()`, `jest.mock()` → `vi.mock()`, `jest.spyOn()` → `vi.spyOn()`. Same shapes, different import.

**Python equivalent:** pytest. The describe/it/expect pattern maps to:
- `describe("X", () => {})` → a test class or module
- `it("should Y", () => {})` → a `def test_y():` function
- `expect(actual).toBe(expected)` → `assert actual == expected`

---

## React Testing Library philosophy

RTL's guiding principle: "The more your tests resemble the way your software is used, the more confidence they give you."

This means:
- Query by accessible text, role, or label — NOT by CSS class or component internals
- Test the rendered output, not implementation details
- If a refactor doesn't change the user-visible behaviour, the test shouldn't break

```tsx
// GOOD: queries what the user sees
const button = screen.getByRole("button", { name: /send/i });

// BAD: queries implementation details — breaks on any rename
const button = container.querySelector(".composer__send");
```

**Python analogy:** closest to Selenium/Playwright's "test the UI as the user sees it" philosophy, but at the component level (no real browser needed).

---

## Read-and-modify exercises

1. **`unit.test.ts`** — `formatMessage` always returns `[role] content`. Add a test case for an empty content string. Should it throw, return `[role] `, or return something else? Decide, then write the test and make it pass.
2. **`component.test.tsx`** — the Send button test checks it's disabled when the input is empty. Add a test that types a message and checks the button becomes enabled.
3. **`api.test.ts`** — add a test for the DELETE endpoint: `DELETE /api/messages/:id`. Test both the success case and the 404 case.

---

## What we're deliberately skipping

- **E2E testing (Playwright/Cypress)** — runs a real browser; excellent for critical flows; slow for unit work. Worth knowing they exist.
- **Snapshot testing** — stores the rendered HTML of a component and fails when it changes. Fragile; controversial. Prefer explicit assertions.
- **Test coverage** — `vitest --coverage` shows which lines are covered. Useful signal; don't chase 100%.

---

## Stop condition

You're done with this section when you can:

- Look at any of the three test types and explain the arrange/act/assert structure.
- Explain what `vi.fn()` does and why you'd mock a function in a test.
- Describe RTL's query hierarchy (`getByRole` > `getByLabelText` > `getByText`) and why `getByRole` is preferred.
