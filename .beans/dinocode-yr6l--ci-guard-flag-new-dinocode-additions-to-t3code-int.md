---
# dinocode-yr6l
title: "CI guard: flag new @dinocode/* additions to t3code internals"
status: completed
type: task
priority: normal
created_at: 2026-04-23T03:39:22Z
updated_at: 2026-04-23T06:13:00Z
---

Add a CI step that parses 'git diff upstream/main..HEAD --stat' and fails if > N lines of change land in apps/_ or packages/contracts/_ for a commit that does not also carry a label or commit-trailer 'Integration: <package>'. Threshold default: 20 lines. Goal: make t3code-internal churn visible at review time. See docs/dinocode-packages.md.

## Progress

- Implemented `scripts/check-t3code-drift.ts`:
  - Computes `git diff <base>..HEAD --numstat` scoped to `apps/*` and
    `packages/contracts/*` and fails when insertions+deletions exceed
    `CHECK_T3CODE_DRIFT_LIMIT` (default 20).
  - Cross-checks that every `@dinocode/*` import under watched paths has a
    `// dinocode-integration:` annotation within the preceding 3 lines.
  - Base ref resolution: `CHECK_T3CODE_DRIFT_BASE` env, else
    `origin/${GITHUB_BASE_REF}` on PRs, else `upstream/main`, else
    `origin/main`, else `HEAD~1`.
  - Opt-out: `INTEGRATION_PR=1` env or an `Integration: <package>` trailer
    on the HEAD commit. Drift budget check is skipped; annotation check
    still runs.
  - Allowlist grandfathers the existing dogfooding surfaces
    (`apps/web/src/components/board/*`,
    `apps/web/src/routes/_chat.board.*`,
    `apps/server/src/persistence/.../ProjectionTasks*`) until the
    `dinocode-up4r` / `dinocode-k7pm` extractions land. Remove entries as
    those beans complete.
- Wired into `.github/workflows/ci.yml` as a dedicated step that only
  runs on `pull_request`, before format/lint/typecheck, with a shallow
  fetch of the base branch to keep the job fast.
- Verified locally:
  - `CHECK_T3CODE_DRIFT_BASE=HEAD~1 node scripts/check-t3code-drift.ts` → OK.
  - `CHECK_T3CODE_DRIFT_BASE=upstream/main node scripts/check-t3code-drift.ts`
    → fails with a curated top-10 offender list, exercising the reporting
    path.
