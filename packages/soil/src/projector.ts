import { computeEtag } from "./etag.ts";
import { renderTaskDocument } from "./renderer.ts";
import type { TaskDocument, TaskState } from "./schema.ts";
import type { TaskEvent } from "./decider.ts";

export function createEmptyTaskState(): Record<string, TaskState> {
  return {};
}

function documentToState(document: TaskDocument): TaskState {
  const rendered = renderTaskDocument(document);
  return {
    id: document.id,
    slug: document.slug,
    title: document.title,
    status: document.status,
    type: document.type,
    priority: document.priority,
    tags: document.tags,
    createdAt: document.createdAt,
    updatedAt: document.updatedAt,
    order: document.order,
    parent: document.parent ?? null,
    blocking: document.blocking,
    blockedBy: document.blockedBy,
    body: document.body,
    etag: computeEtag(rendered),
  };
}

export function projectTaskEvent(
  state: Record<string, TaskState>,
  event: TaskEvent,
): Record<string, TaskState> {
  const next: Record<string, TaskState> = { ...state };
  switch (event.type) {
    case "task.created": {
      next[event.taskId] = documentToState(event.document);
      break;
    }
    case "task.updated": {
      const existing = next[event.taskId];
      if (!existing) break;
      const patch = event.patch;
      const updated: TaskDocument = {
        id: existing.id,
        slug: existing.slug,
        title: patch.title ?? existing.title,
        status: patch.status ?? existing.status,
        type: patch.type ?? existing.type,
        priority: patch.priority ?? existing.priority,
        tags: patch.tags ?? existing.tags,
        createdAt: existing.createdAt,
        updatedAt: new Date().toISOString(),
        order: patch.order ?? existing.order,
        parent: patch.parent !== undefined ? patch.parent : existing.parent,
        blocking: patch.blocking ?? existing.blocking,
        blockedBy: patch.blockedBy ?? existing.blockedBy,
        body: patch.body ?? existing.body,
      };
      next[event.taskId] = documentToState(updated);
      break;
    }
    case "task.deleted": {
      delete next[event.taskId];
      break;
    }
    case "task.archived": {
      const existing = next[event.taskId];
      if (existing) {
        next[event.taskId] = documentToState({ ...existing, status: "completed" });
      }
      break;
    }
    case "task.unarchived": {
      // noop - unarchive just moves file back
      break;
    }
  }
  return next;
}
