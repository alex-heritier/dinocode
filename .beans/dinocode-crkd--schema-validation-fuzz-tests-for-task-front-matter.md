---
# dinocode-crkd
title: Schema validation fuzz tests for Task front matter
status: completed
type: task
priority: low
tags:
    - tests
created_at: 2026-04-22T07:42:21Z
updated_at: 2026-04-23T03:06:34Z
parent: dinocode-xd5m
---

Fuzz the Task parser with `fast-check` / hand-crafted malformed inputs to ensure schema decode never crashes the watcher or server.

## Subtasks

- [ ] Property-based test: random Task records → write → parse → deep-equal
- [ ] Negative: random YAML garbage → always returns `ParseError`, never throws
- [ ] Tag validator: forbid leading numbers, special chars, spaces — exhaustive cases
- [ ] Boundary: `id_length: 3` and `id_length: 16` both work; `2` and `17` rejected
- [ ] Unicode in title/body round-trips byte-for-byte



## Summary of Changes

Added `packages/soil/src/fuzz.test.ts` covering:

- Property: 200 random generated docs survive write → parse → field equality.
- Property: render output is a fixed point for already-canonical docs (ensures idempotent projection writes do not thrash).
- ETag stability across renders of identical docs.
- Negative: curated YAML garbage inputs always surface as an `Effect` failure, never throw.
- Negative: 100 random bit-flips against a valid baseline never escape the Effect.
- Exhaustive `Tag` validator cases (valid and invalid).
- Exhaustive `TaskId` boundary cases.
- Unicode body round-trip across emoji, CJK, RTL, combining, and math scripts.

### Bugs fixed uncovered by fuzzing

- `FractionalIndex` schema regex excluded `-` and `_` even though the fractional-index alphabet in `fractionalIndex.ts` produces them. Schema relaxed to `[A-Za-z0-9_-]+`.
- Renderer emitted unquoted YAML scalars for fields like `order`/`title`, so pure-digit or boolean-ish values round-tripped as non-strings. Added `needsQuoting` + double-quoted scalar serialization.
- Parser hard-cast raw YAML values to `string`; non-string scalars (numbers, booleans) now coerce to strings before schema validation.
