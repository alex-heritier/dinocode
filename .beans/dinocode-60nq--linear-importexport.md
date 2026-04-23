---
# dinocode-60nq
title: Linear import/export
status: todo
type: feature
priority: low
created_at: 2026-04-22T07:15:45Z
updated_at: 2026-04-23T03:41:29Z
parent: dinocode-0ub1
---

Bi-directional sync between Linear issues and `.dinocode/tasks/`. Mirrors the GitHub integration's flow via Linear's GraphQL API.

## Subtasks

### CLI

- [ ] `dinocode import linear --team TEAM-KEY [--state Backlog,Todo] [--since ...]`
- [ ] `dinocode export linear --team TEAM-KEY [--filter ...]`
- [ ] `dinocode sync linear --team TEAM-KEY` (long-running)

### Mapping

- [ ] Linear `title` ↔ task `title`
- [ ] Linear `description` (Markdown) ↔ task `body`
- [ ] Linear `state` ↔ task `status` (configurable mapping table)
- [ ] Linear `priority` (0..4) ↔ task `priority`
- [ ] Linear `labels` ↔ task `tags`
- [ ] Linear `identifier` (e.g. ENG-123) stored in front-matter: `linear: { issueId, identifier, teamKey, url }`

### Auth

- [ ] Personal API token from `LINEAR_API_KEY` env or safeStorage; OAuth flow documented as future work
- [ ] Token validated on first use; clear error if expired

### GraphQL usage

- [ ] Use Linear SDK if stable; otherwise raw GraphQL with typed document nodes
- [ ] Fetch in pages of 100; handle cursor pagination

### Conflict + rate limiting

- [ ] Same patterns as GitHub adapter; share `packages/shared/src/importers/` base

### Tests

- [ ] Recorded fixtures; round-trip parity

## Direction update (2026-04-23)

Per `docs/dinocode-packages.md`, this parity feature is a **t3code feature**, not a Dinocode feature. The Dinocode direction is to keep t3code internals pristine and layer Dinocode features as packages. Three options for this bean:

1. **Upstream it** — open a PR against `pingdotgg/t3code` instead of committing inline here.
2. **Defer** — park until we decide the feature matters enough to accept the fork-internal change.
3. **Drop** — scrap if the feature isn't critical.

Default is option 1 (upstream). Update before starting work.
