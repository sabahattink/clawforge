---
name: test
description: Run the test suite relevant to the current diff.
---

1. `git diff --name-only <base>...HEAD` to find changed files.
2. Map each changed file to its test directory. Default fallbacks:
   - `packages/<pkg>/src/**` → `packages/<pkg>/` (run the package's test script)
   - `apps/<app>/src/**` → `apps/<app>/` (run the app's test script)
3. For each hit, run the project-appropriate test command (`pnpm --filter <pkg> test`, `cargo test`, `pytest`, etc.).
4. Report results: PASS / FAIL per package, with the first failing test's message shown inline.

If nothing changed, run the full suite.
