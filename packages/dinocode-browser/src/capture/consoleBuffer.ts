/**
 * Per-tab `ConsoleRingBuffer`.
 *
 * The buffer is fed by the CDP adapter (`Runtime.consoleAPICalled` +
 * `Runtime.exceptionThrown`) and by the user-facing DevTools toggle. Both
 * paths deliver the same storage shape so agent tools and the in-panel
 * drawer consume a single unified stream.
 */

import type { MarshalledArg, MarshalOptions } from "./marshalArg.ts";
import { marshalArg } from "./marshalArg.ts";
import type { DrainOptions, DrainResult, RingCursor } from "./ringBuffer.ts";
import { createRingBuffer } from "./ringBuffer.ts";

export type ConsoleLevel = "log" | "info" | "warn" | "error" | "debug" | "trace";

export type ConsoleOrigin = "console" | "exception";

export interface ConsoleStackFrame {
  readonly functionName: string;
  readonly url: string;
  readonly lineNumber: number;
  readonly columnNumber: number;
}

export interface ConsoleEntry {
  readonly ts: number;
  readonly level: ConsoleLevel;
  readonly origin: ConsoleOrigin;
  readonly args: ReadonlyArray<MarshalledArg>;
  readonly stackTrace: ReadonlyArray<ConsoleStackFrame>;
  readonly executionContextId?: number | undefined;
  readonly url?: string | undefined;
}

export interface ConsoleRingBufferOptions {
  readonly capacity?: number;
  readonly now?: () => number;
  readonly marshalOptions?: MarshalOptions;
}

export interface ConsoleApiCallInput {
  /** Accepts raw CDP level strings (e.g. "warning", "assert") which are normalised. */
  readonly level: ConsoleLevel | string;
  readonly args: ReadonlyArray<unknown>;
  readonly stackTrace?: ReadonlyArray<ConsoleStackFrame>;
  readonly executionContextId?: number;
  readonly url?: string;
  readonly ts?: number;
}

export interface ExceptionThrownInput {
  readonly message: string;
  readonly error?: unknown;
  readonly stackTrace?: ReadonlyArray<ConsoleStackFrame>;
  readonly executionContextId?: number;
  readonly url?: string;
  readonly ts?: number;
}

export interface ConsoleRingBuffer {
  readonly capacity: number;
  size(): number;
  totalIngested(): number;
  totalDropped(): number;
  cursor(): RingCursor;
  ingestConsoleApiCall(input: ConsoleApiCallInput): ConsoleEntry;
  ingestException(input: ExceptionThrownInput): ConsoleEntry;
  drain(options?: DrainOptions): DrainResult<ConsoleEntry>;
  snapshot(): ReadonlyArray<ConsoleEntry>;
  clear(): void;
}

export const DEFAULT_CONSOLE_CAPACITY = 1000;

const CONSOLE_LEVELS: ReadonlyArray<ConsoleLevel> = [
  "log",
  "info",
  "warn",
  "error",
  "debug",
  "trace",
];

const normalizeLevel = (input: string): ConsoleLevel => {
  const lower = input.toLowerCase();
  if ((CONSOLE_LEVELS as ReadonlyArray<string>).includes(lower)) return lower as ConsoleLevel;
  if (lower === "warning") return "warn";
  if (lower === "dir" || lower === "dirxml" || lower === "table") return "log";
  if (lower === "assert") return "error";
  return "log";
};

export const createConsoleRingBuffer = (
  options: ConsoleRingBufferOptions = {},
): ConsoleRingBuffer => {
  const capacity = options.capacity ?? DEFAULT_CONSOLE_CAPACITY;
  const now = options.now ?? Date.now;
  const marshalOpts = options.marshalOptions;
  const ring = createRingBuffer<ConsoleEntry>({ capacity });

  const record = (entry: ConsoleEntry): ConsoleEntry => {
    ring.ingest(entry);
    return entry;
  };

  return {
    capacity,
    size: ring.size,
    totalIngested: ring.totalIngested,
    totalDropped: ring.totalDropped,
    cursor: ring.cursor,
    ingestConsoleApiCall: (input) => {
      const entry: ConsoleEntry = {
        ts: input.ts ?? now(),
        level: normalizeLevel(input.level),
        origin: "console",
        args: input.args.map((v) => marshalArg(v, marshalOpts)),
        stackTrace: input.stackTrace ?? [],
        executionContextId: input.executionContextId,
        url: input.url,
      };
      return record(entry);
    },
    ingestException: (input) => {
      const err = input.error ?? new Error(input.message);
      const entry: ConsoleEntry = {
        ts: input.ts ?? now(),
        level: "error",
        origin: "exception",
        args: [marshalArg(err, marshalOpts), marshalArg(input.message, marshalOpts)],
        stackTrace: input.stackTrace ?? [],
        executionContextId: input.executionContextId,
        url: input.url,
      };
      return record(entry);
    },
    drain: (opts) => ring.drain(opts),
    snapshot: () => ring.snapshot().map((entry) => entry.value),
    clear: ring.clear,
  };
};

export const isConsoleLevel = (value: string): value is ConsoleLevel =>
  (CONSOLE_LEVELS as ReadonlyArray<string>).includes(value);

export const CONSOLE_LEVELS_ALL: ReadonlyArray<ConsoleLevel> = CONSOLE_LEVELS;
