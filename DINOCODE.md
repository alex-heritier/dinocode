# DINOCODE Specification

> **Status**: Draft v0.2  
> **Last updated**: 2026-04-22  
> **Scope**: Architecture, data model, and integration spec for combining t3code (agent GUI), cline/kanban (parallel task orchestration), and beans (flat-file in-repo task tracking) into a unified developer experience.

---

## 1. Vision

**Dinocode** is a minimal, fast, file-first web GUI for coding agents. It unifies three proven patterns:

1. **t3code** — A lightweight WebSocket server + React app for chatting with Codex, Claude, and other agents.
2. **cline/kanban** — A kanban board where every task card gets its own git worktree and terminal, enabling massive parallel agent execution.
3. **beans** — A flat-file issue tracker where tasks are Markdown files with YAML front matter, stored in-repo and version-controlled.

The result: a single interface where you can decompose work into tasks, watch agents execute them in parallel on isolated git worktrees, and have every task permanently tracked as a human-readable file inside your repo.

### Core Principles

1. **File-first**: Tasks live as files in the repo. The UI is a view over the filesystem. Agents and humans read/write the same Markdown files.
2. **Parallel by default**: Every task runs in its own git worktree. Agents never block each other.
3. **Minimal chrome**: The UI gets out of the way. Keyboard-driven, low latency, no modal fatigue.
4. **Agent-native**: The system is designed for agents to read and write tasks, not just humans.

### Canonical Data Model

The existing t3code architecture is **event-sourced** (SQLite `orchestration_events` table) with a **pure decider + projector** pattern. Dinocode does not replace this — it extends it:

- **Orchestration commands** (`task.create`, `task.update`, etc.) remain the entry point for all mutations.
- **SQLite event store** remains the canonical transaction log (fast, serialized, deduplicated via command receipts).
- **File Store reactor** writes task files to `.dinocode/tasks/*.md` after events are persisted.
- **File watcher** detects external edits (from agents or other processes) and dispatches them back into the orchestration engine as commands with ETag validation.

This means:

- The filesystem is the **agent-visible source of truth**.
- The SQLite event log is the **server-internal source of truth**.
- Both are kept in sync via reactors and watchers.

---

## 2. Architecture Overview

### 2.1 High-Level Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    Electron Main Process (Node.js)                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌─────────────┐ │
│  │  App Lifecycle│  │   Backend    │  │     IPC      │  │ Auto-Update │ │
│  │   & Menus    │  │   Spawner    │  │   Bridge     │  │   (Squirrel)│ │
│  └──────────────┘  └──────────────┘  └──────────────┘  └─────────────┘ │
│                         │                                               │
│              ELECTRON_RUN_AS_NODE child process                         │
│                         │                                               │
└─────────────────────────┼───────────────────────────────────────────────┘
                          │
┌─────────────────────────┴───────────────────────────────────────────────┐
│                        apps/server (Node.js/Bun)                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌─────────────┐ │
│  │ Orchestration│  │   Provider   │  │   FileStore  │  │  GitManager │ │
│  │   Engine     │  │   Adapters   │  │   (Beans)    │  │  (Kanban)   │ │
│  └──────────────┘  └──────────────┘  └──────────────┘  └─────────────┘ │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐                   │
│  │  Event Store │  │  PTY / Term  │  │   SQLite     │                   │
│  │   (t3code)   │  │   (Kanban)   │  │  (t3code)    │                   │
│  └──────────────┘  └──────────────┘  └──────────────┘                   │
└────────────────────┬────────────────────────────────────────────────────┘
                     │ Effect RPC over WebSocket
┌────────────────────┴────────────────────────────────────────────────────┐
│              Electron Renderer Process (Chromium)                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌─────────────┐ │
│  │   Chat UI    │  │ Kanban Board │  │   Terminal   │  │  Diff View  │ │
│  │  (React 19)  │  │  (React 19)  │  │   (xterm.js) │  │  (React 19) │ │
│  └──────────────┘  └──────────────┘  └──────────────┘  └─────────────┘ │
│                          Preload Script (contextBridge)                 │
└─────────────────────────────────────────────────────────────────────────┘
                     │ JSON-RPC over stdio
              ┌──────┴──────┐
              │ codex app-  │
              │   server    │
              └─────────────┘
```

### 2.2 Electron Desktop Architecture

The product ships as a **packaged Electron app** (`apps/desktop`). This is not a browser-hosted web app.

**Main process** (`main.ts`):

- Spawns the Node.js backend as a child process (`ELECTRON_RUN_AS_NODE=1`).
- Manages the backend lifecycle: port selection, bootstrap token, crash restart with exponential backoff.
- Provides native capabilities to the renderer via **contextBridge IPC**:
  - File picker dialogs (`desktop:pick-folder`)
  - Native context menus (`desktop:context-menu`)
  - Confirm dialogs (`desktop:confirm`)
  - Safe secret storage (`safeStorage` encrypt/decrypt)
  - External URL opening (`shell.openExternal`)
  - Theme sync (`nativeTheme`)
  - Auto-updater state machine (`electron-updater`)
- Registers a custom `t3://` protocol to serve the bundled web UI in production.
- Handles window management: hidden title bar (macOS `hiddenInset`, Windows `hidden`), traffic light positioning, dynamic theme colors.

**Renderer process** (`apps/web`):

- Loads the React app either from `VITE_DEV_SERVER_URL` (dev) or via the local backend HTTP URL (production).
- Communicates with the backend through **Effect RPC over WebSocket** — same as the web version, but the connection is always localhost.
- Receives desktop-specific state (update availability, server exposure mode) through IPC, not WebSocket.

**Preload script** (`preload.cjs`):

- Exposes a typed `window.electron` API via `contextBridge`.
- All desktop-native calls go through IPC; the renderer is sandboxed (`nodeIntegration: false`).

### 2.3 Layer Responsibilities

| Layer                 | Source      | Role                                                                                        |
| --------------------- | ----------- | ------------------------------------------------------------------------------------------- |
| **Desktop Main**      | t3code base | Electron main process. App lifecycle, menu bar, backend spawning, native IPC, auto-updates. |
| **Renderer UI**       | t3code base | React 19 + Vite + Tailwind inside Chromium. Chat, kanban, terminal, diffs. Zustand state.   |
| **WebSocket RPC**     | t3code base | Effect RPC over native WebSocket. Typed streaming. Auto-reconnect.                          |
| **Orchestration**     | t3code base | Event-sourced command/event processing. Pure decider + projector pattern.                   |
| **File Store**        | **beans**   | Reactor: writes `.dinocode/tasks/*.md` after events. Watcher: detects external edits.       |
| **Provider Adapters** | t3code base | Codex, Claude, Cursor, OpenCode adapters. Spawn stdio JSON-RPC or PTY.                      |
| **Git Manager**       | **kanban**  | Worktree creation, symlinking gitignored dirs, patch capture on trash, diff computation.    |
| **Terminal**          | **kanban**  | node-pty sessions per task. Multi-viewer WebSocket bridge with backpressure.                |
| **Event Store**       | t3code base | SQLite WAL event log for orchestration events. Projections for read models.                 |

### 2.4 Existing Codebase Realities

The following t3code infrastructure already exists and should be reused:

- **Effect-TS Layers** — `Layer.provideMerge` composition in `apps/server/src/server.ts`.
- **Event sourcing** — `decider.ts` (pure), `projector.ts` (SQLite + in-memory read model), `OrchestrationEngineService` (serialized dispatch queue).
- **Git worktrees** — `git.createWorktree`, `git.removeWorktree`, `Thread.worktreePath` already in contracts and server.
- **Terminals** — `TerminalManager` with multi-viewer support and backpressure already exists.
- **WebSocket RPC** — `WsRpcGroup` in `packages/contracts/src/rpc.ts` with streaming subscriptions.
- **Drag-and-drop** — `@dnd-kit/core` and `@dnd-kit/sortable` already in `apps/web/package.json`.
- **Dual-stream state** — `apps/web/src/store.ts` uses shell stream (sidebar) + detail stream (messages/activities). Board data follows the same pattern.
- **No barrel exports** — `packages/shared` uses explicit subpath exports (e.g. `@t3tools/shared/git`). Follow this for all new shared code.
- **Schema-only contracts** — `packages/contracts` must remain schema-only with no runtime logic.

---

## 3. File-First Task Model (Beans Integration)

### 3.1 Directory Structure

Every Dinocode-enabled repo contains a `.dinocode/` directory at its root:

```
<repo-root>/
  .dinocode/
    config.yml              # Project-level config (statuses, columns, providers)
    tasks/
      dnc-abc1--setup-auth.md
      dnc-xyz9--add-kanban-view.md
      archive/
        dnc-old1--spike-graphql.md
    plans/
      plan-001--march-refactor.md
    .gitignore              # Excludes .conversations/, .sessions/
    .conversations/         # Per-task agent chat logs (gitignored)
    .sessions/              # Runtime session state (gitignored)
```

### 3.2 Task File Format

Each task is a Markdown file with YAML front matter.

**Filename convention**: `{id}--{slug}.md`

Example: `dnc-0ajg--implement-oauth-flow.md`

**Content**:

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
assignee: agent:codex
branch: beans/dnc-0ajg
worktree: /Users/alex/.dinocode/worktrees/dinocode/dnc-0ajg
checkpoint_turn: 3
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

### 3.3 Task Schema

| Field             | Type       | Description                                                                   |
| ----------------- | ---------- | ----------------------------------------------------------------------------- |
| `id`              | `string`   | NanoID with `dnc-` prefix. Immutable.                                         |
| `slug`            | `string`   | URL-safe human-readable suffix.                                               |
| `title`           | `string`   | Short task name.                                                              |
| `status`          | `string`   | One of: `draft`, `backlog`, `in-progress`, `review`, `completed`, `scrapped`. |
| `type`            | `string`   | One of: `milestone`, `epic`, `bug`, `feature`, `task`, `spike`.               |
| `priority`        | `string`   | One of: `critical`, `high`, `normal`, `low`, `deferred`.                      |
| `tags`            | `string[]` | Lowercase, URL-safe.                                                          |
| `created_at`      | `ISO8601`  | Timestamp.                                                                    |
| `updated_at`      | `ISO8601`  | Auto-updated on mutation.                                                     |
| `order`           | `string`   | Fractional index for kanban column ordering.                                  |
| `parent`          | `string?`  | Parent task ID. Restricted by type (e.g., only `epic` can parent `task`).     |
| `blocking`        | `string[]` | IDs this task blocks.                                                         |
| `blocked_by`      | `string[]` | IDs blocking this task.                                                       |
| `assignee`        | `string?`  | `agent:<provider>` or `user:<name>`.                                          |
| `branch`          | `string?`  | Git branch name for this task.                                                |
| `worktree`        | `string?`  | Absolute path to the worktree.                                                |
| `checkpoint_turn` | `number?`  | Latest captured checkpoint turn.                                              |
| `body`            | `string`   | Markdown content after front matter.                                          |

### 3.4 Config Schema (`.dinocode/config.yml`)

```yaml
columns:
  - id: backlog
    title: Backlog
  - id: in-progress
    title: In Progress
  - id: review
    title: Review
  - id: completed
    title: Completed
    archive: true
  - id: scrapped
    title: Scrapped
    archive: true

status_map:
  draft: backlog
  backlog: backlog
  in-progress: in-progress
  review: review
  completed: completed
  scrapped: scrapped

providers:
  codex:
    binary: codex
    autonomous_flag: --dangerously-bypass-approvals-and-sandbox
  claude:
    binary: claude
    autonomous_flag: --dangerously-skip-permissions
  opencode:
    binary: opencode

git:
  worktree_base: ~/.dinocode/worktrees
  symlink_gitignored: true
```

### 3.5 Optimistic Concurrency

Every task file has an implicit ETag computed as an FNV-1a hash of its full rendered content. The orchestration engine validates ETags before writing to prevent clobbering concurrent edits from agents or other UI sessions.

---

## 4. Kanban Board Model (Kanban Integration)

### 4.1 Board as a Projection

The kanban board is **not** a separate data store. It is a **read-only projection** over the task files in `.dinocode/tasks/`.

- Columns map to `status` via `config.yml` → `status_map`.
- Card order within a column maps to the `order` fractional index.
- Dependencies (`blocking`/`blocked_by`) render as directed edges between cards.

This means:

- Moving a card to another column updates the task file's `status` field.
- Reordering cards updates `order` fields.
- All changes are immediately observable on disk and in git.

### 4.2 Board Data Structure (Runtime)

```typescript
type BoardColumn = {
  id: string; // matches status_map value
  title: string;
  cards: BoardCard[];
};

type BoardCard = {
  id: string; // task ID
  title: string;
  status: string;
  priority: string;
  type: string;
  tags: string[];
  assignee?: string;
  order: string;
  hasWorktree: boolean;
  sessionState: "idle" | "running" | "awaiting_review" | "failed" | "interrupted";
  latestHookActivity?: HookActivity;
  checkpointTurn?: number;
};

type BoardDependency = {
  id: string;
  fromTaskId: string; // dependent (usually backlog)
  toTaskId: string; // prerequisite
};
```

### 4.3 Dependency Automation

Dinocode implements kanban-style dependency chains:

1. **Linking**: Cmd/Ctrl + click on a card, then click a target card. Stores `blocking`/`blocked_by` in task files.
2. **Auto-start**: When a task in `review` is moved to `completed` (or auto-committed + trashed), the orchestration engine scans `blocked_by`. Any tasks whose blockers are all `completed` are automatically started.
3. **Auto-review**: Per-task `autoReview` flag. When the agent signals `to_review`, the system can auto-commit, auto-PR, or auto-move-to-completed based on configuration.

### 4.4 Sidebar Chat (Home Agent)

A dedicated non-board chat session (`__home_agent__:<projectId>`) acts as a task manager. It can:

- Create, update, link, and start tasks via injected CLI knowledge.
- Decompose large requests into subtasks.
- Never edits code directly — all implementation goes through task cards.

---

## 5. Session & Provider Model (t3code Base)

### 5.1 Thread → Task Mapping

In t3code, a **Thread** is a conversation with an agent. In Dinocode, threads are **bound to tasks**:

```
Project
├── Task (file on disk)
│   ├── Thread (chat history in SQLite + .conversations/)
│   ├── Session (provider runtime state)
│   ├── Turns (user↔agent work cycles)
│   ├── Checkpoints (git snapshots per turn)
│   └── Terminal (PTY session)
```

When a user hits "Play" on a kanban card:

1. Orchestration engine creates a git worktree for the task (if not exists).
2. A provider session is started (e.g., `codex app-server` JSON-RPC over stdio).
3. The task's `assignee` determines which provider binary to spawn.
4. Terminal output streams to the card's detail view.
5. Agent hook events (`to_review`, `activity`) update the task file's `status` and `checkpoint_turn`.

### 5.2 Turn Lifecycle

```
user dispatches thread.turn.start
  -> decider validates
  -> events: thread.turn-start-requested
  -> provider adapter starts session
  -> events: thread.session-set, thread.turn-running
  -> agent streams content/tool events
  -> agent signals to_review via hook
  -> events: thread.turn-awaiting-review, thread.checkpoint-captured
  -> user approves / rejects / sends follow-up
  -> events: thread.turn-completed or thread.turn-resumed
  -> checkpoint reactor captures git snapshot
```

### 5.3 Hook Integration

Dinocode reuses kanban's hook architecture, adapted for t3code's event sourcing:

- Each task worktree has `KANBAN_HOOK_TASK_ID`, `KANBAN_HOOK_PROJECT_ID`, and `KANBAN_HOOK_PORT` injected into the environment.
- Provider-specific hook configs are written before session start (same adapters as kanban: Cline bash hooks, Claude settings.json, Codex wrapper, etc.).
- Hook events are ingested via an internal HTTP endpoint (or CLI subcommand for portability) and translated into orchestration commands.

### 5.4 Checkpointing

Every turn boundary triggers a git checkpoint:

- Captures the task worktree state as a commit under `refs/dinocode/checkpoints/<taskId>/turn/<turn>`.
- UI can diff: working copy vs HEAD, or last turn vs previous turn.
- Checkpoints are cheap (tree reuse) and never pollute the main branch history.

---

## 6. Git Integration

### 6.1 Worktrees

Each active task gets an ephemeral git worktree:

- **Path**: `~/.dinocode/worktrees/<projectName>/<taskId>/`
- **Base**: Detached at the task's `baseRef` (default: current branch HEAD).
- **Symlinks**: Gitignored directories (e.g., `node_modules`) are symlinked from the main repo to avoid reinstalls. Turbopack projects copy instead.
- **Cleanup**: When a task is archived, the worktree is removed. A binary patch of all changes is saved to `~/.dinocode/trashed-patches/<taskId>.<commit>.patch` so work can be restored.

### 6.2 Branching

- Tasks may specify a `branch` field. If absent, Dinocode auto-creates `dinocode/<taskId>`.
- The home agent can be asked to "integrate" a task — squash-merge into the base ref, or open a PR.
- Git status (ahead/behind, dirty files) is displayed on each kanban card.

### 6.3 Repo-Local Task Storage

Because `.dinocode/tasks/` lives inside the repo:

- Tasks are version-controlled with the code.
- CI can read task files to generate changelogs or validate completion.
- Agents can read the full project backlog without API calls.
- No external issue tracker is required.

---

## 7. Data Flow

### 7.1 Creating a Task (Human)

1. User clicks "New Task" in kanban UI or types in sidebar chat.
2. Web app dispatches `task.create` orchestration command.
3. Server decider validates and emits `task.created` event.
4. Event is persisted to SQLite `orchestration_events`.
5. File Store reactor writes a new `.dinocode/tasks/<id>--<slug>.md` file.
6. Projector updates in-memory read model and `projection_tasks` SQLite table.
7. WebSocket stream pushes updated board projection to all clients.

### 7.2 Starting a Task (Agent)

1. User clicks "Play" on a kanban card.
2. Web app dispatches `thread.turn.start` with the task's thread ID.
3. Server ensures worktree exists (`git worktree add`) — reuses existing `GitCore` service.
4. Provider adapter resolves agent binary + args + hooks.
5. PTY session starts in the worktree directory — reuses existing `TerminalManager`.
6. Provider runtime events stream through `ProviderRuntimeIngestion`.
7. Hook events (`to_review`) trigger status file updates.
8. Orchestration events are persisted to SQLite event store.
9. Projector updates read models; WebSocket pushes to clients.

### 7.3 Editing a Task (External / Agent)

1. Agent (running in worktree) edits a task file directly, or calls `dinocode task update <id> --status review`.
2. File Store watcher detects the filesystem change.
3. File is parsed and validated against schema.
4. ETag is computed and compared to the last known version.
5. Orchestration command `task.update` is auto-dispatched with ETag validation.
6. Decider validates; events persisted to SQLite.
7. File Store reactor re-writes the file (idempotent if no changes).
8. Projector updates; clients refresh.

> **Important**: The file watcher is the _only_ path for external edits. Humans editing files in their editor go through the same flow as agents. This prevents the filesystem and SQLite from diverging.

---

## 8. UI/UX Design Direction

### 8.1 Layout

```
┌────────────────────────────────────────────────────────────┐
│  [Project]  [Branch ▾]  [New Task +]        [⚙] [👤]       │
├──────────┬─────────────────────────────────────────────────┤
│          │  Backlog  │ In Progress │ Review │ Completed    │
│ Sidebar  │  ┌─────┐  │  ┌─────┐    │ ┌────┐ │ ┌────┐      │
│  Chat    │  │TaskA│  │  │TaskB│    │ │TaskC│ │ │TaskD│     │
│  (Home   │  │ 🔵  │  │  │ 🟡  │    │ │ 🟢  │ │ │ ⚪  │     │
│   Agent) │  └─────┘  │  └─────┘    │ └────┘ │ └────┘      │
│          │           │             │        │             │
├──────────┴─────────────────────────────────────────────────┤
│  [Terminal] [Diff] [Files] [Chat]      [Commit] [Start ▶]  │
└────────────────────────────────────────────────────────────┘
```

### 8.2 Key Interactions

- **Kanban**: Drag-and-drop between columns (updates `status`). Drag to reorder (updates `order` fractional index).
- **Card click**: Opens detail panel with terminal, diff, file browser, and thread chat.
- **Cmd+click card**: Initiates dependency link draft.
- **Play button**: Starts agent session in worktree. Disabled if `blocked_by` has non-completed tasks.
- **Home chat**: Always available sidebar. Can create/link/start tasks via natural language.

### 8.3 Desktop-Native Behaviors

- **Native menus**: macOS app menu with "Check for Updates", "Settings" (`Cmd+,`), and standard Edit/Window/Help menus. Windows/Linux use auto-hide menu bar.
- **File dialogs**: Folder picker uses native `dialog.showOpenDialog` via IPC (`desktop:pick-folder`).
- **Context menus**: Right-click on cards, messages, or diff lines triggers native `Menu.buildFromTemplate` popups, including destructive actions with system icons (e.g., trash on macOS).
- **Theme sync**: Respects OS dark/light mode via `nativeTheme`. Title bar overlay colors and window background color update dynamically.
- **Window chrome**: Hidden title bar on macOS (`hiddenInset` with traffic lights at `{x: 16, y: 18}`) and Windows (`hidden` with custom symbol color). Minimum size 840×620.
- **Auto-updater**: Background update checks via `electron-updater`. Downloads are manual; install triggers app relaunch. Update state is pushed to all renderer windows via IPC.
- **Protocol handler**: Custom `t3://` scheme serves the bundled client in production. External links always open in the system browser (`shell.openExternal`).
- **Secret storage**: Credentials and environment secrets are encrypted with `safeStorage` (Keychain on macOS, DPAPI on Windows, libsecret on Linux).

### 8.4 Terminal

- xterm.js in the detail panel.
- Multi-viewer: multiple renderer windows (or tabs, if implemented) can watch the same PTY.
- Backpressure: pauses PTY if a viewer falls behind.
- Reconnect resilience: new windows receive a screen snapshot before live output.

### 8.5 Diff & Review

- Working copy diff vs base ref.
- Turn-by-turn diff using checkpoint refs.
- Inline commenting on diff lines → sends comment back to agent as user message.

---

## 9. API & Protocol

### 9.1 WebSocket RPC Methods

Dinocode extends t3code's existing Effect RPC schema with task-oriented methods. All new methods follow the existing `WsRpcGroup` pattern in `packages/contracts/src/rpc.ts`.

**Task commands** (dispatched via existing `orchestration.dispatchCommand`):

```typescript
type TaskCommand =
  | { type: 'task.create'; projectId: ProjectId; taskId: TaskId; title: string; status: TaskStatus; ... }
  | { type: 'task.update'; taskId: TaskId; expectedEtag?: string; patch: TaskPatch }
  | { type: 'task.delete'; taskId: TaskId }
  | { type: 'task.archive'; taskId: TaskId }
  | { type: 'task.unarchive'; taskId: TaskId }
  | { type: 'task.bind-thread'; taskId: TaskId; threadId: ThreadId };
```

**New subscription streams**:

```typescript
// Board subscription — pushes BoardSnapshot + BoardStreamEvent
orchestration.subscribeBoard({ projectId }): Stream<BoardStreamItem>;

// Task detail subscription — pushes TaskDetail + TaskEvent
orchestration.subscribeTask({ taskId }): Stream<TaskStreamItem>;
```

**Thread / session** (existing t3code, no changes):

```typescript
orchestration.subscribeThread({ threadId }): Stream<ThreadDetail>;
orchestration.dispatchCommand({ type: 'thread.turn.start', ... });
```

**Git** (existing t3code, reuse for tasks):

```typescript
// Already exists — just pass task's worktree path as `cwd`
git.createWorktree({ cwd, branch, newBranch });
git.removeWorktree({ cwd });

// New convenience methods
git.getTaskDiff({ taskId, mode: "working" | "turn" });
git.integrateTask({ taskId, mode: "squash" | "pr" });
```

**Terminal** (existing t3code, reuse for tasks):

```typescript
// Already exists — terminal is keyed by threadId, which is bound 1:1 to task
terminal.open({ threadId });
terminal.subscribe({ threadId }): Stream<TerminalEvent>;
```

### 9.2 File Store API (Server-Internal)

```typescript
interface FileStore {
  // Reads all tasks from .dinocode/tasks/ and builds index
  loadProject(workspaceRoot: string): Promise<TaskIndex>;

  // Writes a task file atomically with ETag check
  writeTask(task: Task, expectedEtag?: string): Promise<void>;

  // Watches .dinocode/tasks/ for external changes
  watchProject(workspaceRoot: string): Stream<FileChangeEvent>;
}
```

---

## 10. Storage & Persistence

| Data                     | Store                                      | Rationale                                      |
| ------------------------ | ------------------------------------------ | ---------------------------------------------- |
| **Task definitions**     | `.dinocode/tasks/*.md` (repo-local)        | Human-readable, git-tracked, agent-accessible. |
| **Task config**          | `.dinocode/config.yml` (repo-local)        | Per-project column/status/provider config.     |
| **Chat history**         | SQLite (`projection_thread_messages`)      | Fast querying, streaming, already in t3code.   |
| **Orchestration events** | SQLite (`orchestration_events`)            | Event sourcing backbone.                       |
| **Read models**          | SQLite projections                         | Fast board/card lookups.                       |
| **Agent conversations**  | `.dinocode/.conversations/*.jsonl`         | Optional long-term chat logs, gitignored.      |
| **Session runtime**      | `.dinocode/.sessions/*.json`               | Ephemeral provider resume state, gitignored.   |
| **Checkpoints**          | Git refs (`refs/dinocode/checkpoints/...`) | Durable, zero-cost diffs.                      |
| **Trashed patches**      | `~/.dinocode/trashed-patches/*.patch`      | Restore work from archived tasks.              |

---

## 11. Implementation Phases

### Phase 1: File Store Foundation

- [ ] Implement `FileStore` service in `apps/server/src/fileStore/` (follow Effect Layer pattern).
- [ ] Task parser: Markdown + YAML front matter → `Task` schema.
- [ ] Task writer: `Task` schema → Markdown file with ETag (FNV-1a of full rendered content).
- [ ] File watcher: `node:fs` watch on `.dinocode/tasks/` → auto-dispatch `task.update` commands.
- [ ] Add `task.*` commands/events to `packages/contracts/src/orchestration.ts`.
- [ ] Extend decider (`apps/server/src/orchestration/decider.ts`) with task command handling.
- [ ] Extend projector (`apps/server/src/orchestration/projector.ts`) with task event projection.
- [ ] Add invariants to `commandInvariants.ts` (requireTask, requireTaskAbsent, etc.).
- [ ] Add `projection_tasks` SQLite table (new migration `026_ProjectionTasks.ts`).
- [ ] Add `FileStoreReactor` (`apps/server/src/orchestration/Layers/FileStoreReactor.ts`) — writes files after events commit.

### Phase 2: Kanban Projection

- [ ] Extend `OrchestrationReadModel` with `tasks` array.
- [ ] Build board projector: read `projection_tasks` + `config.yml` → `BoardSnapshot`.
- [ ] Add `subscribeBoard` and `subscribeTask` RPC streams to `packages/contracts/src/rpc.ts`.
- [ ] Implement handlers in `apps/server/src/ws.ts`.
- [ ] React kanban board route: `apps/web/src/routes/_chat.board.$environmentId.$projectId.tsx`.
- [ ] React kanban board components (`apps/web/src/components/board/`):
  - `KanbanBoard.tsx`, `KanbanColumn.tsx`, `KanbanCard.tsx`, `TaskDetailPanel.tsx`.
- [ ] Drag-and-drop via existing `@dnd-kit/core` + `@dnd-kit/sortable`.
- [ ] Extend `EnvironmentState` in `apps/web/src/store.ts` with task slices (follow dual-stream pattern).
- [ ] Card detail panel shell (terminal, diff, files, chat tabs).

### Phase 3: Worktree & Terminal Binding

- [ ] Reuse existing `git.createWorktree` for task worktrees (`~/.dinocode/worktrees/<project>/<taskId>/`).
- [ ] Add `task_id` nullable column to `projection_threads`.
- [ ] Bind threads to tasks (1:1) via `thread.meta.update` or new `task.bind-thread` command.
- [ ] Auto-ensure worktree exists when `thread.turn.start` is dispatched for a task-bound thread.
- [ ] Terminal in detail panel — reuse existing `terminal.open` with task-derived `threadId`.
- [ ] Symlink gitignored dirs (`node_modules`) from main repo to worktree.

### Phase 4: Provider Integration

- [ ] Auto-spawn provider in task worktree on `thread.turn.start`.
- [ ] Inject hook environment: `KANBAN_HOOK_TASK_ID`, `KANBAN_HOOK_PROJECT_ID`, `KANBAN_HOOK_PORT`.
- [ ] Provider-specific hook configs (Cline bash hooks, Claude settings.json, Codex wrapper).
- [ ] Hook ingest endpoint/CLI → `task.update` orchestration commands.
- [ ] Checkpointing on turn boundaries — reuse existing `CheckpointReactor`.

### Phase 5: Automation

- [ ] Dependency linking UI (`blocking`/`blocked_by`) — Cmd+click card → target card.
- [ ] Auto-start logic: when blockers all `completed`, auto-dispatch `thread.turn.start`.
- [ ] Auto-review modes (commit / PR / complete) per `autoReview` flag.
- [ ] Sidebar home agent (`__home_agent__:<projectId>`) with injected task management prompts.

### Phase 6: Polish

- [ ] Diff viewer with inline commenting.
- [ ] Git integration panel (history, branches, push/pull).
- [ ] Import/export from external trackers (GitHub Issues, Linear).
- [ ] Mobile-responsive kanban.

---

## 12. Decisions & Open Questions

### Resolved

1. **SQLite vs filesystem canonical?**
   **Resolved**: Keep SQLite `orchestration_events` as the canonical transaction log (fast, serialized, deduplicated). The File Store reactor writes to `.dinocode/tasks/*.md` after every task event. A file watcher detects external edits and re-ingests them as `task.update` commands with ETag validation. This satisfies the "file-first" principle (agents see human-readable files) without replacing the proven event-sourcing backbone.

2. **How do we handle merge conflicts when both an agent and a human edit the same task file?**
   **Resolved**: ETag optimistic concurrency. The ETag is an FNV-1a hash of the full rendered Markdown content. If the file on disk has changed since the last read, the auto-dispatched `task.update` command fails validation and the server emits a `task.conflict` event. The UI shows a three-way merge view (base / local / remote).

3. **Should `.dinocode/` be auto-initialized when a user opens a repo without it?**
   **Resolved**: Yes. The web UI detects missing `.dinocode/config.yml` and shows a one-click "Initialize Dinocode for this project" banner. Initialization creates the directory structure, default config, and an initial `.gitignore`.

4. **How do we support non-git repos?**
   **Resolved**: Task files work everywhere. Worktrees and checkpointing are silently disabled when `git` is unavailable. Agents run in the main repo directory. The UI shows a "Git not available" indicator instead of worktree-related actions.

5. **What is the migration path from t3code's existing thread-centric model to task-centric?**
   **Resolved**: Threads without tasks become "ad-hoc tasks" with auto-generated `.dinocode/tasks/*.md` files (using a derived slug from the thread title). Existing SQLite data is preserved via projection migration. The `projection_threads` table gains a nullable `task_id` column. Over time, users can promote ad-hoc tasks to fully-specified tasks.

### Open

6. **Should the board projection live in the shell stream or a separate stream?**
   _Tentative_: Separate `subscribeBoard` stream, but the shell stream should include minimal task metadata (counts per status) so the sidebar can show badges without subscribing to the full board.

7. **How do we handle task file renames (slug changes) while preserving event history?**
   _Tentative_: The task `id` (e.g. `dnc-0ajg`) is immutable and used for the event stream. The filename slug is purely cosmetic; renames are handled by deleting the old file and writing a new one in the File Store reactor, without emitting a task event.

8. **Should archived tasks be moved to `.dinocode/tasks/archive/` or stay in place with an `archived` status?**
   _Tentative_: Move to `archive/` subfolder. The file watcher treats moves as implicit status changes (orchestration dispatches `task.archive` on move-in, `task.unarchive` on move-out).

---

## 13. Integration Patterns (How to Add New Features)

The codebase follows strict conventions. New features must adhere to these patterns:

### Server Pattern (Effect-TS)

1. **Define contracts first** in `packages/contracts/src/`:
   - Schema types using `effect/Schema`
   - RPC definitions using `effect/unstable/rpc`
   - Add to `ORCHESTRATION_WS_METHODS` and `WS_METHODS`
   - Register in `WsRpcGroup`

2. **Add migration** in `apps/server/src/persistence/Migrations/`:
   - Statically import in `Migrations.ts`
   - Create projection tables for read models
   - Use `effect/unstable/sql/SqlClient`

3. **Add decider logic** in `apps/server/src/orchestration/decider.ts`:
   - Handle new command types in `decideOrchestrationCommand`
   - Validate invariants in `commandInvariants.ts` (never skip this)

4. **Add projector logic** in `apps/server/src/orchestration/projector.ts`:
   - Update `OrchestrationReadModel`
   - Update SQLite projection tables
   - Handle both insert and update paths (idempotent)

5. **Add reactor** (if side effects needed):
   - Define interface in `Services/MyReactor.ts`
   - Implement in `Layers/MyReactor.ts`
   - Register in `OrchestrationReactor.ts` startup sequence

6. **Add RPC handlers** in `apps/server/src/ws.ts`:
   - Inside `makeWsRpcLayer`, add methods to `WsRpcGroup.of({})`
   - Use `observeRpcEffect` for one-shot, `observeRpcStreamEffect` for streams

7. **Wire layers** in `apps/server/src/server.ts`:
   - Add `Layer.provideMerge(MyLayerLive)` to `RuntimeDependenciesLive`

### Web Pattern

1. **Add route** in `apps/web/src/routes/`:
   - Use `createFileRoute` from TanStack Router
   - Follow `_chat.` prefix for authenticated routes
   - Register in route tree (auto-generated via `routeTree.gen`)

2. **Add components** in `apps/web/src/components/`:
   - Use existing UI primitives from `components/ui/`
   - Use Tailwind for styling
   - Keep files <500 LOC; split aggressively

3. **Extend store** in `apps/web/src/store.ts`:
   - Add new state slices to `EnvironmentState`
   - Add sync/apply reducer functions (follow dual-stream pattern)
   - Use structural equality checks to prevent unnecessary re-renders

4. **Add RPC hooks** in `apps/web/src/rpc/`:
   - Use TanStack Query or Effect atoms for subscription management
   - Follow existing patterns in `serverState.ts` or `orchestrationEventEffects.ts`

### Testing

- Decider logic: add tests in `apps/server/src/orchestration/decider.test.ts` (or adjacent to the feature)
- File Store: add tests in `apps/server/src/fileStore/fileStore.test.ts`
- Web components: use Vitest with `@testing-library/react`
- Integration: use existing `OrchestrationEngineHarness.integration.ts`

---

## 14. Appendix: Reference Repos

| Repo         | URL                                         | Role                                                              |
| ------------ | ------------------------------------------- | ----------------------------------------------------------------- |
| t3code       | `https://github.com/pingdotgg/t3code`       | Base architecture, WebSocket server, React UI, event sourcing.    |
| cline/kanban | `https://github.com/cline/kanban`           | Kanban board, worktrees, PTY terminals, hooks, dependency chains. |
| hmans/beans  | `https://github.com/hmans/beans`            | Flat-file task format, Markdown+YAML schema, in-repo persistence. |
| Codex        | `https://github.com/openai/codex`           | Provider reference.                                               |
| CodexMonitor | `https://github.com/Dimillian/CodexMonitor` | Feature-complete reference for Codex app-server UX.               |
