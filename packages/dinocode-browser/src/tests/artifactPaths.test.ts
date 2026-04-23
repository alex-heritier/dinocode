import { describe, expect, it } from "vitest";

import {
  ARTIFACT_DIRECTORIES,
  ARTIFACT_ROOT_FILES,
  ARTIFACT_ROOT_SEGMENT,
  artifactRoot,
  dailyLogPath,
  domSnapshotPath,
  networkBodyPath,
  screenshotPath,
  sessionManifestPath,
  tracePath,
} from "../artifacts/ArtifactPaths.ts";

const tabId = "tab-1";
const iso = "2026-04-23T12:34:56.789Z";
const expectedIso = "2026-04-23T12-34-56.789Z";

describe("ArtifactPaths — happy path", () => {
  it("builds project-relative screenshot paths", () => {
    expect(screenshotPath(tabId, iso)).toBe(
      `${ARTIFACT_ROOT_SEGMENT}/screenshots/${tabId}/${expectedIso}.png`,
    );
  });

  it("builds network body paths from requestId + ext", () => {
    expect(networkBodyPath(tabId, "req_abc123", "html")).toBe(
      `${ARTIFACT_ROOT_SEGMENT}/network-bodies/${tabId}/req_abc123.html`,
    );
  });

  it("accepts leading-dot extensions", () => {
    expect(networkBodyPath(tabId, "r_1", ".png")).toBe(
      `${ARTIFACT_ROOT_SEGMENT}/network-bodies/${tabId}/r_1.png`,
    );
  });

  it("builds DOM snapshot paths", () => {
    expect(domSnapshotPath(tabId, iso)).toBe(
      `${ARTIFACT_ROOT_SEGMENT}/dom-snapshots/${tabId}/${expectedIso}.html`,
    );
  });

  it("builds session manifest paths", () => {
    expect(sessionManifestPath(tabId, iso)).toBe(
      `${ARTIFACT_ROOT_SEGMENT}/sessions/${tabId}-${expectedIso}/manifest.json`,
    );
  });

  it("builds trace paths", () => {
    expect(tracePath(tabId, iso)).toBe(
      `${ARTIFACT_ROOT_SEGMENT}/traces/${tabId}/${expectedIso}.json`,
    );
  });

  it("builds daily log paths", () => {
    expect(dailyLogPath("2026-04-23")).toBe(
      `${ARTIFACT_ROOT_SEGMENT}/logs/2026-04-23.log`,
    );
  });

  it("joins project root correctly", () => {
    expect(artifactRoot("/home/user/proj")).toBe(
      `home/user/proj/${ARTIFACT_ROOT_SEGMENT}`,
    );
    expect(artifactRoot("proj/")).toBe(`proj/${ARTIFACT_ROOT_SEGMENT}`);
  });
});

describe("ArtifactPaths — validation", () => {
  it("rejects tabIds that could traverse directories", () => {
    expect(() => screenshotPath("../evil", iso)).toThrow();
    expect(() => screenshotPath("Tab-1", iso)).toThrow();
    expect(() => screenshotPath("", iso)).toThrow();
    expect(() => screenshotPath("a/b", iso)).toThrow();
  });

  it("rejects bogus ISO timestamps", () => {
    expect(() => screenshotPath(tabId, "2026-04-23")).toThrow();
    expect(() => screenshotPath(tabId, "../oops")).toThrow();
    expect(() => screenshotPath(tabId, "")).toThrow();
  });

  it("rejects unsafe requestIds and extensions", () => {
    expect(() => networkBodyPath(tabId, "../bad", "html")).toThrow();
    expect(() => networkBodyPath(tabId, "ok", "html/png")).toThrow();
    expect(() => networkBodyPath(tabId, "ok", "")).toThrow();
  });

  it("rejects bad daily log dates", () => {
    expect(() => dailyLogPath("not a date")).toThrow();
    expect(() => dailyLogPath("2026-04-23T00:00")).toThrow();
  });
});

describe("ArtifactPaths — constants", () => {
  it("lists every root-level file and directory", () => {
    expect(ARTIFACT_ROOT_FILES.length).toBe(3);
    expect(ARTIFACT_DIRECTORIES).toContain(ARTIFACT_ROOT_SEGMENT);
    for (const dir of ARTIFACT_DIRECTORIES) {
      expect(dir.startsWith(ARTIFACT_ROOT_SEGMENT)).toBe(true);
    }
    for (const file of ARTIFACT_ROOT_FILES) {
      expect(file.startsWith(ARTIFACT_ROOT_SEGMENT)).toBe(true);
    }
  });
});
