/**
 * Dev-server port detection for the built-in browser "Preview" action.
 *
 * The detector is a pure function over the project's declared
 * inputs: `dinocode.config.yml`, `package.json`, and (optionally) a
 * snapshot of listening TCP sockets. The live socket probe is not
 * implemented here — this module is the decision layer; the caller
 * (main-process service) is responsible for reading files and
 * providing a port-probe callback.
 *
 * Detectors run in priority order and the first that produces a
 * non-empty result wins. Every detector attaches a `confidence` level:
 *
 *   - `configured` — user wrote it down explicitly. Auto-open OK.
 *   - `declared`   — `package.json → dinocode.browser.devServerUrl`.
 *     Auto-open OK.
 *   - `sniffed`    — derived from `package.json` scripts. Auto-open OK
 *     if exactly one candidate matched.
 *   - `probed`     — observed via the port-probe callback. Medium
 *     confidence; prompt before auto-open.
 *   - `guess`      — fallback to a default port. Low confidence;
 *     always prompt.
 *
 * `{ url, confidence, source }` is the return contract the UI binds to.
 */

export type DetectionConfidence =
  | "configured"
  | "declared"
  | "sniffed"
  | "probed"
  | "guess";

export interface DevServerCandidate {
  readonly url: string;
  readonly confidence: DetectionConfidence;
  readonly source: string;
}

export interface ScriptDetectorHit {
  readonly script: string;
  readonly port: number;
  readonly host: string;
  readonly runner: string;
}

export interface DevServerDetectorInput {
  /** Parsed `.dinocode/config.yml` (or equivalent). */
  readonly workspaceConfig?: {
    readonly browser?: { readonly devServerUrl?: string };
  };
  /** Parsed `package.json` contents at the project root. */
  readonly packageJson?: {
    readonly scripts?: Record<string, string>;
    readonly dinocode?: {
      readonly browser?: { readonly devServerUrl?: string };
    };
  };
  /**
   * Optional snapshot of LISTEN sockets as `{ port, host }[]`. When
   * supplied the detector adds a `probed` candidate for each port
   * within the known-dev-port list; the caller is expected to have
   * already filtered to the project's own processes.
   */
  readonly listeningSockets?: ReadonlyArray<{ readonly port: number; readonly host: string }>;
}

interface ScriptRule {
  readonly runner: string;
  readonly matcher: RegExp;
  readonly defaultPort: number;
  readonly portArgFlag?: string;
}

/**
 * Mapping from common dev-server invocations to their default port.
 * The `portArgFlag` lets us override the default when the script
 * specifies a port explicitly (e.g. `vite --port 4000`).
 */
export const SCRIPT_RULES: ReadonlyArray<ScriptRule> = [
  { runner: "vite", matcher: /(^|\s)(vite)(\s|$)/, defaultPort: 5173, portArgFlag: "--port" },
  { runner: "next", matcher: /(^|\s)(next)\s+dev/, defaultPort: 3000, portArgFlag: "-p" },
  { runner: "bun-dev", matcher: /(^|\s)bun\s+(dev|run\s+dev)/, defaultPort: 3000 },
  { runner: "astro", matcher: /(^|\s)astro\s+dev/, defaultPort: 4321, portArgFlag: "--port" },
  { runner: "remix", matcher: /(^|\s)remix\s+dev/, defaultPort: 3000, portArgFlag: "--port" },
  { runner: "rails", matcher: /(^|\s)rails\s+server/, defaultPort: 3000, portArgFlag: "-p" },
  { runner: "tanstack-start", matcher: /(^|\s)tsx\s+.*start/, defaultPort: 3000 },
];

export const KNOWN_DEV_PORTS: ReadonlyArray<number> = [
  3000, 3001, 4321, 5173, 8080,
];

const parsePortFlag = (
  script: string,
  flag: string | undefined,
): number | undefined => {
  if (!flag) return undefined;
  const re = new RegExp(`${flag.replace(/[-\\^$*+?.()|[\\]{}]/g, "\\$&")}[=\\s]+(\\d{2,5})`);
  const match = re.exec(script);
  return match ? Number.parseInt(match[1]!, 10) : undefined;
};

const validateUrl = (url: string): string | undefined => {
  try {
    const parsed = new URL(url);
    if (!/^https?:$/.test(parsed.protocol)) return undefined;
    return parsed.toString().replace(/\/$/, "");
  } catch {
    return undefined;
  }
};

const urlFromPort = (port: number, host = "localhost"): string =>
  `http://${host}:${port}`;

export const sniffScripts = (
  scripts: Record<string, string>,
): ReadonlyArray<ScriptDetectorHit> => {
  const hits: ScriptDetectorHit[] = [];
  for (const [name, body] of Object.entries(scripts)) {
    if (typeof body !== "string") continue;
    for (const rule of SCRIPT_RULES) {
      if (!rule.matcher.test(body)) continue;
      const port = parsePortFlag(body, rule.portArgFlag) ?? rule.defaultPort;
      hits.push({ script: name, port, host: "localhost", runner: rule.runner });
    }
  }
  return hits;
};

const preferredScriptName = (
  hits: ReadonlyArray<ScriptDetectorHit>,
): ScriptDetectorHit | undefined => {
  const byName = (n: string) => hits.find((h) => h.script === n);
  return byName("dev") ?? byName("start") ?? hits[0];
};

/**
 * Pure detection pipeline. Returns every candidate the detectors
 * produced in priority order. The first candidate is the preferred
 * one (`result[0]`); the rest are kept so the UI can show "other
 * detected servers" when the user overrides.
 */
export const detectDevServer = (
  input: DevServerDetectorInput,
): ReadonlyArray<DevServerCandidate> => {
  const out: DevServerCandidate[] = [];

  const configured = input.workspaceConfig?.browser?.devServerUrl;
  if (configured) {
    const valid = validateUrl(configured);
    if (valid) {
      out.push({ url: valid, confidence: "configured", source: "workspaceConfig" });
    }
  }

  const declared = input.packageJson?.dinocode?.browser?.devServerUrl;
  if (declared) {
    const valid = validateUrl(declared);
    if (valid) {
      out.push({ url: valid, confidence: "declared", source: "packageJson.dinocode" });
    }
  }

  const scripts = input.packageJson?.scripts;
  if (scripts) {
    const hits = sniffScripts(scripts);
    const preferred = preferredScriptName(hits);
    if (preferred) {
      out.push({
        url: urlFromPort(preferred.port, preferred.host),
        confidence: "sniffed",
        source: `packageJson.scripts.${preferred.script}:${preferred.runner}`,
      });
    }
    for (const hit of hits) {
      if (hit === preferred) continue;
      out.push({
        url: urlFromPort(hit.port, hit.host),
        confidence: "sniffed",
        source: `packageJson.scripts.${hit.script}:${hit.runner}`,
      });
    }
  }

  const sockets = input.listeningSockets;
  if (sockets) {
    for (const sock of sockets) {
      if (!KNOWN_DEV_PORTS.includes(sock.port)) continue;
      const url = urlFromPort(sock.port, sock.host);
      if (out.some((c) => c.url === url)) continue;
      out.push({ url, confidence: "probed", source: `listen:${sock.port}` });
    }
  }

  if (out.length === 0) {
    out.push({
      url: urlFromPort(3000),
      confidence: "guess",
      source: "default:3000",
    });
  }

  return out;
};

/**
 * `auto-open` is safe only for high-confidence detections. Medium and
 * low confidence results should prompt the user before taking the tab
 * to the URL.
 */
export const isAutoOpenSafe = (candidate: DevServerCandidate): boolean =>
  candidate.confidence === "configured" ||
  candidate.confidence === "declared" ||
  candidate.confidence === "sniffed";
