---
name: tdd-workflow
description: Write tests first, enforce red-green-refactor, keep commits tight.
---

# TDD Workflow

Use when: implementing any feature or bug fix.

## The loop

1. **Red** — write one failing test. Run it. Confirm the error message.
2. **Green** — write the minimum code that makes the test pass. Nothing more.
3. **Refactor** — tidy the design while green. Re-run tests.
4. **Commit** — one conventional-commit-style message per green cycle.

## Rules

- Never write implementation before the failing test exists.
- Each commit should leave the suite green.
- If a test is hard to write, the design is wrong — refactor the code, not the test.
- Coverage is a side effect, not a goal.

## When to deviate

- Exploratory spikes: write code without tests to answer a question, then discard the spike and restart with a test.
- External API contracts: record a real response as a fixture before mocking.

## Pairing with other skills

- `systematic-debugging` when a test is failing for unclear reasons
- `receiving-code-review` when your PR comes back with test-shape feedback
