# Annotated `package.json`

A realistic `package.json` for a Next.js + TypeScript full-stack app, walked line by line. This is the kind of file you'll encounter in a real repo and should be able to read without confusion.

---

```jsonc
{
  "name": "my-chat-app",
  "version": "0.1.0",
  // private: true prevents accidental `npm publish`. Always set this for apps (vs libraries).
  "private": true,

  "scripts": {
    // npm run dev — starts the Next.js dev server with hot reload
    // next dev --turbo uses Turbopack (faster bundler, still experimental in some versions)
    "dev": "next dev --turbo",

    // npm run build — type-checks and builds the production bundle
    "build": "next build",

    // npm run start — starts the production server (after a build)
    "start": "next start",

    // npm run lint — runs ESLint across the codebase
    "lint": "next lint",

    // prisma db push — applies schema changes directly to the dev database
    // (no migration file — use `prisma migrate dev` for production-grade migrations)
    "db:push": "prisma db push",

    // prisma studio — opens the Prisma visual database browser at localhost:5555
    "db:studio": "prisma studio",

    // vitest — runs the test suite once (CI mode)
    "test": "vitest run",

    // vitest --watch — re-runs tests on file change (dev mode)
    "test:watch": "vitest"
  },

  "dependencies": {
    // ── Framework ─────────────────────────────────────────────────────────────

    // next: the Next.js framework (routing, SSR, API routes, image optimisation, etc.)
    // Depends on react and react-dom. Alternative: plain Vite + React Router.
    "next": "14.2.5",

    // react + react-dom: the React library itself.
    // react is the core (hooks, JSX transform). react-dom renders to the browser DOM.
    "react": "^18.3.0",
    "react-dom": "^18.3.0",

    // ── Database ───────────────────────────────────────────────────────────────

    // @prisma/client: the generated type-safe database client.
    // You run `prisma generate` to regenerate this after schema changes.
    // Python analogy: the SQLAlchemy engine + session + models, auto-generated.
    "@prisma/client": "^5.15.0",

    // ── Validation ────────────────────────────────────────────────────────────

    // zod: runtime schema validation that also infers TypeScript types.
    // Python equivalent: Pydantic. One schema = one type = one validator.
    "zod": "^3.23.8",

    // ── Auth ──────────────────────────────────────────────────────────────────

    // better-auth: TypeScript-native session and OAuth library.
    // Alternative: next-auth (v5), hand-rolled sessions (see §07).
    "better-auth": "^1.0.0",

    // ── LLM ───────────────────────────────────────────────────────────────────

    // openai: the official OpenAI Node SDK. Used for chat completions + streaming.
    // Python equivalent: the openai Python package — same API, different language.
    "openai": "^4.52.0",

    // ── Utilities ─────────────────────────────────────────────────────────────

    // clsx: utility for conditionally joining class names.
    // Replaces: `className={`base ${isActive ? "active" : ""}`}`
    // With:     `className={clsx("base", { active: isActive })}`
    "clsx": "^2.1.1",

    // server-only: a zero-code package. Importing it in a file causes a build
    // error if that file is bundled for the browser. Guards server-only code
    // (database queries, secrets) from accidentally running on the client.
    "server-only": "^0.0.1"
  },

  "devDependencies": {
    // ── TypeScript ────────────────────────────────────────────────────────────

    // typescript: the TypeScript compiler. Used by Next.js to type-check.
    "typescript": "^5.4.5",

    // @types/*: type definition packages for libraries written in plain JavaScript.
    // They add TypeScript types on top without modifying the original library.
    // Python analogy: type stubs (.pyi files) for untyped Python packages.
    "@types/node": "^20.14.0",
    "@types/react": "^18.3.3",
    "@types/react-dom": "^18.3.0",

    // ── Linting + formatting ──────────────────────────────────────────────────

    // eslint: linter — catches potential bugs and enforces style rules.
    // Python analogy: flake8 + pylint.
    "eslint": "^8.57.0",
    "eslint-config-next": "14.2.5",  // Next.js's recommended ESLint rule set

    // prettier: opinionated code formatter. Formats on save (wired up via VS Code extension).
    // Python analogy: black.
    "prettier": "^3.3.0",
    "prettier-plugin-tailwindcss": "^0.6.5",  // sorts Tailwind classes in a canonical order

    // ── CSS ───────────────────────────────────────────────────────────────────

    // tailwindcss: the CSS framework. Generates utility classes.
    // postcss + autoprefixer: required by Tailwind's build pipeline.
    "tailwindcss": "^3.4.4",
    "postcss": "^8.4.39",
    "autoprefixer": "^10.4.19",

    // ── Database (dev) ────────────────────────────────────────────────────────

    // prisma: the CLI for schema management and migrations.
    // @prisma/client (above) is the runtime dependency; prisma is the dev tool.
    "prisma": "^5.15.0",

    // ── Testing ───────────────────────────────────────────────────────────────

    // vitest: the test runner. Compatible with Jest's API (describe, it, expect).
    // Python analogy: pytest.
    "vitest": "^1.6.0",

    // @testing-library/react: queries + interactions from the user's perspective.
    "@testing-library/react": "^16.0.0",
    "@testing-library/user-event": "^14.5.0",

    // jsdom: a headless browser environment for Vitest.
    // Simulates document, window, and DOM APIs in Node.js so tests can render React.
    // Python analogy: like running a headless browser in a pytest fixture.
    "jsdom": "^24.1.0"
  }
}
```

---

## Things to notice

**`dependencies` vs `devDependencies`:**
- `dependencies` are needed at runtime (the running app uses them).
- `devDependencies` are only needed during development and CI (build tools, linters, test runners).
- The bundler (Vite/Next.js) is in devDependencies — it's a build tool, not a runtime dependency.
- Prisma CLI is in devDependencies; `@prisma/client` is in dependencies.

**Semantic versioning pins:**
- `"next": "14.2.5"` — exact pin. Common for frameworks where minor releases can break things.
- `"react": "^18.3.0"` — caret (`^`): allows patch and minor updates (18.x.x). The safe default.
- `"~3.4.4"` (tilde) — allows patch updates only (3.4.x). Stricter.

**`package-lock.json` (not shown here):**
- Auto-generated; never edit by hand.
- Records the exact version of every transitive dependency that was installed.
- Commit it to git so every developer and CI run installs identical versions.
- Python equivalent: `requirements.txt` with pinned versions, or `poetry.lock`.
