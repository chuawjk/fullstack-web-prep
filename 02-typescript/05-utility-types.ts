/*
  TypeScript ships with built-in "utility types" that TRANSFORM existing types.
  Instead of rewriting similar interfaces by hand, you derive new types from
  existing ones in one line.

  Python equivalent: the typing module helpers (Optional, Dict, etc.) combined
  with Pydantic's model transformations (model.model_copy(update=...), etc.).
  None of these have exact Python parallels — utility types are a TS superpower.
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

// === Partial<T> ===============================================================
// Makes EVERY property optional. Typical use: update/patch payloads where
// you only send the fields you want to change.
// Python: a TypedDict where every field is Optional, or a Pydantic model
//         where all fields have defaults.

type UserPatch = Partial<User>;
// Equivalent to: { id?: string; email?: string; displayName?: string; ... }

function updateUser(id: string, changes: UserPatch): void {
  // Only the changed fields are present — you might only send { displayName: "Alice" }
  console.log(`Patching user ${id}:`, Object.keys(changes).join(", "));
}

updateUser("u-1", { displayName: "Alice" });     // only one field
updateUser("u-2", { email: "b@b.com", displayName: "Bob" }); // two fields

// === Pick<T, K> ===============================================================
// Creates a new type with ONLY the listed keys. Use for API responses where
// you want to return a "safe" subset without sensitive fields.
// Python: a new TypedDict with only those fields; or Pydantic response_model.

type PublicUser = Pick<User, "id" | "email" | "displayName">;
// Result: { id: string; email: string; displayName: string }
// passwordHash is omitted — safe to serialise and send to the client.

function toPublicUser(user: User): PublicUser {
  return { id: user.id, email: user.email, displayName: user.displayName };
}

// === Omit<T, K> ===============================================================
// The inverse of Pick — a new type with those keys REMOVED.
// Handy when you want "everything except a few sensitive fields".

type UserWithoutPassword = Omit<User, "passwordHash">;
// All User fields except passwordHash.

// === Record<K, V> =============================================================
// A typed dictionary/map. Keys have type K, values have type V.
// Python equivalent: Dict[str, V] — identical mental model.
// Very common for lookup tables and in-memory caches.

type ConversationIndex = Record<string, Message[]>;
// A map from conversation IDs (strings) to arrays of Messages.

const convos: ConversationIndex = {
  "conv-1": [{ id: "m-1", userId: "u-1", content: "Hello", createdAt: "..." }],
  "conv-2": [],
};

// === ReturnType<typeof fn> ====================================================
// Extracts the return type of a function automatically.
// Useful when you don't want to duplicate a type that's already expressed
// by a function's return signature.
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
// TypeScript infers the full shape from the function — you never had to write it.

// === Required<T> (the inverse of Partial) =====================================
// Makes every optional property required. Useful for validated/normalised objects.
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
