import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    setupFiles: ["./tests/setup.js"],
    testTimeout: 60000,
    hookTimeout: 600000, // prima esecuzione: download binario Mongo (~800MB)
  },
});
