/**
 * In-memory FakePage used by the harness to simulate CDP events.
 *
 * FakePage is not Chromium — it is a deterministic shim that emits
 * the same event shapes the real main-process manager would forward
 * to the renderer. It lets us exercise tool handlers, ring buffers,
 * and the IPC schema without spinning up Electron, which keeps the
 * downstream browser-subsystem test suite fast and hermetic.
 *
 * The DSL is small on purpose:
 *
 *   await page.pushConsole({ level: 'error', text: 'boom' });
 *   const hit = await page.expectConsole({ level: 'error' }).within(2000);
 *
 * `expectConsole` / `expectNetwork` return a thenable you either
 * `await` (resolves with the matching entry) or invoke `.within(ms)`
 * on to set a custom deadline. A deadline miss throws a structured
 * Error that names the missing predicate — these show up in the
 * trace dump.
 */

import {
  type BrowserConsoleEntry,
  type BrowserNavigationEvent,
  type BrowserNetworkEntry,
  type BrowserTabState,
} from "../shared/schemas.ts";

export interface FakePageInit {
  readonly tabId: string;
  readonly partitionId?: string;
  readonly url?: string;
}

export interface ConsoleMatcher {
  readonly level?: BrowserConsoleEntry["level"];
  readonly source?: BrowserConsoleEntry["source"];
  readonly text?: string | RegExp;
}

export interface NetworkMatcher {
  readonly method?: BrowserNetworkEntry["method"];
  readonly status?: BrowserNetworkEntry["status"];
  readonly url?: string | RegExp;
  readonly failed?: boolean;
}

export interface Expector<T> extends Promise<T> {
  within(ms: number): Promise<T>;
}

interface InternalExpector<T> {
  readonly resolve: (value: T) => void;
  readonly reject: (err: Error) => void;
  readonly match: (entry: T) => boolean;
  readonly describe: string;
}

const matchString = (pattern: string | RegExp, subject: string): boolean =>
  typeof pattern === "string" ? subject.includes(pattern) : pattern.test(subject);

const matchConsole = (m: ConsoleMatcher) => (e: BrowserConsoleEntry): boolean => {
  if (m.level !== undefined && e.level !== m.level) return false;
  if (m.source !== undefined && e.source !== m.source) return false;
  if (m.text !== undefined && !matchString(m.text, e.text)) return false;
  return true;
};

const matchNetwork = (m: NetworkMatcher) => (e: BrowserNetworkEntry): boolean => {
  if (m.method !== undefined && e.method !== m.method) return false;
  if (m.status !== undefined && e.status !== m.status) return false;
  if (m.failed !== undefined && e.failed !== m.failed) return false;
  if (m.url !== undefined && !matchString(m.url, e.url)) return false;
  return true;
};

const makeExpector = <T>(opts: {
  readonly defaultTimeoutMs: number;
  readonly describe: string;
  readonly match: (entry: T) => boolean;
  readonly history: ReadonlyArray<T>;
  readonly register: (int: InternalExpector<T>) => () => void;
}): Expector<T> => {
  let started = false;
  let activePromise: Promise<T> | undefined;

  const run = (timeoutMs: number): Promise<T> => {
    if (activePromise) return activePromise;
    started = true;
    const existing = opts.history.find(opts.match);
    if (existing) {
      activePromise = Promise.resolve(existing);
      return activePromise;
    }
    activePromise = new Promise<T>((resolve, reject) => {
      let settled = false;
      const unregister = opts.register({
        resolve: (value) => {
          if (settled) return;
          settled = true;
          clearTimeout(timer);
          resolve(value);
        },
        reject: (err) => {
          if (settled) return;
          settled = true;
          clearTimeout(timer);
          reject(err);
        },
        match: opts.match,
        describe: opts.describe,
      });
      const timer = setTimeout(() => {
        if (settled) return;
        settled = true;
        unregister();
        reject(new Error(`FakePage expectation timed out: ${opts.describe}`));
      }, timeoutMs);
    });
    return activePromise;
  };

  const expector: Expector<T> = {
    then: (onFulfilled, onRejected) => run(opts.defaultTimeoutMs).then(onFulfilled, onRejected),
    catch: (onRejected) => run(opts.defaultTimeoutMs).catch(onRejected),
    finally: (onFinally) => run(opts.defaultTimeoutMs).finally(onFinally),
    within: (ms: number) => {
      if (started) {
        throw new Error(
          `FakePage expectation already started; call .within() before awaiting`,
        );
      }
      return run(ms);
    },
    [Symbol.toStringTag]: "Promise",
  } as Expector<T>;

  return expector;
};

export interface FakePage {
  readonly tabId: string;
  readonly tabState: () => BrowserTabState;
  readonly pushConsole: (entry: Omit<BrowserConsoleEntry, "tabId" | "cursor" | "timestamp"> & {
    readonly timestamp?: string;
  }) => BrowserConsoleEntry;
  readonly pushNetwork: (entry: Omit<BrowserNetworkEntry, "tabId" | "cursor" | "startedAt"> & {
    readonly startedAt?: string;
  }) => BrowserNetworkEntry;
  readonly pushNavigation: (event: Omit<BrowserNavigationEvent, "tabId" | "timestamp"> & {
    readonly timestamp?: string;
  }) => BrowserNavigationEvent;
  readonly expectConsole: (matcher: ConsoleMatcher) => Expector<BrowserConsoleEntry>;
  readonly expectNetwork: (matcher: NetworkMatcher) => Expector<BrowserNetworkEntry>;
  readonly consoleLog: () => ReadonlyArray<BrowserConsoleEntry>;
  readonly networkLog: () => ReadonlyArray<BrowserNetworkEntry>;
  readonly crash: () => void;
  readonly close: () => void;
}

export interface CreateFakePageOptions {
  readonly defaultTimeoutMs?: number;
  readonly now?: () => Date;
}

export const createFakePage = (
  init: FakePageInit,
  options: CreateFakePageOptions = {},
): FakePage => {
  const defaultTimeoutMs = options.defaultTimeoutMs ?? 2000;
  const now = () => (options.now ? options.now() : new Date()).toISOString();

  let state: BrowserTabState = {
    tabId: init.tabId,
    partitionId: (init.partitionId ?? `persist:${init.tabId}`) as BrowserTabState["partitionId"],
    url: init.url ?? "about:blank",
    title: "FakePage",
    status: "ready",
    loadingProgress: 1,
    canGoBack: false,
    canGoForward: false,
    muted: false,
    updatedAt: now(),
  };

  const consoleEntries: BrowserConsoleEntry[] = [];
  const networkEntries: BrowserNetworkEntry[] = [];
  const consoleWaiters = new Set<InternalExpector<BrowserConsoleEntry>>();
  const networkWaiters = new Set<InternalExpector<BrowserNetworkEntry>>();
  let consoleCursor = 0;
  let networkCursor = 0;

  const notify = <T>(
    waiters: Set<InternalExpector<T>>,
    entry: T,
  ): void => {
    for (const w of [...waiters]) {
      if (w.match(entry)) {
        waiters.delete(w);
        w.resolve(entry);
      }
    }
  };

  const pushConsole: FakePage["pushConsole"] = (entry) => {
    const full: BrowserConsoleEntry = {
      ...entry,
      tabId: init.tabId as BrowserConsoleEntry["tabId"],
      cursor: consoleCursor++,
      timestamp: entry.timestamp ?? now(),
    };
    consoleEntries.push(full);
    notify(consoleWaiters, full);
    return full;
  };

  const pushNetwork: FakePage["pushNetwork"] = (entry) => {
    const full: BrowserNetworkEntry = {
      ...entry,
      tabId: init.tabId as BrowserNetworkEntry["tabId"],
      cursor: networkCursor++,
      startedAt: entry.startedAt ?? now(),
    };
    networkEntries.push(full);
    notify(networkWaiters, full);
    return full;
  };

  const pushNavigation: FakePage["pushNavigation"] = (event) => {
    const full: BrowserNavigationEvent = {
      ...event,
      tabId: init.tabId as BrowserNavigationEvent["tabId"],
      timestamp: event.timestamp ?? now(),
    };
    state = {
      ...state,
      url: full.url,
      updatedAt: full.timestamp,
      status: full.kind === "failed" ? "ready" : state.status,
    };
    return full;
  };

  return {
    tabId: init.tabId,
    tabState: () => state,
    pushConsole,
    pushNetwork,
    pushNavigation,
    consoleLog: () => consoleEntries,
    networkLog: () => networkEntries,
    expectConsole: (matcher) =>
      makeExpector<BrowserConsoleEntry>({
        defaultTimeoutMs,
        describe: `console ${JSON.stringify(matcher)}`,
        match: matchConsole(matcher),
        history: consoleEntries,
        register: (int) => {
          consoleWaiters.add(int);
          return () => consoleWaiters.delete(int);
        },
      }),
    expectNetwork: (matcher) =>
      makeExpector<BrowserNetworkEntry>({
        defaultTimeoutMs,
        describe: `network ${JSON.stringify(matcher)}`,
        match: matchNetwork(matcher),
        history: networkEntries,
        register: (int) => {
          networkWaiters.add(int);
          return () => networkWaiters.delete(int);
        },
      }),
    crash: () => {
      state = { ...state, status: "crashed", updatedAt: now() };
      const crashErr = new Error(`tab ${init.tabId} crashed`);
      for (const w of [...consoleWaiters]) {
        consoleWaiters.delete(w);
        w.reject(crashErr);
      }
      for (const w of [...networkWaiters]) {
        networkWaiters.delete(w);
        w.reject(crashErr);
      }
    },
    close: () => {
      state = { ...state, status: "closed", updatedAt: now() };
    },
  };
};
