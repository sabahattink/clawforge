# Security Policy

## Reporting a vulnerability

Do **not** file public issues for security disclosures. Email the maintainer directly:

- sabahattin.kalkan@outlook.com

Expect an acknowledgement within 24 hours. Coordinated disclosure window is 14 days unless the issue is trivially exploitable, in which case we move faster.

## Scope

- `@clawmart/cli` install/remove/update flows (arbitrary file writes, privilege escalation)
- `@clawmart/validator` security scanner (missed BLOCK patterns)
- `@clawmart/build-index` artefact integrity (sha256 verification, supply-chain)
- Malicious entries in the registry (prefer the takedown request template for non-novel cases)

## Out of scope

- Rate limiting / DoS on the CDN (we rely on Cloudflare's defaults)
- Reports that amount to "this is open-source code" with no concrete threat

## What to include

- Reproduction steps (or a PoC)
- Expected impact
- Suggested remediation if you have one

## Thank you

Every credible report helps keep Claude Code users safe. We'll credit you in the advisory unless you ask us not to.
