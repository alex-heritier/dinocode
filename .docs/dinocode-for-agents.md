# Dinocode for Agents

**Audience**: Coding agents (Codex, Claude, Cursor, OpenCode, Gemini, etc.).
**Status**: Draft v0.1
**Last updated**: 2026-04-23

This is the long-form agent guide. It is the authoritative reference for
how an agent should work with Dinocode tasks, threads, boards, and the
home agent — as well as the file layout every tool must respect.

If you only have room for one paragraph: **treat `.dinocode/tasks/*.md`
(and `.beans/*.md` in the interim) as a source of truth, respect ETags,
keep task checklists current as you work, and never hand-edit the
Dinocode SQLite DB directly.**

---

## 1. Where Dinocode lives

```
<repo>/
  .dinocode/
    config.yml              # project-level task config (statuses, paths, prefix)
    tasks/
      dnc-abc1--setup.md    # individual tasks
      archive/              # archived tasks (reversible)
    plans/                  # long-form plan documents
    .gitignore              # excludes runtime state
    .conversations/         # agent chat logs (gitignored)
    .sessions/              # runtime provider session state (gitignored)
    browser/                # browser artifacts (gitignored)
  .beans/                   # legacy / current task location, migrating per dinocode-fj6n
  DINOCODE.md               # product spec
  AGENTS.md                 # this repo's agent-facing top-level doc
  docs/                     # developer-facing architecture docs
```

## 2. Task file format

```markdown
---
# dnc-0ajg
title: Implement OAuth flow
status: in-progress
type: task
priority: high
created_at: 2026-04-22T10:00:00Z
updated_at: 2026-04-22T14:30:00Z
order: Aa
parent: dnc-mmyp
blocking: []
blocked_by: [dnc-abc1]
tags: [auth, backend]
---

## Goal

Add GitHub OAuth login to the desktop app.

## Acceptance Criteria

- [x] OAuth callback endpoint
- [ ] Session persistence
- [ ] Logout flow

## Notes

The provider adapter already supports token exchange. We just need the UI flow.
```

**Rules you must follow**:

- `id` is written as a YAML comment inside the front matter (`# dnc-0ajg`), not as a field.
- `status` is one of: `in-progress`, `todo`, `draft`, `completed`, `scrapped`.
- `type` is one of: `milestone`, `epic`, `bug`, `feature`, `task`.
- `priority` is one of: `critical`, `high`, `normal`, `low`, `deferred`.
- Array fields serialize in YAML flow style (`[a, b]`) with a single space after each comma.
- Empty optional fields are omitted entirely (never `null` or `~`).
- Line endings are always LF.

Deterministic serialization matters: ETags are an FNV-1a-32 hash of the
full rendered Markdown, so small divergences produce phantom conflicts.

## 3. CLI cheat sheet

### Today (via `beans`)

```bash
beans list --json --ready              # find unblocked work
beans show --json <id> [id ...]        # view full task(s), including body
beans create --json "Title" -t task -d "…"
beans update --json <id> -s in-progress
beans update --json <id> --blocked-by <other-id>
beans update --json <id> --body-append "## Notes"
beans update --json <id> --body-replace-old "- [ ]" --body-replace-new "- [x]"
beans archive                          # archive everything completed/scrapped
```

See `beans prime` for the canonical agentic beans reference.

### Soon (via `dinocode`)

Once `packages/dinocode-cli` ships (tracked by `dinocode-lhp0` and
children), the agent-preferred surface becomes:

```bash
dinocode task list --ready --json
dinocode task view <id> --json
dinocode task create --title "…" -t task -s todo --json
dinocode task update <id> --status in-progress --json
dinocode task update <id> --if-match "$ETAG" --body-replace-old "…" --body-replace-new "…" --json
dinocode task link <blocker> <blocked>
dinocode task archive <id>
dinocode prime                         # agent-focused reference (mirrors beans prime)
```

All CLI commands read and write `.dinocode/tasks/` directly via
`packages/soil`, so they work without a server or browser.

## 4. Workflow: picking up a task

1. **Find ready work**: `beans list --json --ready | jq '.[0:10]'` (or the `dinocode` equivalent).
2. **Read the full task**: `beans show --json <id>` — the body contains the plan, checklist, dependencies, and any agent notes left by predecessors.
3. **Claim it**: `beans update <id> -s in-progress`.
4. **Work the plan**:
   - Tick checklist items as you complete them with `--body-replace-old "- [ ] X" --body-replace-new "- [x] X"`.
   - Add progress notes with `--body-append`.
   - Keep the front matter honest; update `priority`, `blocked_by`, `parent` when reality shifts.
5. **Finish**:
   - Ensure every checklist item is `- [x]` or intentionally scrapped.
   - Add a `## Summary of Changes` section describing what shipped.
   - Run `bun fmt && bun lint && bun typecheck && bun run test` (all four must be green).
   - `beans update <id> -s completed`.
   - Commit code and the task file together.

## 5. ETag optimistic concurrency

Every Dinocode task mutation is ETag-guarded so concurrent agents, humans, and CI can't silently clobber each other:

```bash
ETAG=$(beans show <id> --etag-only)
beans update <id> --if-match "$ETAG" --status completed
```

If the ETag doesn't match, the CLI returns an error with the current ETag so you can re-read, reason, and retry. Inside the server pipeline, an ETag mismatch dispatches `task.conflict`; the UI surfaces a three-way merge. Do not bypass this — losing concurrent edits costs far more than retrying does.

## 6. Integration-point rule

Dinocode is a fork of [`pingdotgg/t3code`](https://github.com/pingdotgg/t3code). The cardinal rule: **Dinocode additions live in standalone packages layered on top of t3code.** Do not modify t3code internals unless it is strictly an integration point.

When a Dinocode package _must_ be wired into t3code at a specific file, the t3code-side edit should be one line (an import + call), preceded by:

```ts
// dinocode-integration: <package> <feature>
```

`rg 'dinocode-integration'` surfaces every coupling site. See [`docs/dinocode-packages.md`](../docs/dinocode-packages.md) for the full policy.

## 7. Built-in tools (Phase 4)

Inside provider adapters (Codex, Claude, Cursor, OpenCode) the home agent and task-aware sessions will register native function-calling tools. Names are stable across providers:

- `dinocode_list_tasks({ filter? })` → `TaskSummary[]`
- `dinocode_view_task({ taskId })` → `TaskDocument`
- `dinocode_create_task({ title, type, status?, priority?, parent?, body? })` → `TaskId`
- `dinocode_update_task({ taskId, ifMatch?, patch })` → `TaskEtag`
- `dinocode_link_tasks({ blockerId, blockedId })` / `dinocode_unlink_tasks(...)`
- `dinocode_archive_task({ taskId })` / `dinocode_unarchive_task({ taskId })`
- `dinocode_search_tasks({ query, limit? })` → `TaskSummary[]` (FTS5-backed, Phase 6)

These go through the orchestration engine (with ETag validation + event sourcing), not the filesystem directly. Prefer them over shelling out when they are available.

If these are not in your tool list yet, shell to the CLI — same semantics, same files.

## 8. Home agent

A dedicated non-board chat session (`__home_agent__:<projectId>`) acts as a task manager:

- Reads the full open-tasks list into its system prompt dynamically.
- Can create/link/start tasks on the user's behalf.
- Never edits code directly — implementation always goes through task cards + spun-up threads.

If you are the home agent: keep replies short, operate as a project manager, and always defer coding work to a spawned session attached to a specific task.

## 9. Task context injection for agent sessions

When a task is selected before a session starts, Dinocode injects the task's title, status, body, and blockers into the first user message (not the system prompt). If you receive a prompt that starts with:

```
## Task: <title>  (@TASK-<id>)
Status: <status>  |  Priority: <priority>
Blocked by: <list>

<body>
```

treat that as authoritative for the current turn and bind your work to that task id. Mentioning `@TASK-<id>` anywhere in your output is recognized by the composer as a reference.

## 10. Concurrency, reliability, and safety

- **Never** edit the SQLite event store directly. The filesystem (`*.md`) and the SQLite event log round-trip through a watcher + reactor; hand edits to SQLite will be silently overwritten.
- **Never** reorder tasks by editing the SQLite `projection_tasks` table; set the `order` fractional index in the Markdown file.
- **Never** silently downgrade a `status` from `in-progress` to `todo` without a note — it erases state the user was relying on.
- Archive (`status: scrapped` → `.dinocode/tasks/archive/`) is reversible; deletion is not.
- Large bodies: prefer `--body-append` + `--body-replace-*` over re-writing the whole body; it makes ETag conflicts cheaper to resolve.

## 11. Observability

- Every task mutation emits an orchestration event persisted to SQLite.
- Every tool invocation has a trace id; include it when you report bugs.
- `DINOCODE_DEBUG=debug` increases server log verbosity.
- Browser subsystem logs land under `.dinocode/browser/logs/<projectId>/`.

## 12. Related docs

- [`DINOCODE.md`](../DINOCODE.md) — product spec + data model.
- [`docs/dinocode-packages.md`](../docs/dinocode-packages.md) — package boundaries and the integration-point rule.
- [`docs/dinocode-browser.md`](../docs/dinocode-browser.md) — built-in browser subsystem (agent tools for web debugging).
- [`packages/soil/README.md`](../packages/soil/README.md) — the authoritative contract for the task file format.
- [`docs/soil-migrations.md`](../docs/soil-migrations.md) — schema evolution.
- [`AGENTS.md`](../AGENTS.md) — short top-level agent directives.

## 13. Quick reference card

| I want to …                             | Do this                                                                                                                                        |
| --------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| Find something to work on               | `beans list --ready --json \| jq '.[0:10]'`                                                                                                    |
| Read a task end-to-end                  | `beans show --json <id>`                                                                                                                       |
| Claim a task                            | `beans update <id> -s in-progress`                                                                                                             |
| Tick a checkbox                         | `beans update <id> --body-replace-old "- [ ] X" --body-replace-new "- [x] X"`                                                                  |
| Record a note                           | `beans update <id> --body-append "## Notes\n\n…"`                                                                                              |
| Add a blocker                           | `beans update <id> --blocked-by <other>`                                                                                                       |
| Ship                                    | Run `bun fmt && bun lint && bun typecheck && bun run test`; append `## Summary of Changes`; `beans update <id> -s completed`; commit together. |
| Find the dinocode ↔ t3code coupling map | `rg 'dinocode-integration:'`                                                                                                                   |
