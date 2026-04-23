/**
 * Artifact-storage path helpers for the built-in browser.
 *
 * The directory layout under `<project>/.dinocode/browser/**` is the
 * single source of truth for every byte the subsystem persists:
 *
 *   .dinocode/browser/
 *   ├── allowlist.json                   ← navigation allowlist (dinocode-sdqj)
 *   ├── state.json                       ← tab persistence (dinocode-crea)
 *   ├── history.json                     ← address bar history (dinocode-49oz)
 *   ├── logs/<yyyy-mm-dd>.log            ← rotating logger sink (dinocode-gepm)
 *   ├── screenshots/<tabId>/<ISO>.png
 *   ├── network-bodies/<tabId>/<requestId>.<ext>
 *   ├── dom-snapshots/<tabId>/<ISO>.html
 *   ├── sessions/<tabId>-<ISO>/manifest.json
 *   └── traces/<tabId>/<ISO>.json
 *
 * This module returns POSIX-style relative strings (no Node APIs). A
 * tiny `join(...)` helper keeps the package dependency-free. Callers
 * pass the project root into `artifactRoot(projectRoot)` when they are
 * ready to write to disk — the helpers always return project-relative
 * paths so the logger, test fixtures, and docs render consistently.
 *
 * Every path helper validates its inputs:
 *   - `tabId` must match the `BrowserTabIdSchema` pattern
 *     (`[a-z0-9][a-z0-9_-]{0,63}`) so a rogue caller cannot escape the
 *     artifact root via `..`.
 *   - ISO timestamps are passed in as strings but only accepted when
 *     they match the `YYYY-MM-DDTHH:MM:SS.sssZ` shape; we reject
 *     slashes, dots, or other filesystem-dangerous characters.
 *   - Request ids and extensions go through the same safe-slug filter.
 */

export const ARTIFACT_ROOT_SEGMENT = ".dinocode/browser" as const;
export const ARTIFACT_LOGS_DIR = `${ARTIFACT_ROOT_SEGMENT}/logs` as const;
export const ARTIFACT_SCREENSHOTS_DIR = `${ARTIFACT_ROOT_SEGMENT}/screenshots` as const;
export const ARTIFACT_NETWORK_BODIES_DIR = `${ARTIFACT_ROOT_SEGMENT}/network-bodies` as const;
export const ARTIFACT_DOM_SNAPSHOTS_DIR = `${ARTIFACT_ROOT_SEGMENT}/dom-snapshots` as const;
export const ARTIFACT_SESSIONS_DIR = `${ARTIFACT_ROOT_SEGMENT}/sessions` as const;
export const ARTIFACT_TRACES_DIR = `${ARTIFACT_ROOT_SEGMENT}/traces` as const;

export const ARTIFACT_ALLOWLIST_FILE = `${ARTIFACT_ROOT_SEGMENT}/allowlist.json` as const;
export const ARTIFACT_STATE_FILE = `${ARTIFACT_ROOT_SEGMENT}/state.json` as const;
export const ARTIFACT_HISTORY_FILE = `${ARTIFACT_ROOT_SEGMENT}/history.json` as const;

const TAB_ID_RE = /^[a-z0-9][a-z0-9_-]{0,63}$/;
const ISO_RE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z$/;
const SAFE_SLUG_RE = /^[A-Za-z0-9][A-Za-z0-9_.-]{0,128}$/;
const EXT_RE = /^[A-Za-z0-9][A-Za-z0-9_-]{0,15}$/;

const ensureTabId = (tabId: string): string => {
  if (!TAB_ID_RE.test(tabId)) {
    throw new Error(`invalid tabId for artifact path: ${JSON.stringify(tabId)}`);
  }
  return tabId;
};

const ensureIso = (iso: string): string => {
  if (!ISO_RE.test(iso)) {
    throw new Error(`invalid ISO timestamp for artifact path: ${JSON.stringify(iso)}`);
  }
  return iso.replace(/:/g, "-");
};

const ensureSlug = (slug: string): string => {
  if (!SAFE_SLUG_RE.test(slug)) {
    throw new Error(`invalid slug for artifact path: ${JSON.stringify(slug)}`);
  }
  return slug;
};

const ensureExt = (ext: string): string => {
  const stripped = ext.startsWith(".") ? ext.slice(1) : ext;
  if (!EXT_RE.test(stripped)) {
    throw new Error(`invalid file extension: ${JSON.stringify(ext)}`);
  }
  return stripped;
};

const join = (...parts: ReadonlyArray<string>): string =>
  parts
    .map((p) => p.replace(/^\/+|\/+$/g, ""))
    .filter((p) => p.length > 0)
    .join("/");

/** Join a project root with one of the artifact paths in this module. */
export const artifactRoot = (projectRoot: string): string =>
  join(projectRoot, ARTIFACT_ROOT_SEGMENT);

export const screenshotPath = (tabId: string, iso: string): string =>
  join(ARTIFACT_SCREENSHOTS_DIR, ensureTabId(tabId), `${ensureIso(iso)}.png`);

export const networkBodyPath = (
  tabId: string,
  requestId: string,
  ext: string,
): string =>
  join(
    ARTIFACT_NETWORK_BODIES_DIR,
    ensureTabId(tabId),
    `${ensureSlug(requestId)}.${ensureExt(ext)}`,
  );

export const domSnapshotPath = (tabId: string, iso: string): string =>
  join(ARTIFACT_DOM_SNAPSHOTS_DIR, ensureTabId(tabId), `${ensureIso(iso)}.html`);

export const sessionManifestPath = (tabId: string, iso: string): string =>
  join(ARTIFACT_SESSIONS_DIR, `${ensureTabId(tabId)}-${ensureIso(iso)}`, "manifest.json");

export const tracePath = (tabId: string, iso: string): string =>
  join(ARTIFACT_TRACES_DIR, ensureTabId(tabId), `${ensureIso(iso)}.json`);

export const dailyLogPath = (isoDate: string): string => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(isoDate)) {
    throw new Error(`invalid ISO date for log path: ${JSON.stringify(isoDate)}`);
  }
  return join(ARTIFACT_LOGS_DIR, `${isoDate}.log`);
};

/**
 * List of root-level artifact paths that are written at most once per
 * project. Useful for startup wiring ("ensure these files exist or are
 * initialised to empty objects").
 */
export const ARTIFACT_ROOT_FILES = [
  ARTIFACT_ALLOWLIST_FILE,
  ARTIFACT_STATE_FILE,
  ARTIFACT_HISTORY_FILE,
] as const;

export const ARTIFACT_DIRECTORIES = [
  ARTIFACT_ROOT_SEGMENT,
  ARTIFACT_LOGS_DIR,
  ARTIFACT_SCREENSHOTS_DIR,
  ARTIFACT_NETWORK_BODIES_DIR,
  ARTIFACT_DOM_SNAPSHOTS_DIR,
  ARTIFACT_SESSIONS_DIR,
  ARTIFACT_TRACES_DIR,
] as const;
