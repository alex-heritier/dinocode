// dinocode-integration: dinocode-server projection_tasks SQLite table.
import * as SqlClient from "effect/unstable/sql/SqlClient";
import * as Effect from "effect/Effect";

export default Effect.gen(function* () {
  const sql = yield* SqlClient.SqlClient;

  yield* sql`
    CREATE TABLE IF NOT EXISTS projection_tasks (
      task_id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL,
      slug TEXT NOT NULL,
      title TEXT NOT NULL,
      status TEXT NOT NULL,
      type TEXT NOT NULL,
      priority TEXT NOT NULL DEFAULT 'normal',
      tags TEXT NOT NULL DEFAULT '[]',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      order_key TEXT NOT NULL DEFAULT 'a',
      parent TEXT,
      blocking TEXT NOT NULL DEFAULT '[]',
      blocked_by TEXT NOT NULL DEFAULT '[]',
      body TEXT NOT NULL DEFAULT '',
      etag TEXT NOT NULL,
      archived_at TEXT
    )
  `;

  yield* sql`CREATE INDEX IF NOT EXISTS idx_projection_tasks_project_id ON projection_tasks(project_id)`;
  yield* sql`CREATE INDEX IF NOT EXISTS idx_projection_tasks_status ON projection_tasks(status)`;
  yield* sql`CREATE INDEX IF NOT EXISTS idx_projection_tasks_archived_at ON projection_tasks(archived_at)`;
});
