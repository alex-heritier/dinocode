---
# dinocode-crkd
title: Schema validation fuzz tests for Task front matter
status: todo
type: task
priority: low
tags:
    - tests
created_at: 2026-04-22T07:42:21Z
updated_at: 2026-04-22T07:42:21Z
parent: dinocode-xd5m
---

Fuzz the Task parser with `fast-check` / hand-crafted malformed inputs to ensure schema decode never crashes the watcher or server.

## Subtasks

- [ ] Property-based test: random Task records → write → parse → deep-equal
- [ ] Negative: random YAML garbage → always returns `ParseError`, never throws
- [ ] Tag validator: forbid leading numbers, special chars, spaces — exhaustive cases
- [ ] Boundary: `id_length: 3` and `id_length: 16` both work; `2` and `17` rejected
- [ ] Unicode in title/body round-trips byte-for-byte
