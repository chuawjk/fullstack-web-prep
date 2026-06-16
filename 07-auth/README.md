# 07 — Auth

**Objective:** trace a request through login → session creation → cookie → protected route, and read auth middleware and explain what it checks.

## The problem this section solves

A user logs in with email and password. After that, every subsequent request to `/api/conversations` needs to know who they are — but HTTP is stateless, so there's no built-in memory between requests. You need to store the session somewhere, pass something to the browser to identify it, and validate that credential on every protected request, without ever storing the password itself.

**Key insight:** the server keeps the truth (a session row in the DB); the browser holds only a pointer (an opaque random token in a cookie). Every auth design choice — HttpOnly flag, cookie-vs-localStorage, token-vs-JWT — follows from defending that boundary. The cookie flags are not configuration knobs; each one stops a specific attack.

This section is §06's baton pattern applied to a security boundary: `requireAuth` is just another `(req, res, next)` function in the middleware chain. It either writes `req.user` and calls `next()`, or sends 401 and stops — the same logic as any other middleware, just with higher stakes. Better Auth (the library §10 uses) is the §05 recognition target that handles all of this automatically.

Auth is where "just use a library" leaves you unable to reason about bugs, security holes, or trade-offs. This section hand-rolls session auth first — so you understand every line — then introduces the libraries teams actually use as **recognition targets**: things to read and discuss, not implement.

Lucia was deprecated as an installable package in March 2025. It now lives at [lucia-auth.com](https://lucia-auth.com) as a learning resource — read it for the concepts, not the npm package.

---

## The machine: the server keeps the truth, the browser holds a pointer

Every other idea in this section follows from one boundary:

> **The server never trusts the client.** The truth — who you are, whether you're logged in — lives server-side in a `Session` row. The browser is given only an **opaque token**: a long random string that means nothing on its own and only works because the server has a matching row. The token is a *pointer to* the truth, not the truth itself.

```
   SERVER SIDE (trusted)                 CLIENT SIDE (untrusted)
   ─────────────────────                 ───────────────────────
   Session { token: "a3f9…",             Cookie: session=a3f9…
             userId: "u-1",     ◄─────   (just the token — no userId,
             expiresAt }                  no role, nothing meaningful)
   User { passwordHash }                  (the password itself is NEVER
                                           stored, anywhere, ever)
```

Three consequences worth stating outright, because they explain every design choice in the files:

1. **The token must be unguessable, and that's its only job.** It carries no data — `crypto.randomBytes(32)` (256 bits) makes brute-forcing it infeasible. Anyone holding the token *is* the session; that's why we protect the cookie so hard.
2. **The password is never stored — only a slow hash of it.** If the DB leaks, `bcrypt` hashes are useless to the attacker. "Slow" is a feature here: the cost that would annoy a brute-forcer is the point (the one place in the stack you *want* a function to be expensive).
3. **The cookie is the browser's automatic credential.** Once the server sends `Set-Cookie`, the browser attaches it to *every* future request to that domain, with no JS involvement. That automaticity is what makes "staying logged in" work — and also what makes CSRF possible, which is why `SameSite` exists. There's no Python analogy beyond "this is the same sessions-and-cookies model as Django/Flask" — the cookie mechanism itself is browser-specific.

The auth middleware (file 3) is just §06's baton with this boundary enforced: read the token off the cookie, look up the truth, and either write `req.user` onto the baton or stop with a 401.

---

## The session/cookie lifecycle

```
SIGNUP / LOGIN                    SUBSEQUENT REQUESTS

Browser          Server DB        Browser          Server DB
   │                 │               │                 │
   │  POST /login    │               │  GET /chat      │
   │  { email, pw } ─►              │  Cookie: session=<token> ─►
   │                 │               │                 │
   │         verify pw vs hash       │        look up session by token
   │         bcrypt.compare()        │        check expiresAt
   │                 │               │                 │
   │       create Session row        │      found + not expired?
   │       { token, userId,          │                 │
   │         expiresAt }             │    ┌── Yes ─────┤
   │                 │               │    │  req.user = …; next()
   │  Set-Cookie:    │               │    │  serve protected page
   │  session=<token>│               │◄───┘            │
   │  HttpOnly Secure│               │    └── No ──────┤
   │◄────────────────│               │  401 or redirect /login
   │                 │               │◄────────────────│
```

---

## Files, in reading order

| Order | File | What it teaches |
|---|---|---|
| 1 | `cookies.ts` | The cookie lifecycle; HttpOnly/Secure/SameSite as defences against specific attacks; sessions vs JWTs |
| 2 | `sessions-from-scratch.ts` | Hand-rolled session auth: hash, issue token, validate, revoke |
| 3 | `auth-middleware.ts` | Protecting routes; writing `req.user`; redirect (browser) vs 401 (API) |
| 4 | `recognition-targets.md` | Better Auth and Auth.js — what they abstract, why teams pick them |

Each cookie flag and each step in the lifecycle is tied to **the specific attack it stops** — that's the right way to hold security knowledge (a flag you can't attach to a threat is a flag you'll misconfigure).

---

## How to run

```bash
npm run 07:sessions   # walks the session lifecycle with console output
npm run 07:cookies    # prints the Set-Cookie headers and explains each flag
```

---

## Read-and-modify exercises

1. **`sessions-from-scratch.ts`** — change the token from 32 to 64 bytes. State the security impact in terms of *guessability*, and whether 32 bytes was already enough (it was — explain why).
2. **`sessions-from-scratch.ts`** — add a rolling session: extend `expiresAt` by 7 days on each successful validation. What's the UX win, and the security cost?
3. **`auth-middleware.ts`** — it already branches on the `Accept` header (redirect vs 401). Trace *why* an API client must get 401 and not a redirect: what would `fetch()` do with a 302 to `/login`?
4. **`recognition-targets.md`** — after reading, name three things Better Auth handles that our hand-rolled version doesn't, and for each say which attack or flow it covers.

---

## What we're deliberately skipping

- **JWTs** — stateless alternative to sessions; the token *is* the data, signed not looked-up. Great for service-to-service; the catch is you can't revoke one without rebuilding the statefulness you removed. Compared head-to-head in `cookies.ts`.
- **OAuth / OIDC** — "Login with Google." Understand the redirect flow conceptually; the libraries in `recognition-targets.md` implement it. Hand-rolling it is not worth your time.
- **PKCE, TOTP, WebAuthn** — know they exist; don't implement.

---

## Stop condition

You're done when you can:

- Walk the lifecycle verbally (signup → cookie → protected route → logout), saying **what's stored server-side, what the browser holds, and why the token carries no data**.
- Read `auth-middleware.ts` and explain exactly what happens to a request with no cookie vs a valid cookie vs an expired cookie — including which status/redirect each gets and why.
- Name, for each of HttpOnly / Secure / SameSite, the specific attack it defends against.
- Say in one sentence what Better Auth or Auth.js handles that the hand-rolled version doesn't.

§08's exercises include testing auth middleware — the same `requireAuth` function from this section. §10 wires Better Auth in place of the hand-rolled version and protects `/chat/*` with a Next.js middleware that does the same cookie check you wrote here.
