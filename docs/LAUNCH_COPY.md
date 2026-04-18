# Launch copy

Draft posts for launch day. Customise before posting; the core pitch stays.

---

## Hacker News — "Show HN"

**Title** (80-char limit)

```
Show HN: Clawforge – An npm-like registry for Claude Code skills and agents
```

**Body**

```
I built clawforge because the Claude Code ecosystem is scattered — skills in a
dozen gists, agent definitions in private configs, MCP server snippets in
random READMEs. I wanted `npx create-next-app` energy for Claude Code
assets.

So: `npx clawforge add skill:tdd-workflow` and you get a plain SKILL.md under
~/.claude/skills/ that you can read, edit, and delete. Shadcn-style — you
own the code, no runtime.

What's in:
- Six kinds: skills, agents, hooks, MCP configs, slash commands, presets
- Every install is reversible: manifest records JSON-merge before/after
- Security scanner blocks rm -rf, curl|sh, eval-curl patterns in hook
  snippets before they land in the registry
- Verified tier controlled by a CODEOWNERS-protected file — authors can't
  self-verify
- Self-hostable: build the index yourself, point the CLI at your CDN

MVP ships 12 seed entries across every kind. 38 more in the backlog.

Design spec, plans, maintainer playbook, and the security policy are all in
the repo. Happy to answer anything.

GitHub: github.com/sabahattink/clawforge
Site: clawforge.dev
```

---

## Reddit — r/ClaudeAI

**Title**

```
I built a registry + CLI for Claude Code skills and agents (one-command installs, shadcn-style)
```

**Body**

```
If you've wanted a single place to find Claude Code skills / agents / hooks /
MCP configs, and install them without cargo-culting config snippets — I
think you'll like clawforge.

`npx clawforge add skill:tdd-workflow`

The file lands at ~/.claude/skills/tdd-workflow/SKILL.md. No magic
filesystem, no plugin engine — just a copied file you own.

Built-in:
- Install / list / update / remove with proper manifest tracking
- Security scanner rejects dangerous hook snippets before they enter the
  registry
- Verified tier for entries that have passed maintainer review
- Preset bundles (e.g. strict-tdd = TDD workflow + code-reviewer agent +
  /review command + commit-msg-lint hook)

Self-hostable if you want a private registry.

GitHub: github.com/sabahattink/clawforge — would love first-week feedback.
```

---

## Reddit — r/commandline

**Title**

```
Clawforge — shadcn/ui for Claude Code assets (single npx install, no lock-in)
```

**Body** (shorter, CLI audience)

```
One-command install, copy-paste semantics, full reversibility.

`npx clawforge add skill:tdd-workflow`

Reads from a public registry (self-hostable). Every install records a
before-snapshot for JSON-merge entries so `remove` genuinely reverts.

Repo: github.com/sabahattink/clawforge
```

---

## Twitter / X thread (9 tweets)

1.
```
I built clawforge — an npm-like registry for Claude Code skills, agents,
hooks, and MCP servers.

one command. one file written. fully reversible.

`npx clawforge add skill:tdd-workflow`

github.com/sabahattink/clawforge
```

2.
```
the trigger: every Claude Code user I know has the same folder of gists
they paste into ~/.claude/skills every time they start a project.

clawforge is that folder, curated, searchable, and installable in one
command.
```

3.
```
shadcn-style philosophy: you own the code.

clawforge doesn't hide your skills behind a resolver or runtime. it writes a
plain file to ~/.claude/skills/<name>/SKILL.md. open it, edit it, commit it
to your dotfiles — it's yours.
```

4.
```
every install is reversible.

the manifest records:
- exact files written
- JSON merge "before" snapshots for hooks + MCP
- sha256 of content
- source commit of the registry

`clawforge remove` restores state cleanly.
```

5.
```
the scary part about distributing configs: one malicious hook snippet with
`rm -rf $HOME` can brick a dev's machine.

clawforge's validator blocks dangerous patterns before they merge. also
flags sudo, credential-path reads, obfuscated shell.

CI gate, not optional.
```

6.
```
verified tier.

`verified: true` isn't a field authors set. it comes from a CODEOWNERS-
protected file that only maintainers edit. major version bumps invalidate
the badge.

trust by construction, not by claim.
```

7.
```
self-hostable by design.

want a private registry for your team's internal skills? build the index,
upload to any static host, point the CLI at your CDN with --registry.

10 lines of YAML, no infrastructure.
```

8.
```
12 seed entries across every kind to start:

skills — tdd-workflow, systematic-debugging, receiving-code-review,
writing-plans
agents — code-reviewer, planner
presets — strict-tdd bundle

38 more in the backlog. contributing is a PR.
```

9.
```
repo: github.com/sabahattink/clawforge
site: clawforge.dev
docs: full maintainer playbook, security policy, branch-protection guide
already in the repo.

first-week feedback is gold. would appreciate the signal boost 🙏
```

---

## dev.to article outline

**Title**: "How I built clawforge: a registry for the Claude Code ecosystem"

Sections:

1. The folder of gists everyone has
2. Why shadcn's philosophy applies — "you own the code"
3. Designing reversible installs: the manifest + before-snapshot
4. Security at the registry layer, not the runtime layer
5. The verified tier without giving authors the keys
6. Building the 8-package monorepo — what each piece does
7. Lessons from shipping 121 tests in a week
8. Where this goes next — post-MVP backlog

CTA: GitHub link + "open an issue with the skills you want to see next".

---

## Newsletter pitches

Targets: TLDR Dev, Console.dev, Pointer.io, Terminal Trove, Hacker News Weekly.

**Pitch template** (~100 words each):

```
Subject: Clawforge — an npm-like registry for Claude Code skills and agents

Hi <name>,

If you cover Claude Code / AI tooling I think clawforge might fit an upcoming
issue. It's an open-source registry + CLI — `npx clawforge add skill:X` and
you get a copy-paste, reversible install with security gates baked in.

One-paragraph pitch:
- Shadcn-style: writes files you own, no runtime
- Full reversibility via manifest with JSON-merge before-snapshots
- Security scanner blocks dangerous patterns before merge
- Self-hostable for private registries

Repo: github.com/sabahattink/clawforge
Site: clawforge.dev

Happy to do a 5-minute walkthrough on video if it helps.

— Kalkan
```
