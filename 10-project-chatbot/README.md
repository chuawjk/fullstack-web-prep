# 10 — Project: LLM Chatbot (Next.js App Router + OpenAI)

**Objective:** build and extend a working full-stack chatbot — signed-in users, persistent chat history, streaming LLM responses, clean Tailwind UI.

This is where every prior section converges. Don't start here; come back after completing §02–§07.

---

## What you're building

```
┌─────────────────────────────────────────────────────────────────┐
│  BROWSER                                                         │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  Next.js App Router (React + Tailwind)                   │   │
│  │  /              → landing / login page                    │   │
│  │  /chat          → conversation list                       │   │
│  │  /chat/[id]     → individual conversation with streaming  │   │
│  └──────────────────────────┬───────────────────────────────┘   │
└─────────────────────────────┼───────────────────────────────────┘
                              │  HTTP (fetch + streaming)
┌─────────────────────────────▼───────────────────────────────────┐
│  NEXT.JS SERVER (API routes in app/api/)                         │
│  /api/auth/[...all]  → Better Auth handler                      │
│  /api/chat           → streams from OpenAI                      │
│  /api/conversations  → list/create conversations                │
│  /api/messages       → list messages (history)                  │
└─────────────────────────────┬───────────────────────────────────┘
                              │  Prisma queries
┌─────────────────────────────▼───────────────────────────────────┐
│  SQLite (dev) / PostgreSQL (prod)                                │
│  Users, Sessions, Conversations, Messages                        │
└─────────────────────────────────────────────────────────────────┘
                              │  OpenAI SDK
┌─────────────────────────────▼───────────────────────────────────┐
│  OpenAI API (external)                                           │
│  gpt-4o — chat completions with streaming                        │
└─────────────────────────────────────────────────────────────────┘
```

---

## Scaffold the project

Run this once from the repo root to create the Next.js app:

```bash
npx create-next-app@latest app --typescript --tailwind --eslint --app --no-src-dir --import-alias "@/*"
cd app
npm install better-auth @prisma/client openai zod
npm install -D prisma
```

This gives you a standard Next.js 14 App Router scaffold with Tailwind and ESLint pre-configured.

---

## Build order (phases)

Work through these phases in order. Each phase is independently testable — don't skip ahead.

### Phase 1 — Skeleton: layout, routing, placeholder pages

**Files to create:**
```
app/
  layout.tsx          → root layout: html, body, providers
  page.tsx            → landing page with "Sign in" link
  (auth)/
    login/page.tsx    → login form (email + password)
    signup/page.tsx   → signup form
  chat/
    layout.tsx        → sidebar layout: conversation list + main content area
    page.tsx          → redirect to most recent conversation, or empty state
    [id]/page.tsx     → conversation page (placeholder)
```

**What to verify:** `npm run dev` starts; you can navigate between `/`, `/auth/login`, `/chat`.

---

### Phase 2 — Database: Prisma schema + migrations

**Copy** the `schema.prisma` from §06, then update the datasource for Next.js:
```prisma
datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")  // put DATABASE_URL="file:./dev.db" in .env
}
```

Run:
```bash
npx prisma migrate dev --name init
npx prisma generate
```

**What to verify:** `npx prisma studio` opens; User, Session, Conversation, Message tables exist.

---

### Phase 3 — Auth: sign up, log in, protected routes

Set up Better Auth:

```ts
// app/lib/auth.ts
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "./prisma";

export const auth = betterAuth({
  database: prismaAdapter(prisma, { provider: "sqlite" }),
  emailAndPassword: { enabled: true },
});
```

```ts
// app/api/auth/[...all]/route.ts
import { auth } from "@/lib/auth";
export const { GET, POST } = auth.handler;
```

Wire up the login and signup forms to call `authClient.signIn.email()` and `authClient.signUp.email()`.

Add a middleware to protect `/chat/*`:

```ts
// middleware.ts (root)
import { NextRequest, NextResponse } from "next/server";

export function middleware(req: NextRequest) {
  const sessionCookie = req.cookies.get("better-auth.session_token");
  if (!sessionCookie && req.nextUrl.pathname.startsWith("/chat")) {
    return NextResponse.redirect(new URL("/auth/login", req.url));
  }
  return NextResponse.next();
}

export const config = { matcher: ["/chat/:path*"] };
```

**What to verify:** sign up, log in, visit `/chat` (should redirect if not logged in), see your email displayed in the header.

---

### Phase 4 — Conversation history: CRUD + sidebar

**API routes to create:**

```ts
// app/api/conversations/route.ts
// GET → list the current user's conversations (newest first)
// POST → create a new conversation

// app/api/conversations/[id]/messages/route.ts
// GET → list messages in a conversation
// POST → create a new user message
```

**What to verify:** create a conversation, see it in the sidebar. Click it, see its messages.

---

### Phase 5 — OpenAI streaming

The key: stream the response token-by-token so the UI updates in real time.

```ts
// app/api/chat/route.ts
import { NextRequest } from "next/server";
import OpenAI from "openai";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const openai = new OpenAI();  // reads OPENAI_API_KEY from env

export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session) return new Response("Unauthorized", { status: 401 });

  const { messages, conversationId } = await req.json();

  // Create a streaming response using the Web Streams API.
  const stream = await openai.chat.completions.create({
    model: "gpt-4o",
    stream: true,
    messages,
  });

  // ReadableStream: streams the response token-by-token to the browser.
  // The client reads this as it arrives — no waiting for the full response.
  const readable = new ReadableStream({
    async start(controller) {
      let fullContent = "";
      for await (const chunk of stream) {
        const text = chunk.choices[0]?.delta?.content ?? "";
        fullContent += text;
        controller.enqueue(new TextEncoder().encode(text));
      }
      controller.close();

      // Persist the full response after streaming completes.
      await prisma.message.create({
        data: { role: "assistant", content: fullContent,
                userId: session.user.id, conversationId },
      });
    },
  });

  return new Response(readable, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
```

**Client-side: reading the stream**

```tsx
"use client";
// app/chat/[id]/page.tsx (client component for the input + streaming)

async function sendMessage(text: string) {
  // Persist user message immediately (optimistic update):
  setMessages(prev => [...prev, { role: "user", content: text }]);

  const res = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages: [...messages, { role: "user", content: text }], conversationId }),
  });

  // ReadableStream: read each chunk as it arrives.
  const reader = res.body!.getReader();
  const decoder = new TextDecoder();
  let assistantText = "";

  // Add an empty assistant bubble:
  setMessages(prev => [...prev, { role: "assistant", content: "" }]);

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    assistantText += decoder.decode(value);
    // Update the last message (the assistant bubble) with the accumulated text:
    setMessages(prev => {
      const next = [...prev];
      next[next.length - 1] = { role: "assistant", content: assistantText };
      return next;
    });
  }
}
```

**What to verify:** type a message, click Send, watch the assistant reply appear token-by-token.

---

### Phase 6 — Polish

- [ ] Loading states: spinner while waiting for first token
- [ ] Error handling: display a user-friendly message if the API call fails
- [ ] Scroll-to-bottom: the message list auto-scrolls as new tokens arrive
- [ ] New conversation button in the sidebar
- [ ] Conversation title: auto-generate from the first message (call the API with a short "summarise in 5 words" prompt)
- [ ] Log out button

---

## Key environment variables

Create a `.env` file in `10-project-chatbot/app/`:

```bash
# Database
DATABASE_URL="file:./dev.db"

# OpenAI — set on host, passed in via devcontainer.json remoteEnv
OPENAI_API_KEY="sk-..."

# Better Auth — generate once with: openssl rand -hex 32
BETTER_AUTH_SECRET="your-secret-here"
BETTER_AUTH_URL="http://localhost:3000"
```

**Never commit this file.** Add `.env` to `.gitignore`.

---

## Running the project

```bash
cd 10-project-chatbot/app
npm install
npx prisma migrate dev --name init
npm run dev
# → http://localhost:3000
```

---

## Stop condition

You're done with this section when:

- A signed-in user can send a message and receive a streaming response from the LLM.
- The conversation persists across page refreshes.
- You can explain every layer: what the client sends → what the API route does → what Prisma stores → how the stream comes back → how the client renders it.
