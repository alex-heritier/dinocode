---
# dinocode-8ibz
title: "Observability: structured logging + metrics for task pipeline"
status: todo
type: feature
priority: normal
tags:
  - observability
created_at: 2026-04-22T07:40:58Z
updated_at: 2026-04-23T03:41:10Z
parent: dinocode-xd5m
---

Every stage of the task pipeline (decider → projector → reactor → watcher) must emit structured logs and metrics so we can triage real-world issues.

## Subtasks

### Logs (via existing `apps/server/src/observability/`)

- [ ] Every orchestration command logs `{commandId, type, aggregateId, elapsedMs, outcome}`
- [ ] Every file-store op logs `{taskId, op, path, etag, elapsedMs}`
- [ ] Every watcher event logs at DEBUG with `{path, kind}`; WARN when an event is ignored by the ignore set
- [ ] Dedicated `dinocode.` log namespace for filtering

### Metrics

- [ ] Counter: `dinocode_task_events_total{type}`
- [ ] Counter: `dinocode_filestore_errors_total{kind}`
- [ ] Histogram: `dinocode_command_duration_ms{type}`
- [ ] Gauge: `dinocode_tasks_on_disk{projectId,status}`

### Tracing

- [ ] Create spans for: `command.decide`, `command.project`, `filestore.write`, `filestore.parse`
- [ ] Propagate trace context from UI click through RPC through reactor

### Privacy

- [ ] Log task IDs but NEVER log task titles/bodies (PII risk)
- [ ] Opt-in verbose mode logs full payloads for local-only debugging

### Tests

- [ ] Metrics registry after running a test suite has all expected series

## Direction update (2026-04-23)

Per `docs/dinocode-packages.md`, this task's code must live in a Dinocode package, not directly under `apps/server/src/`. Target: `packages/dinocode-server` (new; tracked by dinocode-k7pm). `apps/server` gets a single-line layer mount with a `dinocode-integration:` comment. No new types in `@t3tools/contracts` — task schemas live in `packages/dinocode-contracts` (tracked by dinocode-fm1h). Update acceptance criteria and file paths before picking this up.
