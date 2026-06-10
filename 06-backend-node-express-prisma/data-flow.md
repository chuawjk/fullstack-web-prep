# Data Flow: Click → API → DB → Render

Read this diagram before the code. It shows the full lifecycle of one user action — clicking "Send" in a chat UI — from the browser event to the screen update.

---

## Zoomed out: the three-tier architecture

```
┌─────────────────────────────────────────────────────────┐
│  TIER 1: BROWSER (Client)                               │
│  React app running in the user's browser                │
│  Handles: UI, state, routing, user interaction          │
└──────────────────────────┬──────────────────────────────┘
                           │  HTTP requests
                           │  (fetch / axios / TanStack Query)
┌──────────────────────────▼──────────────────────────────┐
│  TIER 2: SERVER (Backend / API)                         │
│  Node.js + Express running on a server or container     │
│  Handles: business logic, auth, validation, DB queries  │
└──────────────────────────┬──────────────────────────────┘
                           │  SQL queries (via Prisma)
┌──────────────────────────▼──────────────────────────────┐
│  TIER 3: DATABASE                                        │
│  SQLite (dev) / PostgreSQL (prod)                        │
│  Stores: users, messages, sessions, conversations        │
└─────────────────────────────────────────────────────────┘
```

Python analogy: this is identical to a Python web app — Django/Flask (Tier 2) talking to PostgreSQL (Tier 3) while serving a React frontend (Tier 1).

---

## Zoomed in: one message send

```
BROWSER                      NODE / EXPRESS                    SQLITE
  │                               │                               │
  │  User types "Hello"           │                               │
  │  and clicks Send              │                               │
  │                               │                               │
  │  1. Event handler fires       │                               │
  │  setIsLoading(true)           │                               │
  │  ──────────────────────────►  │                               │
  │  POST /api/messages           │                               │
  │  Content-Type: application/json                               │
  │  { "content": "Hello",        │                               │
  │    "conversationId": "c-1" }  │                               │
  │                               │                               │
  │                               │  2. express.json() middleware │
  │                               │  Parses JSON body             │
  │                               │  → req.body = { content, conversationId }
  │                               │                               │
  │                               │  3. auth middleware           │
  │                               │  Reads session cookie         │
  │                               │  → req.user = { id: "u-1" }  │
  │                               │  (or 401 if no valid session) │
  │                               │                               │
  │                               │  4. route handler             │
  │                               │  Zod validates req.body       │
  │                               │  (or 400 if invalid)          │
  │                               │                               │
  │                               │  5. Prisma query ────────────►│
  │                               │  prisma.message.create(...)   │
  │                               │                               │
  │                               │         INSERT INTO messages  │
  │                               │         VALUES (...)          │
  │                               │         RETURNING *           │
  │                               │                               │
  │                               │  ◄────── { id, content, ... } │
  │                               │                               │
  │                               │  6. res.status(201).json(...) │
  │  ◄──────────────────────────  │                               │
  │  201 Created                  │                               │
  │  { "id": "m-99",              │                               │
  │    "content": "Hello",        │                               │
  │    "createdAt": "..." }       │                               │
  │                               │                               │
  │  7. React state update        │                               │
  │  setMessages(prev =>          │                               │
  │    [...prev, newMsg])         │                               │
  │  setIsLoading(false)          │                               │
  │                               │                               │
  │  8. React re-renders          │                               │
  │  New bubble appears           │                               │
  │  in the message list          │                               │
```

---

## The middleware pipeline (zoomed in on step 2–4)

Each middleware is a function that receives `(req, res, next)`.
Calling `next()` passes control to the next function.
NOT calling `next()` (and calling `res.json()` instead) short-circuits the chain.

```
Incoming request
      │
      ▼
┌─────────────────────────────────┐
│  express.json()                 │
│  Parses the JSON body.          │
│  Attaches it to req.body.       │
│  Calls next().                  │
└──────────────┬──────────────────┘
               │ next()
               ▼
┌─────────────────────────────────┐
│  requestLogger (custom)         │
│  Logs: "POST /api/messages"     │
│  Calls next().                  │
└──────────────┬──────────────────┘
               │ next()
               ▼
┌─────────────────────────────────┐
│  requireAuth (custom)           │
│  Reads session cookie.          │
│  If valid: attaches req.user    │
│    and calls next().            │
│  If invalid: calls              │
│    res.status(401).json(...)    │
│    DOES NOT call next().        │
│    The chain stops here.        │
└──────────────┬──────────────────┘
               │ next()  (only if authenticated)
               ▼
┌─────────────────────────────────┐
│  Route handler                  │
│  Validates input with Zod.      │
│  Calls Prisma.                  │
│  Calls res.status(201).json(…). │
└─────────────────────────────────┘
```

Python analogy: Django middleware (MIDDLEWARE list in settings.py) or Flask `before_request` hooks. The pattern is identical — a chain of callables that can either pass control forward or short-circuit with a response.
