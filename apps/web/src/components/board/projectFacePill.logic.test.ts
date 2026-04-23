import { describe, expect, it } from "vitest";
import type { EnvironmentId, ProjectId, ThreadId } from "@t3tools/contracts";

import { resolveProjectFacePillViewModel } from "./projectFacePill.logic";

const env = (v: string) => v as EnvironmentId;
const proj = (v: string) => v as ProjectId;
const thr = (v: string) => v as ThreadId;

describe("resolveProjectFacePillViewModel", () => {
  it("returns null when the project has no members", () => {
    expect(
      resolveProjectFacePillViewModel({
        members: [],
        threads: [],
        pathname: "/",
      }),
    ).toBeNull();
  });

  it("returns the primary member + zero threads when the project is empty", () => {
    const vm = resolveProjectFacePillViewModel({
      members: [{ environmentId: env("e1"), id: proj("p1") }],
      threads: [],
      pathname: "/",
    });
    expect(vm).not.toBeNull();
    expect(vm!.primary.id).toBe(proj("p1"));
    expect(vm!.lastVisitedThreadId).toBeNull();
    expect(vm!.openThreadCount).toBe(0);
    expect(vm!.isBoardActive).toBe(false);
  });

  it("picks the most-recently-visited open thread", () => {
    const vm = resolveProjectFacePillViewModel({
      members: [{ environmentId: env("e1"), id: proj("p1") }],
      threads: [
        {
          environmentId: env("e1"),
          id: thr("t1"),
          archivedAt: null,
          lastVisitedAt: "2025-01-01T00:00:00Z",
        },
        {
          environmentId: env("e1"),
          id: thr("t2"),
          archivedAt: null,
          lastVisitedAt: "2025-03-01T00:00:00Z",
        },
        {
          environmentId: env("e1"),
          id: thr("t3"),
          archivedAt: null,
          lastVisitedAt: "2025-02-01T00:00:00Z",
        },
      ],
      pathname: "/",
    });
    expect(vm!.lastVisitedThreadId).toBe(thr("t2"));
    expect(vm!.openThreadCount).toBe(3);
  });

  it("ignores archived threads for both count and last-visited", () => {
    const vm = resolveProjectFacePillViewModel({
      members: [{ environmentId: env("e1"), id: proj("p1") }],
      threads: [
        {
          environmentId: env("e1"),
          id: thr("t1"),
          archivedAt: null,
          lastVisitedAt: "2025-01-01T00:00:00Z",
        },
        {
          environmentId: env("e1"),
          id: thr("t2"),
          archivedAt: "2025-01-01T00:00:00Z",
          lastVisitedAt: "2025-12-31T23:59:59Z",
        },
      ],
      pathname: "/",
    });
    expect(vm!.lastVisitedThreadId).toBe(thr("t1"));
    expect(vm!.openThreadCount).toBe(1);
  });

  it("falls back to the first open thread when none were ever visited", () => {
    const vm = resolveProjectFacePillViewModel({
      members: [{ environmentId: env("e1"), id: proj("p1") }],
      threads: [
        {
          environmentId: env("e1"),
          id: thr("t1"),
          archivedAt: null,
          lastVisitedAt: null,
        },
        {
          environmentId: env("e1"),
          id: thr("t2"),
          archivedAt: null,
          lastVisitedAt: null,
        },
      ],
      pathname: "/",
    });
    expect(vm!.lastVisitedThreadId).toBe(thr("t1"));
  });

  it("detects board-active when the pathname matches any member's board URL", () => {
    const vm = resolveProjectFacePillViewModel({
      members: [
        { environmentId: env("e1"), id: proj("p1") },
        { environmentId: env("e2"), id: proj("p1") },
      ],
      threads: [],
      pathname: "/board/e2/p1",
    });
    expect(vm!.isBoardActive).toBe(true);
  });

  it("does not mark board-active when the pathname is a thread route", () => {
    const vm = resolveProjectFacePillViewModel({
      members: [{ environmentId: env("e1"), id: proj("p1") }],
      threads: [],
      pathname: "/e1/some-thread",
    });
    expect(vm!.isBoardActive).toBe(false);
  });
});
