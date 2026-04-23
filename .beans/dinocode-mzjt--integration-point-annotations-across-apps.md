---
# dinocode-mzjt
title: Integration-point annotations across apps/*
status: todo
type: task
priority: normal
created_at: 2026-04-23T03:39:22Z
updated_at: 2026-04-23T03:39:22Z
---

For every t3code-internal file that wires a Dinocode package in, add a single 'dinocode-integration: <package> <feature>' comment on the integration line so rg 'dinocode-integration' surfaces the complete coupling surface. Enforce in CI with a small script that fails if a file under apps/_ imports from @dinocode/_ without such a comment within 3 lines. See docs/dinocode-packages.md.
