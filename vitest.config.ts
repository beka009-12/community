import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname),
      // `server-only` throws outside a React Server environment.
      "server-only": path.resolve(__dirname, "vitest.server-only.ts"),
    },
  },
  test: { environment: "node", include: ["src/**/*.test.ts"] },
});
