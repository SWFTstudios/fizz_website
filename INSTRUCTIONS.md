# FIZZ5 Project Instructions

Codename: `fizz5`

When you open a new Cursor chat in this repo, the assistant should:

1. Read this file.
2. List active to-dos (status `pending` or `in_progress`).
3. Ask: "What would you like to work on?"

This file also acts as the single source of truth for the project work queue.

## Active to-dos

- [Phase 5] verify-and-seed-todos: Completed local verification for Vite build + Worker health route.

- [Migration] Port hero section: Create `src/components/Hero.ts` (or `hero.ts`) by porting the hero markup/behavior from `fizz5.webflow/index.html` into the new Vite build.

## Notes

- Treat `fizz5.webflow/` as a read-only reference. Port into `src/` as new code is created.
- All commits must use conventional messages and be submitted via PRs with CI checks enabled.
