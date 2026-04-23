---
# dinocode-ddrx
title: GitHub Issues import/export
status: todo
type: feature
priority: low
created_at: 2026-04-22T07:15:45Z
updated_at: 2026-04-23T03:41:29Z
parent: dinocode-0ub1
---

Bi-directional sync between GitHub Issues and `.dinocode/tasks/`. Supports one-off imports, one-off exports, and continuous sync.

## Subtasks

### CLI

- [ ] `dinocode import github --repo owner/name [--labels foo,bar] [--since 2024-01-01]`
- [ ] `dinocode export github --repo owner/name [--filter status:todo]`
- [ ] `dinocode sync github --repo owner/name --mode bidirectional` (long-running)

### Mapping

- [ ] Issue `title` ↔ task `title`
- [ ] Issue `body` ↔ task `body`
- [ ] Issue `state: open/closed` ↔ task `status: todo/completed`
- [ ] Issue `labels` ↔ task `tags` (with configurable label-prefix stripping, e.g. `bug:` → type=bug)
- [ ] Issue assignees → ignored (Dinocode is single-user-optimized for now; mention in body)
- [ ] Store GitHub metadata in front-matter: `github: { issueNumber, repo, url }`

### Auth

- [ ] Read GitHub token from `gh auth token` first; fallback to `GITHUB_TOKEN` env; interactive login prompt last
- [ ] Token stored via `safeStorage` on desktop (no plaintext)

### Import flow

- [ ] `--dry-run` prints mapping preview table
- [ ] Default interactive: paginate through 50 issues at a time with [accept / skip / edit] per issue
- [ ] `--yes` accepts all without prompting

### Export flow

- [ ] Creates new issues for tasks lacking `github.issueNumber`
- [ ] Updates existing issues when `updated_at` has advanced
- [ ] Dry-run diff view shows what would change

### Sync (bidirectional)

- [ ] Last-write-wins with a timestamp-based heuristic; ties broken in favor of GitHub
- [ ] Conflict resolution CLI prompt with per-field choice

### Rate limiting

- [ ] Respect GitHub's REST rate limit headers; exponential backoff; resumes after reset

### Tests

- [ ] Record/replay HTTP fixtures
- [ ] Round-trip import → export → deep-equal on fixture data

## Direction update (2026-04-23)

Per `docs/dinocode-packages.md`, this parity feature is a **t3code feature**, not a Dinocode feature. The Dinocode direction is to keep t3code internals pristine and layer Dinocode features as packages. Three options for this bean:

1. **Upstream it** — open a PR against `pingdotgg/t3code` instead of committing inline here.
2. **Defer** — park until we decide the feature matters enough to accept the fork-internal change.
3. **Drop** — scrap if the feature isn't critical.

Default is option 1 (upstream). Update before starting work.
