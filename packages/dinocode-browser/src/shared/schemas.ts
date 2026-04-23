/**
 * Effect Schema definitions for every IPC payload that crosses the
 * main ↔ preload ↔ renderer boundary in the built-in browser subsystem.
 *
 * These schemas are the single source of truth for the IPC contract. Both
 * sides of `contextBridge.exposeInMainWorld` validate against them, so a
 * malformed payload surfaces as a structured `ParseError` rather than a
 * silent `undefined`.
 *
 * Naming: schemas are exported as values (e.g. `BrowserTabState`) and as
 * types (the `.Type` or derived `type X = typeof X.Type`). Branded id
 * aliases declared in `./ids.ts` coexist with the Schema-derived runtime
 * types — the Schema-derived ones are used on the wire, the branded
 * aliases are used inside TypeScript code where `Effect.Schema` would
 * be overkill (e.g. for local state).
 */

import { Schema } from "effect";

const trimmedMaxLen = (max: number) => Schema.String.pipe(Schema.check(Schema.isMaxLength(max)));

export const BrowserTabIdSchema = Schema.String.pipe(
  Schema.check(Schema.isPattern(/^[a-z0-9][a-z0-9_-]{0,63}$/)),
);
export type BrowserTabIdSchema = typeof BrowserTabIdSchema.Type;

export const BrowserPartitionIdSchema = Schema.String.pipe(
  Schema.check(Schema.isPattern(/^persist:[a-z0-9][a-z0-9_-]{0,63}$/)),
);
export type BrowserPartitionIdSchema = typeof BrowserPartitionIdSchema.Type;

export const BrowserTraceIdSchema = Schema.String.pipe(
  Schema.check(Schema.isMinLength(8)),
  Schema.check(Schema.isMaxLength(64)),
);
export type BrowserTraceIdSchema = typeof BrowserTraceIdSchema.Type;

export const BrowserTabStatusSchema = Schema.Literals(["loading", "ready", "crashed", "closed"]);
export type BrowserTabStatus = typeof BrowserTabStatusSchema.Type;

export const BrowserTabState = Schema.Struct({
  tabId: BrowserTabIdSchema,
  partitionId: BrowserPartitionIdSchema,
  url: trimmedMaxLen(2048),
  title: trimmedMaxLen(1024),
  status: BrowserTabStatusSchema,
  loadingProgress: Schema.Number.pipe(
    Schema.check(Schema.isGreaterThanOrEqualTo(0)),
    Schema.check(Schema.isLessThanOrEqualTo(1)),
  ),
  canGoBack: Schema.Boolean,
  canGoForward: Schema.Boolean,
  muted: Schema.Boolean,
  updatedAt: Schema.String,
});
export type BrowserTabState = typeof BrowserTabState.Type;

export const BrowserNavigationEventKindSchema = Schema.Literals([
  "start",
  "committed",
  "finished",
  "failed",
  "redirected",
]);
export type BrowserNavigationEventKind = typeof BrowserNavigationEventKindSchema.Type;

export const BrowserNavigationEvent = Schema.Struct({
  tabId: BrowserTabIdSchema,
  kind: BrowserNavigationEventKindSchema,
  url: trimmedMaxLen(2048),
  statusCode: Schema.optional(
    Schema.Number.pipe(
      Schema.check(Schema.isGreaterThanOrEqualTo(0)),
      Schema.check(Schema.isLessThanOrEqualTo(599)),
    ),
  ),
  errorText: Schema.optional(trimmedMaxLen(512)),
  timestamp: Schema.String,
});
export type BrowserNavigationEvent = typeof BrowserNavigationEvent.Type;

export const BrowserConsoleLevelSchema = Schema.Literals([
  "log",
  "info",
  "warn",
  "error",
  "debug",
  "trace",
]);
export type BrowserConsoleLevel = typeof BrowserConsoleLevelSchema.Type;

export const BrowserConsoleEntry = Schema.Struct({
  tabId: BrowserTabIdSchema,
  cursor: Schema.Number.pipe(Schema.check(Schema.isGreaterThanOrEqualTo(0))),
  level: BrowserConsoleLevelSchema,
  text: trimmedMaxLen(8192),
  source: Schema.optional(trimmedMaxLen(512)),
  lineNumber: Schema.optional(Schema.Number),
  columnNumber: Schema.optional(Schema.Number),
  stackTrace: Schema.optional(trimmedMaxLen(16_384)),
  timestamp: Schema.String,
});
export type BrowserConsoleEntry = typeof BrowserConsoleEntry.Type;

export const BrowserNetworkEntry = Schema.Struct({
  tabId: BrowserTabIdSchema,
  cursor: Schema.Number.pipe(Schema.check(Schema.isGreaterThanOrEqualTo(0))),
  requestId: trimmedMaxLen(128),
  method: trimmedMaxLen(16),
  url: trimmedMaxLen(2048),
  status: Schema.optional(
    Schema.Number.pipe(
      Schema.check(Schema.isGreaterThanOrEqualTo(0)),
      Schema.check(Schema.isLessThanOrEqualTo(599)),
    ),
  ),
  mimeType: Schema.optional(trimmedMaxLen(128)),
  requestHeaders: Schema.Record(Schema.String, Schema.String),
  responseHeaders: Schema.optional(Schema.Record(Schema.String, Schema.String)),
  sizeBytes: Schema.optional(Schema.Number),
  durationMs: Schema.optional(Schema.Number),
  failed: Schema.Boolean,
  failureReason: Schema.optional(trimmedMaxLen(256)),
  startedAt: Schema.String,
  finishedAt: Schema.optional(Schema.String),
});
export type BrowserNetworkEntry = typeof BrowserNetworkEntry.Type;

export const BrowserToolNameSchema = Schema.Literals([
  "dinocode_browser_navigate",
  "dinocode_browser_reload",
  "dinocode_browser_open_tab",
  "dinocode_browser_list_tabs",
  "dinocode_browser_close_tab",
  "dinocode_browser_click",
  "dinocode_browser_hover",
  "dinocode_browser_type",
  "dinocode_browser_press_key",
  "dinocode_browser_fill",
  "dinocode_browser_screenshot_viewport",
  "dinocode_browser_screenshot_element",
  "dinocode_browser_query_selector",
  "dinocode_browser_wait_for_selector",
  "dinocode_browser_get_accessibility_tree",
  "dinocode_browser_get_dom_snapshot",
  "dinocode_browser_get_console",
  "dinocode_browser_get_network_requests",
  "dinocode_browser_evaluate",
  "dinocode_browser_pick_element",
]);
export type BrowserToolName = typeof BrowserToolNameSchema.Type;

export const BrowserToolRequest = Schema.Struct({
  tool: BrowserToolNameSchema,
  tabId: Schema.optional(BrowserTabIdSchema),
  traceId: BrowserTraceIdSchema,
  timestamp: Schema.String,
  args: Schema.Record(Schema.String, Schema.Unknown),
});
export type BrowserToolRequest = typeof BrowserToolRequest.Type;

export const BrowserToolErrorKindSchema = Schema.Literals([
  "TabNotFound",
  "TabCrashed",
  "CdpDetached",
  "SelectorNotFound",
  "NavigationBlocked",
  "NavigationTimeout",
  "ElementNotVisible",
  "PermissionDenied",
  "RateLimited",
  "BufferOverflow",
  "Internal",
]);
export type BrowserToolErrorKind = typeof BrowserToolErrorKindSchema.Type;

export const BrowserToolErrorSchema = Schema.Struct({
  kind: BrowserToolErrorKindSchema,
  message: trimmedMaxLen(1024),
  retryable: Schema.Boolean,
  details: Schema.optional(Schema.Record(Schema.String, Schema.Unknown)),
});
export type BrowserToolError = typeof BrowserToolErrorSchema.Type;

export const BrowserToolResponse = Schema.Struct({
  tool: BrowserToolNameSchema,
  traceId: BrowserTraceIdSchema,
  timestamp: Schema.String,
  durationMs: Schema.Number.pipe(Schema.check(Schema.isGreaterThanOrEqualTo(0))),
  result: Schema.Union([
    Schema.Struct({
      ok: Schema.Literal(true),
      data: Schema.Record(Schema.String, Schema.Unknown),
    }),
    Schema.Struct({
      ok: Schema.Literal(false),
      error: BrowserToolErrorSchema,
    }),
  ]),
});
export type BrowserToolResponse = typeof BrowserToolResponse.Type;

export const BrowserActionActorSchema = Schema.Literals(["user", "agent", "system"]);
export type BrowserActionActor = typeof BrowserActionActorSchema.Type;

export const BrowserActionLogEntry = Schema.Struct({
  cursor: Schema.Number.pipe(Schema.check(Schema.isGreaterThanOrEqualTo(0))),
  tabId: Schema.optional(BrowserTabIdSchema),
  actor: BrowserActionActorSchema,
  traceId: BrowserTraceIdSchema,
  tool: Schema.optional(BrowserToolNameSchema),
  phase: Schema.Literals(["request", "response", "event", "error"]),
  summary: trimmedMaxLen(512),
  timestamp: Schema.String,
});
export type BrowserActionLogEntry = typeof BrowserActionLogEntry.Type;

/**
 * Envelope for renderer → main invocations. Main always responds with a
 * `BrowserToolResponse`.
 */
export const BrowserInvokeEnvelope = Schema.Struct({
  request: BrowserToolRequest,
});
export type BrowserInvokeEnvelope = typeof BrowserInvokeEnvelope.Type;

/**
 * Events pushed from main → renderer on the subscription channels.
 */
export const BrowserEventEnvelope = Schema.Union([
  Schema.Struct({
    kind: Schema.Literal("tab.state"),
    payload: BrowserTabState,
  }),
  Schema.Struct({
    kind: Schema.Literal("tab.navigation"),
    payload: BrowserNavigationEvent,
  }),
  Schema.Struct({
    kind: Schema.Literal("tab.console"),
    payload: BrowserConsoleEntry,
  }),
  Schema.Struct({
    kind: Schema.Literal("tab.network"),
    payload: BrowserNetworkEntry,
  }),
  Schema.Struct({
    kind: Schema.Literal("action.log"),
    payload: BrowserActionLogEntry,
  }),
]);
export type BrowserEventEnvelope = typeof BrowserEventEnvelope.Type;
