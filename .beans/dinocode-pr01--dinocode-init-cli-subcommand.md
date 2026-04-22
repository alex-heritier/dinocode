---
# dinocode-pr01
title: dinocode init CLI subcommand
status: todo
type: feature
priority: normal
tags:
    - phase-4
    - cli
created_at: 2026-04-22T07:36:33Z
updated_at: 2026-04-22T07:36:33Z
parent: dinocode-lhp0
blocked_by:
    - dinocode-vaac
    - dinocode-9mrx
---

`dinocode init` bootstraps `.dinocode/` in the current working directory (or `--workspace <path>`). Mirrors the server's auto-init but for users who want to run this manually from a terminal or CI.

## Subtasks

### Command
- [ ] Subcommand registered in CLI root
- [ ] Flags: `--workspace <path>` (default `$PWD`), `--prefix <str>` (default `dnc-`), `--id-length <n>` (default 4), `--force` (overwrite), `--dry-run`, `--json`
- [ ] Without `--force`, exits non-zero if `.dinocode/` already exists
- [ ] `--dry-run` prints what would be created without writing

### Scaffolding
- [ ] Create directory tree (see dinocode-9mrx subtasks)
- [ ] Write `.dinocode/config.yml` using provided flags
- [ ] Write `.dinocode/.gitignore`

### Git awareness
- [ ] Detect git: if inside a repo, `git add .dinocode/config.yml .dinocode/.gitignore` (stage, don't commit)
- [ ] If no git: print hint "Tip: initialize git to version-control your tasks"

### Output
- [ ] Human output: 3-line summary + next-step hints
- [ ] `--json` output: `{ initialized: true, workspaceRoot, createdPaths: [...] }`
- [ ] Exit 0 on success, 1 on any failure

### Tests
- [ ] E2E: fresh temp dir → `dinocode init` → config.yml parses back via FileStore
- [ ] `--dry-run` does not touch filesystem
- [ ] `--force` overwrites existing
