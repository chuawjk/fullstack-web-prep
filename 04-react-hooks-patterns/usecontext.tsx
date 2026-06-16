/*
  useContext — reading a value from an ancestor without threading it through props.

  PROBLEM
  -------
  You have a theme (light/dark) that several deeply nested components need: the
  toggle button, the message bubbles, the sidebar icons. Threading `theme` down
  through every intermediate component as a prop means components that don't USE
  the theme still have to accept and forward it. As the tree deepens this becomes
  brittle — add a new component layer and every component between the provider and
  the consumer suddenly needs a new prop.

  CONCEPT
  -------
  createContext creates a named channel outside the component tree. A Provider
  component writes the current value into that channel for its entire subtree. Any
  descendant — no matter how deep — calls useContext to read it directly, with no
  props involved. The value is scoped to the Provider's subtree, not the whole app.

  KEY INSIGHT
  -----------
  Context is not a global variable — it's a global for one subtree. A component
  outside the Provider reads the default value (usually null), not the provided
  one. This boundary is made explicit by the null guard in the named hook below.

  IN THIS FILE (four steps)
  ------------
  • Step 1: createContext — define the channel and its type
  • Step 2: ThemeProvider — own the state and write to the channel
  • Step 3: useTheme      — wrap useContext in a named hook with a null guard
  • Step 4: ThemeToggle + MessageBubble — two unrelated consumers reading the same slot

  WHEN TO REACH FOR IT
  --------------------
  Read-mostly data needed many levels deep: theme, current user, locale → yes.
  1–2 levels deep → just pass props; Context is pure boilerplate here.
  A value that changes every keystroke → avoid: EVERY consumer re-renders when the
  context value changes. Use local state or a dedicated store instead.

  PYTHON ANALOGY
  --------------
  Python's contextvars.ContextVar — scoped to a call stack, not a module global.
  Or Flask's `g` object for request-scoped data.
*/

import React, { createContext, useContext, useState } from "react";

// ── Step 1: create the context (DEFINITION) ───────────────────────────────────
// PURPOSE: establishes the channel and its TypeScript type. The default (null)
// is only used when a consumer has NO Provider above it — the null guard in
// useTheme() below catches that case and turns it into a loud error.

type Theme = "light" | "dark";

interface ThemeContextValue {
  theme: Theme;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

// ── Step 2: provide a value (DEFINITION) ──────────────────────────────────────
// PURPOSE: ThemeProvider owns the actual state and writes it into the channel via
// `value`. `children` is whatever JSX gets nested inside it at the call site —
// React fills that parameter in automatically (same prop you saw with <Card> in §03).
//
// This component renders nothing of its own — it wraps `children` and exposes
// the context value to them. It's plumbing, not visual.

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>("light");

  function toggleTheme() {
    // React supplies `prev` — the current slot value at the moment React runs
    // this updater. (Same functional updater form as §03; safe with batched updates.)
    setTheme((prev) => (prev === "light" ? "dark" : "light"));
  }

  // FOOTGUN: this object literal is rebuilt on every ThemeProvider render, so
  // `value` is a new reference each time — which re-renders every consumer even
  // if theme didn't change. Fine here (toggles are rare). For a hot-path value
  // you'd useMemo the object. Worth knowing; not worth fixing in this example.
  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

// ── Step 3: wrap in a named hook (DEFINITION) ─────────────────────────────────
// PURPOSE: two reasons to wrap useContext in useTheme:
//   1. A real name at the call site: useTheme() reads better than useContext(ThemeContext)
//   2. The null guard lives in ONE place — every consumer gets the safety check
// The guard turns a silent "undefined is not an object" deep in render into a
// loud, accurate error at the boundary.

function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    // Only reached when useTheme() is called OUTSIDE a ThemeProvider — a wiring
    // bug, not a runtime condition. Throw so it surfaces immediately in dev.
    throw new Error("useTheme must be used inside ThemeProvider");
  }
  return ctx;
}

// ── Step 4: two unrelated consumers (DEFINITIONS) ─────────────────────────────
// PURPOSE: both components read the theme via useTheme() at any depth. Neither
// takes `theme` as a prop — that's the whole point. The value comes from the
// Provider's slot, not from the parent's call site.

function ThemeToggle() {
  // CALL SITE — reads the ancestor's slot. Renders: a button whose label shows
  // the current theme; clicking it calls toggleTheme, which flips the Provider's
  // state, which re-renders every consumer (this button AND the bubble below).
  const { theme, toggleTheme } = useTheme();
  return (
    <button onClick={toggleTheme}>
      Current theme: {theme} — click to toggle
    </button>
  );
}

function MessageBubble({ content }: { content: string }) {
  // CALL SITE — same slot, different consumer. Renders: a rounded chat bubble
  // whose colours are derived from `theme`. It needs the theme but is nowhere
  // near the Provider in the tree — the case Context exists for.
  const { theme } = useTheme();
  const bg = theme === "light" ? "#e5e7eb" : "#374151";
  const color = theme === "light" ? "#111827" : "#f9fafb";
  return (
    <div style={{ background: bg, color, padding: "10px 14px", borderRadius: "12px" }}>
      {content}
    </div>
  );
}

// ── Putting it together (CALL SITES) ──────────────────────────────────────────
// PURPOSE: ThemeProvider wraps both ThemeToggle and MessageBubble, so both are
// inside its subtree and both useTheme() calls resolve to its value. One click
// restyles both at once. Move either child OUTSIDE the Provider and its
// useTheme() would hit the null default and throw — the boundary, made visible.

export function ThemeDemo() {
  return (
    <ThemeProvider>
      <ThemeToggle />
      <MessageBubble content="Hello — my style adapts to the current theme!" />
    </ThemeProvider>
  );
}

export { useTheme };
