/**
 * Structured browser tool / IPC error taxonomy.
 *
 * Real handlers will raise tagged Effect errors; see
 * docs/dinocode-browser.md §"Structured tool errors & retry policy" for the
 * authoritative list. This scaffold declares the shape so downstream beans
 * can import the union name while the real values land.
 */

export type BrowserErrorKind =
  | "TabNotFound"
  | "TabCrashed"
  | "CdpDetached"
  | "SelectorNotFound"
  | "NavigationBlocked"
  | "NavigationTimeout"
  | "ElementNotVisible"
  | "PermissionDenied"
  | "RateLimited"
  | "BufferOverflow"
  | "Internal";

export interface BrowserError {
  readonly kind: BrowserErrorKind;
  readonly message: string;
  readonly retryable: boolean;
  readonly details?: Record<string, unknown>;
}

export const BrowserError = (
  kind: BrowserErrorKind,
  message: string,
  options: { retryable?: boolean; details?: Record<string, unknown> } = {},
): BrowserError => ({
  kind,
  message,
  retryable: options.retryable ?? false,
  ...(options.details !== undefined ? { details: options.details } : {}),
});
