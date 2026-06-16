/*
  Cookies — how the browser holds and returns the session token securely.

  PROBLEM
  -------
  After a successful login the server has a session token and needs to give it to
  the browser. Returning it in a JSON body and storing it in localStorage would
  work — but any XSS vulnerability would let a malicious script read it from
  localStorage and steal the session. You need the token stored somewhere that
  JavaScript can't access.

  CONCEPT
  -------
  Set-Cookie headers tell the browser to store a value and send it back
  automatically on every future request to the same domain — with no JavaScript
  involvement. Security flags on the cookie constrain when and how the browser
  sends it. Each flag was added to stop a specific class of attack. Read each flag
  as "the attack it prevents," not as a configuration knob.

  KEY INSIGHT
  -----------
  HttpOnly prevents XSS scripts from reading the token. Secure prevents network
  interception. SameSite prevents CSRF. Each flag is a defence against one specific
  attack — misconfiguring any one of them reopens that attack surface.

  IN THIS FILE
  ------------
  • The Set-Cookie header format and what each flag does
  • exampleSetCookie — the header the server sends on login
  • exampleClearCookie — the header the server sends on logout (Max-Age=0)
  • Sessions vs. JWTs comparison

  PYTHON ANALOGY
  --------------
  Django's SESSION_COOKIE_* settings / Flask's set_cookie() — same flags, same
  security model. The cookie mechanism itself is browser-specific (no Python
  equivalent for the automatic attachment on every request).

  Run: tsx 07-auth/cookies.ts
  (prints the raw Set-Cookie headers for login and logout)
*/

// ── The Set-Cookie header ──────────────────────────────────────────────────────
// When the server sends  Set-Cookie: name=value; options  in a response header,
// the browser stores that cookie and returns it on every future request to that
// domain as  Cookie: name=value.

/*
  HttpOnly
  ────────
  The cookie CANNOT be read by JavaScript (document.cookie returns nothing for it).
  This PREVENTS XSS attacks from stealing the session token:
    - Attacker injects malicious JS into your page
    - JS tries to read document.cookie
    - Browser refuses because HttpOnly is set
    - Session token is safe
  WITHOUT HttpOnly: any script on your page can steal the session.
  ALWAYS set HttpOnly on session cookies.
  Python Django: SESSION_COOKIE_HTTPONLY = True (the default)

  Secure
  ──────
  The cookie is only sent over HTTPS, never plain HTTP.
  PREVENTS the cookie from being stolen by a network attacker (man-in-the-middle).
  ALWAYS set in production. Omit in local dev (which uses HTTP).
  Python Django: SESSION_COOKIE_SECURE = True

  SameSite=Lax  (or Strict)
  ─────────────────────────
  Controls cross-site request behaviour.
  Lax:    cookie is sent on same-site requests AND top-level navigation (clicking a link).
  Strict: cookie is ONLY sent on same-site requests. More secure, but breaks OAuth flows.
  None:   cookie is sent everywhere. ONLY safe with Secure.
  Default in modern browsers: Lax. Always specify it explicitly.
  PREVENTS CSRF (Cross-Site Request Forgery) attacks.

  Path=/
  ──────
  The path for which the cookie is sent. / means sent to all paths on the domain.

  Max-Age=604800  (or Expires=...)
  ────────────────────────────────
  604800 = 7 days in seconds. When this expires, the browser deletes the cookie.
  Omitting both: "session cookie" — deleted when the browser closes.
  Always set an explicit expiry so sessions have a predictable lifetime.
*/

// ── Setting a session cookie on login ─────────────────────────────────────────
// PURPOSE: shows the raw Set-Cookie header value the server sends after a
// successful login. In Express you'd use res.cookie() with the options below —
// the library builds this header for you.

function exampleSetCookie() {
  const sessionToken = "demo-token-abc123";
  const sevenDays = 60 * 60 * 24 * 7;  // in seconds

  const cookieValue = [
    `session=${sessionToken}`,
    `HttpOnly`,
    `Secure`,
    `SameSite=Lax`,
    `Path=/`,
    `Max-Age=${sevenDays}`,
  ].join("; ");

  console.log("Set-Cookie header value:");
  console.log(cookieValue);
  console.log();

  // In Express:
  // res.cookie("session", sessionToken, {
  //   httpOnly: true,
  //   secure: process.env.NODE_ENV === "production",  // only HTTPS in prod
  //   sameSite: "lax",
  //   maxAge: sevenDays * 1000,  // Express takes milliseconds; HTTP header takes seconds
  //   path: "/",
  // });
}

// ── Clearing a cookie on logout ────────────────────────────────────────────────
// PURPOSE: to log a user out, delete the session from the database AND clear the
// cookie. A cookie is "cleared" by setting it with the same name but Max-Age=0.
// The browser deletes it immediately. Without this the stale token stays in the
// browser even after the server-side session is gone — not a security hole (the
// session lookup fails), but confusing UX.

function exampleClearCookie() {
  const cookieValue = "session=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0";
  console.log("Logout Set-Cookie header value:");
  console.log(cookieValue);
  // Express: res.clearCookie("session");
}

// ── Sessions vs. JWTs ─────────────────────────────────────────────────────────
// Sessions (what we're building):
//   + Can be revoked instantly (delete the session row in DB)
//   + Less data on the wire (just a token)
//   − Requires a DB lookup on every request
//   − Stateful — harder to scale across many servers (use a shared store like Redis)
//
// JWTs (alternative):
//   + Stateless — no DB lookup needed; the token IS the data, signed with a secret
//   + Easy to pass between microservices
//   − Hard to revoke: must wait for expiry, or maintain a revocation list
//     (which adds back the statefulness you removed)
//   − Larger cookies (the token contains all the data)
//
// For most web apps with a single database: sessions win. For API-only or
// microservice auth where you need to pass identity without a DB lookup: JWTs.

exampleSetCookie();
exampleClearCookie();
console.log("\nCookies are set by the server (Set-Cookie header) and sent by the browser (Cookie header).");
console.log("JavaScript cannot read HttpOnly cookies — that's the security guarantee.");
