---
# dinocode-jabn
title: 'Rebrand: t3code references to dinocode across code, docs, configs'
status: todo
type: task
priority: high
tags:
    - rebrand
created_at: 2026-04-22T07:40:38Z
updated_at: 2026-04-22T07:40:38Z
parent: dinocode-xd5m
---

The DINOCODE.md spec positions Dinocode as a distinct product atop the t3code codebase. Decide and execute the rename strategy before shipping v0.1 to avoid repeated churn.

## Subtasks

### Decision
- [ ] Confirm with team: rename the root product to `dinocode`, or keep `t3code` internal and ship `dinocode` as an app-name layer
- [ ] Document decision in `DINOCODE.md` §15 (Decisions)

### Code renames (if full rename chosen)
- [ ] `@t3tools/*` package namespaces → `@dinocode/*` (breaking; requires consumer updates)
- [ ] `apps/desktop` product name, bundle id, macOS entitlements
- [ ] Electron updater feed URL
- [ ] CLI binaries: `t3` → `dinocode` (keep `t3` shim for backwards compat for N releases)

### Assets
- [ ] Logo / favicon updates in `assets/`
- [ ] Marketing site (`apps/marketing`) hero, copy, URLs

### Docs
- [ ] README, CONTRIBUTING, DINOCODE.md, AGENTS.md, KEYBINDINGS.md updated
- [ ] Migration note for existing users

### CI
- [ ] Release workflow artifact names
- [ ] Homebrew tap, `winget` manifests, Linux packages (`.deb`/`.AppImage`)
