# 09 — Real Repo Read

**Objective:** orient yourself in an unfamiliar real Next.js + TypeScript codebase within ~10 minutes, locate the key layers, and sketch the architecture.

This is a recognition exercise, not a build exercise. No code to write.

## The problem this section solves

You join a team or start an interview take-home and need to understand a 50-file Next.js codebase fast. You know the individual building blocks from §02–§08, but you haven't yet practised the skill of navigating from "I need to change how messages are fetched" to the right file within minutes.

**Key insight:** every production codebase in this stack is built from the same six layers — routing, components, state, data, auth, tests. Find each layer, name what it does, and you can orient yourself in any repo. The checklist below is just a route through all six.

---

## Read it through your mental models

You're not reading this repo cold — you're reading it with six lenses the earlier sections gave you. The cold-read is really "find where each model shows up":

| When you see… | The lens from… | What you already know to ask |
|---|---|---|
| a component / `<Thing/>` | §03 IoC | who calls it, and what re-renders it |
| `useState`/`useEffect`/custom hooks | §04 slots | what slot each owns; what triggers it |
| a `package.json` entry | §05 grid | build-time or runtime? `deps` or `devDeps`? |
| an API route / middleware | §06 baton | what it writes onto `req`; what status it returns |
| an auth check | §07 trust boundary | what's the token, where's the server-side truth |
| a test file | §08 boundaries | which boundary it cuts at; what's mocked |

If you can attach the right lens to each thing you find, you can read any repo in this stack. The checklist below is just a route through all six.

---

## The repo

**[Vercel AI Chatbot](https://github.com/vercel/ai-chatbot)** — an open-source, production-grade Next.js 14 App Router chatbot by the Vercel team. It uses:
- Next.js App Router
- TypeScript
- Tailwind CSS
- Prisma (or Drizzle in newer versions) + PostgreSQL/SQLite
- Vercel AI SDK (streaming LLM responses)
- NextAuth / Auth.js for authentication

It's an excellent cold-read target because it's real, maintained, and uses the exact stack you've been learning.

**Alternative if you want something smaller:** [taxonomy](https://github.com/shadcn-ui/taxonomy) by shadcn — a Next.js 13 App Router demo app that's well-structured and annotated.

---

## Cold-read checklist

Use this checklist on the chosen repo. Aim to answer each question within 10 minutes total — no deep reading, just navigation.

### 1. Entry point
- [ ] Where is `app/page.tsx`? What does the root route render?
- [ ] Where is `app/layout.tsx`? What providers does it wrap around the app?
- [ ] What does `middleware.ts` (at the root) do?

### 2. Routing
- [ ] List the top-level routes (folders in `app/`).
- [ ] Find one dynamic route (a folder with `[param]` in its name). What is the dynamic segment?
- [ ] Find the API routes (`app/api/`). What endpoints exist?

### 3. Data layer
- [ ] Find the database schema or models. What tables/models exist?
- [ ] Find one place where data is read from the database. Is it in a Server Component, an API route, or a React hook?
- [ ] Is there a data-fetching abstraction (TanStack Query, SWR, or direct fetch)?

### 4. Auth
- [ ] Which auth library is used (Better Auth, Auth.js, hand-rolled)?
- [ ] Where is the auth configuration? What providers are enabled?
- [ ] Find a protected route. How does it check authentication?

### 5. LLM / AI calls
- [ ] Find where the LLM is called. Which SDK is used (OpenAI, Vercel AI SDK)?
- [ ] Is the response streamed? Look for `StreamingTextResponse`, `createStreamableUI`, or `ReadableStream`.
- [ ] Where does the stream get piped to the client? Find the API route and the client component that reads it.

### 6. State and client components
- [ ] Find a `"use client"` directive. What is that component responsible for?
- [ ] Find a `useState` or `useEffect`. What state does it manage?
- [ ] Find a Server Component that fetches data directly (no hook). How does it call the DB?

### 7. Architecture sketch
Draw (or describe) the data flow for one message send:
- Which client component sends the request?
- Which API route handles it?
- What DB query runs?
- How does the streaming response come back?
- Which client component receives and renders the stream?

---

## Interview-orientation notes

When you join a new team or prepare for a technical interview, this checklist gives you the ability to say:

- "The app uses Next.js App Router. The main routes are X, Y, Z."
- "Data fetching happens in Server Components — they call the DB directly via Prisma."
- "Auth is handled by Auth.js. The session is checked in `middleware.ts`, which protects all `/dashboard/*` routes."
- "LLM calls go through the Vercel AI SDK. The stream is piped to the client via a `ReadableStream` in the `/api/chat` route and consumed by the `useChat` hook."

That's the architectural fluency bar.

---

## Stop condition

You're done with this section when you can:

- Open the chosen repo, navigate to each item on the checklist, and answer every question within 10 minutes.
- Sketch the architecture on a whiteboard (or in words) without looking at the repo.

This section is optional if you're time-constrained — skip to §10 and come back here as a check-in after building the chatbot. If you do it first, you'll recognise in the real repo exactly what you're about to build: the `/api/chat` streaming route (§10 Phase 5), the Prisma schema (§10 Phase 2), the auth middleware (§10 Phase 3), and the `useReducer`-driven message list (§04). Reading a production version before building your own is the fastest way to see how the pieces fit at real scale.
