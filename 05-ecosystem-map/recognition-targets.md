# Recognition Targets

Three concepts you'll encounter constantly in Next.js codebases. You don't need to implement them from scratch — you need to recognise them, explain what they do, and hold a coherent discussion about why a team would use them.

---

## 1. App Router vs Pages Router

Next.js has two routing systems. Both exist in the wild.

### Pages Router (the old way — Next.js 9–12, still maintained)

Files in `pages/` define routes. Each file exports a React component. Data fetching happens in special functions (`getServerSideProps`, `getStaticProps`) that run on the server before the component renders.

```
pages/
  index.tsx           → renders at /
  chat.tsx            → renders at /chat
  chat/[id].tsx       → renders at /chat/123  (dynamic segment)
  api/
    messages.ts       → API endpoint at /api/messages
```

```tsx
// pages/chat.tsx — Pages Router data fetching
export async function getServerSideProps() {
  const messages = await fetchMessages();  // runs on the SERVER
  return { props: { messages } };          // passed to the component as props
}

export default function ChatPage({ messages }) {
  return <MessageList messages={messages} />;
}
```

### App Router (the current way — Next.js 13+)

Files in `app/` define routes. `page.tsx` is the component; `layout.tsx` wraps it. Components are **React Server Components** by default (see next section). Client interactivity is added per-component with `"use client"`.

```
app/
  page.tsx            → renders at /
  layout.tsx          → wraps every page (nav, auth providers)
  chat/
    page.tsx          → renders at /chat
    [id]/
      page.tsx        → renders at /chat/123
  api/
    messages/
      route.ts        → API endpoint at /api/messages (using Request/Response)
```

```tsx
// app/chat/page.tsx — App Router data fetching
// No special function — just an async component.
export default async function ChatPage() {
  const messages = await fetchMessages();  // async in the component body
  return <MessageList messages={messages} />;
}
```

### When you'll see which

- New projects (post-2023): App Router.
- Existing projects migrating: mixed. Look for the presence of `pages/` vs `app/`.
- Both can coexist in one project during migration.

---

## 2. React Server Components (RSC)

**The problem:** in the old model, all React components ran in the browser. The browser had to download the component code, run it, fetch data, run it again. Heavy components (that import large libraries) bloat the bundle.

**The solution:** Server Components run only on the server and send pre-rendered HTML (or a serialised component tree) to the browser. Their code never ships to the client.

```
┌──────────────────────────────────────────────────────────┐
│  SERVER                                                   │
│  ┌─────────────────────────────────────────────────────┐ │
│  │  Server Component (async)                           │ │
│  │  - Can query the database directly                  │ │
│  │  - Can use secrets/API keys                         │ │
│  │  - Cannot use useState, useEffect, event handlers   │ │
│  │  - Never shipped to the browser                     │ │
│  └────────────────────────┬────────────────────────────┘ │
│                           │ serialised RSC payload        │
└───────────────────────────┼──────────────────────────────┘
                            ▼
┌──────────────────────────────────────────────────────────┐
│  BROWSER                                                  │
│  ┌─────────────────────────────────────────────────────┐ │
│  │  Client Component ("use client" directive)          │ │
│  │  - Can use useState, useEffect, event handlers      │ │
│  │  - Ships its code to the browser                    │ │
│  │  - Receives pre-rendered HTML as its initial output │ │
│  └─────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────┘
```

**In App Router:** components are Server Components by default. Add `"use client"` at the top of a file to make it a Client Component.

```tsx
// This is a Server Component — no directive needed.
// It can query the database directly. Its code never reaches the browser.
export default async function MessageList({ userId }: { userId: string }) {
  const messages = await prisma.message.findMany({ where: { userId } });
  return (
    <ul>
      {messages.map(msg => <li key={msg.id}>{msg.content}</li>)}
    </ul>
  );
}
```

```tsx
"use client";  // This directive makes it a Client Component.

import { useState } from "react";  // useState only works in Client Components

export function ChatInput({ onSend }: { onSend: (text: string) => void }) {
  const [draft, setDraft] = useState("");
  // ...
}
```

**The mental model:** push data fetching up into Server Components; push interactivity (hooks, event handlers) down into Client Components. Keep Client Components as leaf nodes (bottom of the tree) to minimise the client bundle.

**Python analogy:** like rendering HTML on the server in Django/Flask, but with the ability to selectively hydrate interactive islands on the client. Server Components are the server-rendered part; Client Components are the interactive islands.

---

## 3. TanStack Query (formerly React Query)

**The problem:** managing async server state in the browser is complicated:
- Fetching on mount (useEffect + useState boilerplate)
- Caching (don't re-fetch what you just fetched)
- Background refetching (keep data fresh)
- Deduplicating identical requests
- Loading, error, and stale states

**What TanStack Query does:** a library that manages all of this for you. You declare *what* to fetch; TQ handles *when* and *how*.

```tsx
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

function MessageList({ userId }: { userId: string }) {
  // useQuery: fetches + caches + refetches automatically.
  // The queryKey identifies this piece of data — if another component requests
  // the same key, TQ returns the cached result instead of re-fetching.
  const { data, isLoading, error } = useQuery({
    queryKey: ["messages", userId],
    queryFn: () => fetch(`/api/messages?userId=${userId}`).then(r => r.json()),
  });

  if (isLoading) return <p>Loading…</p>;
  if (error) return <p>Error</p>;

  return <ul>{data.map(msg => <li key={msg.id}>{msg.content}</li>)}</ul>;
}

function SendMessageForm({ userId }: { userId: string }) {
  const queryClient = useQueryClient();

  // useMutation: wraps a write operation. On success, it can invalidate
  // the "messages" cache to trigger a background refetch.
  const mutation = useMutation({
    mutationFn: (content: string) =>
      fetch("/api/messages", { method: "POST", body: JSON.stringify({ userId, content }) }),
    onSuccess: () => {
      // Invalidate the messages cache — TQ will refetch automatically.
      queryClient.invalidateQueries({ queryKey: ["messages", userId] });
    },
  });

  // ...
}
```

**Why teams choose it:** eliminates the `useEffect + useState + loading + error` boilerplate for every data-fetching scenario. Handles cache invalidation automatically. Works with any async function (REST, GraphQL, tRPC).

**Alternative:** SWR (from Vercel, simpler API, less features), RTK Query (if already using Redux), or hand-rolled useEffect (fine for simple cases, tedious at scale).

**Python analogy:** no direct equivalent. The closest concept is a combination of a request cache + background task scheduler + state management library.

**Note on App Router:** if you're using Next.js App Router with Server Components, you often don't need TanStack Query for initial data fetching — the server component fetches directly. TQ is most valuable for client-side data that changes frequently (chat messages, notifications) or for purely client-side React apps (Vite).
