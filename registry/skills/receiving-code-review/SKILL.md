---
name: receiving-code-review
description: Turn review comments into better code without thrashing or ego.
---

# Receiving code review

Use when: a reviewer left comments on your PR and you're about to act on them.

## Before touching the code

1. **Read every comment once, top to bottom, without replying.**
2. **Classify each:** change-required / discussion / nit / question.
3. **Plan the batch** — fix all the change-requireds in one pass, answer questions in one reply thread each, leave nits for a dedicated follow-up PR if they're mechanical.

## While fixing

- One commit per logically distinct change.
- If the reviewer is wrong, say so clearly — link the code, state your reasoning, ask for a reaction.
- If you're not sure they're right, test both directions before arguing either way.
- Never mix "fix review feedback" commits with "rebase" or "merge main" commits in the same push. Reviewers get lost.

## Replying

- Answer every comment, even if just with 👍.
- "Fixed in `<sha>`" is a good reply. Name the commit.
- Close the thread only after the reviewer acknowledges.

## Red flags

- You feel the urge to explain "why it's already like this" — write it in the code as a comment first, then link the comment.
- You're rewriting half the PR in response to one nit. Stop, ask the reviewer if they meant that big a change.
