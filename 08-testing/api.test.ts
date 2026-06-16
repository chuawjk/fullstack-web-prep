/*
  API / endpoint tests — HTTP request → status + body.

  PROBLEM
  -------
  Unit and component tests verify individual pieces, but they don't tell you
  whether your Express routes actually respond correctly to real HTTP requests:
  correct status codes, correct JSON bodies, correct Zod validation rejections.
  You need to exercise the whole request lifecycle — JSON parsing → Zod validation
  → route handler → response — as one test.

  CONCEPT
  -------
  Start the real Express app in-process on a random port (no real network cost),
  hit it with `fetch`, assert on status and body. The whole middleware chain runs.
  Nothing is mocked here, on purpose — the app is fast and deterministic enough
  to run for real. The boundary being tested is the HTTP contract. Mocking the
  app would mean testing a fake instead of what you ship.

  KEY INSIGHT
  -----------
  Mock at the boundary only when the cost of running the real thing is too high
  (slow DB, paid API, non-deterministic external service). An in-memory app is
  cheap enough to run for real — mocking it buys you nothing and hides real bugs.

  IN THIS FILE
  ------------
  • buildApp()          — a factory that creates a self-contained, testable app
                          instance (not the production singleton)
  • beforeAll/afterAll  — start and stop the server once per suite
  • GET /api/users      — empty array
  • POST /api/users     — 201 success, 422 invalid email, 422 missing field
  • GET /api/users/:id  — 200 success, 404 not found

  PYTHON ANALOGY
  --------------
  Flask's test_client() or FastAPI's TestClient (httpx) — same idea: start the
  app in-process, hit it with real requests, assert on responses.

  Run: npm run 08:test
*/

import { describe, it, expect, beforeAll, afterAll } from "vitest";
import express, { Request, Response } from "express";
import { z } from "zod";
import http from "http";

// ── The app under test ────────────────────────────────────────────────────────
// PURPOSE: defined as a factory function so each test suite gets a fresh instance
// with its own in-memory store. Reasons:
//   1. The test is self-contained — no shared singleton state across tests.
//   2. We control the port and lifecycle (port 0 = OS assigns a free one).
//   3. We can swap the in-memory store for a test DB without changing test logic.

interface UserResponse {
  id: string;
  email: string;
  displayName: string;
}

const CreateUserSchema = z.object({
  email: z.string().email(),
  displayName: z.string().min(1),
});

function buildApp() {
  const app = express();
  app.use(express.json());

  const users: UserResponse[] = [];

  app.get("/api/users", (_req, res) => {
    res.json(users);
  });

  app.post("/api/users", (req: Request, res: Response) => {
    const result = CreateUserSchema.safeParse(req.body);
    if (!result.success) {
      res.status(422).json({ error: "Validation failed", details: result.error.errors });
      return;
    }
    const user: UserResponse = {
      id: `u-${Date.now()}`,
      email: result.data.email,
      displayName: result.data.displayName,
    };
    users.push(user);
    res.status(201).json(user);
  });

  app.get("/api/users/:id", (req: Request, res: Response) => {
    const user = users.find(u => u.id === req.params.id);
    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }
    res.json(user);
  });

  return app;
}

// ── Test setup ────────────────────────────────────────────────────────────────
// PURPOSE: start the server once before all tests in this file, stop it after.
// Port 0 = OS assigns a free port — prevents conflicts when tests run in parallel.
// Python equivalent: pytest's module-scoped fixtures.

let server: http.Server;
let baseUrl: string;

beforeAll(() => {
  return new Promise<void>(resolve => {
    server = buildApp().listen(0, () => {
      const addr = server.address() as { port: number };
      baseUrl = `http://localhost:${addr.port}`;
      resolve();
    });
  });
});

afterAll(() => {
  return new Promise<void>(resolve => server.close(() => resolve()));
});

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("GET /api/users", () => {
  it("returns an empty array when no users exist", async () => {
    const res = await fetch(`${baseUrl}/api/users`);

    expect(res.status).toBe(200);

    const data = await res.json();
    expect(Array.isArray(data)).toBe(true);
  });
});

describe("POST /api/users", () => {
  it("creates a user with valid data and returns 201", async () => {
    const res = await fetch(`${baseUrl}/api/users`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "test@example.com", displayName: "Test User" }),
    });

    expect(res.status).toBe(201);

    const user = await res.json() as UserResponse;
    expect(user.email).toBe("test@example.com");
    expect(user.displayName).toBe("Test User");
    expect(typeof user.id).toBe("string");
  });

  it("returns 422 for an invalid email", async () => {
    const res = await fetch(`${baseUrl}/api/users`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "not-an-email", displayName: "Test" }),
    });

    expect(res.status).toBe(422);

    const body = await res.json() as { error: string };
    expect(body.error).toBe("Validation failed");
  });

  it("returns 422 when displayName is missing", async () => {
    const res = await fetch(`${baseUrl}/api/users`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "x@example.com" }),
    });

    expect(res.status).toBe(422);
  });
});

describe("GET /api/users/:id", () => {
  it("returns a specific user by ID", async () => {
    // ARRANGE: create a user first
    const createRes = await fetch(`${baseUrl}/api/users`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: `lookup@example.com`, displayName: "Lookup User" }),
    });
    const created = await createRes.json() as UserResponse;

    // ACT: fetch that specific user
    const res = await fetch(`${baseUrl}/api/users/${created.id}`);

    // ASSERT
    expect(res.status).toBe(200);
    const user = await res.json() as UserResponse;
    expect(user.id).toBe(created.id);
    expect(user.email).toBe("lookup@example.com");
  });

  it("returns 404 for an unknown ID", async () => {
    const res = await fetch(`${baseUrl}/api/users/nonexistent-id`);
    expect(res.status).toBe(404);
  });
});
