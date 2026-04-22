---
# dinocode-nqra
title: Implement __home_agent__ sidebar session
status: todo
type: feature
priority: normal
created_at: 2026-04-22T07:15:35Z
updated_at: 2026-04-22T09:55:20Z
parent: dinocode-b6x6
blocked_by:
    - dinocode-h551
---

Always-visible sidebar chat panel scoped to the `__home_agent__:<projectId>` thread. Acts as the project's task manager; cannot edit code directly.

## Subtasks

### UI
- [ ] Component `apps/web/src/components/homeAgent/HomeAgentPanel.tsx` in the `apps/web/src/components/sidebar/` area
- [ ] Rendered as the primary sidebar panel (above / beside the threads list)
- [ ] Collapsible: click chevron to hide; state persisted in `desktopSettings`
- [ ] Integrates with existing chat renderer (reuse `ChatView.tsx`)
- [ ] Displays header "Home agent" + status dot + compact input

### Thread identity
- [ ] Thread id format: `__home_agent__:<projectId>` (reserved namespace)
- [ ] Thread is auto-created on project registration if missing (internal `thread.create` with system flag `{ kind: "home_agent" }`)
- [ ] Cannot be deleted through the UI (delete button hidden); can be reset (deletes and recreates)

### System prompt
- [ ] Injected at `thread.turn.start` via `HomeAgentPromptComposer` (see dinocode-h551)
- [ ] Includes: role description, open-task list, CLI/tool reference, constraints (no direct code edits)

### Tool access
- [ ] Home agent session has the full dinocode built-in tool set enabled
- [ ] Regular code-edit tools (shell, file-write) are DISABLED for this session (hard constraint in adapter setup)
- [ ] Enforced server-side: provider adapter filters tool list based on `session.kind === "home_agent"`

### Persistence
- [ ] Conversation history stored normally in `projection_thread_messages`
- [ ] Gitignored `.dinocode/.conversations/` optional long-term log file for home-agent sessions

### Accessibility
- [ ] `aria-label="Home agent"` on the panel
- [ ] Focus management: `Cmd/Ctrl+Shift+H` focuses home-agent input
- [ ] Keyboard shortcut also registered in command palette

### Tests
- [ ] Home agent thread is auto-created
- [ ] Tool list filtering excludes shell/file-write
- [ ] Conversation persists across reloads
