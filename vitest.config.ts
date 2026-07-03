import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // Single source of truth: `npm test` runs everything under tests/.
    include: ["tests/**/*.test.ts"],
    environment: "node",
  },
});
