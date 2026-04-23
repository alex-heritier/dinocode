/**
 * Test-only trace recorder.
 *
 * Every step the harness takes — tool invocation, simulated CDP event,
 * IPC envelope, fixture hit — is appended as a structured record to an
 * in-memory ring buffer. On failure the test prints the whole buffer so
 * the reviewer sees the exact sequence that led to the assertion. On
 * success nothing is printed unless the `DINOCODE_BROWSER_TEST_DEBUG`
 * env flag is set.
 *
 * The recorder is process-local and deliberately NOT shared with the
 * runtime logger so harness logs stay separable from production logs.
 */

import {
  createLogger,
  createMemorySink,
  type LogRecord,
  type Logger,
} from "../logging/index.ts";

export interface TraceStep extends LogRecord {
  readonly step: string;
}

export interface TraceRecorder {
  readonly logger: Logger;
  readonly steps: ReadonlyArray<TraceStep>;
  readonly record: (step: string, data?: Record<string, unknown>) => void;
  readonly flushOnFailure: <T>(fn: () => T | Promise<T>) => Promise<T>;
  readonly dump: () => string;
}

export interface CreateTraceRecorderOptions {
  readonly traceId: string;
  readonly debug?: boolean;
  readonly max?: number;
}

const envDebug = (): boolean =>
  globalThis.process?.env?.DINOCODE_BROWSER_TEST_DEBUG === "1";

export const createTraceRecorder = (
  options: CreateTraceRecorderOptions,
): TraceRecorder => {
  const memory = createMemorySink();
  const base = createLogger({
    level: "trace",
    sink: memory.sink,
    scope: { component: "harness", traceId: options.traceId },
  });
  const max = options.max ?? 1024;

  const steps: TraceStep[] = [];

  const record = (step: string, data?: Record<string, unknown>) => {
    base.debug({
      msg: step,
      phase: "internal",
      ...(data !== undefined ? { data } : {}),
    });
    const last = memory.records[memory.records.length - 1];
    if (last) {
      if (steps.length === max) steps.shift();
      steps.push({ ...last, step });
    }
  };

  const dump = (): string =>
    steps
      .map((s) => {
        const extras: string[] = [];
        if (s.tabId) extras.push(`tab=${s.tabId}`);
        if (s.tool) extras.push(`tool=${s.tool}`);
        if (s.data) extras.push(`data=${JSON.stringify(s.data)}`);
        const tail = extras.length ? `  ${extras.join(" ")}` : "";
        return `[${s.ts}] ${s.step}${tail}`;
      })
      .join("\n");

  const flushOnFailure = async <T>(fn: () => T | Promise<T>): Promise<T> => {
    try {
      const result = await fn();
      if (options.debug ?? envDebug()) {
        console.log(`---- trace [${options.traceId}] ----\n${dump()}`);
      }
      return result;
    } catch (err) {
      console.error(`---- trace [${options.traceId}] ----\n${dump()}`);
      throw err;
    }
  };

  return {
    logger: base,
    get steps() {
      return steps;
    },
    record,
    flushOnFailure,
    dump,
  };
};
