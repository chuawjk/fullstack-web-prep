/*
  Session auth from scratch — understanding the mechanism before using a library.

  PROBLEM
  -------
  Most web apps need to know who's making a request. HTTP is stateless — every
  request arrives with no inherent identity. After a user logs in, the browser
  needs a way to prove "I'm the user who logged in earlier" on every subsequent
  request, and the server needs a way to verify that claim without trusting it
  blindly. If you just read the session token value directly, you need to understand
  what you're trusting and why.

  CONCEPT
  -------
  Session auth splits the problem: the server stores the truth (a Session row
  mapping a random token to a userId + expiry); the browser holds only the token
  (an opaque string sent on every request via a cookie). On each request, the
  server looks up the token — found + not expired = authenticated. Logging out
  deletes the server-side row, making the token worthless instantly. The password
  is never stored — only a slow hash of it.

  KEY INSIGHT
  -----------
  The browser holds a key (the token); the server holds the lock (the Session row).
  Logout = delete the lock. The key alone is worthless without a matching row.

  IN THIS FILE
  ------------
  • Password hashing (SHA-256 stand-in for bcrypt — see warning in code)
  • Session token generation (crypto.randomBytes — 256 bits of randomness)
  • signup / login / validateSession / logout
  • demo() — walks the full lifecycle: signup → login → validate → wrong-password
              rejection → logout → revoked token failing validation

  WHEN YOU'D USE THIS
  -------------------
  The concepts here are universal; in practice you'd use Better Auth or Auth.js
  (covered in §07 recognition-targets.md) rather than hand-rolling. This file
  exists so the library code makes sense when you read it.

  PYTHON ANALOGY
  --------------
  Flask session + a DB-backed store, or Django's session framework — same model:
  token in cookie, truth stored server-side.

  Run: tsx 07-auth/sessions-from-scratch.ts
  (simulates the full lifecycle in memory and prints each step — no real DB/HTTP)
*/

import crypto from "crypto";  // Node.js built-in — no npm install needed

// ── Types ─────────────────────────────────────────────────────────────────────

interface User {
  id: string;
  email: string;
  displayName: string;
  passwordHash: string;
}

interface Session {
  id: string;
  token: string;          // the opaque token stored in the cookie
  userId: string;
  expiresAt: Date;
  createdAt: Date;
}

// ── In-memory "database" ──────────────────────────────────────────────────────
// PURPOSE: stand-ins for Prisma queries so the file runs standalone. In a real
// app these Maps would be replaced with `prisma.user.findUnique(...)` etc.

const users: Map<string, User> = new Map();       // id → User
const sessions: Map<string, Session> = new Map(); // token → Session
const usersByEmail: Map<string, User> = new Map();// email → User

// ── Password hashing ──────────────────────────────────────────────────────────
// PURPOSE: shows WHY hashing exists, even though the implementation here is
// deliberately unsafe (SHA-256 is not suitable for passwords — see warning below).
//
// Never store raw passwords. If the DB is compromised, hashed passwords are
// useless to an attacker IF the algorithm is slow. bcrypt/argon2/scrypt are
// specifically designed to be slow — that cost is the defence against brute-forcing.
// Python equivalent: werkzeug.security.generate_password_hash()

function simulateHash(password: string): string {
  // SHA-256 for simulation only — NOT safe for real password hashing.
  // Real apps MUST use bcrypt, argon2, or scrypt (slow algorithms designed for passwords).
  return crypto.createHash("sha256").update(password + "salt").digest("hex");
}

function simulateVerify(password: string, hash: string): boolean {
  // FOOTGUN (real code): comparing hashes with === leaks timing information — it
  // returns early on the first differing byte, hinting at how much matched.
  // Real password libraries (bcrypt.compare, argon2.verify) use constant-time
  // comparison. Fine in this in-memory demo; never ship `===` here.
  return simulateHash(password) === hash;
}

// ── Session token generation ──────────────────────────────────────────────────
// PURPOSE: a session token is a random, opaque string — the "password" for the
// session. 32 bytes = 256 bits of randomness makes brute-forcing infeasible.
// Python equivalent: secrets.token_hex(32)

function generateToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

// ── Auth operations ───────────────────────────────────────────────────────────

function signup(email: string, password: string, displayName: string): User {
  if (usersByEmail.has(email)) {
    throw new Error("Email already in use");
  }

  const user: User = {
    id: crypto.randomUUID(),
    email,
    displayName,
    passwordHash: simulateHash(password),
  };

  users.set(user.id, user);
  usersByEmail.set(email, user);
  console.log(`✓ User created: ${user.email} (id: ${user.id.slice(0, 8)}…)`);
  return user;
}

function login(email: string, password: string): { user: User; session: Session } {
  const user = usersByEmail.get(email);

  if (!user) {
    // Important: same error message for "user not found" and "wrong password".
    // Different messages let an attacker enumerate valid email addresses.
    throw new Error("Invalid email or password");
  }

  const passwordValid = simulateVerify(password, user.passwordHash);
  if (!passwordValid) {
    throw new Error("Invalid email or password");
  }

  const session: Session = {
    id: crypto.randomUUID(),
    token: generateToken(),   // this token goes in the cookie
    userId: user.id,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),  // 7 days
    createdAt: new Date(),
  };

  sessions.set(session.token, session);
  console.log(`✓ Session created for ${email}, expires ${session.expiresAt.toISOString()}`);

  // In Express: res.cookie("session", session.token, { httpOnly: true, ... })
  return { user, session };
}

function validateSession(token: string): { user: User; session: Session } | null {
  const session = sessions.get(token);

  if (!session) {
    console.log("✗ Session not found");
    return null;
  }

  if (session.expiresAt < new Date()) {
    sessions.delete(token);  // clean up expired session
    console.log("✗ Session expired");
    return null;
  }

  const user = users.get(session.userId);
  if (!user) {
    sessions.delete(token);  // orphaned session
    return null;
  }

  console.log(`✓ Session valid for ${user.email}`);
  return { user, session };
}

function logout(token: string): void {
  sessions.delete(token);
  // In Express: res.clearCookie("session")
  console.log("✓ Session revoked");
}

// ── Demo: full lifecycle ───────────────────────────────────────────────────────
// PURPOSE: runs every step in sequence so you can read the printed output next
// to the code and see exactly what the server stores vs. what the browser would hold.

function demo() {
  console.log("=== Session Auth Demo ===\n");

  const user = signup("alice@example.com", "hunter2", "Alice");

  const { session } = login("alice@example.com", "hunter2");
  const token = session.token;
  console.log(`  Token (first 16 chars): ${token.slice(0, 16)}…\n`);

  const auth = validateSession(token);
  console.log(`  Authenticated as: ${auth?.user.displayName}\n`);

  try {
    login("alice@example.com", "wrongpassword");
  } catch (e) {
    console.log(`✗ Login rejected: ${(e as Error).message}\n`);
  }

  logout(token);

  const afterLogout = validateSession(token);
  console.log(`  After logout validation: ${afterLogout === null ? "null (correct)" : "BUG!"}`);
}

demo();
