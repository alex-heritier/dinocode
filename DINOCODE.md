# DINOCODE Specification

> **Status**: Draft v0.1  
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

1. **File-first**: Tasks live as files in the repo. The UI is a view over the filesystem. No opaque database is the source of truth.
2. **Parallel by default**: Every task runs in its own git worktree. Agents never block each other.
3. **Minimal chrome**: The UI gets out of the way. Keyboard-driven, low latency, no modal fatigue.
4. **Agent-native**: The system is designed for agents to read and write tasks, not just humans.

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
| **File Store**        | **beans**   | Reads/writes `.dinocode/tasks/` Markdown files. Watches filesystem. Builds in-memory index. |
| **Provider Adapters** | t3code base | Codex, Claude, Cursor, OpenCode adapters. Spawn stdio JSON-RPC or PTY.                      |
| **Git Manager**       | **kanban**  | Worktree creation, symlinking gitignored dirs, patch capture on trash, diff computation.    |
| **Terminal**          | **kanban**  | node-pty sessions per task. Multi-viewer WebSocket bridge with backpressure.                |
| **Event Store**       | t3code base | SQLite WAL event log for orchestration events. Projections for read models.                 |

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
4. File store reactor writes a new `.dinocode/tasks/<id>--<slug>.md` file.
5. Projector updates SQLite read model.
6. WebSocket stream pushes updated board projection to all clients.

### 7.2 Starting a Task (Agent)

1. User clicks "Play" on a kanban card.
2. Web app dispatches `thread.turn.start` with the task's thread ID.
3. Server ensures worktree exists (`git worktree add`).
4. Provider adapter resolves agent binary + args + hooks.
5. PTY session starts in the worktree directory.
6. Provider runtime events stream through `ProviderRuntimeIngestion`.
7. Hook events (`to_review`) trigger status file updates.
8. Orchestration events are persisted to SQLite event store.
9. Projector updates read models; WebSocket pushes to clients.

### 7.3 Editing a Task (Agent)

1. Agent (running in worktree) edits a task file directly, or calls `dinocode task update <id> --status review`.
2. File store watcher detects the change.
3. File is parsed and validated against schema.
4. Orchestration command `task.update` is auto-dispatched with ETag validation.
5. Events emitted; projector updates; clients refresh.

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

Dinocode extends t3code's existing Effect RPC schema with task-oriented methods:

```typescript
// Task commands
orchestration.dispatchCommand({
  type: 'task.create' | 'task.update' | 'task.delete' | 'task.archive'
});

// Board subscription
orchestration.subscribeBoard({ projectId }): Stream<BoardSnapshot>;

// Task detail subscription
orchestration.subscribeTask({ taskId }): Stream<TaskDetail>;

// Thread / session (existing t3code)
orchestration.subscribeThread({ threadId }): Stream<ThreadDetail>;
orchestration.dispatchCommand({ type: 'thread.turn.start', ... });

// Git (existing t3code + kanban)
git.createWorktree({ taskId, baseRef });
git.getTaskDiff({ taskId, mode: 'working' | 'turn' });
git.integrateTask({ taskId, mode: 'squash' | 'pr' });

// Terminal (kanban)
terminal.open({ taskId });
terminal.subscribe({ taskId }): Stream<TerminalEvent>;
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

- [ ] Implement `FileStore` service in `apps/server/src/fileStore/`.
- [ ] Task parser: Markdown + YAML front matter → `Task` schema.
- [ ] Task writer: `Task` schema → Markdown file with ETag.
- [ ] File watcher: `node:fs` watch → orchestration commands.
- [ ] Add `task.*` commands/events to orchestration decider.
- [ ] Add `projection_tasks` SQLite table.

### Phase 2: Kanban Projection

- [ ] Build board projector: read `projection_tasks` + `config.yml` → `BoardSnapshot`.
- [ ] Add `subscribeBoard` RPC stream.
- [ ] React kanban board component (reuse `@hello-pangea/dnd` or similar).
- [ ] Drag-and-drop mutations: update `status` and `order` fields.
- [ ] Card detail panel shell.

### Phase 3: Worktree & Terminal

- [ ] Port kanban's `task-worktree.ts` to t3code's git layer.
- [ ] Per-task PTY session management.
- [ ] Terminal WebSocket bridge with multi-viewer support.
- [ ] Symlink gitignored paths optimization.

### Phase 4: Provider Integration

- [ ] Bind threads to tasks (1:1 relationship).
- [ ] Auto-spawn provider in worktree on `thread.turn.start`.
- [ ] Inject hook environment variables and configs.
- [ ] Hook ingest endpoint → orchestration commands.
- [ ] Checkpointing on turn boundaries.

### Phase 5: Automation

- [ ] Dependency linking UI + storage.
- [ ] Auto-start logic: unblocker completion triggers next task.
- [ ] Auto-review modes (commit / PR / complete).
- [ ] Sidebar home agent with injected task management prompts.

### Phase 6: Polish

- [ ] Diff viewer with inline commenting.
- [ ] Git integration panel (history, branches, push/pull).
- [ ] Import/export from external trackers (GitHub Issues, Linear).
- [ ] Mobile-responsive kanban.

---

## 12. Open Questions

1. **Should we keep t3code's SQLite as the canonical event store, or move some events to the filesystem?**  
   _Tentative_: Keep SQLite for orchestration events (fast, transactional), but task CRUD events should always round-trip through the filesystem so agents can observe changes.

2. **How do we handle merge conflicts when both an agent and a human edit the same task file?**  
   _Tentative_: ETag optimistic concurrency. If conflict detected, server emits a `task.conflict` event; UI shows a three-way merge view.

3. **Should `.dinocode/` be auto-initialized when a user opens a repo without it?**  
   _Tentative_: Yes. Prompt the user with a one-click "Initialize Dinocode for this project" banner.

4. **How do we support non-git repos?**  
   _Tentative_: Task files still work, but worktrees and checkpointing are disabled. Agents run in the main repo directory.

5. **What is the migration path from t3code's existing thread-centric model to task-centric?**  
   _Tentative_: Threads without tasks become "ad-hoc tasks" with auto-generated files. Existing SQLite data is preserved via projection migration.

---

## 13. Appendix: Reference Repos

| Repo         | URL                                         | Role                                                              |
| ------------ | ------------------------------------------- | ----------------------------------------------------------------- |
| t3code       | `https://github.com/pingdotgg/t3code`       | Base architecture, WebSocket server, React UI, event sourcing.    |
| cline/kanban | `https://github.com/cline/kanban`           | Kanban board, worktrees, PTY terminals, hooks, dependency chains. |
| hmans/beans  | `https://github.com/hmans/beans`            | Flat-file task format, Markdown+YAML schema, in-repo persistence. |
| Codex        | `https://github.com/openai/codex`           | Provider reference.                                               |
| CodexMonitor | `https://github.com/Dimillian/CodexMonitor` | Feature-complete reference for Codex app-server UX.               |
