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
