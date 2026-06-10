/*
  API / ENDPOINT TESTS — testing an Express route end-to-end.

  We spin up the Express app IN-PROCESS (no real network call) and use the
  Node.js `fetch` API to send requests to it. The app runs locally, using an
  in-memory store instead of a real database.

  This tests the full request lifecycle:
    fetch → express.json() middleware → validation → route handler → response

  Python equivalent: Flask's test_client() or FastAPI's TestClient (httpx).

  Run: npm run 08:test
*/

import { describe, it, expect, beforeAll, afterAll } from "vitest";
import express, { Request, Response } from "express";
import { z } from "zod";
import http from "http";

// === THE APP UNDER TEST =======================================================
// Duplicated here rather than importing from express-server.ts so:
// 1. The test is self-contained.
// 2. We can swap the in-memory store for a test DB if needed.
// 3. We control the port and lifecycle.

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

// === TEST SETUP ==============================================================
// beforeAll / afterAll: run once before/after the entire describe block.
// Python equivalent: pytest's module-scoped fixtures.

let server: http.Server;
let baseUrl: string;

beforeAll(() => {
  return new Promise<void>(resolve => {
    // Listen on port 0 = OS assigns a random available port.
    // This prevents port conflicts when running tests in parallel.
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

// === TESTS ===================================================================

describe("GET /api/users", () => {
  it("returns an empty array when no users exist", async () => {
    const res = await fetch(`${baseUrl}/api/users`);

    // ASSERT: HTTP status
    expect(res.status).toBe(200);

    // ASSERT: response body
    const data = await res.json();
    expect(Array.isArray(data)).toBe(true);
  });
});

describe("POST /api/users", () => {
  it("creates a user with valid data and returns 201", async () => {
    // ARRANGE + ACT
    const res = await fetch(`${baseUrl}/api/users`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "test@example.com", displayName: "Test User" }),
    });

    // ASSERT
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
      // displayName is missing — Zod should reject this
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
