/**
 * Zero-dependency HTTP fixture server for the browser test harness.
 *
 * Serves static text (typically HTML snippets) on a random localhost
 * port. The returned handle exposes the actual port (bound via port 0)
 * so CI runners cannot collide, and gives a `close()` helper that
 * resolves once the underlying `http.Server` has fully shut down.
 *
 * The server is deliberately tiny — we want zero runtime deps and an
 * obvious request/response model so that harness failures are easy to
 * diagnose. Test fixtures are plain string maps; a `catchall` handler
 * can be provided to emulate redirects, slow pages, or error status
 * codes.
 */

import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import type { AddressInfo } from "node:net";

export interface FixtureResponse {
  readonly status?: number;
  readonly headers?: Record<string, string>;
  readonly body: string;
  /** Delay before responding, in ms. Useful for slow-page fixtures. */
  readonly delayMs?: number;
}

export interface TinyServerOptions {
  /** Map of path → fixture response. */
  readonly fixtures?: Record<string, FixtureResponse | string>;
  /** Fallback when no fixture matches. Default is a 404. */
  readonly catchall?: (req: IncomingMessage, res: ServerResponse) => void;
  /** Override host. Default: 127.0.0.1. */
  readonly host?: string;
}

export interface TinyServerHandle {
  readonly port: number;
  readonly host: string;
  readonly baseUrl: string;
  readonly urlFor: (path: string) => string;
  readonly close: () => Promise<void>;
  readonly requests: ReadonlyArray<{ readonly method: string; readonly url: string }>;
}

const normalise = (value: FixtureResponse | string): FixtureResponse =>
  typeof value === "string" ? { body: value } : value;

export const startTinyServer = async (
  options: TinyServerOptions = {},
): Promise<TinyServerHandle> => {
  const fixtures = Object.fromEntries(
    Object.entries(options.fixtures ?? {}).map(([k, v]) => [k, normalise(v)]),
  );
  const requests: Array<{ method: string; url: string }> = [];

  const handle = (req: IncomingMessage, res: ServerResponse) => {
    const url = req.url ?? "/";
    requests.push({ method: req.method ?? "GET", url });
    const fixture = fixtures[url] ?? fixtures[url.split("?")[0] ?? ""];
    if (fixture) {
      const delay = fixture.delayMs ?? 0;
      const send = () => {
        res.writeHead(fixture.status ?? 200, {
          "content-type": "text/html; charset=utf-8",
          ...(fixture.headers ?? {}),
        });
        res.end(fixture.body);
      };
      if (delay > 0) setTimeout(send, delay);
      else send();
      return;
    }
    if (options.catchall) {
      options.catchall(req, res);
      return;
    }
    res.writeHead(404, { "content-type": "text/plain; charset=utf-8" });
    res.end(`fixture not found: ${url}`);
  };

  const server = createServer(handle);
  const host = options.host ?? "127.0.0.1";

  await new Promise<void>((resolve, reject) => {
    const onError = (err: Error) => {
      server.off("listening", onListen);
      reject(err);
    };
    const onListen = () => {
      server.off("error", onError);
      resolve();
    };
    server.once("error", onError);
    server.once("listening", onListen);
    server.listen(0, host);
  });

  const address = server.address() as AddressInfo | null;
  if (!address) {
    throw new Error("tinyServer failed to bind");
  }
  const port = address.port;
  const baseUrl = `http://${host}:${port}`;

  const close = (): Promise<void> =>
    new Promise<void>((resolve, reject) => {
      server.close((err) => (err ? reject(err) : resolve()));
    });

  return {
    port,
    host,
    baseUrl,
    urlFor: (path) => (path.startsWith("/") ? `${baseUrl}${path}` : `${baseUrl}/${path}`),
    close,
    get requests() {
      return requests;
    },
  };
};
