/*
  main.tsx is the ENTRY POINT for the React app.
  It mounts the root App component into the <div id="root"> in index.html.

  This is the only file that directly touches the DOM — after this line,
  React owns the #root div and manages all updates itself.

  Python analogy: if __name__ == "__main__": — the startup code that kicks
  everything off.
*/

import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";  // import global CSS — Tailwind directives live here

// ── Console legend ───────────────────────────────────────────────────────────
// Open the browser console (F12) and keep it visible while you click around.
// Every component logs as React runs it, so you can watch the loop from §03's
// README ("How React runs") happen live.
console.log("%c§03 Playground — open the console and watch React's loop", "font-weight:bold;font-size:13px");
console.log(
  [
    "  🔁 render   React called a component function — a re-render is just another call",
    "  🖱️ event    a handler ran and called a setState — this is what SCHEDULES a render",
    "  ✅ effect   a useEffect body ran (after the DOM was committed)",
    "  🧹 cleanup  a useEffect cleanup ran (before its next run, or on unmount)",
    "",
    "Heads-up: <React.StrictMode> (dev only, see main.tsx) intentionally DOUBLE-invokes",
    "renders and effect mount/cleanup to surface impure code — that's why you'll see",
    "things logged in pairs. It does not happen in a production build.",
  ].join("\n"),
);

// ReactDOM.createRoot: creates a React "root" attached to the DOM node.
// .render(): tells React to render <App /> and all its children into that root.
// React will re-render components in this root whenever their state changes.
ReactDOM.createRoot(document.getElementById("root")!).render(
  // StrictMode: a development-only wrapper that helps catch bugs.
  // It renders components twice in dev mode to detect side-effects.
  // Has no effect in production builds. No Python equivalent.
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
