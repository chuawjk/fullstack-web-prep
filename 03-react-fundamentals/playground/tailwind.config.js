/** @type {import('tailwindcss').Config} */
// Tailwind configuration. The `content` array tells Tailwind which files to
// scan for class names — it only includes classes it finds here in the final CSS.
// Python analogy: like telling a tree-shaker which modules to include.
export default {
  content: [
    "./index.html",
    "./src/**/*.{ts,tsx}",  // scan all TypeScript/TSX files in src/
  ],
  theme: {
    extend: {},  // add custom colours, fonts, spacing here if needed
  },
  plugins: [],
};
