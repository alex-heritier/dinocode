/**
 * Canned fixture HTML pages for the test harness.
 *
 * Each fixture has a stable name and predictable behaviour so that
 * tests can reference them by key (`FIXTURES.console`,
 * `FIXTURES.crash`, …) without embedding multi-line HTML strings
 * inline. Call {@link standardFixtures} to get the fixture map
 * expected by {@link startTinyServer}.
 *
 * These are intentionally minimal — just enough to exercise console
 * capture, network capture, DOM navigation, and crash recovery
 * behaviours. The harness is NOT a full browser; fixtures should be
 * self-contained HTML strings (no fetched assets).
 */

import type { FixtureResponse } from "./tinyServer.ts";

export const FIXTURES = {
  hello: "/hello",
  console: "/console",
  network: "/network",
  form: "/form",
  crash: "/crash",
  redirect: "/redirect",
  slow: "/slow",
} as const;

export type FixtureKey = (typeof FIXTURES)[keyof typeof FIXTURES];

const page = (title: string, body: string): string => `<!doctype html>
<html><head><meta charset="utf-8"><title>${title}</title></head>
<body>${body}</body></html>`;

export const standardFixtures = (): Record<string, FixtureResponse> => ({
  [FIXTURES.hello]: { body: page("Hello", "<h1>Hello, world!</h1>") },
  [FIXTURES.console]: {
    body: page(
      "Console",
      `<h1>Console fixture</h1><script>
         console.log('ready');
         console.warn('a warning');
         console.error('a failure');
       </script>`,
    ),
  },
  [FIXTURES.network]: {
    body: page(
      "Network",
      `<h1>Network fixture</h1><script>
         fetch('/network/json').then(r => r.json()).then(j => window.__N = j);
         fetch('/network/missing').catch(() => {});
       </script>`,
    ),
  },
  "/network/json": {
    headers: { "content-type": "application/json" },
    body: '{"ok":true}',
  },
  "/network/missing": { status: 404, body: "not found" },
  [FIXTURES.form]: {
    body: page(
      "Form",
      `<h1>Form fixture</h1>
       <form>
         <input id="name" name="name" />
         <textarea id="bio"></textarea>
         <button id="submit" type="button">Submit</button>
       </form>`,
    ),
  },
  [FIXTURES.crash]: {
    body: page(
      "Crash",
      `<h1>Crash fixture</h1><script>
         window.__CRASH__ = () => { throw new Error('boom'); };
       </script>`,
    ),
  },
  [FIXTURES.redirect]: {
    status: 302,
    headers: { location: FIXTURES.hello },
    body: "",
  },
  [FIXTURES.slow]: {
    delayMs: 250,
    body: page("Slow", "<h1>Slow fixture</h1>"),
  },
});
