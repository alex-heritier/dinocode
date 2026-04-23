import { describe, expect, it } from "vitest";
import type { EnvironmentId, ProjectId, ThreadId } from "@t3tools/contracts";

import {
  parseBoardPathname,
  parseThreadPathname,
  resolveToggleFaceAction,
  type ToggleFaceThreadSummary,
} from "./toggleFace.logic";

const env = (v: string) => v as EnvironmentId;
const proj = (v: string) => v as ProjectId;
const thr = (v: string) => v as ThreadId;

const thread = (overrides: Partial<ToggleFaceThreadSummary>): ToggleFaceThreadSummary => ({
  environmentId: env("e1"),
  id: thr("t1"),
  projectId: proj("p1"),
  archivedAt: null,
  lastVisitedAt: null,
  ...overrides,
});

describe("parseBoardPathname", () => {
  it("matches /board/:env/:project", () => {
    expect(parseBoardPathname("/board/e1/p1")).toEqual({
      environmentId: env("e1"),
      projectId: proj("p1"),
    });
  });

  it("tolerates a trailing slash", () => {
    expect(parseBoardPathname("/board/e1/p1/")).not.toBeNull();
  });

  it("rejects /board or /board/:env alone", () => {
    expect(parseBoardPathname("/board")).toBeNull();
    expect(parseBoardPathname("/board/e1")).toBeNull();
    expect(parseBoardPathname("/board/e1/p1/extra")).toBeNull();
  });
});

describe("parseThreadPathname", () => {
  it("matches /:env/:thread", () => {
    expect(parseThreadPathname("/e1/t1")).toEqual({
      environmentId: env("e1"),
      threadId: thr("t1"),
    });
  });

  it("rejects reserved roots (board/settings/draft/pair)", () => {
    expect(parseThreadPathname("/board/e1")).toBeNull();
    expect(parseThreadPathname("/settings/x")).toBeNull();
    expect(parseThreadPathname("/draft/123")).toBeNull();
    expect(parseThreadPathname("/pair/x")).toBeNull();
  });
});

describe("resolveToggleFaceAction", () => {
  it("no-ops when the route is neither thread nor board", () => {
    expect(
      resolveToggleFaceAction({
        pathname: "/",
        activeThread: null,
        allThreads: [],
      }),
    ).toEqual({ kind: "noop" });
  });

  it("navigates chat → board using the active thread's project", () => {
    const active = thread({
      environmentId: env("e1"),
      id: thr("t1"),
      projectId: proj("p1"),
    });
    expect(
      resolveToggleFaceAction({
        pathname: "/e1/t1",
        activeThread: active,
        allThreads: [active],
      }),
    ).toEqual({
      kind: "navigate-to-board",
      environmentId: env("e1"),
      projectId: proj("p1"),
    });
  });

  it("no-ops on a chat route when the active thread is unresolved", () => {
    expect(
      resolveToggleFaceAction({
        pathname: "/e1/unknown",
        activeThread: null,
        allThreads: [],
      }),
    ).toEqual({ kind: "noop" });
  });

  it("navigates board → most-recent thread for that project", () => {
    const threads: ToggleFaceThreadSummary[] = [
      thread({
        id: thr("ta"),
        projectId: proj("p1"),
        lastVisitedAt: "2025-01-01T00:00:00Z",
      }),
      thread({
        id: thr("tb"),
        projectId: proj("p1"),
        lastVisitedAt: "2025-05-01T00:00:00Z",
      }),
      thread({
        id: thr("tc"),
        projectId: proj("p1"),
        lastVisitedAt: "2025-03-01T00:00:00Z",
      }),
      thread({
        id: thr("td"),
        projectId: proj("p2"),
        lastVisitedAt: "2030-01-01T00:00:00Z",
      }),
    ];
    expect(
      resolveToggleFaceAction({
        pathname: "/board/e1/p1",
        activeThread: null,
        allThreads: threads,
      }),
    ).toEqual({
      kind: "navigate-to-thread",
      environmentId: env("e1"),
      threadId: thr("tb"),
    });
  });

  it("asks to create a new thread when the project has none", () => {
    expect(
      resolveToggleFaceAction({
        pathname: "/board/e1/p1",
        activeThread: null,
        allThreads: [
          thread({
            id: thr("td"),
            projectId: proj("p2"),
            lastVisitedAt: "2030-01-01T00:00:00Z",
          }),
        ],
      }),
    ).toEqual({
      kind: "create-new-thread",
      environmentId: env("e1"),
      projectId: proj("p1"),
    });
  });

  it("prefers unarchived threads when computing last-visited", () => {
    const threads: ToggleFaceThreadSummary[] = [
      thread({
        id: thr("ta"),
        projectId: proj("p1"),
        lastVisitedAt: "2025-05-01T00:00:00Z",
        archivedAt: "2025-06-01T00:00:00Z",
      }),
      thread({
        id: thr("tb"),
        projectId: proj("p1"),
        lastVisitedAt: "2025-01-01T00:00:00Z",
      }),
    ];
    const result = resolveToggleFaceAction({
      pathname: "/board/e1/p1",
      activeThread: null,
      allThreads: threads,
    });
    expect(result.kind).toBe("navigate-to-thread");
    expect(result.kind === "navigate-to-thread" && result.threadId).toBe(thr("tb"));
  });
});
