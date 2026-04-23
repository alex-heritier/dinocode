/**
 * Agent tool definitions for the built-in browser.
 *
 * `BROWSER_TOOL_DEFINITIONS` is the single source of truth. Provider-specific
 * adapters (Codex, Claude, Cursor) translate each definition into the shape
 * expected by the upstream SDK without touching the catalogue itself.
 *
 * Handler implementations are filled in by downstream beans (one per tool).
 * Until then each definition carries a `notImplementedResult` placeholder
 * so host wiring can be exercised end-to-end with contract tests.
 */

export * from "./definitions.ts";
export * from "./adapters.ts";
