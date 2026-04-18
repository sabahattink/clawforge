---
name: writing-plans
description: Turn a spec into a tight task list — exact files, complete code, TDD per task.
---

# Writing implementation plans

Use when: you have a spec or requirements for a multi-step task, before touching code.

## The plan is for someone with zero context

Assume the engineer has never seen this codebase, knows the language but not your patterns, and has questionable taste. Document everything they need.

## Structure

1. **Header** — one-sentence goal, 2-3 sentence architecture, tech stack.
2. **File structure** — exact paths, one-line responsibility each.
3. **Conventions** — TDD loop, commit style, size limits, "no any / no `!`".
4. **Tasks** — one per logical unit. Each task lists:
   - Files to create / modify / test
   - Write failing test (complete code, not pseudocode)
   - Run test — expected failure message
   - Write implementation (complete code)
   - Run test — expected pass
   - Commit with exact conventional-commit message

## Rules

- Each step is 2-5 minutes of work.
- Include the commands and their expected output.
- Reference other skills with `@` syntax so the engineer loads them.
- Never "add validation here" — write the validation.

## After writing

Dispatch a reviewer on the plan before handing it off. Iterate on blocker feedback only.
