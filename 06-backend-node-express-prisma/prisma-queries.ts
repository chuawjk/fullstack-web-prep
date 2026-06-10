/*
  PRISMA CRUD QUERIES — the five operations you'll use most.

  Prisma is a type-safe database client. Every query method returns a TypeScript
  type that matches your schema exactly — no casting, no 'any'.

  Python equivalent: SQLAlchemy ORM queries, but the types are auto-generated
  from the schema rather than derived from model class definitions.

  SETUP REQUIRED before running this file:
    npx prisma generate                  ← generates the TS client
    npx prisma migrate dev --name init   ← creates dev.db + runs migrations

  Run: npm run 06:queries
  (This connects to the dev.db SQLite file created by prisma migrate)
*/

import { PrismaClient } from "@prisma/client";

// PrismaClient is the auto-generated database client.
// One instance per application — don't create a new one per request.
// Python equivalent: an SQLAlchemy Session factory.
const prisma = new PrismaClient({
  log: ["query"],  // log every SQL query to the console — great for learning
});

async function main() {
  // === CREATE ================================================================
  // prisma.user.create() → INSERT INTO User (...) VALUES (...) RETURNING *
  // Python/SQLAlchemy: session.add(User(...)); session.commit(); session.refresh(user)

  const user = await prisma.user.create({
    data: {
      email: "alice@example.com",
      displayName: "Alice",
      passwordHash: "$2b$10$fakehashedpassword",  // in real code: await bcrypt.hash(pw, 10)
    },
  });
  console.log("Created user:", user.id, user.email);

  // Create a conversation and its first message in ONE transaction.
  // Prisma's `create` can nest relation creation.
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

  // === READ ==================================================================
  // findUnique: fetches exactly ONE record by a unique field. Returns null if not found.
  // Python/SQLAlchemy: session.query(User).filter_by(email=...).one_or_none()

  const foundUser = await prisma.user.findUnique({
    where: { email: "alice@example.com" },
  });
  console.log("Found user:", foundUser?.displayName);

  // findMany: fetches multiple records. Supports filtering, ordering, pagination.
  // Python/SQLAlchemy: session.query(Message).filter_by(conversationId=...).all()
  const messages = await prisma.message.findMany({
    where: { conversationId: conversation.id },
    orderBy: { createdAt: "asc" },   // ORDER BY createdAt ASC
    // take: 10,   // LIMIT 10  — pagination
    // skip: 20,   // OFFSET 20 — pagination
  });
  console.log("Messages in conversation:", messages.length);

  // === UPDATE ================================================================
  // update: updates ONE record identified by a unique field.
  // Python/SQLAlchemy: session.query(User).filter_by(id=...).update({...})

  const updatedUser = await prisma.user.update({
    where: { id: user.id },
    data: { displayName: "Alice Updated" },
  });
  console.log("Updated displayName:", updatedUser.displayName);

  // upsert: INSERT if not exists, UPDATE if it does (like PostgreSQL's ON CONFLICT).
  // Python: merge() in SQLAlchemy, or get_or_create() in Django ORM.
  const upserted = await prisma.user.upsert({
    where: { email: "bob@example.com" },
    create: { email: "bob@example.com", displayName: "Bob", passwordHash: "hash" },
    update: { displayName: "Bob Updated" },
  });
  console.log("Upserted user:", upserted.email);

  // === DELETE ================================================================
  // delete: removes ONE record by a unique field.
  // Python/SQLAlchemy: session.delete(user); session.commit()

  await prisma.user.delete({ where: { id: upserted.id } });
  console.log("Deleted bob");

  // === TRANSACTION ===========================================================
  // $transaction: run multiple operations atomically.
  // If any operation fails, ALL are rolled back.
  // Python/SQLAlchemy: with session.begin():  (or session.commit()/rollback())

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
