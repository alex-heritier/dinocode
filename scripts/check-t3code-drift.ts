#!/usr/bin/env node
/**
 * Dinocode ↔ t3code drift guard.
 *
 * Fails (exit 1) when the current branch introduces "too much" change to
 * t3code-internal paths (apps/*, packages/contracts/*) relative to the
 * upstream t3code baseline, unless the PR is labelled as an integration PR.
 *
 * Rationale: Dinocode lives as a layered fork of pingdotgg/t3code. Every
 * Dinocode feature should live in packages/dinocode-* (or packages/soil).
 * The cardinal rule is that `git merge upstream/main` should almost never
 * conflict. This guard makes t3code-internal churn visible at review time.
 *
 * Behavior:
 *   - Computes `git diff <base>..HEAD --numstat -- <watched-paths>`.
 *   - Sums inserted + deleted lines across watched paths.
 *   - Also runs a secondary check: every file under apps/* that imports
 *     from `@dinocode/*` must have a `dinocode-integration:` annotation
 *     within the preceding 3 lines of each such import.
 *   - Exits 1 when either check fails.
 *
 * Opt-out: prepend a commit trailer `Integration: <package>` (case-insensitive)
 * to the most recent commit on HEAD, or set the env var INTEGRATION_PR=1.
 *
 * Configuration (env vars):
 *   CHECK_T3CODE_DRIFT_BASE   - base ref; default `upstream/main`, falls back
 *                               to `origin/main`, then `HEAD~1`.
 *   CHECK_T3CODE_DRIFT_LIMIT  - max allowed diff lines; default 20.
 *
 * Usage:
 *   node scripts/check-t3code-drift.ts
 *
 * CI wiring: add a step to .github/workflows/ci.yml. On pull_request events,
 * GitHub Actions populates `GITHUB_BASE_REF` automatically; we consult it
 * before falling back to upstream/main.
 */

import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

type CheckResult = { kind: "ok"; message: string } | { kind: "fail"; message: string };

const WATCHED_PATHS = [
  "apps/server",
  "apps/web",
  "apps/desktop",
  "apps/marketing",
  "packages/contracts",
] as const;

const ALLOWED_WATCHED_SUBTREES = new Set<string>([
  // dinocode-integration: dinocode-board dogfooding — board route + components
  // were added before the package was extracted. These files are allowed to
  // carry Dinocode logic until the dinocode-up4r extraction completes. When
  // that bean lands, remove them from this allowlist.
  "apps/web/src/components/board/",
  "apps/web/src/routes/_chat.board.$environmentId.$projectId.tsx",
  "apps/web/src/routes/_chat.board.index.tsx",
  // Same story for server task orchestration (dinocode-k7pm):
  "apps/server/src/persistence/Migrations/026_ProjectionTasks.ts",
  "apps/server/src/persistence/Services/ProjectionTasks.ts",
  "apps/server/src/persistence/Layers/ProjectionTasks.ts",
]);

const INTEGRATION_ANNOTATION_WINDOW = 3;
const INTEGRATION_ANNOTATION_REGEX = /dinocode-integration:/;
const DINOCODE_IMPORT_REGEX = /from\s+["']@dinocode\//;

function log(message: string, ...rest: unknown[]) {
  console.log(`[check-t3code-drift] ${message}`, ...rest);
}

function git(args: ReadonlyArray<string>, allowFailure = false): string {
  const result = spawnSync("git", [...args], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
  if (result.status !== 0) {
    if (allowFailure) return "";
    throw new Error(`git ${args.join(" ")} failed: ${result.stderr?.trim() ?? "unknown error"}`);
  }
  return result.stdout;
}

function refExists(ref: string): boolean {
  const result = spawnSync("git", ["rev-parse", "--verify", "--quiet", ref], {
    stdio: "ignore",
  });
  return result.status === 0;
}

function resolveBaseRef(): string {
  const explicit = process.env.CHECK_T3CODE_DRIFT_BASE?.trim();
  if (explicit && refExists(explicit)) return explicit;

  const githubBase = process.env.GITHUB_BASE_REF?.trim();
  if (githubBase) {
    const candidate = `origin/${githubBase}`;
    if (refExists(candidate)) return candidate;
  }

  for (const candidate of ["upstream/main", "origin/main", "HEAD~1"] as const) {
    if (refExists(candidate)) return candidate;
  }
  return "HEAD";
}

function parseLimit(): number {
  const raw = process.env.CHECK_T3CODE_DRIFT_LIMIT;
  if (!raw) return 20;
  const parsed = Number.parseInt(raw, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 20;
}

function isIntegrationPr(): boolean {
  if (process.env.INTEGRATION_PR?.trim() === "1") return true;
  const headMessage = git(["log", "-1", "--format=%B"], true);
  return /^\s*Integration:\s*\S+/im.test(headMessage);
}

function isPathAllowlisted(path: string): boolean {
  for (const allowed of ALLOWED_WATCHED_SUBTREES) {
    if (path === allowed) return true;
    if (allowed.endsWith("/") && path.startsWith(allowed)) return true;
  }
  return false;
}

function checkDriftBudget(base: string, limit: number): CheckResult {
  const numstatArgs = ["diff", "--numstat", `${base}..HEAD`, "--", ...WATCHED_PATHS];
  const raw = git(numstatArgs, true);
  if (!raw.trim()) {
    return { kind: "ok", message: `no changes vs ${base} in watched paths` };
  }

  let totalChanged = 0;
  const offendingFiles: Array<{ path: string; lines: number }> = [];
  for (const line of raw.split("\n")) {
    if (!line.trim()) continue;
    const [addedStr, deletedStr, path] = line.split("\t");
    if (!path) continue;
    if (isPathAllowlisted(path)) continue;
    const added = addedStr === "-" ? 0 : Number.parseInt(addedStr ?? "0", 10);
    const deleted = deletedStr === "-" ? 0 : Number.parseInt(deletedStr ?? "0", 10);
    const fileTotal =
      (Number.isFinite(added) ? added : 0) + (Number.isFinite(deleted) ? deleted : 0);
    totalChanged += fileTotal;
    if (fileTotal > 0) offendingFiles.push({ path, lines: fileTotal });
  }

  if (totalChanged <= limit) {
    return {
      kind: "ok",
      message: `drift ${totalChanged} ≤ ${limit} vs ${base}`,
    };
  }

  const top = offendingFiles
    .sort((a, b) => b.lines - a.lines)
    .slice(0, 10)
    .map((f) => `  ${f.lines.toString().padStart(5)}  ${f.path}`)
    .join("\n");

  return {
    kind: "fail",
    message: [
      `t3code-internal drift ${totalChanged} exceeds budget ${limit} (vs ${base}).`,
      ``,
      `Top offenders:`,
      top,
      ``,
      `Mitigations:`,
      `  • Move new logic into a packages/dinocode-* package and wire it in`,
      `    with a one-line "// dinocode-integration: <package> <feature>" comment.`,
      `    See docs/dinocode-packages.md for the policy.`,
      `  • If this PR is intentionally an integration PR, add a`,
      `    "Integration: <package>" trailer to the HEAD commit, or run with`,
      `    INTEGRATION_PR=1 in CI.`,
    ].join("\n"),
  };
}

function checkIntegrationAnnotations(): CheckResult {
  const trackedFiles = git(
    [
      "ls-files",
      "--",
      ...WATCHED_PATHS.map((p) => `${p}/**/*.ts`),
      ...WATCHED_PATHS.map((p) => `${p}/**/*.tsx`),
    ],
    true,
  )
    .split("\n")
    .filter((line) => line.length > 0);

  const missing: Array<{ path: string; line: number }> = [];
  const root = process.cwd();
  for (const relPath of trackedFiles) {
    if (isPathAllowlisted(relPath)) continue;
    const absPath = resolve(root, relPath);
    let contents: string;
    try {
      contents = readFileSync(absPath, "utf8");
    } catch {
      continue;
    }
    const lines = contents.split("\n");
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i] ?? "";
      if (!DINOCODE_IMPORT_REGEX.test(line)) continue;
      const start = Math.max(0, i - INTEGRATION_ANNOTATION_WINDOW);
      let annotated = false;
      for (let j = start; j <= i; j++) {
        const candidate = lines[j] ?? "";
        if (INTEGRATION_ANNOTATION_REGEX.test(candidate)) {
          annotated = true;
          break;
        }
      }
      if (!annotated) {
        missing.push({ path: relPath, line: i + 1 });
      }
    }
  }

  if (missing.length === 0) {
    return {
      kind: "ok",
      message: "all @dinocode/* imports under apps/* are annotated",
    };
  }

  const details = missing.map(({ path, line }) => `  ${path}:${line}`).join("\n");
  return {
    kind: "fail",
    message: [
      `Found @dinocode/* imports without a "dinocode-integration:" comment`,
      `within the preceding ${INTEGRATION_ANNOTATION_WINDOW} lines:`,
      ``,
      details,
      ``,
      `Add a comment like:`,
      `  // dinocode-integration: dinocode-board kanban route wiring.`,
      `directly above the import.`,
    ].join("\n"),
  };
}

async function main(): Promise<void> {
  const base = resolveBaseRef();
  const limit = parseLimit();
  const integrationPr = isIntegrationPr();

  log(`base=${base} limit=${limit} integrationPr=${integrationPr}`);

  const results: CheckResult[] = [];

  if (integrationPr) {
    log("skipping drift budget check: PR is labelled as integration.");
  } else {
    results.push(checkDriftBudget(base, limit));
  }
  results.push(checkIntegrationAnnotations());

  let failed = false;
  for (const result of results) {
    if (result.kind === "ok") {
      log(`OK: ${result.message}`);
    } else {
      log(`FAIL: ${result.message}`);
      failed = true;
    }
  }

  if (failed) {
    process.exit(1);
  }
}

void main().catch((err: unknown) => {
  log("unexpected failure", err);
  process.exit(1);
});
