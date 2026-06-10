/*
  useContext solves PROP DRILLING: passing data through many layers of
  components that don't use it themselves, just to get it to a deep child.

  The pattern has two parts:
    1. PROVIDE — wrap a subtree with a Context.Provider and pass a value
    2. CONSUME — any component in that subtree calls useContext to read the value

  Python analogy: a global/module-level variable or a dependency-injection
  container — any function in scope can read it without it being passed explicitly.
  But unlike a global, Context is scoped to a component subtree.

  When to use Context vs prop drilling:
    - 1–2 levels deep: just use props. Context adds boilerplate.
    - Many levels, read-mostly data (theme, current user, locale): use Context.
    - Frequently-updating values (every keystroke): avoid Context — every consumer
      re-renders when the value changes. Use a state manager or pass callbacks.
*/

import React, { createContext, useContext, useState } from "react";

// === CREATING A CONTEXT =======================================================
// createContext<T>(defaultValue) creates a context object.
// The default value is only used if there's no Provider above in the tree.
// In real apps, the default is usually null and you throw if it's missing.

type Theme = "light" | "dark";

interface ThemeContextValue {
  theme: Theme;
  toggleTheme: () => void;
}

// The angle-bracket type parameter tells TS what shape the context value has.
const ThemeContext = createContext<ThemeContextValue | null>(null);

// === PROVIDER COMPONENT =======================================================
// The Provider wraps the part of the tree that needs access to the context value.
// Usually placed high in the tree (App.tsx) so everything beneath can read it.

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>("light");

  function toggleTheme() {
    setTheme(prev => (prev === "light" ? "dark" : "light"));
  }

  // The `value` prop is what useContext returns in any child.
  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

// === CUSTOM HOOK: CONSUMING THE CONTEXT =======================================
// Wrapping useContext in a custom hook achieves two things:
//   1. Gives a clear name: useTheme() vs useContext(ThemeContext)
//   2. Handles the null guard in one place — every consumer gets the safety check

function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    // This is a programming error: useTheme called outside a ThemeProvider.
    // Throw at dev time so it's caught immediately.
    throw new Error("useTheme must be used inside ThemeProvider");
  }
  return ctx;
}

// === CONSUMING THE CONTEXT ====================================================
// Any component in the tree (at any depth) can call useTheme().
// No need to thread the theme down as a prop through every intermediate component.

function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  return (
    <button onClick={toggleTheme}>
      Current theme: {theme} — click to toggle
    </button>
  );
}

function MessageBubble({ content }: { content: string }) {
  const { theme } = useTheme();
  // Reads theme directly — its parent doesn't need to pass theme as a prop.
  const bg = theme === "light" ? "#e5e7eb" : "#374151";
  const color = theme === "light" ? "#111827" : "#f9fafb";
  return (
    <div style={{ background: bg, color, padding: "10px 14px", borderRadius: "12px" }}>
      {content}
    </div>
  );
}

// === PUTTING IT TOGETHER ======================================================
// The Provider wraps both children. Neither ThemeToggle nor MessageBubble
// receives `theme` as a prop — they read it from Context.

export function ThemeDemo() {
  return (
    <ThemeProvider>
      <ThemeToggle />
      <MessageBubble content="Hello — my style adapts to the current theme!" />
    </ThemeProvider>
  );
}

export { useTheme };
