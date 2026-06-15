import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

// No @vitejs/plugin-react: tests don't need fast-refresh, and Vitest's esbuild
// transform handles TSX via the automatic JSX runtime below.
export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  esbuild: {
    jsx: "automatic",
    jsxImportSource: "react",
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./vitest.setup.ts"],
    include: ["src/**/*.test.{ts,tsx}"],
    css: false,
  },
});
