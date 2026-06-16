/*
  A from-scratch mini-React in ~70 lines — no dependencies, no magic.

  PROBLEM
  -------
  Reading the React API cold ("useState stores a value", "useEffect runs after
  render") leaves you with a list of rules without a mental model. When something
  breaks — a value resets unexpectedly, an effect fires too often, a closure reads
  stale data — you can't reason from first principles. You need to see the engine.

  CONCEPT
  -------
  Every other file in notes/ uses real React and explains one piece of its API.
  This one goes underneath the API: it rebuilds the engine itself so you can see
  what React is actually doing when it "renders" a component. Three ideas land here
  that the rest of §03 assumes: JSX is data, components are functions React calls,
  and a re-render is a fresh call with fresh locals.

  KEY INSIGHT
  -----------
  A "render" is just another function call with new arguments. React stores state
  outside the function; on each call it hands that state back in. The screen is a
  slideshow of frames, not a document you edit in place.

  IN THIS FILE
  ------------
  • createElement — what JSX compiles to (a plain object)
  • render()      — walks the tree, calls component functions, emits output
  • Two render frames — shows that re-renders are two separate calls
  • diff()        — shows why re-running everything is cheap (only the delta touches the DOM)

  PYTHON ANALOGY
  --------------
  Like writing a 50-line toy autograd to demystify backprop before trusting
  torch.autograd — same move, applied to React.

  Run: npm run 03:model
    or: npx tsx 03-react-fundamentals/notes/mental-model.ts
*/

// ── Elements are data ─────────────────────────────────────────────────────────
// PURPOSE: establishes that JSX is not HTML and not a draw command — it's a
// plain data object. Once you can see that, the rest of React is less magic.

type VNode = {
  type: string | Function; // "div" (a host tag) OR a component function
  props: { children: any[]; [key: string]: any };
};

// This is what every piece of JSX compiles into — the entire trick.
function createElement(
  type: string | Function,
  props: object | null,
  ...children: any[]
): VNode {
  return { type, props: { ...props, children } };
}

// Build a tree the way the compiler would, written out by hand so nothing is
// hidden. `<div><p>Count: {0}</p><button>+</button></div>` becomes:
const tree = createElement(
  "div",
  null,
  createElement("p", null, "Count: ", 0),
  createElement("button", { onClick: "(a function)" }, "+"),
);

console.log("── an element is just data ───────────────────────────────────");
console.log(JSON.stringify(tree, null, 2));
// No DOM, no browser, no React — just an object you could have typed yourself.
// The thing to keep: a piece of JSX is a value, not an action.

// ── A component is a function ─────────────────────────────────────────────────
// PURPOSE: shows that a component is literally a function that takes props and
// returns a description. No drawing, no mounting — just a return value.

function Counter(props: { count: number }): VNode {
  return createElement(
    "div",
    null,
    createElement("p", null, "Count: ", props.count),
    createElement("button", { onClick: "increment" }, "+"),
  );
}

// ── The engine: who calls the component ──────────────────────────────────────
// PURPOSE: shows inversion of control — YOU never call Counter(), the engine
// does. Also shows the two passes: describe (build the tree) → apply (emit output).
// React's names: "render" (build) and "commit" (apply to DOM).

function render(node: any): string {
  // A leaf — string or number — renders to itself.
  if (typeof node === "string" || typeof node === "number") return String(node);

  // A component: call it with its props, then render what it returned.
  // This is the call you never write yourself in a real app.
  if (typeof node.type === "function") {
    return render(node.type(node.props));
  }

  // A host element ("div", "p", …): render the children, wrap in a tag.
  const children = (node.props.children ?? []).map(render).join("");
  return `<${node.type}>${children}</${node.type}>`;
}

console.log("\n── the engine calls your component, then emits output ────────");
console.log(render(createElement(Counter, { count: 0 })));

// ── A re-render is just another call ─────────────────────────────────────────
// PURPOSE: the most important thing to internalise. Updating state does not
// change a variable in place — it asks the engine to call the component again.
// Each call gets fresh locals; count is a const, not a mutable variable.

const frame0 = Counter({ count: 0 }); // render #0 — React would make this call
const frame1 = Counter({ count: 1 }); // render #1 — a brand-new call, new locals

console.log("\n── two renders are two separate function calls ───────────────");
console.log("render #0:", render(frame0));
console.log("render #1:", render(frame1));
// `count` was never reassigned. Render #0 read 0; render #1 read 1. The screen
// is a slideshow of frames, not a document you edit in place.

// ── Diffing the frames ────────────────────────────────────────────────────────
// PURPOSE: shows why re-running everything is cheap — the engine compares the
// previous description to the new one and applies only the delta to the DOM.
// "Reconciliation" in React's vocabulary; only the changed text node gets updated.

function diff(a: any, b: any, path = "root"): void {
  if (typeof a !== typeof b) {
    console.log(`  ${path}: type changed (${typeof a} -> ${typeof b})`);
    return;
  }
  if (typeof a !== "object") {
    if (a !== b) console.log(`  ${path}: "${a}" -> "${b}"   ← the only change`);
    return;
  }
  const childrenA = a.props.children ?? [];
  const childrenB = b.props.children ?? [];
  childrenA.forEach((child: any, i: number) =>
    diff(child, childrenB[i], `${path} > ${a.type}[${i}]`),
  );
}

console.log("\n── the difference between render #0 and render #1 ────────────");
diff(frame0, frame1);
// Exactly one text node differs. React sets that one text node to "1" and
// leaves the <div>, <p>, <button>, and event listeners alone. That is why
// re-running the whole component on every change stays cheap.

console.log("\n──────────────────────────────────────────────────────────────");
console.log("That's the whole engine. Real React adds: state that persists");
console.log(
  "across calls (useState), real DOM instead of strings, and effects",
);
console.log("for reaching the outside world. This core loop never changes.");
