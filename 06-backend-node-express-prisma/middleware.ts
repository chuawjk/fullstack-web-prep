/*
  Middleware — the functions Express runs between receiving a request and sending
  a response.

  PROBLEM
  -------
  Logging, auth checks, and input validation are needed on most routes. Writing
  them inline in each handler means duplicating code and forgetting to add them
  when new routes are created. You need a way to attach cross-cutting concerns to
  routes declaratively — so a new protected route gets auth checking just by being
  added to the right chain, not by copy-pasting the check.

  CONCEPT
  -------
  Every middleware has the same shape: (req, res, next) => void. Express calls
  them in order. Each one either calls next() to pass control forward, sends a
  response to stop the chain, or (bug) does neither. `req` is a mutable baton —
  earlier stages write onto it (req.body, req.user) and later stages read what
  earlier ones wrote. You never construct req, res, or next; Express builds and
  supplies all three.

  KEY INSIGHT
  -----------
  The `next()` call is explicit in Express; Django/Flask run middleware
  automatically. Forgetting `return` after `res.json()` sends two responses and
  crashes the request. That's the footgun: call next() OR send a response — never
  both, never neither.

  IN THIS FILE
  ------------
  • requestLogger  — always calls next; wraps res.json to log AFTER the handler
                     has set the status (can't log the outcome before it's decided)
  • requireAuth    — enriches the baton (req.user) or short-circuits with 401
  • validateBody   — a factory that returns middleware closing over a Zod schema

  PYTHON ANALOGY
  --------------
  Flask @before_request / Django MIDDLEWARE, but with manual control passing —
  you call next() instead of the framework chaining them automatically.

  Run: tsx 06-backend-node-express-prisma/middleware.ts
  (starts a small demo server that logs requests and does a fake auth check)
*/

import express, { Request, Response, NextFunction } from "express";
import { z, ZodSchema } from "zod";

// ── Extending the request type ─────────────────────────────────────────────────
// PURPOSE: Express's Request type doesn't know about the fields WE write onto the
// baton, so we declare them. `?` because they only exist AFTER the middleware that
// sets them has run — downstream code must account for "not set yet".
// Python: like adding request.user in Django (AuthenticationMiddleware sets it).

declare global {
  namespace Express {
    interface Request {
      user?: { id: string; email: string };
      startTime?: number;
    }
  }
}

// ── requestLogger — observes, never short-circuits (DEFINITION) ───────────────
// PURPOSE: shows why logging middleware wraps res.json instead of logging before
// next(). The status code and response body aren't known until the route handler
// runs — later in the chain. So we replace res.json with a version that logs at
// the moment it's actually called, after the handler has decided the status.
// Python: like decorating a view to log its response.

export function requestLogger(req: Request, res: Response, next: NextFunction): void {
  req.startTime = Date.now(); // write the start time onto the baton

  const originalJson = res.json.bind(res);
  res.json = (body) => {
    const ms = Date.now() - (req.startTime ?? Date.now());
    console.log(`${req.method} ${req.path} ${res.statusCode} ${ms}ms`);
    return originalJson(body);
  };

  next(); // pass the baton on
}

// ── requireAuth — the short-circuiting case (DEFINITION) ──────────────────────
// PURPOSE: either enriches the baton (req.user) and calls next(), or answers 401
// and STOPS. Note the `return` after res.json — without it, execution falls
// through to next() and you'd send two responses → "Cannot set headers after
// they are sent."

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  // Real version reads a session cookie and looks it up (see §07). Here we fake
  // it with a known bearer token so the demo runs without a database.
  const token = req.headers["authorization"];

  if (!token || token !== "Bearer dev-token") {
    // 401 = "who are you?" (not 403, which is "I know you, but you can't"):
    res.status(401).json({ error: "Unauthorized — missing or invalid token" });
    return; // FOOTGUN guard: stop here, do NOT fall through to next()
  }

  req.user = { id: "u-1", email: "alice@example.com" }; // enrich the baton
  next(); // authenticated — pass control forward
}

// ── validateBody — middleware factory (DEFINITION) ────────────────────────────
// PURPOSE: this isn't a middleware — it's a function that RETURNS one. Why a
// factory: validation differs per route (each has its own schema), but the
// middleware signature is fixed at (req,res,next). The factory closes over
// `schema` so the returned function can use it without a 4th parameter that
// Express won't pass.
// Python analogy: a decorator that takes an argument — @requires_permission("admin").

export function validateBody<T>(schema: ZodSchema<T>) {
  // The returned function is the actual middleware; it captures `schema` via closure.
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      // 422 Unprocessable Entity: valid JSON, wrong shape. (404 would be wrong —
      // the resource isn't missing; the payload is malformed.)
      res.status(422).json({ error: "Validation failed", details: result.error.errors });
      return;
    }
    // Overwrite the baton's body with the PARSED value — Zod may have coerced
    // types (e.g. "42" → 42), so downstream code should read the parsed version.
    req.body = result.data;
    next();
  };
}

// ── Demo: wire these up on a small server ─────────────────────────────────────
// PURPOSE: shows the ordering — app.use runs every request top-to-bottom; the
// route-level chain [requireAuth, validateBody, handler] means auth runs first
// (401 if it fails), then validation (422 if it fails), then the handler.

const app = express();
app.use(express.json()); // built-in: parses JSON bodies → req.body
app.use(requestLogger);  // our logger — runs on every request

// Public route — no auth in front of it.
app.get("/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

const CreateMessageSchema = z.object({
  content: z.string().min(1).max(2000),
  conversationId: z.string(),
});

// Protected route. Chain: [requireAuth, validateBody, handler].
// Auth runs first (401 if it fails), then validation (422 if it fails), then
// the handler. By the handler, req.user and req.body are both set and trusted.
app.post(
  "/api/messages",
  requireAuth,
  validateBody(CreateMessageSchema),
  (req, res) => {
    // req.user guaranteed by requireAuth; req.body parsed by validateBody.
    // The `!` asserts req.user exists — safe ONLY because requireAuth ran first.
    res.status(201).json({
      id: "m-" + Date.now(),
      userId: req.user!.id,
      content: req.body.content,
      conversationId: req.body.conversationId,
      createdAt: new Date().toISOString(),
    });
  }
);

const PORT = 3002; // different from the main server to avoid a conflict
app.listen(PORT, () => {
  console.log(`Middleware demo running at http://localhost:${PORT}`);
  console.log(`Try: curl http://localhost:${PORT}/health`);
  console.log(`Auth: curl -X POST http://localhost:${PORT}/api/messages \\`);
  console.log(`  -H "Authorization: Bearer dev-token" \\`);
  console.log(`  -H "Content-Type: application/json" \\`);
  console.log(`  -d '{"content":"Hello","conversationId":"c-1"}'`);
});
