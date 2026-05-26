# FIZZ5 Project Instructions

Codename: `fizz5`

When you open a new Cursor chat in this repo, the assistant should:

1. Read this file.
2. List active to-dos (status `pending` or `in_progress`).
3. Ask: "What would you like to work on?"

This file also acts as the single source of truth for the project work queue.

## Active to-dos

- [Migration] **Lottie reveal timing** — Match Webflow IX2 fade-in for `.sticky-track` (see `docs/WEBFLOW-MCP-INSPECTION.md`). Element ID `62113a69-bb76-3937-b876-e1c99559ad9c`, track height `500vh`.

- [Migration] **Hero scroll choreography** — `hero-track` is `300vh` with sticky `video-bg_wrapper`; Webflow uses IX2 on scroll (not `fizzzscroll` scripts). Port with GSAP ScrollTrigger or equivalent.

- [Migration] **Nav search Lottie** — Element `c515ba7c-0a1b-2f65-a43e-3a0568d7f84d` (search icon IX2).

- [Migration] Port explore flow (`explore.html` / z-scroll 3D) — uses site scripts `fizzzscrollcss0/1`, `fizzzscrolljs01/02` (separate from homepage Lottie).

## Webflow MCP reference (2026-05-26)

- Site ID: `6a03870d6aa42355105ab9ae` | Home page ID: `6a0387116aa42355105ab9fa`
- Full inspection report: [`docs/WEBFLOW-MCP-INSPECTION.md`](docs/WEBFLOW-MCP-INSPECTION.md)
- Live preview: https://fizz5.webflow.io/

## Notes

- Treat `fizz5.webflow/` as a read-only reference. Port into `src/` as new code is created.
- Homepage Lottie scroll is **Webflow IX2** (not `fizzzscroll` JS). `fizzzscroll*` is for Explore 3D only.
- All commits must use conventional messages and be submitted via PRs with CI checks enabled.
