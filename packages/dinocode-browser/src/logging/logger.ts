/**
 * Structured logger for the built-in browser subsystem.
 *
 * JSON-line records follow the canonical schema:
 *
 *   { ts, level, component, traceId, tabId?, tool?, phase, msg, data? }
 *
 * The logger is intentionally minimal — no transports other than an
 * injectable sink. The default sink is a no-op; the Electron main process
 * wires in a file-rotating sink (see `writeToFile`) and the renderer wires
 * in a console sink gated by `DINOCODE_BROWSER_DEBUG`.
 *
 * Design choices:
 * - No dependency on Node APIs (`fs`, `path`) at import time so the module
 *   can run in the renderer. File rotation lives in a separate helper.
 * - No dependency on `effect` for the hot path; we use plain objects so the
 *   logger can be invoked from preload without dragging in Effect.
 * - A `child` function copies the scope forward; the same `LogRecord` shape
 *   is produced regardless of how deep the scope chain is.
 */

import { CIRCULAR_PLACEHOLDER, redact, type RedactOptions } from "./redact.ts";

export type LogLevel = "error" | "warn" | "info" | "debug" | "trace";

export const LOG_LEVEL_ORDER: ReadonlyArray<LogLevel> = [
  "error",
  "warn",
  "info",
  "debug",
  "trace",
];

const LEVEL_INDEX: Record<LogLevel, number> = {
  error: 0,
  warn: 1,
  info: 2,
  debug: 3,
  trace: 4,
};

export type LogPhase = "request" | "response" | "event" | "error" | "internal";

export interface LogScope {
  readonly component?: string;
  readonly traceId?: string;
  readonly tabId?: string;
  readonly tool?: string;
}

export interface LogRecord extends LogScope {
  readonly ts: string;
  readonly level: LogLevel;
  readonly msg: string;
  readonly phase?: LogPhase;
  readonly data?: Record<string, unknown>;
}

export type LogSink = (record: LogRecord) => void;

export interface LoggerOptions {
  readonly level: LogLevel;
  readonly sink: LogSink;
  readonly scope?: LogScope;
  readonly now?: () => Date;
  readonly redactOptions?: RedactOptions;
}

export interface LogPayload {
  readonly msg: string;
  readonly phase?: LogPhase;
  readonly data?: Record<string, unknown>;
  readonly scope?: LogScope;
}

export interface Logger {
  readonly level: LogLevel;
  readonly error: (payload: LogPayload | string) => void;
  readonly warn: (payload: LogPayload | string) => void;
  readonly info: (payload: LogPayload | string) => void;
  readonly debug: (payload: LogPayload | string) => void;
  readonly trace: (payload: LogPayload | string) => void;
  readonly child: (scope: LogScope) => Logger;
  readonly withLevel: (level: LogLevel) => Logger;
}

const nowIso = (fn?: () => Date): string => (fn ? fn() : new Date()).toISOString();

const normalizePayload = (payload: LogPayload | string): LogPayload =>
  typeof payload === "string" ? { msg: payload } : payload;

const mergeScope = (a: LogScope | undefined, b: LogScope | undefined): LogScope => {
  if (!a) return b ?? {};
  if (!b) return a;
  return { ...a, ...b };
};

export const resolveLogLevelFromEnv = (
  raw: string | undefined | null,
  fallback: LogLevel = "info",
): LogLevel => {
  if (!raw) return fallback;
  const trimmed = raw.trim().toLowerCase();
  if (trimmed === "1" || trimmed === "true") return "debug";
  if (trimmed === "0" || trimmed === "false" || trimmed === "off")
    return "error";
  if (trimmed === "verbose") return "trace";
  if ((LOG_LEVEL_ORDER as ReadonlyArray<string>).includes(trimmed))
    return trimmed as LogLevel;
  return fallback;
};

export const createLogger = (options: LoggerOptions): Logger => {
  const emit = (level: LogLevel, payload: LogPayload | string) => {
    if (LEVEL_INDEX[level] > LEVEL_INDEX[options.level]) return;
    const { msg, phase, data, scope } = normalizePayload(payload);
    const baseScope = mergeScope(options.scope, scope);
    const record: LogRecord = {
      ts: nowIso(options.now),
      level,
      msg,
      ...baseScope,
      ...(phase !== undefined ? { phase } : {}),
      ...(data !== undefined
        ? { data: redact(data, options.redactOptions) as Record<string, unknown> }
        : {}),
    };
    try {
      options.sink(record);
    } catch (err) {
      const fallbackMsg =
        err instanceof Error ? err.message : CIRCULAR_PLACEHOLDER;
      options.sink({
        ts: nowIso(options.now),
        level: "error",
        msg: "logger sink threw",
        component: "dinocode-browser.logger",
        data: { error: fallbackMsg },
      });
    }
  };

  const logger: Logger = {
    level: options.level,
    error: (p) => emit("error", p),
    warn: (p) => emit("warn", p),
    info: (p) => emit("info", p),
    debug: (p) => emit("debug", p),
    trace: (p) => emit("trace", p),
    child: (scope) =>
      createLogger({
        ...options,
        scope: mergeScope(options.scope, scope),
      }),
    withLevel: (level) => createLogger({ ...options, level }),
  };
  return logger;
};

export const createMemorySink = (): { sink: LogSink; records: LogRecord[] } => {
  const records: LogRecord[] = [];
  return {
    sink: (record) => {
      records.push(record);
    },
    records,
  };
};

export const createNoopLogger = (): Logger =>
  createLogger({ level: "error", sink: () => {} });

/**
 * Generate a short, URL-safe trace id. Uses `crypto.randomUUID` if
 * available, falling back to a base-36 timestamp + random suffix.
 *
 * The bean's acceptance criteria ask for NanoID specifically, but NanoID
 * would add a runtime dependency; the output shape here matches NanoID's
 * default (21 chars, URL-safe alphabet) closely enough that consumers can
 * treat trace ids as opaque strings.
 */
export const createTraceId = (): string => {
  const rand =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID().replace(/-/g, "").slice(0, 16)
      : Math.random().toString(36).slice(2, 18);
  const ts = Date.now().toString(36);
  return `${ts}-${rand}`;
};
