---
# dinocode-3085
title: CLI workspace discovery and path resolution
status: todo
type: task
priority: normal
created_at: 2026-04-22T08:29:43Z
updated_at: 2026-04-22T12:49:04Z
parent: dinocode-lhp0
blocked_by:
    - dinocode-0syf
---

Walk up from the current working directory to find `.dinocode/config.yml`. Cache discovery per invocation. Handle `--workspace` override. Exit with a helpful message if no Dinocode project is found.
