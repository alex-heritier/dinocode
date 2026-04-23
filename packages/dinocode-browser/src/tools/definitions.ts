/**
 * Shared browser agent-tool definitions.
 *
 * Every browser-oriented agent tool lives here as a single `ToolDefinition`
 * value. Provider adapters (Codex, Claude, Cursor) translate these into
 * their native shapes via the helpers in `./adapters.ts`, which guarantees a
 * single source of truth for tool name, description, input/output schema,
 * and handler.
 *
 * Handlers are implemented in follow-on beans (`dinocode-w0qv`,
 * `dinocode-t2l9`, `dinocode-kww9`, etc.). This module exposes the
 * catalogue and a `DinocodeToolResult<T>` envelope that every handler must
 * return.
 */

import { Schema } from "effect";

import {
  BrowserTabIdSchema,
  BrowserToolErrorKindSchema,
  BrowserToolNameSchema,
  BrowserTraceIdSchema,
} from "../shared/schemas.ts";

/**
 * Universal return envelope. Mirrors the task-tool shape introduced by
 * dinocode-ndam so the provider adapters can share serialisation code.
 *
 * The `hint` field lets agents self-correct; e.g. a `NavigationBlocked` error
 * hints "ask the user to allowlist this origin". Hints are short, stable
 * strings — never user-facing copy.
 */
export type DinocodeToolResult<T> =
  | { readonly ok: true; readonly data: T }
  | {
      readonly ok: false;
      readonly code: typeof BrowserToolErrorKindSchema.Type;
      readonly message: string;
      readonly hint?: string;
    };

export const DinocodeToolResultSchema = <A extends Schema.Top>(data: A) =>
  Schema.Union([
    Schema.Struct({
      ok: Schema.Literal(true),
      data,
    }),
    Schema.Struct({
      ok: Schema.Literal(false),
      code: BrowserToolErrorKindSchema,
      message: Schema.String,
      hint: Schema.optional(Schema.String),
    }),
  ]);

/**
 * The execution context a handler sees when invoked through any provider
 * adapter. Stays minimal on purpose — the full deps (BrowserManager, logger,
 * traceId) are wired in by the host in `apps/server` via a one-line
 * `dinocode-integration:` annotation.
 */
export interface DinocodeToolContext {
  readonly traceId: typeof BrowserTraceIdSchema.Type;
  readonly tabId?: typeof BrowserTabIdSchema.Type;
  readonly now: () => Date;
  /**
   * Implemented by the host. Runs the underlying BrowserManager call and
   * converts thrown errors into the tagged-failure branch of
   * `DinocodeToolResult`. The scaffold exposes it as an abstract function so
   * handlers can be unit-tested with a fake.
   */
  readonly invokeBrowser: (
    tool: typeof BrowserToolNameSchema.Type,
    args: Record<string, unknown>,
  ) => Promise<DinocodeToolResult<unknown>>;
}

/**
 * A provider-agnostic tool definition. Downstream beans populate the
 * `inputSchema`, `outputSchema`, and `handler` fields per tool.
 */
export interface DinocodeToolDefinition<
  Input extends Schema.Top = Schema.Top,
  Output extends Schema.Top = Schema.Top,
> {
  readonly name: typeof BrowserToolNameSchema.Type;
  readonly description: string;
  readonly inputSchema: Input;
  readonly outputSchema: Output;
  readonly handler: (
    input: Input["Type"],
    ctx: DinocodeToolContext,
  ) => Promise<DinocodeToolResult<Output["Type"]>>;
}

/** Helper to produce a `not implemented` failure envelope for scaffold handlers. */
export const notImplementedResult = (tool: string): DinocodeToolResult<never> => ({
  ok: false,
  code: "Internal",
  message: `Tool ${tool} is not implemented yet`,
  hint: "Implement the handler in the corresponding bean before exposing this tool to agents.",
});

/**
 * Scaffold input/output schemas: handlers that will be filled in by
 * downstream beans. Each definition is `Schema.Unknown` so any JSON shape is
 * accepted at this stage; individual beans will replace these with precise
 * structs.
 */
const placeholderInput = Schema.Struct({});
const placeholderOutput = Schema.Struct({});

const placeholderHandler =
  (name: typeof BrowserToolNameSchema.Type) => async (): Promise<DinocodeToolResult<never>> =>
    notImplementedResult(name);

type PlaceholderDef = DinocodeToolDefinition<typeof placeholderInput, typeof placeholderOutput>;

const def = (name: typeof BrowserToolNameSchema.Type, description: string): PlaceholderDef => ({
  name,
  description,
  inputSchema: placeholderInput,
  outputSchema: placeholderOutput,
  handler: placeholderHandler(name),
});

/**
 * The canonical browser tool catalogue. Downstream beans will replace each
 * placeholder with a fully-typed definition. Removing a tool here is a
 * breaking API change — add first, deprecate second.
 */
export const BROWSER_TOOL_DEFINITIONS: ReadonlyArray<PlaceholderDef> = [
  def(
    "dinocode_browser_navigate",
    "Navigate the browser tab to a URL. Resolves when the load is committed or fails.",
  ),
  def("dinocode_browser_reload", "Reload the current tab."),
  def(
    "dinocode_browser_open_tab",
    "Open a new browser tab bound to the current project's session partition.",
  ),
  def("dinocode_browser_list_tabs", "List all open browser tabs with status."),
  def("dinocode_browser_close_tab", "Close a browser tab by id."),
  def("dinocode_browser_click", "Click an element resolved by selector or accessibility handle."),
  def("dinocode_browser_hover", "Hover the pointer over a resolved element."),
  def("dinocode_browser_type", "Type into the currently-focused input. Use after click/focus."),
  def("dinocode_browser_press_key", "Dispatch a named key press (Enter, Escape, ArrowDown, ...)."),
  def("dinocode_browser_fill", "Atomically clear an input and type the provided value."),
  def(
    "dinocode_browser_screenshot_viewport",
    "Capture a PNG of the current viewport. Returns an artifact reference.",
  ),
  def(
    "dinocode_browser_screenshot_element",
    "Capture a PNG of a specific element. Returns an artifact reference.",
  ),
  def(
    "dinocode_browser_query_selector",
    "Resolve a CSS selector to an element handle + bounding box.",
  ),
  def(
    "dinocode_browser_wait_for_selector",
    "Wait until a selector matches (attached/visible) within a timeout.",
  ),
  def(
    "dinocode_browser_get_accessibility_tree",
    "Return a compact semantic accessibility-tree snapshot of the current tab.",
  ),
  def(
    "dinocode_browser_get_dom_snapshot",
    "Return a coarse DOM snapshot; limited to the top-level document.",
  ),
  def(
    "dinocode_browser_get_console",
    "Drain the console ring buffer since a cursor; returns entries + new cursor.",
  ),
  def(
    "dinocode_browser_get_network_requests",
    "Drain the network ring buffer since a cursor; returns entries + new cursor.",
  ),
  def(
    "dinocode_browser_evaluate",
    "Evaluate JS in the page context and return a JSON-safe result.",
  ),
  def(
    "dinocode_browser_pick_element",
    "Start a user-assisted element picker overlay. Resolves when the user picks.",
  ),
];

export type BrowserToolCatalogue = typeof BROWSER_TOOL_DEFINITIONS;
