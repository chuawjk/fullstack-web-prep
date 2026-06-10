# 06 — Backend: Node + Express + Prisma

**Objective:** build a typed CRUD endpoint backed by a database, and narrate the full request lifecycle from button click to re-render.

This section makes the backend concrete. By the end you should be able to read any Express route and explain exactly what happens to a request as it travels through the system.

---

## The request lifecycle

```
Browser                  Express App              SQLite (via Prisma)
   │                          │                          │
   │  POST /api/messages       │                          │
   │  { "content": "Hello" }  │                          │
   │─────────────────────────►│                          │
   │                          │                          │
   │                    [middleware chain]                │
   │                    1. express.json()                 │
   │                       parses body → req.body         │
   │                    2. auth middleware               │
   │                       checks session cookie         │
   │                    3. route handler                 │
   │                       validates input (Zod)         │
   │                          │                          │
   │                          │  prisma.message.create() │
   │                          │─────────────────────────►│
   │                          │                          │
   │                          │  { id, content, ... }    │
   │                          │◄─────────────────────────│
   │                          │                          │
   │  201 Created             │                          │
   │  { "id": "...", ... }    │                          │
   │◄─────────────────────────│                          │
   │                          │                          │
   │  React state update      │                          │
   │  → re-render             │                          │
```

---

## Files, in reading order

| Order | File | What it teaches |
|---|---|---|
| 1 | `data-flow.md` | The full request lifecycle diagram (read this first) |
| 2 | `middleware.ts` | What middleware is; how the chain runs |
| 3 | `express-server.ts` | Typed Express routes; request/response types |
| 4 | `schema.prisma` | Prisma schema; defining models |
| 5 | `prisma-queries.ts` | CRUD queries; the Prisma client API |

---

## How to run

### Start the Express server

```bash
npm run 06:server
# → Express listening at http://localhost:3001
```

The server is running. You can send requests to it from another terminal or from the REST Client extension (create a `.http` file and click "Send Request").

### Set up Prisma + SQLite

Run these once from the repo root:

```bash
npx prisma generate                          # generates the TypeScript client
npx prisma migrate dev --name init           # creates the SQLite file + runs migrations
```

Prisma creates `dev.db` (the SQLite database file) in the `06-backend-node-express-prisma/` folder (or wherever `datasource db.url` points in `schema.prisma`).

### Run the query examples

After setting up Prisma:

```bash
npm run 06:queries
```

---

## Testing the API (REST Client extension)

The VS Code REST Client extension (installed in the devcontainer) lets you send HTTP requests from a `.http` file. Create `06-backend-node-express-prisma/test.http`:

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

1. **`middleware.ts`** — the request logger prints `GET /api/messages 200`. Add the response time: `GET /api/messages 200 15ms`. Hint: record `Date.now()` when the request arrives.
2. **`express-server.ts`** — the `GET /api/messages` endpoint returns all messages. Add a `?limit=N` query parameter that limits the number of messages returned.
3. **`schema.prisma`** — add a `title` field to the `Conversation` model (optional string). Run `prisma migrate dev --name add-conversation-title` and observe the generated SQL.
4. **`prisma-queries.ts`** — add a `deleteMessage(id)` function and call it to delete one of the seeded messages.

---

## What we're deliberately skipping

- **Streaming (SSE / WebSockets)** — covered in §10 when we add LLM streaming.
- **Input parsing middleware** — we use Zod for validation; body-parser is handled by Express's built-in `express.json()`.
- **Database migrations in production** — in the project we use SQLite for simplicity. Production Postgres migration strategy is out of scope.
- **CORS** — relevant for requests from a different domain; irrelevant when the frontend and API are on the same origin (as in Next.js).

---

## Stop condition

You're done with this section when you can:

- Start the server and create a message via curl or the REST Client, then list messages and see it appear.
- Draw (or describe) the middleware pipeline on a napkin: what runs first, what can short-circuit, what happens to `next()`.
- Read `prisma-queries.ts` and explain the difference between `findMany`, `findUnique`, `create`, and `update`.
