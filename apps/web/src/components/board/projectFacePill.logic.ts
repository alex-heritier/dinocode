// dinocode-integration: pure view-model helpers for the sidebar face pill.
// Kept separate from React so the behavior is covered by a unit test and so
// the module can move to `packages/dinocode-board` with no React deps.

import type { EnvironmentId, ProjectId, ThreadId } from "@t3tools/contracts";

export interface ProjectFacePillThread {
  readonly environmentId: EnvironmentId;
  readonly id: ThreadId;
  readonly archivedAt: string | null;
  /** ISO timestamp, or null when never visited. Lexicographic order works for ISO. */
  readonly lastVisitedAt: string | null;
}

export interface ProjectFacePillMember {
  readonly environmentId: EnvironmentId;
  readonly id: ProjectId;
}

export interface ProjectFacePillViewModel {
  readonly primary: ProjectFacePillMember;
  readonly lastVisitedThreadId: ThreadId | null;
  /** Environment of the most-recently-visited thread (falls back to primary). */
  readonly chatEnvironmentId: EnvironmentId;
  readonly openThreadCount: number;
  readonly isBoardActive: boolean;
}

/** Non-empty list of project members + current route pathname → UI inputs. */
export function resolveProjectFacePillViewModel(input: {
  members: ReadonlyArray<ProjectFacePillMember>;
  threads: ReadonlyArray<ProjectFacePillThread>;
  pathname: string;
}): ProjectFacePillViewModel | null {
  if (input.members.length === 0) return null;
  const primary = input.members[0]!;

  const openThreads = input.threads.filter((t) => t.archivedAt === null);

  let best: ProjectFacePillThread | null = null;
  for (const thread of openThreads) {
    if (best === null) {
      best = thread;
      continue;
    }
    const a = thread.lastVisitedAt ?? "";
    const b = best.lastVisitedAt ?? "";
    if (a > b) best = thread;
  }
  const fallback = best === null && openThreads.length > 0 ? openThreads[0]! : null;
  const chosen = best ?? fallback;

  const boardPaths = new Set(input.members.map((m) => `/board/${m.environmentId}/${m.id}`));

  return {
    primary,
    lastVisitedThreadId: chosen?.id ?? null,
    chatEnvironmentId: chosen?.environmentId ?? primary.environmentId,
    openThreadCount: openThreads.length,
    isBoardActive: boardPaths.has(input.pathname),
  };
}
