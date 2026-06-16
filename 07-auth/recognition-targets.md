# Auth Recognition Targets

These are the auth libraries you'll encounter in real Next.js/TypeScript codebases. You should be able to read their code, understand what they handle, and explain why a team might use them — without needing to implement from scratch.

None of these change the README's boundary — the server still keeps the truth and the browser still holds a token. They just implement *more* of the surface around it (OAuth, email verification, CSRF, rotation) than you'd want to hand-roll. Because you built the core yourself, you can now read their session code and know exactly what each piece is doing.

---

## Better Auth

**What it is:** a TypeScript-native, self-hosted auth library released in 2024. The current recommended choice for new full-stack TypeScript apps that want more than hand-rolled sessions but don't want to lock into a hosted auth service.

**What it abstracts:**
- Session management (same as our hand-rolled version, but with more edge-case handling)
- Email/password sign-up + sign-in
- Social OAuth (GitHub, Google, etc.) with one configuration line
- Email verification + password reset flows
- CSRF protection
- TypeScript types for everything — `auth.api.signIn()` is fully typed

**What the API looks like:**

```ts
// auth.ts — server-side configuration
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "./lib/prisma";

export const auth = betterAuth({
  database: prismaAdapter(prisma, { provider: "sqlite" }),
  emailAndPassword: { enabled: true },
  socialProviders: {
    github: {
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    },
  },
});

// In your Next.js App Router API route:
// app/api/auth/[...all]/route.ts
export const { GET, POST } = auth.handler;
```

```tsx
// In a client component — the Better Auth React client:
import { authClient } from "@/lib/auth-client";

const { data: session } = authClient.useSession();
// data.user has your user object, fully typed

await authClient.signIn.email({ email, password });
await authClient.signOut();
```

**What you give up:** you're responsible for running and backing up the database. No hosted dashboard. Works best when you already have a database.

**When teams choose it:** new TypeScript apps that want full control over the DB and user data, without writing session code from scratch.

---

## Auth.js / NextAuth v5

**What it is:** the most widely-used auth library for Next.js. Version 5 (the current stable release) works with both App Router and Pages Router. Also works outside Next.js (Node, SvelteKit, etc.).

**What it abstracts:** everything Better Auth does, plus a highly opinionated adapter model that makes database integration a few configuration lines.

**What the API looks like:**

```ts
// auth.ts — centralized configuration
import NextAuth from "next-auth";
import GitHub from "next-auth/providers/github";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "./lib/prisma";

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [
    GitHub,
    Credentials({
      async authorize(credentials) {
        // Your custom email/password logic here
        const user = await verifyCredentials(credentials);
        return user ?? null;
      }
    })
  ],
  callbacks: {
    session({ session, token }) {
      // Add custom fields to the session (e.g. user.role)
      session.user.id = token.sub!;
      return session;
    },
  },
});

// app/api/auth/[...nextauth]/route.ts
export const { GET, POST } = handlers;
```

```tsx
// In a Server Component (App Router):
import { auth } from "@/auth";

export default async function ProtectedPage() {
  const session = await auth();  // reads the session server-side
  if (!session) redirect("/login");
  return <p>Hello, {session.user.name}</p>;
}
```

**What you give up:** Auth.js has opinions about your database schema — the adapter expects specific table/column names (Account, Session, VerificationToken). If your schema differs, expect friction.

**When teams choose it:** Next.js apps that want OAuth (GitHub, Google, etc.) working quickly, or an established, well-documented solution.

---

## Comparison

| | Hand-rolled (§07) | Better Auth | Auth.js |
|---|---|---|---|
| Learning value | Highest | Medium | Low |
| Lines of auth code you write | ~200 | ~20 | ~15 |
| Fully typed | By hand | Yes | Yes |
| OAuth providers | Must implement | Config line | Config line |
| Email verification | Must implement | Built-in | Built-in |
| DB schema control | Full | Full | Constrained |
| Maturity | N/A | 2024 | 2020+ |

---

## What these libraries abstract that our implementation doesn't

1. **CSRF protection** — both libraries handle CSRF tokens automatically.
2. **Email verification flow** — sending verification emails, storing verification tokens, expiring them.
3. **OAuth 2.0 / OIDC** — the full redirect flow: authorization code exchange, token refresh, user info fetch.
4. **Password reset flow** — sending reset emails, validating reset tokens.
5. **Rate limiting hooks** — pluggable points for adding brute-force protection.
6. **Session rotation** — automatically issuing a new session token on privilege changes.
7. **Multi-tenancy / org support** — Better Auth has built-in organisation and role models.

Understanding what our hand-rolled implementation does makes all of these recognisable and debuggable in the library code. If the library's session validation fails, you'll know exactly where to look.
