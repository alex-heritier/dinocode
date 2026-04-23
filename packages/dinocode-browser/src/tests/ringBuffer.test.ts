import { describe, expect, it } from "vitest";

import { createRingBuffer } from "../capture/ringBuffer.ts";

describe("createRingBuffer", () => {
  it("rejects non-positive capacities", () => {
    expect(() => createRingBuffer({ capacity: 0 })).toThrow(/positive/);
    expect(() => createRingBuffer({ capacity: -1 })).toThrow(/positive/);
    expect(() => createRingBuffer({ capacity: 1.5 })).toThrow(/integer/);
  });

  it("assigns monotonic sequence numbers that never reset", () => {
    const ring = createRingBuffer<number>({ capacity: 3 });
    const a = ring.ingest(10);
    const b = ring.ingest(20);
    const c = ring.ingest(30);
    expect([a.seq, b.seq, c.seq]).toEqual([1, 2, 3]);
    const d = ring.ingest(40);
    const e = ring.ingest(50);
    expect([d.seq, e.seq]).toEqual([4, 5]);
  });

  it("evicts FIFO while preserving seq", () => {
    const ring = createRingBuffer<number>({ capacity: 2 });
    ring.ingest(1);
    ring.ingest(2);
    ring.ingest(3);
    const values = ring.snapshot().map((e) => [e.seq, e.value]);
    expect(values).toEqual([
      [2, 2],
      [3, 3],
    ]);
    expect(ring.totalDropped()).toBe(1);
    expect(ring.totalIngested()).toBe(3);
  });

  it("drain paginates by cursor and never duplicates", () => {
    const ring = createRingBuffer<string>({ capacity: 5 });
    ring.ingest("a");
    ring.ingest("b");
    ring.ingest("c");
    const first = ring.drain({ since: 0, limit: 2 });
    expect(first.entries.map((e) => e.value)).toEqual(["a", "b"]);
    expect(first.nextCursor).toBe(2);
    const second = ring.drain({ since: first.nextCursor });
    expect(second.entries.map((e) => e.value)).toEqual(["c"]);
    expect(second.nextCursor).toBe(3);
    const empty = ring.drain({ since: second.nextCursor });
    expect(empty.entries).toEqual([]);
    expect(empty.nextCursor).toBe(3);
  });

  it("reports droppedBefore when the client lags past the window", () => {
    const ring = createRingBuffer<number>({ capacity: 2 });
    ring.ingest(1);
    ring.ingest(2);
    ring.ingest(3);
    ring.ingest(4);
    const result = ring.drain({ since: 1 });
    expect(result.droppedBefore).toBeGreaterThan(0);
    expect(result.entries.map((e) => e.seq)).toEqual([3, 4]);
  });

  it("clear resets the cursor baseline but keeps seq monotonic", () => {
    const ring = createRingBuffer<number>({ capacity: 2 });
    ring.ingest(1);
    ring.ingest(2);
    ring.clear();
    expect(ring.size()).toBe(0);
    const next = ring.ingest(9);
    expect(next.seq).toBe(3);
  });
});
