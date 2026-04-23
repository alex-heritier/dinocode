// dinocode-integration: dinocode-server projection_tasks repository service.
import {
  IsoDateTime,
  ProjectId,
  TaskId,
  TaskPriority,
  TaskStatus,
  TaskType,
} from "@t3tools/contracts";
import { Option, Schema, Context } from "effect";
import type { Effect } from "effect";

import type { ProjectionRepositoryError } from "../Errors.ts";

export const ProjectionTask = Schema.Struct({
  taskId: TaskId,
  projectId: ProjectId,
  slug: Schema.String,
  title: Schema.String,
  status: TaskStatus,
  type: TaskType,
  priority: TaskPriority,
  tags: Schema.String,
  createdAt: IsoDateTime,
  updatedAt: IsoDateTime,
  orderKey: Schema.String,
  parent: Schema.NullOr(TaskId),
  blocking: Schema.String,
  blockedBy: Schema.String,
  body: Schema.String,
  etag: Schema.String,
  archivedAt: Schema.NullOr(IsoDateTime),
});
export type ProjectionTask = typeof ProjectionTask.Type;

export interface ProjectionTaskRepositoryShape {
  readonly upsert: (task: ProjectionTask) => Effect.Effect<void, ProjectionRepositoryError>;
  readonly getById: (
    taskId: TaskId,
  ) => Effect.Effect<Option.Option<ProjectionTask>, ProjectionRepositoryError>;
  readonly listByProjectId: (
    projectId: ProjectId,
  ) => Effect.Effect<ReadonlyArray<ProjectionTask>, ProjectionRepositoryError>;
  readonly deleteById: (taskId: TaskId) => Effect.Effect<void, ProjectionRepositoryError>;
}

export class ProjectionTaskRepository extends Context.Service<
  ProjectionTaskRepository,
  ProjectionTaskRepositoryShape
>()("t3/persistence/Services/ProjectionTasks/ProjectionTaskRepository") {}
