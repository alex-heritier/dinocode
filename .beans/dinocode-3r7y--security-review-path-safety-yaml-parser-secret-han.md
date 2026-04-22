---
# dinocode-3r7y
title: 'Security review: path safety, YAML parser, secret handling, token scopes'
status: todo
type: feature
priority: high
tags:
    - security
created_at: 2026-04-22T07:42:00Z
updated_at: 2026-04-22T07:42:00Z
parent: dinocode-xd5m
---

Dinocode touches the filesystem, YAML, third-party APIs, and OS secret stores. Formal review required before v0.1 ship.

## Subtasks

### Path safety
- [ ] `FileStore` refuses any path that escapes `workspaceRoot/.dinocode/` (even via symlinks)
- [ ] Use `path.resolve` + prefix check; test with `../../..` and absolute-path task IDs
- [ ] Reject filenames with control chars, NULs, Windows-reserved names

### YAML parser
- [ ] Pick a parser without `!!js/function`-style injection risk (e.g. `yaml` lib v2+ in safe mode)
- [ ] Fuzz test with malformed inputs

### Secret handling
- [ ] GitHub / Linear tokens via `safeStorage` on desktop; env var on server
- [ ] Never log token contents; redact in error messages
- [ ] Documented secret rotation flow

### Token scopes
- [ ] Document minimum GitHub/Linear scopes needed
- [ ] CLI refuses operations when token scope is insufficient, with clear message

### Code review
- [ ] Security review signed off before v0.1 (track in this task)
