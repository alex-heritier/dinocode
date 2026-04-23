# Soil Task-Schema Migration Strategy

**Status**: v1 (draft accepted)
**Owner**: dinocode-mdhg
**Scope**: `packages/soil` task front-matter, `.dinocode/tasks/*.md`

Soil is the canonical task format for Dinocode. It is read by the server, the
CLI (`dinocode task`), and every agent that touches `.dinocode/tasks/`. Changes
to the front-matter schema therefore need an explicit migration contract, or
mixed versions in the wild will silently corrupt data.

This document defines that contract. It is deliberately additive-first: most
changes never require a version bump, and when they do, migrations are small,
pure, well-tested, and reversible where possible.

## Goals

1. **Forward compatibility** — A v1 reader must not crash on a v2 file. It may
   refuse to _modify_ the file, but it must preserve it byte-for-byte.
2. **Backward compatibility** — A v2 reader must read v1 files without
   requiring a rewrite, running them through `migrate(v1 → v2)` on the fly.
3. **Deterministic rewrites** — Running migrations produces byte-identical
   output regardless of host, locale, or execution order.
4. **Explicit opt-in for writes** — Migrations never run silently on disk. The
   CLI exposes `dinocode migrate --apply`; without `--apply`, migrations run in
   dry-run mode and report proposed diffs.

## Non-goals

- Runtime schema discovery (JSON-Schema-ish introspection from the file). Soil
  always ships a compiled schema; downgrades to older versions are out of scope.
- Automatic merges of concurrent schema upgrades. If two agents on different
  soil versions attempt conflicting writes, normal ETag conflict resolution
  (see `packages/soil/src/conflict.ts`) applies and wins.

## Version Field

Each task file carries an **optional** integer `schema_version` field in its
YAML front matter:

```markdown
---
# dnc-0ajg
schema_version: 2
title: ...
---
```

Rules:

- **Absent** → treated as version `1` (the current shipping schema as of
  v0.1.0).
- **Present** → must be a positive integer. Values greater than the soil
  library's `CURRENT_TASK_SCHEMA_VERSION` cause `SoilValidationError` with a
  clear "upgrade soil" message; the file is not rewritten.
- The renderer only emits `schema_version` when the document's effective
  version is strictly greater than 1, to keep v1 files byte-clean.

## Unknown Field Policy

The parser preserves unknown top-level YAML fields byte-for-byte when rewriting
a task, as long as:

- The file's `schema_version` is `>=` the soil library's current version.
- The unknown field is not a well-known name that has been explicitly retired
  (see §"Retired field handling" below).

For v1-v1 reads, the parser ignores unknown fields (they round-trip via the
preserved raw YAML). This lets a newer agent add fields that an older agent
doesn't understand, without either side mangling the file.

_Implementation note_: Preservation is implemented by keeping the original
`YAML.Document` AST around next to the validated `TaskDocument` struct. The
renderer prefers the AST for unknown keys and uses the validated struct for
known keys.

## Migration Types

```ts
import type { TaskDocument } from "@dinocode/soil/schema";

export interface Migration {
  /** Integer version this migration upgrades _to_. Must equal (fromVersion + 1). */
  readonly toVersion: number;
  /** Integer version this migration upgrades _from_. */
  readonly fromVersion: number;
  /** Human-readable description; surfaced in `dinocode migrate --dry-run`. */
  readonly description: string;
  /**
   * Pure transformation from an older raw YAML object to a newer one. Must
   * not throw; malformed input should produce a typed error carried in the
   * returned `Effect`.
   */
  apply: (
    raw: Record<string, unknown>,
  ) => Effect.Effect<Record<string, unknown>, SoilValidationError>;
  /**
   * Optional inverse transformation used by `dinocode migrate --downgrade`.
   * When absent, the migration is one-way.
   */
  invert?: (
    raw: Record<string, unknown>,
  ) => Effect.Effect<Record<string, unknown>, SoilValidationError>;
}
```

Migrations are registered in `packages/soil/src/migrations/` with one file per
jump (`v1-to-v2.ts`, `v2-to-v3.ts`, …). An index file (`registry.ts`)
concatenates them in order and exposes a `DEFAULT_MIGRATIONS` array. Consumers
can replace or extend the registry for tests.

## Runner

```ts
runMigrations(raw, { from: 1, to: CURRENT_TASK_SCHEMA_VERSION, registry });
```

- Pure over YAML objects; does not touch disk.
- Fails fast with `SoilValidationError` on the first migration that errors.
- Records each transition in an optional `trace` array (for test assertions).

The CLI wraps this with:

- `dinocode migrate --dry-run` (default): load each task, run migrations, print
  a unified diff per file. Exit code 0.
- `dinocode migrate --apply`: as above, then rewrite files and bump
  `updated_at`. Exit code reflects migration failures.
- `dinocode migrate --downgrade --to-version N --apply`: reverse path, only
  works if every migration on the path defines `invert`.

## Adding a New Migration

1. Branch from the current tip of `packages/soil`.
2. Bump `CURRENT_TASK_SCHEMA_VERSION` by exactly `1`.
3. Extend `TaskDocument` with the new field(s). Prefer additive changes:
   - Optional fields with a sensible default
   - Enum additions at the _end_ of the list (never in the middle — serialized
     old values must still decode)
4. Add `packages/soil/src/migrations/vN-to-vN+1.ts` with:
   - A short description sentence (will appear in migration traces)
   - A pure `apply` (and `invert` when possible)
   - At least one unit test asserting a round-trip and at least one negative
     test asserting `SoilValidationError` on malformed input
5. Update `packages/soil/src/migrations/registry.ts` to append the new
   migration.
6. Update this document's "Migration Log" below.
7. Bump the top-level soil package's semver **minor** for additive migrations;
   bump **major** only if the migration is destructive (fields retired, enums
   narrowed, etc.).

## Retired Field Handling

When a field is retired, the migration that retires it must:

1. Copy any meaningful data from the retired field into a new shape (or drop
   it, with the migration description spelling out the rationale).
2. Explicitly delete the field from the returned object, so subsequent writes
   do not re-emit it.

After the retirement migration ships, the parser's unknown-field preservation
logic adds the retired field to a `RETIRED_FIELDS` deny-list so it is not
round-tripped from files authored by even older agents.

## Migration Log

| Version | Landed | Summary                                                                                                                           |
| ------- | ------ | --------------------------------------------------------------------------------------------------------------------------------- |
| 1       | v0.1.0 | Initial schema: id, slug, title, status, type, priority, tags, created_at, updated_at, order, parent, blocking, blocked_by, body. |

(When we ship v2, append a row here and link to the specific migration file and
PR.)

## Testing

Every migration has:

1. **Round-trip tests** — `parse(raw) → migrate → render → parse → deep equal`.
2. **Fixture tests** — A golden fixture file under
   `packages/soil/src/migrations/__fixtures__/vN.yml` (pre-migration) and
   `__fixtures__/vN+1.yml` (post-migration). `runMigrations(vN) === vN+1`.
3. **Registry integrity tests** — Every consecutive pair of migrations must
   form an unbroken chain from `1` to `CURRENT_TASK_SCHEMA_VERSION`. The
   registry test fails at compile-time if a gap exists.
4. **Invariant tests** — After every migration, assert that `id`, `slug`, and
   `createdAt` are preserved byte-for-byte (these are file-identity fields).
5. **ETag-change tests** — Every successful migration bumps the file's ETag,
   so the reactor's optimistic concurrency picks up the write and consumers
   see a fresh document.

## CI

The soil test suite runs:

- `bun run --filter=@dinocode/soil test`
- A migration-only suite gated on `MIGRATIONS_EXHAUSTIVE=1` that loads every
  fixture under `packages/soil/src/migrations/__fixtures__/**` and asserts
  end-to-end round-trip.

## Related Documents

- [`packages/soil/README.md`](../packages/soil/README.md) — soil package overview
- `DINOCODE.md` §9.2 — Soil Package API
- Bean `dinocode-mdhg` — this doc's source-of-truth
