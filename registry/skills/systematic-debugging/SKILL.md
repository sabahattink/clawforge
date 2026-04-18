---
name: systematic-debugging
description: Narrow the search space with the scientific method before touching code.
---

# Systematic debugging

Use when: a test fails, a user reports a bug, or behaviour diverges from expectation.

## Protocol

1. **Observe** — write down what happens vs what should happen. One sentence each.
2. **Reproduce** — find the smallest input that triggers the bug. If you can't reproduce it, you can't fix it.
3. **Hypothesize** — name one specific cause and one prediction the bug makes if that cause is right.
4. **Test** — prove or disprove the hypothesis with a change that takes less than five minutes.
5. **If wrong** — hypothesize again with what you learned. Don't skip this step.

## Rules

- One hypothesis at a time.
- Don't read the whole codebase. Start at the symptom and walk outward.
- Reproduction is the commit-worthy artefact: capture it as a failing test before you fix anything.
- When stuck, tell the rubber duck the last three things you ruled out. The answer is usually in what you haven't ruled out.

## Anti-patterns

- Changing five things at once and hoping one fixed it.
- Reading error messages as noise. Read them as constraints.
- Blaming the framework before proving the bug isn't yours.
