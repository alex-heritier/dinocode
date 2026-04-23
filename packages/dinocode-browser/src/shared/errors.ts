/**
 * Canonical browser-tool error taxonomy.
 *
 * Every browser tool handler exits through this union — raw `throw` is not
 * allowed past the handler boundary (the IPC and WebSocket layers validate
 * the response shape via {@link BrowserToolErrorSchema}). Stable codes let
 * agents self-correct without human intervention.
 *
 * The retry classification is authoritative for the handlers: `retryable`
 * errors SHOULD be retried once with a 250 ms backoff before surfacing to
 * the agent, while `fatal` errors MUST be surfaced immediately. See
 * `docs/dinocode-browser.md` §"Retry-safe vs. fatal errors" for the full
 * table, including the suggested agent response for each code.
 *
 * Hints are short, agent-targeted strings — they explain *what to try
 * next* rather than restating the failure.
 */

export const BROWSER_ERROR_KINDS = [
  /** Target URL fails the navigation allowlist. */
  "NavigationBlocked",
  /** Renderer process for the tab is gone (OOM, native crash, user close). */
  "TabCrashed",
  /** HTTP or network error during navigation (non-2xx final status, DNS fail, TLS). */
  "LoadFailed",
  /** JS evaluated inside the page threw an uncaught exception. */
  "EvaluateError",
  /** Operation exceeded its deadline (waiter, navigation, selector, screenshot). */
  "Timeout",
  /** Selector, tab id, or resource id did not resolve. */
  "NotFound",
  /** Element exists but is offscreen, disabled, detached, or covered. */
  "NotInteractable",
  /** Operation denied because the user is actively interacting with the tab. */
  "UserActive",
  /** User explicitly revoked agent control for this tab or session. */
  "PermissionDenied",
  /** Tab cap (per project or global) reached; cannot open another tab. */
  "TooManyTabs",
  /** Ring buffer overflowed and the request window was dropped. */
  "BufferOverflow",
  /** Per-tab quota for agent actions exceeded; back off before retrying. */
  "RateLimited",
  /** CDP session detached unexpectedly; the manager will reattach. */
  "CdpDetached",
  /** Catch-all — unknown or unexpected failure. Always fatal + reported. */
  "Internal",
] as const;

export type BrowserErrorKind = (typeof BROWSER_ERROR_KINDS)[number];

/**
 * Retry classification for each canonical error code.
 *
 * - `retryable` — the action may succeed on a second attempt (transient).
 *   Handlers are expected to retry at most once with ~250 ms backoff
 *   before returning the error to the agent.
 * - `fatal` — retrying will not help. Surface immediately so the agent
 *   can pick a different strategy (or ask the user).
 */
export const BROWSER_ERROR_RETRY_POLICY: Readonly<
  Record<BrowserErrorKind, "retryable" | "fatal">
> = {
  NavigationBlocked: "fatal",
  TabCrashed: "fatal",
  LoadFailed: "retryable",
  EvaluateError: "fatal",
  Timeout: "retryable",
  NotFound: "retryable",
  NotInteractable: "retryable",
  UserActive: "retryable",
  PermissionDenied: "fatal",
  TooManyTabs: "fatal",
  BufferOverflow: "fatal",
  RateLimited: "retryable",
  CdpDetached: "retryable",
  Internal: "fatal",
};

/**
 * Agent-facing hints for each error code. Keep them short (< 120 chars)
 * and action-oriented — they are rendered as-is into the tool response
 * so the agent can decide what to do next.
 */
export const BROWSER_ERROR_DEFAULT_HINTS: Readonly<
  Record<BrowserErrorKind, string>
> = {
  NavigationBlocked:
    "Target URL is outside the project allowlist. Ask the user to allow this host in Browser Settings.",
  TabCrashed:
    "The tab renderer crashed. Call dinocode_browser_reload or open a fresh tab.",
  LoadFailed:
    "The page did not load. Retry once; if it still fails, check the URL or the network.",
  EvaluateError:
    "Page script threw. Inspect the exception via dinocode_browser_get_console and fix the expression.",
  Timeout:
    "The waiter expired. Increase the timeout, verify the selector/URL, or retry.",
  NotFound:
    "Selector or tab id did not resolve. Query the accessibility tree to confirm the element exists.",
  NotInteractable:
    "Element is offscreen, disabled, detached, or covered. Scroll into view and try again.",
  UserActive:
    "The user is actively driving this tab. Wait for the takeover banner to clear before retrying.",
  PermissionDenied:
    "Agent control is disabled for this tab. Ask the user to re-enable it from the browser panel.",
  TooManyTabs:
    "The project tab cap is reached. Close an existing tab via dinocode_browser_close_tab first.",
  BufferOverflow:
    "Log ring buffer wrapped; the requested window is no longer available. Request a newer cursor.",
  RateLimited:
    "Per-tab action quota exceeded. Back off for a moment before issuing the next action.",
  CdpDetached:
    "CDP session dropped; manager will reattach automatically. Retry the action.",
  Internal:
    "An internal browser error occurred; see details.traceId in the logs and report the bean.",
};

export interface BrowserError {
  readonly kind: BrowserErrorKind;
  readonly message: string;
  readonly retryable: boolean;
  readonly hint?: string;
  readonly details?: Record<string, unknown>;
}

export const isRetryable = (kind: BrowserErrorKind): boolean =>
  BROWSER_ERROR_RETRY_POLICY[kind] === "retryable";

export const hintFor = (kind: BrowserErrorKind): string =>
  BROWSER_ERROR_DEFAULT_HINTS[kind];

export interface BrowserErrorOptions {
  readonly retryable?: boolean;
  readonly hint?: string;
  readonly details?: Record<string, unknown>;
}

/**
 * Build a structured browser error. Retryable defaults to the canonical
 * policy for `kind` (see {@link BROWSER_ERROR_RETRY_POLICY}), and the
 * default hint is auto-attached when the caller doesn't provide one.
 */
export const BrowserError = (
  kind: BrowserErrorKind,
  message: string,
  options: BrowserErrorOptions = {},
): BrowserError => ({
  kind,
  message,
  retryable: options.retryable ?? isRetryable(kind),
  hint: options.hint ?? hintFor(kind),
  ...(options.details !== undefined ? { details: options.details } : {}),
});
