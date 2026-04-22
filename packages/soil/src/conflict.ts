import type { TaskDocument } from "./schema.ts";
import { computeEtag } from "./etag.ts";
import { renderTaskDocument } from "./renderer.ts";

export interface ConflictResult {
  readonly hasConflict: boolean;
  readonly expected: string;
  readonly actual: string;
}

export function detectEtagConflict(
  expectedEtag: string | undefined,
  actualDocument: TaskDocument,
): ConflictResult {
  const actual = computeEtag(renderTaskDocument(actualDocument));
  if (expectedEtag === undefined) {
    return { hasConflict: false, expected: actual, actual };
  }
  return {
    hasConflict: expectedEtag !== actual,
    expected: expectedEtag,
    actual,
  };
}

export interface ThreeWayMergeInput {
  readonly base: TaskDocument;
  readonly local: TaskDocument;
  readonly remote: TaskDocument;
}

export interface ThreeWayMergeResult {
  readonly merged: TaskDocument;
  readonly conflicts: ReadonlyArray<MergeConflict>;
}

export interface MergeConflict {
  readonly field: keyof TaskDocument;
  readonly base: unknown;
  readonly local: unknown;
  readonly remote: unknown;
}

function mergeField<K extends keyof TaskDocument>(
  base: TaskDocument,
  local: TaskDocument,
  remote: TaskDocument,
  key: K,
  conflicts: MergeConflict[],
): TaskDocument[K] {
  const baseV = base[key];
  const localV = local[key];
  const remoteV = remote[key];
  const baseStr = JSON.stringify(baseV);
  const localStr = JSON.stringify(localV);
  const remoteStr = JSON.stringify(remoteV);
  if (localStr === remoteStr) return localV;
  if (baseStr === localStr) return remoteV;
  if (baseStr === remoteStr) return localV;
  conflicts.push({ field: key, base: baseV, local: localV, remote: remoteV });
  return localV;
}

export function threeWayMerge(input: ThreeWayMergeInput): ThreeWayMergeResult {
  const { base, local, remote } = input;
  const conflicts: MergeConflict[] = [];
  const merged: TaskDocument = {
    id: local.id,
    slug: mergeField(base, local, remote, "slug", conflicts),
    title: mergeField(base, local, remote, "title", conflicts),
    status: mergeField(base, local, remote, "status", conflicts),
    type: mergeField(base, local, remote, "type", conflicts),
    priority: mergeField(base, local, remote, "priority", conflicts),
    tags: mergeField(base, local, remote, "tags", conflicts),
    createdAt: base.createdAt,
    updatedAt: new Date().toISOString(),
    order: mergeField(base, local, remote, "order", conflicts),
    parent: mergeField(base, local, remote, "parent", conflicts),
    blocking: mergeField(base, local, remote, "blocking", conflicts),
    blockedBy: mergeField(base, local, remote, "blockedBy", conflicts),
    body: mergeField(base, local, remote, "body", conflicts),
  };
  return { merged, conflicts };
}
