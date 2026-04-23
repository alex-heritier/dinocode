---
# dinocode-r4ns
title: 'Browser: scaffold packages/dinocode-browser'
status: todo
type: task
priority: high
tags:
    - phase-browser
    - phase-0-design
created_at: 2026-04-23T05:14:23Z
updated_at: 2026-04-23T05:14:23Z
parent: dinocode-ipdj
---

Create the standalone package so all browser code has a home from day one.

## Layout

```
packages/dinocode-browser/
  README.md
  package.json            # @dinocode/browser, workspace:*
  tsconfig.json
  src/
    index.ts              # public barrel
    main/                 # runs in Electron main
    preload/              # contextBridge exposer
    renderer/             # React components + hooks
    shared/               # schemas/types shared across boundaries
    tools/                # agent-tool definitions + handlers
    tests/
```

## Acceptance

- `bun install` succeeds; `bun typecheck` green for the empty package.
- `README.md` explains the package's responsibilities + integration points.
- No imports from `apps/**` or `@t3tools/*` internals; may depend on `@dinocode/contracts`, `effect`, `electron` (peer), `react` (peer).
- Added to `docs/dinocode-packages.md` planned-packages table.
