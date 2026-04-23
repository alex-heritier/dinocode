# @dinocode/soil

**Soil** is the task-domain package for Dinocode. It owns the flat-file task
format (`.dinocode/tasks/*.md`), the event-sourced decider/projector, ETag
optimistic concurrency, fractional ordering, filesystem reactor, and filesystem
watcher utilities. It is the single source of truth for task logic that is
shared between `apps/server` (orchestration + web) and the future `apps/cli`
(`dinocode task ...`).

Soil is intentionally free of WebSocket/RPC/HTTP awareness. It operates on
plain filesystem paths and pure data, so the same code can run inside the
server's Effect runtime, inside a short-lived CLI process, or inside tests.

## Design Principles

1. **File-first** — The filesystem is the agent-visible source of truth. The
   server's SQLite event store is the server-internal source of truth; soil
   keeps them in sync through a reactor + watcher pair.
2. **Pure where possible** — Decider, projector, renderer, parser, conflict
   resolution, migration, and search are all pure functions. IO is isolated in
   the reactor, watcher, and config loader.
3. **Deterministic serialization** — Task files are rendered with a fixed
   field order, LF line endings, and compact array formatting. Any renderer
   that matches the rules in `renderer.ts` produces byte-identical output,
   which makes ETags stable across platforms and editors.
4. **Effect-TS only for IO** — Pure functions return plain values. IO returns
   typed Effects (`SoilParseError | SoilValidationError | SoilEtagMismatchError
| SoilFileNotFoundError | SoilConfigError`). There is no hidden global
   state, no thrown exceptions across module boundaries for expected errors.
5. **No barrel exports** — Every module is reachable through an explicit
   subpath export (`@dinocode/soil/parser`, `@dinocode/soil/reactor`, etc.).
   This keeps the boundary between soil and consumers explicit and prevents
   accidental coupling.

## Task File Format

Each task lives in `<workspaceRoot>/<tasksPath>/<id>--<slug>.md` (default
`tasksPath` is `.dinocode/tasks`). Archived tasks live in the
`<tasksPath>/archive/` subdirectory.

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
blocking: [dnc-cb2e]
blocked_by: [dnc-abc1]
tags: [auth, backend]
---

## Goal

Add GitHub OAuth login to the desktop app.
```

The YAML front matter is wrapped between `---` fences. The task `id` is written
as a YAML comment on the first line of the front matter (matching beans'
convention). The `slug` is derived from the filename. All other fields are
plain YAML keys with a fixed order (see `renderer.ts`). Empty optional fields
are omitted entirely rather than serialized as `null` or `[]` to keep ETag
hashes stable.

## Subpath Exports

| Subpath                          | Purpose                                                                                                                                                                                                                        |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `@dinocode/soil/schema`          | Effect Schema definitions for `TaskDocument`, `TaskState`, `TaskPatch`, `ProjectConfig`.                                                                                                                                       |
| `@dinocode/soil/id`              | `generateTaskId(prefix)`, `generateSlug(title)`.                                                                                                                                                                               |
| `@dinocode/soil/fractionalIndex` | `keyBetween(a, b)` for kanban ordering.                                                                                                                                                                                        |
| `@dinocode/soil/parser`          | `parseTaskFile(content, path)` → `Effect<ParsedTask, SoilParseError \| SoilValidationError>`.                                                                                                                                  |
| `@dinocode/soil/renderer`        | `renderTaskDocument(doc)`, `renderFilename(doc)`. Deterministic.                                                                                                                                                               |
| `@dinocode/soil/etag`            | `computeEtag(content)` — FNV-1a 32-bit hex, LF-normalized.                                                                                                                                                                     |
| `@dinocode/soil/decider`         | `decideTaskCommand(state, command)` — pure state machine over `TaskCommand` → `TaskEvent`.                                                                                                                                     |
| `@dinocode/soil/projector`       | `projectTaskEvent(state, event)` — folds task events into a `Record<string, TaskState>`.                                                                                                                                       |
| `@dinocode/soil/reactor`         | `makeSoilReactor({ context })` — IO layer that writes `.md` files and tracks write locks.                                                                                                                                      |
| `@dinocode/soil/watcher`         | `watchProject({ context })` — `Stream<FileChangeEvent>` over the tasks directory.                                                                                                                                              |
| `@dinocode/soil/config`          | `loadProjectConfig(workspaceRoot)` — reads `.dinocode/config.yml`.                                                                                                                                                             |
| `@dinocode/soil/conflict`        | `detectEtagConflict`, `threeWayMerge` — pure conflict resolution helpers.                                                                                                                                                      |
| `@dinocode/soil/migration`       | `migrateTaskContent`, `planSlugRename`, `runSchemaMigrations`, `CURRENT_TASK_SCHEMA_VERSION`, `DEFAULT_MIGRATIONS` — schema + filename + versioned migrations. See [`docs/soil-migrations.md`](../../docs/soil-migrations.md). |
| `@dinocode/soil/search`          | `filterTasks`, `sortTasks`, `readyTasks` — in-memory query helpers.                                                                                                                                                            |
| `@dinocode/soil/errors`          | `SoilError` union and tagged error classes.                                                                                                                                                                                    |

## Architecture

```
          ┌────────────────────────────────────────────────────────────┐
          │                      @dinocode/soil                         │
          │                                                            │
          │   Pure:   schema  id  fractionalIndex  parser  renderer    │
          │           etag  decider  projector  conflict  migration    │
          │           search  errors                                   │
          │                                                            │
          │   IO:     config (read .dinocode/config.yml)               │
          │           reactor (apply events → .md files)               │
          │           watcher (Stream of FileChangeEvent)              │
          └────────────────────────────────────────────────────────────┘
                    ▲                                    ▲
                    │ consumes                           │ consumes
                    │                                    │
          ┌─────────┴─────────┐              ┌──────────┴────────┐
          │    apps/server    │              │  apps/cli (soon)  │
          │                   │              │                   │
          │  - Orchestration  │              │  dinocode task    │
          │  - FileStore      │              │  dinocode init    │
          │    adapter        │              │  dinocode doctor  │
          │  - WS subscribers │              │                   │
          └───────────────────┘              └───────────────────┘
```

The server persists canonical events to SQLite via its orchestration engine
(`orchestration_events` table), then feeds the same events into soil's reactor
to project them into task files. The watcher observes external edits (agents,
humans, the CLI) and re-dispatches them as `task.update` commands with ETag
validation, so the filesystem and event log never diverge.

## Usage

### Parsing and rendering (pure)

```ts
import { Effect } from "effect";
import { parseTaskFile } from "@dinocode/soil/parser";
import { renderTaskDocument } from "@dinocode/soil/renderer";
import { computeEtag } from "@dinocode/soil/etag";

const program = Effect.gen(function* () {
  const parsed = yield* parseTaskFile(markdown, "/abs/path/dnc-abc1--hello.md");
  const rendered = renderTaskDocument(parsed.document);
  const etag = computeEtag(rendered);
  return { document: parsed.document, rendered, etag };
});
```

### Decider + projector (pure)

```ts
import { Effect } from "effect";
import { decideTaskCommand } from "@dinocode/soil/decider";
import { projectTaskEvent, createEmptyTaskState } from "@dinocode/soil/projector";

const program = Effect.gen(function* () {
  let state = createEmptyTaskState();
  const events = yield* decideTaskCommand(state, {
    type: "task.create",
    projectId: "demo",
    title: "Hello world",
  });
  for (const event of events) {
    state = projectTaskEvent(state, event);
  }
  return state;
});
```

### Filesystem reactor (IO)

```ts
import { Effect } from "effect";
import { loadProjectConfig } from "@dinocode/soil/config";
import { makeSoilReactor } from "@dinocode/soil/reactor";

const program = Effect.gen(function* () {
  const context = yield* loadProjectConfig("/path/to/repo");
  const reactor = makeSoilReactor({ context });
  yield* reactor.apply(events); // writes .dinocode/tasks/<id>--<slug>.md
  const current = yield* reactor.readTask("dnc-abc1");
});
```

The reactor maintains an in-memory set of paths it is currently writing to.
The watcher should consult `reactor.isIgnored(path)` before re-dispatching
events, so the reactor's own writes don't loop back through orchestration.

### Watcher (IO)

```ts
import { Stream } from "effect";
import { watchProject } from "@dinocode/soil/watcher";

const program = watchProject({ context, isIgnored: reactor.isIgnored }).pipe(
  Stream.runForEach((event) =>
    /* dispatch task.update with event.etag */
  ),
);
```

The watcher debounces filesystem events (default 50 ms), skips paths owned by
the reactor, and emits `added` / `updated` / `removed` change events with a
parsed `TaskDocument` and its ETag when available.

## Testing

Soil is tested in isolation with Vitest:

```bash
bun run --filter=@dinocode/soil test
```

Parser round-trips, decider state transitions, projector folding, reactor
file I/O, conflict resolution, and migration helpers all have coverage in
`src/soil.test.ts`. Use these as the template when adding new soil features.

## Stability

Soil is the load-bearing core of the Dinocode data model. Contract changes here
ripple through the server's decider/projector, the CLI, and every agent that
reads `.dinocode/tasks/`. Prefer additive changes (new subpaths, new optional
schema fields) and always bump schemas through `@dinocode/soil/migration` when
breaking changes are unavoidable.
