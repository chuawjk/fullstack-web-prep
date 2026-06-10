// Vite configuration file.
// Vite is the dev server + bundler. It serves the app in development (with hot
// module reload) and bundles it into static files for production.
// Python analogy: like uvicorn --reload for the backend, but for the frontend.

import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [
    react(),  // enables JSX transform and React Fast Refresh (hot reload for React)
  ],
  server: {
    port: 5173,  // the port the dev server listens on (matches devcontainer forwardPorts)
    host: true,  // listen on all network interfaces — needed inside a dev container
  },
});
