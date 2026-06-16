import React, { useState } from "react";
import { ThemeDemo } from "../../usecontext";
import { ChatWithReducer } from "../../usereducer";
import { ChatUI } from "../../custom-hook";
import { EmailInput, MessageComposer, LivePreview } from "../../controlled-inputs";
import { MessageHistory } from "../../loading-error-states";

type Demo = "context" | "reducer" | "custom-hook" | "inputs" | "async";

const DEMOS: { key: Demo; label: string }[] = [
  { key: "context",     label: "useContext" },
  { key: "reducer",     label: "useReducer" },
  { key: "custom-hook", label: "Custom Hook" },
  { key: "inputs",      label: "Controlled Inputs" },
  { key: "async",       label: "Async State" },
];

// Thin wrapper so the re-fetch button lives in the playground, not the notes file.
function AsyncDemo() {
  const [fetchKey, setFetchKey] = useState(0);
  return (
    <div className="space-y-3">
      <p className="text-sm text-gray-500">
        The simulated API fails ~30% of the time — click Re-fetch to run it again.
      </p>
      <button
        onClick={() => setFetchKey((k) => k + 1)}
        className="bg-blue-600 text-white px-3 py-1.5 rounded-lg text-sm hover:bg-blue-700"
      >
        Re-fetch
      </button>
      {/* Changing fetchKey changes the userId prop, which changes the effect dep,
          which triggers a re-fetch — same mechanism as a real userId change. */}
      <MessageHistory userId={`user-${fetchKey}`} />
    </div>
  );
}

export default function App() {
  const [activeDemo, setActiveDemo] = useState<Demo>("context");

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-gray-900 text-white px-6 py-4">
        <h1 className="text-xl font-semibold">§04 React Hooks &amp; Patterns Playground</h1>
        <p className="text-gray-400 text-sm mt-1">
          Click a tab to switch between demos. Edit the notes files and watch the browser update.
        </p>
      </header>

      <nav className="bg-white border-b border-gray-200 px-6 flex gap-2 pt-2">
        {DEMOS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setActiveDemo(key)}
            className={`px-4 py-2 text-sm font-medium rounded-t-md transition-colors ${
              activeDemo === key
                ? "bg-blue-600 text-white"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            {label}
          </button>
        ))}
      </nav>

      <main className="p-6 max-w-2xl mx-auto">
        {activeDemo === "context" && <ThemeDemo />}
        {activeDemo === "reducer" && <ChatWithReducer />}
        {activeDemo === "custom-hook" && <ChatUI conversationId="demo" />}
        {activeDemo === "inputs" && (
          <div className="space-y-8">
            <section>
              <h2 className="font-semibold text-gray-700 mb-2">Email validation</h2>
              <EmailInput />
            </section>
            <section>
              <h2 className="font-semibold text-gray-700 mb-2">Multi-field form</h2>
              <MessageComposer />
            </section>
            <section>
              <h2 className="font-semibold text-gray-700 mb-2">Live preview</h2>
              <LivePreview />
            </section>
          </div>
        )}
        {activeDemo === "async" && <AsyncDemo />}
      </main>
    </div>
  );
}
