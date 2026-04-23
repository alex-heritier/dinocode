import { describe, expect, it } from "vitest";

import { DEFAULT_NETWORK_CAPACITY, createNetworkBuffer } from "../capture/networkBuffer.ts";

describe("NetworkRingBuffer", () => {
  it("defaults to a 500-entry capacity", () => {
    const buf = createNetworkBuffer();
    expect(buf.capacity).toBe(DEFAULT_NETWORK_CAPACITY);
  });

  it("tracks request -> response -> finished lifecycle in place", () => {
    let t = 10;
    const buf = createNetworkBuffer({ now: () => (t += 5) });
    const req = buf.onRequestWillBeSent({
      requestId: "r1",
      method: "GET",
      url: "https://ex.test/a",
    });
    expect(req.status).toBe("pending");
    const headers = buf.onResponseReceived({
      requestId: "r1",
      statusCode: 200,
      mimeType: "text/html",
      responseHeaders: { "content-type": "text/html" },
    });
    expect(headers?.status).toBe("headers-received");
    expect(headers?.statusCode).toBe(200);
    const finished = buf.onLoadingFinished({ requestId: "r1", encodedDataLength: 1234 });
    expect(finished?.status).toBe("completed");
    expect(finished?.encodedDataLength).toBe(1234);
    expect(finished?.timing.durationMs).toBeGreaterThan(0);
    expect(buf.size()).toBe(1);
    expect(buf.inFlightCount()).toBe(0);
  });

  it("records loading failures with the failure reason", () => {
    const buf = createNetworkBuffer();
    buf.onRequestWillBeSent({ requestId: "r2", method: "GET", url: "https://ex.test/b" });
    const failed = buf.onLoadingFailed({ requestId: "r2", errorText: "net::ERR_FAILED" });
    expect(failed?.status).toBe("failed");
    expect(failed?.failureReason).toBe("net::ERR_FAILED");
  });

  it("flags canceled requests distinctly from genuine failures", () => {
    const buf = createNetworkBuffer();
    buf.onRequestWillBeSent({ requestId: "r3", method: "GET", url: "https://ex.test/c" });
    const canceled = buf.onLoadingFailed({ requestId: "r3", errorText: "canceled", canceled: true });
    expect(canceled?.status).toBe("cancelled");
  });

  it("ignores lifecycle events for unknown requestIds", () => {
    const buf = createNetworkBuffer();
    expect(buf.onLoadingFinished({ requestId: "missing" })).toBeUndefined();
    expect(buf.onLoadingFailed({ requestId: "missing", errorText: "x" })).toBeUndefined();
    expect(buf.onResponseReceived({ requestId: "missing", statusCode: 404 })).toBeUndefined();
  });

  it("keeps body capture disabled by default", () => {
    const buf = createNetworkBuffer();
    expect(buf.isBodyCaptureEnabled()).toBe(false);
    buf.enableBodyCapture();
    expect(buf.isBodyCaptureEnabled()).toBe(true);
    buf.disableBodyCapture();
    expect(buf.isBodyCaptureEnabled()).toBe(false);
  });

  it("evicts oldest records past capacity while keeping the index accurate", () => {
    const buf = createNetworkBuffer({ capacity: 3 });
    for (let i = 0; i < 5; i += 1) {
      buf.onRequestWillBeSent({
        requestId: `r${i}`,
        method: "GET",
        url: `https://ex.test/${i}`,
      });
      buf.onLoadingFinished({ requestId: `r${i}` });
    }
    expect(buf.size()).toBe(3);
    expect(buf.snapshot().map((e) => e.requestId)).toEqual(["r2", "r3", "r4"]);
  });

  it("markBodyCaptured flips the flag for known ids only", () => {
    const buf = createNetworkBuffer();
    buf.onRequestWillBeSent({ requestId: "r1", method: "GET", url: "https://ex.test/x" });
    buf.markBodyCaptured("r1");
    buf.markBodyCaptured("unknown");
    expect(buf.getByRequestId("r1")?.bodyCaptured).toBe(true);
  });
});
