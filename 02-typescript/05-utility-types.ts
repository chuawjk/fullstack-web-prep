/*
  Utility types — transforming existing types instead of rewriting them by hand.

  PROBLEM
  -------
  You have a User interface with 6 fields. For the update endpoint you want a type
  where every field is optional (only send what changed). For the API response you
  want a type that omits `passwordHash` so it's never serialised to the client.
  Writing these by hand means duplicating the interface and keeping two definitions
  in sync whenever User changes.

  CONCEPT
  -------
  TypeScript ships built-in "utility types" that transform existing types in one
  line. Partial<T> makes every field optional. Pick<T, K> keeps only the listed
  keys. Omit<T, K> removes them. Record<K, V> builds a typed dict. ReturnType<>
  extracts a function's return type automatically. You derive the new type from the
  existing one — change User once and all derived types update for free.

  KEY INSIGHT
  -----------
  When you find yourself hand-writing a modified version of an existing interface,
  there's almost always a utility type that does it in one line. These are compile-
  time only — no runtime cost.

  IN THIS FILE
  ------------
  • Partial<T>           — every field becomes optional (update/patch payloads)
  • Pick<T, K>           — keep only listed keys (safe API response types)
  • Omit<T, K>           — remove listed keys (the inverse of Pick)
  • Record<K, V>         — typed dict / lookup table
  • ReturnType<typeof f> — extract a function's return type automatically
  • Required<T>          — the inverse of Partial (force all fields required)

  PYTHON ANALOGY
  --------------
  No exact Python equivalents — these are compile-time type transforms. The
  closest is Pydantic's model transformations (model_copy, response_model), but
  TypeScript's utility types operate at the type level with zero runtime cost.
*/

// Run this file: tsx 02-typescript/05-utility-types.ts

interface User {
  id: string;
  email: string;
  displayName: string;
  passwordHash: string;
  createdAt: string;
}

interface Message {
  id: string;
  userId: string;
  content: string;
  createdAt: string;
}

// ── Partial<T> ────────────────────────────────────────────────────────────────
// PURPOSE: makes every property optional — the right type for update/patch
// payloads where you only send the fields you want to change.
// Python closest: a TypedDict where every field is Optional, or a Pydantic
// model with all fields defaulted.

type UserPatch = Partial<User>;
// Equivalent to: { id?: string; email?: string; displayName?: string; ... }

function updateUser(id: string, changes: UserPatch): void {
  console.log(`Patching user ${id}:`, Object.keys(changes).join(", "));
}

updateUser("u-1", { displayName: "Alice" });            // only one field
updateUser("u-2", { email: "b@b.com", displayName: "Bob" }); // two fields

// ── Pick<T, K> ────────────────────────────────────────────────────────────────
// PURPOSE: creates a new type with ONLY the listed keys — use it for API
// responses where you want a "safe" subset that omits sensitive fields.
// Python: a new TypedDict with only those fields; or Pydantic's response_model.

type PublicUser = Pick<User, "id" | "email" | "displayName">;
// Result: { id: string; email: string; displayName: string }
// passwordHash is omitted — safe to serialise and send to the client.

function toPublicUser(user: User): PublicUser {
  return { id: user.id, email: user.email, displayName: user.displayName };
}

// ── Omit<T, K> ────────────────────────────────────────────────────────────────
// PURPOSE: the inverse of Pick — everything except the listed keys. Handy when
// you want "all fields minus a few sensitive ones" without listing every keeper.

type UserWithoutPassword = Omit<User, "passwordHash">;
// All User fields except passwordHash.

// ── Record<K, V> ──────────────────────────────────────────────────────────────
// PURPOSE: a typed dictionary — keys of type K, values of type V. The most
// common use is lookup tables and in-memory caches.
// Python: Dict[str, V] — identical mental model.

type ConversationIndex = Record<string, Message[]>;

const convos: ConversationIndex = {
  "conv-1": [{ id: "m-1", userId: "u-1", content: "Hello", createdAt: "..." }],
  "conv-2": [],
};

// ── ReturnType<typeof fn> ─────────────────────────────────────────────────────
// PURPOSE: extracts the return type of a function automatically, so you don't
// have to duplicate a type that's already expressed by the function's signature.
// Useful when a function returns an inlined object and you need to name the type.
// Python: no direct equivalent; typing.get_type_hints() is the closest.

function createMessage(userId: string, content: string) {
  return {
    id: crypto.randomUUID(),
    userId,        // shorthand: same as  userId: userId
    content,
    createdAt: new Date().toISOString(),
  };
}

type CreatedMessage = ReturnType<typeof createMessage>;
// TypeScript infers the full shape — you never had to write it out.

// ── Required<T> ──────────────────────────────────────────────────────────────
// PURPOSE: the inverse of Partial — makes every optional property required.
// Use when you've validated/normalised an object and want to stop treating
// its fields as optional downstream.

interface Config {
  model?: string;
  temperature?: number;
  maxTokens?: number;
}
type StrictConfig = Required<Config>;
// { model: string; temperature: number; maxTokens: number }

const config: StrictConfig = { model: "gpt-4o", temperature: 0.7, maxTokens: 1024 };

// Demo:
const alice: User = {
  id: "u-1", email: "alice@example.com", displayName: "Alice",
  passwordHash: "hashed!", createdAt: "2024-01-01",
};
console.log("Public user:", toPublicUser(alice));
console.log("Convo keys:", Object.keys(convos));
const newMsg: CreatedMessage = createMessage("u-1", "Hello utility types!");
console.log("New message id length:", newMsg.id.length > 0);
console.log("Config model:", config.model);
