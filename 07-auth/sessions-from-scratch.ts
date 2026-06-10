/*
  SESSION AUTH FROM SCRATCH — the Lucia-educational approach.
  Read lucia-auth.com for the authoritative guide; this file is a standalone
  runnable demonstration of the same concepts.

  What we're building:
    1. Hash a password with bcrypt
    2. Create a session token + store it in the DB
    3. Read the cookie on the next request + validate the session
    4. Revoke the session on logout

  Python equivalent: implementing sessions manually in Flask using
  flask.session (server-side), itsdangerous tokens, and a DB table.

  Run: tsx 07-auth/sessions-from-scratch.ts
  (simulates the full lifecycle in memory — no real DB or HTTP)
*/

import crypto from "crypto";  // Node.js built-in — no npm install needed

// === TYPES ===================================================================
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

// === IN-MEMORY "DATABASE" ====================================================
// In a real app these would be Prisma queries.
const users: Map<string, User> = new Map();          // id → User
const sessions: Map<string, Session> = new Map();    // token → Session
const usersByEmail: Map<string, User> = new Map();   // email → User

// === PASSWORD HASHING ========================================================
// We simulate bcrypt here without the actual library so the file runs standalone.
// In a real app: import bcrypt from "bcryptjs"; const hash = await bcrypt.hash(pw, 10)
//
// WHY HASH? Never store raw passwords. If the DB is compromised, hashed passwords
// are useless to the attacker (good luck reversing bcrypt's 10 rounds).
// Python equivalent: werkzeug.security.generate_password_hash()

function simulateHash(password: string): string {
  // SHA-256 for simulation only — NOT safe for real password hashing.
  // Real apps MUST use bcrypt, argon2, or scrypt (slow algorithms designed for passwords).
  return crypto.createHash("sha256").update(password + "salt").digest("hex");
}

function simulateVerify(password: string, hash: string): boolean {
  return simulateHash(password) === hash;
}

// === SESSION TOKEN GENERATION ================================================
// A session token is a random, opaque string. It's the "password" for the session.
// crypto.randomBytes(32) gives 32 bytes = 256 bits of randomness.
// .toString("hex") converts to a 64-character hex string.
// Python equivalent: secrets.token_hex(32)

function generateToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

// === AUTH OPERATIONS =========================================================

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
    // Important: use the same error message for "user not found" and "wrong password".
    // Different messages would let an attacker enumerate valid email addresses.
    throw new Error("Invalid email or password");
  }

  const passwordValid = simulateVerify(password, user.passwordHash);
  if (!passwordValid) {
    throw new Error("Invalid email or password");
  }

  // Create a new session for this login.
  const session: Session = {
    id: crypto.randomUUID(),
    token: generateToken(),   // this token goes in the cookie
    userId: user.id,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),  // 7 days from now
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
    return null;  // no session with this token
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

// === DEMO: full lifecycle ====================================================
function demo() {
  console.log("=== Session Auth Demo ===\n");

  // 1. Signup
  const user = signup("alice@example.com", "hunter2", "Alice");

  // 2. Login
  const { session } = login("alice@example.com", "hunter2");
  const token = session.token;
  console.log(`  Token (first 16 chars): ${token.slice(0, 16)}…\n`);

  // 3. Validate session (simulates reading the cookie on the next request)
  const auth = validateSession(token);
  console.log(`  Authenticated as: ${auth?.user.displayName}\n`);

  // 4. Try wrong password
  try {
    login("alice@example.com", "wrongpassword");
  } catch (e) {
    console.log(`✗ Login rejected: ${(e as Error).message}\n`);
  }

  // 5. Logout
  logout(token);

  // 6. Try to use the revoked token
  const afterLogout = validateSession(token);
  console.log(`  After logout validation: ${afterLogout === null ? "null (correct)" : "BUG!"}`);
}

demo();
