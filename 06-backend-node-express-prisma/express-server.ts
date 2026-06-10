/*
  A typed Express server with User + Message CRUD endpoints.
  This is the main section-06 server — it foreshadows the backend for §10.

  Express is a minimal Node.js web framework. Python equivalent: Flask.
  Like Flask, it handles routing, middleware, and HTTP request/response.
  Unlike Flask, it has no built-in ORM, template engine, or auth — you add
  those separately (Prisma, React, sessions).

  Run: tsx 06-backend-node-express-prisma/express-server.ts
  (listens at http://localhost:3001 — forwarded in the devcontainer)

  NOTE: The Prisma queries in this file require a set-up database.
  If Prisma isn't set up yet, the server will still start — Prisma calls
  will throw at request time. See README.md for setup instructions.
*/

import express, { Request, Response } from "express";
import { z } from "zod";

const app = express();

// express.json() is built-in middleware that parses incoming JSON bodies.
// Without it, req.body would be undefined.
// Python equivalent: Flask handles JSON automatically via request.get_json().
app.use(express.json());

// Simple request logger (see middleware.ts for a deeper explanation).
app.use((req, _res, next) => {
  console.log(`→ ${req.method} ${req.path}`);
  next();
});

// === TYPES ===================================================================
// TypeScript interfaces for the data we send back to the client.
// These mirror the Prisma-generated types — in a real app you'd import from Prisma.

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

// === ZOD SCHEMAS =============================================================
// Validate incoming request bodies at runtime.
// Python equivalent: Pydantic models — schema = type = validator.

const CreateUserSchema = z.object({
  email: z.string().email(),
  displayName: z.string().min(1).max(100),
});

const CreateMessageSchema = z.object({
  userId: z.string(),
  content: z.string().min(1).max(4000),
  role: z.enum(["user", "assistant"]),
});

// === IN-MEMORY STORE =========================================================
// Simulate a database with plain arrays so the server runs without Prisma setup.
// The commented-out lines show the Prisma equivalent.

const users: UserResponse[] = [];
const messages: MessageResponse[] = [];

// === ROUTES ==================================================================
// Express routes: app.METHOD(path, handler)
// The handler receives (req, res) — like Flask's view function.
// TypeScript types for Request/Response come from @types/express.

// GET /api/users — list all users
app.get("/api/users", (_req: Request, res: Response) => {
  // Prisma equivalent: const users = await prisma.user.findMany();
  res.json(users);
});

// POST /api/users — create a user
app.post("/api/users", (req: Request, res: Response) => {
  const result = CreateUserSchema.safeParse(req.body);
  if (!result.success) {
    // 422: the body is valid JSON but doesn't match our schema.
    res.status(422).json({ error: "Validation failed", details: result.error.errors });
    return;
  }

  const newUser: UserResponse = {
    id: `u-${Date.now()}`,
    email: result.data.email,
    displayName: result.data.displayName,
    createdAt: new Date().toISOString(),
    // Prisma equivalent: await prisma.user.create({ data: result.data })
  };

  users.push(newUser);
  res.status(201).json(newUser);
});

// GET /api/messages — list messages (optional ?userId= filter)
app.get("/api/messages", (req: Request, res: Response) => {
  const { userId } = req.query;

  // req.query contains URL query parameters as strings.
  // Python equivalent: request.args.get("userId") in Flask.
  const filtered = userId
    ? messages.filter(m => m.userId === String(userId))
    : messages;

  // Prisma equivalent:
  // const filtered = await prisma.message.findMany({
  //   where: userId ? { userId: String(userId) } : {},
  //   orderBy: { createdAt: "asc" },
  // });

  res.json(filtered);
});

// POST /api/messages — create a message
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
    // Prisma equivalent: await prisma.message.create({ data: result.data })
  };

  messages.push(newMessage);
  res.status(201).json(newMessage);
});

// DELETE /api/messages/:id — delete one message
app.delete("/api/messages/:id", (req: Request, res: Response) => {
  // :id is a ROUTE PARAMETER — a dynamic segment captured from the URL.
  // /api/messages/m-123 → req.params.id === "m-123"
  // Python Flask equivalent: @app.route("/api/messages/<id>")
  const { id } = req.params;
  const index = messages.findIndex(m => m.id === id);

  if (index === -1) {
    res.status(404).json({ error: "Message not found" });
    return;
  }

  messages.splice(index, 1);
  res.status(204).send();  // 204 No Content — success, no body
});

// === HEALTH CHECK ============================================================
app.get("/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// === START ===================================================================
const PORT = 3001;
app.listen(PORT, () => {
  console.log(`Express API running at http://localhost:${PORT}`);
  console.log(`Try: curl http://localhost:${PORT}/health`);
  console.log(`Try: curl http://localhost:${PORT}/api/messages`);
});
