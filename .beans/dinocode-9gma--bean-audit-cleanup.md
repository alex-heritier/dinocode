---
# dinocode-9gma
title: Bean audit & cleanup
status: completed
type: task
priority: high
created_at: 2026-04-22T09:51:31Z
updated_at: 2026-04-22T12:41:11Z
---

Fix all issues found in comprehensive bean audit: duplicates, stale refs, missing blockers, misplaced beans, missing beans.

## Summary of Changes

### Scrapped (5 duplicate beans)
- dinocode-wzdy, dinocode-koa7, dinocode-d95o, dinocode-dmcp, dinocode-u17w — thin duplicates of canonical CLI beans

### Reparented / hierarchy fixes (3)
- dinocode-r7mw → moved from Phase 1 to Phase 4
- dinocode-0syf (Soil epic) → parent set to v0.2 milestone (dinocode-dizj)
- dinocode-lhp0 (Phase 4 epic) → blocked-by Soil epic (dinocode-0syf)

### Priority fix (1)
- dinocode-lc1k: low → normal

### Body reference fixes (2)
- dinocode-ucr3: stale ref dinocode-yjt9 → dinocode-ndam
- dinocode-h551: removed dangling '(from dinocode-w94z task)' reference

### Missing blocking relationships added (16)
- dinocode-82w7 blocked-by dinocode-5kre (toast infra)
- dinocode-kmza blocked-by dinocode-5kre (toast infra)
- dinocode-h551 blocked-by dinocode-56yo
- dinocode-nqra blocked-by dinocode-h551
- dinocode-buje blocked-by dinocode-hlqn + dinocode-b3nv
- dinocode-y6pg blocked-by dinocode-9mrx
- dinocode-w1uo blocked-by dinocode-sizc
- dinocode-sizc blocked-by dinocode-388g + dinocode-0qbh + dinocode-ifhu
- dinocode-cqwo blocked-by dinocode-o0oh
- dinocode-i3i0 blocked-by dinocode-afya
- dinocode-y3d7 blocked-by dinocode-afya
- dinocode-vdno blocked-by dinocode-56yo
- dinocode-tpk6 blocked-by dinocode-vdno

### Created missing beans (2)
- dinocode-y7dm: subscribeArchivedTasks RPC endpoint (Phase 2, blocks dinocode-kky3)
- dinocode-3230: SQLite FTS5 virtual table migration (Phase 1, blocks dinocode-j0z9 + dinocode-4hhr)

## Correction

A later review established that the `packages/soil` architecture was intentional and the prior conclusion that these beans duplicated the Phase 1 server-local FileStore work was incorrect. The following beans were restored from `scrapped` back to `todo`: dinocode-0syf, dinocode-e0e8, dinocode-lfdu, dinocode-7jwg, dinocode-cy2j, dinocode-8u6r, dinocode-e7qu, dinocode-mswb, dinocode-qga1, dinocode-3p5v, dinocode-5ley, dinocode-e2wm, dinocode-r7mw, dinocode-joh6, dinocode-bv5n, dinocode-jo0q, dinocode-m5em.

Residual risk from the original audit: `DINOCODE.md` and the bean graph are not aligned on the `soil` abstraction, so future audits should treat the beans as authoritative until the spec is updated.
