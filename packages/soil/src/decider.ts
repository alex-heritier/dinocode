import { Effect } from "effect";

import { SoilValidationError } from "./errors.ts";
import { keyBetween } from "./fractionalIndex.ts";
import { generateSlug, generateTaskId } from "./id.ts";
import type {
  TaskDocument,
  TaskPatch,
  TaskPriority,
  TaskState,
  TaskStatus,
  TaskType,
} from "./schema.ts";

export interface TaskCommandCreate {
  readonly type: "task.create";
  readonly projectId: string;
  readonly title: string;
  readonly status?: TaskStatus;
  readonly slug?: string;
  readonly taskType?: TaskType;
  readonly priority?: TaskPriority;
  readonly tags?: readonly string[];
  readonly body?: string;
  readonly parent?: string | null;
  readonly blocking?: readonly string[];
  readonly blockedBy?: readonly string[];
}

export interface TaskCommandUpdate {
  readonly type: "task.update";
  readonly taskId: string;
  readonly expectedEtag?: string;
  readonly patch: TaskPatch;
}

export interface TaskCommandDelete {
  readonly type: "task.delete";
  readonly taskId: string;
}

export interface TaskCommandArchive {
  readonly type: "task.archive";
  readonly taskId: string;
}

export interface TaskCommandUnarchive {
  readonly type: "task.unarchive";
  readonly taskId: string;
}

export type TaskCommand =
  | TaskCommandCreate
  | TaskCommandUpdate
  | TaskCommandDelete
  | TaskCommandArchive
  | TaskCommandUnarchive;

export interface TaskEventCreated {
  readonly type: "task.created";
  readonly taskId: string;
  readonly document: TaskDocument;
}

export interface TaskEventUpdated {
  readonly type: "task.updated";
  readonly taskId: string;
  readonly patch: TaskPatch;
}

export interface TaskEventDeleted {
  readonly type: "task.deleted";
  readonly taskId: string;
}

export interface TaskEventArchived {
  readonly type: "task.archived";
  readonly taskId: string;
}

export interface TaskEventUnarchived {
  readonly type: "task.unarchived";
  readonly taskId: string;
}

export type TaskEvent =
  | TaskEventCreated
  | TaskEventUpdated
  | TaskEventDeleted
  | TaskEventArchived
  | TaskEventUnarchived;

export function decideTaskCommand(
  state: Record<string, TaskState>,
  command: TaskCommand,
): Effect.Effect<ReadonlyArray<TaskEvent>, SoilValidationError> {
  return Effect.gen(function* () {
    switch (command.type) {
      case "task.create": {
        const id = generateTaskId("dnc-");
        const slug = command.slug ?? generateSlug(command.title);
        const now = new Date().toISOString();
        const document: TaskDocument = {
          id,
          slug,
          title: command.title,
          status: command.status ?? "todo",
          type: command.taskType ?? "task",
          priority: command.priority ?? "normal",
          tags: command.tags ? [...command.tags] : [],
          createdAt: now,
          updatedAt: now,
          order: keyBetween(null, null),
          parent: command.parent ?? null,
          blocking: command.blocking ? [...command.blocking] : [],
          blockedBy: command.blockedBy ? [...command.blockedBy] : [],
          body: command.body ?? "",
        };
        return [{ type: "task.created", taskId: id, document }];
      }

      case "task.update": {
        const existing = state[command.taskId];
        if (!existing) {
          return yield* new SoilValidationError({
            message: `Task ${command.taskId} not found`,
          });
        }
        if (command.expectedEtag !== undefined && command.expectedEtag !== existing.etag) {
          return yield* new SoilValidationError({
            message: `ETag mismatch for task ${command.taskId}`,
          });
        }
        return [{ type: "task.updated", taskId: command.taskId, patch: command.patch }];
      }

      case "task.delete": {
        const existing = state[command.taskId];
        if (!existing) {
          return yield* new SoilValidationError({
            message: `Task ${command.taskId} not found`,
          });
        }
        return [{ type: "task.deleted", taskId: command.taskId }];
      }

      case "task.archive": {
        const existing = state[command.taskId];
        if (!existing) {
          return yield* new SoilValidationError({
            message: `Task ${command.taskId} not found`,
          });
        }
        if (existing.status === "completed" || existing.status === "scrapped") {
          return [{ type: "task.archived", taskId: command.taskId }];
        }
        return yield* new SoilValidationError({
          message: `Cannot archive task ${command.taskId}: must be completed or scrapped first`,
        });
      }

      case "task.unarchive": {
        const existing = state[command.taskId];
        if (!existing) {
          return yield* new SoilValidationError({
            message: `Task ${command.taskId} not found`,
          });
        }
        return [{ type: "task.unarchived", taskId: command.taskId }];
      }
    }
  });
}
