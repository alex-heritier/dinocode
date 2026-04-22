import { Schema } from "effect";

export const TaskStatus = Schema.Literals([
  "in-progress",
  "todo",
  "draft",
  "completed",
  "scrapped",
]);
export type TaskStatus = typeof TaskStatus.Type;

export const TaskType = Schema.Literals(["milestone", "epic", "bug", "feature", "task"]);
export type TaskType = typeof TaskType.Type;

export const TaskPriority = Schema.Literals(["critical", "high", "normal", "low", "deferred"]);
export type TaskPriority = typeof TaskPriority.Type;

export const TaskId = Schema.String.pipe(
  Schema.check(Schema.isPattern(/^([a-z0-9]+-)+[a-zA-Z0-9_-]+$/)),
);
export type TaskId = typeof TaskId.Type;

export const Tag = Schema.String.pipe(
  Schema.check(Schema.isPattern(/^[a-z][a-z0-9-]*$/)),
  Schema.check(Schema.isMaxLength(64)),
);
export type Tag = typeof Tag.Type;

export const FractionalIndex = Schema.String.pipe(Schema.check(Schema.isPattern(/^[A-Za-z0-9]+$/)));
export type FractionalIndex = typeof FractionalIndex.Type;

export const TaskDocument = Schema.Struct({
  id: TaskId,
  slug: Schema.String,
  title: Schema.String.pipe(
    Schema.check(Schema.isMinLength(1)),
    Schema.check(Schema.isMaxLength(512)),
  ),
  status: TaskStatus,
  type: TaskType,
  priority: TaskPriority,
  tags: Schema.Array(Tag),
  createdAt: Schema.String,
  updatedAt: Schema.String,
  order: FractionalIndex,
  parent: Schema.optional(Schema.NullOr(TaskId)),
  blocking: Schema.Array(TaskId),
  blockedBy: Schema.Array(TaskId),
  body: Schema.String,
});
export type TaskDocument = typeof TaskDocument.Type;

export const TaskState = Schema.Struct({
  id: TaskId,
  slug: Schema.String,
  title: Schema.String,
  status: TaskStatus,
  type: TaskType,
  priority: TaskPriority,
  tags: Schema.Array(Tag),
  createdAt: Schema.String,
  updatedAt: Schema.String,
  order: FractionalIndex,
  parent: Schema.NullOr(TaskId),
  blocking: Schema.Array(TaskId),
  blockedBy: Schema.Array(TaskId),
  body: Schema.String,
  etag: Schema.String,
});
export type TaskState = typeof TaskState.Type;

export const TaskPatch = Schema.Struct({
  id: Schema.optional(TaskId),
  slug: Schema.optional(Schema.String),
  title: Schema.optional(
    Schema.String.pipe(Schema.check(Schema.isMinLength(1)), Schema.check(Schema.isMaxLength(512))),
  ),
  status: Schema.optional(TaskStatus),
  type: Schema.optional(TaskType),
  priority: Schema.optional(TaskPriority),
  tags: Schema.optional(Schema.Array(Tag)),
  createdAt: Schema.optional(Schema.String),
  updatedAt: Schema.optional(Schema.String),
  order: Schema.optional(FractionalIndex),
  parent: Schema.optional(Schema.NullOr(TaskId)),
  blocking: Schema.optional(Schema.Array(TaskId)),
  blockedBy: Schema.optional(Schema.Array(TaskId)),
  body: Schema.optional(Schema.String),
});
export type TaskPatch = typeof TaskPatch.Type;

export const ProjectConfig = Schema.Struct({
  project: Schema.optional(
    Schema.Struct({
      name: Schema.optional(Schema.String),
    }),
  ),
  tasks: Schema.optional(
    Schema.Struct({
      path: Schema.optional(Schema.String),
      prefix: Schema.optional(Schema.String),
      idLength: Schema.optional(Schema.Number),
      defaultStatus: Schema.optional(TaskStatus),
      defaultType: Schema.optional(TaskType),
    }),
  ),
});
export type ProjectConfig = typeof ProjectConfig.Type;
