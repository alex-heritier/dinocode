import { describe, expect, it } from "vitest";

import {
  CONSOLE_LEVELS_ALL,
  DEFAULT_CONSOLE_CAPACITY,
  createConsoleRingBuffer,
  isConsoleLevel,
} from "../capture/consoleBuffer.ts";

describe("ConsoleRingBuffer", () => {
  it("defaults to a 1000-entry capacity", () => {
    const buf = createConsoleRingBuffer();
    expect(buf.capacity).toBe(DEFAULT_CONSOLE_CAPACITY);
  });

  it("normalises CDP level strings and records the marshaled args", () => {
    let t = 0;
    const buf = createConsoleRingBuffer({ now: () => ++t });
    const entry = buf.ingestConsoleApiCall({ level: "warning", args: ["hi", 1, { a: 1 }] });
    expect(entry.level).toBe("warn");
    expect(entry.origin).toBe("console");
    expect(entry.args.map((a) => a.kind)).toEqual(["string", "number", "object"]);
    expect(entry.ts).toBe(1);
  });

  it("treats assertion failures as error level", () => {
    const buf = createConsoleRingBuffer();
    const entry = buf.ingestConsoleApiCall({ level: "assert", args: ["failed"] });
    expect(entry.level).toBe("error");
  });

  it("ingests uncaught exceptions with origin=exception", () => {
    const buf = createConsoleRingBuffer();
    const entry = buf.ingestException({ message: "boom", error: new Error("boom") });
    expect(entry.level).toBe("error");
    expect(entry.origin).toBe("exception");
    expect(entry.args[0]!.kind).toBe("error");
  });

  it("evicts oldest entries at capacity", () => {
    const buf = createConsoleRingBuffer({ capacity: 3 });
    for (let i = 0; i < 10; i += 1) {
      buf.ingestConsoleApiCall({ level: "log", args: [i] });
    }
    expect(buf.size()).toBe(3);
    expect(buf.totalIngested()).toBe(10);
    expect(buf.totalDropped()).toBe(7);
    const snap = buf.snapshot();
    expect(snap.map((e) => e.args[0]!.text)).toEqual(["7", "8", "9"]);
  });

  it("drain paginates deterministically and surfaces droppedBefore", () => {
    const buf = createConsoleRingBuffer({ capacity: 3 });
    for (let i = 0; i < 6; i += 1) {
      buf.ingestConsoleApiCall({ level: "log", args: [i] });
    }
    const first = buf.drain({ since: 0, limit: 2 });
    expect(first.entries.map((e) => e.value.args[0]!.text)).toEqual(["3", "4"]);
    expect(first.droppedBefore).toBeGreaterThan(0);
    const rest = buf.drain({ since: first.nextCursor });
    expect(rest.entries.map((e) => e.value.args[0]!.text)).toEqual(["5"]);
  });

  it("exposes the canonical level set", () => {
    expect(CONSOLE_LEVELS_ALL).toContain("log");
    expect(isConsoleLevel("warn")).toBe(true);
    expect(isConsoleLevel("fatal")).toBe(false);
  });
});
