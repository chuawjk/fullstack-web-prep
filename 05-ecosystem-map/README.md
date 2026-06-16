# 05 — Ecosystem Map

**Objective:** given a `package.json`, name every major dependency and its role — what it does, why a team chose it, what the alternative would have been, and **when in the lifecycle it actually runs**.

This is a conceptual section — mostly prose and diagrams, minimal code. Read it as a reference you'll return to when an unfamiliar package shows up in a real codebase.

## The problem this section solves

You open a Next.js repo's `package.json` and see 40 entries: `vite`, `tailwindcss`, `zod`, `prisma`, `@prisma/client`, `better-auth`, `vitest`, `@testing-library/react`. You can't tell what runs in the browser vs the server, what runs at build time vs request time, or why there are two Prisma entries — and you can't explain to your team why `tailwindcss` is in `devDependencies` but `zod` is in `dependencies`.

**Key insight:** every dependency runs at a specific time in a specific place. Ask "build-time or runtime, and which environment?" before anything else — that one question decodes the whole `package.json` and explains the `dependencies` vs `devDependencies` split.

---

## The one question that decodes any dependency: *when does it run?*

The thing that makes a JS toolchain confusing isn't the tool count — it's that the tools run at **different times, in different places**, and a `package.json` lists them all flat in one pile. Before memorising any tool, place it on this grid:

```
                        BUILD TIME                         RUNTIME
                  (your machine / CI, once)        (every request or page load)
              ┌──────────────────────────────┬──────────────────────────────┐
   SERVER     │  tsc, Prisma CLI, ESLint,    │  Express, @prisma/client,    │
   / Node     │  Vitest, the bundler         │  Zod (.parse), openai SDK    │
              ├──────────────────────────────┼──────────────────────────────┤
   CLIENT     │  Tailwind (scans → emits CSS)│  React, react-dom, clsx,     │
   / browser  │  — runs at build, not in the │  Zod (client validation),    │
              │  browser                     │  React Router                │
              └──────────────────────────────┴──────────────────────────────┘
```

Two payoffs from this grid:

1. **It explains `dependencies` vs `devDependencies`.** Build-time-only tools (tsc, bundler, Prisma CLI, test runner) go in `devDependencies` — the shipped app never imports them. Runtime tools go in `dependencies`. That's the whole rule.
2. **It tells you where the cost lands** — the recurring "cheap in *which* layer?" question. A TypeScript type costs **zero at runtime** (it's erased at build). A Zod `.parse()` costs CPU on **every** request. They look similar in source; they bill to completely different layers. Keep asking "build-time or runtime?" for every tool below.

```
┌─────────────────────────────────────────────────────────────────┐
│  You write TypeScript + JSX                                       │
└────────────────────┬────────────────────────────────────────────┘
                     ▼   BUILD TIME (once, on your machine / CI)
┌─────────────────────────────────────────────────────────────────┐
│  tsc: checks types, erases them, emits JS   (Python: mypy + a transpiler) │
│  bundler (Vite/Webpack/Turbopack): many files → few optimised bundles    │
│  Tailwind: scans your JSX, emits only the CSS classes you used    │
└────────────────────┬────────────────────────────────────────────┘
                     ▼   RUNTIME (every load / request)
┌─────────────────────────────────────────────────────────────────┐
│  Browser runs the bundle (React); server runs Node (Express/Prisma)│
└─────────────────────────────────────────────────────────────────┘
```

---

## Key tools and their roles

Each entry: what it does, **when it runs**, why teams pick it, the alternative, the Python anchor, and when *not* to reach for it.

### Vite — dev server + bundler · *build time*

**What it does:** serves your React app in development (instant hot module reload) and bundles it for production. Replaces Webpack in most new projects.

**Why teams choose it:** far faster in dev — it serves native ES modules and compiles on demand with esbuild (Go), instead of bundling everything upfront. Millisecond cold start vs seconds.

**Alternative:** Create React App (deprecated), Webpack, Parcel. Next.js uses its own (Turbopack).

**Reach for it / skip it:** default for a plain React SPA. Skip it if you're on Next.js — the framework owns the bundler; adding Vite would fight it.

**Python anchor:** `uvicorn --reload` for the frontend — watches files, pushes updates.

---

### Tailwind CSS — utility-first CSS · *build time*

**What it does:** you compose atomic classes (`flex`, `p-4`, `text-sm`, `bg-blue-600`) directly in JSX; at build time Tailwind **scans your files** and emits a stylesheet containing only the classes you actually used. Nothing Tailwind-specific runs in the browser — by the time the browser loads, it's plain CSS.

**Why teams choose it:** no class naming, no jumping to a separate CSS file, styles co-located with markup, and the scan-and-emit step means unused styles never ship.

**Alternative:** CSS Modules (scoped files), styled-components / Emotion (CSS-in-JS — note: those run at *runtime*), plain CSS. Bootstrap is the opposite philosophy (pre-built semantic components).

**Reach for it / skip it:** great when a team owns its markup and wants velocity. Skip when a design system already ships styled components, or the team prefers semantic class names.

**Python anchor:** none — CSS frameworks are frontend-specific.

**The boundary that trips people:** because Tailwind only emits classes it *sees* in your source, dynamically-constructed class strings (`` `bg-${color}-500` ``) get scanned away and silently vanish. That's the build-time scan biting you — use complete class names or safelist them.

---

### Zod — runtime schema validation + type inference · *runtime*

**What it does:** defines a schema that validates data **at runtime** AND infers a TypeScript type from that same schema — one source of truth.

```ts
import { z } from "zod";

const MessageSchema = z.object({
  id: z.string(),
  role: z.enum(["user", "assistant"]),
  content: z.string(),
});

type Message = z.infer<typeof MessageSchema>; // the TYPE, derived at build time (free)
const msg = MessageSchema.parse(req.body);    // the CHECK, run at runtime (costs CPU, can throw)
```

**Why teams choose it — and this is the keystone of the section:** TypeScript types are **erased at build time**, so they cannot check anything that arrives while the app is running — an HTTP body, a JSON response, a form payload could be any shape and TS would never know. Zod is the runtime guard TS can't be. Notice the one schema bills to *both* layers: `z.infer` is free (build-time type), `.parse` costs CPU (runtime check). That split is exactly the distinction the grid above is teaching.

**Alternative:** Yup (less TS-friendly), Joi, io-ts, Valibot.

**Reach for it / skip it:** reach for it at every **trust boundary** — request bodies, env vars, third-party responses. Skip it for data that never left your typed code; validating that is just runtime cost for a guarantee TypeScript already gave you for free.

**Python anchor:** Pydantic — same idea, same place in the stack. Schema = model = validator.

**Where you'll see it next:** §06's `express-server.ts` shows Zod validating incoming request bodies in a typed Express route — the cleanest illustration of the TS-erased-but-Zod-guards pattern.

---

### Prisma — type-safe ORM · *split: CLI is build-time, client is runtime*

**What it does:** you define your schema in `schema.prisma`, run `prisma generate` (build time), and get a fully-typed client. Queries and their results are typed end to end — no casting.

```ts
const messages = await prisma.message.findMany({
  where: { userId: "u-1" },
  orderBy: { createdAt: "asc" },
}); // TS knows the exact shape of `messages`
```

**The split worth internalising:** `prisma` (the CLI — generate, migrate, studio) is a **dev tool → devDependencies**. `@prisma/client` (the thing your server imports at runtime) is a **runtime dep → dependencies**. Same product, two packages, two sides of the grid. This is the single most common "why are there two Prisma entries?" question.

**Why teams choose it:** generated types, readable query API, first-class migrations (`prisma migrate dev`), works across SQLite/Postgres/MySQL.

**Alternative:** Drizzle (SQL-first, newer), TypeORM, Knex (query builder only), raw `pg`/`better-sqlite3`.

**Reach for it / skip it:** reach for it when you want typed queries and managed migrations without writing SQL by hand. Skip it (drop to Drizzle or raw SQL) when you need full control over complex queries Prisma's API can't express, or want the generated SQL to match a hand-tuned shape.

**Python anchor:** SQLAlchemy / Django ORM. Migration workflow ≈ Alembic.

**Where you'll see it next:** §06 works through the full Prisma workflow — write the schema, run `prisma generate`, run `prisma migrate dev`, query with the typed client. The two-package split (`prisma` CLI vs `@prisma/client`) makes immediate sense once you're doing it.

---

### React Router vs Next.js routing

The distinction is *where routing decisions happen* — another boundary question.

**React Router:** client-side routing in a plain React (Vite) app. The router lives entirely in browser JS — the server returns the same HTML for every URL, and JS swaps components based on the address bar. *Runtime, client.*

**Next.js App Router:** file-system routing built into the framework. Folder structure defines routes; the server renders initial HTML, then the client takes over. *Spans server and client.*

```
Next.js App Router structure:
app/
  page.tsx           → renders at /
  chat/
    page.tsx         → renders at /chat
    [id]/
      page.tsx       → renders at /chat/123 (dynamic route)
  layout.tsx         → wraps every page (nav, providers)
  api/
    messages/
      route.ts       → API endpoint at /api/messages
```

**Reach for which:** React Router for a pure SPA with a separate API. Next.js when you want server rendering, SEO, and colocated API routes in one framework.

---

### Vitest + React Testing Library · *build time / CI*

**Vitest:** test runner from the Vite team. Jest-compatible API (`describe`, `it`, `expect`) but faster and ESM-native. Runs in CI and dev, never ships. Python anchor: pytest. (Covered in depth in §08.)

**React Testing Library (RTL):** renders components and queries them the way a *user* would — by accessible text, role, label — not by implementation details (class names, internal state).

**Why RTL's philosophy matters:** tests bound to internal structure break on every refactor even when the UI still works. Querying by what the user perceives means the test only fails when the *behaviour* changes. Python anchor: closer to Playwright/Selenium's user-facing philosophy than to unit testing.

**Reach for it / skip it:** Vitest+RTL for unit and component tests (fast, no real browser). Skip to Playwright/Cypress when you need a *real* browser exercising a full user flow end-to-end — slower, but the only way to catch what jsdom fakes away. Covered in depth in §08.

---

### Auth libraries

§07 hand-rolls session auth first (so you understand every line), then introduces these as recognition targets. Short version:

- **Better Auth** — modern, TypeScript-native, self-hosted. Current recommended choice for new apps.
- **Auth.js / NextAuth** — most widely used for Next.js. v5 is current.
- **Lucia (deprecated as a library)** — now a learning resource for sessions from scratch. You read it; you don't install it.

Better Auth is what §10 uses — the hand-rolled session in §07 is its conceptual foundation.

---

## Files in this section

| File | What it covers |
|---|---|
| `README.md` (this file) | The build-time/runtime grid, tool roles, alternatives, Python anchors |
| `annotated-package-json.md` | A realistic `package.json` walked line by line |
| `recognition-targets.md` | App Router vs Pages Router; React Server Components; TanStack Query |

---

## Stop condition

You're done when you can:

- Open an unfamiliar `package.json`, point at each major dependency, name its role and the alternative — **and say whether it runs at build time or runtime, and why that puts it in `dependencies` vs `devDependencies`.**
- Explain in one sentence what Zod adds that TypeScript alone cannot — naming the type-erasure boundary.
- Describe what Tailwind's `content` scan does at build time, and why a dynamically-built class name can vanish.

If you can do that, move on to `06-backend-node-express-prisma/`.
