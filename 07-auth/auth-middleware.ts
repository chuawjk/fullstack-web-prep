/*
  AUTH MIDDLEWARE — protecting routes in an Express app.

  This builds directly on sessions-from-scratch.ts.
  The middleware reads the session cookie, validates the session, and either:
    - Attaches req.user and calls next() (authenticated)
    - Returns 401 / redirects to login (unauthenticated)

  Python equivalent: Django's @login_required decorator, or Flask-Login's
  @login_required. Same concept — a guard that runs before the view function.

  Run: tsx 07-auth/auth-middleware.ts
*/

import express, { Request, Response, NextFunction } from "express";
import crypto from "crypto";

// === TYPES ===================================================================
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

// Extend Express's Request type so TypeScript knows about req.user.
// Any middleware that sets req.user makes it available to all downstream handlers.
declare global {
  namespace Express {
    interface Request {
      user?: User;
    }
  }
}

// === SIMULATED SESSION STORE =================================================
// In a real app: prisma.session.findUnique({ where: { token } })

const FAKE_USERS = new Map<string, User>([
  ["u-1", { id: "u-1", email: "alice@example.com", displayName: "Alice" }],
]);

const FAKE_SESSIONS = new Map<string, Session>([
  ["valid-token-abc", {
    token: "valid-token-abc",
    userId: "u-1",
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),  // 7 days from now
  }],
]);

function lookupSession(token: string): { user: User; session: Session } | null {
  const session = FAKE_SESSIONS.get(token);
  if (!session || session.expiresAt < new Date()) return null;
  const user = FAKE_USERS.get(session.userId);
  if (!user) return null;
  return { user, session };
}

// === AUTH MIDDLEWARE ==========================================================
// Reads the session cookie, validates the session, attaches req.user.
//
// Two different responses depending on caller:
//   Browser page requests → redirect to /login (the user sees the login page)
//   API requests          → 401 JSON (the frontend handles the error)
//
// How to tell them apart: the Accept header.
//   Browser: Accept: text/html
//   fetch():  Accept: */*  or  application/json

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  // Cookies arrive as the "Cookie" header. Express's cookie-parser parses them
  // into req.cookies. Without cookie-parser, you'd need to parse the header manually.
  // For the demo we read from req.headers directly.
  const rawCookie = req.headers.cookie ?? "";
  const sessionToken = parseCookieToken(rawCookie, "session");

  if (!sessionToken) {
    sendUnauthorized(req, res, "No session cookie");
    return;
  }

  const auth = lookupSession(sessionToken);

  if (!auth) {
    // Session not found or expired.
    // Clear the stale cookie so the browser stops sending it.
    res.clearCookie("session");
    sendUnauthorized(req, res, "Session invalid or expired");
    return;
  }

  // Attach the user to the request — downstream handlers read it as req.user.
  req.user = auth.user;
  next();  // ✓ authenticated — continue to the route handler
}

// Decide whether to redirect (browsers) or return 401 (API clients).
function sendUnauthorized(req: Request, res: Response, reason: string): void {
  const acceptsHtml = (req.headers.accept ?? "").includes("text/html");

  if (acceptsHtml) {
    // Browser — redirect to login page.
    res.redirect("/login");
  } else {
    // API client (fetch, curl, etc.) — return JSON error.
    res.status(401).json({ error: "Unauthorized", reason });
  }
}

// Helper: parse a named cookie from the raw Cookie header string.
// In a real app, use the `cookie-parser` npm package instead.
function parseCookieToken(cookieHeader: string, name: string): string | null {
  // Cookie header format: "name1=val1; name2=val2; ..."
  const match = cookieHeader.match(new RegExp(`(?:^|; )${name}=([^;]+)`));
  return match ? match[1] : null;
}

// === OPTIONAL MIDDLEWARE: role guard ==========================================
// Factories return middleware that check a specific condition.
// Python: @requires_permission("admin")  or  @staff_member_required

export function requireRole(role: "admin" | "user") {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: "Not authenticated" });
      return;
    }
    // In a real app, check req.user.role against the required role.
    // Here we just simulate: only alice is "admin" for demo purposes.
    const isAdmin = req.user.email === "alice@example.com";
    if (role === "admin" && !isAdmin) {
      res.status(403).json({ error: "Forbidden — admin only" });
      return;
    }
    next();
  };
}

// === DEMO SERVER ==============================================================
const app = express();
app.use(express.json());

// Public route — anyone can access:
app.get("/health", (_req, res) => res.json({ status: "ok" }));

// Protected route — requireAuth must pass first:
app.get("/api/me", requireAuth, (req, res) => {
  // req.user is guaranteed to exist here because requireAuth would have
  // returned 401 before reaching this handler.
  res.json({ user: req.user });
});

// Admin route — requires auth AND admin role:
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
