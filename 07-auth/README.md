# 07 — Auth

**Objective:** trace a request through login → session creation → cookie → protected route, and read auth middleware and explain what it checks.

Auth is one of the areas where "just use a library" advice is common but leaves you unable to reason about bugs, security issues, or trade-offs. This section hand-rolls session auth first — so you understand every line — then introduces the libraries teams actually use as **recognition targets**: things to read and discuss, not implement.

The Lucia auth library was deprecated as an installable package in March 2025. It's now maintained as a learning resource at [lucia-auth.com](https://lucia-auth.com) — read it for the concepts, not the npm package.

---

## The session/cookie lifecycle

```
SIGNUP / LOGIN                    SUBSEQUENT REQUESTS

Browser          Server DB        Browser          Server DB
   │                 │               │                 │
   │  POST /login    │               │  GET /chat      │
   │  { email, pw } ─►              │  Cookie: session=<token> ─►
   │                 │               │                 │
   │         validate pw             │        look up session by token
   │         bcrypt.compare()        │        check expiresAt
   │                 │               │                 │
   │       create Session row        │      Session found + not expired?
   │       { token, userId,          │                 │
   │         expiresAt }             │    ┌── Yes ─────┤
   │                 │               │    │            │
   │  Set-Cookie:    │               │    │  attach req.user
   │  session=<token>│               │    │  call next()
   │  HttpOnly       │               │    │            │
   │  Secure         │               │    │  serve protected page
   │◄────────────────│               │◄───┘            │
   │                 │               │                 │
   │                 │               │    └── No ──────┤
   │                 │               │                 │
   │                 │               │  res.redirect("/login")
   │                 │               │◄────────────────│
```

---

## Files, in reading order

| Order | File | What it teaches |
|---|---|---|
| 1 | `cookies.ts` | The cookie lifecycle; httpOnly, Secure; why sessions beat JWTs for most apps |
| 2 | `sessions-from-scratch.ts` | Hand-rolled session auth: signup, login, session validation |
| 3 | `auth-middleware.ts` | Protecting routes; attaching `req.user`; redirects vs 401s |
| 4 | `recognition-targets.md` | Better Auth and Auth.js — what they abstract, why teams pick them |

---

## How to run

```bash
npm run 07:sessions   # walks through the session lifecycle with console output
npm run 07:cookies    # explains cookies: what goes in, what comes out
```

---

## Read-and-modify exercises

1. **`sessions-from-scratch.ts`** — the session token is generated with `crypto.randomBytes`. Change the token length from 32 to 64 bytes. What's the security impact?
2. **`sessions-from-scratch.ts`** — sessions currently expire after 7 days. Add a check that extends the session expiry by 7 days on each use (a "rolling session").
3. **`auth-middleware.ts`** — the middleware currently redirects unauthenticated requests to `/login`. API routes shouldn't redirect — they should return 401. Add logic to return 401 if the request's `Accept` header includes `application/json`.
4. **`recognition-targets.md`** — after reading, list three things Better Auth handles that our hand-rolled implementation doesn't.

---

## What we're deliberately skipping

- **JWTs (JSON Web Tokens)** — a stateless alternative to sessions. Common in API-only contexts and mobile apps. Tradeoffs: can't be revoked without extra infra; good for microservice-to-microservice auth.
- **OAuth / OIDC** — "Login with Google". The libraries in `recognition-targets.md` handle this. Understanding the OAuth flow conceptually is useful; implementing it from scratch is not.
- **PKCE, TOTP, WebAuthn** — advanced auth patterns. Know they exist; don't need to implement.

---

## Stop condition

You're done with this section when you can:

- Walk through the session lifecycle (signup → cookie → protected route → logout) verbally, explaining what's stored where and what each check does.
- Read `auth-middleware.ts` and explain exactly what happens to a request with no cookie vs a valid cookie vs an expired cookie.
- Describe in one sentence what Better Auth or Auth.js handles that our hand-rolled implementation doesn't.
