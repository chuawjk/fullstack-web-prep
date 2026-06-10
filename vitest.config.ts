// Vitest configuration file.
// Vitest reads this to know how to run the tests — similar to pytest.ini or pyproject.toml.

import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [
    react(),  // needed to transform JSX in component test files (.tsx)
  ],
  test: {
    // environment: the DOM environment for React component tests.
    // "jsdom" = a Node.js implementation of browser APIs (document, window, etc.)
    // Python: there's no equivalent — Python doesn't have a DOM to simulate.
    environment: "jsdom",

    // globals: true = you can use describe/it/expect/vi without importing them.
    // Like pytest's built-in fixtures — they're just available.
    globals: true,

    // setupFiles: run before each test file.
    // Used to import @testing-library/jest-dom which adds custom matchers
    // (toBeInTheDocument, toBeDisabled, etc.)
    setupFiles: ["./08-testing/vitest.setup.ts"],

    // include: which files to treat as tests.
    include: ["08-testing/**/*.test.{ts,tsx}"],
  },
});
