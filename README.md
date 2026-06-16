# Full-Stack Web Dev Prep

**Goal:** Build enough TypeScript/React/Node fluency to read production codebases without freezing, hold credible architecture discussions, and ship a working full-stack LLM chatbot.

---

## The problem this prep solves

You can read any Python codebase cold: you know what the ORM is doing, why the async code is structured that way, how the distributed system fits together. But open a real Next.js app and you freeze — is this JSX or HTML? Is this React or TypeScript? Is that a framework pattern or a business-logic pattern? The gap isn't conceptual depth; it's vocabulary and pattern recognition in a new runtime.

**Key insight:** you already understand the hard parts (state machines, async, ORMs, event loops, typed interfaces). What you're building here is the web-specific vocabulary that maps what you know onto a new stack. The goal is recognition and fluency, not memorisation from scratch.

---

## Setup — dependencies and extensions

### In the devcontainer (automatic)

This repo ships with a `.devcontainer/` that handles everything below automatically when you open it in VS Code with the Dev Containers extension:

- **Runtime:** Node.js 22 LTS + TypeScript pre-installed
- **Global CLIs:** `tsx` (run `.ts` files directly, like `python script.py`) + `sqlite3`
- **VS Code extensions auto-installed:**

  | Extension | What it does |
  |---|---|
  | `ms-vscode.vscode-typescript-next` | Enhanced TS language server — inline errors, auto-imports |
  | `dbaeumer.vscode-eslint` | Surfaces lint errors as you type |
  | `esbenp.prettier-vscode` | Auto-formats on save (wired up in devcontainer settings) |
  | `Prisma.prisma` | Syntax highlighting + auto-complete for `.prisma` schema files |
  | `bradlc.vscode-tailwindcss` | Auto-complete for Tailwind class names in JSX/TSX |
  | `usernamehw.errorlens` | Surfaces TS/lint errors inline on the offending line |
  | `eamodio.gitlens` | Git blame, history, and diff enrichment |
  | `vitest.explorer` | Run/debug individual Vitest tests from the sidebar |
  | `humao.rest-client` | Send HTTP requests from a `.http` file — useful for §06 |

### First `npm install`

From the repo root, run once:

```bash
npm install
```

This installs the shared dev dependencies (TypeScript, tsx, Vitest, Prisma, Zod, Express types, etc.) used by sections §02–§08. The React sections (§03, §10) have their own `package.json` inside their folders — `npm install` there too when you reach them.

### OpenAI key (for §10)

Set it once on your host machine, then rebuild the container — it's passed in automatically via `remoteEnv` in `.devcontainer/devcontainer.json`:

```bash
export OPENAI_API_KEY=sk-...   # add this to your ~/.zshrc or ~/.bashrc
```

Never hard-code keys; never commit a `.env` file with real values.

---

## Phase map

| Phase | Sections | Focus | Rough floor |
|---|---|---|---|
| 1 | §01 §02 | Browser basics + TypeScript | 4–6 hrs |
| 2 | §03 §04 | React fundamentals + hooks | 6–8 hrs |
| 3 | §05 §06 | Ecosystem literacy + backend | 4–6 hrs |
| 4 | §07 §08 | Auth + testing | 4–5 hrs |
| 5 | §09 §10 | Real-repo read + build the chatbot | 8–12 hrs |

**~30 hours as a floor to aim at, not a ceiling to fill.** Move on when you hit the stop condition — don't pad.

---

## Suggested day shape (sketch, not a schedule)

| Day | Sections | Notes |
|---|---|---|
| D1 | §01 | Quick — you've done JS before |
| D2 | §02 | TypeScript is the unlock for everything else |
| D3 | §03 | React fundamentals — the component model |
| D4 | §04 + §05 | Hooks patterns + ecosystem literacy |
| D5 | §06 | Backend — typed routes, Prisma, data flow |
| D6 | §07 | Auth — hand-roll first, then recognise abstractions |
| D7 | §08 | Testing — mirrors pytest; fast to get fluent |
| D8–10 | §10 | Build the chatbot; use §09 as a break if you want |

§09 (real-repo read) is optional enrichment — do it any time you want grounding in a real codebase.

---

## All stop conditions at a glance

| § | You're done when… |
|---|---|
| 01 | You can change a bubble colour in DevTools and explain what HTML/CSS/JS each contributed |
| 02 | You can read a TS file with interfaces and generics and explain what every annotation guarantees |
| 03 | You can read a component and trace its render + re-render triggers; can change state in the playground and predict the result |
| 04 | Given any component, you can name the hooks and justify each one |
| 05 | You can read an unfamiliar `package.json` and explain each major dependency's job and the alternative a team might have chosen |
| 06 | You can build a CRUD endpoint backed by a DB query and narrate the full request lifecycle |
| 07 | You can trace a request through login → session creation → cookie → protected route, and read auth middleware and explain the check |
| 08 | You can read any of the three test types (unit / component / API) and explain the arrange/act/assert and what's mocked |
| 09 | On the chosen repo, you can locate routing, data layer, and auth within ~10 minutes and sketch the architecture |
| 10 | A signed-in user can hold a conversation that streams from the LLM and persists across sessions, and you can explain every layer |

---

## Contingency rules

- **Always protect:** §02 (TypeScript), §03 and §04 (React core). Everything builds on these.
- **Drop first if time/energy runs short:** §08 (testing) and §09 (real-repo read) — valuable but not load-bearing.
- **Compress if needed:** §05 (ecosystem map) can be read as reference rather than worked through step-by-step.

---

## Running the examples

```bash
# §02 TypeScript — run any example file directly:
npm run 02:01        # 01-types.ts
npm run 02:02        # 02-interfaces-and-types.ts
npm run 02:03        # 03-generics.ts
npm run 02:04        # 04-narrowing.ts
npm run 02:05        # 05-utility-types.ts

# §03 React — run the from-scratch mini-React first (no browser, no deps):
npm run 03:model        # runs a 70-line React engine; prints how it works

# §03 React playground:
npm run 03:playground   # starts Vite dev server at http://localhost:5173

# §06 Backend:
npm run 06:server       # starts Express at http://localhost:3001
npm run 06:queries      # runs Prisma query examples

# §07 Auth examples:
npm run 07:sessions     # hand-rolled session demo
npm run 07:cookies      # cookie lifecycle demo

# §08 Tests:
npm run 08:test         # runs all Vitest tests
```
