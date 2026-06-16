/*
  Auth middleware — protecting routes by verifying the session before the handler runs.

  PROBLEM
  -------
  You have routes that only authenticated users should reach: /api/me, admin pages,
  conversation history. You could put the session-check logic in every handler, but
  that's easy to forget on new routes and hard to update consistently. You need the
  auth check to run automatically before any handler in a protected route, and to
  stop the request if it fails.

  CONCEPT
  -------
  Auth middleware is §06's baton pattern applied to §07's trust boundary. It reads
  the session token from the incoming cookie, looks it up in the session store, and
  either writes the verified user onto `req.user` and calls next() (authenticated),
  or sends a 401/redirect and stops the chain. Everything downstream can trust
  `req.user` unconditionally — this middleware is the single gate that turned an
  untrusted token into a verified identity.

  KEY INSIGHT
  -----------
  By the time a handler runs, requireAuth has already verified identity and written
  it to `req.user`. The handler uses it without re-checking. This is why "put auth
  first in the middleware chain" matters — later handlers rely on the invariant it
  establishes.

  IN THIS FILE
  ------------
  • requireAuth   — reads cookie → looks up session → writes req.user or 401/redirect
  • sendUnauthorized — branches on Accept header: browsers get a redirect, API
                       clients (fetch, curl) get a 401 JSON response
  • requireRole   — a factory that returns middleware checking a specific role
  • demo server   — public /health, protected /api/me, admin-only /api/admin

  PYTHON ANALOGY
  --------------
  Django's @login_required or Flask-Login's @login_required — a guard that runs
  before the view and either passes control on or rejects with a redirect/401.

  Run: tsx 07-auth/auth-middleware.ts
  (starts a server; the printed curl commands show the 401 / 200 each path returns)
*/

import express, { Request, Response, NextFunction } from "express";
import crypto from "crypto";

// ── Types ─────────────────────────────────────────────────────────────────────

interface User {
  id: string;
  email: string;
  displayName: string;
}

interface Session {
  token: string;
  userId: string;
  expiresAt: Date;
}

// Extend Express's Request type so TypeScript knows about req.user downstream.
declare global {
  namespace Express {
    interface Request {
      user?: User;
    }
  }
}

// ── Simulated session store ───────────────────────────────────────────────────
// PURPOSE: stand-in for prisma.session.findUnique({ where: { token } }) so the
// demo runs without a database.

const FAKE_USERS = new Map<string, User>([
  ["u-1", { id: "u-1", email: "alice@example.com", displayName: "Alice" }],
]);

const FAKE_SESSIONS = new Map<string, Session>([
  ["valid-token-abc", {
    token: "valid-token-abc",
    userId: "u-1",
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  }],
]);

function lookupSession(token: string): { user: User; session: Session } | null {
  const session = FAKE_SESSIONS.get(token);
  if (!session || session.expiresAt < new Date()) return null;
  const user = FAKE_USERS.get(session.userId);
  if (!user) return null;
  return { user, session };
}

// ── requireAuth (DEFINITION) ──────────────────────────────────────────────────
// PURPOSE: the single gate that turns an untrusted token into a verified identity.
// Two response types depending on the caller — see sendUnauthorized below.

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  // Cookies arrive as the "Cookie" header. In production use the `cookie-parser`
  // package; here we parse manually to avoid a dependency.
  const rawCookie = req.headers.cookie ?? "";
  const sessionToken = parseCookieToken(rawCookie, "session");

  if (!sessionToken) {
    sendUnauthorized(req, res, "No session cookie");
    return;
  }

  const auth = lookupSession(sessionToken);

  if (!auth) {
    // Session not found or expired. Clear the stale cookie so the browser stops
    // sending it — cosmetic, not a security measure.
    res.clearCookie("session");
    sendUnauthorized(req, res, "Session invalid or expired");
    return;
  }

  req.user = auth.user;  // write the verified identity onto the baton
  next();                // ✓ authenticated — continue to the route handler
}

// ── sendUnauthorized ──────────────────────────────────────────────────────────
// PURPOSE: browsers expect a redirect to the login page; API clients (fetch, curl)
// expect a JSON 401. The Accept header is the signal.

function sendUnauthorized(req: Request, res: Response, reason: string): void {
  const acceptsHtml = (req.headers.accept ?? "").includes("text/html");

  if (acceptsHtml) {
    res.redirect("/login");                          // browser → show the login page
  } else {
    res.status(401).json({ error: "Unauthorized", reason }); // API client → JSON error
  }
}

// Helper: parse a named cookie from the raw Cookie header string.
function parseCookieToken(cookieHeader: string, name: string): string | null {
  const match = cookieHeader.match(new RegExp(`(?:^|; )${name}=([^;]+)`));
  return match ? match[1] : null;
}

// ── requireRole — role guard factory (DEFINITION) ─────────────────────────────
// PURPOSE: a factory that returns middleware checking a specific condition. Same
// factory pattern as validateBody in middleware.ts — closes over `role` so the
// returned function can use it without Express passing a 4th parameter.
// Python: @requires_permission("admin") or @staff_member_required

export function requireRole(role: "admin" | "user") {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: "Not authenticated" });
      return;
    }
    // In a real app, check req.user.role against the required role.
    const isAdmin = req.user.email === "alice@example.com";
    if (role === "admin" && !isAdmin) {
      res.status(403).json({ error: "Forbidden — admin only" });
      return;
    }
    next();
  };
}

// ── Demo server ───────────────────────────────────────────────────────────────
// PURPOSE: shows the three route types — public, protected, admin-only — with
// the middleware chain that enforces each.

const app = express();
app.use(express.json());

app.get("/health", (_req, res) => res.json({ status: "ok" }));

// Protected: requireAuth must pass before the handler runs.
app.get("/api/me", requireAuth, (req, res) => {
  // req.user is guaranteed here — requireAuth would have returned 401 otherwise.
  res.json({ user: req.user });
});

// Admin: auth AND role check, both in the chain before the handler.
app.get("/api/admin", requireAuth, requireRole("admin"), (req, res) => {
  res.json({ message: `Welcome, admin ${req.user?.displayName}!` });
});

const PORT = 3003;
app.listen(PORT, () => {
  console.log(`Auth middleware demo at http://localhost:${PORT}`);
  console.log(`\nTest these endpoints:`);
  console.log(`  curl http://localhost:${PORT}/api/me`);
  console.log(`    → 401 (no cookie)`);
  console.log(`  curl http://localhost:${PORT}/api/me -H "Cookie: session=valid-token-abc"`);
  console.log(`    → 200 { user: { email: "alice@example.com" } }`);
  console.log(`  curl http://localhost:${PORT}/api/me -H "Cookie: session=bad-token"`);
  console.log(`    → 401 (invalid session)`);
});
