# Contributing to fizz5

Codename: `fizz5`

## Branching model

- Use trunk-based development.
- Branch off `main` for each logical change.
- Open a PR back into `main`.
- Prefer squash merges.

## Branch naming

- `feat/<area>-<short-desc>`
- `fix/<area>-<short-desc>`
- `chore/<short-desc>`

## Commit message style (Conventional Commits)

- `feat: ...`
- `fix: ...`
- `chore: ...`
- `docs: ...`
- `refactor: ...`
- `perf: ...`
- `test: ...`
- `ci: ...`

## PR quality checklist

Before requesting review, ensure:

- [ ] The change is described clearly in the PR title and body.
- [ ] Any UI changes include screenshots (or references) and a quick test plan.
- [ ] Worker changes document endpoint behavior and error handling.
- [ ] No secrets are committed (use `.dev.vars` locally; `wrangler secret put` in prod).
- [ ] PR runs CI: lint, typecheck, and build.

## Working with `fizz5.webflow/`

- `fizz5.webflow/` is a reference export.
- Do not edit it as part of the product build.
- When porting sections, create new code under `src/` and reference relevant Webflow assets from `public/`.
