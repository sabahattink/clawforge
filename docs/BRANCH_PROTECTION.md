# Branch protection — maintainer setup

After the repository is pushed to GitHub, apply these settings under
**Settings → Branches → Add rule** for `main` (and `master` if you keep both).

## Required

- ✅ Require a pull request before merging
- ✅ Require approvals (1)
- ✅ Dismiss stale pull request approvals when new commits are pushed
- ✅ Require review from Code Owners
- ✅ Require status checks to pass before merging
- ✅ Require branches to be up to date before merging

## Required status checks

Add these once they have run at least once on a PR:

- `Validate PR / validate`
- (from future extensions) `Release Web / deploy` only on merge — not a PR gate

## Additional

- ✅ Require linear history (no merge commits into `main`)
- ✅ Require signed commits (optional but recommended)
- ✅ Do not allow force pushes
- ✅ Do not allow deletions
- ✅ Lock branch for admins too (no override)

## Secrets

Configure under **Settings → Secrets and variables → Actions**:

- `CLOUDFLARE_API_TOKEN` — with R2 write and Pages deploy scopes
- `CLOUDFLARE_ACCOUNT_ID`
- `MEILISEARCH_HOST`
- `MEILISEARCH_API_KEY`
- `NPM_TOKEN` — automation token with `publish` permission for the `@clawmart` scope

## Environments

Create a GitHub Environment called `production`. Require reviewers for production deploys (optional but useful before launch).

## Releases

To cut a new CLI release:

```bash
git tag cli-v0.1.0
git push --tags
```

That triggers `release-cli.yml`.
