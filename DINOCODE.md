# DINOCODE Specification

> **Status**: Draft v0.2  
> **Last updated**: 2026-04-22 (revised for Soil architecture)  
> **Scope**: Architecture, data model, and integration spec for combining t3code (agent GUI), cline/kanban (parallel task orchestration), and beans (flat-file in-repo task tracking) into a unified developer experience.

---

## 1. Vision

**Dinocode** is a minimal, fast, file-first web GUI for coding agents. It unifies three proven patterns:

1. **t3code** — A lightweight WebSocket server + React app for chatting with Codex, Claude, and other agents.
2. **cline/kanban** — A kanban board for managing tasks with dependency chains and parallel execution visuals.
3. **beans** — A flat-file issue tracker where tasks are Markdown files with YAML front matter, stored in-repo and version-controlled.

The result: a single interface where you can decompose work into tasks, manage them on a kanban board, and use them as context for AI agent sessions — with every task permanently tracked as a human-readable file inside your repo.

### Core Principles

1. **File-first**: Tasks live as files in the repo. The UI is a view over the filesystem. Agents and humans read/write the same Markdown files.
2. **Parallel by default**: Tasks are independent. Multiple agents can reference different tasks simultaneously without blocking each other.
3. **Minimal chrome**: The UI gets out of the way. Keyboard-driven, low latency, no modal fatigue.
4. **Agent-native**: The system is designed for agents to read and write tasks, not just humans.
5. **Standalone packages on top of t3code**: This repo is a fork of [`pingdotgg/t3code`](https://github.com/pingdotgg/t3code). Every Dinocode feature lives in a standalone package (`packages/soil`, `packages/dinocode-*`) and plugs into `apps/web`, `apps/server`, and `apps/desktop` at minimal integration points. We do not rewrite t3code internals. See [`docs/dinocode-packages.md`](docs/dinocode-packages.md) for the package map and coupling rules.

### Canonical Data Model

The existing t3code architecture is **event-sourced** (SQLite `orchestration_events` table) with a **pure decider + projector** pattern. Dinocode does not replace this — it extends it with a reusable task-domain package:

- **Orchestration commands** (`task.create`, `task.update`, etc.) remain the entry point for all mutations.
- **SQLite event store** remains the canonical transaction log (fast, serialized, deduplicated via command receipts).
- **`packages/soil`** owns the task domain: schemas, parsing, rendering, ETag handling, fractional ordering, pure decider/projector logic, and filesystem reactor utilities.
- **Server adapter + File Store reactor** use `packages/soil` to write task files to `.dinocode/tasks/*.md` after events are persisted.
- **File watcher** uses `packages/soil` parsing and validation, then dispatches external edits back into the orchestration engine as commands with ETag validation.

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
│  │ Orchestration│  │   Provider   │  │ Soil Adapter │  │  GitManager │ │
│  │   Engine     │  │   Adapters   │  │ + FileStore  │  │  (Kanban)   │ │
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

The product ships as a **packaged Electron app** (`apps/desktop`). The server also serves the React app over HTTP for local development and local CLI-driven workflows, but the Electron desktop build is the primary target.

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

| Layer                 | Source            | Role                                                                                        |
| --------------------- | ----------------- | ------------------------------------------------------------------------------------------- |
| **Desktop Main**      | t3code base       | Electron main process. App lifecycle, menu bar, backend spawning, native IPC, auto-updates. |
| **Renderer UI**       | t3code base       | React 19 + Vite + Tailwind inside Chromium. Chat, kanban, terminal, diffs. Zustand state.   |
| **WebSocket RPC**     | t3code base       | Effect RPC over native WebSocket. Typed streaming. Auto-reconnect.                          |
| **Orchestration**     | t3code base       | Event-sourced command/event processing. Persists canonical events and streams projections.  |
| **Task Domain**       | **packages/soil** | Shared task-domain package: schemas, parser/writer, ETags, decider, projector, reactor.     |
| **File Store**        | server + soil     | Thin server adapter around soil. Watches and writes `.dinocode/tasks/*.md`.                 |
| **Provider Adapters** | t3code base       | Codex, Claude, Cursor, OpenCode adapters. Spawn stdio JSON-RPC or PTY.                      |
| **Git Manager**       | **t3code base**   | Worktree creation, symlinking gitignored dirs, diff computation. General agent session use. |
| **Terminal**          | **t3code base**   | node-pty sessions per thread. Multi-viewer WebSocket bridge with backpressure.              |
| **Event Store**       | t3code base       | SQLite WAL event log for orchestration events. Projections for read models.                 |

### 2.4 Existing Codebase Realities

The following t3code infrastructure already exists and should be reused:

- **Effect-TS Layers** — `Layer.provideMerge` composition in `apps/server/src/server.ts`.
- **Event sourcing** — `decider.ts` (pure), `projector.ts` (SQLite + in-memory read model), `OrchestrationEngineService` (serialized dispatch queue).
- **Git worktrees** — `git.createWorktree`, `git.removeWorktree` already exist for general agent session use (not task-bound).
- **Terminals** — `TerminalManager` with multi-viewer support and backpressure already exists.
- **WebSocket RPC** — `WsRpcGroup` in `packages/contracts/src/rpc.ts` with streaming subscriptions.
- **Drag-and-drop** — `@dnd-kit/core` and `@dnd-kit/sortable` already in `apps/web/package.json`.
- **Dual-stream state** — `apps/web/src/store.ts` uses shell stream (sidebar) + detail stream (messages/activities). Board data follows the same pattern.
- **No barrel exports** — `packages/shared` uses explicit subpath exports (e.g. `@t3tools/shared/git`). Follow this for all new shared code.
- **Schema-only contracts** — `packages/contracts` must remain schema-only with no runtime logic.

New Dinocode-specific shared task logic should live in `packages/soil` and expose explicit subpath exports as well. The server and CLI consume soil; they should not reimplement task parsing, projection, or ETag logic independently.

---

## 3. File-First Task Model (Beans Integration)

### 3.1 Directory Structure

Every Dinocode-enabled repo contains a `.dinocode/` directory at its root:

```
<repo-root>/
  .dinocode/
    config.yml              # Project-level config (statuses, columns)
    tasks/
      dnc-abc1--setup-auth.md
      dnc-xyz9--add-kanban-view.md
      archive/
        dnc-old1--spike-graphql.md
    plans/
      plan-001--march-refactor.md
    .gitignore              # Excludes .conversations/, .sessions/
    .conversations/         # Agent chat logs (gitignored)
    .sessions/              # Runtime session state (gitignored)
```

### 3.2 Task File Format

Each task is a Markdown file with YAML front matter, stored in `.dinocode/tasks/`. The format aligns with [beans](https://github.com/hmans/beans) so agents already familiar with beans can read and write Dinocode tasks without learning a new schema. Parsing, rendering, validation, and migrations for this format are implemented in `packages/soil`.

**Filename convention**: `{prefix}{id}--{slug}.md`

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

| Field        | Type       | Description                                                                              |
| ------------ | ---------- | ---------------------------------------------------------------------------------------- |
| `id`         | `string`   | NanoID with configurable prefix (default: `dnc-`). Derived from filename.                |
| `slug`       | `string`   | URL-safe human-readable suffix. Derived from filename.                                   |
| `title`      | `string`   | Short task name.                                                                         |
| `status`     | `string`   | One of: `in-progress`, `todo`, `draft`, `completed`, `scrapped`.                         |
| `type`       | `string`   | One of: `milestone`, `epic`, `bug`, `feature`, `task`.                                   |
| `priority`   | `string`   | One of: `critical`, `high`, `normal`, `low`, `deferred`.                                 |
| `tags`       | `string[]` | Lowercase, start with letter, letters/numbers/hyphens only.                              |
| `created_at` | `ISO8601`  | Timestamp.                                                                               |
| `updated_at` | `ISO8601`  | Auto-updated on mutation.                                                                |
| `order`      | `string`   | Fractional index for kanban column ordering.                                             |
| `parent`     | `string?`  | Parent task ID. Restricted by type (e.g., only `epic` can parent `task`).                |
| `blocking`   | `string[]` | IDs this task blocks.                                                                    |
| `blocked_by` | `string[]` | IDs blocking this task.                                                                  |
| `body`       | `string`   | Markdown content after front matter (description, acceptance criteria, notes, subtasks). |

**Schema notes**:

- `id` is written as a YAML comment (`# dnc-0ajg`) inside the front matter, not as a field. This matches beans' convention.
- Subtasks are represented as separate task files with a `parent` reference. The body of a parent task may also contain a checklist of subtask IDs for quick reference.
- `claimed` is not a separate status; a claimed task moves to `in-progress`. The kanban UI may display the claimer's name on an `in-progress` card.

### 3.4 Config Schema (`.dinocode/config.yml`)

Aligns with beans' `.beans.yml`. All fields are optional; defaults are shown below.

Project-level config (repo-local, shared by the team):

```yaml
# Dinocode configuration
# See: https://github.com/pingdotgg/t3code
project:
  # Human-readable project name (displayed in the UI)
  name: my-project

tasks:
  # Directory where task files are stored
  path: .dinocode/tasks
  # Prefix for task IDs (e.g., "dnc-0ajg")
  prefix: dnc-
  # Length of the random ID suffix
  id_length: 4
  # Default status for new tasks
  default_status: todo
  # Default type for new tasks
  default_type: task

# Note: statuses and types are hardcoded (same as beans) and not configurable.
# Statuses: in-progress, todo, draft, completed, scrapped
# Types: milestone, epic, bug, feature, task
```

User-level config (`~/.dinocode/config.yml`, not tracked in git):

```yaml
providers:
  codex:
    binary: codex
    autonomous_flag: --dangerously-bypass-approvals-and-sandbox
  claude:
    binary: claude
    autonomous_flag: --dangerously-skip-permissions
  opencode:
    binary: opencode
```

### 3.5 Optimistic Concurrency

Every task file has an implicit ETag computed as an FNV-1a hash of its full rendered content. The orchestration engine validates ETags before writing to prevent clobbering concurrent edits from agents or other UI sessions.

**ETag serialization rules** (must be deterministic across platforms):

- Content is encoded as UTF-8.
- Line endings are normalized to LF (`\n`) before hashing.
- Front matter fields are written in a fixed alphabetical order.
- Array values are serialized as YAML flow style (`[a, b]`) with a single space after commas.
- Empty optional fields are omitted entirely (not written as `null` or `~`).

---

## 4. Kanban Board Model (Kanban Integration)

### 4.1 Board as a Projection

The kanban board is **not** a separate data store. It is a **read-only projection** over the task files in `.dinocode/tasks/`.

- Columns map directly to `status` values (hardcoded: `in-progress`, `todo`, `draft`, `completed`, `scrapped`).
- Card order within a column maps to the `order` fractional index.
- Dependencies (`blocking`/`blocked_by`) render as directed edges between cards.

This means:

- Moving a card to another column updates the task file's `status` field.
- Reordering cards updates `order` fields.
- All changes are immediately observable on disk and in git.

### 4.2 Board Data Structure (Runtime)

```typescript
type BoardColumn = {
  id: string; // matches a status name
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
  order: string;
  // UI-only: who claimed this task (derived from inline comment or body mention)
  claimedBy?: string;
};

type BoardDependency = {
  id: string;
  fromTaskId: string; // dependent
  toTaskId: string; // prerequisite
};
```

### 4.3 Dependency Automation

Dinocode implements kanban-style dependency chains:

1. **Linking**: Cmd/Ctrl + click on a card, then click a target card. Stores `blocking`/`blocked_by` in task files.
2. **Unblock notifications**: When a task's status transitions to `completed` or `scrapped`, the system scans `blocked_by` on all tasks in the same project. Any task whose blockers are now all resolved is surfaced in the UI (e.g., a badge on the card or a toast notification). The system does **not** automatically start agent sessions; the user decides when to act on unblocked work.
3. **Subtask completion**: When all children of a parent task reach `completed`, the UI may prompt to move the parent to `completed` as well.

### 4.4 Sidebar Chat (Home Agent)

A dedicated non-board chat session (`__home_agent__:<projectId>`) acts as a task manager. It can:

- Create, update, link, and start tasks via injected CLI knowledge.
- Decompose large requests into subtasks.
- Never edits code directly — all implementation goes through task cards.

---

## 5. Session & Provider Model (t3code Base)

### 5.1 Tasks and Agents are Separate

**Tasks** and **agent sessions** are independent systems that can optionally interact:

```
Project
├── Tasks (flat files in .dinocode/tasks/)
│   ├── Kanban board (UI projection)
│   └── Dependencies, subtasks, status
│
└── Threads (agent conversations in SQLite)
    ├── Session (provider runtime state)
    ├── Turns (user↔agent work cycles)
    └── Terminal (PTY session)
```

There is **no 1:1 binding** between tasks and threads. A thread may reference zero, one, or many tasks for context. A task may be referenced by zero or many threads over its lifetime.

### 5.2 Using Task Context in an Agent Session

When starting an agent session, the user may optionally select one or more tasks to inject as context. The task's title, description, acceptance criteria, and current status are appended to the system prompt or first user message.

Example context injection:

```
You are working on the following task:

[dnc-0ajg] Implement OAuth flow
Status: in-progress
Type: task
Priority: high

## Goal
Add GitHub OAuth login to the desktop app.

## Acceptance Criteria
- [x] OAuth callback endpoint
- [ ] Session persistence
- [ ] Logout flow

## Notes
The provider adapter already supports token exchange. We just need the UI flow.
```

**Ways to start a session with task context**:

1. Click "Start Session" on a kanban card → opens a new thread with that task's context pre-loaded.
2. In an existing thread, mention a task ID (e.g., `@dnc-0ajg`) → the UI offers to inject that task's context into the next turn.
3. The home agent can recommend tasks and start sessions with them.

### 5.3 Agent Tools for Task Interaction

Agents (both in-app and external) interact with tasks through a **hybrid tool model**:

**Primary: CLI (`dinocode task ...`)**

- `dinocode task list [--status <status>] [--type <type>]` — list tasks
- `dinocode task view <id>` — view task details
- `dinocode task create --title "..." [--status todo] [--type task]` — create a task
- `dinocode task update <id> --status in-progress [--title "..."]` — update a task
- `dinocode task delete <id>` — delete a task
- `dinocode task archive <id>` — archive a task
- `dinocode task link <from-id> <to-id>` — add blocker relationship
- `dinocode task unlink <from-id> <to-id>` — remove blocker relationship

These commands use `packages/soil` directly to read/write `.dinocode/tasks/*.md`. The file watcher detects changes and re-ingests them into the kanban projection.

**Secondary: Built-in Tools (in-app agents only)**
For agents running inside t3code's provider adapters (Codex, Claude), we also register native function-calling tools:

- `dinocode_list_tasks` — returns JSON task list
- `dinocode_view_task` — returns task details by ID
- `dinocode_update_task` — dispatches `task.update` through the orchestration engine
- `dinocode_create_task` — dispatches `task.create`

Built-in tools are richer (real-time, typed, no shell escaping) but require per-adapter integration. The CLI works everywhere.

### 5.4 Turn Lifecycle

Unchanged from t3code base. Tasks do not affect the turn lifecycle.

```
user dispatches thread.turn.start
  -> decider validates
  -> events: thread.turn-start-requested
  -> provider adapter starts session
  -> events: thread.session-set, thread.turn-running
  -> agent streams content/tool events
  -> agent signals to_review via hook
  -> events: thread.turn-awaiting-review
  -> user approves / rejects / sends follow-up
  -> events: thread.turn-completed or thread.turn-resumed
```

---

## 6. Git Integration

### 6.1 Repo-Local Task Storage

Because `.dinocode/tasks/` lives inside the repo:

- Tasks are version-controlled with the code.
- CI can read task files to generate changelogs or validate completion.
- Agents can read the full project backlog without API calls.
- No external issue tracker is required.

### 6.2 Task Branches (Optional)

Tasks do **not** require dedicated branches or worktrees. However, users may optionally create a branch named after a task (e.g., `dinocode/dnc-0ajg`) for organizational purposes. This is a convention, not enforced by the system.

- The kanban card may show a "Create Branch" button that runs `git checkout -b dinocode/<taskId>`.
- Git status (dirty files) is never displayed on kanban cards because tasks are not bound to git state.

### 6.3 Agent Worktrees

Agent sessions may use t3code's existing worktree support (if configured) independently of tasks. A user can start an agent session in a worktree and reference tasks for context, but the worktree is not owned by any task.

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

### 7.2 Starting an Agent Session with Task Context

1. User clicks "Start Session" on a kanban card.
2. Web app opens a new thread (or reuses an existing one) and dispatches `thread.turn.start` with an optional `taskIds: [TaskId]` context payload.
3. Server injects the referenced task content (title, body, status) into the session's context window.
4. Provider adapter starts the session normally — no worktree is created for the task.
5. Agent streams content/tool events. Built-in tools or CLI commands allow the agent to view/update tasks during the session.
6. Orchestration events are persisted to SQLite event store.
7. Projector updates read models; WebSocket pushes to clients.

### 7.3 Editing a Task (External / Agent)

1. Agent (running in an agent session) edits a task file directly, or calls `dinocode task update <id> --status in-progress`.
2. File Store watcher detects the filesystem change.
3. File is parsed and validated against schema.
4. ETag is computed and compared to the last known version.
5. Orchestration command `task.update` is auto-dispatched with ETag validation.
6. Decider validates; events persisted to SQLite.
7. File Store reactor re-writes the file (idempotent if no changes).
8. Projector updates; clients refresh.

> **Important**: The file watcher is the _only_ path for external edits. Humans editing files in their editor go through the same flow as agents. This prevents the filesystem and SQLite from diverging.
>
> **Watcher Ignore Mechanism**: The File Store reactor maintains an in-memory `Set` of file paths it is about to write. The watcher skips any path in this set (checked before parsing, cleared after the write completes). This prevents the reactor's own writes from re-triggering `task.update` commands. The same mechanism applies to archive/unarchive moves.

---

## 8. UI/UX Design Direction

### 8.1 Layout

```
┌────────────────────────────────────────────────────────────┐
│  [Project]  [New Task +]  [Filter ▾]        [⚙] [👤]       │
├──────────┬─────────────────────────────────────────────────┤
│          │  In Prog  │   Todo    │ Draft  │ Completed      │
│ Sidebar  │  ┌─────┐  │  ┌─────┐  │ ┌────┐ │ ┌────┐        │
│  Chat    │  │TaskA│  │  │TaskB│  │ │TaskC│ │ │TaskD│       │
│  (Home   │  │ 🔵  │  │  │ 🟡  │  │ │ 🟢  │ │ │ ⚪  │       │
│   Agent) │  └─────┘  │  └─────┘  │ └────┘ │ └────┘        │
│          │           │           │        │               │
├──────────┴─────────────────────────────────────────────────┤
│  [Description] [Subtasks] [Blockers] [Activity]  [Start ▶] │
└────────────────────────────────────────────────────────────┘
```

### 8.2 Key Interactions

- **Kanban**: Drag-and-drop between columns (updates `status`). Drag to reorder (updates `order` fractional index).
- **Card click**: Opens task detail panel with description, subtasks, blockers, and activity history. A "Start Session" button opens a new agent thread with this task's context.
- **Cmd+click card**: Initiates dependency link draft.
- **Start Session button**: Opens a new agent thread with this task's context pre-loaded. Disabled if `blocked_by` has non-completed tasks.
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
- Turn-by-turn diff using agent session checkpoint refs (existing t3code feature, independent of tasks).
- Inline commenting on diff lines → sends comment back to agent as user message.

---

## 9. API & Protocol

### 9.1 WebSocket RPC Methods

Dinocode extends t3code's existing Effect RPC schema with task-oriented methods. All new methods follow the existing `WsRpcGroup` pattern in `packages/contracts/src/rpc.ts`.

**Task commands** (dispatched via existing `orchestration.dispatchCommand`):

```typescript
type TaskCommand =
  | {
      type: "task.create";
      projectId: ProjectId;
      title: string;
      status: TaskStatus;
      slug?: string;
      type?: TaskType;
      priority?: TaskPriority;
      tags?: string[];
      body?: string;
      parent?: TaskId;
      blocking?: TaskId[];
      blockedBy?: TaskId[];
    }
  | { type: "task.update"; taskId: TaskId; expectedEtag?: string; patch: TaskPatch }
  | { type: "task.delete"; taskId: TaskId }
  | { type: "task.archive"; taskId: TaskId }
  | { type: "task.unarchive"; taskId: TaskId };
```

**New subscription streams**:

```typescript
// Board subscription — pushes BoardSnapshot + BoardStreamEvent
orchestration.subscribeBoard({ projectId }): Stream<BoardStreamItem>;

// Task detail subscription — pushes TaskDetail + TaskEvent
orchestration.subscribeTask({ taskId }): Stream<TaskStreamItem>;
```

**Thread / session** (task context added to turn start):

```typescript
orchestration.subscribeThread({ threadId }): Stream<ThreadDetail>;

// taskIds is optional; when provided, the server injects task context into the session
orchestration.dispatchCommand({ type: 'thread.turn.start', threadId: ThreadId, taskIds?: TaskId[] });
```

**Git** (existing t3code, unchanged):

```typescript
git.createWorktree({ cwd, branch, newBranch });
git.removeWorktree({ cwd });
```

**Terminal** (existing t3code, unchanged):

```typescript
terminal.open({ threadId });
terminal.subscribe({ threadId }): Stream<TerminalEvent>;
```

### 9.2 Soil Package API (Shared Task Domain)

```typescript
import { Effect, Stream } from "effect";

interface SoilProjectLoader {
  // Finds the project root and loads .dinocode/config.yml
  loadProject(path: string): Effect.Effect<ProjectContext, SoilError, never>;
}

interface SoilFileStore {
  parseTask(markdown: string, path: string): Effect.Effect<TaskDocument, SoilError, never>;
  renderTask(task: TaskDocument): string;
  writeTask(task: TaskDocument, expectedEtag?: string): Effect.Effect<void, SoilError, never>;
  watchProject(workspaceRoot: string): Stream.Stream<FileChangeEvent, SoilError, never>;
}

interface SoilDecider {
  decide(
    state: TaskState,
    command: TaskCommand,
  ): Effect.Effect<ReadonlyArray<TaskEvent>, SoilError, never>;
}

interface SoilProjector {
  apply(state: TaskState, event: TaskEvent): TaskState;
}

interface SoilReactor {
  react(
    events: ReadonlyArray<TaskEvent>,
    context: ProjectContext,
  ): Effect.Effect<void, SoilError, never>;
}
```

The server wraps these primitives in a thin adapter layer:

- The orchestration engine persists canonical events in SQLite.
- The server adapter feeds task commands and task events into soil decider/projector/reactor logic.
- The CLI imports soil directly so it can operate on `.dinocode/tasks/` without going through WebSocket or HTTP.

> For the full per-subpath API reference, usage examples, and the task file
> format specification, see [`packages/soil/README.md`](./packages/soil/README.md).
> The spec above is intentionally a summary; the README is the authoritative
> contract for soil consumers.

The following explicit subpath exports are published by `@dinocode/soil`:

| Subpath                          | Purpose                                                      |
| -------------------------------- | ------------------------------------------------------------ |
| `@dinocode/soil/schema`          | Effect Schema for `TaskDocument`, `TaskState`, `TaskPatch`.  |
| `@dinocode/soil/parser`          | `parseTaskFile` — Markdown + YAML front matter parser.       |
| `@dinocode/soil/renderer`        | `renderTaskDocument`, `renderFilename` — deterministic.      |
| `@dinocode/soil/etag`            | `computeEtag` — FNV-1a 32-bit, LF-normalized.                |
| `@dinocode/soil/decider`         | `decideTaskCommand` — pure state machine.                    |
| `@dinocode/soil/projector`       | `projectTaskEvent` — event folder.                           |
| `@dinocode/soil/reactor`         | `makeSoilReactor` — filesystem writer with write-lock guard. |
| `@dinocode/soil/watcher`         | `watchProject` — `Stream<FileChangeEvent>`.                  |
| `@dinocode/soil/config`          | `loadProjectConfig` — reads `.dinocode/config.yml`.          |
| `@dinocode/soil/conflict`        | `detectEtagConflict`, `threeWayMerge`.                       |
| `@dinocode/soil/migration`       | `migrateTaskContent`, `planSlugRename`.                      |
| `@dinocode/soil/search`          | `filterTasks`, `sortTasks`, `readyTasks`.                    |
| `@dinocode/soil/id`              | `generateTaskId`, `generateSlug`.                            |
| `@dinocode/soil/fractionalIndex` | `keyBetween` for kanban ordering.                            |
| `@dinocode/soil/errors`          | Tagged `SoilError` union.                                    |

---

## 10. Storage & Persistence

| Data                     | Store                                 | Rationale                                      |
| ------------------------ | ------------------------------------- | ---------------------------------------------- |
| **Task definitions**     | `.dinocode/tasks/*.md` (repo-local)   | Human-readable, git-tracked, agent-accessible. |
| **Task config**          | `.dinocode/config.yml` (repo-local)   | Per-project task settings.                     |
| **Chat history**         | SQLite (`projection_thread_messages`) | Fast querying, streaming, already in t3code.   |
| **Orchestration events** | SQLite (`orchestration_events`)       | Event sourcing backbone (tasks + threads).     |
| **Read models**          | SQLite projections                    | Fast board/card lookups.                       |
| **Agent conversations**  | `.dinocode/.conversations/*.jsonl`    | Optional long-term chat logs, gitignored.      |
| **Session runtime**      | `.dinocode/.sessions/*.json`          | Ephemeral provider resume state, gitignored.   |

---

## 11. Implementation Phases

### Phase 1: Soil Package Foundation

- [ ] Scaffold `packages/soil` with explicit subpath exports.
- [ ] Define task schema types and validation in soil.
- [ ] Add task ID generator and fractional index utilities in soil.
- [ ] Implement soil FileStore core: Markdown + YAML parser, writer, ETag calculation, path utilities.
- [ ] Implement soil config loader and project discovery for `.dinocode/config.yml`.
- [ ] Implement soil decider and projector as pure task-domain logic.
- [ ] Implement soil reactor for ordered, atomic task-file writes.
- [ ] Implement soil conflict resolution and error taxonomy.
- [ ] Add soil migration utilities for schema evolution and slug/path changes.
- [ ] Add soil test suite.
- [x] Add soil API documentation (`packages/soil/README.md` + §9.2 subpath table).

### Phase 1.5: Server Orchestration Integration

- [ ] Add `task.*` commands/events to `packages/contracts/src/orchestration.ts`.
- [ ] Add `projection_tasks` SQLite table (new migration; use next available number).
- [ ] Extend server command invariants with task-specific checks.
- [ ] Wire a thin server FileStore adapter that consumes soil.
- [ ] Feed task commands into the orchestration engine, then into soil-backed filesystem projection.
- [ ] Connect file watching so external edits round-trip back into orchestration with ETag validation.

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
- [ ] Task detail panel (read-only task view with edit mode).

### Phase 3: Task Context Injection

- [ ] Extend `thread.turn.start` command to accept optional `taskIds` payload.
- [ ] Server-side context injector: fetch task files → format → prepend to session context.
- [ ] Kanban card "Start Session" action: opens new thread with task context pre-loaded.
- [ ] Thread UI: display referenced tasks as chips; allow adding/removing task context mid-session.
- [ ] Home agent prompt injection: include open tasks in the home agent's system prompt.

### Phase 4: Agent Tools

- [ ] Set up a dedicated dinocode CLI package and command framework.
- [ ] Implement workspace discovery and config inspection commands.
- [ ] CLI: implement `dinocode task` subcommands (`list`, `view`, `create`, `update`, `delete`, `archive`, `link`, `unlink`).
- [ ] CLI imports soil directly so `dinocode task ...` works without server-only codepaths.
- [ ] Add thin server adapter usage where the web app needs orchestration-backed task mutation.
- [ ] Built-in tools: register `dinocode_list_tasks`, `dinocode_view_task`, `dinocode_update_task`, `dinocode_create_task` in provider adapters.
- [ ] File watcher handles CLI-initiated changes (same flow as human edits).
- [ ] Document tools in `AGENTS.md` / `DINOCODE.md` so agents know they exist.

### Phase 5: Automation

- [ ] Dependency linking UI (`blocking`/`blocked_by`) — Cmd+click card → target card.
- [ ] Unblock notifications: when blockers resolve, surface in UI.
- [ ] Subtask completion prompts: when all children are `completed`, offer to complete parent.
- [ ] Sidebar home agent (`__home_agent__:<projectId>`) with injected task management prompts.

### Phase 6: Polish

- [ ] Import/export from external trackers (GitHub Issues, Linear).
- [ ] Mobile-responsive kanban.
- [ ] Task search and filtering.

---

## 12. Decisions & Open Questions

### Resolved

1. **SQLite vs filesystem canonical?**
   **Resolved**: Keep SQLite `orchestration_events` as the canonical transaction log inside the server. `packages/soil` owns the reusable task-domain logic and filesystem format, while the server persists canonical events and uses a soil-backed reactor to project task files into `.dinocode/tasks/*.md`. A file watcher re-ingests external edits as `task.update` commands with ETag validation. This satisfies the "file-first" principle without duplicating task logic across server and CLI.

2. **How do we handle merge conflicts when both an agent and a human edit the same task file?**
   **Resolved**: ETag optimistic concurrency. The ETag is an FNV-1a hash of the full rendered Markdown content. If the file on disk has changed since the last read, the auto-dispatched `task.update` command fails validation and the server emits a `task.conflict` event. The UI shows a three-way merge view (base / local / remote).

3. **Should `.dinocode/` be auto-initialized when a user opens a repo without it?**
   **Resolved**: Yes. The web UI detects missing `.dinocode/config.yml` and shows a one-click "Initialize Dinocode for this project" banner. Initialization creates the directory structure, default config, and an initial `.gitignore`.

4. **How do we support non-git repos?**
   **Resolved**: Task files work everywhere. The kanban and task tools function regardless of git availability. Optional git features (branch creation) are hidden when git is unavailable.

5. **Should tasks be bound 1:1 to agent threads?**
   **Resolved**: No. Tasks and threads are independent systems. A thread may reference zero or more tasks for context, and a task may be referenced by zero or more threads. This decoupling keeps the task model simple and avoids worktree-per-task complexity. Task context is injected at `thread.turn.start` time via an optional `taskIds` payload.

6. **How do we handle task file renames (slug changes) while preserving event history?**
   **Resolved**: The task `id` (e.g. `dnc-0ajg`) is immutable and used for the event stream; the filename slug is purely cosmetic. `@dinocode/soil/migration` exposes `planSlugRename(document, newSlug)` which produces `{ oldFilename, newFilename }` pairs; `migrateTaskContent(content, filename)` canonicalises the slug when a task file is read. The reactor handles the filesystem rename by re-writing the task file under the new path (`findTaskFile` already matches by `id` prefix, so old paths are located regardless of slug). No distinct task event is required for a slug change; updating `title` re-derives the canonical slug through migration.

7. **Should archived tasks be moved to `.dinocode/tasks/archive/` or stay in place with an `archived` status?**
   **Resolved**: Move to `archive/` subfolder. `makeSoilReactor` implements `task.archived` as an atomic rename into `<tasksPath>/archive/` and `task.unarchived` as a rename back out. The watcher tags each `FileChangeEvent` with an `archived` boolean derived from the on-disk path, so manual editor drags into/out of `archive/` round-trip through the same event shape as server-initiated archive commands (see `packages/soil/src/reactor.ts` and `packages/soil/src/watcher.ts`).

### Open

8. **Should the board projection live in the shell stream or a separate stream?**
   _Tentative_: Separate `subscribeBoard` stream, but the shell stream should include minimal task metadata (counts per status) so the sidebar can show badges without subscribing to the full board.

---

## 13. Integration Patterns (How to Add New Features)

The codebase follows strict conventions. New features must adhere to these patterns:

### Server Pattern (Effect-TS)

1. **Define contracts first** in `packages/contracts/src/`:
   - Schema types using `effect/Schema`
   - RPC definitions using `effect/unstable/rpc`
   - Add to `ORCHESTRATION_WS_METHODS` and `WS_METHODS`
   - Register in `WsRpcGroup`

2. **Put reusable task-domain logic in `packages/soil` first**:
   - Schema types and parsing logic live in soil, not in the server layer
   - Use explicit subpath exports (`@dinocode/soil/fileStore`, etc.)
   - Keep soil pure where possible; isolate IO behind small interfaces

3. **Add migration** in `apps/server/src/persistence/Migrations/`:
   - Statically import in `Migrations.ts`
   - Create projection tables for read models
   - Use `effect/unstable/sql/SqlClient`

4. **Add decider integration** in `apps/server/src/orchestration/decider.ts`:
   - Handle new command types in `decideOrchestrationCommand`
   - Validate invariants in `commandInvariants.ts` (never skip this)
   - Delegate task-domain logic to soil where appropriate

5. **Add projector integration** in `apps/server/src/orchestration/projector.ts`:
   - Update `OrchestrationReadModel`
   - Update SQLite projection tables
   - Handle both insert and update paths (idempotent)
   - Reuse soil projector semantics rather than duplicating business rules

6. **Add reactor** (if side effects needed):
   - Define interface in `Services/MyReactor.ts`
   - Implement in `Layers/MyReactor.ts`
   - Register in `OrchestrationReactor.ts` startup sequence
   - Prefer thin adapters around soil reactors for task-file side effects

7. **Add RPC handlers** in `apps/server/src/ws.ts`:
   - Inside `makeWsRpcLayer`, add methods to `WsRpcGroup.of({})`
   - Use `observeRpcEffect` for one-shot, `observeRpcStreamEffect` for streams

8. **Wire layers** in `apps/server/src/server.ts`:
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
- Soil package: add tests in `packages/soil` for parser/writer, decider, projector, reactor, conflict handling
- Server adapter: add tests in `apps/server/src/fileStore/fileStore.test.ts` or adjacent adapter tests
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
