import * as SqlClient from "effect/unstable/sql/SqlClient";
import * as SqlSchema from "effect/unstable/sql/SqlSchema";
import { Effect, Layer } from "effect";

import { toPersistenceSqlError } from "../Errors.ts";
import {
  ProjectionTask,
  ProjectionTaskRepository,
  type ProjectionTaskRepositoryShape,
} from "../Services/ProjectionTasks.ts";

const makeProjectionTaskRepository = Effect.gen(function* () {
  const sql = yield* SqlClient.SqlClient;

  const upsertProjectionTaskRow = SqlSchema.void({
    Request: ProjectionTask,
    execute: (row) =>
      sql`
        INSERT INTO projection_tasks (
          task_id, project_id, slug, title, status, type, priority,
          tags, created_at, updated_at, order_key, parent,
          blocking, blocked_by, body, etag, archived_at
        )
        VALUES (
          ${row.taskId}, ${row.projectId}, ${row.slug}, ${row.title},
          ${row.status}, ${row.type}, ${row.priority},
          ${row.tags}, ${row.createdAt}, ${row.updatedAt}, ${row.orderKey},
          ${row.parent}, ${row.blocking}, ${row.blockedBy},
          ${row.body}, ${row.etag}, ${row.archivedAt}
        )
        ON CONFLICT (task_id)
        DO UPDATE SET
          project_id = excluded.project_id,
          slug = excluded.slug,
          title = excluded.title,
          status = excluded.status,
          type = excluded.type,
          priority = excluded.priority,
          tags = excluded.tags,
          created_at = excluded.created_at,
          updated_at = excluded.updated_at,
          order_key = excluded.order_key,
          parent = excluded.parent,
          blocking = excluded.blocking,
          blocked_by = excluded.blocked_by,
          body = excluded.body,
          etag = excluded.etag,
          archived_at = excluded.archived_at
      `,
  });

  const getProjectionTaskRow = SqlSchema.findOneOption({
    Request: ProjectionTask.fields.taskId,
    Result: ProjectionTask,
    execute: (taskId) =>
      sql`
        SELECT
          task_id AS "taskId", project_id AS "projectId", slug, title,
          status, type, priority, tags, created_at AS "createdAt",
          updated_at AS "updatedAt", order_key AS "orderKey", parent,
          blocking, blocked_by AS "blockedBy", body, etag, archived_at AS "archivedAt"
        FROM projection_tasks
        WHERE task_id = ${taskId}
      `,
  });

  const listProjectionTaskRows = SqlSchema.findAll({
    Request: ProjectionTask.fields.projectId,
    Result: ProjectionTask,
    execute: (projectId) =>
      sql`
        SELECT
          task_id AS "taskId", project_id AS "projectId", slug, title,
          status, type, priority, tags, created_at AS "createdAt",
          updated_at AS "updatedAt", order_key AS "orderKey", parent,
          blocking, blocked_by AS "blockedBy", body, etag, archived_at AS "archivedAt"
        FROM projection_tasks
        WHERE project_id = ${projectId}
          AND archived_at IS NULL
        ORDER BY order_key ASC, created_at ASC
      `,
  });

  const deleteProjectionTaskRow = SqlSchema.void({
    Request: ProjectionTask.fields.taskId,
    execute: (taskId) =>
      sql`
        DELETE FROM projection_tasks
        WHERE task_id = ${taskId}
      `,
  });

  const upsert: ProjectionTaskRepositoryShape["upsert"] = (row) =>
    upsertProjectionTaskRow(row).pipe(
      Effect.mapError(toPersistenceSqlError("ProjectionTaskRepository.upsert:query")),
    );

  const getById: ProjectionTaskRepositoryShape["getById"] = (taskId) =>
    getProjectionTaskRow(taskId).pipe(
      Effect.mapError(toPersistenceSqlError("ProjectionTaskRepository.getById:query")),
    );

  const listByProjectId: ProjectionTaskRepositoryShape["listByProjectId"] = (projectId) =>
    listProjectionTaskRows(projectId).pipe(
      Effect.mapError(toPersistenceSqlError("ProjectionTaskRepository.listByProjectId:query")),
    );

  const deleteById: ProjectionTaskRepositoryShape["deleteById"] = (taskId) =>
    deleteProjectionTaskRow(taskId).pipe(
      Effect.mapError(toPersistenceSqlError("ProjectionTaskRepository.deleteById:query")),
    );

  return {
    upsert,
    getById,
    listByProjectId,
    deleteById,
  } satisfies ProjectionTaskRepositoryShape;
});

export const ProjectionTaskRepositoryLive = Layer.effect(
  ProjectionTaskRepository,
  makeProjectionTaskRepository,
);
