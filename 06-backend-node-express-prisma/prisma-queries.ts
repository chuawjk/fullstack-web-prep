/*
  Prisma CRUD queries — the operations you'll use most, mapped to SQL.

  PROBLEM
  -------
  You need to query a database from TypeScript. Raw SQL strings have no type
  safety — a typo in a column name is a runtime error, not a compile error. An ORM
  adds type safety but typically requires you to define model classes alongside your
  schema. You want a single source of truth: define the schema once, get a typed
  client generated from it.

  CONCEPT
  -------
  Prisma is schema-first: you define your data model in `schema.prisma`, run
  `prisma generate`, and get a TypeScript client whose method signatures match that
  schema exactly. `prisma.user.findUnique()` returns `User | null` — autocompleted,
  typed, no casting. The client is configured with `log: ["query"]` here so you can
  read the actual SQL each method produces alongside the Prisma call.

  KEY INSIGHT
  -----------
  The choice of method is the skill: findUnique returns null for a missing row;
  update and delete THROW. Guard a missing row with `findUnique → 404` BEFORE
  calling update/delete, or catch the throw in a handler.

  IN THIS FILE
  ------------
  • CREATE   — create with nested relation creation (one transaction)
  • READ     — findUnique (one row or null), findMany (with where/orderBy)
  • UPDATE   — update (throws if not found), upsert (INSERT ON CONFLICT)
  • DELETE   — delete (throws), deleteMany (returns count, never throws)
  • $transaction — atomic multi-operation: all succeed or all roll back

  PYTHON ANALOGY
  --------------
  SQLAlchemy ORM — schema-first, typed client, migration tool included.
  findUnique  ≈  session.query(User).filter_by(email=...).one_or_none()
  findMany    ≈  session.query(Message).filter_by(...).all()
  $transaction≈  with session.begin(): / session.commit()/rollback()

  Run: npm run 06:queries
  (connects to dev.db created by `npx prisma migrate dev --name init`)
*/

import { PrismaClient } from "@prisma/client";

// PrismaClient is the auto-generated database client — the RUNTIME half of Prisma
// (the CLI is the build-time half). One instance per application: it owns a
// connection pool, so creating one per request would exhaust connections fast.

const prisma = new PrismaClient({
  log: ["query"],  // print every SQL query — great for seeing what each method does
});

async function main() {
  // ── CREATE ──────────────────────────────────────────────────────────────────
  // PURPOSE: shows the basic create and nested creation (related records in one
  // call). The SQL emitted by the latter is a single transaction.

  // prisma.user.create() → INSERT INTO User (...) VALUES (...) RETURNING *
  // Python/SQLAlchemy: session.add(User(...)); session.commit(); session.refresh(user)
  const user = await prisma.user.create({
    data: {
      email: "alice@example.com",
      displayName: "Alice",
      passwordHash: "$2b$10$fakehashedpassword",
    },
  });
  console.log("Created user:", user.id, user.email);

  // Create a conversation and its first message in ONE call.
  // Prisma's `create` can nest relation creation — no separate INSERT needed.
  // Python: session.add(Conversation(user=user, messages=[Message(...)]))
  const conversation = await prisma.conversation.create({
    data: {
      userId: user.id,
      title: "First chat",
      messages: {
        create: [
          { role: "assistant", content: "Hi! How can I help?", userId: user.id },
        ],
      },
    },
    include: {
      messages: true,  // include: fetch related records in the same query (like JOIN)
    },
  });
  console.log("Created conversation with", conversation.messages.length, "message(s)");

  // ── READ ─────────────────────────────────────────────────────────────────────
  // PURPOSE: shows the two main read methods and when to use each.

  // findUnique: fetches exactly ONE record by a unique field. Returns null if not found.
  // Use this when you'll 404 on missing rather than letting it throw.
  // Python/SQLAlchemy: session.query(User).filter_by(email=...).one_or_none()
  const foundUser = await prisma.user.findUnique({
    where: { email: "alice@example.com" },
  });
  console.log("Found user:", foundUser?.displayName);

  // findMany: fetches multiple records. Supports where, orderBy, take (LIMIT), skip (OFFSET).
  // Python/SQLAlchemy: session.query(Message).filter_by(conversationId=...).all()
  const messages = await prisma.message.findMany({
    where: { conversationId: conversation.id },
    orderBy: { createdAt: "asc" },
    // take: 10,   // LIMIT 10  — pagination
    // skip: 20,   // OFFSET 20 — pagination
  });
  console.log("Messages in conversation:", messages.length);

  // ── UPDATE ───────────────────────────────────────────────────────────────────
  // PURPOSE: update throws if the row doesn't exist — use findUnique first in a
  // handler to return 404, or catch the throw.

  // Python/SQLAlchemy: session.query(User).filter_by(id=...).update({...})
  const updatedUser = await prisma.user.update({
    where: { id: user.id },
    data: { displayName: "Alice Updated" },
  });
  console.log("Updated displayName:", updatedUser.displayName);

  // upsert: INSERT if not exists, UPDATE if it does (Postgres ON CONFLICT).
  // Python: merge() in SQLAlchemy, or get_or_create() in Django ORM.
  const upserted = await prisma.user.upsert({
    where: { email: "bob@example.com" },
    create: { email: "bob@example.com", displayName: "Bob", passwordHash: "hash" },
    update: { displayName: "Bob Updated" },
  });
  console.log("Upserted user:", upserted.email);

  // ── DELETE ───────────────────────────────────────────────────────────────────
  // PURPOSE: delete throws if the row doesn't exist; deleteMany returns a count
  // and never throws, even for zero matches.

  // Python/SQLAlchemy: session.delete(user); session.commit()
  await prisma.user.delete({ where: { id: upserted.id } });
  console.log("Deleted bob");

  // ── $transaction ─────────────────────────────────────────────────────────────
  // PURPOSE: run multiple operations atomically — if any fails, all roll back.
  // Python/SQLAlchemy: with session.begin(): / session.commit()/rollback()

  const [newMessage, updatedConv] = await prisma.$transaction([
    prisma.message.create({
      data: {
        role: "user",
        content: "Hello from a transaction!",
        userId: user.id,
        conversationId: conversation.id,
      },
    }),
    prisma.conversation.update({
      where: { id: conversation.id },
      data: { updatedAt: new Date() },
    }),
  ]);
  console.log("Transaction: created message", newMessage.id, "and updated conv", updatedConv.id);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
