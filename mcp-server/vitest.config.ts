import { defineConfig } from "vitest/config";
import { tmpdir } from "node:os";
import { join } from "node:path";

export default defineConfig({
  test: {
    include: ["test/**/*.test.ts"],
    // Default for every test: a credentials path that doesn't exist, so no
    // test ever reads or writes the real ~/.config/animalhouse. Tests that
    // exercise the file point ANIMALHOUSE_KEY_FILE at their own temp dir.
    env: { ANIMALHOUSE_KEY_FILE: join(tmpdir(), `ah-test-none-${process.pid}`, "credentials.json") },
  },
});
