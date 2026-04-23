# Dinocode Package Architecture

**Status**: Active direction (2026-04-23)
**Owner**: Alex Heritier
**Scope**: All Dinocode-specific code additions to this fork

This document defines how Dinocode-specific features are structured in this
repository. Dinocode is a fork of [`pingdotgg/t3code`](https://github.com/pingdotgg/t3code),
and the cardinal rule of this fork is:

> **Dinocode additions live in standalone packages layered on top of t3code.
> Do not modify t3code internals unless it is strictly an integration point.**

Every Dinocode feature — soil, kanban, the CLI, agent tools, home agent — is a
package (or group of packages) with its own tests, exports, and release cadence.
`apps/web`, `apps/server`, and `apps/desktop` only _wire_ these packages in at
well-defined integration points.

## Why

1. **Upstream mergeability** — `git merge upstream/main` should almost never
   conflict. If we rewrite t3code's decider, projector, settings schema, or
   WebSocket router inline, every upstream change is a merge hazard.
2. **Clear ownership** — a package's `src/` directory answers "what is the
   Dinocode contribution here?" without requiring archaeology across
   `apps/web/src/components/**`.
3. **Reusability** — soil is already consumed by two surfaces (server
   orchestration + future CLI). Package boundaries make that explicit and
   cheap. The same will be true of the board UI and the task-orchestration
   layer.
4. **Forkability** — if we ever stop tracking t3code, standalone packages lift
   out with zero untangling. Inline edits would need a full extraction pass.

## Package Map

### Existing

| Package         | Responsibility                                                                                                 | Status   |
| --------------- | -------------------------------------------------------------------------------------------------------------- | -------- |
| `packages/soil` | Task domain: schemas, parser, renderer, decider, projector, reactor, watcher, migrations. Zero t3code imports. | Shipping |

### Planned

| Package                         | Responsibility                                                                                                                                                                                                                       | Extracted from                                                                                                                                                                                                                                                                 | Tracked by                                                                                                                                                               |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `packages/dinocode-contracts`   | Dinocode-owned RPC methods, schemas, and task event shapes. Layered over `@t3tools/contracts` via re-export, never inline mutations.                                                                                                 | `packages/contracts/src/orchestration.ts` (task schemas, 320+ lines), `rpc.ts`, `ipc.ts`, `baseSchemas.ts` additions in `b73bfd2c`.                                                                                                                                            | `dinocode-fm1h`                                                                                                                                                          |
| `packages/dinocode-server`      | Server-side task orchestration: the task decider/projector/invariants, the `ProjectionTasks` SQLite projection, the FileStore adapter, the watcher→orchestration bridge. Exposes Effect layers that `apps/server` mounts at startup. | `apps/server/src/orchestration/{commandInvariants,decider,projector}.ts` task additions, `apps/server/src/persistence/{Services,Layers}/ProjectionTasks.ts`, `apps/server/src/persistence/Migrations/026_ProjectionTasks.ts`, the task RPC methods in `apps/server/src/ws.ts`. | `dinocode-k7pm`                                                                                                                                                          |
| `packages/dinocode-board`       | Kanban UI as reusable components + hooks + route helpers. Consumes soil types and dinocode-contracts RPC; does not consume `apps/web` internals.                                                                                     | `apps/web/src/components/board/*`, `apps/web/src/routes/_chat.board.*.tsx`, `apps/web/src/rpc/boardState.ts`.                                                                                                                                                                  | `dinocode-up4r`                                                                                                                                                          |
| `packages/dinocode-cli`         | The `dinocode` CLI binary: `init`, `task …`, `migrate`, `doctor`.                                                                                                                                                                    | New.                                                                                                                                                                                                                                                                           | Existing beans: `dinocode-vaac`, `dinocode-l2ce`, `dinocode-3085`, `dinocode-e5he`, `dinocode-r354`, `dinocode-pr01`, `dinocode-lc1k`, `dinocode-7o6v`, `dinocode-imuw`. |
| `packages/dinocode-agent-tools` | Built-in task-aware tools (`dinocode_search_tasks`, `dinocode_update_task`, `dinocode_link_thread`, …) + adapter registration helpers.                                                                                               | `dinocode-ndam` proposes this already; reconfirm.                                                                                                                                                                                                                              | Existing beans: `dinocode-ndam`, `dinocode-ucr3`, `dinocode-2x6y`, `dinocode-j0z9`.                                                                                      |

### Non-packages (allowed t3code modifications)

| File(s)                                                                                                                                                                                                                                                                                      | Why it's allowed                                                                                                                                                                                                                          |
| -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `apps/desktop/resources/icon.*`, `apps/desktop/src/main.ts` icon resolution, `assets/macos/**`, `assets/dino-icon.png`                                                                                                                                                                       | Branding/personality. A fork's right.                                                                                                                                                                                                     |
| `apps/desktop/scripts/electron-launcher.mjs` (icon path)                                                                                                                                                                                                                                     | Same — branding.                                                                                                                                                                                                                          |
| `package.json` root name (`@dinocode/monorepo`)                                                                                                                                                                                                                                              | Identity of the monorepo.                                                                                                                                                                                                                 |
| `DINOCODE.md`, `docs/**`                                                                                                                                                                                                                                                                     | Dinocode-owned documentation.                                                                                                                                                                                                             |
| `.beans/**`, `.beans.yml`                                                                                                                                                                                                                                                                    | Task tracking; scheduled to migrate to `.dinocode/tasks/**` once dogfooded.                                                                                                                                                               |
| `apps/server/src/project/Layers/RepositoryIdentityResolver.ts`, `apps/web/src/components/settings/SettingsPanels*.tsx` (repositoryIdentityPreferredRemoteName), `apps/server/src/{cli,server}.ts` wiring, `packages/contracts/src/settings.ts` `repositoryIdentityPreferredRemoteName` field | This is a generic t3code feature enhancement (support origin vs upstream for repo identity), not a Dinocode-specific addition. It should be upstream-contribution candidates — tracked separately from the "must live in a package" rule. |

## Integration-Point Rules

When a Dinocode package _must_ be wired into t3code at a specific file, treat
the t3code-side edit as an **integration point**:

1. **Single call site** — the t3code-side edit should be _one line_ (ideally
   an import + call), with the actual logic in the Dinocode package. Example:
   `apps/server/src/server.ts` calls `withDinocodeServer(serverLayer)`; the
   composition lives in `@dinocode/server`.
2. **Named comment** — annotate the integration point:
   ```ts
   // dinocode-integration: <package> <feature>
   ```
   so `rg "dinocode-integration"` surfaces every coupling site at a glance.
3. **No new types in `@t3tools/contracts`** — new protocol surfaces live in
   `@dinocode/contracts`. If the protocol literally needs a new WebSocket
   method on the t3code RPC group, wire it at the router level (one method
   registration), but the schema stays in `@dinocode/contracts`.
4. **No new SQLite migrations in t3code's migration chain** — Dinocode's
   schema lives in `.dinocode/tasks/*.md` (source of truth) and in separate
   SQLite tables created by `@dinocode/server`. If we need SQLite storage, we
   either (a) ship a _separate_ SQLite database file owned by Dinocode, or
   (b) use a t3code migration id range reserved for dinocode (e.g. 1000+) so
   it's clear which migrations belong to us.
5. **No Dinocode fields in t3code's `ClientSettings` / `ServerSettings`** —
   Dinocode settings live in `@dinocode/contracts/settings` or in
   `.dinocode/config.yml`. Client-side preferences that don't need syncing go
   straight to `localStorage` under a `dinocode.*` key prefix.

## Refactor Plan (for existing coupling)

The commits below already introduced t3code-internal coupling. We keep them on
the default branch (they're shipping), but schedule extraction into packages as
first-class beans.

| Commit     | What's coupled                        | Extract to                                                 | Bean                              |
| ---------- | ------------------------------------- | ---------------------------------------------------------- | --------------------------------- |
| `b73bfd2c` | Server task orchestration + contracts | `packages/dinocode-server` + `packages/dinocode-contracts` | `dinocode-fm1h` + `dinocode-k7pm` |
| `69a3ae23` | Kanban UI in `apps/web`               | `packages/dinocode-board`                                  | `dinocode-up4r`                   |

Two cross-cutting guards also support the refactor:

- `dinocode-mzjt` — add `dinocode-integration:` comment annotations at every
  wire-up line in `apps/*` so the coupling surface is greppable.
- `dinocode-yr6l` — CI guard that flags new diffs landing in `apps/*` or
  `packages/contracts/*` unless the commit is labeled as an integration PR.

Integration points remain in `apps/server` and `apps/web`, but they shrink to
single-line imports of the packaged layers/components.

## Policy for new beans

Every new bean that implies a code change must answer:

- **Which package does the code live in?** (pick from the map above or propose
  a new one)
- **Where is the integration point in `apps/*`, if any?** (must be minimal)
- **Does this change any t3code schema?** (strongly prefer "no"; if "yes", file
  an upstream-contribution bean instead)

Beans that target `apps/server/src/…` or `apps/web/src/…` directly are
reviewed against this checklist during planning, not during implementation.

## Review checklist (pre-merge)

- [ ] Does `git diff upstream/main..HEAD --stat` show Dinocode additions
      primarily under `packages/dinocode-*/`?
- [ ] Do new files in `apps/*` consist only of package imports + wiring?
- [ ] Are new `packages/contracts/` fields justified as upstream-mergeable
      improvements, not Dinocode-specific?
- [ ] Does the PR description link the package(s) that own the new logic?

## Related

- `DINOCODE.md` §1 (mission & principles)
- `packages/soil/README.md` (reference standalone-package template)
- `docs/soil-migrations.md` (schema-evolution contract)
