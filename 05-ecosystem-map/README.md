# 05 — Ecosystem Map

**Objective:** given a `package.json`, name every major dependency and its role — what it does, why a team chose it, and what the alternative would have been.

This is a conceptual section — mostly prose and diagrams, minimal code. Read it as a reference. You'll come back to it when you encounter an unfamiliar package in a real codebase.

---

## The modern full-stack JavaScript toolchain

```
┌─────────────────────────────────────────────────────────────────┐
│  Developer writes TypeScript + JSX                              │
└────────────────────┬────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────────┐
│  TypeScript compiler (tsc)                                      │
│  Checks types; emits JavaScript                                 │
│  Python analogy: mypy + a transpiler                            │
└────────────────────┬────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────────┐
│  Bundler (Vite / Webpack / Turbopack)                           │
│  Combines many JS/CSS files → a small set of optimised bundles  │
│  Dev mode: hot module reload, instant updates in browser        │
│  Python analogy: there's no equivalent — Python doesn't bundle  │
└────────────────────┬────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────────┐
│  Browser loads the bundle and runs it                           │
└─────────────────────────────────────────────────────────────────┘
```

---

## Key tools and their roles

### Vite — dev server + bundler

**What it does:** serves your React app in development (with instant hot module reload) and bundles it for production. Replaces Webpack in most new projects.

**Why teams choose it:** dramatically faster than Webpack in development — uses native ES modules and esbuild (written in Go) instead of bundling everything upfront. Cold start in milliseconds vs seconds.

**Alternative:** Create React App (deprecated), Webpack, Parcel. For Next.js: Turbopack (the built-in bundler).

**Python analogy:** like `uvicorn --reload` for the frontend — a dev server that watches files and pushes updates.

---

### Tailwind CSS — utility-first CSS framework

**What it does:** generates atomic utility classes (`flex`, `p-4`, `text-sm`, `bg-blue-600`) that you compose directly in your JSX instead of writing CSS files.

**Why teams choose it:** no naming classes, no context-switching to a CSS file, styles co-located with markup, dead-code elimination so the final bundle only includes classes you actually use.

**Alternative:** CSS Modules (scoped CSS files), styled-components / Emotion (CSS-in-JS), plain CSS. Bootstrap is the opposite philosophy: pre-built components with semantic class names.

**Python analogy:** none — CSS frameworks are a frontend-specific concept.

**Common concern:** "class names get long." Yes. The trade-off is that you never leave the component file.

---

### Zod — runtime schema validation + TypeScript inference

**What it does:** defines schemas that validate data at runtime AND infer TypeScript types from those schemas — one source of truth.

```ts
import { z } from "zod";

const MessageSchema = z.object({
  id: z.string(),
  role: z.enum(["user", "assistant"]),
  content: z.string(),
});

// Infer the TS type from the schema — no duplication:
type Message = z.infer<typeof MessageSchema>;

// Validate + parse (throws on failure):
const msg = MessageSchema.parse(req.body);
```

**Why teams choose it:** TypeScript types are erased at runtime — they can't validate incoming HTTP request bodies or API responses. Zod bridges the gap: the schema IS the type.

**Alternative:** Yup (similar; less TypeScript-friendly), Joi, io-ts, Valibot.

**Python analogy:** Pydantic. Essentially identical concept — schema = model = validator.

---

### Prisma — ORM for Node.js

**What it does:** a type-safe database client. You define your schema in `schema.prisma`, run `prisma generate`, and get a fully-typed client. Query results are typed — no casting.

```ts
const messages = await prisma.message.findMany({
  where: { userId: "u-1" },
  orderBy: { createdAt: "asc" },
});
// TypeScript knows exactly what shape `messages` is.
```

**Why teams choose it:** auto-generated TypeScript types, readable query API, easy migrations (`prisma migrate dev`), works with SQLite/PostgreSQL/MySQL.

**Alternative:** Drizzle ORM (newer; SQL-first), TypeORM, Knex (query builder, not full ORM), raw `pg`/`better-sqlite3`.

**Python analogy:** SQLAlchemy (ORM) or Django ORM — same role. Prisma's migration workflow is similar to Alembic.

---

### React Router vs Next.js routing

**React Router:** client-side routing library. You install it in a plain React (Vite) app. The "router" lives entirely in JavaScript in the browser — the server always serves the same HTML, and JS swaps components based on the URL.

**Next.js App Router:** file-system based routing built into the framework. The folder structure defines the routes. The server renders the initial HTML. Covers both client and server rendering.

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

---

### Vitest + React Testing Library

**Vitest:** a test runner by the Vite team. Compatible with Jest's API (`describe`, `it`, `expect`) but faster and native to ESM. Python equivalent: pytest.

**React Testing Library (RTL):** renders components and queries them the way a user would — by accessible text, roles, labels — not by implementation details (class names, internal state). Python equivalent: closest is Playwright/Selenium's philosophy, not unit testing.

**Why RTL's philosophy matters:** if you test internal structure, your tests break when you refactor even though the UI still works correctly. RTL tests what the user sees.

---

### Auth libraries

Covered in depth in §07. Short version:

- **Better Auth** — modern, TypeScript-native, self-hosted. The current recommended choice for new apps.
- **Auth.js / NextAuth** — the most widely-used auth library for Next.js. v5 is the current stable version.
- **Lucia (deprecated as a library)** — now a learning resource for implementing sessions from scratch. You don't install it; you read it.

---

## Files in this section

| File | What it covers |
|---|---|
| `README.md` (this file) | Tool roles, alternatives, Python analogies |
| `annotated-package-json.md` | A realistic `package.json` walked line by line |
| `recognition-targets.md` | App Router vs Pages Router; React Server Components; TanStack Query |

---

## Stop condition

You're done with this section when you can:

- Open an unfamiliar project's `package.json`, point at each major dependency, and name its role and the alternative a team might have chosen.
- Explain in one sentence what Zod adds that TypeScript alone cannot provide.
- Describe what Tailwind's `content` array in `tailwind.config.js` does.

If you can do that, move on to `06-backend-node-express-prisma/`.
