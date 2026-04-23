/**
 * Bounded FIFO ring buffer with monotonic cursor pagination.
 *
 * Used as the shared storage primitive for the console and network capture
 * pipelines. Every ingested entry gets a strictly increasing `seq` that is
 * never reused even across evictions, so pagination via `drain({ since })`
 * cannot skip or duplicate entries regardless of how long the caller was
 * away.
 *
 * The buffer is pure (no timers, no I/O, no `logger`) so it is safe to
 * embed inside the CDP adapter, the test harness, or the renderer's
 * local cache with identical semantics.
 */

export type RingCursor = number;

export interface RingEntry<T> {
  readonly seq: RingCursor;
  readonly value: T;
}

export interface DrainResult<T> {
  readonly entries: ReadonlyArray<RingEntry<T>>;
  readonly nextCursor: RingCursor;
  readonly droppedBefore: number;
}

export interface DrainOptions {
  readonly since?: RingCursor;
  readonly limit?: number;
}

export interface RingBuffer<T> {
  readonly capacity: number;
  size(): number;
  cursor(): RingCursor;
  totalIngested(): number;
  totalDropped(): number;
  ingest(value: T): RingEntry<T>;
  drain(options?: DrainOptions): DrainResult<T>;
  snapshot(): ReadonlyArray<RingEntry<T>>;
  clear(): void;
}

export interface CreateRingBufferOptions {
  readonly capacity: number;
}

export const createRingBuffer = <T>(
  options: CreateRingBufferOptions,
): RingBuffer<T> => {
  if (!Number.isInteger(options.capacity) || options.capacity <= 0) {
    throw new TypeError(
      `ringBuffer: capacity must be a positive integer, got ${String(options.capacity)}`,
    );
  }

  const capacity = options.capacity;
  let entries: Array<RingEntry<T>> = [];
  let nextSeq: RingCursor = 1;
  let totalIngested = 0;
  let firstLiveSeq: RingCursor = 1;

  const ingest = (value: T): RingEntry<T> => {
    const entry: RingEntry<T> = { seq: nextSeq, value };
    nextSeq += 1;
    totalIngested += 1;
    entries.push(entry);
    if (entries.length > capacity) {
      const removed = entries.splice(0, entries.length - capacity);
      if (removed.length > 0) {
        firstLiveSeq = removed[removed.length - 1]!.seq + 1;
      }
    } else if (entries.length === 1) {
      firstLiveSeq = entry.seq;
    }
    return entry;
  };

  const drain = (options: DrainOptions = {}): DrainResult<T> => {
    const since = options.since ?? 0;
    const limit = options.limit ?? entries.length;
    if (!Number.isFinite(limit) || limit < 0) {
      throw new TypeError(`ringBuffer.drain: limit must be >= 0`);
    }
    const dropped = since + 1 < firstLiveSeq ? firstLiveSeq - 1 - since : 0;
    const out: Array<RingEntry<T>> = [];
    for (const entry of entries) {
      if (entry.seq <= since) continue;
      out.push(entry);
      if (out.length >= limit) break;
    }
    const nextCursor =
      out.length > 0 ? out[out.length - 1]!.seq : Math.max(since, firstLiveSeq - 1);
    return { entries: out, nextCursor, droppedBefore: dropped };
  };

  const snapshot = (): ReadonlyArray<RingEntry<T>> => entries.slice();

  return {
    capacity,
    size: () => entries.length,
    cursor: () => (entries.length === 0 ? firstLiveSeq - 1 : entries[entries.length - 1]!.seq),
    totalIngested: () => totalIngested,
    totalDropped: () => Math.max(0, totalIngested - entries.length),
    ingest,
    drain,
    snapshot,
    clear: () => {
      entries = [];
      firstLiveSeq = nextSeq;
    },
  };
};
