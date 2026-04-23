import { describe, expect, it } from "vitest";

import {
  detectDevServer,
  isAutoOpenSafe,
  KNOWN_DEV_PORTS,
  sniffScripts,
} from "../devserver/DevServerDetector.ts";

describe("detectDevServer — precedence", () => {
  it("workspace config wins over everything", () => {
    const [best, ...rest] = detectDevServer({
      workspaceConfig: { browser: { devServerUrl: "http://localhost:9999" } },
      packageJson: {
        scripts: { dev: "vite" },
        dinocode: { browser: { devServerUrl: "http://localhost:8000" } },
      },
      listeningSockets: [{ port: 5173, host: "localhost" }],
    });
    expect(best).toEqual({
      url: "http://localhost:9999",
      confidence: "configured",
      source: "workspaceConfig",
    });
    expect(rest.length).toBeGreaterThan(0);
  });

  it("packageJson.dinocode declaration beats sniffing", () => {
    const [best] = detectDevServer({
      packageJson: {
        scripts: { dev: "vite --port 4000" },
        dinocode: { browser: { devServerUrl: "http://localhost:8000" } },
      },
    });
    expect(best?.confidence).toBe("declared");
    expect(best?.url).toBe("http://localhost:8000");
  });

  it("falls back to the 3000 default when nothing matches", () => {
    const [best] = detectDevServer({});
    expect(best?.confidence).toBe("guess");
    expect(best?.url).toBe("http://localhost:3000");
  });
});

describe("sniffScripts", () => {
  it("detects vite on its default port", () => {
    const hits = sniffScripts({ dev: "vite" });
    expect(hits).toEqual([
      { script: "dev", port: 5173, host: "localhost", runner: "vite" },
    ]);
  });

  it("honours explicit --port overrides", () => {
    expect(sniffScripts({ dev: "vite --port 4000" })[0]!.port).toBe(4000);
    expect(sniffScripts({ dev: "next dev -p 4100" })[0]!.port).toBe(4100);
    expect(sniffScripts({ dev: "astro dev --port 4321" })[0]!.port).toBe(4321);
  });

  it("recognises bun dev / run dev", () => {
    expect(sniffScripts({ dev: "bun dev" })[0]!.runner).toBe("bun-dev");
    expect(sniffScripts({ dev: "bun run dev" })[0]!.runner).toBe("bun-dev");
  });

  it("recognises rails server", () => {
    const hits = sniffScripts({ start: "rails server -p 3030" });
    expect(hits[0]).toEqual({
      script: "start",
      port: 3030,
      host: "localhost",
      runner: "rails",
    });
  });

  it("ignores unrelated scripts", () => {
    expect(sniffScripts({ build: "tsc -b", fmt: "prettier ." })).toHaveLength(0);
  });
});

describe("detectDevServer — sniff + probe", () => {
  it("picks the `dev` script first, then other matches", () => {
    const out = detectDevServer({
      packageJson: {
        scripts: { dev: "vite", docs: "astro dev" },
      },
    });
    expect(out[0]!.confidence).toBe("sniffed");
    expect(out[0]!.url).toBe("http://localhost:5173");
    expect(out[1]!.url).toBe("http://localhost:4321");
  });

  it("adds probed candidates only for known dev ports", () => {
    const out = detectDevServer({
      listeningSockets: [
        { port: 5173, host: "localhost" },
        { port: 22, host: "127.0.0.1" },
      ],
    });
    const probed = out.filter((c) => c.confidence === "probed");
    expect(probed).toHaveLength(1);
    expect(probed[0]!.url).toBe("http://localhost:5173");
  });

  it("does not double up when sniffing already surfaced the URL", () => {
    const out = detectDevServer({
      packageJson: { scripts: { dev: "vite" } },
      listeningSockets: [{ port: 5173, host: "localhost" }],
    });
    const urls = out.map((c) => c.url);
    expect(new Set(urls).size).toBe(urls.length);
  });
});

describe("isAutoOpenSafe", () => {
  it("is true for configured/declared/sniffed", () => {
    expect(isAutoOpenSafe({ url: "", confidence: "configured", source: "" })).toBe(true);
    expect(isAutoOpenSafe({ url: "", confidence: "declared", source: "" })).toBe(true);
    expect(isAutoOpenSafe({ url: "", confidence: "sniffed", source: "" })).toBe(true);
  });

  it("requires confirmation for probed/guess", () => {
    expect(isAutoOpenSafe({ url: "", confidence: "probed", source: "" })).toBe(false);
    expect(isAutoOpenSafe({ url: "", confidence: "guess", source: "" })).toBe(false);
  });
});

describe("sanity", () => {
  it("KNOWN_DEV_PORTS covers every script default", () => {
    const ports = new Set(KNOWN_DEV_PORTS);
    expect(ports.has(3000)).toBe(true);
    expect(ports.has(5173)).toBe(true);
    expect(ports.has(4321)).toBe(true);
  });
});
