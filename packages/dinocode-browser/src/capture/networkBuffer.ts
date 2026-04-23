/**
 * Per-tab `NetworkRingBuffer`.
 *
 * Maintains in-flight + completed request state derived from the standard
 * CDP `Network.*` lifecycle. Bodies are NEVER stored in the ring — the
 * buffer only holds metadata. Body capture is a separate opt-in path
 * that writes to `.dinocode/browser/network-bodies/<tabId>/` and is
 * surfaced through `dinocode_browser_get_network_requests` on demand.
 */

import type { DrainOptions, DrainResult, RingCursor } from "./ringBuffer.ts";
import { createRingBuffer } from "./ringBuffer.ts";

export type NetworkResourceType =
  | "Document"
  | "Stylesheet"
  | "Image"
  | "Media"
  | "Font"
  | "Script"
  | "TextTrack"
  | "XHR"
  | "Fetch"
  | "EventSource"
  | "WebSocket"
  | "Manifest"
  | "SignedExchange"
  | "Ping"
  | "CSPViolationReport"
  | "Preflight"
  | "Other";

export type NetworkRequestStatus =
  | "pending"
  | "headers-received"
  | "completed"
  | "failed"
  | "cancelled";

export interface NetworkTiming {
  readonly requestedAt: number;
  readonly responseAt?: number | undefined;
  readonly completedAt?: number | undefined;
  readonly durationMs?: number | undefined;
}

export interface NetworkInitiator {
  readonly type: "parser" | "script" | "preload" | "SignedExchange" | "preflight" | "other";
  readonly url?: string | undefined;
  readonly lineNumber?: number | undefined;
}

export interface NetworkEntry {
  readonly requestId: string;
  readonly method: string;
  readonly url: string;
  readonly resourceType: NetworkResourceType;
  readonly status: NetworkRequestStatus;
  readonly statusCode?: number | undefined;
  readonly statusText?: string | undefined;
  readonly mimeType?: string | undefined;
  readonly requestHeaders: Readonly<Record<string, string>>;
  readonly responseHeaders: Readonly<Record<string, string>>;
  readonly timing: NetworkTiming;
  readonly initiator?: NetworkInitiator | undefined;
  readonly failureReason?: string | undefined;
  readonly encodedDataLength?: number | undefined;
  readonly bodyCaptured?: boolean | undefined;
  readonly fromCache?: boolean | undefined;
}

export interface NetworkBufferOptions {
  readonly capacity?: number;
  readonly now?: () => number;
}

export interface RequestWillBeSentInput {
  readonly requestId: string;
  readonly method: string;
  readonly url: string;
  readonly resourceType?: NetworkResourceType;
  readonly requestHeaders?: Readonly<Record<string, string>>;
  readonly initiator?: NetworkInitiator;
  readonly ts?: number;
}

export interface ResponseReceivedInput {
  readonly requestId: string;
  readonly statusCode: number;
  readonly statusText?: string;
  readonly mimeType?: string;
  readonly responseHeaders?: Readonly<Record<string, string>>;
  readonly fromCache?: boolean;
  readonly ts?: number;
}

export interface LoadingFinishedInput {
  readonly requestId: string;
  readonly encodedDataLength?: number;
  readonly ts?: number;
}

export interface LoadingFailedInput {
  readonly requestId: string;
  readonly errorText: string;
  readonly canceled?: boolean;
  readonly ts?: number;
}

export interface NetworkBuffer {
  readonly capacity: number;
  size(): number;
  inFlightCount(): number;
  totalIngested(): number;
  totalDropped(): number;
  cursor(): RingCursor;
  isBodyCaptureEnabled(): boolean;
  enableBodyCapture(): void;
  disableBodyCapture(): void;
  markBodyCaptured(requestId: string): void;
  onRequestWillBeSent(input: RequestWillBeSentInput): NetworkEntry;
  onResponseReceived(input: ResponseReceivedInput): NetworkEntry | undefined;
  onLoadingFinished(input: LoadingFinishedInput): NetworkEntry | undefined;
  onLoadingFailed(input: LoadingFailedInput): NetworkEntry | undefined;
  drain(options?: DrainOptions): DrainResult<NetworkEntry>;
  snapshot(): ReadonlyArray<NetworkEntry>;
  getByRequestId(requestId: string): NetworkEntry | undefined;
  clear(): void;
}

export const DEFAULT_NETWORK_CAPACITY = 500;

const emptyHeaders: Readonly<Record<string, string>> = Object.freeze({});

export const createNetworkBuffer = (options: NetworkBufferOptions = {}): NetworkBuffer => {
  const capacity = options.capacity ?? DEFAULT_NETWORK_CAPACITY;
  const now = options.now ?? Date.now;
  const ring = createRingBuffer<NetworkEntry>({ capacity });
  const index = new Map<string, NetworkEntry>();
  let bodyCaptureEnabled = false;

  const upsert = (entry: NetworkEntry, isNew: boolean): void => {
    index.set(entry.requestId, entry);
    if (isNew) ring.ingest(entry);
    else {
      const snapshot = ring.snapshot();
      for (let i = snapshot.length - 1; i >= 0; i -= 1) {
        if (snapshot[i]!.value.requestId === entry.requestId) {
          (snapshot[i] as { value: NetworkEntry }).value = entry;
          break;
        }
      }
    }
  };

  return {
    capacity,
    size: ring.size,
    inFlightCount: () =>
      Array.from(index.values()).filter((e) => e.status === "pending" || e.status === "headers-received")
        .length,
    totalIngested: ring.totalIngested,
    totalDropped: ring.totalDropped,
    cursor: ring.cursor,
    isBodyCaptureEnabled: () => bodyCaptureEnabled,
    enableBodyCapture: () => {
      bodyCaptureEnabled = true;
    },
    disableBodyCapture: () => {
      bodyCaptureEnabled = false;
    },
    markBodyCaptured: (requestId) => {
      const existing = index.get(requestId);
      if (!existing) return;
      const next = { ...existing, bodyCaptured: true } satisfies NetworkEntry;
      upsert(next, false);
    },
    onRequestWillBeSent: (input) => {
      const entry: NetworkEntry = {
        requestId: input.requestId,
        method: input.method,
        url: input.url,
        resourceType: input.resourceType ?? "Other",
        status: "pending",
        requestHeaders: input.requestHeaders ?? emptyHeaders,
        responseHeaders: emptyHeaders,
        timing: { requestedAt: input.ts ?? now() },
        initiator: input.initiator,
      };
      upsert(entry, true);
      return entry;
    },
    onResponseReceived: (input) => {
      const existing = index.get(input.requestId);
      if (!existing) return undefined;
      const next: NetworkEntry = {
        ...existing,
        status: "headers-received",
        statusCode: input.statusCode,
        statusText: input.statusText,
        mimeType: input.mimeType,
        responseHeaders: input.responseHeaders ?? emptyHeaders,
        fromCache: input.fromCache,
        timing: { ...existing.timing, responseAt: input.ts ?? now() },
      };
      upsert(next, false);
      return next;
    },
    onLoadingFinished: (input) => {
      const existing = index.get(input.requestId);
      if (!existing) return undefined;
      const completedAt = input.ts ?? now();
      const next: NetworkEntry = {
        ...existing,
        status: "completed",
        encodedDataLength: input.encodedDataLength,
        timing: {
          ...existing.timing,
          completedAt,
          durationMs: completedAt - existing.timing.requestedAt,
        },
      };
      upsert(next, false);
      return next;
    },
    onLoadingFailed: (input) => {
      const existing = index.get(input.requestId);
      if (!existing) return undefined;
      const completedAt = input.ts ?? now();
      const next: NetworkEntry = {
        ...existing,
        status: input.canceled ? "cancelled" : "failed",
        failureReason: input.errorText,
        timing: {
          ...existing.timing,
          completedAt,
          durationMs: completedAt - existing.timing.requestedAt,
        },
      };
      upsert(next, false);
      return next;
    },
    drain: (opts) => ring.drain(opts),
    snapshot: () => ring.snapshot().map((entry) => entry.value),
    getByRequestId: (id) => index.get(id),
    clear: () => {
      ring.clear();
      index.clear();
    },
  };
};
