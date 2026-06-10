/*
  COOKIES: small pieces of data the server sends to the browser, which the browser
  automatically sends back on every subsequent request to the same domain.

  This is how "being logged in" is implemented: the server creates a session,
  stores it in a database, and gives the browser a token in a cookie. The browser
  presents the token on every request; the server looks up the session.

  Python equivalent: Django's SESSION_COOKIE_NAME, or Flask's set_cookie().
  The concept is identical — sessions + cookies is universal web auth.

  Run: tsx 07-auth/cookies.ts
*/

// === THE COOKIE HEADER ========================================================
// When a server sends  Set-Cookie: name=value; options  in a response header,
// the browser stores that cookie and returns it in every future request to
// that domain as  Cookie: name=value.

// The critical security options (and what they do):

/*
  HttpOnly
  ────────
  The cookie cannot be read by JavaScript (document.cookie).
  This PREVENTS XSS attacks from stealing the session token:
    - Attacker injects malicious JS into your page
    - JS tries to read document.cookie
    - Browser refuses because HttpOnly is set
    - Session token is safe

  WITHOUT HttpOnly: any script running on your page can steal the session.
  ALWAYS set HttpOnly on session cookies.
  Python Django: SESSION_COOKIE_HTTPONLY = True (the default)

  Secure
  ──────
  The cookie is only sent over HTTPS, never plain HTTP.
  Prevents the cookie from being stolen by a network attacker (man-in-the-middle).
  ALWAYS set in production. Omit in local dev (which uses HTTP).
  Python Django: SESSION_COOKIE_SECURE = True

  SameSite=Lax  (or Strict)
  ─────────────────────────
  Controls cross-site request behaviour.
  Lax: cookie is sent on same-site requests AND top-level navigation (e.g. clicking a link).
  Strict: cookie is ONLY sent on same-site requests. More secure, but breaks OAuth flows.
  None: cookie is sent everywhere. ONLY safe with Secure.
  Default modern browsers: Lax. Always specify it explicitly.
  This PREVENTS CSRF (Cross-Site Request Forgery) attacks.

  Path=/
  ──────
  The path for which the cookie is sent. / means sent to all paths on the domain.

  Max-Age=604800  (or Expires=...)
  ────────────────────────────────
  604800 = 7 days in seconds. When this expires, the browser deletes the cookie.
  Omitting both: "session cookie" — deleted when the browser closes.
  We always set an explicit expiry so sessions have a predictable lifetime.
*/

// === EXAMPLE: setting a session cookie in Express ============================
// This is the code that runs after a successful login.

function exampleSetCookie() {
  const sessionToken = "demo-token-abc123";
  const sevenDays = 60 * 60 * 24 * 7;  // in seconds

  // The raw Set-Cookie header value (what the server would send):
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

  // In an Express handler you'd write:
  // res.cookie("session", sessionToken, {
  //   httpOnly: true,
  //   secure: process.env.NODE_ENV === "production",  // only HTTPS in prod
  //   sameSite: "lax",
  //   maxAge: sevenDays * 1000,  // Express takes milliseconds; HTTP header takes seconds
  //   path: "/",
  // });
}

// === CLEARING A COOKIE (logout) ==============================================
// To log a user out: delete the session from the database AND clear the cookie.
// A cookie is "cleared" by setting it with the same name but Max-Age=0 or a past Expires.
// The browser deletes it immediately.

function exampleClearCookie() {
  const cookieValue = "session=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0";
  console.log("Logout Set-Cookie header value:");
  console.log(cookieValue);
  // Express: res.clearCookie("session");
}

// === SESSIONS vs JWTs: a quick comparison ====================================
// Sessions (what we're building):
//   + Can be revoked instantly (delete the session row in DB)
//   + Less data on the wire (just a token)
//   − Requires a DB lookup on every request
//   − Stateful — harder to scale across many servers (use a shared store like Redis)
//
// JWTs (alternative):
//   + Stateless — no DB lookup needed; the token IS the data
//   + Easy to pass between microservices
//   − Hard to revoke: must wait for expiry, or maintain a revocation list (negating the benefit)
//   − Larger cookies (the token contains all the data)
//
// For most web apps with a single server/database: sessions win. For API-only
// or microservice auth: JWTs are common.

exampleSetCookie();
exampleClearCookie();
console.log("\nCookies are set by the server (Set-Cookie header) and sent by the browser (Cookie header).");
console.log("JavaScript cannot read HttpOnly cookies — that's the security guarantee.");
