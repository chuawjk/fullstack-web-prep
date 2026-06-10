/*
  MIDDLEWARE: functions that run BETWEEN receiving a request and sending a response.
  Every middleware has the same signature: (req, res, next) => void

  "next" is a function — calling it passes control to the NEXT middleware in the chain.
  If you DON'T call next() and don't send a response, the request hangs forever.
  If you don't call next() but DO send a response, the chain stops there.

  Python analogy: Django's MIDDLEWARE list, or Flask's @app.before_request decorators.
  The pattern is identical — a pipeline where each stage can pass control forward or
  return a response early.

  This file demonstrates middleware concepts. The patterns here are used in
  express-server.ts.

  Run: tsx 06-backend-node-express-prisma/middleware.ts
  (starts a small demo server that logs requests and handles a fake auth check)
*/

import express, { Request, Response, NextFunction } from "express";
import { z, ZodSchema } from "zod";

// === EXTENDING THE REQUEST TYPE ===============================================
// Express's Request type doesn't know about `req.user` — we add it.
// Python analogy: adding a custom attribute to the request object in Django/Flask
// (e.g. request.user in Django is added by AuthenticationMiddleware).
declare global {
  namespace Express {
    interface Request {
      user?: { id: string; email: string };
      startTime?: number;
    }
  }
}

// === MIDDLEWARE 1: Request Logger =============================================
// Logs every incoming request. Notice the signature: (req, res, next).
// This middleware ALWAYS calls next() — it never short-circuits.

export function requestLogger(req: Request, res: Response, next: NextFunction): void {
  req.startTime = Date.now();

  // Intercept res.json to log after the response is sent.
  // This is a common pattern for "response logging" middleware.
  const originalJson = res.json.bind(res);
  res.json = (body) => {
    const ms = Date.now() - (req.startTime ?? Date.now());
    console.log(`${req.method} ${req.path} ${res.statusCode} ${ms}ms`);
    return originalJson(body);
  };

  next();  // pass control to the next middleware
}

// === MIDDLEWARE 2: Auth guard =================================================
// Checks for a valid session token in a cookie.
// If missing/invalid: responds 401 and does NOT call next().
// If valid: attaches req.user and calls next().

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  // In a real app this reads a session cookie and looks up the session in the DB.
  // Here we fake it by checking for an "Authorization" header with a known token.
  const token = req.headers["authorization"];

  if (!token || token !== "Bearer dev-token") {
    // Short-circuit: send 401 and stop the chain.
    res.status(401).json({ error: "Unauthorized — missing or invalid token" });
    return;  // explicit return so TypeScript knows we don't fall through
  }

  // Attach the user to req so downstream handlers can read it.
  req.user = { id: "u-1", email: "alice@example.com" };
  next();  // authenticated — pass control forward
}

// === MIDDLEWARE 3: Input validator factory ====================================
// A factory function that returns a middleware.
// This is the "middleware factory" pattern — parameterised middleware.
// Python analogy: a decorator that takes arguments: @requires_permission("admin")

export function validateBody<T>(schema: ZodSchema<T>) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      // 422 Unprocessable Entity — the body is syntactically valid JSON but
      // doesn't match the expected shape.
      res.status(422).json({ error: "Validation failed", details: result.error.errors });
      return;
    }
    // Overwrite req.body with the PARSED, validated value.
    // The Zod schema may have coerced types (e.g. string "42" → number 42).
    req.body = result.data;
    next();
  };
}

// === DEMO: wire these up on a small server ====================================
const app = express();
app.use(express.json());      // built-in middleware: parses JSON request bodies
app.use(requestLogger);       // our logger — runs on every request

// Public route — no auth required:
app.get("/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Schemas for the demo route:
const CreateMessageSchema = z.object({
  content: z.string().min(1).max(2000),
  conversationId: z.string(),
});

// Protected route — requireAuth must pass before the handler runs:
app.post(
  "/api/messages",
  requireAuth,
  validateBody(CreateMessageSchema),
  (req, res) => {
    // By here: req.user exists (set by requireAuth), req.body is validated.
    res.status(201).json({
      id: "m-" + Date.now(),
      userId: req.user!.id,
      content: req.body.content,
      conversationId: req.body.conversationId,
      createdAt: new Date().toISOString(),
    });
  }
);

const PORT = 3002;  // different from main server to avoid conflict
app.listen(PORT, () => {
  console.log(`Middleware demo running at http://localhost:${PORT}`);
  console.log(`Try: curl http://localhost:${PORT}/health`);
  console.log(`Auth: curl -X POST http://localhost:${PORT}/api/messages \\`);
  console.log(`  -H "Authorization: Bearer dev-token" \\`);
  console.log(`  -H "Content-Type: application/json" \\`);
  console.log(`  -d '{"content":"Hello","conversationId":"c-1"}'`);
});
