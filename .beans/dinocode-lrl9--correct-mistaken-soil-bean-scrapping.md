---
# dinocode-lrl9
title: Correct mistaken soil bean scrapping
status: completed
type: task
priority: normal
created_at: 2026-04-22T12:40:55Z
updated_at: 2026-04-22T12:41:40Z
---

Undo the incorrect bean audit change that marked the Soil package epic and child beans as scrapped. Restore their prior statuses and document the correction against the prior audit bean.

## Tasks

- [x] Restore Soil epic and child bean statuses from scrapped to todo
- [x] Restore dependent server adapter bean status to todo
- [x] Update the earlier audit bean with a correction note
- [x] Summarize remaining audit risks so the bean graph can be re-reviewed accurately

## Summary of Changes

- Restored the Soil epic and all 15 Soil child beans from `scrapped` back to `todo`
- Restored the dependent `dinocode-r7mw` server adapter bean from `scrapped` back to `todo`
- Added a correction note to `dinocode-9gma` so the prior audit has an explicit historical fixup
- Recorded the remaining process issue: the current `DINOCODE.md` file is stale relative to the intended Soil-based architecture
