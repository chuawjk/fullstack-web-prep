/*
  App.tsx is the ROOT COMPONENT — everything renders inside it.
  It holds the "which demo is selected" state and renders the active demo.

  This is the toggleable concept playground. Click the tab buttons to switch
  between demonstrations of each React fundamental.
*/

import React, { useState } from "react";
import { ChatDemo } from "./components/ChatDemo";
import { ListDemo } from "./components/ListDemo";
import { EffectDemo } from "./components/EffectDemo";
import { ConditionalDemo } from "./components/ConditionalDemo";

// A literal union of the available demo names — TypeScript will catch typos.
type Demo = "chat" | "list" | "effect" | "conditional";

// Each tab has a key (the Demo value) and a display label.
const DEMOS: { key: Demo; label: string }[] = [
  { key: "chat", label: "State + Props (Chat)" },
  { key: "list", label: "Lists + Keys" },
  { key: "effect", label: "useEffect" },
  { key: "conditional", label: "Conditional Render" },
];

export default function App() {
  // useState: tracks which demo tab is currently selected.
  // When setActiveDemo is called, React re-renders App and all its children.
  const [activeDemo, setActiveDemo] = useState<Demo>("chat");

  // Watch the console: App re-renders only when activeDemo changes (clicking a
  // tab). Typing inside a demo re-renders the demo, not App.
  console.log("🔁 render App — activeDemo:", activeDemo);

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-gray-900 text-white px-6 py-4">
        <h1 className="text-xl font-semibold">
          §03 React Fundamentals Playground
        </h1>
        <p className="text-gray-400 text-sm mt-1">
          Click a tab to switch between demos. Edit the code and watch the
          browser update.
        </p>
      </header>

      {/* Tab navigation */}
      <nav className="bg-white border-b border-gray-200 px-6 flex gap-2 pt-2">
        {DEMOS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => {
              // Switching tabs swaps which demo is rendered. The old demo
              // UNMOUNTS (its effect cleanups run) and the new one MOUNTS —
              // watch the 🧹 cleanup / ✅ effect logs when you leave the
              // useEffect tab mid-timer.
              console.log(
                "🖱️ event switch tab →",
                key,
                "(old demo unmounts, new mounts)",
              );
              setActiveDemo(key);
            }}
            className={`px-4 py-2 text-sm font-medium rounded-t-md transition-colors ${
              activeDemo === key
                ? "bg-blue-600 text-white" // active tab
                : "text-gray-600 hover:bg-gray-100" // inactive tab
            }`}
          >
            {label}
          </button>
        ))}
      </nav>

      {/* Active demo */}
      <main className="p-6 max-w-2xl mx-auto">
        {/* Conditional rendering: match activeDemo to the right component.
            Each case returns a different component — switching tabs unmounts
            the old demo and mounts the new one. */}
        {activeDemo === "chat" && <ChatDemo />}
        {activeDemo === "list" && <ListDemo />}
        {activeDemo === "effect" && <EffectDemo />}
        {activeDemo === "conditional" && <ConditionalDemo />}
      </main>
    </div>
  );
}
