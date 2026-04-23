---
# dinocode-fm1h
title: Extract task contracts into packages/dinocode-contracts
status: todo
type: task
priority: high
created_at: 2026-04-23T03:39:22Z
updated_at: 2026-04-23T03:39:22Z
---

Move Dinocode-specific RPC methods and task schemas out of packages/contracts (t3code's contract layer) and into a new packages/dinocode-contracts package. Target sources: the ~320 lines of task schemas added to packages/contracts/src/orchestration.ts in commit b73bfd2c, plus task-related entries in packages/contracts/src/{rpc,ipc,baseSchemas}.ts. Keep t3code's contracts untouched; consumers import from @dinocode/contracts. See docs/dinocode-packages.md.
