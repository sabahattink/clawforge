import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "html", "lcov"],
      include: ["src/**/*.ts"],
      exclude: ["src/bin.ts", "src/index.ts"],
      thresholds: { lines: 85, statements: 85, functions: 90, branches: 75 },
    },
  },
});
