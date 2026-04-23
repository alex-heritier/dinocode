/**
 * Branded identifiers used across the browser subsystem.
 *
 * The real implementations will replace these with Effect `Schema.brand`
 * types. For now we keep plain `string` branded via intersection types so the
 * package can compile as an empty scaffold without pulling in `effect` at
 * runtime.
 */

type Brand<T, B extends string> = T & { readonly __brand: B };

/** A browser tab identifier, opaque to callers. */
export type TabId = Brand<string, "dinocode.browser.TabId">;

/** A CDP session identifier scoped to a single WebContentsView. */
export type CdpSessionId = Brand<string, "dinocode.browser.CdpSessionId">;

/** A per-project session partition used to isolate cookies/storage. */
export type BrowserPartitionId = Brand<string, "dinocode.browser.PartitionId">;

/** Monotonically increasing cursor for ring buffers (console, network, ...). */
export type BufferCursor = Brand<number, "dinocode.browser.BufferCursor">;

export const TabId = (raw: string): TabId => raw as TabId;
export const CdpSessionId = (raw: string): CdpSessionId => raw as CdpSessionId;
export const BrowserPartitionId = (raw: string): BrowserPartitionId => raw as BrowserPartitionId;
export const BufferCursor = (raw: number): BufferCursor => raw as BufferCursor;
