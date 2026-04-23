// dinocode-integration: pure logic for the ⌘⇧B face-toggle command.
// Given the current pathname + a view of the store, resolve the navigation
// target that flips the active project between its chat and board faces.

import type { EnvironmentId, ProjectId, ThreadId } from "@t3tools/contracts";

export interface ToggleFaceThreadSummary {
  readonly environmentId: EnvironmentId;
  readonly id: ThreadId;
  readonly projectId: ProjectId;
  readonly archivedAt: string | null;
  readonly lastVisitedAt: string | null;
}

export type ToggleFaceAction =
  | {
      readonly kind: "navigate-to-board";
      readonly environmentId: EnvironmentId;
      readonly projectId: ProjectId;
    }
  | {
      readonly kind: "navigate-to-thread";
      readonly environmentId: EnvironmentId;
      readonly threadId: ThreadId;
    }
  | {
      readonly kind: "create-new-thread";
      readonly environmentId: EnvironmentId;
      readonly projectId: ProjectId;
    }
  | { readonly kind: "noop" };

/** Parses `/board/:env/:project`. Returns null for any other shape. */
export function parseBoardPathname(
  pathname: string,
): { environmentId: EnvironmentId; projectId: ProjectId } | null {
  const match = /^\/board\/([^/]+)\/([^/]+)\/?$/.exec(pathname);
  if (!match) return null;
  const [, env, proj] = match;
  if (!env || !proj) return null;
  return { environmentId: env as EnvironmentId, projectId: proj as ProjectId };
}

/** Parses `/:env/:thread` under the `_chat` layout. Rejects reserved roots. */
export function parseThreadPathname(
  pathname: string,
): { environmentId: EnvironmentId; threadId: ThreadId } | null {
  const match = /^\/([^/]+)\/([^/]+)\/?$/.exec(pathname);
  if (!match) return null;
  const [, env, threadId] = match;
  if (!env || !threadId) return null;
  if (env === "board" || env === "settings" || env === "draft" || env === "pair") return null;
  return {
    environmentId: env as EnvironmentId,
    threadId: threadId as ThreadId,
  };
}

export function resolveToggleFaceAction(input: {
  pathname: string;
  /** Thread shown when the route is a chat thread. Must match `parseThreadPathname`. */
  activeThread: ToggleFaceThreadSummary | null;
  /** All threads; used when returning from a board to pick the project's last-visited thread. */
  allThreads: ReadonlyArray<ToggleFaceThreadSummary>;
}): ToggleFaceAction {
  const boardRoute = parseBoardPathname(input.pathname);
  if (boardRoute !== null) {
    const candidates = input.allThreads
      .filter((t) => t.archivedAt === null && t.projectId === boardRoute.projectId)
      .toSorted((a, b) => (b.lastVisitedAt ?? "").localeCompare(a.lastVisitedAt ?? ""));
    const best = candidates[0];
    if (best) {
      return {
        kind: "navigate-to-thread",
        environmentId: best.environmentId,
        threadId: best.id,
      };
    }
    return {
      kind: "create-new-thread",
      environmentId: boardRoute.environmentId,
      projectId: boardRoute.projectId,
    };
  }

  const threadRoute = parseThreadPathname(input.pathname);
  if (threadRoute !== null && input.activeThread !== null) {
    return {
      kind: "navigate-to-board",
      environmentId: input.activeThread.environmentId,
      projectId: input.activeThread.projectId,
    };
  }

  return { kind: "noop" };
}
