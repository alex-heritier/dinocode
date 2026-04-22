import type { TaskDocument, TaskPriority, TaskStatus, TaskType } from "./schema.ts";

export interface TaskFilter {
  readonly status?: ReadonlyArray<TaskStatus>;
  readonly type?: ReadonlyArray<TaskType>;
  readonly priority?: ReadonlyArray<TaskPriority>;
  readonly tags?: ReadonlyArray<string>;
  readonly parent?: string | null;
  readonly excludeStatus?: ReadonlyArray<TaskStatus>;
  readonly search?: string;
  readonly isBlocked?: boolean;
}

export interface TaskSortOptions {
  readonly by?: "order" | "createdAt" | "updatedAt" | "priority" | "title";
  readonly direction?: "asc" | "desc";
}

const PRIORITY_RANK: Record<TaskPriority, number> = {
  critical: 0,
  high: 1,
  normal: 2,
  low: 3,
  deferred: 4,
};

function matchesText(task: TaskDocument, search: string): boolean {
  const haystack = `${task.title} ${task.body} ${task.tags.join(" ")}`.toLowerCase();
  return haystack.includes(search.toLowerCase());
}

function isBlocked(task: TaskDocument, allTasks: ReadonlyArray<TaskDocument>): boolean {
  if (task.blockedBy.length === 0) return false;
  const byId = new Map(allTasks.map((t) => [t.id, t]));
  return task.blockedBy.some((id) => {
    const blocker = byId.get(id);
    if (!blocker) return false;
    return blocker.status !== "completed" && blocker.status !== "scrapped";
  });
}

export function filterTasks(
  tasks: ReadonlyArray<TaskDocument>,
  filter: TaskFilter,
): ReadonlyArray<TaskDocument> {
  return tasks.filter((task) => {
    if (filter.status && !filter.status.includes(task.status)) return false;
    if (filter.excludeStatus && filter.excludeStatus.includes(task.status)) return false;
    if (filter.type && !filter.type.includes(task.type)) return false;
    if (filter.priority && !filter.priority.includes(task.priority)) return false;
    if (filter.tags && filter.tags.length > 0) {
      const taskTags = new Set(task.tags);
      if (!filter.tags.every((t) => taskTags.has(t))) return false;
    }
    if (filter.parent !== undefined) {
      const taskParent = task.parent ?? null;
      if (taskParent !== filter.parent) return false;
    }
    if (filter.search && !matchesText(task, filter.search)) return false;
    if (filter.isBlocked !== undefined) {
      const blocked = isBlocked(task, tasks);
      if (blocked !== filter.isBlocked) return false;
    }
    return true;
  });
}

export function sortTasks(
  tasks: ReadonlyArray<TaskDocument>,
  options: TaskSortOptions = {},
): ReadonlyArray<TaskDocument> {
  const by = options.by ?? "order";
  const direction = options.direction ?? "asc";
  const sign = direction === "asc" ? 1 : -1;
  const sorted = [...tasks].sort((a, b) => {
    switch (by) {
      case "order":
        return sign * a.order.localeCompare(b.order);
      case "createdAt":
        return sign * a.createdAt.localeCompare(b.createdAt);
      case "updatedAt":
        return sign * a.updatedAt.localeCompare(b.updatedAt);
      case "priority":
        return sign * (PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority]);
      case "title":
        return sign * a.title.localeCompare(b.title);
    }
  });
  return sorted;
}

export function readyTasks(tasks: ReadonlyArray<TaskDocument>): ReadonlyArray<TaskDocument> {
  return filterTasks(tasks, {
    excludeStatus: ["in-progress", "completed", "scrapped", "draft"],
    isBlocked: false,
  });
}
