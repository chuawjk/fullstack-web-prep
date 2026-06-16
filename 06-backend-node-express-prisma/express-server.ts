/*
  Typed Express server — routes, Zod validation, and the HTTP contract.

  PROBLEM
  -------
  You need a backend that accepts HTTP requests, validates incoming JSON, and
  returns structured responses. In Python you'd reach for Flask or FastAPI. In the
  Node ecosystem the equivalent is Express — but unlike Flask, Express ships nothing
  beyond routing and the request/response cycle. Everything else (validation, ORM,
  auth) is a library you bolt on. Before you can read any Express codebase you need
  to understand why Zod is necessary (TypeScript types don't exist at runtime), what
  HTTP status codes mean as a contract, and how routes map to CRUD operations.

  CONCEPT
  -------
  Express matches an incoming request to a route by method + path, then calls a
  handler with `(req, res)` — the request object and the reply handle. TypeScript
  types describe what you INTEND; Zod validates it at runtime. A body arriving over
  HTTP could be any shape; TypeScript types are erased before the server runs, so
  they can't check it. Zod is the wall between the untrusted outside world and your
  typed business logic.

  KEY INSIGHT
  -----------
  TypeScript types describe intent; Zod enforces it at runtime. `schema.safeParse(req.body)`
  is the only line that actually checks whether the incoming JSON has the right shape.

  IN THIS FILE
  ------------
  • Typed Express routes: GET/POST/DELETE
  • Zod schemas for runtime validation (with Prisma equivalents shown as comments)
  • In-memory store standing in for a database
  • HTTP status codes as explicit contract:
    201 created, 204 no content, 404 not found, 422 validation failed

  PYTHON ANALOGY
  --------------
  Flask — same "small core + libraries" philosophy. Zod ↔ Pydantic. res.json() ↔
  jsonify(). req.query ↔ request.args. req.params ↔ route parameters in @app.route.

  Run: tsx 06-backend-node-express-prisma/express-server.ts
  (listens at http://localhost:3001 — forwarded in the devcontainer)

  NOTE: Prisma calls are shown as comments. This file uses in-memory arrays so it
  runs with zero database setup; swap the arrays for the Prisma lines once set up.
*/

import express, { Request, Response } from "express";
import { z } from "zod";

const app = express();

// Built-in middleware: parses JSON bodies onto req.body. Without it req.body is
// undefined. Python: Flask does this implicitly via request.get_json().
app.use(express.json());

// Inline request logger (deeper version in middleware.ts). Observes, then next().
app.use((req, _res, next) => {
  console.log(`→ ${req.method} ${req.path}`);
  next();
});

// ── Types ─────────────────────────────────────────────────────────────────────
// PURPOSE: shapes we send back to the client. These mirror the Prisma-generated
// types — in a real app you'd import those instead of hand-writing these.

interface UserResponse {
  id: string;
  email: string;
  displayName: string;
  createdAt: string;
}

interface MessageResponse {
  id: string;
  userId: string;
  content: string;
  role: "user" | "assistant";
  createdAt: string;
}

// ── Zod schemas ───────────────────────────────────────────────────────────────
// PURPOSE: validates incoming bodies AT RUNTIME — the guard TypeScript can't be,
// because TS types are erased before the server runs (the §05 type-erasure
// boundary). The body arriving over HTTP could be any shape; Zod is what actually
// checks it. Python equivalent: Pydantic models — schema = type = validator.

const CreateUserSchema = z.object({
  email: z.string().email(),
  displayName: z.string().min(1).max(100),
});

const CreateMessageSchema = z.object({
  userId: z.string(),
  content: z.string().min(1).max(4000),
  role: z.enum(["user", "assistant"]),
});

// ── In-memory store ───────────────────────────────────────────────────────────
// PURPOSE: stand-ins for database tables so the server runs without Prisma. These
// arrays live in the SERVER process's memory — they reset on restart and aren't
// shared across instances. A real DB is the durable, shared version. The commented
// Prisma lines below show the real query.

const users: UserResponse[] = [];
const messages: MessageResponse[] = [];

// ── Routes ────────────────────────────────────────────────────────────────────
// PURPOSE: app.METHOD(path, handler). Express matches method+path, then calls the
// handler with (req, res). Read each as: what comes in, what goes back.

// GET /api/users — responds 200 with the full users array ([] at first).
app.get("/api/users", (_req: Request, res: Response) => {
  // Prisma: const users = await prisma.user.findMany();
  res.json(users); // res.json defaults to 200
});

// POST /api/users — responds 201 + the created user, or 422 + errors if invalid.
app.post("/api/users", (req: Request, res: Response) => {
  const result = CreateUserSchema.safeParse(req.body);
  if (!result.success) {
    // 422: well-formed JSON, wrong shape. `return` so we don't also send 201.
    res.status(422).json({ error: "Validation failed", details: result.error.errors });
    return;
  }

  const newUser: UserResponse = {
    id: `u-${Date.now()}`,
    email: result.data.email,          // read the PARSED data, not raw req.body
    displayName: result.data.displayName,
    createdAt: new Date().toISOString(),
    // Prisma: await prisma.user.create({ data: result.data })
  };

  users.push(newUser);
  res.status(201).json(newUser); // 201 Created — return the new resource
});

// GET /api/messages — responds 200 with all messages, or just one user's if
// ?userId= is present. Query params always arrive as strings (or undefined).
app.get("/api/messages", (req: Request, res: Response) => {
  // req.query holds URL query params. Python: request.args.
  const { userId } = req.query;

  const filtered = userId
    ? messages.filter((m) => m.userId === String(userId))
    : messages;

  // Prisma:
  // const filtered = await prisma.message.findMany({
  //   where: userId ? { userId: String(userId) } : {},
  //   orderBy: { createdAt: "asc" },
  // });

  res.json(filtered);
});

// POST /api/messages — responds 201 + the created message, or 422 if invalid.
app.post("/api/messages", (req: Request, res: Response) => {
  const result = CreateMessageSchema.safeParse(req.body);
  if (!result.success) {
    res.status(422).json({ error: "Validation failed", details: result.error.errors });
    return;
  }

  const newMessage: MessageResponse = {
    id: `m-${Date.now()}`,
    userId: result.data.userId,
    content: result.data.content,
    role: result.data.role,
    createdAt: new Date().toISOString(),
    // Prisma: await prisma.message.create({ data: result.data })
  };

  messages.push(newMessage);
  res.status(201).json(newMessage);
});

// DELETE /api/messages/:id — responds 204 (no body) on success, 404 if absent.
app.delete("/api/messages/:id", (req: Request, res: Response) => {
  // :id is a ROUTE PARAMETER — a dynamic URL segment Express captures into
  // req.params. /api/messages/m-123 → req.params.id === "m-123".
  // Python Flask: @app.route("/api/messages/<id>").
  const { id } = req.params;
  const index = messages.findIndex((m) => m.id === id);

  if (index === -1) {
    // 404: the thing you addressed doesn't exist (distinct from 422 — the request
    // was fine, the target is just missing).
    res.status(404).json({ error: "Message not found" });
    return;
  }

  messages.splice(index, 1);
  res.status(204).send(); // 204 No Content — success with nothing to return
});

// ── Health check ──────────────────────────────────────────────────────────────
app.get("/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// ── Start ─────────────────────────────────────────────────────────────────────
const PORT = 3001;
app.listen(PORT, () => {
  console.log(`Express API running at http://localhost:${PORT}`);
  console.log(`Try: curl http://localhost:${PORT}/health`);
  console.log(`Try: curl http://localhost:${PORT}/api/messages`);
});
