# 06 — Backend: Node + Express + Prisma

**Objective:** build a typed CRUD endpoint backed by a database, and narrate the full request lifecycle from button click to re-render.

This section makes the backend concrete. By the end you should be able to read any Express route and explain exactly what happens to a request as it travels through the system.

## The problem this section solves

You need a `POST /api/messages` endpoint: it should check the session, validate the request body, save a row, and return the new message with a 201. You can write each piece — session lookup, Zod validation, Prisma create — but you don't know how to wire them into one request pipeline, or what happens if auth fails halfway through.

**Key insight:** a request travels through a chain of middleware functions, each mutating the same `req` object and calling `next()` to pass it on. The handler at the end reads everything accumulated upstream. The bug is almost always `next()` — forget it and the request hangs; call it after `res.send()` and you get a double-send error.

The Zod and Prisma tools you'll wire together here were introduced conceptually in §05 — if the two Prisma packages or Zod's role felt abstract then, this is where they become concrete. The middleware baton pattern you learn here also carries directly into §07: `requireAuth` is just another function in this chain that either calls `next()` or stops with 401.

---

## The machine: a request is a baton passed down a chain of functions

§03 said *React calls your component, you don't*. Express is the same inversion of control on the server: **you register functions, Express calls them** when a matching request arrives. Internalise three facts and every Express file reads cleanly:

1. **Express supplies the arguments.** Every middleware and route handler has the shape `(req, res, next)`. You never construct those — Express builds `req` from the incoming HTTP message, `res` is your handle for replying, and `next` is a **callback Express hands you that means "I'm done, run the next function in the chain."**

2. **`req` is a mutable baton.** A request doesn't pass through your functions untouched — each stage can *write* onto `req`, and later stages *read* what earlier ones wrote. `express.json()` puts the parsed body on `req.body`; the auth middleware puts the looked-up user on `req.user`. By the time the route handler runs, `req` carries everything accumulated upstream.

```
   req  ─►  express.json()  ─►  requireAuth   ─►  validateBody  ─►  handler
            sets req.body       sets req.user     replaces req.body   reads both,
                                                  with parsed data    sends res
   each stage mutates the SAME req object and calls next() to pass the baton on
```

3. **`next()` is the relay, and forgetting it is the #1 bug.** Call `next()` → control moves to the next function. Call `res.json()`/`res.status()` *instead* → you answered, the chain stops. Do **neither** and the request hangs forever (the client times out). Do **both** without a `return` and you try to send two responses → `Error: Cannot set headers after they are sent`.

**There is no clean Python analogy for `next()`.** Flask's `@before_request` hooks and Django's MIDDLEWARE list run automatically in order — you don't manually pass control. Express makes the relay explicit: the chain only advances because *you* called `next()`. That explicitness is the thing to get used to.

The boundary: Express owns routing, the `req`/`res` objects, and the calling. It does **not** ship an ORM, validation, templating, or auth — you bolt those on (Prisma, Zod, sessions). That's why a Node backend is a pile of small libraries where Django is one big one.

---

## The request lifecycle

```
Browser                  Express App              SQLite (via Prisma)
   │                          │                          │
   │  POST /api/messages       │                          │
   │  { "content": "Hello" }  │                          │
   │─────────────────────────►│                          │
   │                          │                          │
   │                    [middleware chain — each mutates req, calls next()]
   │                    1. express.json()   → req.body                       │
   │                    2. requireAuth      → req.user  (or 401, chain stops)│
   │                    3. validateBody     → req.body re-checked (or 422)   │
   │                    4. route handler                 │
   │                          │  prisma.message.create() │
   │                          │─────────────────────────►│
   │                          │  { id, content, ... }    │
   │                          │◄─────────────────────────│
   │  201 Created             │                          │
   │  { "id": "...", ... }    │                          │
   │◄─────────────────────────│                          │
   │  React state update → re-render                     │
```

---

## HTTP status codes you'll actually pick between

Choosing the status code *is* the API design. The handlers in this section use these deliberately — know why each one, not just that it's a number:

| Code | Means | Reach for it when |
|---|---|---|
| `200 OK` | success, here's the body | a GET, or any read that returns data |
| `201 Created` | success, a new resource exists | after a POST that created a row — return the created object |
| `204 No Content` | success, nothing to say | after a DELETE — there's no body to send |
| `401 Unauthorized` | you're not authenticated | no/invalid session — *who are you?* |
| `403 Forbidden` | authenticated but not allowed | known user, lacks permission — *I know you, but no* |
| `404 Not Found` | resource doesn't exist | `findUnique` returned null |
| `422 Unprocessable Entity` | well-formed but invalid | Zod rejected the body (valid JSON, wrong shape) |

The 401-vs-403 line and the 422-vs-404 line are the two distinctions interviewers and code reviews actually probe.

---

## Files, in reading order

| Order | File | What it teaches |
|---|---|---|
| 1 | `data-flow.md` | The full request lifecycle diagram (read this first) |
| 2 | `middleware.ts` | What middleware is; how the `(req,res,next)` chain runs; the factory pattern |
| 3 | `express-server.ts` | Typed routes; what each endpoint *responds with*; route params and query |
| 4 | `schema.prisma` | Prisma schema; models, relations, the generate/migrate split |
| 5 | `prisma-queries.ts` | CRUD queries; the Prisma client API mapped to SQL |

---

## How to run

### Start the Express server

```bash
npm run 06:server
# → Express listening at http://localhost:3001
```

Send requests from another terminal, or from the REST Client extension (a `.http` file with "Send Request").

### Set up Prisma + SQLite

Run once from the repo root:

```bash
npx prisma generate                          # generates the TypeScript client (build-time — see §05's grid)
npx prisma migrate dev --name init           # creates the SQLite file + runs migrations
```

Prisma creates `dev.db` in `06-backend-node-express-prisma/` (wherever `datasource db.url` points).

### Run the query examples

```bash
npm run 06:queries
```

---

## Testing the API (REST Client extension)

The VS Code REST Client extension (in the devcontainer) sends HTTP requests from a `.http` file. Create `06-backend-node-express-prisma/test.http`:

```http
### Create a user
POST http://localhost:3001/api/users
Content-Type: application/json

{
  "email": "alice@example.com",
  "displayName": "Alice"
}

### List messages
GET http://localhost:3001/api/messages
```

---

## Read-and-modify exercises

Predict the response (status + body) before you run each.

1. **`middleware.ts`** — the logger already prints timing via a `res.json` wrapper. Trace *why* it has to wrap `res.json` instead of just logging before `next()`: at what moment is `res.statusCode` known?
2. **`express-server.ts`** — add a `?limit=N` query param to `GET /api/messages`. Which status do you return if `N` isn't a number — 422 or 400, and why?
3. **`schema.prisma`** — add a `title` field to `Conversation` (optional string), run `prisma migrate dev --name add-conversation-title`, and read the generated SQL. Why did `title String?` produce a nullable column with no default?
4. **`prisma-queries.ts`** — add a `deleteMessage(id)` and call it. What does Prisma do if the id doesn't exist — return null or throw? (Check `delete` vs `deleteMany`.)

---

## What we're deliberately skipping

- **Streaming (SSE / WebSockets)** — §10, with LLM streaming.
- **Body parsing internals** — `express.json()` handles it; we validate with Zod on top.
- **Production migrations** — we use SQLite for simplicity; Postgres migration strategy is out of scope.
- **CORS** — only relevant cross-origin; a non-issue when frontend and API share an origin (as in Next.js).

---

## Stop condition

You're done when you can:

- Start the server, create a message via curl or REST Client, list messages, and see it appear.
- Describe the middleware pipeline on a napkin: what runs first, what each stage writes onto `req`, what `next()` does, and the two ways a chain can break (no `next()` → hang; double-send → header error).
- Read `prisma-queries.ts` and explain the difference between `findMany`, `findUnique`, `create`, and `update` — and which HTTP status each maps to in a handler.

§07 builds directly on this — the auth middleware is another `(req, res, next)` function in the same chain. §08's `api.test.ts` tests an endpoint with exactly this shape. And §10's `/api/chat` route is a typed Express handler doing session auth, a Prisma write, and a streaming response.
