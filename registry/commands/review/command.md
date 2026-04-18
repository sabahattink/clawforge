---
name: review
description: Run the code-reviewer agent on the current diff or a named PR.
---

Run the `code-reviewer` subagent on:

- **No arg** → the current working-tree diff against the base branch (`git diff main...HEAD`).
- **PR number** → `gh pr diff <n>` output.

Pass the full diff, the list of changed files, and any referenced spec or plan docs as context. The reviewer's output format is fixed — do not reformat it, just relay.

After review:

- If `APPROVE` → stop.
- If `REQUEST_CHANGES` → list the BLOCK and HIGH findings as a TODO, do not fix unless asked.
- If `COMMENT` → summarise the advisory notes.
