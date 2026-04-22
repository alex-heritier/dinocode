import { Effect } from "effect";
import * as fs from "node:fs";
import * as path from "node:path";

import type { ProjectContext } from "./config.ts";
import type { TaskEvent } from "./decider.ts";
import { SoilEtagMismatchError, SoilFileNotFoundError, SoilValidationError } from "./errors.ts";
import { computeEtag } from "./etag.ts";
import { parseTaskFile } from "./parser.ts";
import { renderFilename, renderTaskDocument } from "./renderer.ts";
import type { TaskDocument } from "./schema.ts";

export interface SoilReactor {
  readonly apply: (
    events: ReadonlyArray<TaskEvent>,
  ) => Effect.Effect<void, SoilValidationError | SoilEtagMismatchError | SoilFileNotFoundError>;
  readonly readTask: (taskId: string) => Effect.Effect<TaskDocument | null, SoilValidationError>;
  readonly listTasks: () => Effect.Effect<ReadonlyArray<TaskDocument>, SoilValidationError>;
  readonly isIgnored: (absolutePath: string) => boolean;
}

export interface ReactorOptions {
  readonly context: ProjectContext;
  readonly archiveSubfolder?: string;
}

function ensureDir(dir: string): void {
  fs.mkdirSync(dir, { recursive: true });
}

function atomicWrite(filePath: string, content: string): void {
  ensureDir(path.dirname(filePath));
  const tmp = `${filePath}.${process.pid}.${Date.now()}.tmp`;
  fs.writeFileSync(tmp, content, "utf-8");
  fs.renameSync(tmp, filePath);
}

function findTaskFile(tasksDir: string, taskId: string, archiveDir: string): string | null {
  const candidates: string[] = [];
  if (fs.existsSync(tasksDir)) {
    for (const entry of fs.readdirSync(tasksDir)) {
      if (entry.endsWith(".md") && entry.startsWith(`${taskId}--`)) {
        candidates.push(path.join(tasksDir, entry));
      }
    }
  }
  if (fs.existsSync(archiveDir)) {
    for (const entry of fs.readdirSync(archiveDir)) {
      if (entry.endsWith(".md") && entry.startsWith(`${taskId}--`)) {
        candidates.push(path.join(archiveDir, entry));
      }
    }
  }
  return candidates[0] ?? null;
}

export function makeSoilReactor(options: ReactorOptions): SoilReactor {
  const { context } = options;
  const archiveSubfolder = options.archiveSubfolder ?? "archive";
  const tasksDir = context.tasksPath;
  const archiveDir = path.join(tasksDir, archiveSubfolder);

  const writeLocks = new Set<string>();

  function writeDocument(document: TaskDocument, targetDir: string): string {
    const absolute = path.join(targetDir, renderFilename(document));
    writeLocks.add(absolute);
    try {
      const rendered = renderTaskDocument(document);
      atomicWrite(absolute, rendered);
      return absolute;
    } finally {
      queueMicrotask(() => writeLocks.delete(absolute));
    }
  }

  function removeTaskFiles(taskId: string): void {
    const existing = findTaskFile(tasksDir, taskId, archiveDir);
    if (existing) {
      writeLocks.add(existing);
      queueMicrotask(() => writeLocks.delete(existing));
      try {
        fs.unlinkSync(existing);
      } catch {
        // file already gone
      }
    }
  }

  return {
    apply: (events) =>
      Effect.gen(function* () {
        for (const event of events) {
          switch (event.type) {
            case "task.created": {
              writeDocument(event.document, tasksDir);
              break;
            }
            case "task.updated": {
              const existingPath = findTaskFile(tasksDir, event.taskId, archiveDir);
              if (!existingPath) {
                return yield* new SoilFileNotFoundError({
                  message: `Cannot update task ${event.taskId}: file not found`,
                  path: tasksDir,
                });
              }
              const content = fs.readFileSync(existingPath, "utf-8");
              const parsed = yield* parseTaskFile(content, existingPath).pipe(
                Effect.catchTag("SoilParseError", (error) =>
                  Effect.fail(
                    new SoilValidationError({
                      message: error.message,
                      path: error.path ?? existingPath,
                    }),
                  ),
                ),
              );
              const patch = event.patch;
              const updated: TaskDocument = {
                ...parsed.document,
                ...(patch.title !== undefined ? { title: patch.title } : {}),
                ...(patch.status !== undefined ? { status: patch.status } : {}),
                ...(patch.type !== undefined ? { type: patch.type } : {}),
                ...(patch.priority !== undefined ? { priority: patch.priority } : {}),
                ...(patch.tags !== undefined ? { tags: patch.tags } : {}),
                ...(patch.order !== undefined ? { order: patch.order } : {}),
                ...(patch.parent !== undefined ? { parent: patch.parent } : {}),
                ...(patch.blocking !== undefined ? { blocking: patch.blocking } : {}),
                ...(patch.blockedBy !== undefined ? { blockedBy: patch.blockedBy } : {}),
                ...(patch.body !== undefined ? { body: patch.body } : {}),
                ...(patch.slug !== undefined ? { slug: patch.slug } : {}),
                updatedAt: new Date().toISOString(),
              };
              const targetDir = path.dirname(existingPath);
              const newPath = path.join(targetDir, renderFilename(updated));
              writeDocument(updated, targetDir);
              if (newPath !== existingPath) {
                writeLocks.add(existingPath);
                queueMicrotask(() => writeLocks.delete(existingPath));
                try {
                  fs.unlinkSync(existingPath);
                } catch {
                  // already renamed
                }
              }
              break;
            }
            case "task.deleted": {
              removeTaskFiles(event.taskId);
              break;
            }
            case "task.archived": {
              const existingPath = findTaskFile(tasksDir, event.taskId, archiveDir);
              if (!existingPath) break;
              if (path.dirname(existingPath) === archiveDir) break;
              ensureDir(archiveDir);
              const filename = path.basename(existingPath);
              const destination = path.join(archiveDir, filename);
              writeLocks.add(existingPath);
              writeLocks.add(destination);
              queueMicrotask(() => {
                writeLocks.delete(existingPath);
                writeLocks.delete(destination);
              });
              fs.renameSync(existingPath, destination);
              break;
            }
            case "task.unarchived": {
              const existingPath = findTaskFile(tasksDir, event.taskId, archiveDir);
              if (!existingPath) break;
              if (path.dirname(existingPath) !== archiveDir) break;
              ensureDir(tasksDir);
              const filename = path.basename(existingPath);
              const destination = path.join(tasksDir, filename);
              writeLocks.add(existingPath);
              writeLocks.add(destination);
              queueMicrotask(() => {
                writeLocks.delete(existingPath);
                writeLocks.delete(destination);
              });
              fs.renameSync(existingPath, destination);
              break;
            }
          }
        }
      }),

    readTask: (taskId) =>
      Effect.gen(function* () {
        const filePath = findTaskFile(tasksDir, taskId, archiveDir);
        if (!filePath) return null;
        const content = fs.readFileSync(filePath, "utf-8");
        const parsed = yield* parseTaskFile(content, filePath).pipe(
          Effect.catchTag("SoilParseError", (error) =>
            Effect.fail(
              new SoilValidationError({ message: error.message, path: error.path ?? filePath }),
            ),
          ),
        );
        return parsed.document;
      }),

    listTasks: () =>
      Effect.gen(function* () {
        const results: TaskDocument[] = [];
        const dirs = [tasksDir, archiveDir];
        for (const dir of dirs) {
          if (!fs.existsSync(dir)) continue;
          for (const entry of fs.readdirSync(dir)) {
            if (!entry.endsWith(".md")) continue;
            const filePath = path.join(dir, entry);
            const stat = fs.statSync(filePath);
            if (!stat.isFile()) continue;
            const content = fs.readFileSync(filePath, "utf-8");
            const parsed = yield* parseTaskFile(content, filePath).pipe(
              Effect.catchTag("SoilParseError", () => Effect.succeed(null)),
            );
            if (parsed) results.push(parsed.document);
          }
        }
        return results;
      }),

    isIgnored: (absolutePath) => writeLocks.has(absolutePath),
  };
}

export function computeTaskEtag(document: TaskDocument): string {
  return computeEtag(renderTaskDocument(document));
}
