---
# dinocode-qk4k
title: Release plan + version bumps for v0.1 / v0.2 / v0.3
status: todo
type: task
priority: low
tags:
  - release
created_at: 2026-04-22T07:42:21Z
updated_at: 2026-04-22T07:42:21Z
parent: dinocode-xd5m
---

Coordinate the three milestone releases: changelog, version bumps, marketing site content, Linux packaging, Windows signing.

## Subtasks

- [ ] Decide semver: Dinocode v0.1 aligns with t3code commit `<sha>` baseline
- [ ] Automated CHANGELOG from committed beans/dinocode tasks (dinocode-3v4w output piped to a generator)
- [ ] Bump `package.json` version in all workspaces (single source via turbo pipeline)
- [ ] Marketing site: v0.1 launch post, screenshots, feature matrix
- [ ] Signed builds: macOS notarization, Windows code signing, Linux AppImage + .deb
- [ ] Release checklist file: `.docs/release-checklist.md`
