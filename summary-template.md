# Active Recall Summary Template

Fill this in from memory, without looking at the sections. One sitting after you've completed all sections. This is the consolidation step — writing forces retrieval, and retrieval strengthens memory more than re-reading.

The goal is not perfect recall. It's to identify what stuck and what needs one more pass.

---

## §01 — The Browser, HTML & CSS

*In your own words, no notes:*

**What are HTML, CSS, and JavaScript each responsible for?**

&nbsp;

**What is the DOM? What does "mutating the DOM" mean?**

&nbsp;

**What is the box model? Name the four layers from inside out.**

&nbsp;

**What does `display: flex` do to an element's children?**

&nbsp;

---

## §02 — TypeScript

*In your own words, no notes:*

**What does TypeScript add to JavaScript? What happens to the types at runtime?**

&nbsp;

**What is the difference between `interface` and `type`? When do you use each?**

&nbsp;

**What is structural typing? How is it different from nominal typing?**

&nbsp;

**What does a generic `<T>` do? Give the Python equivalent.**

&nbsp;

**Name three utility types and explain each in one sentence.**

&nbsp;

---

## §03 — React Fundamentals

*In your own words, no notes:*

**What is a React component?**

&nbsp;

**What is JSX? What does it compile to?**

&nbsp;

**What are props? Which direction do they flow?**

&nbsp;

**What is `useState`? What triggers a re-render?**

&nbsp;

**What is `useEffect`? What does the dependency array control?**

&nbsp;

**Why do list items need a `key` prop? What happens without one?**

&nbsp;

---

## §04 — React Hooks & Patterns

*In your own words, no notes:*

**What problem does `useContext` solve? What's the alternative it avoids?**

&nbsp;

**When would you choose `useReducer` over `useState`?**

&nbsp;

**What is a custom hook? What are the rules around hooks?**

&nbsp;

**What is a "controlled input"? What makes it different from uncontrolled?**

&nbsp;

**Draw the four phases of an async data-fetching state machine.**

&nbsp;

---

## §05 — Ecosystem Map

*In your own words, no notes:*

**What does Vite do? What's the Python development equivalent?**

&nbsp;

**What does Tailwind do? What's the alternative philosophy?**

&nbsp;

**What does Zod add that TypeScript alone can't provide?**

&nbsp;

**What does Prisma do? Name the Python equivalent.**

&nbsp;

**What's the difference between App Router and Pages Router?**

&nbsp;

**What is a React Server Component? What can't it do?**

&nbsp;

---

## §06 — Backend: Node + Express + Prisma

*In your own words, no notes:*

**What is middleware in Express? Draw the pipeline for one request.**

&nbsp;

**What does `next()` do in a middleware function? What happens if you don't call it?**

&nbsp;

**Write the Prisma query to find all messages for a given userId, sorted oldest-first.**

&nbsp;

**What is a Prisma schema? What do you run after changing it?**

&nbsp;

**Narrate the full lifecycle: user clicks Send → message appears on screen.**

&nbsp;

---

## §07 — Auth

*In your own words, no notes:*

**What is a session? Where is it stored?**

&nbsp;

**What does the `HttpOnly` cookie flag do? Why is it critical?**

&nbsp;

**Walk through the login flow: form submit → cookie set.**

&nbsp;

**Walk through a protected route request: cookie → middleware → response.**

&nbsp;

**Name one thing Better Auth handles that our hand-rolled implementation doesn't.**

&nbsp;

---

## §08 — Testing

*In your own words, no notes:*

**What is the arrange/act/assert pattern? Give a one-sentence description of each.**

&nbsp;

**What does `vi.fn()` do? Why would you mock a function in a test?**

&nbsp;

**What is React Testing Library's philosophy? What query type is preferred and why?**

&nbsp;

**What is `jsdom` and why does Vitest need it for component tests?**

&nbsp;

---

## §09 — Real Repo Read

*In your own words, no notes:*

**For the chosen repo: what are the top-level routes?**

&nbsp;

**Where does data fetching happen — Server Components, hooks, or API routes?**

&nbsp;

**How is auth implemented? What does the protected-route check look like?**

&nbsp;

---

## §10 — Project Chatbot

*In your own words, no notes:*

**Describe the full message-send flow, layer by layer.**

&nbsp;

**What is a `ReadableStream`? How does the client consume it token-by-token?**

&nbsp;

**What environment variables does the project need and why?**

&nbsp;

**If you had to add a "rate limit: max 20 messages per day per user" feature, where would you implement it?**

&nbsp;

---

## Things I'd look up before building anything

*List anything that came up blank above. These are your next-pass targets.*

&nbsp;
