/*
  A from-scratch mini-React in ~70 lines — no dependencies, no magic.

  Every other file in notes/ uses real React and explains one piece of its API.
  This one goes underneath the API: it rebuilds the engine itself so you can see
  what React is actually doing when it "renders" a component. Read it top to
  bottom, then run it and read the printed output next to the code.

  Run it:  npm run 03:model      (from the repo root)
      or:  npx tsx 03-react-fundamentals/notes/mental-model.ts

  Python analogy: like writing a 50-line toy autograd to demystify backprop
  before trusting torch.autograd — same move, applied to React.
*/

// === Elements are data ========================================================
// JSX like  <p>Count: {count}</p>  is not HTML and not a draw command. The
// compiler rewrites it into a createElement(...) call that returns a plain
// object. The jargon for that object is an "element": a description of what
// should be on screen, not the thing itself. Here is the whole definition:

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
// Run it: no DOM, no browser, no React — just an object you could have typed
// yourself. The thing to keep: a piece of JSX is a value, not an action.

// === A component is a function ================================================
// A component takes props and returns one of those description objects. It does
// not draw, mount, or change anything. You define it here; something else calls
// it later (see the next block).

function Counter(props: { count: number }): VNode {
  return createElement(
    "div",
    null,
    createElement("p", null, "Count: ", props.count),
    createElement("button", { onClick: "increment" }, "+"),
  );
}

// === Who calls the component, and the two phases of a render ==================
// The `render` function below is standing in for React. Two things to notice.
// First: YOU never call Counter() — `render` does, when it meets a component in
// the tree. (React calling your functions, rather than you calling React, is
// what people mean by "inversion of control".) Second: it works in two passes —
// walk the description, then turn it into output. React's names for those two
// passes are "render" (build the description) and "commit" (apply it to the
// DOM). Here we apply it to an HTML string instead, but it's the same shape.

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

// === A re-render is just another call =========================================
// This is the part that fights an imperative instinct, so go slow. Updating
// state does not change a variable in place. It asks the engine to CALL THE
// COMPONENT AGAIN — a fresh call, with fresh locals.
//
// Note what you'd actually write in real React: never `Counter(...)`, but
// <Counter count={0}/>, which is just data — createElement(Counter, {count:0})
// = { type: Counter, props: {count:0} }. React reads that object and makes the
// call. The two lines below are us playing React by hand so you can watch two
// renders happen as two genuinely separate calls.

const frame0 = Counter({ count: 0 }); // render #0 — React would make this call
const frame1 = Counter({ count: 1 }); // render #1 — a brand-new call, new locals

console.log("\n── two renders are two separate function calls ───────────────");
console.log("render #0:", render(frame0));
console.log("render #1:", render(frame1));
// `count` was never reassigned. Render #0 read 0, render #1 read 1. The screen
// is a slideshow of frames, not a document you edit in place.

// === Diffing the frames (why re-running everything is cheap) ==================
// Re-running the whole component sounds wasteful. It isn't, because the engine
// compares the previous description with the new one and keeps only the
// difference — the jargon is "reconciliation". Only that difference reaches the
// real DOM. Here is a toy version over the two frames above:

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
