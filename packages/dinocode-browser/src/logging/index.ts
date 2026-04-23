/**
 * Structured logging for the built-in browser subsystem.
 *
 * Exports:
 * - {@link createLogger} — build a leveled logger with an injectable sink.
 * - {@link createTraceId} — short, URL-safe trace id generator.
 * - {@link redact} — deep-redact secret-bearing keys before logging.
 * - {@link createMemorySink} — convenient in-memory sink for tests.
 *
 * The logger is deliberately small (no Node dependencies at import time) so
 * the same module powers main, preload, and renderer code paths. File
 * rotation is implemented by callers (Electron main process) on top of a
 * sink that writes to `.dinocode/browser/logs/<date>.log`.
 */

export * from "./logger.ts";
export * from "./redact.ts";
