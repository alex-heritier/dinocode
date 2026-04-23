import { describe, expect, it } from "vitest";

import { FIXTURES, withBrowser } from "../testing/index.ts";

describe("withBrowser harness", () => {
  it("serves fixtures and closes on success", async () => {
    const base = await withBrowser({}, async ({ server }) => {
      const res = await fetch(server.urlFor(FIXTURES.hello));
      const text = await res.text();
      expect(res.status).toBe(200);
      expect(text).toMatch(/Hello, world/);
      return server.baseUrl;
    });
    const follow = await fetch(`${base}${FIXTURES.hello}`).catch((err) => err);
    expect(follow).toBeInstanceOf(Error);
  });

  it("dumps the trace when the test body throws", async () => {
    const errors: string[] = [];
    const orig = console.error;
    console.error = (msg: unknown) => {
      errors.push(typeof msg === "string" ? msg : JSON.stringify(msg));
    };
    try {
      await expect(
        withBrowser({}, async ({ openPage }) => {
          openPage({ tabId: "tab-1" });
          throw new Error("nope");
        }),
      ).rejects.toThrow("nope");
    } finally {
      console.error = orig;
    }
    const dump = errors.join("\n");
    expect(dump).toMatch(/page.open/);
    expect(dump).toMatch(/tab-1/);
  });

  it("closes pages on failure, even when the body throws", async () => {
    const refs: { page?: { tabState: () => { status: string } } } = {};
    await expect(
      withBrowser({}, async ({ openPage }) => {
        refs.page = openPage({ tabId: "tab-ex" });
        throw new Error("fail");
      }),
    ).rejects.toThrow();
    expect(refs.page?.tabState().status).toBe("closed");
  });

  it("extends the fixture map with user-supplied pages", async () => {
    await withBrowser(
      { fixtures: { "/custom": "custom-body" } },
      async ({ server }) => {
        const res = await fetch(server.urlFor("/custom"));
        expect(await res.text()).toBe("custom-body");
        const std = await fetch(server.urlFor(FIXTURES.hello));
        expect(std.status).toBe(200);
      },
    );
  });
});

describe("FakePage DSL", () => {
  it("resolves expectConsole against historic entries", async () => {
    await withBrowser({}, async ({ openPage }) => {
      const page = openPage({ tabId: "tab-a" });
      page.pushConsole({ level: "log", text: "hello" });
      const hit = await page.expectConsole({ level: "log" });
      expect(hit.text).toBe("hello");
    });
  });

  it("waits for future entries with timeouts", async () => {
    await withBrowser({}, async ({ openPage }) => {
      const page = openPage({ tabId: "tab-b" });
      const expectation = page.expectConsole({ level: "error" }).within(500);
      setTimeout(() => page.pushConsole({ level: "error", text: "later" }), 10);
      const hit = await expectation;
      expect(hit.text).toBe("later");
    });
  });

  it("rejects on timeout with a descriptive message", async () => {
    await withBrowser({}, async ({ openPage }) => {
      const page = openPage({ tabId: "tab-c" });
      await expect(
        page.expectNetwork({ url: /nope/ }).within(50),
      ).rejects.toThrow(/expectation timed out/);
    });
  });

  it("marks the tab crashed and rejects pending waiters", async () => {
    await withBrowser({}, async ({ openPage }) => {
      const page = openPage({ tabId: "tab-d" });
      const pending = page.expectConsole({ level: "info" }).within(500);
      page.crash();
      await expect(pending).rejects.toThrow(/crashed/);
      expect(page.tabState().status).toBe("crashed");
    });
  });
});

describe("tinyServer details", () => {
  it("records every request method and url", async () => {
    await withBrowser({}, async ({ server }) => {
      await fetch(server.urlFor("/network/json"));
      await fetch(server.urlFor("/network/missing")).catch(() => {});
      expect(server.requests.some((r) => r.url === "/network/json")).toBe(true);
      expect(server.requests.some((r) => r.url === "/network/missing")).toBe(true);
    });
  });
});
