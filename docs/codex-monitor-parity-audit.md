# CodexMonitor Parity Audit

**Status**: Completed 2026-04-23
**Owner**: dinocode-q22h

CodexMonitor (https://github.com/Dimillian/CodexMonitor) is a Tauri-based Codex
orchestration app referenced in `AGENTS.md` as a strong implementation baseline.
This document enumerates CodexMonitor features, maps them to the current
Dinocode implementation, and calls out the gaps we intend to close vs. the ones
we intentionally leave out of scope.

The audit is intentionally _feature-level_; UX polish and copy differences
belong in their own beans.

## Methodology

1. Read the CodexMonitor README (features, IPC surface, project structure).
2. Cross-reference each feature with `apps/web/src/components/`,
   `apps/server/src/`, and `apps/desktop/src/` in this repo.
3. Classify each feature as: **Parity** (already shipped), **Planned** (already
   an open bean), **Gap** (file a new bean), **Out of scope** (intentionally
   not adopted with rationale).

## Feature Matrix

### Workspaces & Threads

| CodexMonitor feature                   | Dinocode status                                                         | Classification |
| -------------------------------------- | ----------------------------------------------------------------------- | -------------- |
| Add/persist workspaces, group/sort     | `AppSidebarLayout.tsx`, `sidebarProjectGroupingMode` setting            | Parity         |
| Home dashboard / quick actions         | `__home_agent__` sidebar session (dinocode-nqra) + home recommendations | Planned        |
| One `codex app-server` per workspace   | `packages/effect-codex-app-server` + server orchestration               | Parity         |
| Resume threads, unread/running state   | Thread orchestration + shell stream                                     | Parity         |
| Worktree/clone agents (isolated work)  | Existing worktree support for agent sessions                            | Parity         |
| Pin / rename / archive / copy thread   | Thread actions (`useThreadActions.ts`)                                  | Parity         |
| Per-thread drafts                      | `composerDraftStore.ts`                                                 | Parity         |
| Stop / interrupt in-flight turns       | Thread actions + turn interrupt                                         | Parity         |
| Optional remote backend (daemon) mode  | Saved environment registry + remote WS endpoints                        | Parity         |
| Tailscale detection / daemon bootstrap | —                                                                       | Out of scope   |

### Composer & Agent Controls

| CodexMonitor feature                                 | Dinocode status                       | Classification |
| ---------------------------------------------------- | ------------------------------------- | -------------- |
| Image attachments (picker, drag/drop, paste)         | Composer already supports attachments | Parity         |
| Queue vs Steer follow-up, per-turn override shortcut | —                                     | **Gap**        |
| `@` file autocomplete                                | `composer-editor-mentions.ts`         | Parity         |
| `/` command autocomplete (prompts, reviews)          | Slash commands in composer            | Parity         |
| `$` skills autocomplete                              | —                                     | **Gap**        |
| Model picker + reasoning effort + access mode        | BranchToolbar + model settings        | Parity         |
| Collaboration modes                                  | Codex model options                   | Parity         |
| Context usage ring                                   | —                                     | **Gap**        |
| Dictation (hold-to-talk + Whisper waveform)          | —                                     | Out of scope   |
| Reasoning / tool / diff item rendering               | ChatMarkdown + reasoning rendering    | Parity         |
| Approval prompts                                     | Approval handling in orchestration    | Parity         |

### Git & GitHub

| CodexMonitor feature                               | Dinocode status                          | Classification |
| -------------------------------------------------- | ---------------------------------------- | -------------- |
| Diff stats, staged/unstaged diffs                  | `DiffPanel.tsx`                          | Parity         |
| Revert/stage/commit/push/pull                      | `GitActionsControl.tsx` + server git RPC | Parity         |
| Branch list + checkout/create + ahead/behind       | `BranchToolbar.tsx`                      | Parity         |
| GitHub Issues list via `gh`                        | —                                        | **Gap**        |
| GitHub PR list + diff + comments via `gh`          | —                                        | **Gap**        |
| "Ask PR" — send PR context into a new agent thread | —                                        | **Gap**        |
| Commit log viewer                                  | —                                        | **Gap**        |

### Files & Prompts

| CodexMonitor feature                              | Dinocode status        | Classification |
| ------------------------------------------------- | ---------------------- | -------------- |
| File tree with search + reveal in Finder/Explorer | Basic file tree exists | Parity         |
| Prompt library (global/workspace)                 | —                      | **Gap**        |
| Run prompt in current/new thread                  | —                      | **Gap**        |

### UI & Experience

| CodexMonitor feature                               | Dinocode status                                    | Classification                              |
| -------------------------------------------------- | -------------------------------------------------- | ------------------------------------------- |
| Resizable sidebar/right/plan/terminal/debug panels | Resizable panels with persisted sizes              | Parity                                      |
| Responsive layouts (desktop/tablet/phone)          | —                                                  | Out of scope (initial)                      |
| Sidebar usage + credits meter                      | —                                                  | **Gap**                                     |
| Terminal dock with tabs                            | `ThreadTerminalDrawer` (single drawer, not tabbed) | Partial — Gap for tabbed multi-terminal     |
| In-app updates + toast-driven install              | —                                                  | Out of scope (covered by OS update channel) |
| Sound notifications                                | System notification mirror (dinocode-a768)         | Planned                                     |
| Platform window effects (macOS vibrancy)           | —                                                  | Out of scope                                |
| Reduced-transparency toggle                        | —                                                  | Out of scope                                |
| iOS support                                        | —                                                  | Out of scope                                |

## Gaps filed as new beans

The following concrete gaps were filed as follow-up beans under their
appropriate epics. All are **normal** or **low** priority — none block Dinocode
v0.1.

| Bean          | Priority | Gap                                                                                                      |
| ------------- | -------- | -------------------------------------------------------------------------------------------------------- |
| dinocode-50yd | normal   | Composer: Queue vs Steer follow-up behavior + shortcut to send the opposite action for one message       |
| dinocode-ewuu | normal   | GitHub integration parity: Issues + PRs + diff + comments via `gh`, "Ask PR → new thread"                |
| dinocode-j9i1 | normal   | Prompt library (global + workspace): list / create / edit / delete / move / run in current or new thread |
| dinocode-8p7z | low      | Context usage ring in the composer toolbar                                                               |
| dinocode-90rk | low      | Tabbed multi-terminal dock (extend ThreadTerminalDrawer)                                                 |
| dinocode-94q9 | low      | Sidebar usage + credits meter snapshot                                                                   |
| dinocode-57a1 | low      | `$` skills autocomplete in the composer                                                                  |
| dinocode-d1ot | low      | Commit log viewer in the git panel                                                                       |

## Intentionally out-of-scope

| Feature                                      | Rationale                                                                                                                     |
| -------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| Dictation / Whisper                          | Dinocode's agent-native posture makes text input the primary surface; audio is better left to the OS / dedicated apps.        |
| Tailscale helper + daemon UI                 | Remote backend is supported through the saved environment registry; Tailscale discovery is a niche that can live outside.     |
| iOS app + remote-only flows                  | Dinocode targets local desktop + headless server; a future mobile companion would use a generic web client, not a native app. |
| macOS vibrancy + reduced-transparency toggle | Base UI uses standard Electron chrome with Tailwind theming; native window-effect APIs aren't a product priority.             |
| In-app update installer                      | Dinocode relies on the OS-native desktop update channel and on `bun`/Homebrew for the CLI.                                    |
| Responsive tablet/phone layouts              | Target form factor for v0.1–v0.3 is the desktop 14"–34" range; mobile layouts are deferred to a post-v0.3 discussion.         |

## Re-audit cadence

Re-run this audit when any of the following happens:

- A CodexMonitor release adds a major new feature surface (check the project's
  CHANGELOG quarterly).
- We finish one of the filed gap beans — update the matrix row from **Gap** to
  **Parity** as part of the closing PR.
- A new Dinocode-only surface emerges (e.g. dedicated kanban, `.dinocode/tasks/`
  editor) that has no CodexMonitor counterpart — these live in their own epic
  rather than in this matrix.
